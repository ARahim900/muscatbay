#!/usr/bin/env python3
"""Sync Grafana (NEC Oman) daily water consumption to Supabase water_daily_consumption."""

import os
import sys
import json
import calendar
import argparse
import urllib.request
import urllib.error
import urllib.parse
import base64
import ssl
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Config — all secrets come from environment variables / GitHub Secrets
# ---------------------------------------------------------------------------
GRAFANA_URL    = os.environ["GRAFANA_URL"].rstrip("/")   # https://grafana.nec-oman.com
GRAFANA_USER   = os.environ["GRAFANA_USER"]
GRAFANA_PASS   = os.environ["GRAFANA_PASS"]
GRAFANA_ORG_ID = os.environ.get("GRAFANA_ORG_ID", "7")
GRAFANA_DS_UID = os.environ["GRAFANA_DS_UID"]            # esu8hjVHk
SUPABASE_URL   = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY   = os.environ["SUPABASE_SERVICE_KEY"]      # service_role JWT

WORKERS = 20  # parallel PATCH workers

# ---------------------------------------------------------------------------
# 337 tracked account numbers (deduplicated)
# ---------------------------------------------------------------------------
TRACKED = {
    "C43659",
    "4300296","4300298","4300300","4300301","4300302","4300303","4300304","4300305",
    "4300306","4300307","4300308","4300309","4300310","4300324","4300325","4300337",
    "4300339","4300346",
    "4300002","4300005","4300038","4300044","4300049","4300050","4300052","4300075",
    "4300079","4300081","4300082","4300084","4300085","4300086","4300087","4300089",
    "4300091","4300093","4300095","4300097","4300101","4300176","4300177","4300178",
    "4300179","4300180","4300181","4300182","4300183","4300184","4300185","4300343",
    "4300009","4300020","4300025","4300057","4300060","4300076","4300077","4300078",
    "4300080","4300083","4300088","4300090","4300092","4300094","4300096","4300098",
    "4300099","4300100","4300102","4300103","4300104","4300105","4300186","4300187",
    "4300311","4300312","4300313","4300314","4300315","4300316","4300317","4300318",
    "4300319","4300320","4300344",
    "4300001","4300058","4300059","4300146","4300147","4300148","4300149","4300150",
    "4300151","4300152","4300153","4300154","4300155","4300156","4300157","4300158",
    "4300159","4300160","4300161","4300162","4300163","4300164","4300165","4300166",
    "4300167","4300168","4300169","4300170","4300171","4300172","4300173","4300174",
    "4300175","4300321","4300345",
    "4300023","4300024","4300188","4300189","4300190","4300191","4300192","4300193",
    "4300194","4300195","4300196","4300197","4300198","4300199","4300200","4300287",
    "4300288","4300289","4300290","4300291","4300292","4300293","4300342",
    "4300295","4300328",
    "4300326","4300327","4300329","4300330","4300331","4300332","4300333","4300335",
    "4300144","4300135","4300138","4300143","4300141","4300140","4300136","4300137",
    "4300139","4300145",
    "4300126","4300201","4300202","4300203","4300204","4300205","4300206","4300207",
    "4300208","4300209","4300142",
    "4300010","4300114","4300128","4300030","4300031","4300032","4300033","4300034",
    "4300035","4300110","4300113","4300013","4300026","4300017","4300019","4300011",
    "4300014","4300007","4300043","4300003","4300015","4300115","4300012","4300039",
    "4300016","4300018","4300051","4300117","4300123","4300040","4300131","4300048",
    "4300041","4300107","4300108","4300004","4300053","4300061","4300109","4300047",
    "4300021","4300027","4300028","4300111","4300112","4300121","4300127","4300134",
    "4300106","4300118","4300022","4300125","4300045","4300046","4300036","4300122",
    "4300037","4300006","4300055","4300063",
    "4300132","4300116","4300069","4300042","4300029","4300056","4300008",
    "4300210","4300211","4300212","4300213","4300214","4300215","4300216","4300064",
    "4300074","4300217","4300218","4300219","4300220","4300221","4300222","4300223",
    "4300224","4300225","4300226","4300227","4300071","4300228","4300229","4300230",
    "4300231","4300232","4300233","4300234","4300235","4300236","4300237","4300238",
    "4300239","4300240","4300241","4300242","4300243","4300244","4300245","4300246",
    "4300247","4300248","4300249","4300250","4300251","4300252","4300253","4300254",
    "4300255","4300256","4300070","4300257","4300258","4300259","4300260","4300130",
    "4300261","4300120","4300262","4300263","4300264","4300265","4300266","4300073",
    "4300267","4300268","4300066","4300269","4300270","4300065","4300072","4300271",
    "4300272","4300067","4300273","4300068","4300274","4300275","4300276","4300277",
    "4300278","4300279","4300280","4300281","4300282","4300283","4300284","4300285",
    "4300286","4300062","4300119","4300124","4300129","4300133","4300054",
}

MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def bill_month_parts(mmyyyy: str) -> tuple[str, int, int, int]:
    """Return (month_label, year, month_num, last_day) from e.g. '052026'."""
    mm   = int(mmyyyy[:2])
    yyyy = int(mmyyyy[2:])
    label    = f"{MONTH_NAMES[mm-1]}-{str(yyyy)[2:]}"
    last_day = calendar.monthrange(yyyy, mm)[1]
    return label, yyyy, mm, last_day


def previous_month_mmyyyy() -> str:
    """Return MMYYYY string for the previous calendar month."""
    now  = datetime.now(timezone.utc)
    mm   = now.month - 1 or 12
    yyyy = now.year if now.month > 1 else now.year - 1
    return f"{mm:02d}{yyyy}"


def grafana_query(bill_month_mmyyyy: str, last_day: int) -> dict:
    """Build the Grafana /api/ds/query POST body for the MSSQL PIVOT."""
    day_cols = ", ".join([f"[{d:02d}]" for d in range(1, last_day + 1)])
    pivot_cols = ",\n".join([
        f"    ISNULL([{d:02d}], NULL) AS [{d:02d}]" for d in range(1, last_day + 1)
    ])
    raw_sql = f"""
SELECT ACCOUNT_NUMBER,
{pivot_cols}
FROM (
    SELECT ACCOUNT_NUMBER,
           RIGHT('0' + CAST(DAY(READING_DATE) AS VARCHAR(2)), 2) AS DAY_NUM,
           READING_VALUE
    FROM Dashboard_NWS.dbo.[CM_MCT_DLY_READINGS_CSTMR]
    WHERE BILL_MONTH = '{bill_month_mmyyyy}'
) src
PIVOT (
    SUM(READING_VALUE) FOR DAY_NUM IN ({day_cols})
) pvt
ORDER BY ACCOUNT_NUMBER
"""
    return {
        "queries": [
            {
                "datasourceId": 0,
                "uid": GRAFANA_DS_UID,
                "rawSql": raw_sql.strip(),
                "format": "table",
                "refId": "A",
            }
        ],
        "from": "now-1h",
        "to":   "now",
    }


def fetch_grafana(bill_month_mmyyyy: str, last_day: int) -> list[dict]:
    """
    POST to Grafana /api/ds/query (basic auth, SSL verification disabled
    because grafana.nec-oman.com uses a private CA certificate).
    Returns list of row dicts: {"ACCOUNT_NUMBER": "...", "01": 3.91, ...}
    """
    url  = f"{GRAFANA_URL}/api/ds/query"
    body = json.dumps(grafana_query(bill_month_mmyyyy, last_day)).encode()
    creds = base64.b64encode(f"{GRAFANA_USER}:{GRAFANA_PASS}".encode()).decode()
    headers = {
        "Content-Type":  "application/json",
        "Authorization": f"Basic {creds}",
        "X-Grafana-Org-Id": GRAFANA_ORG_ID,
    }
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode    = ssl.CERT_NONE

    req  = urllib.request.Request(url, data=body, headers=headers, method="POST")
    resp = urllib.request.urlopen(req, context=ctx, timeout=60)
    data = json.loads(resp.read())

    # Grafana data-frame response: results.A.frames[0].schema.fields + data.values
    frames = data.get("results", {}).get("A", {}).get("frames", [])
    if not frames:
        raise ValueError(f"No frames in Grafana response: {json.dumps(data)[:500]}")

    frame   = frames[0]
    fields  = frame["schema"]["fields"]          # [{name:..., type:...}, ...]
    columns = [f["name"] for f in fields]
    rows    = []
    values  = frame["data"]["values"]            # list of column value-arrays

    for i in range(len(values[0])):
        row = {columns[c]: values[c][i] for c in range(len(columns))}
        rows.append(row)

    return rows


def parse_rows(rows: list[dict], last_day: int) -> dict[str, dict]:
    """
    Convert Grafana rows into {account_number: {day_1: v, ..., day_N: v}}.
    Grafana columns are zero-padded strings ("01"…"31"); map to day_1…day_N.
    """
    result: dict[str, dict] = {}
    for row in rows:
        acc = str(row.get("ACCOUNT_NUMBER") or "").strip()
        if not acc or acc not in TRACKED:
            continue
        days: dict = {}
        for d in range(1, last_day + 1):
            col = f"{d:02d}"
            v   = row.get(col)
            days[f"day_{d}"] = float(v) if isinstance(v, (int, float)) and v is not None else None
        result[acc] = days
    return result


