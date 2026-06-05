"""
Grafana (NEC Oman) → Supabase water_daily_consumption sync script.

Usage:
  python sync_water_consumption.py [MMYYYY]

If MMYYYY is omitted the previous calendar month is used.

Environment variables (all required):
  GRAFANA_URL       https://grafana.nec-oman.com
  GRAFANA_USER      Grafana username
  GRAFANA_PASS      Grafana password
  GRAFANA_ORG_ID    Grafana org id (7)
  GRAFANA_DS_UID    Datasource UID (esu8hjVHk)
  SUPABASE_URL      https://utnlgeuqajmwibqmdmgt.supabase.co
  SUPABASE_SERVICE_KEY  service_role JWT
"""

import os
import sys
import json
import calendar
import datetime
import concurrent.futures
import urllib.request
import urllib.error
import urllib.parse
import ssl
import base64

# ---------------------------------------------------------------------------
# Tracked meters — 337 unique accounts
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

MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

# Disable SSL verification for Grafana's private CA
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def resolve_bill_month(arg):
    """Return (bill_month_mmyyyy, month_label, year, last_day)."""
    if arg:
        raw = arg.strip()
        if len(raw) != 6 or not raw.isdigit():
            raise ValueError(f"Expected MMYYYY, got: {raw!r}")
        mm = int(raw[:2])
        yyyy = int(raw[2:])
    else:
        today = datetime.date.today()
        first = today.replace(day=1)
        prev = first - datetime.timedelta(days=1)
        mm, yyyy = prev.month, prev.year
    last_day = calendar.monthrange(yyyy, mm)[1]
    month_label = f"{MONTH_NAMES[mm - 1]}-{str(yyyy)[2:]}"
    return f"{mm:02d}{yyyy}", month_label, yyyy, last_day


def grafana_query(grafana_url, user, password, org_id, ds_uid, bill_month):
    """POST to Grafana datasource query API and return parsed JSON."""
    url = f"{grafana_url.rstrip('/')}/api/ds/query"
    credentials = base64.b64encode(f"{user}:{password}".encode()).decode()
    payload = {
        "queries": [
            {
                "refId": "A",
                "datasourceId": ds_uid,
                "rawSql": (
                    f"SELECT * FROM Dashboard_NWS.dbo.[CM_MCT_DLY_READINGS_CSTMR] "
                    f"WHERE BILL_MONTH = '{bill_month}'"
                ),
                "format": "table",
            }
        ],
        "from": "now-1y",
        "to": "now",
    }
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Basic {credentials}",
            "X-Grafana-Org-Id": org_id,
        },
        method="POST",
    )
    with urllib.request.urlopen(req, context=SSL_CTX, timeout=120) as resp:
        return json.loads(resp.read())


def parse_grafana_response(data, last_day):
    """Extract per-account day readings from Grafana table response."""
    results = data.get("results", {})
    frame_data = None
    for ref in results.values():
        frames = ref.get("frames", [])
        if frames:
            frame_data = frames[0]
            break
    if not frame_data:
        raise ValueError("No frames in Grafana response")

    schema_fields = frame_data["schema"]["fields"]
    value_data = frame_data["data"]["values"]

    col_index = {f["name"]: i for i, f in enumerate(schema_fields)}

    if "ACCOUNT_NUMBER" not in col_index:
        raise ValueError("ACCOUNT_NUMBER column not found in Grafana response")

    acc_col = col_index["ACCOUNT_NUMBER"]
    row_count = len(value_data[acc_col])
    account_data = {}

    for r in range(row_count):
        acc = str(value_data[acc_col][r] or "").strip()
        if not acc or acc not in TRACKED:
            continue
        days = {}
        for d in range(1, last_day + 1):
            col_name = f"{d:02d}"
            if col_name in col_index:
                raw = value_data[col_index[col_name]][r]
                days[f"day_{d}"] = float(raw) if raw is not None else None
            else:
                days[f"day_{d}"] = None
        account_data[acc] = days

    return account_data


