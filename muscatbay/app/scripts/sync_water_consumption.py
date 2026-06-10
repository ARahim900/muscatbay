#!/usr/bin/env python3
"""
Sync Grafana water consumption → Supabase water_daily_consumption.

Usage:
    python sync_water_consumption.py [MMYYYY]

If MMYYYY is omitted, syncs the previous complete calendar month.

Required environment variables:
    GRAFANA_URL          e.g. https://grafana.nec-oman.com
    GRAFANA_USER         Grafana login username
    GRAFANA_PASS         Grafana login password
    GRAFANA_ORG_ID       Grafana organisation ID (e.g. 7)
    GRAFANA_DS_UID       Datasource UID (e.g. esu8hjVHk)
    SUPABASE_URL         e.g. https://<project>.supabase.co
    SUPABASE_SERVICE_KEY service_role JWT
"""

import os
import sys
import json
import calendar
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta

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
    '4300144','4300135','4300138','4300143','4300141','4300140','4300136','4300137',
    '4300139','4300145',
    # D-Building Common Zone 3B (11)
    '4300126','4300201','4300202','4300203','4300204','4300205','4300206','4300207',
    '4300208','4300209','4300142',
    # Residential Zone 3A (60)
    '4300010','4300114','4300128','4300030','4300031','4300032','4300033','4300034',
    '4300035','4300110','4300113','4300013','4300026','4300017','4300019','4300011',
    '4300014','4300007','4300043','4300003','4300015','4300115','4300012','4300039',
    '4300016','4300018','4300051','4300117','4300123','4300040','4300131','4300048',
    '4300041','4300107','4300108','4300004','4300053','4300061','4300109','4300047',
    '4300021','4300027','4300028','4300111','4300112','4300121','4300127','4300134',
    '4300106','4300118','4300022','4300125','4300045','4300046','4300036','4300122',
    '4300037','4300006','4300055','4300063',
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

MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun',
               'Jul','Aug','Sep','Oct','Nov','Dec']

WORKERS = 20


def parse_bill_month(mmyyyy: str) -> tuple[int, int]:
    """Return (month_int, year_int) from 'MMYYYY' string."""
    if len(mmyyyy) != 6 or not mmyyyy.isdigit():
        raise ValueError(f"Expected MMYYYY format, got: {mmyyyy!r}")
    mm, yyyy = int(mmyyyy[:2]), int(mmyyyy[4:])
    if not (1 <= mm <= 12):
        raise ValueError(f"Month {mm} out of range")
    return mm, yyyy


def previous_month() -> tuple[int, int]:
    """Return (month, year) for the previous complete calendar month."""
    today = date.today()
    first_of_this = today.replace(day=1)
    last_month_last = first_of_this - timedelta(days=1)
    return last_month_last.month, last_month_last.year


def month_label(mm: int, yyyy: int) -> str:
    """Return Supabase month string e.g. 'May-26'."""
    return f"{MONTH_NAMES[mm-1]}-{str(yyyy)[-2:]}"


def query_grafana(grafana_url: str, user: str, password: str,
                  org_id: str, ds_uid: str,
                  mm: int, yyyy: int, last_day: int) -> dict[str, dict[str, float | None]]:
    """
    Query Grafana datasource for all daily readings for the given month.
    Returns {account_number: {day_1: float|None, ..., day_N: float|None}}.
    """
    bill_month = f"{mm:02d}{yyyy}"

    # Build the day columns for the PIVOT
    day_cols = ", ".join(
        f"[{str(d).zfill(2)}]" for d in range(1, last_day + 1)
    )
    raw_sql = f"""
SELECT *
FROM (
    SELECT ACCOUNT_NUMBER, DAY_OF_MONTH, READING
    FROM [CM_MCT_DLY_READINGS_CSTMR]
    WHERE BILL_MONTH = '{bill_month}'
) src
PIVOT (
    MAX(READING)
    FOR DAY_OF_MONTH IN ({day_cols})
) pvt
ORDER BY ACCOUNT_NUMBER
""".strip()

    payload = {
        "queries": [
            {
                "refId": "A",
                "datasourceId": ds_uid,
                "rawSql": raw_sql,
                "format": "table",
            }
        ],
        "from": "now-1h",
        "to": "now",
    }

    headers = {
        "Content-Type": "application/json",
        "X-Grafana-Org-Id": str(org_id),
    }

    resp = requests.post(
        f"{grafana_url}/api/ds/query",
        json=payload,
        headers=headers,
        auth=(user, password),
        verify=False,
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()

    # Parse the Grafana table response
    results = data.get("results", {})
    frame_data = results.get("A", {})
    frames = frame_data.get("frames", [])
    if not frames:
        raise RuntimeError("No frames returned from Grafana query")

    frame = frames[0]
    schema_fields = frame["schema"]["fields"]
    values_list = frame["data"]["values"]

    # Build column-name → index mapping
    col_index: dict[str, int] = {f["name"]: i for i, f in enumerate(schema_fields)}

    acc_idx = col_index.get("ACCOUNT_NUMBER")
    if acc_idx is None:
        raise RuntimeError("ACCOUNT_NUMBER column not found in Grafana response")

    row_count = len(values_list[acc_idx])
    account_data: dict[str, dict[str, float | None]] = {}

    for r in range(row_count):
        acc = str(values_list[acc_idx][r] or "").strip()
        if not acc or acc not in TRACKED:
            continue

        days: dict[str, float | None] = {}
        for d in range(1, last_day + 1):
            col_name = str(d).zfill(2)  # '01'..'31'
            idx = col_index.get(col_name)
            if idx is None:
                days[f"day_{d}"] = None
            else:
                v = values_list[idx][r]
                days[f"day_{d}"] = float(v) if v is not None else None

        account_data[acc] = days

    return account_data


def update_supabase(
    supabase_url: str,
    service_key: str,
    account_data: dict[str, dict[str, float | None]],
    month_str: str,
    year: int,
) -> tuple[int, list[str]]:
    """
    PATCH each account's row in water_daily_consumption.
    Returns (updated_count, error_list).
    """
    rest_url = f"{supabase_url}/rest/v1/water_daily_consumption"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    updated = 0
    errors: list[str] = []

    def patch_account(acc: str) -> tuple[bool, str]:
        body = {**account_data[acc]}
        params = {
            "account_number": f"eq.{acc}",
            "month": f"eq.{month_str}",
            "year": f"eq.{year}",
        }
        r = requests.patch(rest_url, json=body, headers=headers,
                           params=params, timeout=30)
        if r.status_code in (200, 204):
            return True, ""
        return False, f"{acc}: HTTP {r.status_code} — {r.text[:200]}"

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(patch_account, acc): acc
                   for acc in account_data}
        for future in as_completed(futures):
            ok, msg = future.result()
            if ok:
                updated += 1
            else:
                errors.append(msg)

    return updated, errors