def patch_account(account_number: str, payload: dict, month_label: str, year: int) -> tuple[str, str | None]:
    """PATCH one row in Supabase. Returns (account_number, error_message_or_None)."""
    url = (
        f"{SUPABASE_URL}/rest/v1/water_daily_consumption"
        f"?account_number=eq.{urllib.parse.quote(account_number)}"
        f"&month=eq.{urllib.parse.quote(month_label)}"
        f"&year=eq.{year}"
    )
    body = json.dumps(payload).encode()
    headers = {
        "Content-Type":  "application/json",
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer":        "return=minimal",
    }
    req = urllib.request.Request(url, data=body, headers=headers, method="PATCH")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status not in (200, 204):
                return account_number, f"HTTP {resp.status}"
            return account_number, None
    except urllib.error.HTTPError as e:
        body_err = e.read().decode()[:200]
        return account_number, f"HTTP {e.code}: {body_err}"
    except Exception as exc:
        return account_number, str(exc)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--bill-month", default="",
                        help="MMYYYY override, e.g. 052026. Defaults to previous month.")
    args = parser.parse_args()

    mmyyyy = args.bill_month.strip() if args.bill_month else previous_month_mmyyyy()
    if len(mmyyyy) != 6 or not mmyyyy.isdigit():
        print(f"ERROR: Invalid bill month '{mmyyyy}'. Expected MMYYYY.", file=sys.stderr)
        sys.exit(1)

    month_label, year, _mm, last_day = bill_month_parts(mmyyyy)
    print(f"=== Grafana → Supabase water sync ===")
    print(f"Bill month : {month_label} ({mmyyyy})")
    print(f"Days       : 1 … {last_day}")
    print(f"Tracked    : {len(TRACKED)} accounts")
    print()

    # Step 1: fetch from Grafana
    print("Fetching from Grafana …")
    try:
        rows = fetch_grafana(mmyyyy, last_day)
    except Exception as exc:
        print(f"ERROR fetching from Grafana: {exc}", file=sys.stderr)
        sys.exit(1)
    print(f"  Grafana rows returned : {len(rows)}")

    # Step 2: parse & filter to tracked accounts
    account_data = parse_rows(rows, last_day)
    print(f"  Tracked accounts found: {len(account_data)}")

    missing_from_grafana = sorted(TRACKED - set(account_data.keys()))
    if missing_from_grafana:
        print(f"  Missing from Grafana  : {len(missing_from_grafana)}")
        for a in missing_from_grafana[:20]:
            print(f"    {a}")
        if len(missing_from_grafana) > 20:
            print(f"    … and {len(missing_from_grafana) - 20} more")
    print()

    # Step 3: PATCH Supabase in parallel
    now_iso = datetime.now(timezone.utc).isoformat()
    print(f"Patching Supabase ({WORKERS} workers) …")

    updated = 0
    errors: list[tuple[str, str]] = []
    accounts = sorted(account_data.keys())

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {
            pool.submit(
                patch_account,
                acc,
                {**account_data[acc], "updated_at": now_iso},
                month_label,
                year,
            ): acc
            for acc in accounts
        }
        for future in as_completed(futures):
            acc, err = future.result()
            if err:
                errors.append((acc, err))
            else:
                updated += 1

    # Step 4: report
    print()
    print("=== Sync Report ===")
    print(f"✅ Bill month synced   : {month_label} ({mmyyyy})")
    print(f"✅ Meters updated      : {updated} of {len(TRACKED)} tracked accounts")
    print(f"✅ Days populated      : day_1 … day_{last_day}")

    # Spot-check NULL days for D-building bulk meters (expected late reporters)
    d_building_bulk = {
        "4300176","4300177","4300178","4300179","4300180","4300181","4300182",
        "4300183","4300184","4300185","4300186","4300187","4300311","4300312",
        "4300313","4300314","4300315","4300316","4300317","4300318","4300319",
    }
    null_last_day = [
        acc for acc in accounts
        if account_data[acc].get(f"day_{last_day}") is None and acc not in d_building_bulk
    ]
    if null_last_day:
        print(f"⚠️  NULL day_{last_day} (unexpected) : {', '.join(null_last_day[:10])}")
    d_null = [a for a in d_building_bulk if a in account_data and account_data[a].get(f"day_{last_day}") is None]
    if d_null:
        print(f"⚠️  NULL day_{last_day} (D-bulk, expected): {len(d_null)} meters — late daily reporters")

    if missing_from_grafana:
        print(f"⚠️  Missing from Grafana  : {', '.join(missing_from_grafana[:10])}"
              + (f" … (+{len(missing_from_grafana)-10})" if len(missing_from_grafana) > 10 else ""))

    if errors:
        print(f"❌ Supabase update errors: {len(errors)}")
        for acc, msg in errors[:15]:
            print(f"   {acc}: {msg}")
        sys.exit(1)
    else:
        print("✅ No errors")

    print()
    print("Done.")


if __name__ == "__main__":
    main()
