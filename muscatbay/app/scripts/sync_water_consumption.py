#!/usr/bin/env python3
"""
Grafana → Supabase water daily consumption sync.

Queries the NEC Oman Grafana MSSQL datasource for the PIVOT table of daily
readings, maps every account in the TRACKED set, and UPSERTs into
water_daily_consumption via the Supabase REST API.

Environment variables (all required):
  GRAFANA_URL        e.g. https://grafana.nec-oman.com
  GRAFANA_USER       e.g. aalbalushi@muscatbay.com
  GRAFANA_PASS       Grafana password
  GRAFANA_ORG_ID     e.g. 7
  GRAFANA_DS_UID     e.g. esu8hjVHk
  SUPABASE_URL       e.g. https://utnlgeuqajmwibqmdmgt.supabase.co
  SUPABASE_SERVICE_KEY  service_role JWT

Optional:
  BILL_MONTH         Override as MMYYYY, e.g. 052026.  Defaults to previous
                     calendar month relative to today.
"""

import calendar
import json
import os
import sys
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

GRAFANA_URL   = os.environ["GRAFANA_URL"].rstrip("/")
GRAFANA_USER  = os.environ["GRAFANA_USER"]
GRAFANA_PASS  = os.environ["GRAFANA_PASS"]
GRAFANA_ORG   = os.environ["GRAFANA_ORG_ID"]
GRAFANA_DS    = os.environ["GRAFANA_DS_UID"]
SUPABASE_URL  = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY  = os.environ["SUPABASE_SERVICE_KEY"]

WORKERS = 20  # parallel Supabase PATCH workers

MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun",
               "Jul","Aug","Sep","Oct","Nov","Dec"]

# ---------------------------------------------------------------------------
# Tracked account numbers (337 unique)
# ---------------------------------------------------------------------------

TRACKED: set[str] = {
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


# ---------------------------------------------------------------------------
# Month helpers
# ---------------------------------------------------------------------------

def resolve_bill_month(override: str | None) -> tuple[str, str, int, int]:
    """Return (mm_yyyy, mon_yy, year_int, last_day).

    override is MMYYYY, e.g. '052026'.  Default = previous calendar month.
    """
    if override:
        if len(override) != 6 or not override.isdigit():
            raise ValueError(f"BILL_MONTH must be MMYYYY, got: {override!r}")
        mm, yyyy = int(override[:2]), int(override[2:])
    else:
        today = date.today()
        first_of_month = today.replace(day=1)
        prev = first_of_month - timedelta(days=1)
        mm, yyyy = prev.month, prev.year

    last_day = calendar.monthrange(yyyy, mm)[1]
    mon_yy   = f"{MONTH_NAMES[mm - 1]}-{str(yyyy)[2:]}"
    mm_yyyy  = f"{mm:02d}{yyyy}"
    return mm_yyyy, mon_yy, yyyy, last_day


# ---------------------------------------------------------------------------
# Grafana query
# ---------------------------------------------------------------------------

def _basic_auth(user: str, password: str) -> str:
    import base64
    return "Basic " + base64.b64encode(f"{user}:{password}".encode()).decode()


def query_grafana(bill_month: str, last_day: int) -> dict[str, dict[str, float | None]]:
    """Return {account_number: {day_1: v, ..., day_N: v}} from Grafana PIVOT."""

    # Build day columns string for the PIVOT — e.g. [01],[02],...,[31]
    day_cols = ",".join(f"[{d:02d}]" for d in range(1, last_day + 1))

    raw_sql = (
        "SELECT * FROM ("
        "  SELECT ACCOUNT_NUMBER, DAY_NUMBER, DAILY_CONSUMPTION"
        "  FROM Dashboard_NWS.dbo.[CM_MCT_DLY_READINGS_CSTMR]"
        f" WHERE BILL_MONTH = '{bill_month}'"
        ") AS src"
        " PIVOT ("
        "  SUM(DAILY_CONSUMPTION)"
        f" FOR DAY_NUMBER IN ({day_cols})"
        ") AS pvt"
    )

    payload = {
        "queries": [
            {
                "datasourceId": 0,  # ignored when uid is provided
                "uid": GRAFANA_DS,
                "rawSql": raw_sql,
                "format": "table",
            }
        ],
        "from": "now-1y",
        "to": "now",
    }

    url = f"{GRAFANA_URL}/api/ds/query?ds_uid={GRAFANA_DS}"
    body = json.dumps(payload).encode()

    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": _basic_auth(GRAFANA_USER, GRAFANA_PASS),
            "X-Grafana-Org-Id": GRAFANA_ORG,
        },
        method="POST",
    )

    with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
        data = json.loads(resp.read())

    # Navigate to the first frame's fields
    try:
        frames = data["results"][list(data["results"].keys())[0]]["frames"]
        frame  = frames[0]
    except (KeyError, IndexError) as exc:
        raise RuntimeError(f"Unexpected Grafana response structure: {exc}\n{json.dumps(data)[:500]}")

    fields: list[dict] = frame["schema"]["fields"]
    values: list[list] = frame["data"]["values"]

    # Build column-index map
    col_idx: dict[str, int] = {f["name"]: i for i, f in enumerate(fields)}
    if "ACCOUNT_NUMBER" not in col_idx:
        raise RuntimeError(f"ACCOUNT_NUMBER column not found. Columns: {list(col_idx)}")

    acc_col = col_idx["ACCOUNT_NUMBER"]
    row_count = len(values[acc_col])

    account_data: dict[str, dict[str, float | None]] = {}
    for r in range(row_count):
        acc = str(values[acc_col][r] or "").strip()
        if not acc or acc not in TRACKED:
            continue
        days: dict[str, float | None] = {}
        for d in range(1, last_day + 1):
            col_name = f"{d:02d}"
            if col_name in col_idx:
                raw = values[col_idx[col_name]][r]
                days[f"day_{d}"] = float(raw) if raw is not None else None
            else:
                days[f"day_{d}"] = None
        account_data[acc] = days

    return account_data


