import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ============================================================
// Grafana -> Supabase Water Daily Consumption Sync
// ============================================================
// Fetches water meter readings from a Grafana snapshot and
// updates the water_daily_consumption table in Supabase.
//
// TRIGGER OPTIONS:
//   1. Manual: POST with { "snapshot_key": "..." }
//   2. Cron: pg_cron calls with fixed snapshot_key
//   3. n8n: HTTP Request node calls this endpoint
//
// REQUEST BODY:
//   { "snapshot_key": "p3NKnjgpLaI..." }        (required)
//   { "snapshot_key": "...", "bill_month": "032026" } (optional override)
//
// ------------------------------------------------------------
// IMPORTANT PIPELINE NOTES (see PROJECT_STATUS.md §3):
//   * This function only `.update()`s meters in TRACKED_ACCOUNTS below, and
//     only for the days the Grafana snapshot returns. It never INSERTs rows and
//     never writes 0 — rows are pre-seeded elsewhere at month start.
//   * Meters NOT in this set (all direct connections except Sales Center
//     4300295 — the camps, hotel, security, ROP, community/STP, main entrance
//     and the TSE irrigation controllers) are read manually and loaded via the
//     CSV uploader; they are NOT on the Grafana feed and will keep their seeded
//     values here.
//   * Because the monthly seed fills day cells with 0 (not NULL), any meter this
//     function does not overwrite shows as a real 0.00 in the Daily report. The
//     seed should use NULL for un-read days; see
//     sql/migrations/20260719_daily_missing_zero_to_null.sql.
// ============================================================

const MONTH_MAP: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
};

// 153 tracked meter account numbers
const TRACKED_ACCOUNTS = new Set([
  '4300296','4300298','4300300','4300301','4300302','4300303','4300304','4300305',
  '4300306','4300307','4300308','4300309','4300310','4300324','4300325','4300337',
  '4300339','4300346',
  '4300002','4300005','4300038','4300044','4300049','4300050','4300052','4300075',
  '4300079','4300081','4300082','4300084','4300085','4300086','4300087','4300089',
  '4300091','4300093','4300095','4300097','4300101','4300176','4300177','4300178',
  '4300179','4300180','4300181','4300182','4300183','4300184','4300185','4300343',
  '4300009','4300020','4300025','4300057','4300060','4300076','4300077','4300078',
  '4300080','4300083','4300088','4300090','4300092','4300094','4300096','4300098',
  '4300099','4300100','4300102','4300103','4300104','4300105','4300186','4300187',
  '4300311','4300312','4300313','4300314','4300315','4300316','4300317','4300318',
  '4300319','4300320','4300344',
  '4300001','4300058','4300059','4300146','4300147','4300148','4300149','4300150',
  '4300151','4300152','4300153','4300154','4300155','4300156','4300157','4300158',
  '4300159','4300160','4300161','4300162','4300163','4300164','4300165','4300166',
  '4300167','4300168','4300169','4300170','4300171','4300172','4300173','4300174',
  '4300175','4300321','4300345',
  '4300023','4300024','4300188','4300189','4300190','4300191','4300192','4300193',
  '4300194','4300195','4300196','4300197','4300198','4300199','4300200','4300287',
  '4300288','4300289','4300290','4300291','4300292','4300293','4300342',
  '4300295','4300328',
  '4300326','4300327','4300329','4300330','4300331','4300332','4300333','4300335'
]);

function parseBillMonth(bm: string): { month: string; year: number } {
  const mm = bm.substring(0, 2);
  const yyyy = bm.substring(2);
  const monthName = MONTH_MAP[mm] || 'Jan';
  const shortYear = yyyy.substring(2);
  return { month: `${monthName}-${shortYear}`, year: parseInt(yyyy) };
}