def main() -> None:
    # --- Resolve bill month ---
    if len(sys.argv) > 1:
        mm, yyyy = parse_bill_month(sys.argv[1])
    else:
        mm, yyyy = previous_month()

    last_day = calendar.monthrange(yyyy, mm)[1]
    month_str = month_label(mm, yyyy)
    bill_month_str = f"{mm:02d}{yyyy}"

    print(f"=== Sync water consumption: {month_str} ({bill_month_str}) ===")
    print(f"    Last day of month: {last_day}")
    print(f"    Tracked accounts : {len(TRACKED)}")

    # --- Read env vars ---
    grafana_url  = os.environ["GRAFANA_URL"].rstrip("/")
    grafana_user = os.environ["GRAFANA_USER"]
    grafana_pass = os.environ["GRAFANA_PASS"]
    grafana_org  = os.environ["GRAFANA_ORG_ID"]
    grafana_ds   = os.environ["GRAFANA_DS_UID"]
    supa_url     = os.environ["SUPABASE_URL"].rstrip("/")
    supa_key     = os.environ["SUPABASE_SERVICE_KEY"]

    # --- Step 1: Query Grafana ---
    print("\n[1/3] Querying Grafana ...")
    t0 = time.time()
    account_data = query_grafana(
        grafana_url, grafana_user, grafana_pass,
        grafana_org, grafana_ds,
        mm, yyyy, last_day,
    )
    print(f"      Grafana returned data for {len(account_data)} tracked accounts  "
          f"({time.time()-t0:.1f}s)")

    missing_from_grafana = sorted(TRACKED - set(account_data.keys()))
    if missing_from_grafana:
        print(f"      ⚠  Missing from Grafana ({len(missing_from_grafana)}): "
              f"{', '.join(missing_from_grafana[:20])}"
              f"{'...' if len(missing_from_grafana) > 20 else ''}")

    # --- Step 2: Push to Supabase ---
    print("\n[2/3] Pushing to Supabase ...")
    t1 = time.time()
    updated, errors = update_supabase(supa_url, supa_key, account_data, month_str, yyyy)
    print(f"      Updated {updated} rows  ({time.time()-t1:.1f}s)")
    if errors:
        print(f"      ⚠  {len(errors)} update errors:")
        for e in errors[:15]:
            print(f"         {e}")

    # --- Step 3: Report ---
    print("\n[3/3] Sync report")
    print("─" * 50)
    print(f"✅ Bill month synced   : {month_str} ({bill_month_str})")
    print(f"✅ Meters updated      : {updated} of {len(TRACKED)} tracked accounts")
    print(f"✅ Days populated      : day_1 … day_{last_day}")

    # D-building bulk late reporters
    d_bulk = {
        '4300176','4300177','4300178','4300179','4300180',
        '4300181','4300182','4300183','4300184','4300185',
        '4300186','4300187','4300311','4300312','4300313',
        '4300314','4300315','4300316','4300317','4300318','4300319',
    }
    null_day_accounts = [
        acc for acc, days in account_data.items()
        if all(v is None for v in days.values())
    ]
    if null_day_accounts:
        d_bulk_nulls = [a for a in null_day_accounts if a in d_bulk]
        other_nulls  = [a for a in null_day_accounts if a not in d_bulk]
        if d_bulk_nulls:
            print(f"⚠️  All-NULL (D-building bulk, expected): {', '.join(sorted(d_bulk_nulls))}")
        if other_nulls:
            print(f"⚠️  All-NULL (unexpected): {', '.join(sorted(other_nulls))}")

    if missing_from_grafana:
        print(f"⚠️  Missing from Grafana: {', '.join(missing_from_grafana)}")

    if errors:
        print(f"❌ Supabase update errors: {len(errors)}")
        sys.exit(1)
    else:
        print("✅ No errors")


if __name__ == "__main__":
    main()
