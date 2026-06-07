"""
Sync Grafana (NEC Oman) water consumption data to Supabase water_daily_consumption.

Schedule: runs on GitHub Actions on the 2nd of every month, capturing the previous
complete month. Can also be triggered manually with BILL_MONTH_OVERRIDE=MMYYYY.

Grafana datasource: MSSQL  Dashboard_NWS.dbo.[CM_MCT_DLY_READINGS_CSTMR]
Supabase table    : water_daily_consumption
Unique key        : (account_number, month, year)
"""

import calendar
import json
import os
import sys
import urllib3
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta

import requests

# ---------------------------------------------------------------------------
# Configuration from environment (injected by GitHub Actions secrets)
# ---------------------------------------------------------------------------
GRAFANA_URL   = os.environ["GRAFANA_URL"].rstrip("/")
GRAFANA_USER  = os.environ["GRAFANA_USER"]
GRAFANA_PASS  = os.environ["GRAFANA_PASS"]
GRAFANA_ORG_ID = os.environ.get("GRAFANA_ORG_ID", "7")
GRAFANA_DS_UID = os.environ["GRAFANA_DS_UID"]

SUPABASE_URL  = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY  = os.environ["SUPABASE_SERVICE_KEY"]

WORKERS = 20

# ---------------------------------------------------------------------------
# Tracked account numbers (337 unique meters)
# ---------------------------------------------------------------------------
TRACKED = {
    "C43659",
    # Zone FM (18)
    "4300296","4300298","4300300","4300301","4300302","4300303","4300304","4300305",
    "4300306","4300307","4300308","4300309","4300310","4300324","4300325","4300337",
    "4300339","4300346",
    # Zone 3A (32)
    "4300002","4300005","4300038","4300044","4300049","4300050","4300052","4300075",
    "4300079","4300081","4300082","4300084","4300085","4300086","4300087","4300089",
    "4300091","4300093","4300095","4300097","4300101","4300176","4300177","4300178",
    "4300179","4300180","4300181","4300182","4300183","4300184","4300185","4300343",
    # Zone 3B (35)
    "4300009","4300020","4300025","4300057","4300060","4300076","4300077","4300078",
    "4300080","4300083","4300088","4300090","4300092","4300094","4300096","4300098",
    "4300099","4300100","4300102","4300103","4300104","4300105","4300186","4300187",
    "4300311","4300312","4300313","4300314","4300315","4300316","4300317","4300318",
    "4300319","4300320","4300344",
    # Zone 5 (35)
    "4300001","4300058","4300059","4300146","4300147","4300148","4300149","4300150",
    "4300151","4300152","4300153","4300154","4300155","4300156","4300157","4300158",
    "4300159","4300160","4300161","4300162","4300163","4300164","4300165","4300166",
    "4300167","4300168","4300169","4300170","4300171","4300172","4300173","4300174",
    "4300175","4300321","4300345",
    # Zone 8 (23)
    "4300023","4300024","4300188","4300189","4300190","4300191","4300192","4300193",
    "4300194","4300195","4300196","4300197","4300198","4300199","4300200","4300287",
    "4300288","4300289","4300290","4300291","4300292","4300293","4300342",
    # Zone SC (2)
    "4300295","4300328",
    # Village Square (8)
    "4300326","4300327","4300329","4300330","4300331","4300332","4300333","4300335",
    # D-Building Common Zone 3A (10)
    "4300144","4300135","4300138","4300143","4300141","4300140","4300136","4300137",
    "4300139","4300145",
    # D-Building Common Zone 3B (11)
    "4300126","4300201","4300202","4300203","4300204","4300205","4300206","4300207",
    "4300208","4300209","4300142",
    # Residential Zone 3A (60)
    "4300010","4300114","4300128","4300030","4300031","4300032","4300033","4300034",
    "4300035","4300110","4300113","4300013","4300026","4300017","4300019","4300011",
    "4300014","4300007","4300043","4300003","4300015","4300115","4300012","4300039",
    "4300016","4300018","4300051","4300117","4300123","4300040","4300131","4300048",
    "4300041","4300107","4300108","4300004","4300053","4300061","4300109","4300047",
    "4300021","4300027","4300028","4300111","4300112","4300121","4300127","4300134",
    "4300106","4300118","4300022","4300125","4300045","4300046","4300036","4300122",
    "4300037","4300006","4300055","4300063",
    # Residential Zone 3B (109)
    "4300132","4300116","4300069","4300042","4300029","4300056","4300008",
    "4300210","4300211","4300212","4300213","4300214","4300215","4300216","4300064","4300074",
    "4300217","4300218","4300219","4300220","4300221","4300222","4300223","4300224","4300225",
    "4300226","4300227","4300071","4300228","4300229","4300230","4300231","4300232","4300233",
    "4300234","4300235","4300236","4300237","4300238","4300239","4300240","4300241","4300242",
    "4300243","4300244","4300245","4300246","4300247","4300248","4300249","4300250","4300251",
    "4300252","4300253","4300254","4300255","4300256","4300070","4300257","4300258","4300259",
    "4300260","4300130","4300261","4300120","4300262","4300263","4300264","4300265","4300266",
    "4300073","4300267","4300268","4300066","4300269","4300270","4300065","4300072","4300271",
    "4300272","4300067","4300273","4300068","4300274","4300275","4300276","4300277","4300278",
    "4300279","4300280","4300281","4300282","4300283","4300284","4300285","4300286",
    "4300062","4300119","4300124","4300129","4300133","4300054",
}


