"""
Grafana (NEC Oman) → Supabase water_daily_consumption sync.

Env vars required:
  GRAFANA_URL         https://grafana.nec-oman.com
  GRAFANA_USER        Grafana username
  GRAFANA_PASS        Grafana password
  GRAFANA_ORG_ID      7
  GRAFANA_DS_UID      esu8hjVHk
  SUPABASE_URL        https://utnlgeuqajmwibqmdmgt.supabase.co
  SUPABASE_SERVICE_KEY  service_role JWT

Optional:
  BILL_MONTH          MMYYYY override (e.g. 052026). Defaults to previous calendar month.
"""

import os
import json
import calendar
from datetime import date, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ---------------------------------------------------------------------------
# 337 unique tracked account numbers
# ---------------------------------------------------------------------------
TRACKED = {
    'C43659',
    # Zone FM (18)
    '4300296','4300298','4300300','4300301','4300302','4300303','4300304','4300305',
    '4300306','4300307','4300308','4300309','4300310','4300324','4300325','4300337',
    '4300339','4300346',
    # Zone 3A bulk+individual (32)
    '4300002','4300005','4300038','4300044','4300049','4300050','4300052','4300075',
    '4300079','4300081','4300082','4300084','4300085','4300086','4300087','4300089',
    '4300091','4300093','4300095','4300097','4300101',
    '4300176','4300177','4300178','4300179','4300180','4300181','4300182','4300183','4300184','4300185',
    '4300343',
    # Zone 3B bulk+individual (35)
    '4300009','4300020','4300025','4300057','4300060','4300076','4300077','4300078',
    '4300080','4300083','4300088','4300090','4300092','4300094','4300096','4300098',
    '4300099','4300100','4300102','4300103','4300104','4300105',
    '4300186','4300187',
    '4300311','4300312','4300313','4300314','4300315','4300316','4300317','4300318','4300319','4300320',
    '4300344',
    # Zone 5 (35)
    '4300001','4300058','4300059',
    '4300146','4300147','4300148','4300149','4300150','4300151','4300152','4300153','4300154','4300155',
    '4300156','4300157','4300158','4300159','4300160','4300161','4300162','4300163','4300164','4300165',
    '4300166','4300167','4300168','4300169','4300170','4300171','4300172','4300173','4300174','4300175',
    '4300321','4300345',
    # Zone 8 (23)
    '4300023','4300024',
    '4300188','4300189','4300190','4300191','4300192','4300193','4300194','4300195','4300196','4300197',
    '4300198','4300199','4300200',
    '4300287','4300288','4300289','4300290','4300291','4300292','4300293',
    '4300342',
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
WORKERS = 20


def resolve_bill_month(override: str) -> tuple[str, str, int, int]:
    """
    Returns (bill_month_mmyyyy, month_label, year, last_day).
    override: MMYYYY string, or '' to use previous calendar month.
    """
    if override:
        mm = int(override[:2])
        yyyy = int(override[2:])
    else:
        today = date.today()
        first_of_this = today.replace(day=1)
        prev = first_of_this - timedelta(days=1)
        mm, yyyy = prev.month, prev.year

    last_day = calendar.monthrange(yyyy, mm)[1]
    month_label = f"{MONTH_NAMES[mm - 1]}-{str(yyyy)[2:]}"
    bill_month_mmyyyy = f"{mm:02d}{yyyy}"
    return bill_month_mmyyyy, month_label, yyyy, last_day


def fetch_grafana(grafana_url: str, user: str, password: str, org_id: str,
                  ds_uid: str, bill_month: str) -> dict:
    """Query Grafana datasource proxy for the PIVOT table."""
    url = f"{grafana_url}/api/ds/query"
    sql = f"""
SELECT *
FROM Dashboard_NWS.dbo.[CM_MCT_DLY_READINGS_CSTMR]
WHERE BillMonth = '{bill_month}'
"""
    payload = {
        "queries": [
            {
                "datasourceId": None,
                "uid": ds_uid,
                "rawSql": sql,
                "format": "table",
                "refId": "A",
            }
        ],
        "from": "now-1y",
        "to": "now",
    }
    headers = {
        "Content-Type": "application/json",
        "X-Grafana-Org-Id": org_id,
    }
    resp = requests.post(
        url,
        json=payload,
        auth=(user, password),
        headers=headers,
        verify=False,
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json()


def parse_grafana_response(data: dict, last_day: int) -> dict[str, dict[str, float | None]]:
    """
    Parse Grafana table response into {account_number: {day_1: v, ..., day_N: v}}.
    Grafana returns column names '01'…'31'; we map to day_1…day_31.
    """
    # Navigate to the first result frame
    results = data.get("results", {})
    frame = None
    for key in results:
        frames = results[key].get("frames", [])
        if frames:
            frame = frames[0]
            break

    if not frame:
        raise ValueError("No data frames returned from Grafana")

    schema_fields = frame.get("schema", {}).get("fields", [])
    data_values = frame.get("data", {}).get("values", [])

    if len(schema_fields) != len(data_values):
        raise ValueError("Schema/data field count mismatch")

    col_index: dict[str, int] = {f["name"]: i for i, f in enumerate(schema_fields)}

    acc_idx = col_index.get("ACCOUNT_NUMBER")
    if acc_idx is None:
        raise ValueError("ACCOUNT_NUMBER column not found in Grafana response")

    row_count = len(data_values[acc_idx])
    account_data: dict[str, dict[str, float | None]] = {}

    for r in range(row_count):
        acc = str(data_values[acc_idx][r] or "").strip()
        if not acc or acc not in TRACKED:
            continue

        days: dict[str, float | None] = {}
        for d in range(1, last_day + 1):
            col_name = f"{d:02d}"  # Grafana uses zero-padded '01'…'31'
            day_key = f"day_{d}"  # Supabase uses day_1…day_31
            if col_name in col_index:
                raw = data_values[col_index[col_name]][r]
                days[day_key] = float(raw) if raw is not None else None
            else:
                days[day_key] = None

        account_data[acc] = days

    return account_data


def patch_supabase(supabase_url: str, service_key: str, account: str,
                   days: dict[str, float | None], month_label: str, year: int) -> str | None:
    """PATCH one account row. Returns error message or None on success."""
    from datetime import datetime, timezone
    payload = {**days, "updated_at": datetime.now(timezone.utc).isoformat()}
    url = f"{supabase_url}/rest/v1/water_daily_consumption"
    params = {
        "account_number": f"eq.{account}",
        "month": f"eq.{month_label}",
        "year": f"eq.{year}",
    }
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    try:
        resp = requests.patch(url, params=params, json=payload, headers=headers, timeout=30)
        if resp.status_code not in (200, 204):
            return f"{account}: HTTP {resp.status_code} — {resp.text[:200]}"
        return None
    except Exception as exc:
        return f"{account}: {exc}"


def main():
    # --- Config ---
    grafana_url = os.environ["GRAFANA_URL"].rstrip("/")
    grafana_user = os.environ["GRAFANA_USER"]
    grafana_pass = os.environ["GRAFANA_PASS"]
    grafana_org = os.environ.get("GRAFANA_ORG_ID", "7")
    grafana_ds = os.environ["GRAFANA_DS_UID"]
    supabase_url = os.environ["SUPABASE_URL"].rstrip("/")
    supabase_key = os.environ["SUPABASE_SERVICE_KEY"]
    bill_month_override = os.environ.get("BILL_MONTH", "").strip()

    bill_month, month_label, year, last_day = resolve_bill_month(bill_month_override)

    print(f"=== Water Consumption Sync ===")
    print(f"Bill month : {month_label} ({bill_month})  |  Days: 1–{last_day}")
    print(f"Tracked    : {len(TRACKED)} unique accounts")
    print()

    # --- Fetch from Grafana ---
    print("Querying Grafana...")
    try:
        raw = fetch_grafana(grafana_url, grafana_user, grafana_pass,
                            grafana_org, grafana_ds, bill_month)
    except requests.HTTPError as exc:
        print(f"ERROR: Grafana query failed — {exc}")
        raise SystemExit(1)

    # --- Parse ---
    try:
        account_data = parse_grafana_response(raw, last_day)
    except ValueError as exc:
        print(f"ERROR: Parse failed — {exc}")
        print("Raw response (first 2000 chars):", json.dumps(raw)[:2000])
        raise SystemExit(1)

    found = set(account_data.keys())
    missing = sorted(TRACKED - found)
    print(f"Accounts found in Grafana : {len(found)}")
    if missing:
        print(f"Missing from Grafana      : {len(missing)} — {missing[:20]}{'...' if len(missing)>20 else ''}")
    print()

    # --- Push to Supabase ---
    print(f"Patching Supabase with {WORKERS} parallel workers...")
    errors: list[str] = []
    updated = 0

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {
            pool.submit(patch_supabase, supabase_url, supabase_key, acc, days, month_label, year): acc
            for acc, days in account_data.items()
        }
        for future in as_completed(futures):
            err = future.result()
            if err:
                errors.append(err)
            else:
                updated += 1

    # --- Report ---
    print()
    print("=== Sync Report ===")
    print(f"✅ Bill month synced   : {month_label} ({bill_month})")
    print(f"✅ Meters updated      : {updated} of {len(TRACKED)} tracked accounts")
    print(f"✅ Days populated      : day_1 … day_{last_day}")

    # Identify accounts with all-NULL days (late reporters)
    late_reporters = [acc for acc, days in account_data.items() if all(v is None for v in days.values())]
    if late_reporters:
        print(f"⚠️  All-NULL (late reporters): {sorted(late_reporters)}")

    if missing:
        print(f"⚠️  Missing from snapshot  : {missing}")

    if errors:
        print(f"❌ Update errors ({len(errors)}):")
        for e in errors[:15]:
            print(f"   {e}")
        if len(errors) > 15:
            print(f"   ... and {len(errors)-15} more")
        raise SystemExit(1)
    else:
        print("✅ No errors")


if __name__ == "__main__":
    main()
