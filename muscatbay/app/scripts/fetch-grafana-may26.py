#!/usr/bin/env python3
"""
fetch-grafana-may26.py
Fetches May 2026 daily water consumption from Grafana NEC Oman.
Outputs: water_data_may26.json  (paste the contents back to Claude)

Requirements:  pip install requests
Run:           python3 fetch-grafana-may26.py
"""
import requests
import json
import sys

# ── CONFIG ────────────────────────────────────────────────────────────────────
GRAFANA_URL  = "https://grafana.nec-oman.com"
GRAFANA_USER = "aalbalushi@muscatbay.com"
GRAFANA_PASS = "Suhar@2030"
ORG_ID       = 7
DS_UID       = "esu8hjVHk"
BILL_MONTH   = "052026"
MONTH_LABEL  = "May-26"
YEAR         = 2026
LAST_DAY     = 31        # today = Jun 1, so all 31 days of May are valid
OUTPUT_FILE  = "water_data_may26.json"

# ── 337 UNIQUE TRACKED ACCOUNTS ───────────────────────────────────────────────
TRACKED = sorted(set([
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
    # L3 D-Building Bulk Zone 3A (10) — duplicates of Zone 3A entries above
    '4300176','4300177','4300178','4300179','4300180','4300181','4300182','4300183',
    '4300184','4300185',
    # L3 D-Building Bulk Zone 3B (11) — duplicates above
    '4300186','4300187','4300311','4300312','4300313','4300314','4300315','4300316',
    '4300317','4300318','4300319',
    # L4 D-Building Common Zone 3A (10)
    '4300144','4300135','4300138','4300143','4300141','4300140','4300136','4300137',
    '4300139','4300145',
    # L4 D-Building Common Zone 3B (11)
    '4300126','4300201','4300202','4300203','4300204','4300205','4300206','4300207',
    '4300208','4300209','4300142',
    # L4 Residential Zone 3A (60)
    '4300010','4300114','4300128','4300030','4300031','4300032','4300033','4300034',
    '4300035','4300110','4300113','4300013','4300026','4300017','4300019','4300011',
    '4300014','4300007','4300043','4300003','4300015','4300115','4300012','4300039',
    '4300016','4300018','4300051','4300117','4300123','4300040','4300131','4300048',
    '4300041','4300107','4300108','4300004','4300053','4300061','4300109','4300047',
    '4300021','4300027','4300028','4300111','4300112','4300121','4300127','4300134',
    '4300106','4300118','4300022','4300125','4300045','4300046','4300036','4300122',
    '4300037','4300006','4300055','4300063',
    # L4 Residential Zone 3B (109)
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


def fetch_grafana():
    sql = (
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
        "queries": [{
            "datasource": {"type": "mssql", "uid": DS_UID},
            "format": "table",
            "rawSql": sql,
            "refId": "A",
        }],
        "from": "1605429966952",
        "to": "1859887566952",
    }
    print(f"Querying Grafana for bill month {BILL_MONTH}...")
    resp = requests.post(
        f"{GRAFANA_URL}/api/ds/query",
        json=payload,
        auth=(GRAFANA_USER, GRAFANA_PASS),
        headers={
            "Content-Type": "application/json",
            "X-Grafana-Org-Id": str(ORG_ID),
        },
        timeout=90,
    )
    if resp.status_code != 200:
        print(f"ERROR HTTP {resp.status_code}: {resp.text[:600]}")
        sys.exit(1)
    return resp.json()


def parse_frame(data):
    frames = data.get("results", {}).get("A", {}).get("frames", [])
    if not frames:
        print("ERROR: no frames in Grafana response")
        sys.exit(1)
    frame = frames[0]
    fields = [f["name"] for f in frame["schema"]["fields"]]
    values = frame["data"]["values"]
    rows = []
    for r in range(len(values[0])):
        row = {fields[i]: values[i][r] for i in range(len(fields))}
        rows.append(row)
    print(f"  Grafana returned {len(rows)} rows")
    return rows


def build_output(rows):
    lookup = {str(r.get("ACCOUNT_NUMBER", "")): r for r in rows if r.get("ACCOUNT_NUMBER")}

    accounts = {}
    found, missing = [], []
    for acc in TRACKED:
        if acc in lookup:
            row = lookup[acc]
            days = {}
            for d in range(1, LAST_DAY + 1):
                key = str(d).zfill(2)          # "01".."31" as Grafana returns
                val = row.get(key)              # None if column absent or NULL
                days[str(d)] = val
            accounts[acc] = days
            found.append(acc)
        else:
            missing.append(acc)

    print(f"  Found: {len(found)}  |  Missing from Grafana: {missing}")
    return {
        "bill_month": MONTH_LABEL,
        "year": YEAR,
        "last_day": LAST_DAY,
        "found_count": len(found),
        "missing_from_grafana": missing,
        "accounts": accounts,
    }


def main():
    data  = fetch_grafana()
    rows  = parse_frame(data)
    out   = build_output(rows)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    size_kb = len(json.dumps(out)) / 1024
    print(f"\nSaved → {OUTPUT_FILE}  ({size_kb:.0f} KB, {out['found_count']} accounts)")
    print("Next: paste the contents of that JSON file back to Claude.")


if __name__ == "__main__":
    main()
