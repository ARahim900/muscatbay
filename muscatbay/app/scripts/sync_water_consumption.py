#!/usr/bin/env python3
"""
Grafana (NEC Oman) → Supabase water_daily_consumption sync.

Reads daily water meter readings for all 337 tracked accounts from Grafana's
MSSQL datasource and PATCHes each row in Supabase.

Environment variables (required):
  GRAFANA_URL       https://grafana.nec-oman.com
  GRAFANA_USER      aalbalushi@muscatbay.com
  GRAFANA_PASS      (Grafana password)
  GRAFANA_ORG_ID    7
  GRAFANA_DS_UID    esu8hjVHk
  SUPABASE_URL      https://utnlgeuqajmwibqmdmgt.supabase.co
  SUPABASE_SERVICE_KEY  (service_role JWT)

Optional:
  BILL_MONTH        MMYYYY override (e.g. 052026). Defaults to previous calendar month.
"""

import os
import sys
import json
import calendar
import datetime
import urllib.request
import urllib.error
import base64
import ssl
from concurrent.futures import ThreadPoolExecutor, as_completed

# ── Tracked accounts (337 unique) ──────────────────────────────────────────
TRACKED = {
    'C43659',
    # Zone FM (18)
    '4300296','4300298','4300300','4300301','4300302','4300303','4300304','4300305',
    '4300306','4300307','4300308','4300309','4300310','4300324','4300325','4300337',
    '4300339','4300346',
    # Zone 3A (32)
    '4300002','4300005','4300038','4300044','4300049','4300050','4300052','4300075',
    '4300079','4300081','4300082','4300084','4300085','4300086','4300087','4300089',
    '4300091','4300093','4300095','4300097','4300101','4300176','4300177','4300178',
    '4300179','4300180','4300181','4300182','4300183','4300184','4300185','4300343',
    # Zone 3B (35)
    '4300009','4300020','4300025','4300057','4300060','4300076','4300077','4300078',
    '4300080','4300083','4300088','4300090','4300092','4300094','4300096','4300098',
    '4300099','4300100','4300102','4300103','4300104','4300105','4300186','4300187',
    '4300311','4300312','4300313','4300314','4300315','4300316','4300317','4300318',
    '4300319','4300320','4300344',
    # Zone 5 (35)
    '4300001','4300058','4300059','4300146','4300147','4300148','4300149','4300150',
    '4300151','4300152','4300153','4300154','4300155','4300156','4300157','4300158',
    '4300159','4300160','4300161','4300162','4300163','4300164','4300165','4300166',
    '4300167','4300168','4300169','4300170','4300171','4300172','4300173','4300174',
    '4300175','4300321','4300345',
    # Zone 8 (23)
    '4300023','4300024','4300188','4300189','4300190','4300191','4300192','4300193',
    '4300194','4300195','4300196','4300197','4300198','4300199','4300200','4300287',
    '4300288','4300289','4300290','4300291','4300292','4300293','4300342',
    # Zone SC (2)
    '4300295','4300328',
    # Village Square (8)
    '4300326','4300327','4300329','4300330','4300331','4300332','4300333','4300335',
    # D-Building Common Zone 3A (10)
    '4300144','4300135','4300138','4300143','4300141','4300140','4300136','4300137','4300139','4300145',
    # D-Building Common Zone 3B (11)
    '4300126','4300201','4300202','4300203','4300204','4300205','4300206','4300207','4300208','4300209','4300142',
    # Residential Zone 3A (60)
    '4300010','4300114','4300128','4300030','4300031','4300032','4300033','4300034','4300035','4300110',
    '4300113','4300013','4300026','4300017','4300019','4300011','4300014','4300007','4300043','4300003',
    '4300015','4300115','4300012','4300039','4300016','4300018','4300051','4300117','4300123','4300040',
    '4300131','4300048','4300041','4300107','4300108','4300004','4300053','4300061','4300109','4300047',
    '4300021','4300027','4300028','4300111','4300112','4300121','4300127','4300134','4300106','4300118',
    '4300022','4300125','4300045','4300046','4300036','4300122','4300037','4300006','4300055','4300063',
    # Residential Zone 3B (109)
    '4300132','4300116','4300069','4300042','4300029','4300056','4300008',
    '4300210','4300211','4300212','4300213','4300214','4300215','4300216','4300064','4300074',
    '4300217','4300218','4300219','4300220','4300221','4300222','4300223','4300224','4300225',
    '4300226','4300227','4300071','4300228','4300229','4300230','4300231','4300232','4300233',
    '4300234','4300235','4300236','4300237','4300238','4300239','4300240','4300241','4300242',
    '4300243','4300244','4300245','4300246','4300247','4300248','4300249','4300250','4300251',
    '4300252','4300253','4300254','4300255','4300256','4300070','4300257','4300258','4300259',
    '4300260','4300130','4300261','4300120','4300262','4300263','4300264','4300265','4300266',
    '4300073','4300267','4300268','4300066','4300269','4300270','4300065','4300072','4300271',
    '4300272','4300067','4300273','4300068','4300274','4300275','4300276','4300277','4300278',
    '4300279','4300280','4300281','4300282','4300283','4300284','4300285','4300286',
    '4300062','4300119','4300124','4300129','4300133','4300054',
}

MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']


def resolve_bill_month(override: str | None) -> tuple[str, str, int, int]:
    """Return (mmyyyy, mon_yy_label, year_int, last_day)."""
    if override:
        mm = int(override[:2])
        yyyy = int(override[2:])
    else:
        today = datetime.date.today()
        first_of_this = today.replace(day=1)
        prev = first_of_this - datetime.timedelta(days=1)
        mm, yyyy = prev.month, prev.year
    last_day = calendar.monthrange(yyyy, mm)[1]
    mmyyyy = f"{mm:02d}{yyyy}"
    label  = f"{MONTH_NAMES[mm-1]}-{str(yyyy)[-2:]}"
    return mmyyyy, label, yyyy, last_day


def grafana_query(bill_month: str) -> dict[str, dict[str, float | None]]:
    """
    Call Grafana datasource proxy and return {account: {day_N: value|None}}.
    Uses verify=False equivalent via unverified SSL context (private CA).
    """
    grafana_url  = os.environ['GRAFANA_URL'].rstrip('/')
    user         = os.environ['GRAFANA_USER']
    password     = os.environ['GRAFANA_PASS']
    org_id       = os.environ.get('GRAFANA_ORG_ID', '7')
    ds_uid       = os.environ['GRAFANA_DS_UID']

    # Build MSSQL PIVOT query
    sql = f"""
SELECT *
FROM Dashboard_NWS.dbo.[CM_MCT_DLY_READINGS_CSTMR]
WHERE BillMonth = '{bill_month}'
"""

    payload = json.dumps({
        "queries": [{
            "datasourceId": 1,
            "datasource": {"uid": ds_uid},
            "rawSql": sql.strip(),
            "format": "table",
            "refId": "A",
        }],
        "from": "now-1y",
        "to":   "now",
    }).encode()

    creds   = base64.b64encode(f"{user}:{password}".encode()).decode()
    headers = {
        "Content-Type":  "application/json",
        "Authorization": f"Basic {creds}",
        "X-Grafana-Org-Id": org_id,
    }

    url = f"{grafana_url}/api/ds/query"
    req = urllib.request.Request(url, data=payload, headers=headers, method='POST')

    # Bypass Grafana's private CA certificate — safe on a trusted GitHub runner
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode    = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
            raw = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors='replace')
        raise RuntimeError(f"Grafana HTTP {e.code}: {body[:500]}") from e

    # Parse Grafana table response
    results = raw.get('results', {})
    ref_a   = results.get('A', {})
    frames  = ref_a.get('frames', [])
    if not frames:
        raise RuntimeError(f"No frames in Grafana response. Keys: {list(results.keys())}")

    frame  = frames[0]
    schema = frame.get('schema', {})
    data   = frame.get('data', {})
    fields = schema.get('fields', [])
    values = data.get('values', [])

    if len(fields) != len(values):
        raise RuntimeError(f"Field/value count mismatch: {len(fields)} vs {len(values)}")

    col_map: dict[str, list] = {f['name']: values[i] for i, f in enumerate(fields)}

    acc_col = col_map.get('ACCOUNT_NUMBER') or col_map.get('account_number')
    if acc_col is None:
        raise RuntimeError(f"ACCOUNT_NUMBER column not found. Columns: {list(col_map.keys())}")

    row_count  = len(acc_col)
    last_day   = max(
        (int(k.lstrip('0') or '0') for k in col_map if k.lstrip('0').isdigit()),
        default=31
    )

    account_data: dict[str, dict[str, float | None]] = {}
    for r in range(row_count):
        acc = str(acc_col[r] or '').strip()
        if not acc or acc not in TRACKED:
            continue
        days: dict[str, float | None] = {}
        for d in range(1, last_day + 1):
            col_name = f"{d:02d}"
            col      = col_map.get(col_name)
            if col is None:
                days[f"day_{d}"] = None
            else:
                v = col[r] if r < len(col) else None
                days[f"day_{d}"] = float(v) if isinstance(v, (int, float)) else None
        account_data[acc] = days

    return account_data


