#!/usr/bin/env python3
"""
Sync water daily consumption from Grafana (NEC Oman) to Supabase.

Usage:
  python sync_water_consumption.py [MMYYYY]

  If MMYYYY is omitted, reads BILL_MONTH env var; if that is also absent,
  syncs the previous complete calendar month.
"""

import calendar
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ── Config ────────────────────────────────────────────────────────────────────
GRAFANA_URL    = os.environ["GRAFANA_URL"]
GRAFANA_USER   = os.environ["GRAFANA_USER"]
GRAFANA_PASS   = os.environ["GRAFANA_PASS"]
GRAFANA_ORG_ID = os.environ.get("GRAFANA_ORG_ID", "7")
GRAFANA_DS_UID = os.environ.get("GRAFANA_DS_UID", "esu8hjVHk")
SUPABASE_URL   = os.environ["SUPABASE_URL"]
SUPABASE_KEY   = os.environ["SUPABASE_SERVICE_KEY"]  # service_role JWT

WORKERS = 20

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

_MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]


def resolve_bill_month(override: str | None) -> tuple[str, str, int, int]:
    """Return (mmyyyy, mon_yy, year, last_day)."""
    if override:
        mm, yyyy = int(override[:2]), int(override[2:])
    else:
        today = date.today()
        prev  = (today.replace(day=1) - timedelta(days=1))
        mm, yyyy = prev.month, prev.year
    last_day = calendar.monthrange(yyyy, mm)[1]
    mmyyyy   = f"{mm:02d}{yyyy}"
    mon_yy   = f"{_MONTH_NAMES[mm - 1]}-{str(yyyy)[2:]}"
    return mmyyyy, mon_yy, yyyy, last_day


def fetch_grafana(mmyyyy: str, last_day: int) -> dict[str, dict[str, float | None]]:
    """
    Query Grafana MSSQL datasource and return:
      { account_number: { "day_1": val_or_None, ..., "day_N": val_or_None } }
    """
    day_cols = ", ".join(f"[{d:02d}]" for d in range(1, last_day + 1))
    raw_sql  = (
        f"SELECT ACCOUNT_NUMBER, {day_cols} "
        f"FROM Dashboard_NWS.dbo.[CM_MCT_DLY_READINGS_CSTMR] "
        f"WHERE BillMonth = '{mmyyyy}'"
    )

    payload = {
        "queries": [
            {
                "datasource": {"type": "mssql", "uid": GRAFANA_DS_UID},
                "rawSql": raw_sql,
                "format": "table",
                "refId": "A",
            }
        ],
        "from": "now-2y",
        "to":   "now",
    }

    resp = requests.post(
        f"{GRAFANA_URL}/api/ds/query",
        json=payload,
        auth=(GRAFANA_USER, GRAFANA_PASS),
        headers={
            "X-Grafana-Org-Id": GRAFANA_ORG_ID,
            "Content-Type": "application/json",
        },
        verify=False,
        timeout=120,
    )
    resp.raise_for_status()

    data   = resp.json()
    frames = data.get("results", {}).get("A", {}).get("frames", [])
    if not frames:
        raise ValueError(
            f"No frames returned from Grafana.\nResponse (truncated): {json.dumps(data)[:800]}"
        )

    frame     = frames[0]
    col_names = [f["name"] for f in frame["schema"]["fields"]]
    values    = frame["data"]["values"]

    try:
        acc_idx = col_names.index("ACCOUNT_NUMBER")
    except ValueError:
        raise ValueError(f"ACCOUNT_NUMBER column not found. Columns: {col_names}")

    accounts: dict[str, dict[str, float | None]] = {}
    for r in range(len(values[acc_idx])):
        acc = str(values[acc_idx][r] or "").strip()
        if not acc or acc not in TRACKED:
            continue
        days: dict[str, float | None] = {}
        for d in range(1, last_day + 1):
            col = f"{d:02d}"
            try:
                ci    = col_names.index(col)
                v     = values[ci][r]
                days[f"day_{d}"] = float(v) if v is not None else None
            except (ValueError, IndexError):
                days[f"day_{d}"] = None
        accounts[acc] = days

    return accounts


def patch_supabase(
    acc: str,
    payload: dict,
    mon_yy: str,
    year: int,
) -> str | None:
    """PATCH one row in water_daily_consumption. Returns an error string or None."""
    resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/water_daily_consumption",
        json=payload,
        params={
            "account_number": f"eq.{acc}",
            "month":          f"eq.{mon_yy}",
            "year":           f"eq.{year}",
        },
        headers={
            "apikey":        SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type":  "application/json",
            "Prefer":        "return=minimal",
        },
        timeout=30,
    )
    if not resp.ok:
        return f"{acc}: HTTP {resp.status_code} — {resp.text[:200]}"
    return None


def main() -> None:
    cli_arg  = (sys.argv[1] if len(sys.argv) > 1 else None) or None
    env_arg  = os.environ.get("BILL_MONTH") or None
    override = cli_arg or env_arg

    mmyyyy, mon_yy, year, last_day = resolve_bill_month(override)

    print("─── Grafana → Supabase water sync ──────────────────────────────")
    print(f"Bill month : {mon_yy}  ({mmyyyy})  |  days: 1–{last_day}")
    print(f"Grafana    : {GRAFANA_URL}")
    print(f"Supabase   : {SUPABASE_URL}")
    print()

    print("Step 1/3  Querying Grafana …")
    accounts = fetch_grafana(mmyyyy, last_day)
    print(f"          Rows matched (tracked): {len(accounts)}")
    missing_from_grafana = sorted(TRACKED - set(accounts.keys()))
    if missing_from_grafana:
        print(f"          Missing from Grafana   : {missing_from_grafana}")

    print("Step 2/3  Patching Supabase …")
    errors:  list[str] = []
    updated: int       = 0

    def do_patch(acc: str) -> str | None:
        row = {**accounts[acc], "month": mon_yy, "year": year}
        return patch_supabase(acc, row, mon_yy, year)

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(do_patch, acc): acc for acc in accounts}
        for fut in as_completed(futures):
            err = fut.result()
            if err:
                errors.append(err)
            else:
                updated += 1

    print(f"          Updated : {updated}")
    if errors:
        print(f"          Errors  : {len(errors)}")
        for e in errors[:15]:
            print(f"            {e}")

    print()
    print("─── Sync report ────────────────────────────────────────────────")
    print(f"✅ Bill month synced   : {mon_yy} ({mmyyyy})")
    print(f"✅ Meters updated      : {updated} of {len(TRACKED)} tracked accounts")
    print(f"✅ Days populated      : day_1 … day_{last_day}")
    if missing_from_grafana:
        print(f"⚠️  Missing from Grafana: {missing_from_grafana}")
    if errors:
        print(f"❌ Update errors       : {len(errors)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
