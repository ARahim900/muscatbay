"""
Sync Grafana water consumption data → Supabase water_daily_consumption table.

Reads from: Dashboard_NWS.dbo.[CM_MCT_DLY_READINGS_CSTMR] via Grafana MSSQL datasource
Writes to:  water_daily_consumption (account_number, month, year, day_1..day_31, updated_at)
Unique key: (account_number, month, year)

Environment variables (all required):
  GRAFANA_URL          https://grafana.nec-oman.com
  GRAFANA_USER         Grafana basic-auth username
  GRAFANA_PASS         Grafana basic-auth password
  GRAFANA_ORG_ID       Grafana org id (7)
  GRAFANA_DS_UID       Datasource UID (esu8hjVHk)
  SUPABASE_URL         https://utnlgeuqajmwibqmdmgt.supabase.co
  SUPABASE_SERVICE_KEY service_role JWT

Optional:
  BILL_MONTH           MMYYYY override (e.g. 052026). Defaults to previous calendar month.
"""

import calendar
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

GRAFANA_URL    = os.environ["GRAFANA_URL"].rstrip("/")
GRAFANA_USER   = os.environ["GRAFANA_USER"]
GRAFANA_PASS   = os.environ["GRAFANA_PASS"]
GRAFANA_ORG_ID = os.environ["GRAFANA_ORG_ID"]
GRAFANA_DS_UID = os.environ["GRAFANA_DS_UID"]
SUPABASE_URL   = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY   = os.environ["SUPABASE_SERVICE_KEY"]

MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun",
               "Jul","Aug","Sep","Oct","Nov","Dec"]

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
    "4300144","4300135","4300138","4300143","4300141","4300140","4300136","4300137","4300139","4300145",
    # D-Building Common Zone 3B (11)
    "4300126","4300201","4300202","4300203","4300204","4300205","4300206","4300207","4300208","4300209","4300142",
    # Residential Zone 3A (60)
    "4300010","4300114","4300128","4300030","4300031","4300032","4300033","4300034","4300035","4300110",
    "4300113","4300013","4300026","4300017","4300019","4300011","4300014","4300007","4300043","4300003",
    "4300015","4300115","4300012","4300039","4300016","4300018","4300051","4300117","4300123","4300040",
    "4300131","4300048","4300041","4300107","4300108","4300004","4300053","4300061","4300109","4300047",
    "4300021","4300027","4300028","4300111","4300112","4300121","4300127","4300134","4300106","4300118",
    "4300022","4300125","4300045","4300046","4300036","4300122","4300037","4300006","4300055","4300063",
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

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def resolve_bill_month() -> tuple[int, int]:
    """Return (month_int 1-12, year_int) for the bill month to sync."""
    override = os.environ.get("BILL_MONTH", "").strip()
    if override:
        if len(override) != 6 or not override.isdigit():
            sys.exit(f"ERROR: BILL_MONTH must be MMYYYY, got: {override!r}")
        mm = int(override[:2])
        yyyy = int(override[2:])
        if not (1 <= mm <= 12):
            sys.exit(f"ERROR: Invalid month {mm} in BILL_MONTH={override}")
        return mm, yyyy
    # Default: previous calendar month
    first_of_this = date.today().replace(day=1)
    last_month = first_of_this - timedelta(days=1)
    return last_month.month, last_month.year