def resolve_bill_month(override: str) -> tuple[str, str, int, int]:
    """
    Returns (mmyyyy, month_label, year, last_day).

    mmyyyy       — '052026'
    month_label  — 'May-26'
    year         — 2026
    last_day     — 31
    """
    if override:
        if len(override) != 6 or not override.isdigit():
            raise ValueError(f"BILL_MONTH_OVERRIDE must be MMYYYY, got: {override!r}")
        mm   = int(override[:2])
        yyyy = int(override[2:])
    else:
        # Previous calendar month
        today = date.today()
        first_of_this_month = today.replace(day=1)
        prev = first_of_this_month - timedelta(days=1)
        mm, yyyy = prev.month, prev.year

    month_names = ["Jan","Feb","Mar","Apr","May","Jun",
                   "Jul","Aug","Sep","Oct","Nov","Dec"]
    month_label = f"{month_names[mm - 1]}-{str(yyyy)[2:]}"
    last_day    = calendar.monthrange(yyyy, mm)[1]
    mmyyyy      = f"{mm:02d}{yyyy}"
    return mmyyyy, month_label, yyyy, last_day


def build_grafana_query(ds_uid: str, mmyyyy: str) -> dict:
    """
    Builds the Grafana /api/ds/query payload that fetches the PIVOT table
    for all daily readings in the given bill month.
    """
    sql = f"""
SELECT *
FROM Dashboard_NWS.dbo.[CM_MCT_DLY_READINGS_CSTMR]
WHERE BillMonth = '{mmyyyy}'
ORDER BY ACCOUNT_NUMBER
"""
    return {
        "queries": [
            {
                "datasource": {"uid": ds_uid},
                "rawSql": sql.strip(),
                "format": "table",
                "refId": "A",
            }
        ],
        "from": "now-1y",
        "to": "now",
    }


def fetch_grafana_data(mmyyyy: str, last_day: int) -> dict[str, dict[str, float | None]]:
    """
    Calls Grafana datasource query API and returns a dict:
        { account_number: { "day_1": float|None, ..., "day_N": float|None } }

    Grafana returns day columns as zero-padded strings '01'..'31'.
    We map them to day_1..day_N (no leading zeros).
    """
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    url     = f"{GRAFANA_URL}/api/ds/query"
    payload = build_grafana_query(GRAFANA_DS_UID, mmyyyy)
    headers = {
        "Content-Type": "application/json",
        "X-Grafana-Org-Id": GRAFANA_ORG_ID,
    }

    resp = requests.post(
        url,
        json=payload,
        headers=headers,
        auth=(GRAFANA_USER, GRAFANA_PASS),
        verify=False,  # Grafana uses a private CA — safe on a trusted runner
        timeout=60,
    )
    resp.raise_for_status()
    body = resp.json()

    # Grafana table response schema:
    # body["results"]["A"]["frames"][0]["schema"]["fields"]  → [{"name": "ACCOUNT_NUMBER"}, ...]
    # body["results"]["A"]["frames"][0]["data"]["values"]    → [[acc_values...], [day01_values...], ...]
    frames = body.get("results", {}).get("A", {}).get("frames", [])
    if not frames:
        raise RuntimeError(f"Grafana returned no frames for bill month {mmyyyy}. Body: {json.dumps(body)[:500]}")

    frame  = frames[0]
    fields = frame["schema"]["fields"]       # list of {"name": ...}
    values = frame["data"]["values"]         # parallel list of value arrays

    field_names = [f["name"] for f in fields]
    try:
        acc_idx = field_names.index("ACCOUNT_NUMBER")
    except ValueError:
        raise RuntimeError(f"ACCOUNT_NUMBER column not found. Columns: {field_names}")

    row_count = len(values[acc_idx])

    # Build column index map for day columns
    day_col_index: dict[int, int] = {}
    for d in range(1, last_day + 1):
        col = f"{d:02d}"
        if col in field_names:
            day_col_index[d] = field_names.index(col)

    result: dict[str, dict[str, float | None]] = {}
    for r in range(row_count):
        acc = str(values[acc_idx][r] or "").strip()
        if not acc or acc not in TRACKED:
            continue
        days: dict[str, float | None] = {}
        for d in range(1, last_day + 1):
            idx = day_col_index.get(d)
            v   = values[idx][r] if idx is not None else None
            days[f"day_{d}"] = float(v) if isinstance(v, (int, float)) else None
        result[acc] = days

    return result


