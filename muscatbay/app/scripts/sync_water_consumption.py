#!/usr/bin/env python3
"""
Sync Grafana Daily Water Consumption → Supabase water_daily_consumption

Grafana: grafana.nec-oman.com  (private CA → SSL verification disabled)
Dashboard UID: aMGcGVPHz  (Daily Account Consumption Details)
Datasource UID: esu8hjVHk  (MSSQL → Dashboard_NWS.dbo.[CM_MCT_DLY_READINGS_CSTMR])
Supabase table: water_daily_consumption
Unique key: (account_number, month, year)
"""

import os
import sys
import json
import ssl
import base64
import calendar
import datetime
import urllib.request
import urllib.parse
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

# ── Config ───────────────────────────────────────────────────────────────────
GRAFANA_URL         = os.environ["GRAFANA_URL"].rstrip("/")
GRAFANA_USER        = os.environ["GRAFANA_USER"]
GRAFANA_PASS        = os.environ["GRAFANA_PASS"]
GRAFANA_ORG_ID      = os.environ.get("GRAFANA_ORG_ID", "7")
GRAFANA_DS_UID      = os.environ.get("GRAFANA_DS_UID", "esu8hjVHk")
SUPABASE_URL        = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
BILL_MONTH_OVERRIDE = os.environ.get("BILL_MONTH_OVERRIDE", "").strip()  # MMYYYY or empty

DASHBOARD_UID = "aMGcGVPHz"
WORKERS       = 20
MONTH_NAMES   = ["Jan","Feb","Mar","Apr","May","Jun",
                  "Jul","Aug","Sep","Oct","Nov","Dec"]

# Bypass private CA on grafana.nec-oman.com
_SSL_CTX = ssl.create_default_context()
_SSL_CTX.check_hostname = False
_SSL_CTX.verify_mode = ssl.CERT_NONE

# ── 337 Tracked Accounts ─────────────────────────────────────────────────────
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


# ── Helpers ───────────────────────────────────────────────────────────────────

def _basic_auth_header() -> str:
    token = base64.b64encode(f"{GRAFANA_USER}:{GRAFANA_PASS}".encode()).decode()
    return f"Basic {token}"


def _grafana_get(path: str) -> dict:
    req = urllib.request.Request(
        f"{GRAFANA_URL}{path}",
        headers={
            "Authorization": _basic_auth_header(),
            "X-Grafana-Org-Id": GRAFANA_ORG_ID,
        },
    )
    with urllib.request.urlopen(req, context=_SSL_CTX, timeout=30) as resp:
        return json.loads(resp.read())


def _grafana_post(path: str, payload: dict) -> dict:
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{GRAFANA_URL}{path}",
        data=body,
        headers={
            "Authorization": _basic_auth_header(),
            "X-Grafana-Org-Id": GRAFANA_ORG_ID,
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, context=_SSL_CTX, timeout=60) as resp:
        return json.loads(resp.read())


def resolve_bill_month() -> tuple[int, int, str, int]:
    """Return (mm, yyyy, 'Mon-YY', last_day) for the target bill month."""
    if BILL_MONTH_OVERRIDE:
        mm   = int(BILL_MONTH_OVERRIDE[:2])
        yyyy = int(BILL_MONTH_OVERRIDE[2:])
    else:
        today = datetime.date.today()
        first = today.replace(day=1)
        prev  = first - datetime.timedelta(days=1)
        mm, yyyy = prev.month, prev.year
    last_day = calendar.monthrange(yyyy, mm)[1]
    label    = f"{MONTH_NAMES[mm - 1]}-{str(yyyy)[-2:]}"
    return mm, yyyy, label, last_day


