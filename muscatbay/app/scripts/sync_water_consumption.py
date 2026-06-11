#!/usr/bin/env python3
"""
Grafana (NEC Oman) → Supabase water_daily_consumption sync.

Queries the MSSQL datasource through Grafana's /api/ds/query endpoint,
parses the PIVOT response, and PATCHes each tracked account's row in
water_daily_consumption via the Supabase REST API.

Required environment variables (GitHub Secrets):
    GRAFANA_URL          https://grafana.nec-oman.com
    GRAFANA_USER         Grafana username
    GRAFANA_PASS         Grafana password
    GRAFANA_ORG_ID       Grafana org ID (7)
    GRAFANA_DS_UID       Datasource UID (esu8hjVHk)
    SUPABASE_URL         https://utnlgeuqajmwibqmdmgt.supabase.co
    SUPABASE_SERVICE_KEY service_role JWT
"""

import argparse
import calendar
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ── Environment ──────────────────────────────────────────────────────────────

GRAFANA_URL    = os.environ["GRAFANA_URL"].rstrip("/")
GRAFANA_USER   = os.environ["GRAFANA_USER"]
GRAFANA_PASS   = os.environ["GRAFANA_PASS"]
GRAFANA_ORG_ID = os.environ.get("GRAFANA_ORG_ID", "7")
GRAFANA_DS_UID = os.environ.get("GRAFANA_DS_UID", "esu8hjVHk")
SUPABASE_URL   = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY   = os.environ["SUPABASE_SERVICE_KEY"]

MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

# 337 unique tracked accounts (347 list entries include zone/D-building overlaps)
TRACKED: set[str] = {
    "C43659",
    # Zone FM (18)
    "4300296", "4300298", "4300300", "4300301", "4300302", "4300303", "4300304",
    "4300305", "4300306", "4300307", "4300308", "4300309", "4300310", "4300324",
    "4300325", "4300337", "4300339", "4300346",
    # Zone 3A (32)
    "4300002", "4300005", "4300038", "4300044", "4300049", "4300050", "4300052",
    "4300075", "4300079", "4300081", "4300082", "4300084", "4300085", "4300086",
    "4300087", "4300089", "4300091", "4300093", "4300095", "4300097", "4300101",
    "4300176", "4300177", "4300178", "4300179", "4300180", "4300181", "4300182",
    "4300183", "4300184", "4300185", "4300343",
    # Zone 3B (35)
    "4300009", "4300020", "4300025", "4300057", "4300060", "4300076", "4300077",
    "4300078", "4300080", "4300083", "4300088", "4300090", "4300092", "4300094",
    "4300096", "4300098", "4300099", "4300100", "4300102", "4300103", "4300104",
    "4300105", "4300186", "4300187", "4300311", "4300312", "4300313", "4300314",
    "4300315", "4300316", "4300317", "4300318", "4300319", "4300320", "4300344",
    # Zone 5 (35)
    "4300001", "4300058", "4300059", "4300146", "4300147", "4300148", "4300149",
    "4300150", "4300151", "4300152", "4300153", "4300154", "4300155", "4300156",
    "4300157", "4300158", "4300159", "4300160", "4300161", "4300162", "4300163",
    "4300164", "4300165", "4300166", "4300167", "4300168", "4300169", "4300170",
    "4300171", "4300172", "4300173", "4300174", "4300175", "4300321", "4300345",
    # Zone 8 (23)
    "4300023", "4300024", "4300188", "4300189", "4300190", "4300191", "4300192",
    "4300193", "4300194", "4300195", "4300196", "4300197", "4300198", "4300199",
    "4300200", "4300287", "4300288", "4300289", "4300290", "4300291", "4300292",
    "4300293", "4300342",
    # Zone SC (2)
    "4300295", "4300328",
    # Village Square (8)
    "4300326", "4300327", "4300329", "4300330", "4300331", "4300332", "4300333",
    "4300335",
    # D-Building Common Zone 3A (10)
    "4300144", "4300135", "4300138", "4300143", "4300141", "4300140", "4300136",
    "4300137", "4300139", "4300145",
    # D-Building Common Zone 3B (11)
    "4300126", "4300201", "4300202", "4300203", "4300204", "4300205", "4300206",
    "4300207", "4300208", "4300209", "4300142",
    # Residential Zone 3A (60)
    "4300010", "4300114", "4300128", "4300030", "4300031", "4300032", "4300033",
    "4300034", "4300035", "4300110", "4300113", "4300013", "4300026", "4300017",
    "4300019", "4300011", "4300014", "4300007", "4300043", "4300003", "4300015",
    "4300115", "4300012", "4300039", "4300016", "4300018", "4300051", "4300117",
    "4300123", "4300040", "4300131", "4300048", "4300041", "4300107", "4300108",
    "4300004", "4300053", "4300061", "4300109", "4300047", "4300021", "4300027",
    "4300028", "4300111", "4300112", "4300121", "4300127", "4300134", "4300106",
    "4300118", "4300022", "4300125", "4300045", "4300046", "4300036", "4300122",
    "4300037", "4300006", "4300055", "4300063",
    # Residential Zone 3B (109)
    "4300132", "4300116", "4300069", "4300042", "4300029", "4300056", "4300008",
    "4300210", "4300211", "4300212", "4300213", "4300214", "4300215", "4300216",
    "4300064", "4300074", "4300217", "4300218", "4300219", "4300220", "4300221",
    "4300222", "4300223", "4300224", "4300225", "4300226", "4300227", "4300071",
    "4300228", "4300229", "4300230", "4300231", "4300232", "4300233", "4300234",
    "4300235", "4300236", "4300237", "4300238", "4300239", "4300240", "4300241",
    "4300242", "4300243", "4300244", "4300245", "4300246", "4300247", "4300248",
    "4300249", "4300250", "4300251", "4300252", "4300253", "4300254", "4300255",
    "4300256", "4300070", "4300257", "4300258", "4300259", "4300260", "4300130",
    "4300261", "4300120", "4300262", "4300263", "4300264", "4300265", "4300266",
    "4300073", "4300267", "4300268", "4300066", "4300269", "4300270", "4300065",
    "4300072", "4300271", "4300272", "4300067", "4300273", "4300068", "4300274",
    "4300275", "4300276", "4300277", "4300278", "4300279", "4300280", "4300281",
    "4300282", "4300283", "4300284", "4300285", "4300286", "4300062", "4300119",
    "4300124", "4300129", "4300133", "4300054",
}

