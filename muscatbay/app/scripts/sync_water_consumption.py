#!/usr/bin/env python3
"""
sync_water_consumption.py
Full pipeline: Grafana NEC Oman → Supabase water_daily_consumption

Reads configuration from environment variables (set as GitHub Secrets):
  GRAFANA_URL          https://grafana.nec-oman.com
  GRAFANA_USER         aalbalushi@muscatbay.com
  GRAFANA_PASS         (password)
  GRAFANA_ORG_ID       7
  GRAFANA_DS_UID       esu8hjVHk
  SUPABASE_URL         https://utnlgeuqajmwibqmdmgt.supabase.co
  SUPABASE_SERVICE_KEY (service role JWT)
  BILL_MONTH_OVERRIDE  optional MMYYYY override (e.g. "052026")

Run locally:  python3 sync_water_consumption.py
Run via CI:   triggered by GitHub Actions workflow
"""

import os
import sys
import json
import calendar
import requests
from datetime import date, datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# ── Configuration from environment ────────────────────────────────────────────
GRAFANA_URL  = os.environ.get('GRAFANA_URL',  'https://grafana.nec-oman.com')
GRAFANA_USER = os.environ.get('GRAFANA_USER', '')
GRAFANA_PASS = os.environ.get('GRAFANA_PASS', '')
GRAFANA_ORG  = os.environ.get('GRAFANA_ORG_ID', '7')
DS_UID       = os.environ.get('GRAFANA_DS_UID',  'esu8hjVHk')
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://utnlgeuqajmwibqmdmgt.supabase.co')
SERVICE_KEY  = os.environ.get('SUPABASE_SERVICE_KEY', '')

if not GRAFANA_USER or not GRAFANA_PASS or not SERVICE_KEY:
    print('ERROR: GRAFANA_USER, GRAFANA_PASS, and SUPABASE_SERVICE_KEY must be set.')
    sys.exit(1)

# ── Calculate bill month ───────────────────────────────────────────────────────
MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

override = os.environ.get('BILL_MONTH_OVERRIDE', '').strip()
if override and len(override) == 6:
    mm   = int(override[:2])
    yyyy = int(override[2:])
else:
    # Default: previous month (so running on the 2nd always captures last month fully)
    today = date.today()
    if today.month == 1:
        mm, yyyy = 12, today.year - 1
    else:
        mm, yyyy = today.month - 1, today.year

BILL_MONTH  = f'{mm:02d}{yyyy}'               # e.g. '052026'
MONTH_LABEL = f'{MONTH_NAMES[mm-1]}-{str(yyyy)[2:]}'  # e.g. 'May-26'
YEAR        = yyyy
LAST_DAY    = calendar.monthrange(yyyy, mm)[1]  # last day of that month

print(f'Bill month : {BILL_MONTH}  →  Supabase: {MONTH_LABEL} / {YEAR}')
print(f'Populating : day_1 … day_{LAST_DAY}')

# ── 337 unique tracked accounts ───────────────────────────────────────────────
TRACKED = sorted(set([
    'C43659',
    # Zone FM
    '4300296','4300298','4300300','4300301','4300302','4300303','4300304','4300305',
    '4300306','4300307','4300308','4300309','4300310','4300324','4300325','4300337','4300339','4300346',
    # Zone 3A
    '4300002','4300005','4300038','4300044','4300049','4300050','4300052','4300075',
    '4300079','4300081','4300082','4300084','4300085','4300086','4300087','4300089',
    '4300091','4300093','4300095','4300097','4300101','4300176','4300177','4300178',
    '4300179','4300180','4300181','4300182','4300183','4300184','4300185','4300343',
    # Zone 3B
    '4300009','4300020','4300025','4300057','4300060','4300076','4300077','4300078',
    '4300080','4300083','4300088','4300090','4300092','4300094','4300096','4300098',
    '4300099','4300100','4300102','4300103','4300104','4300105','4300186','4300187',
    '4300311','4300312','4300313','4300314','4300315','4300316','4300317','4300318','4300319','4300320','4300344',
    # Zone 5
    '4300001','4300058','4300059','4300146','4300147','4300148','4300149','4300150',
    '4300151','4300152','4300153','4300154','4300155','4300156','4300157','4300158',
    '4300159','4300160','4300161','4300162','4300163','4300164','4300165','4300166',
    '4300167','4300168','4300169','4300170','4300171','4300172','4300173','4300174','4300175','4300321','4300345',
    # Zone 8
    '4300023','4300024','4300188','4300189','4300190','4300191','4300192','4300193',
    '4300194','4300195','4300196','4300197','4300198','4300199','4300200','4300287',
    '4300288','4300289','4300290','4300291','4300292','4300293','4300342',
    # Zone SC
    '4300295','4300328',
    # Village Square
    '4300326','4300327','4300329','4300330','4300331','4300332','4300333','4300335',
    # L4 D-Building Common Zone 3A
    '4300144','4300135','4300138','4300143','4300141','4300140','4300136','4300137','4300139','4300145',
    # L4 D-Building Common Zone 3B
    '4300126','4300201','4300202','4300203','4300204','4300205','4300206','4300207','4300208','4300209','4300142',
    # L4 Residential Zone 3A
    '4300010','4300114','4300128','4300030','4300031','4300032','4300033','4300034','4300035','4300110',
    '4300113','4300013','4300026','4300017','4300019','4300011','4300014','4300007','4300043','4300003',
    '4300015','4300115','4300012','4300039','4300016','4300018','4300051','4300117','4300123','4300040',
    '4300131','4300048','4300041','4300107','4300108','4300004','4300053','4300061','4300109','4300047',
    '4300021','4300027','4300028','4300111','4300112','4300121','4300127','4300134','4300106','4300118',
    '4300022','4300125','4300045','4300046','4300036','4300122','4300037','4300006','4300055','4300063',
    # L4 Residential Zone 3B
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
]))