Deno.serve(async (req: Request) => {
  try {
    // -- 1. Parse request --
    const body = await req.json().catch(() => ({}));
    const snapshotKey = body.snapshot_key;
    if (!snapshotKey) {
      return new Response(JSON.stringify({
        error: 'Missing snapshot_key in request body',
        usage: 'POST with { "snapshot_key": "your_grafana_snapshot_key" }'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // -- 2. Fetch Grafana snapshot API --
    const grafanaUrl = `https://snapshots.raintank.io/api/snapshots/${snapshotKey}`;
    console.log(`Fetching: ${grafanaUrl}`);

    const grafanaResp = await fetch(grafanaUrl);
    if (!grafanaResp.ok) {
      return new Response(JSON.stringify({
        error: `Grafana fetch failed: ${grafanaResp.status}`
      }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }
    const snapshot = await grafanaResp.json();

    // -- 3. Extract table panel data --
    const panels = snapshot.dashboard?.panels || [];
    const tablePanel = panels.find((p: any) => p.type === 'table');
    if (!tablePanel?.snapshotData?.[0]) {
      return new Response(JSON.stringify({
        error: 'No table panel found in snapshot'
      }), { status: 422, headers: { 'Content-Type': 'application/json' } });
    }

    const fields = tablePanel.snapshotData[0].fields;
    const rowCount = fields[0].values.length;

    // Build field name -> index map
    const fi: Record<string, number> = {};
    fields.forEach((f: any, i: number) => { fi[f.name] = i; });

    // -- 4. Determine bill month --
    const billMonthRaw = body.bill_month || String(fields[fi['READING_MNTH']]?.values?.[0] || '');
    if (!billMonthRaw) {
      return new Response(JSON.stringify({ error: 'Cannot determine bill month' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } });
    }
    const { month, year } = parseBillMonth(billMonthRaw);
    console.log(`Bill month: ${month}, Year: ${year}`);

    // -- 5. Extract meter readings --
    const meterUpdates: Array<{ acct: string; days: Record<string, number> }> = [];
    let maxDay = 0;

    for (let i = 0; i < rowCount; i++) {
      const acct = String(fields[fi['ACCOUNT_NUMBER']].values[i]);
      if (!TRACKED_ACCOUNTS.has(acct)) continue;

      const days: Record<string, number> = {};
      for (let d = 1; d <= 31; d++) {
        const dayKey = d.toString().padStart(2, '0');
        const idx = fi[dayKey];
        if (idx === undefined) continue;
        const val = fields[idx].values[i];
        if (val !== null && val !== undefined) {
          days[`day_${d}`] = Number(val);
          if (Number(val) > 0) maxDay = Math.max(maxDay, d);
        }
      }
      if (Object.keys(days).length > 0) {
        meterUpdates.push({ acct, days });
      }
    }

    console.log(`Found ${meterUpdates.length} meters, data up to day ${maxDay}`);

    // -- 6. Update Supabase using client --
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let updatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Update each meter individually (reliable approach)
    for (const meter of meterUpdates) {
      const updateData: Record<string, any> = { ...meter.days, updated_at: new Date().toISOString() };

      const { error } = await supabase
        .from('water_daily_consumption')
        .update(updateData)
        .eq('account_number', meter.acct)
        .eq('month', month)
        .eq('year', year);

      if (error) {
        errorCount++;
        errors.push(`${meter.acct}: ${error.message}`);
      } else {
        updatedCount++;
      }
    }

    // -- 7. Summary --
    const missing = Array.from(TRACKED_ACCOUNTS).filter(
      a => !meterUpdates.find(m => m.acct === a)
    );

    const summary = {
      success: errorCount === 0,
      bill_month: `${month} ${year}`,
      snapshot_key: snapshotKey,
      total_in_snapshot: rowCount,
      tracked_meters: TRACKED_ACCOUNTS.size,
      found_in_snapshot: meterUpdates.length,
      updated_successfully: updatedCount,
      update_errors: errorCount,
      latest_day_with_data: maxDay,
      missing_from_snapshot: missing.length > 0 ? missing : 'none',
      errors: errors.length > 0 ? errors : undefined,
      synced_at: new Date().toISOString()
    };

    console.log('Sync complete:', JSON.stringify(summary));
    return new Response(JSON.stringify(summary, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({
      error: `Unexpected: ${(err as Error).message}`
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