# Late-reporting D-building bulk meters — NULL daily values are expected
D_BUILDING_BULK: set[str] = {
    "4300176", "4300177", "4300178", "4300179", "4300180", "4300181", "4300182",
    "4300183", "4300184", "4300185", "4300186", "4300187", "4300311", "4300312",
    "4300313", "4300314", "4300315", "4300316", "4300317", "4300318", "4300319",
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def resolve_bill_month(override: str | None) -> tuple[str, str, int, int]:
    """Return (mmyyyy, mon_yy, month_int, year_int) for the target bill month."""
    if override:
        if len(override) != 6 or not override.isdigit():
            sys.exit(f"ERROR: --bill-month must be MMYYYY (e.g. 052026), got '{override}'")
        mm, yyyy = int(override[:2]), int(override[2:])
    else:
        today = date.today()
        if today.month == 1:
            mm, yyyy = 12, today.year - 1
        else:
            mm, yyyy = today.month - 1, today.year

    mon_yy = f"{MONTH_NAMES[mm - 1]}-{str(yyyy)[-2:]}"
    mmyyyy = f"{mm:02d}{yyyy}"
    return mmyyyy, mon_yy, mm, yyyy


# ── Grafana fetch ────────────────────────────────────────────────────────────

def fetch_grafana(
    bill_month_mmyyyy: str, last_day: int
) -> dict[str, dict[str, float | None]]:
    """
    Query Grafana's MSSQL datasource via /api/ds/query.

    The underlying table CM_MCT_DLY_READINGS_CSTMR is queried with a PIVOT
    to produce one row per account with day columns '01'–'31'.
    verify=False bypasses Grafana's private CA certificate — safe on a trusted runner.
    """
    day_cols_bracketed = ", ".join(f"[{d:02d}]" for d in range(1, last_day + 1))

    sql = f"""
SELECT ACCOUNT_NUMBER, {day_cols_bracketed}
FROM (
    SELECT
        CAST(ACCOUNT_NUMBER AS VARCHAR(20)) AS ACCOUNT_NUMBER,
        RIGHT('0' + CAST(DAY(READING_DT) AS VARCHAR(2)), 2) AS DAY_COL,
        CONSUMPTION
    FROM [Dashboard_NWS].[dbo].[CM_MCT_DLY_READINGS_CSTMR]
    WHERE BILL_MONTH = '{bill_month_mmyyyy}'
) AS src
PIVOT (
    SUM(CONSUMPTION)
    FOR DAY_COL IN ({day_cols_bracketed})
) AS pvt
ORDER BY ACCOUNT_NUMBER
""".strip()

    payload = {
        "queries": [
            {
                "datasource": {"uid": GRAFANA_DS_UID},
                "rawSql": sql,
                "format": "table",
                "refId": "A",
            }
        ],
        "from": "now-2M",
        "to": "now",
    }

    resp = requests.post(
        f"{GRAFANA_URL}/api/ds/query",
        json=payload,
        auth=(GRAFANA_USER, GRAFANA_PASS),
        headers={"Content-Type": "application/json", "X-Grafana-Org-Id": GRAFANA_ORG_ID},
        verify=False,
        timeout=60,
    )
    if not resp.ok:
        sys.exit(
            f"ERROR: Grafana returned HTTP {resp.status_code}\n{resp.text[:500]}"
        )

    data = resp.json()
    frames = data.get("results", {}).get("A", {}).get("frames", [])
    if not frames:
        sys.exit(
            "ERROR: No frames in Grafana response. "
            "Check GRAFANA_DS_UID and bill month."
        )

    frame = frames[0]
    schema_fields = frame.get("schema", {}).get("fields", [])
    values_array  = frame.get("data",   {}).get("values", [])

    if not schema_fields or not values_array:
        sys.exit("ERROR: Empty schema or values in Grafana frame.")

    field_names = [f.get("name", "") for f in schema_fields]

    try:
        acc_idx = field_names.index("ACCOUNT_NUMBER")
    except ValueError:
        sys.exit(f"ERROR: ACCOUNT_NUMBER column missing. Got columns: {field_names}")

    row_count = len(values_array[acc_idx])
    print(f"  Grafana returned {row_count} rows")

    account_data: dict[str, dict[str, float | None]] = {}
    for r in range(row_count):
        acc = str(values_array[acc_idx][r] or "").strip()
        if not acc or acc not in TRACKED:
            continue
        days: dict[str, float | None] = {}
        for d in range(1, last_day + 1):
            padded = f"{d:02d}"
            try:
                col_idx = field_names.index(padded)
                v = values_array[col_idx][r]
                days[f"day_{d}"] = float(v) if v is not None else None
            except (ValueError, IndexError):
                days[f"day_{d}"] = None
        account_data[acc] = days

    return account_data


# ── Supabase update ──────────────────────────────────────────────────────────

def update_supabase(
    account_data: dict[str, dict[str, float | None]],
    month_label: str,
    year: int,
) -> tuple[int, list[str]]:
    """PATCH water_daily_consumption rows in parallel (20 workers)."""

    rest_url = f"{SUPABASE_URL}/rest/v1/water_daily_consumption"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    now_iso = datetime.utcnow().isoformat() + "Z"

    def patch_one(acc: str, days: dict[str, float | None]) -> tuple[str, str | None]:
        r = requests.patch(
            rest_url,
            params={
                "account_number": f"eq.{acc}",
                "month": f"eq.{month_label}",
                "year": f"eq.{year}",
            },
            json={**days, "updated_at": now_iso},
            headers=headers,
            timeout=30,
        )
        if r.status_code not in (200, 204):
            return acc, f"HTTP {r.status_code}: {r.text[:200]}"
        return acc, None

    updated = 0
    errors: list[str] = []

    with ThreadPoolExecutor(max_workers=20) as pool:
        futures = {
            pool.submit(patch_one, acc, days): acc
            for acc, days in account_data.items()
        }
        for fut in as_completed(futures):
            acc, err = fut.result()
            if err:
                errors.append(f"{acc}: {err}")
            else:
                updated += 1

    return updated, errors


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sync NEC Oman Grafana water consumption → Supabase"
    )
    parser.add_argument(
        "--bill-month",
        default=None,
        metavar="MMYYYY",
        help="Bill month to sync (e.g. 052026). Defaults to the previous calendar month.",
    )
    args = parser.parse_args()

    mmyyyy, mon_yy, mm, yyyy = resolve_bill_month(args.bill_month)
    last_day = calendar.monthrange(yyyy, mm)[1]

    print("=== Water Consumption Sync ===")
    print(f"  Bill month : {mon_yy} ({mmyyyy})")
    print(f"  Last day   : day_{last_day}")
    print(f"  Tracked    : {len(TRACKED)} unique meters")
    print()

    print("→ Fetching from Grafana …")
    account_data = fetch_grafana(mmyyyy, last_day)
    print(f"  Parsed data for {len(account_data)} tracked accounts")
    print()

    print("→ Updating Supabase …")
    updated, errors = update_supabase(account_data, mon_yy, yyyy)

    missing       = sorted(TRACKED - set(account_data.keys()))
    missing_bulk  = [a for a in missing if a in D_BUILDING_BULK]
    missing_other = [a for a in missing if a not in D_BUILDING_BULK]

    print()
    print("=== Sync Report ===")
    print(f"  {'✅' if not errors else '⚠️ '} Bill month synced   : {mon_yy} ({mmyyyy})")
    print(f"  {'✅' if updated == len(account_data) else '⚠️ '} Meters updated      : {updated} of {len(TRACKED)} tracked accounts")
    print(f"  ✅ Days populated      : day_1 … day_{last_day}")
    if missing_bulk:
        print(f"  ⚠️  NULL days (D-building bulk, expected): {', '.join(missing_bulk)}")
    if missing_other:
        print(f"  ⚠️  Missing from Grafana ({len(missing_other)}): {', '.join(missing_other[:20])}")
    if errors:
        print(f"  ✗  Update errors ({len(errors)}):")
        for e in errors[:15]:
            print(f"       {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