def _search_panels_for_sql(panels: list, bill_month_str: str) -> str | None:
    """Recursively search dashboard panels for a table panel with BillMonth SQL."""
    for panel in panels:
        # Recurse into row/grid panels that contain nested panels
        nested = panel.get("panels", [])
        if nested:
            found = _search_panels_for_sql(nested, bill_month_str)
            if found:
                return found
        for target in panel.get("targets", []):
            sql = target.get("rawSql", "")
            if not sql:
                continue
            sql_upper = sql.upper()
            if "ACCOUNT_NUMBER" in sql_upper and (
                "BILLMONTH" in sql_upper.replace("_", "").replace(" ", "")
                or "BILL_MONTH" in sql_upper
                or "BillMonth".upper() in sql_upper
            ):
                # Substitute all known Grafana variable syntaxes
                for var in ("${BillMonth}", "$BillMonth", "[[BillMonth]]",
                            "${__variable.BillMonth}"):
                    sql = sql.replace(var, bill_month_str)
                print(f"  Using SQL from panel '{panel.get('title', '?')}' (target refId={target.get('refId','?')})")
                return sql
    return None


def get_pivot_sql(bill_month_str: str, last_day: int) -> str:
    """
    Attempt to fetch the PIVOT SQL from the Grafana dashboard, substituting
    the BillMonth variable.  Falls back to a manually constructed query.
    """
    try:
        print("Fetching dashboard SQL from Grafana ...")
        dash_data = _grafana_get(f"/api/dashboards/uid/{DASHBOARD_UID}")
        panels    = dash_data.get("dashboard", {}).get("panels", [])
        sql       = _search_panels_for_sql(panels, bill_month_str)
        if sql:
            return sql
        print("  No matching panel found; using fallback SQL.")
    except Exception as exc:
        print(f"  Dashboard fetch failed ({exc}); using fallback SQL.")

    # Fallback PIVOT — assumes standard column naming in CM_MCT_DLY_READINGS_CSTMR
    day_cols = ", ".join(f"[{str(d).zfill(2)}]" for d in range(1, last_day + 1))
    return f"""
SELECT ACCOUNT_NUMBER, {day_cols}
FROM (
  SELECT CAST(ACCOUNT_NUMBER AS NVARCHAR(50)) AS ACCOUNT_NUMBER,
         FORMAT(READING_DATE, 'dd') AS DayNum,
         CONSUMPTION
  FROM Dashboard_NWS.dbo.[CM_MCT_DLY_READINGS_CSTMR]
  WHERE FORMAT(READING_DATE, 'MMyyyy') = '{bill_month_str}'
) AS src
PIVOT (
  SUM(CONSUMPTION) FOR DayNum IN ({day_cols})
) AS pvt
""".strip()


# ── Grafana query ─────────────────────────────────────────────────────────────

def fetch_grafana_data(
    sql: str,
    mm: int,
    yyyy: int,
    last_day: int,
) -> dict[str, dict[str, float | None]]:
    """
    Execute the PIVOT SQL against the MSSQL datasource and return
    {account_number: {day_1: float|None, ..., day_31: float|None}}.
    Day columns beyond last_day are explicitly set to None.
    """
    from_ms = int(datetime.datetime(yyyy, mm, 1, tzinfo=datetime.timezone.utc).timestamp() * 1000)
    to_ms   = int(datetime.datetime(yyyy, mm, last_day, 23, 59, 59,
                                    tzinfo=datetime.timezone.utc).timestamp() * 1000)

    payload = {
        "queries": [
            {
                "datasource": {"uid": GRAFANA_DS_UID, "type": "mssql"},
                "rawSql": sql,
                "format": "table",
                "refId": "A",
                "intervalMs": 86400000,
                "maxDataPoints": 31,
            }
        ],
        "from": str(from_ms),
        "to": str(to_ms),
    }

    raw    = _grafana_post("/api/ds/query", payload)
    result_a = raw.get("results", {}).get("A", {})

    if "error" in result_a:
        raise RuntimeError(f"Grafana query error: {result_a['error']}")

    frames = result_a.get("frames", [])
    if not frames:
        raise RuntimeError(f"No frames in Grafana response: {json.dumps(raw)[:500]}")

    frame  = frames[0]
    names  = [f["name"] for f in frame["schema"]["fields"]]
    values = frame["data"]["values"]  # list of columns, each a list of row values

    try:
        acc_idx = names.index("ACCOUNT_NUMBER")
    except ValueError:
        raise RuntimeError(f"ACCOUNT_NUMBER not in Grafana columns: {names}")

    row_count   = len(values[acc_idx])
    account_data: dict[str, dict[str, float | None]] = {}

    for r in range(row_count):
        acc = str(values[acc_idx][r] or "").strip()
        if not acc or acc not in TRACKED:
            continue

        days: dict[str, float | None] = {}
        for d in range(1, 32):
            key = f"day_{d}"
            if d > last_day:
                days[key] = None
                continue
            col = str(d).zfill(2)  # "01".."31" — matches PIVOT column names
            try:
                idx = names.index(col)
                v   = values[idx][r]
                days[key] = float(v) if v is not None else None
            except (ValueError, IndexError):
                days[key] = None
        account_data[acc] = days

    return account_data