def grafana_query(mm: int, yyyy: int) -> dict[str, dict[str, float | None]]:
    """
    Query Grafana MSSQL datasource for all accounts in bill month MMYYYY.
    Returns {account_number: {day_1: float|None, ..., day_N: float|None}}.
    """
    bill_month_str = f"{mm:02d}{yyyy}"
    last_day = calendar.monthrange(yyyy, mm)[1]

    # Build day column list for PIVOT
    day_cols = ", ".join(f"[{str(d).zfill(2)}]" for d in range(1, last_day + 1))

    raw_sql = f"""
SELECT ACCOUNT_NUMBER, {day_cols}
FROM (
  SELECT
    CAST(ACCOUNT_NUMBER AS VARCHAR(20)) AS ACCOUNT_NUMBER,
    RIGHT('0' + CAST(DAY(READING_DATE) AS VARCHAR(2)), 2) AS day_col,
    DAILY_CONS
  FROM Dashboard_NWS.dbo.[CM_MCT_DLY_READINGS_CSTMR]
  WHERE BILL_MONTH = '{bill_month_str}'
) AS src
PIVOT (
  SUM(DAILY_CONS) FOR day_col IN ({day_cols})
) AS pvt
ORDER BY ACCOUNT_NUMBER
"""

    payload = {
        "queries": [
            {
                "datasourceId": None,
                "uid": GRAFANA_DS_UID,
                "rawSql": raw_sql.strip(),
                "format": "table",
                "refId": "A",
            }
        ],
        "from": "now-1y",
        "to": "now",
    }

    resp = requests.post(
        f"{GRAFANA_URL}/api/ds/query",
        auth=(GRAFANA_USER, GRAFANA_PASS),
        headers={"X-Grafana-Org-Id": str(GRAFANA_ORG_ID), "Content-Type": "application/json"},
        json=payload,
        verify=False,  # Grafana uses private CA — safe on a trusted runner
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()

    frames = data.get("results", {}).get("A", {}).get("frames", [])
    if not frames:
        sys.exit("ERROR: Grafana returned no frames. Check credentials and SQL.")

    schema = frames[0]["schema"]["fields"]
    values = frames[0]["data"]["values"]
    col_names = [f["name"] for f in schema]

    # col_names[0] = ACCOUNT_NUMBER, col_names[1..] = "01".."31"
    acc_col = values[0]
    result: dict[str, dict[str, float | None]] = {}
    for row_i, acc in enumerate(acc_col):
        acc_str = str(acc)
        if acc_str not in TRACKED:
            continue
        days: dict[str, float | None] = {}
        for col_i, col_name in enumerate(col_names[1:], start=1):
            day_num = int(col_name)  # "01" → 1
            v = values[col_i][row_i]
            days[f"day_{day_num}"] = float(v) if v is not None else None
        result[acc_str] = days

    return result


def supabase_update(
    account_data: dict[str, dict[str, float | None]],
    month_label: str,
    year: int,
    workers: int = 20,
) -> tuple[int, list[str]]:
    """
    PATCH each account's row in water_daily_consumption.
    Returns (updated_count, error_list).
    """
    from datetime import datetime, timezone

    now_iso = datetime.now(timezone.utc).isoformat()
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    base_url = f"{SUPABASE_URL}/rest/v1/water_daily_consumption"

    def patch_one(acc: str, day_data: dict) -> str | None:
        url = f"{base_url}?account_number=eq.{acc}&month=eq.{month_label}&year=eq.{year}"
        body = {**day_data, "updated_at": now_iso}
        r = requests.patch(url, headers=headers, json=body, timeout=30)
        if r.status_code not in (200, 204):
            return f"{acc}: HTTP {r.status_code} — {r.text[:200]}"
        return None

    updated = 0
    errors: list[str] = []
    accounts = list(account_data.items())

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(patch_one, acc, days): acc for acc, days in accounts}
        for future in as_completed(futures):
            err = future.result()
            if err:
                errors.append(err)
            else:
                updated += 1

    return updated, errors


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    mm, yyyy = resolve_bill_month()
    last_day = calendar.monthrange(yyyy, mm)[1]
    month_label = f"{MONTH_NAMES[mm - 1]}-{str(yyyy)[-2:]}"  # e.g. "May-26"
    bill_month_str = f"{mm:02d}{yyyy}"

    print(f"=== Sync Water Consumption ===")
    print(f"Bill month : {month_label} ({bill_month_str})")
    print(f"Days in month : {last_day}")
    print(f"Tracked accounts : {len(TRACKED)}")
    print()

    print("Step 1/3 — Querying Grafana...")
    account_data = grafana_query(mm, yyyy)
    print(f"  Accounts found in Grafana : {len(account_data)}")

    missing = sorted(TRACKED - set(account_data.keys()))
    if missing:
        print(f"  Missing from Grafana      : {len(missing)}")
        for acc in missing:
            print(f"    - {acc}")

    null_day_counts: dict[str, int] = {}
    for days in account_data.values():
        for col, v in days.items():
            if v is None:
                null_day_counts[col] = null_day_counts.get(col, 0) + 1

    print()
    print("Step 2/3 — Patching Supabase...")
    updated, errors = supabase_update(account_data, month_label, year=yyyy)
    print(f"  Updated : {updated}")
    if errors:
        print(f"  Errors  : {len(errors)}")
        for e in errors[:15]:
            print(f"    {e}")

    print()
    print("Step 3/3 — Summary")
    print(f"  ✅ Bill month synced   : {month_label} ({bill_month_str})")
    print(f"  ✅ Meters updated      : {updated} of {len(TRACKED)} tracked accounts")
    print(f"  ✅ Days populated      : day_1 … day_{last_day}")

    # Highlight columns with significant NULLs (D-building bulk expected)
    d_bulk = {
        "4300176","4300177","4300178","4300179","4300180","4300181","4300182","4300183","4300184","4300185",
        "4300186","4300187","4300311","4300312","4300313","4300314","4300315","4300316","4300317","4300318","4300319",
    }
    for col, cnt in sorted(null_day_counts.items(), key=lambda x: x[0]):
        if cnt > 0:
            note = "— expected for D-building bulk (late reporters)" if cnt <= len(d_bulk) else ""
            print(f"  ⚠️  NULL {col:8s}: {cnt} accounts {note}")

    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