def supabase_patch(
    account: str,
    days: dict[str, float | None],
    month_label: str,
    year: int,
    now_iso: str,
    supabase_url: str,
    service_key: str,
) -> tuple[str, str | None]:
    """PATCH one row in water_daily_consumption. Returns (account, error_msg|None)."""
    payload = json.dumps({**days, "updated_at": now_iso}).encode()
    params  = (
        f"account_number=eq.{urllib.parse.quote(account)}"
        f"&month=eq.{urllib.parse.quote(month_label)}"
        f"&year=eq.{year}"
    )
    url = f"{supabase_url}/rest/v1/water_daily_consumption?{params}"
    req = urllib.request.Request(url, data=payload, method='PATCH', headers={
        "Content-Type":  "application/json",
        "apikey":        service_key,
        "Authorization": f"Bearer {service_key}",
        "Prefer":        "return=minimal",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            _ = resp.read()
        return account, None
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors='replace')
        return account, f"HTTP {e.code}: {body[:200]}"
    except Exception as exc:  # noqa: BLE001
        return account, str(exc)


# urllib.parse imported for quote()
import urllib.parse  # noqa: E402 (placed after function for readability)


def main() -> None:
    override   = os.environ.get('BILL_MONTH') or (sys.argv[1] if len(sys.argv) > 1 else None)
    mmyyyy, month_label, year, last_day = resolve_bill_month(override)

    print(f"── Grafana → Supabase water sync ──")
    print(f"   Bill month : {month_label} ({mmyyyy}), last day = {last_day}")

    # 1. Fetch from Grafana
    print("   Querying Grafana …")
    try:
        account_data = grafana_query(mmyyyy)
    except Exception as exc:
        print(f"❌ Grafana query failed: {exc}")
        sys.exit(1)

    print(f"   Found {len(account_data)} / {len(TRACKED)} tracked accounts in Grafana response")

    missing = sorted(TRACKED - set(account_data))
    if missing:
        print(f"⚠️  Missing from Grafana ({len(missing)}): {', '.join(missing[:20])}"
              + (" …" if len(missing) > 20 else ""))

    # 2. Push to Supabase in parallel
    supabase_url = os.environ['SUPABASE_URL'].rstrip('/')
    service_key  = os.environ['SUPABASE_SERVICE_KEY']
    now_iso      = datetime.datetime.utcnow().isoformat() + 'Z'

    print(f"   Patching {len(account_data)} rows in Supabase (20 workers) …")
    updated  = 0
    errors: list[tuple[str, str]] = []

    with ThreadPoolExecutor(max_workers=20) as pool:
        futures = {
            pool.submit(
                supabase_patch, acc, days, month_label, year, now_iso, supabase_url, service_key
            ): acc
            for acc, days in account_data.items()
        }
        for future in as_completed(futures):
            acc, err = future.result()
            if err:
                errors.append((acc, err))
            else:
                updated += 1

    # 3. Report
    print()
    print(f"✅ Bill month synced   : {month_label} ({mmyyyy})")
    print(f"✅ Meters updated      : {updated} of {len(TRACKED)} tracked accounts")
    print(f"✅ Days populated      : day_1 … day_{last_day}")

    if errors:
        print(f"❌ Update errors ({len(errors)}):")
        for acc, msg in errors[:15]:
            print(f"   {acc}: {msg}")

    if missing:
        print(f"⚠️  NULL day_N expected for D-building bulk meters (late reporters)")
        print(f"⚠️  Missing from snapshot ({len(missing)}): {', '.join(missing)}")

    if errors:
        sys.exit(1)


if __name__ == '__main__':
    main()