# ── Supabase PATCH ────────────────────────────────────────────────────────────

def patch_row(
    account: str,
    month_label: str,
    year: int,
    days: dict[str, float | None],
) -> tuple[str, str | None]:
    """PATCH a single row. Returns (account, error_message|None)."""
    url = (
        f"{SUPABASE_URL}/rest/v1/water_daily_consumption"
        f"?account_number=eq.{urllib.parse.quote(account)}"
        f"&month=eq.{urllib.parse.quote(month_label)}"
        f"&year=eq.{year}"
    )
    payload = {**days, "updated_at": datetime.datetime.utcnow().isoformat() + "Z"}
    body    = json.dumps(payload, allow_nan=False).encode()
    headers = {
        "apikey":        SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "return=minimal",
    }
    req = urllib.request.Request(url, data=body, headers=headers, method="PATCH")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status not in (200, 204):
                return account, f"HTTP {resp.status}"
            return account, None
    except urllib.error.HTTPError as exc:
        return account, f"HTTP {exc.code}: {exc.read().decode()[:200]}"
    except Exception as exc:
        return account, str(exc)


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    mm, yyyy, label, last_day = resolve_bill_month()
    bill_month_str = f"{mm:02d}{yyyy}"

    print("=== Grafana → Supabase Water Sync ===")
    print(f"Bill month  : {label} ({bill_month_str}), {last_day} days")
    print(f"Tracked     : {len(TRACKED)} accounts")
    print()

    sql = get_pivot_sql(bill_month_str, last_day)

    print("Querying Grafana datasource ...")
    account_data = fetch_grafana_data(sql, mm, yyyy, last_day)
    print(f"Grafana returned data for {len(account_data)} tracked accounts.")

    missing = sorted(TRACKED - set(account_data.keys()))
    if missing:
        print(f"Missing from Grafana ({len(missing)}): {', '.join(missing[:20])}"
              + (" ..." if len(missing) > 20 else ""))

    print(f"\nUpdating Supabase ({WORKERS} parallel workers) ...")
    errors: list[str] = []
    updated = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futures = {
            ex.submit(patch_row, acc, label, yyyy, days): acc
            for acc, days in account_data.items()
        }
        for fut in as_completed(futures):
            acc, err = fut.result()
            if err:
                errors.append(f"{acc}: {err}")
            else:
                updated += 1

    # D-building bulk meters — expected late reporters
    d_bulk = {
        "4300176","4300177","4300178","4300179","4300180",
        "4300181","4300182","4300183","4300184","4300185",
        "4300186","4300187","4300311","4300312","4300313",
        "4300314","4300315","4300316","4300317","4300318","4300319",
    }

    print()
    print("=== Sync Report ===")
    print(f"✅ Bill month synced   : {label} ({bill_month_str})")
    print(f"✅ Meters updated      : {updated} of {len(TRACKED)} tracked accounts")
    print(f"✅ Days populated      : day_1 … day_{last_day}")
    if missing:
        expected = sorted(set(missing) & d_bulk)
        unexpected = sorted(set(missing) - d_bulk)
        if expected:
            print(f"⚠️  Missing (D-bulk, expected late): {', '.join(expected)}")
        if unexpected:
            print(f"⚠️  Missing (unexpected): {', '.join(unexpected)}")
    if errors:
        print(f"❌ Update errors ({len(errors)}):")
        for e in errors[:15]:
            print(f"   {e}")
        sys.exit(1)
    else:
        print("✅ No update errors")


if __name__ == "__main__":
    main()