def supabase_patch(supabase_url, service_key, account_number, month_label, year,
                   day_data, updated_at):
    """PATCH a single row; returns error message or None on success."""
    url = (
        f"{supabase_url.rstrip('/')}/rest/v1/water_daily_consumption"
        f"?account_number=eq.{urllib.parse.quote(account_number)}"
        f"&month=eq.{urllib.parse.quote(month_label)}"
        f"&year=eq.{year}"
    )
    payload = {**day_data, "updated_at": updated_at}
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Prefer": "return=minimal",
        },
        method="PATCH",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status not in (200, 204):
                return f"HTTP {resp.status}"
            return None
    except urllib.error.HTTPError as e:
        body_text = e.read().decode(errors="replace")[:200]
        return f"HTTP {e.code}: {body_text}"
    except Exception as exc:
        return str(exc)


def main():
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    bill_month, month_label, year, last_day = resolve_bill_month(arg)

    grafana_url = os.environ["GRAFANA_URL"]
    grafana_user = os.environ["GRAFANA_USER"]
    grafana_pass = os.environ["GRAFANA_PASS"]
    grafana_org = os.environ.get("GRAFANA_ORG_ID", "7")
    grafana_ds = os.environ["GRAFANA_DS_UID"]
    supabase_url = os.environ["SUPABASE_URL"]
    service_key = os.environ["SUPABASE_SERVICE_KEY"]

    print("=== Muscat Bay Water Consumption Sync ===")
    print(f"Bill month : {bill_month}  ({month_label}, {year})")
    print(f"Last day   : {last_day}")
    print(f"Tracked    : {len(TRACKED)} unique meters")
    print()

    # --- Step 1: Fetch from Grafana ---
    print("Querying Grafana...")
    try:
        raw = grafana_query(grafana_url, grafana_user, grafana_pass,
                            grafana_org, grafana_ds, bill_month)
    except Exception as exc:
        print(f"ERROR: Grafana query failed — {exc}")
        sys.exit(1)

    # --- Step 2: Parse ---
    print("Parsing response...")
    try:
        account_data = parse_grafana_response(raw, last_day)
    except Exception as exc:
        print(f"ERROR: Parse failed — {exc}")
        sys.exit(1)

    found = len(account_data)
    missing_from_grafana = sorted(TRACKED - set(account_data))
    print(f"Accounts found in Grafana : {found}")
    if missing_from_grafana:
        print(f"Missing from Grafana ({len(missing_from_grafana)}): {missing_from_grafana}")
    print()

    # --- Step 3: PATCH to Supabase (20 parallel workers) ---
    print("Upserting to Supabase...")
    updated_at = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    errors = []
    updated = 0

    def patch_one(acc):
        err = supabase_patch(supabase_url, service_key, acc, month_label,
                             year, account_data[acc], updated_at)
        return acc, err

    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
        futures = {pool.submit(patch_one, acc): acc for acc in account_data}
        for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
            acc, err = future.result()
            if err:
                errors.append(f"{acc}: {err}")
                print(f"  [{i}/{found}] FAIL {acc}: {err}")
            else:
                updated += 1
                if i % 50 == 0 or i == found:
                    print(f"  [{i}/{found}] updated {updated} so far...")

    # --- Report ---
    print()
    print("=== Sync Report ===")
    status = "OK" if not errors else "WARN"
    print(f"[{status}] Bill month synced   : {month_label} ({bill_month})")
    print(f"[{'OK' if updated == len(TRACKED) else 'WARN'}] Meters updated      : {updated} of {len(TRACKED)} tracked accounts")
    print(f"[OK] Days populated      : day_1 ... day_{last_day}")

    if missing_from_grafana:
        d_building_bulk = {
            '4300176','4300177','4300178','4300179','4300180','4300181','4300182',
            '4300183','4300184','4300185','4300186','4300187','4300311','4300312',
            '4300313','4300314','4300315','4300316','4300317','4300318','4300319',
        }
        expected_late = [a for a in missing_from_grafana if a in d_building_bulk]
        unexpected = [a for a in missing_from_grafana if a not in d_building_bulk]
        if expected_late:
            print(f"[WARN] NULL (expected late reporters): {expected_late}")
        if unexpected:
            print(f"[WARN] NULL (unexpected missing)      : {unexpected}")

    if errors:
        print(f"[FAIL] Update errors ({len(errors)}): {errors[:15]}")
        sys.exit(1)
    else:
        print("[OK] No errors.")


if __name__ == "__main__":
    main()