def update_supabase_row(
    session: requests.Session,
    account_number: str,
    month_label: str,
    year: int,
    day_data: dict[str, float | None],
) -> str | None:
    """
    PATCHes a single row in water_daily_consumption.
    Returns an error message string, or None on success.
    """
    url = (
        f"{SUPABASE_URL}/rest/v1/water_daily_consumption"
        f"?account_number=eq.{account_number}&month=eq.{month_label}&year=eq.{year}"
    )
    resp = session.patch(url, json=day_data, timeout=30)
    if resp.status_code not in (200, 204):
        return f"{account_number}: HTTP {resp.status_code} — {resp.text[:200]}"
    return None


def push_to_supabase(
    account_data: dict[str, dict[str, float | None]],
    month_label: str,
    year: int,
) -> tuple[int, list[str]]:
    """
    Updates all rows in parallel using a shared requests.Session.
    Returns (updated_count, error_list).
    """
    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "return=minimal",
    }
    session = requests.Session()
    session.headers.update(headers)

    updated = 0
    errors:  list[str] = []

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {
            pool.submit(update_supabase_row, session, acc, month_label, year, days): acc
            for acc, days in account_data.items()
        }
        for future in as_completed(futures):
            err = future.result()
            if err:
                errors.append(err)
            else:
                updated += 1

    session.close()
    return updated, errors


# ---------------------------------------------------------------------------
# D-building bulk meters — expected to have NULLs (late reporters)
# ---------------------------------------------------------------------------
D_BUILDING_BULK = {
    "4300176","4300177","4300178","4300179","4300180","4300181","4300182","4300183",
    "4300184","4300185","4300186","4300187","4300311","4300312","4300313","4300314",
    "4300315","4300316","4300317","4300318","4300319",
}


def main() -> None:
    override = os.environ.get("BILL_MONTH_OVERRIDE", "").strip()
    mmyyyy, month_label, year, last_day = resolve_bill_month(override)

    print(f"=== Muscat Bay Water Consumption Sync ===")
    print(f"Bill month : {month_label} ({mmyyyy})")
    print(f"Days       : 1 – {last_day}")
    print(f"Grafana    : {GRAFANA_URL}")
    print(f"Supabase   : {SUPABASE_URL}")
    print()

    # Step 1 — fetch from Grafana
    print("Fetching data from Grafana...", flush=True)
    try:
        account_data = fetch_grafana_data(mmyyyy, last_day)
    except Exception as exc:
        print(f"ERROR fetching from Grafana: {exc}", file=sys.stderr)
        sys.exit(1)

    print(f"Grafana returned data for {len(account_data)} tracked accounts.")

    missing_from_grafana = sorted(TRACKED - set(account_data.keys()))
    if missing_from_grafana:
        d_building_missing = [a for a in missing_from_grafana if a in D_BUILDING_BULK]
        other_missing      = [a for a in missing_from_grafana if a not in D_BUILDING_BULK]
        if other_missing:
            print(f"⚠️  {len(other_missing)} non-D-building meters absent from Grafana: {other_missing}")
        if d_building_missing:
            print(f"ℹ️  {len(d_building_missing)} D-building bulk meters absent (late reporters — normal): {d_building_missing}")

    # Step 2 — push to Supabase
    print(f"\nPushing to Supabase ({WORKERS} parallel workers)...", flush=True)
    try:
        updated, errors = push_to_supabase(account_data, month_label, year)
    except Exception as exc:
        print(f"ERROR pushing to Supabase: {exc}", file=sys.stderr)
        sys.exit(1)

    # Step 3 — report
    print()
    print("=== Sync Report ===")
    print(f"✅ Bill month synced   : {month_label} ({mmyyyy})")
    print(f"✅ Meters updated      : {updated} of {len(TRACKED)} tracked accounts")
    print(f"✅ Days populated      : day_1 … day_{last_day}")

    # Identify accounts with NULL final day (may indicate late reporting)
    null_last_day = [
        acc for acc, days in account_data.items()
        if days.get(f"day_{last_day}") is None
    ]
    if null_last_day:
        d_building_nulls = [a for a in null_last_day if a in D_BUILDING_BULK]
        other_nulls      = [a for a in null_last_day if a not in D_BUILDING_BULK]
        if d_building_nulls:
            print(f"⚠️  NULL day_{last_day} (D-building bulk, expected late reporters): {d_building_nulls}")
        if other_nulls:
            print(f"⚠️  NULL day_{last_day} (unexpected): {other_nulls}")

    if missing_from_grafana:
        print(f"⚠️  Missing from Grafana snapshot: {missing_from_grafana}")

    if errors:
        print(f"\n❌ {len(errors)} Supabase update error(s):")
        for err in errors[:20]:
            print(f"   {err}")
        sys.exit(1)
    else:
        print("\n✅ All updates successful.")


if __name__ == "__main__":
    main()