# ---------------------------------------------------------------------------
# Supabase update
# ---------------------------------------------------------------------------

def patch_account(
    acc: str,
    days: dict[str, float | None],
    mon_yy: str,
    year: int,
) -> tuple[str, str | None]:
    """PATCH one row. Returns (acc, error_message_or_None)."""

    payload = json.dumps(days).encode()
    url = (
        f"{SUPABASE_URL}/rest/v1/water_daily_consumption"
        f"?account_number=eq.{acc}&month=eq.{mon_yy}&year=eq.{year}"
    )
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        method="PATCH",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status not in (200, 204):
                return acc, f"HTTP {resp.status}"
            return acc, None
    except urllib.error.HTTPError as exc:
        body = exc.read(500).decode(errors="replace")
        return acc, f"HTTP {exc.code}: {body}"
    except Exception as exc:
        return acc, str(exc)


def update_supabase(
    account_data: dict[str, dict[str, float | None]],
    mon_yy: str,
    year: int,
) -> tuple[int, list[str]]:
    """Parallel-patch all accounts. Returns (updated_count, error_list)."""
    updated = 0
    errors: list[str] = []

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {
            pool.submit(patch_account, acc, days, mon_yy, year): acc
            for acc, days in account_data.items()
        }
        for fut in as_completed(futures):
            acc, err = fut.result()
            if err:
                errors.append(f"{acc}: {err}")
            else:
                updated += 1

    return updated, errors


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    override = os.environ.get("BILL_MONTH", "").strip() or None
    mm_yyyy, mon_yy, year, last_day = resolve_bill_month(override)

    print(f"=== Grafana → Supabase water consumption sync ===")
    print(f"Bill month : {mon_yy} ({mm_yyyy})  |  Days: 1–{last_day}")
    print(f"Grafana    : {GRAFANA_URL}")
    print(f"Supabase   : {SUPABASE_URL}")
    print(f"Tracked    : {len(TRACKED)} unique accounts")
    print()

    # 1. Query Grafana
    print("Querying Grafana …")
    try:
        account_data = query_grafana(mm_yyyy, last_day)
    except Exception as exc:
        print(f"ERROR querying Grafana: {exc}", file=sys.stderr)
        sys.exit(1)

    found = len(account_data)
    missing = sorted(TRACKED - set(account_data))
    print(f"Grafana returned data for {found} of {len(TRACKED)} tracked accounts.")
    if missing:
        print(f"Missing from Grafana ({len(missing)}): {missing}")
    print()

    if found == 0:
        print("ERROR: No tracked accounts found in Grafana response.", file=sys.stderr)
        sys.exit(1)

    # 2. Update Supabase
    print(f"Updating Supabase with {WORKERS} parallel workers …")
    updated, errors = update_supabase(account_data, mon_yy, year)
    print()

    # 3. Report
    print("=== Sync report ===")
    print(f"✅ Bill month synced   : {mon_yy} ({mm_yyyy})")
    print(f"✅ Meters updated      : {updated} of {len(TRACKED)} tracked accounts")
    print(f"✅ Days populated      : day_1 … day_{last_day}")
    if missing:
        # D-building bulk meters are expected to be late reporters
        dbuilding = {
            "4300176","4300177","4300178","4300179","4300180","4300181","4300182",
            "4300183","4300184","4300185","4300186","4300187","4300311","4300312",
            "4300313","4300314","4300315","4300316","4300317","4300318","4300319",
        }
        expected_missing = [m for m in missing if m in dbuilding]
        unexpected_missing = [m for m in missing if m not in dbuilding]
        if expected_missing:
            print(f"⚠️  Late reporters (D-building bulk, expected): {expected_missing}")
        if unexpected_missing:
            print(f"⚠️  Unexpected missing accounts: {unexpected_missing}")
    if errors:
        print(f"❌ Update errors ({len(errors)}):")
        for e in errors[:20]:
            print(f"   {e}")
        if len(errors) > 20:
            print(f"   … and {len(errors) - 20} more")
        sys.exit(1)
    else:
        print("✅ No update errors")


if __name__ == "__main__":
    main()