# ── Step 1: Fetch from Grafana ─────────────────────────────────────────────────
print('\n─── Fetching from Grafana ───')

raw_sql = (
    "Select * from (select ACCOUNT_NUMBER, ADDRESS, READING_MNTH, "
    "format(reading_date,'dd') reading_day, SUM(CONSUMPTION) CONSUMPTION "
    "from Dashboard_NWS.dbo.[CM_MCT_DLY_READINGS_CSTMR] "
    f"where reading_mnth={BILL_MONTH} "
    "group by ACCOUNT_NUMBER, CUSTOMER_NAME, ADDRESS, "
    "format(reading_date,'dd'), READING_MNTH) MAIN "
    "PIVOT (SUM(CONSUMPTION) for reading_day in "
    "([01],[02],[03],[04],[05],[06],[07],[08],[09],[10],[11],[12],"
    "[13],[14],[15],[16],[17],[18],[19],[20],[21],[22],[23],[24],"
    "[25],[26],[27],[28],[29],[30],[31])) PVTMAIN"
)

payload = {
    'queries': [{
        'datasource': {'type': 'mssql', 'uid': DS_UID},
        'format': 'table',
        'rawSql': raw_sql,
        'refId': 'A',
    }],
    'from': '1605429966952',
    'to':   '1859887566952',
}

resp = requests.post(
    f'{GRAFANA_URL}/api/ds/query',
    json=payload,
    auth=(GRAFANA_USER, GRAFANA_PASS),
    headers={'Content-Type': 'application/json', 'X-Grafana-Org-Id': GRAFANA_ORG},
    verify=False,   # Grafana uses a private CA not trusted by default trust stores
    timeout=90,
)

if resp.status_code != 200:
    print(f'ERROR: Grafana returned HTTP {resp.status_code}')
    print(resp.text[:600])
    sys.exit(1)

data   = resp.json()
frames = data.get('results', {}).get('A', {}).get('frames', [])
if not frames:
    print('ERROR: No frames in Grafana response')
    sys.exit(1)

frame      = frames[0]
field_names = [f['name'] for f in frame['schema']['fields']]
values      = frame['data']['values']
row_count   = len(values[0]) if values else 0
print(f'  Grafana rows: {row_count}')

# Build lookup: account_number → row dict
grafana_lookup: dict[str, dict] = {}
for r in range(row_count):
    row = {field_names[i]: values[i][r] for i in range(len(field_names))}
    acc = str(row.get('ACCOUNT_NUMBER', ''))
    if acc:
        grafana_lookup[acc] = row

# ── Step 2: Extract account → daily values ─────────────────────────────────────
print('\n─── Extracting account data ───')

account_data: dict[str, dict] = {}
missing: list[str] = []

for acc in TRACKED:
    if acc not in grafana_lookup:
        missing.append(acc)
        continue
    row  = grafana_lookup[acc]
    days = {}
    for d in range(1, LAST_DAY + 1):
        col = str(d).zfill(2)          # '01'..'31' as returned by Grafana PIVOT
        val = row.get(col)
        days[f'day_{d}'] = val          # None → NULL in Supabase
    account_data[acc] = days

print(f'  Found : {len(account_data)} / {len(TRACKED)} tracked accounts')
if missing:
    print(f'  Missing from Grafana: {missing}')

# ── Step 3: Update Supabase (parallel PATCH requests) ─────────────────────────
print('\n─── Updating Supabase ───')

sb_headers = {
    'apikey':        SERVICE_KEY,
    'Authorization': f'Bearer {SERVICE_KEY}',
    'Content-Type':  'application/json',
    'Prefer':        'return=minimal',
}
now_iso = datetime.utcnow().isoformat() + 'Z'

def update_account(acc: str, days: dict) -> tuple[str, int, str]:
    payload = {**days, 'updated_at': now_iso}
    r = requests.patch(
        f'{SUPABASE_URL}/rest/v1/water_daily_consumption',
        params={
            'account_number': f'eq.{acc}',
            'month':          f'eq.{MONTH_LABEL}',
            'year':           f'eq.{YEAR}',
        },
        json=payload,
        headers=sb_headers,
        timeout=30,
    )
    return acc, r.status_code, r.text[:200] if r.status_code not in (200, 204) else ''

updated   = 0
sb_errors = []

with ThreadPoolExecutor(max_workers=20) as pool:
    futures = {pool.submit(update_account, acc, days): acc for acc, days in account_data.items()}
    done = 0
    for future in as_completed(futures):
        acc, status, body = future.result()
        done += 1
        if status in (200, 204):
            updated += 1
        else:
            sb_errors.append(f'{acc}: HTTP {status} {body}')
        if done % 50 == 0:
            print(f'  Progress: {done}/{len(account_data)}')

# ── Step 4: Report ─────────────────────────────────────────────────────────────
print('\n══════════════════════════════════════════════')
print(f'✅ Bill month synced  : {MONTH_LABEL} ({BILL_MONTH})')
print(f'✅ Meters updated     : {updated} of {len(TRACKED)} tracked accounts')
print(f'✅ Days populated     : day_1 … day_{LAST_DAY}')

if missing:
    print(f'⚠️  Missing from Grafana : {missing}')
else:
    print('✅ All tracked accounts found in Grafana')

if sb_errors:
    print(f'❌ Supabase errors ({len(sb_errors)}):')
    for e in sb_errors[:10]:
        print(f'   {e}')
    sys.exit(1)
else:
    print('✅ No Supabase errors')
print('══════════════════════════════════════════════')
