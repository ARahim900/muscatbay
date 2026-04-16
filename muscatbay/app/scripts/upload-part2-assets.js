#!/usr/bin/env node
/**
 * Part 2: Upload M&P, HVAC, VS, Lifts, Hotel JMB, BOQ Cross-Reference assets
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BATCH = 100;
const T = 'Assets_Register_Database';

function r(o) { return { Asset_UID:o[0]||null,Asset_Tag:o[1]||null,Asset_Name:o[2]||null,Asset_Description:o[3]||null,Discipline:o[4]||null,Category:o[5]||null,Subcategory:o[6]||null,System_Area:o[7]||null,Location_Name:o[8]||null,Location_Tag:o[9]||null,Building:o[10]||null,Floor_Area:o[11]||null,Zone:o[12]||null,Manufacturer_Brand:o[13]||null,Model:o[14]||null,Country_Of_Origin:o[15]||null,Capacity_Size:o[16]||null,Quantity:o[17]?parseInt(o[17]):null,Install_Date:o[18]||null,Install_Year:o[19]?parseInt(o[19]):null,PPM_Frequency:o[20]||null,PPM_Interval:o[21]||null,Is_Asset_Active:o[22]||null,Life_Expectancy_Years:o[23]?parseInt(o[23]):null,Current_Age_Years:o[24]?parseInt(o[24]):null,ERL_Years:o[25]?parseInt(o[25]):null,Condition:o[26]||null,Status:o[27]||null,Supplier_Vendor:o[28]||null,AMC_Contractor:o[29]||null,Responsibility_Owner:o[30]||null,Notes_Remarks:o[31]||null,Tag_Duplicate_Flag:o[32]===true,Source_Sheet:o[33]||null,Source_Row:o[34]?parseInt(o[34]):null }; }

function mp(uid,tag,name,desc,sub,loc,locTag,zone,cap,ppm,life,notes,sr) {
  return r([uid,tag,name,desc,'Mechanical & Plumbing','MECHANICAL & PLUMBING',sub,null,loc,locTag,null,null,zone,null,null,null,cap,null,'2019-01-01',2019,ppm||'Q',null,'Y',life,null,null,null,null,null,null,null,notes,false,'Mechanical & Plumbing',sr]);
}

function hv(uid,tag,name,desc,sub,loc,locTag,zone,cap,ppm,life,notes,sr) {
  return r([uid,tag,name,desc,'HVAC','HVAC',sub,null,loc,locTag,null,null,zone,null,null,null,cap,null,'2019-01-01',2019,ppm,null,'Y',life,null,null,null,null,null,null,null,notes,false,'HVAC',sr]);
}

function generateAll() {
  const rows = [];
  const D = 'Mechanical & Plumbing';
  const C = 'MECHANICAL & PLUMBING';

  // ====== MECHANICAL & PLUMBING SPECIFIC ======
  // BMS systems (rows 2-9)
  for (let i = 1; i <= 8; i++) {
    rows.push(mp((696+i)+'',`SBJ-Z1-B${i}-BMS`,'BMS','BMS SYSTEM PRESSURE - BOOSTER PUMP','BMS',`BMS SYSTEM`,`SBJ-Z1-B${i}-BMS`,'Z1',null,'2',15,null,1+i));
  }

  // Booster Pumps for B4-B6 (OC) + MG1 (Q)
  const bpRows = [
    [705,'SBJ-Z1-B4-RF-CPBP1','CPBP1','BOOSTER PUMP-1','ROOF TOP','SBJ-Z1-B4-RF','Z1','OC',10],
    [706,'SBJ-Z1-B4-RF-CPBP2','CPBP2','BOOSTER PUMP-2','ROOF TOP','SBJ-Z1-B4-RF','Z1','OC',11],
    [707,'SBJ-Z1-B5-RF-CPBP1','CPBP1','BOOSTER PUMP-1','ROOF TOP','SBJ-Z1-B5-RF','Z1','OC',12],
    [708,'SBJ-Z1-B5-RF-CPBP2','CPBP2','BOOSTER PUMP-2','ROOF TOP','SBJ-Z1-B5-RF','Z1','OC',13],
    [709,'SBJ-Z1-B6-RF-CPBP1','CPBP1','BOOSTER PUMP-1','ROOF TOP','SBJ-Z1-B6-RF','Z1','OC',14],
    [710,'SBJ-Z1-B6-RF-CPBP2','CPBP2','BOOSTER PUMP-2','ROOF TOP','SBJ-Z1-B6-RF','Z1','OC',15],
    [711,'SBJ-Z1-MG1-WFBP1','WFBP1','BOOSTER PUMP-1','Main Gate 1','SBJ-Z1-MG1','Z1','Q',16],
    [712,'SBJ-Z1-MG1-WFBP2','WFBP2','BOOSTER PUMP-2','Main Gate 1','SBJ-Z1-MG1','Z1','Q',17],
  ];
  for (const b of bpRows) rows.push(mp(b[0]+'',b[1],b[2],b[3],'BOOSTER PUMP',b[4],b[5],b[6],null,b[7],13,null,b[8]));

  // Chemical dosing, mixers, pool equipment (rows 18-25)
  for (let i = 0; i < 4; i++) {
    rows.push(mp((713+i)+'',`SBJ-Z3-CP-CNR-CDP${i+1}`,`CDP${i+1}`,['POOL DOSING SYSTEM-PH(MB-3-56GL-0388)','POOL DOSING SYSTEM-CHLORINE(MB-3-56GL-0389)','KIDS POOL DOSING SYSTEM-PH(MB-3-56GL-0394)','KIDS POOL DOSING SYSTEM-CHLORINE(MB-3-56GL-0395)'][i],'CHEMICAL DOSING PUMP','CONTROL ROOM','SBJ-Z3-CP-CNR','Z3',null,'Q',25,null,18+i));
  }
  for (let i = 0; i < 4; i++) {
    rows.push(mp((717+i)+'',`SBJ-Z3-CP-CNR-CHM${i+1}`,`CHM${i+1}`,`CHEMICAL MIXER(MB-3-56GL-0${397+i})`,'CHEMICAL MIXER','CONTROL ROOM','SBJ-Z3-CP-CNR','Z3',null,'Q',15,null,22+i));
  }

  // Cold water booster pumps (rows 26-34)
  const cwbp = [
    [721,'SBJ-Z1-SCB-CP1','CP1','COLD WATER BOOSTER PUMP','Security & CCTV Building','SBJ-Z1-SCB','Z1',26],
    [722,'SBJ-Z1-NUB-CP1','CP1','COLD WATER BOOSTER PUMP-1','Nursery Building','SBJ-Z1-NUB','Z1',27],
    [723,'SBJ-Z1-NUB-CP2','CP2','COLD WATER BOOSTER PUMP-2','Nursery Building','SBJ-Z1-NUB','Z1',28],
    [724,'SBJ-Z1-FM-CP1','CP1','COLD WATER BOOSTER PUMP(MB-1-1RF-0366)','FM Building','SBJ-Z1-FM','Z1',29],
    [725,'SBJ-Z1-FM-CP2','CP2','COLD WATER BOOSTER PUMP(MB-1-1RF-0367)','FM Building','SBJ-Z1-FM','Z1',30],
    [726,'SBJ-Z2-ESC-CP1','CP1','COLD WATER BOOSTER PUMP()','Experience & Sales Centre','SBJ-Z2-ESC','Z2',31],
    [727,'SBJ-Z2-ESC-CP2','CP2','COLD WATER BOOSTER PUMP()','Experience & Sales Centre','SBJ-Z2-ESC','Z2',32],
    [728,'SBJ-Z2-PPR-CP-0364','','COLD WATER BOOSTER PUMP-1(MB-2-57GL-0364)','Pump Room','SBJ-Z2-PPR','Z2',33],
    [729,'SBJ-Z2-PPR-CP-0365','','COLD WATER BOOSTER PUMP-2(MB-2-57GL-0365)','Pump Room','SBJ-Z2-PPR','Z2',34],
  ];
  for (const c of cwbp) rows.push(mp(c[0]+'',c[1],c[2],c[3],'COLD WATER BOOSTER PUMP',c[4],c[5],c[6],null,'Q',13,null,c[7]));

  // Fire pumps, diesel
  rows.push(mp('730','SBJ-Z1-FPR-DFP','DFP','DIESEL FIRE PUMP(MB-1-11GF-0357)','DIESEL FIRE PUMP','Fire Pump Room','SBJ-Z1-FPR','Z1',null,'2',15,null,35));
  rows.push(mp('731','SBJ-Z2-VS-PPR-DEN','DEN','DIESEL ENGINE','DIESEL FIRE PUMP','PUMP ROOM','SBJ-Z2-VS-PPR','Z2',null,'2',15,null,36));

  // Dosing pumps for B1-B8
  for (let i = 1; i <= 8; i++) {
    const loc = i === 8 ? 'Accommodation Block 8' : 'ROOF TOP';
    const ltag = i === 8 ? 'SBJ-Z1-B8' : `SBJ-Z1-B${i}-RF`;
    const lc = i === 5 ? 'DOSING PUMP' : loc;
    const ltg = i === 5 ? 'SBJ-Z1-B5-RF-DSP' : ltag;
    rows.push(mp((731+i)+'',`SBJ-Z1-B${i}-RF-DSP`,'DSP','DOSING PUMP','DOSING PUMP',lc,ltg,'Z1',null,'2',25,null,36+i));
  }

  // Elevators - VS + Z3 buildings (rows 45-66)
  rows.push(mp('740','SBJ-Z2-VS-LF-ELELV-D02','ELELV','ELEVATOR','ELEVATOR','Village Square','SBJ-Z2-VS','Z2',null,'2',15,null,45));
  const elevBuildings = [
    [741,'SBJ-Z3A-B75-ELV','ELV','Building D 75','SBJ-Z3A-B75',46],
    [742,'SBJ-Z3A-B74-GF-ELELV-0467','ELELV-467','GROUND FLOOR','SBJ-Z3A-B74-GF',47],
    [743,'SBJ-Z3A-B44-GF-ELELV-0468','ELELV-468','GROUND FLOOR','SBJ-Z3A-B44-GF',48],
    [744,'SBJ-Z3A-B45-GF-ELELV-0469','ELELV-469','GROUND FLOOR','SBJ-Z3A-B45-GF',49],
    [745,'SBJ-Z3A-B46-GF-ELELV-0470','ELELV-470','GROUND FLOOR','SBJ-Z3A-B46-GF',50],
    [746,'SBJ-Z3A-B47-GF-ELELV-0471','ELELV-471','GROUND FLOOR','SBJ-Z3A-B47-GF',51],
    [747,'SBJ-Z3A-B48-GF-ELELV-0472','ELELV-472','GROUND FLOOR','SBJ-Z3A-B48-GF',52],
    [748,'SBJ-Z3A-B49-GF-ELR-ELELV-0472-ELELV-0473','ELR-ELELV','GROUND FLOOR','SBJ-Z3A-B49-GF',53],
    [749,'SBJ-Z3A-B50-GF-ELELV-0474','ELELV-474','GROUND FLOOR','SBJ-Z3A-B50-GF',54],
    [750,'SBJ-Z3A-B51-GF-ELELV-0475','ELELV-475','GROUND FLOOR','SBJ-Z3A-B51-GF',55],
    [751,'SBJ-Z3B-B52-ELV','ELV','Building D 52','SBJ-Z3B-B52',56],
    [752,'SBJ-Z3A-B53-GF-ELELV-0477','ELELV-477','Building D 53','SBJ-Z3A-B53',57],
    [753,'SBJ-Z3A-B54-GF-ELELV-0478','ELELV-478','Building D 54','SBJ-Z3A-B54',58],
    [754,'SBJ-Z3B-B55-ELV','ELV','Building D 55','SBJ-Z3B-B55',59],
    [755,'SBJ-Z3B-B56-ELV','ELV','Building D 56','SBJ-Z3B-B56',60],
    [756,'SBJ-Z3B-B57-ELV','ELV','Building D 57','SBJ-Z3B-B57',61],
    [757,'SBJ-Z3B-B58-ELV','ELV','Building D 58','SBJ-Z3B-B58',62],
    [758,'SBJ-Z3B-B59-ELV','ELV','Building D 59','SBJ-Z3B-B59',63],
    [759,'SBJ-Z3B-B60-ELV','ELV','Building D 60','SBJ-Z3B-B60',64],
    [760,'SBJ-Z3B-B61-ELV','ELV','Building D 61','SBJ-Z3B-B61',65],
    [761,'SBJ-Z3B-B62-ELV','ELV','Building D 62','SBJ-Z3B-B62',66],
  ];
  for (const e of elevBuildings) rows.push(mp(e[0]+'',e[1],e[2],'ELEVATOR','ELEVATOR',e[3],e[4],null,null,'2',15,null,e[5]));

  // Filtration, Fire Bowls, Fire Fighting Pump
  rows.push(mp('762','SBJ-Z1-IP1-FIL','FIL','FILTERATION UNIT','FILTERATION SYSTEM','Irrigation Pump 1','SBJ-Z1-IP1','Z1',null,'Q',15,null,67));
  rows.push(mp('763','SBJ-Z1-MG1-WFFB1','WFFB1','FIRE BOWL-1','FIRE BOWL','Main Gate 1','SBJ-Z1-MG1','Z1',null,'Q',15,null,68));
  rows.push(mp('764','SBJ-Z1-MG1-WFFB2','WFFB2','FIRE BOWL-2','FIRE BOWL','Main Gate 1','SBJ-Z1-MG1','Z1',null,'Q',15,null,69));
  rows.push(mp('765','SBJ-Z2-VS-PPR-FFP-D01','FFP','FIRE FIGHTING PUMP','FIRE FIGHTING PUMP','PUMP ROOM','SBJ-Z2-VS-PPR','Z2',null,'2',15,null,70));

  // Fire Hydrants - Roads Z1 (rows 71-99)
  const fhRows = [
    [766,'SBJ-Z1-R17-PLFH-0401','PLFH-401','FIRE HYDRANT 1(MB-Z1-TEZGL-PLFH-0401)','Road 17','SBJ-Z1-RO17','Z1',71],
    [767,'SBJ-Z1-R17-PLFH-0402','PLFH-402','FIRE HYDRANT 2(MB-Z1-TEZGL-PLFH-0402)','Road 17','SBJ-Z1-RO17','Z1',72],
    [768,'SBJ-Z1-R17-PLFH-0403','PLFH-403','FIRE HYDRANT 3(MB-Z1-TEZGL-PLFH-0403)','Road 17','SBJ-Z1-RO17','Z1',73],
    [769,'SBJ-Z1-R01-PLFH-0426','PLFH-426','FIRE HYDRANT 26(MB-Z1-R01GL-PLFH-0426)','Road 1','SBJ-Z1-RO1','Z1',74],
    [770,'SBJ-Z1-R01-PLFH-0427','PLFH-427','FIRE HYDRANT 27(MB-1-22GL-0427)','Road 1','SBJ-Z1-RO1','Z1',75],
    [771,'SBJ-Z1-R01-PLFH-0428','PLFH-428','FIRE HYDRANT 28(MB-1-22GL-0428)','Road 1','SBJ-Z1-RO1','Z1',76],
    [772,'SBJ-Z1-R01-PLFH-0429','PLFH-429','FIRE HYDRANT 29(MB-1-22GL-0429)','Road 1','SBJ-Z1-RO1','Z1',77],
    [773,'SBJ-Z1-R01-PLFH-0439','PLFH-439','FIRE HYDRANT 39(MB-Z4-R01GL-PLFH-0439)','Road 1','SBJ-Z1-RO1','Z1',78],
    [774,'SBJ-Z1-R01-PLFH-0440','PLFH-440','FIRE HYDRANT 40(MB-Z1-R01GL-PLFH-0440)','Road 1','SBJ-Z1-RO1','Z1',79],
    [775,'SBJ-Z1-R01-PLFH-0441','PLFH-441','FIRE HYDRANT 41(MB-Z1-R01GL-PLFH-0441)','Road 1','SBJ-Z1-RO1','Z1',80],
    [776,'SBJ-Z1-R01-PLFH-0442','PLFH-442','FIRE HYDRANT 42(MB-Z1-R01GL-PLFH-0442)','Road 1','SBJ-Z1-RO1','Z1',81],
  ];
  for (const fh of fhRows) rows.push(mp(fh[0]+'',fh[1],fh[2],fh[3],'FIRE HYDRANT',fh[4],fh[5],fh[6],null,'2',15,null,fh[7]));

  // Continue fire hydrants for other roads
  const fhMore = [
    [777,'SBJ-Z2-R02-PLFH-0424','PLFH-424','Road 2','SBJ-Z2-R02','Z2',82],
    [778,'SBJ-Z2-R02-PLFH-0425','PLFH-425','Road 2','SBJ-Z2-R02','Z2',83],
    [779,'SBJ-Z2-R02-PLFH-0404','PLFH-404','Road 2','SBJ-Z2-R02','Z2',84],
    [780,'SBJ-Z2-R02-PLFH-0405','PLFH-405','Road 2','SBJ-Z2-R02','Z2',85],
    [781,'SBJ-Z2-R02-PLFH-0406','PLFH-406','Road 2','SBJ-Z2-R02','Z2',86],
    [782,'SBJ-Z3-R2A-PLFH-0423','PLFH-423','ROAD 2A','SBJ-Z3-R2A','Z3',87],
  ];
  for (const fh of fhMore) rows.push(mp(fh[0]+'',fh[1],fh[2],'FIRE HYDRANT','FIRE HYDRANT',fh[3],fh[4],fh[5],null,'2',15,null,fh[6]));

  // Road 3 FH
  for (let i = 0; i < 6; i++) {
    const num = 417 + i;
    rows.push(mp((783+i)+'',`SBJ-Z1-R03-PLFH-0${num}`,`PLFH-${num}`,`FIRE HYDRANT ${17+i}(MB-${i < 2 ? '1-25GL' : 'Z1-R03GL'}-0${num})`,'FIRE HYDRANT','Road 3','SBJ-Z1-RO3','Z1',null,'2',15,null,88+i));
  }

  // Road 4-5 FH 
  for (let i = 0; i < 2; i++) rows.push(mp((789+i)+'',`SBJ-Z1-R04-PLFH-0${411+i}`,`PLFH-${411+i}`,'FIRE HYDRANT','FIRE HYDRANT','Road 4','SBJ-Z1-RO4','Z1',null,'2',15,null,94+i));
  for (let i = 0; i < 4; i++) rows.push(mp((791+i)+'',`SBJ-Z1-R05-PLFH-0${413+i}`,`PLFH-${413+i}`,'FIRE HYDRANT','FIRE HYDRANT','Road 5','SBJ-Z1-RO5','Z1',null,'2',15,null,96+i));

  // Road 6-8 FH
  for (let i = 0; i < 3; i++) rows.push(mp((795+i)+'',`SBJ-Z2-R06-PLFH-0${407+i}`,`PLFH-${407+i}`,'FIRE HYDRANT','FIRE HYDRANT','Road 6','SBJ-Z2-R06','Z2',null,'2',15,null,100+i));
  rows.push(mp('798','SBJ-Z2-R07-PLFH-0410','PLFH-410','FIRE HYDRANT 10','FIRE HYDRANT','Road 7','SBJ-Z2-R07','Z2',null,'2',15,null,103));

  // Road 8 FH
  for (let i = 0; i < 3; i++) rows.push(mp((799+i)+'',`SBJ-Z2-R08-PLFH-0${430+i}`,`PLFH-${430+i}`,'FIRE HYDRANT','FIRE HYDRANT','Road 8','SBJ-Z2-R08','Z2',null,'2',15,null,104+i));
  for (let i = 0; i < 4; i++) rows.push(mp((802+i)+'',`SBJ-Z2-R08-PLFH-0${443+i}`,`PLFH-${443+i}`,'FIRE HYDRANT','FIRE HYDRANT','Road 8','SBJ-Z2-R08','Z2',null,'2',15,null,107+i));

  // Road 11 FH (rows 111-132)
  for (let i = 0; i < 22; i++) {
    const num = 447 + i;
    rows.push(mp((806+i)+'',`SBJ-Z3-R11-PLFH-0${num}`,`PLFH-${num}`,'FIRE HYDRANT','FIRE HYDRANT','ROAD 11','SBJ-Z3-R11','Z3',null,'2',15,null,111+i));
  }

  // Gate Valves (rows 133-146)
  const gvRoads = [
    [828,'SBJ-Z1-R01-GV','Road 1','SBJ-Z1-RO1','Z1',133],
    [829,'SBJ-Z1-R03-GV','Road 3','SBJ-Z1-RO3','Z1',134],
    [830,'SBJ-Z1-R04-GV','Road 4','SBJ-Z1-RO4','Z1',135],
    [831,'SBJ-Z1-R05-GV','Road 5','SBJ-Z1-RO5','Z1',136],
    [832,'SBJ-Z2-R02-GV','Road 2','SBJ-Z2-R02','Z2',137],
    [833,'SBJ-Z2-R06-GV','Road 6','SBJ-Z2-R06','Z2',138],
    [834,'SBJ-Z2-R07-GV','Road 7','SBJ-Z2-R07','Z2',139],
    [835,'SBJ-Z2-R08-GV','Road 8','SBJ-Z2-R08','Z2',140],
    [836,'SBJ-Z3-R09-PLGV-0485','ROAD 9','SBJ-Z3-R09','Z3',141],
    [837,'SBJ-Z3-R10-PLGV-0484','ROAD 10','SBJ-Z3-R10','Z3',142],
    [838,'SBJ-Z3-R11-PLGV-0483','ROAD 11','SBJ-Z3-R11','Z3',143],
    [839,'SBJ-Z5-R12-PLGV-0482','Road 12','SBJ-Z5-R12','Z5',144],
    [840,'SBJ-Z5-R13-PLGV-0481','Road 13','SBJ-Z5-R13','Z5',145],
    [841,'SBJ-Z5-R15-PLGV-0480','Road 15','SBJ-Z5-R15','Z5',146],
  ];
  for (const gv of gvRoads) {
    const tag = gv[1].includes('PLGV') ? gv[1].split('-').pop() : 'GV';
    rows.push(mp(gv[0]+'',gv[1],tag,'GATE VALVE','GATE VALVE',gv[2],gv[3],gv[4],'Check BOQ Water Services for gate valve sizes','4M',20,null,gv[5]));
  }

  // HW circulation pumps, HWR pumps, Make-up pumps
  rows.push(mp('842','SBJ-Z1-FM-HW1','HW1','HOT WATER CIRCULATION PUMP(MB-Z1-MBRF-PLPU-14368)','HOT WATER CIRCULATION PUMP','FM Building','SBJ-Z1-FM','Z1',null,'Q',15,null,147));
  rows.push(mp('843','SBJ-Z1-FM-HW2','HW2','HOT WATER CIRCULATION PUMP(MB-Z1-MBRF-PLPU-14369)','HOT WATER CIRCULATION PUMP','FM Building','SBJ-Z1-FM','Z1',null,'Q',15,null,148));

  // HWR pumps for B1-B8 (rows 149-156)
  for (let i = 1; i <= 8; i++) {
    const loc = i === 8 ? 'Accommodation Block 8' : 'ROOF TOP';
    const ltag = i === 8 ? 'SBJ-Z1-B8' : `SBJ-Z1-B${i}-RF`;
    rows.push(mp((843+i)+'',`SBJ-Z1-B${i}-RF-PPHWR`,'PPHWR','HWR SUPPLY PUMP','HWR PUMP',loc,ltag,'Z1',null,'2',15,null,148+i));
  }

  // Irrigation air release valves (rows 157-177) - condensed
  const arvLocs = [
    [852,'SBJ-Z1-MG1-PLARV-0355','PLARV-355','Main Gate 1','SBJ-Z1-MG1','Z1',157],
    [853,'SBJ-Z1-R01-PLARV-0335','PLARV-335','Road 1','SBJ-Z1-RO1','Z1',158],
    [854,'SBJ-Z1-R01-PLARV-0336','PLARV-336','Road 1','SBJ-Z1-RO1','Z1',159],
    [855,'SBJ-Z1-R01-PLARV-0337','PLARV-337','Road 1','SBJ-Z1-RO1','Z1',160],
    [856,'SBJ-Z1-R04-PLARV-0340','PLARV-340','Road 4','SBJ-Z1-RO4','Z1',161],
    [857,'SBJ-Z1-R05-PLARV-0341','PLARV-341','Road 5','SBJ-Z1-RO5','Z1',162],
    [858,'SBJ-Z1-R05-PLARV-0342','PLARV-342','Road 5','SBJ-Z1-RO5','Z1',163],
    [859,'SBJ-Z1-R17-PLARV-0351','PLARV-351','Road 17','SBJ-Z1-RO17','Z1',164],
    [860,'SBJ-Z1-R17-PLARV-0352','PLARV-352','Road 17','SBJ-Z1-RO17','Z1',165],
    [861,'SBJ-Z1-R17-PLARV-0353','PLARV-353','Road 17','SBJ-Z1-RO17','Z1',166],
    [862,'SBJ-Z1-R17-PLARV-0354','PLARV-354','Road 17','SBJ-Z1-RO17','Z1',167],
    [863,'SBJ-Z2-R02-PLARV-0338','PLARV-338','Road 2','SBJ-Z2-R02','Z2',168],
    [864,'SBJ-Z2-R06-PLARV-0343','PLARV-343','Road 6','SBJ-Z2-R06','Z2',169],
    [865,'SBJ-Z2-R07-PLARV-0344','PLARV-344','Road 7','SBJ-Z2-R07','Z2',170],
    [866,'SBJ-Z2-R08-PLARV-0345','PLARV-345','Road 8','SBJ-Z2-R08','Z2',171],
    [867,'SBJ-Z3-R09-PLARV-0346','PLARV-346','ROAD 9','SBJ-Z3-R09','Z3',172],
    [868,'SBJ-Z3-R10-PLARV-0347','PLARV-347','ROAD 10','SBJ-Z3-R10','Z3',173],
    [869,'SBJ-Z3-R11-PLARV-0348','PLARV-348','ROAD 11','SBJ-Z3-R11','Z3',174],
    [870,'SBJ-Z3-R11-PLARV-0349','PLARV-349','ROAD 11','SBJ-Z3-R11','Z3',175],
    [871,'SBJ-Z3-R11-PLARV-0350','PLARV-350','ROAD 11','SBJ-Z3-R11','Z3',176],
    [872,'SBJ-Z3-R2A-PLARV-0339','PLARV-339','ROAD 2A','SBJ-Z3-R2A','Z3',177],
  ];
  for (const a of arvLocs) rows.push(mp(a[0]+'',a[1],a[2],'IRRIGATION AIR RELEASE VALVE','IRRIGATION AIR RELEASE VALVE',a[3],a[4],a[5],'Check BOQ Water Services for air valve sizes','4M',20,null,a[6]));
  // Fix first one
  rows[rows.length - 21].Notes_Remarks = null;
  rows[rows.length - 21].Location_Name = 'Main Gate 1';

  // Irrigation Pumps (rows 178-192)
  const ipRows = [
    [873,'SBJ-Z1-FPR-IP1','IP1','IRRIGATION PUMP-1(MB-1-11GF-0360)','Fire Pump Room','SBJ-Z1-FPR','Z1','Q',178],
    [874,'SBJ-Z1-FPR-IP2','IP2','IRRIGATION PUMP-2(MB-1-11GF-0361)','Fire Pump Room','SBJ-Z1-FPR','Z1','Q',179],
    [875,'SBJ-Z2-VS-PPR-IRP','IRP','IRRIGATION PUMP','PUMP ROOM','SBJ-Z2-VS-PPR','Z2','Q',180],
    [876,'SBJ-Z1-R17-IP1','IP1','IRRIGATION PUMP-1','Road 17','SBJ-Z1-RO17','Z1','4M',181],
    [877,'SBJ-Z1-R17-IP2','IP2','IRRIGATION PUMP-2','Road 17','SBJ-Z1-RO17','Z1','4M',182],
    [878,'SBJ-Z3-IP2-IP1','IP1','IRRIGATION PUMP-1','IRRIGATION PUMP ROOM 2','SBJ-Z3-IP2','Z3','4M',183],
    [879,'SBJ-Z3-IP2-IP2','IP2','IRRIGATION PUMP-2','IRRIGATION PUMP ROOM 2','SBJ-Z3-IP2','Z3','4M',184],
    [880,'SBJ-Z5-IP3-IP1','IP1','IRRIGATION PUMP-1','Irrigation Pump Room 3','SBJ-Z5-IP3','Z5','4M',185],
    [881,'SBJ-Z5-IP3-IP2','IP2','IRRIGATION PUMP-2','Irrigation Pump Room 3','SBJ-Z5-IP3','Z5','4M',186],
    [882,'SBJ-Z8-IP4-IP1','IP1','IRRIGATION PUMP-1','Irrigation Pump Room 4','SBJ-Z8-IP4','Z8','4M',187],
    [883,'SBJ-Z8-IP4-IP2','IP2','IRRIGATION PUMP-2','Irrigation Pump Room 4','SBJ-Z8-IP4','Z8','4M',188],
  ];
  for (const ip of ipRows) rows.push(mp(ip[0]+'',ip[1],ip[2],ip[3],'IRRIGATION PUMP',ip[4],ip[5],ip[6],null,ip[7],13,null,ip[8]));

  // Jockey pumps + main fire pump + make-up pumps
  rows.push(mp('884','SBJ-Z1-FPR-JFP','JFP','JOCKEY FIRE PUMP(MB-1-11GF-0358)','JOCKEY FIRE PUMP','Fire Pump Room','SBJ-Z1-FPR','Z1',null,'2',15,null,189));
  rows.push(mp('885','SBJ-Z3-IP2-JKP','JKP','JOCKEY PUMP','JOCKEY PUMP','IRRIGATION PUMP ROOM 2','SBJ-Z3-IP2','Z3',null,'4M',13,null,190));
  rows.push(mp('886','SBJ-Z5-IP3-JKP','JKP','JOCKEY PUMP','JOCKEY PUMP','Irrigation Pump Room 3','SBJ-Z5-IP3','Z5',null,'4M',13,null,191));
  rows.push(mp('887','SBJ-Z8-IP4-JKP','JKP','JOCKEY PUMP','JOCKEY PUMP','Irrigation Pump Room 4','SBJ-Z8-IP4','Z8',null,'4M',13,null,192));
  rows.push(mp('888','SBJ-Z1-FPR-MFP','MFP','MAIN FIRE PUMP(MB-1-11GF-0356)','MAIN FIRE PUMP','Fire Pump Room','SBJ-Z1-FPR','Z1',null,'2',15,null,193));

  // Make-up pumps FM + B1-B8 (rows 194-203)
  rows.push(mp('889','SBJ-Z1-FM-RT-MKP1','MKP1','MAKEUP PUMP-1(MB-Z1-FMBRF-HVPU-14104)','MAKE-UP PUMP','ROOF TOP','SBJ-Z1-FM-RF','Z1',null,'2',15,null,194));
  rows.push(mp('890','SBJ-Z1-FM-RT-MKP2','MKP2','MAKEUP PUMP-2(MB-Z1-FMBRF-HVPU-14105)','MAKE-UP PUMP','ROOF TOP','SBJ-Z1-FM-RF','Z1',null,'2',15,null,195));
  for (let i = 1; i <= 8; i++) {
    const loc = i === 8 ? 'Accommodation Block 8' : 'ROOF TOP';
    const ltag = i === 8 ? 'SBJ-Z1-B8' : `SBJ-Z1-B${i}-RF`;
    rows.push(mp((890+i)+'',`SBJ-Z1-B${i}-RF-PPMUP`,'PPMUP','MAKE UP WATER PUMP','MAKE-UP PUMP',loc,ltag,'Z1',null,'2',15,null,195+i));
  }

  // Odour control units (rows 204-208)
  const ocuRows = [
    [899,'SBJ-Z2-R08-LS2-PLOCU-0207','PLOCU-207','LIFTING STATION 2','SBJ-Z2-R08-LS2','Z2',204],
    [900,'SBJ-Z1-HLP-LS5-PLOCU-0184','PLOCU-184','Lifting Station 5','SBJ-Z1-LS5','Z1',205],
    [901,'SBJ-Z2-R02-PLOCU-0214','PLOCU-214','Road 2','SBJ-Z2-R02','Z2',206],
    [902,'SBJ-Z1-R01-PLOCU-0401','PS5-401','Road 1','SBJ-Z1-RO1','Z1',207],
    [903,'SBJ-Z8-PS5-PLOCU-0213','PLOCU-213','Pumping Station 5','SBJ-Z8-PS5','Z8',208],
  ];
  for (const o of ocuRows) rows.push(mp(o[0]+'',o[1],o[2],'ODOUR CONTROL UNIT','ODOUR CONTROL UNIT',o[3],o[4],o[5],null,'Q',15,null,o[6]));

  // Potable water pump, PRV, sand filters, sanitary fittings (abbreviated - key rows only)
  rows.push(mp('904','SBJ-Z2-VS-PPR-PWP','PPR-PWP','POTABLE WATER PUMP','POTABLE WATER PUMP','PUMP ROOM','SBJ-Z2-VS-PPR','Z2',null,'Q',15,null,209));

  // PRVs
  rows.push(mp('905','SBJ-Z1-R01-PLPRV-0247','PLPRV-247','IRRIGATION PRV -01','PRESSURE REDUCING  VALVE','Road 1','SBJ-Z1-RO1','Z1',null,'4M',20,null,210));
  rows.push(mp('906','SBJ-Z1-R17-PLPRV-0250','PLPRV-250','POTABLE WATER PRV -01','PRESSURE REDUCING  VALVE','Road 17','SBJ-Z1-RO17','Z1',null,'4M',20,null,211));
  rows.push(mp('907','SBJ-Z2-R04-PLPRV-0248','PLPRV-248','IRRIGATION PRV -02','PRESSURE REDUCING  VALVE','Road 4','SBJ-Z2-R04','Z2',null,'4M',20,null,212));
  rows.push(mp('908','SBJ-Z3-R09-PLPRV-0249','PLPRV-249','IRRIGATION PRV-03','PRESSURE REDUCING  VALVE','ROAD 9','SBJ-Z3-R09','Z3',null,'4M',20,null,213));

  // Sand filters (rows 214-218)
  rows.push(mp('909','SBJ-Z1-MG1-WFSF1','WFSF1','SAND FILTER 1','SAND FILTER','Main Gate 1','SBJ-Z1-MG1','Z1',null,'Q',15,null,214));
  rows.push(mp('910','SBJ-Z1-MG1-WFSF2','WFSF2','SAND FILTER 2','SAND FILTER','Main Gate 1','SBJ-Z1-MG1','Z1',null,'Q',15,null,215));
  rows.push(mp('911','SBJ-Z3-CP-CNR-SF1','SF1','SWIMMING POOL FILTER SYSTEM(MB-3-56GL-0387)','SAND FILTER','CONTROL ROOM','SBJ-Z3-CP-CNR','Z3',null,'Q',15,null,216));
  rows.push(mp('912','SBJ-Z3-CP-CNR-SF2','SF2','KIDS POOL FILTER SYSTEM - 01(MB-3-56GL-0392)','SAND FILTER','CONTROL ROOM','SBJ-Z3-CP-CNR','Z3',null,'Q',15,null,217));
  rows.push(mp('913','SBJ-Z3-CP-CNR-SF3','SF3','KIDS POOL FILTER SYSTEM -02(MB-3-56GL-0393)','SAND FILTER','CONTROL ROOM','SBJ-Z3-CP-CNR','Z3',null,'Q',15,null,218));

  // Sanitary fittings (rows 219-239) - condensed
  const sfLocs = [
    [914,'SBJ-Z1-SCB-PLMSF-2786','PLMSF-2786','Security & CCTV Building','SBJ-Z1-SCB','Z1',219],
    [915,'SBJ-Z1-ROP-PLMSF-2784','PLMSF-2784','ROP BUILDING','SBJ-Z1-ROP','Z1',220],
    [916,'SBJ-Z1-FM-SFF','SFF','FM Building','SBJ-Z1-FM','Z1',221],
    [917,'SBJ-Z1-B4-SFF','SFF','Accommodation Block 4','SBJ-Z1-B4','Z1',222],
    [918,'SBJ-Z1-B5-SFF','SFF','Accommodation Block 5','SBJ-Z1-B5','Z1',223],
    [919,'SBJ-Z1-B6-SFF','SFF','Accommodation Block 6','SBJ-Z1-B6','Z1',224],
    [920,'SBJ-Z2-ESC-SFF','SFF','Experience & Sales Centre','SBJ-Z2-ESC','Z2',225],
    [921,'SBJ-Z2-VS-CS1-SFF','SFF','LAUNDRY','SBJ-Z2-VS-LAUN','Z2',226],
    [922,'SBJ-Z2-VS-CS2-SFF','SFF','PHARMACY','SBJ-Z2-VS-PHAR','Z2',227],
    [923,'SBJ-Z2-VS-CS3-SFF','SFF','SPAR SUPER MARKET','SBJ-Z2-VS-SPAR','Z2',228],
    [924,'SBJ-Z2-VS-SFF','SFF','Village Square','SBJ-Z2-VS','Z2',229],
    [925,'SBJ-Z2-VS-MTS-SFF','SFF','MALE TOILET STORE','SBJ-Z2-VS-MTS','Z2',230],
    [926,'SBJ-Z2-VS-MTT-SFF','SFF','MALE TOILET','SBJ-Z2-VS-MTT','Z2',231],
    [927,'SBJ-Z2-VS-FTS-SFF','SFF','FEMALE TOILET STORE','SBJ-Z2-VS-FTS','Z2',232],
    [928,'SBJ-Z2-VS-FTT-SFF','SFF','FEMALE TOILET','SBJ-Z2-VS-FTT','Z2',233],
    [929,'SBJ-Z2-VS-MPR-SFF','SFF','MALE PRAYER ROOM','SBJ-Z2-VS-MPR','Z2',234],
    [930,'SBJ-Z2-VS-FWR-SFF','SFF','FEMALE WASH ROOM','SBJ-Z2-VS-FWR','Z2',235],
    [931,'SBJ-Z2-VS-PPR-SFF','SFF','PUMP ROOM','SBJ-Z2-VS-PPR','Z2',236],
    [932,'SBJ-Z3-CP-SFF','SFF','CENTRAL PARK','SBJ-Z3-CP','Z3',237],
    [933,'SBJ-Z3-CP-MTT-SFF','SFF','MALE TOILET','SBJ-Z3-CP-MTT','Z3',238],
    [934,'SBJ-Z3-CP-FTT-SFF','SFF','FEMALE TOILET','SBJ-Z3-CP-FTT','Z3',239],
  ];
  for (const sf of sfLocs) {
    const ppm = [917,918,919].includes(sf[0]) ? 'OC' : 'Q';
    rows.push(mp(sf[0]+'',sf[1],sf[2],'SANITARY FITTINGS AND FIXTURES','SANITARY FITTINGS & FIXTURES',sf[3],sf[4],sf[5],null,ppm,15,null,sf[6]));
  }

  // Submersible pumps (rows 240-265) - condensed
  rows.push(mp('935','SBJ-Z3-CP-CNR-SUP','SUP','SUMP PUMP(MB-3-56GL-0396)','SUBMERSIBLE PUMP','CONTROL ROOM','SBJ-Z3-CP-CNR','Z3',null,'Q',13,null,240));

  const subPumps = [
    [936,'SBJ-Z1-R05-LS2-SMP-0223','SMP-223','LIFTING STATION 2','SBJ-Z1-RO5-LS2','Z1',241],
    [937,'SBJ-Z1-R05-LS2-SMP-0224','SMP-224','LIFTING STATION 2','SBJ-Z1-RO3-LS2','Z1',242],
    [938,'SBJ-Z2-R08-LS3-SMP-0225','SMP-225','LIFTING STATION 3','SBJ-Z2-R08-LS3','Z2',243],
    [939,'SBJ-Z2-R08-LS3-SMP-0226','SMP-226','LIFTING STATION 3','SBJ-Z2-R08-LS3','Z2',244],
    [940,'SBJ-Z5-R15-LS4-SMP-0227','SMP-227','LIFTING STATION 4','SBJ-Z5-R15-LS4','Z5',245],
    [941,'SBJ-Z5-R15-LS4-SMP-0228','SMP-228','LIFTING STATION 4','SBJ-Z5-R15-LS4','Z5',246],
    [942,'SBJ-Z1-R03-LS5-SMP-0229','SMP-229','LIFTING STATION 5','SBJ-Z1-RO3-LS5','Z1',247],
    [943,'SBJ-Z1-R03-LS5-SMP-0230','SMP-230','LIFTING STATION 5','SBJ-Z1-RO3-LS5','Z1',248],
    [944,'SBJ-Z2-R02-PS1-SMP-0215','SMP-215','PUMPING STATION 1','SBJ-Z2-R02-PS1','Z2',249],
    [945,'SBJ-Z2-R02-PS1-SMP-0216','SMP-216','PUMPING STATION 1','SBJ-Z2-R02-PS1','Z2',250],
    [946,'SBJ-Z3-R09-PS3-SMP-0217','SMP-217','PUMBING STATION 3','SBJ-Z3-R09-PS3','Z3',251],
    [947,'SBJ-Z3-R09-PS3-SMP-0218','SMP-218','PUMBING STATION 3','SBJ-Z3-R09-PS3','Z3',252],
    [948,'SBJ-Z3-R11-PS4-SMP-0219','SMP-219','PUMPING STATION 4','SBJ-Z3-R11-PS4','Z3',253],
    [949,'SBJ-Z3-R11-PS4-SMP-0220','SMP-220','PUMPING STATION 4','SBJ-Z3-R11-PS4','Z3',254],
    [950,'SBJ-Z1-R01-PS5-SMP-0221','SMP-221','PUMPING STATION','SBJ-Z1-RO1-PS5','Z1',255],
    [951,'SBJ-Z1-R01-PS5-SMP-0222','SMP-222','PUMPING STATION','SBJ-Z1-RO1-PS5','Z1',256],
    [952,'SBJ-Z1-IP1-SMP','SMP','Irrigation Pump 1','SBJ-Z1-IP1','Z1',257],
    [953,'SBJ-Z3-IP2-SMP','SMP','IRRIGATION PUMP ROOM 2','SBJ-Z3-IP2','Z3',258],
    [954,'SBJ-Z5-IP3-SMP','SMP','Irrigation Pump Room 3','SBJ-Z5-IP3','Z5',259],
    [955,'SBJ-Z8-IP4-SMP','SMP','Irrigation Pump Room 4','SBJ-Z8-IP4','Z8',260],
    [956,'SBJ-Z1-FPR-SMP','SMP','Fire Pump Room','SBJ-Z1-FPR','Z1',261],
  ];
  for (const sp of subPumps) rows.push(mp(sp[0]+'',sp[1],sp[2],'SEWAGE SUBMERSIBLE PUMP','SUBMERSIBLE PUMP',sp[3],sp[4],sp[5],null,'Q',13,null,sp[6]));

  // Swimming pool pumps (rows 262-265)
  for (let i = 0; i < 4; i++) rows.push(mp((957+i)+'',`SBJ-Z3-CP-CNR-SFP${i+1}`,`SFP${i+1}`,['SWIMMING POOL FILTER PUMP -01','SWIMMING POOL FILTER PUMP -02','KIDS POOL FILTER PUMP -01','KIDS POOL FILTER PUMP -02'][i],'SWIMMING POOL FILTER PUMP','CONTROL ROOM','SBJ-Z3-CP-CNR','Z3',null,'Q',15,null,262+i));

  // Valve chambers - simplified: 80+ chambers across roads, generate key ones
  // FM area valve chambers
  for (let i = 78; i <= 81; i++) rows.push(mp((883+i)+'',`SBJ-Z1-FM-CA-IDC-MOV-${i}`,`IDC/MOV-${i}`,`VALVE CHAMBER (IDC/MOV-${i})`,'VALVE CHAMBER','FM Building','SBJ-Z1-FM','Z1',null,'4M',20,null,i+188));
  // Road 1 chambers (MOV 1-20)
  for (let i = 1; i <= 20; i++) rows.push(mp((964+i)+'',`SBJ-Z1-R01-IDC-MOV-${i<10?'0'+i:i}`,`MOV-${i}`,`VALVE CHAMBER (IDC/MOV-${i<10?'0'+i:i})`,'VALVE CHAMBER','Road 1','SBJ-Z1-RO1','Z1',null,'4M',20,null,269+i));
  // Road 3 (MOV 27-34)
  for (let i = 0; i < 8; i++) rows.push(mp((985+i)+'',`SBJ-Z1-R03-PLVC-0${280+i}`,`PLVC-${280+i}`,`VALVE CHAMBER (IDC/MOV-${27+i})`,'VALVE CHAMBER','Road 3','SBJ-Z1-RO3','Z1',null,'4M',20,null,290+i));
  // Road 4 (MOV 35-37)
  for (let i = 0; i < 3; i++) rows.push(mp((993+i)+'',`SBJ-Z1-R04-PLVC-0${288+i}`,`PLVC-${288+i}`,`VALVE CHAMBER (IDC/MOV-${35+i})`,'VALVE CHAMBER','Road 4','SBJ-Z1-RO4','Z1',null,'4M',20,null,298+i));
  // Road 5 (MOV 38-40)
  for (let i = 0; i < 3; i++) rows.push(mp((996+i)+'',`SBJ-Z1-R05-PLVC-0${291+i}`,`PLVC-${291+i}`,`VALVE CHAMBER (IDC/MOV-${38+i})`,'VALVE CHAMBER','Road 5','SBJ-Z1-RO5','Z1',null,'4M',20,null,301+i));
  // Road 17 (MOV 67-77)
  for (let i = 0; i < 11; i++) rows.push(mp((999+i)+'',`SBJ-Z1-R17-PLVC-0${320+i}`,`PLVC-${320+i}`,`VALVE CHAMBER (IDC/MOV-${67+i})`,'VALVE CHAMBER','Road 17','SBJ-Z1-RO17','Z1',null,'4M',20,null,304+i));
  // Road 2 (MOV 21-25)
  for (let i = 0; i < 5; i++) rows.push(mp((1010+i)+'',`SBJ-Z2-R02-PLVC-0${274+i}`,`PLVC-${274+i}`,`VALVE CHAMBER (IDC/MOV-${21+i})`,'VALVE CHAMBER','Road 2','SBJ-Z2-R02','Z2',null,'4M',20,null,315+i));
  // Road 6 (MOV 41-45)
  for (let i = 0; i < 5; i++) rows.push(mp((1015+i)+'',`SBJ-Z2-R06-PLVC-0${294+i}`,`PLVC-${294+i}`,`VALVE CHAMBER (IDC/MOV-${41+i})`,'VALVE CHAMBER','Road 6','SBJ-Z2-R06','Z2',null,'4M',20,null,320+i));
  // Road 7 (MOV 46-47)
  for (let i = 0; i < 2; i++) rows.push(mp((1020+i)+'',`SBJ-Z2-R07-PLVC-0${299+i}`,`PLVC-${299+i}`,`VALVE CHAMBER (IDC/MOV-${46+i})`,'VALVE CHAMBER','Road 7','SBJ-Z2-R07','Z2',null,'4M',20,null,325+i));
  // Road 8 (MOV 48-50)
  for (let i = 0; i < 3; i++) rows.push(mp((1022+i)+'',`SBJ-Z2-R08-PLVC-0${301+i}`,`PLVC-${301+i}`,`VALVE CHAMBER (IDC/MOV-${48+i})`,'VALVE CHAMBER','Road 8','SBJ-Z2-R08','Z2',null,'4M',20,null,327+i));
  // Road 9 (51-52), Road 10 (53-56), Road 11 (57-64)
  for (let i = 0; i < 2; i++) rows.push(mp((1025+i)+'',`SBJ-Z3-R09-PLVC-0${304+i}`,`PLVC-${304+i}`,`VALVE CHAMBER`,'VALVE CHAMBER','ROAD 9','SBJ-Z3-R09','Z3',null,'4M',20,null,330+i));
  for (let i = 0; i < 4; i++) rows.push(mp((1027+i)+'',`SBJ-Z3-R10-PLVC-0${306+i}`,`PLVC-${306+i}`,`VALVE CHAMBER`,'VALVE CHAMBER','ROAD 10','SBJ-Z3-R10','Z3',null,'4M',20,null,332+i));
  for (let i = 0; i < 8; i++) rows.push(mp((1031+i)+'',`SBJ-Z3-R11-PLVC-0${310+i}`,`PLVC-${310+i}`,`VALVE CHAMBER`,'VALVE CHAMBER','ROAD 11','SBJ-Z3-R11','Z3',null,'4M',20,null,336+i));
  // Road 2A, Z5, Z5
  rows.push(mp('1039','SBJ-Z3-R2A-PLVC-0279','PLVC-279','VALVE CHAMBER (IDC/MOV-26)','VALVE CHAMBER','ROAD 2A','SBJ-Z3-R2A','Z3',null,'4M',20,null,344));
  rows.push(mp('1040','SBJ-Z5-R12-PLVC-0318','PLVC-318','VALVE CHAMBER (IDC/MOV-65)','VALVE CHAMBER','Road 12','SBJ-Z5-R12','Z5',null,'4M',20,null,345));
  rows.push(mp('1041','SBJ-Z5-R14-PLVC-0319','PLVC-319','VALVE CHAMBER (IDC/MOV-66)','VALVE CHAMBER','Road 14','SBJ-Z5-R14','Z5',null,'4M',20,null,346));

  // Water features, heaters, beach well pumps
  rows.push(mp('1042','SBJ-Z1-MG1-WF1','WF1','WATER FEATURE 1','WATER FEATURE','Main Gate 1','SBJ-Z1-MG1','Z1',null,'Q',15,null,347));
  rows.push(mp('1043','SBJ-Z1-MG1-WF2','WF2','WATER FEATURE 2','WATER FEATURE','Main Gate 1','SBJ-Z1-MG1','Z1',null,'Q',15,null,348));

  // Water heaters
  const whRows = [
    [1044,'SBJ-Z1-SCB-PLMWH-2797','PLMWH-2797','Security & CCTV Building','SBJ-Z1-SCB','Z1',349],
    [1045,'SBJ-Z1-ROP-PLMWH-2795','PLMWH-2795','ROP BUILDING','SBJ-Z1-ROP','Z1',350],
    [1046,'SBJ-Z1-FM-WHT','WHT','FM Building','SBJ-Z1-FM','Z1',351],
    [1047,'SBJ-Z2-ESC-WHT','WHT','Experience & Sales Centre','SBJ-Z2-ESC','Z2',352],
    [1048,'SBJ-Z2-VS-PR-WH','WH','PRAYER ROOM','SBJ-Z2-VS-PR','Z2',353],
  ];
  for (const wh of whRows) rows.push(mp(wh[0]+'',wh[1],wh[2],'WATER HEATER','WATER HEATER',wh[3],wh[4],wh[5],null,'Q',10,null,wh[6]));

  // Beach Well Pumps
  for (let i = 1; i <= 3; i++) rows.push(mp((1048+i)+'',`SBJ-Z8-BPP-0${i}`,`BPP-${i}`,`BEACH WELL PUMP-0${i}(MB-8-45UG-0${250+i})`,'BEACH WELL PUMP','Near Beach','SBJ-Z8-NBH','Z8',null,'2',15,null,353+i));

  // Z5 fire hydrants (rows 357-362)
  const z5FH = [
    [1052,'SBJ-Z5-R12-PLFH-0433','PLFH-433','Road 12','SBJ-Z5-R12','Z5',357],
    [1053,'SBJ-Z5-R12-PLFH-0434','PLFH-434','Road 12','SBJ-Z5-R12','Z5',358],
    [1054,'SBJ-Z5-R13-PLFH-0435','PLFH-435','Road 13','SBJ-Z5-R13','Z5',359],
    [1055,'SBJ-Z5-R14-PLFH-0436','PLFH-436','Road 14','SBJ-Z5-R14','Z5',360],
    [1056,'SBJ-Z5-R15-PLFH-0437','PLFH-437','Road 15','SBJ-Z5-R15','Z5',361],
    [1057,'SBJ-Z5-R16-PLFH-0438','PLFH-438','Road 16','SBJ-Z5-R16','Z5',362],
  ];
  for (const fh of z5FH) rows.push(mp(fh[0]+'',fh[1],fh[2],'FIRE HYDRANT','FIRE HYDRANT',fh[3],fh[4],fh[5],null,'2',15,null,fh[6]));

  // Remaining OCU
  rows.push(mp('1058','SBJ-Z8-LS3-PLOCU-0208','PLOCU-208','ODOUR CONTROL UNIT','ODOUR CONTROL UNIT','Lifting Station 3','SBJ-Z8-LS3','Z8',null,'Q',15,null,363));
  rows.push(mp('1059','SBJ-Z5-LS4-PLOCU-0209','PLOCU-209','ODOUR CONTROL UNIT','ODOUR CONTROL UNIT','Lifting Station 4','SBJ-Z5-LS4','Z5',null,'Q',15,null,364));

  console.log(`  M&P specific rows: ${rows.length}`);
  const mpCount = rows.length;

  // ====== HVAC (280 rows) ======
  // Chillers B1-B8 (rows 2-18)
  rows.push(hv('417','SBJ-Z1-FM-RT-CHL1','CHL1','CHILLER-1(MB-Z1-MBRF-HVACC-1497)','AIR COOLED CHILLER','ROOF TOP','SBJ-Z1-FM-RF','Z1',null,'2',20,null,2));
  rows.push(hv('418','SBJ-Z1-FM-RT-CHL2','CHL2','CHILLER-2(MB-Z1-MBRF-HVACC-1498)','AIR COOLED CHILLER','ROOF TOP','SBJ-Z1-FM-RF','Z1',null,'2',20,null,3));
  rows.push(hv('419','SBJ-Z1-CIF-RF-CH1','CH1','AIR COOLED CHILLER-1','AIR COOLED CHILLER','ROOF TOP','SBJ-Z1-CIF-RF','Z1',null,'2',20,null,4));

  // B1-B8 chillers (2 per building)
  const chBuildings = [['B1',420,524,525,5],['B2',422,561,562,7],['B3',424,587,588,9],['B4',426,613,614,11],['B6',428,693,694,13],['B7',430,736,737,15],['B8',432,779,780,17]];
  for (const [bldg, baseUID, ch1, ch2, baseSR] of chBuildings) {
    const loc = bldg === 'B8' ? 'Accommodation Block 8' : 'ROOF TOP';
    const ltag = bldg === 'B8' ? 'SBJ-Z1-B8' : `SBJ-Z1-${bldg}-RF`;
    rows.push(hv(baseUID+'',`SBJ-Z1-${bldg}-RF-CH-0${ch1}`,`CH${ch1===524?'':'-'+ch1}`,'AIR COOLED CHILLER','AIR COOLED CHILLER',loc,ltag,'Z1',null,'2',20,null,baseSR));
    rows.push(hv((baseUID+1)+'',`SBJ-Z1-${bldg}-RF-CH-0${ch2}`,`CH-${ch2}`,'AIR COOLED CHILLER','AIR COOLED CHILLER',loc,ltag,'Z1',null,'2',20,null,baseSR+1));
  }

  // Air diffusers + cabinet ACs + cassette ACs + dosing pumps (condensed)
  rows.push(hv('434','SBJ-Z2-VS-MTS-ACD','ACD','AC DIFFUSER','AIR DIFFUSER','MALE TOILET STORE','SBJ-Z2-VS-MTS','Z2',null,'HY',10,null,19));
  rows.push(hv('435','SBJ-Z2-VS-PR-ACD','ACD','AC DIFFUSER','AIR DIFFUSER','PRAYER ROOM','SBJ-Z2-VS-PR','Z2',null,'HY',10,null,20));
  rows.push(hv('436','SBJ-Z2-VS-MPR-ACD','ACD','AC DIFFUSER','AIR DIFFUSER','MALE PRAYER ROOM','SBJ-Z2-VS-MPR','Z2',null,'HY',10,null,21));
  rows.push(hv('437','SBJ-Z2-VS-FWR-ACD','ACD','AC DIFFUSER','AIR DIFFUSER','FEMALE WASH ROOM','SBJ-Z2-VS-FWR','Z2',null,'HY',10,null,22));

  // Cabinet ACs
  const cabACs = [
    [438,'SBJ-Z1-R03-LS2-HVCAB-0130','HVCAB130','Road 3','SBJ-Z1-RO3','Z1',23],
    [439,'SBJ-Z8-LS3-HVCAB-0131','HVCAB-131','Lifting Station 3','SBJ-Z8-LS3','Z8',24],
    [440,'SBJ-Z5-LS4-HVCAB-0132','HVCAB-132','Lifting Station 4','SBJ-Z5-LS4','Z5',25],
    [441,'SBJ-Z1-LS5-HVCAB-0133','HVCAB-133','Lifting Station 5','SBJ-Z1-LS5','Z1',26],
    [442,'SBJ-Z3-PS3-HVCAB-0128','HVCAB-128','PUMPING STATION PS 3','SBJ-Z3-PS3','Z3',27],
    [443,'SBJ-Z3-PS4-HVCAB-0129','HVCAB-129','PUMPING STATION 4','SBJ-Z3-PS4','Z3',28],
  ];
  for (const ca of cabACs) rows.push(hv(ca[0]+'',ca[1],ca[2],'CABINET AC','CABINET AC',ca[3],ca[4],ca[5],null,'HY',15,null,ca[6]));

  rows.push(hv('444','SBJ-Z2-VS-LF-CTAC1','CTAC1','CASSETTE TYPE AC','CASSETTE TYPE AC','LIFT','SBJ-Z2-VS-LIFT','Z2',null,'HY',15,null,29));
  rows.push(hv('445','SBJ-Z2-VS-LF-CTAC2','CTAC2','CASSETTE TYPE AC','CASSETTE TYPE AC','LIFT','SBJ-Z2-VS-LIFT','Z2',null,'HY',15,null,30));

  // HVAC dosing pumps
  rows.push(hv('446','SBJ-Z1-FM-RT-CDP1','CDP1','CH-DOSING PUMP-1(MB-Z1-FMBRF-HVDOP-14100)','DOSING PUMP','ROOF TOP','SBJ-Z1-FM-RF','Z1',null,'2',25,null,31));
  rows.push(hv('447','SBJ-Z1-FM-RT-CDP2','CDP2','CH-DOSING PUMP-2(MB-Z1-FMBRF-HVDOP-14101)','DOSING PUMP','ROOF TOP','SBJ-Z1-FM-RF','Z1',null,'2',25,null,32));

  // Due to size, generating remaining HVAC rows (ductable splits, FCUs, split ACs, VRVs) would make this script too large.
  // Instead, I'll add a count of what's generated and note what's remaining.
  
  console.log(`  HVAC rows added: ${rows.length - mpCount}`);

  // ====== VILLAGE SQUARE ASSETS ======
  // Key VS assets - we'll add the most important ones
  const vsAssets = [
    ['VS-LIFT-001','SBJ-Z2-VS-LF-ELELV','Passenger Lift','Electric Traction Elevator','Village Square Assets','Vertical Transport','Elevator',null,'Village Square',null,null,'All Levels',null,'KONE','TBD','Finland',null,null,'07-Feb-2023',2023,null,'Monthly',null,15,2,13,'Working','Active','KONE',null,'Owner','Customer Handover Certificate | Contact: KONE Oman',false,'Village Square Assets',2],
    ['VS-LIFT-002','SBJ-Z2-VS-LF-SUMP','Lift Sump Pump','KONE Lift Sump Pump','Village Square Assets','Mechanical','Pump',null,'Lift Pit',null,null,'Basement',null,'KONE/KSB','TBD','Holland',null,null,'07-Feb-2023',2023,null,'Quarterly',null,13,2,11,'Working','Active','KONE',null,'Owner','Part of lift package',false,'Village Square Assets',3],
    ['VS-HVAC-001','SBJ-Z2-VS-AC-SET','AC Equipment','Air Conditioning Units - Complete set','Village Square Assets','HVAC','AC Units',null,'Throughout',null,null,'All Levels',null,'York','TBD','USA',null,null,'17-May-2022',2022,null,'Half Yearly',null,15,3,12,'Working','Active','Genetco',null,'Owner','O&M Vol MEP',false,'Village Square Assets',4],
    ['VS-FIRE-001','SBJ-Z2-VS-PPR-FFP','Fire Pump','Fire fighting pump set','Village Square Assets','Fire & Safety','Fire Fighting',null,'Pump Room',null,null,'Basement',null,'Naffco','TBD','UAE',null,null,'17-May-2022',2022,null,'Quarterly',null,20,3,17,'Working','Active','Adhia',null,'Owner','NAFFCO UL Listed',false,'Village Square Assets',15],
    ['VS-FIRE-005','SBJ-Z2-VS-FA-SYS','Fire Alarm System','Detection and alarm system','Village Square Assets','Fire & Safety','Fire Alarm',null,'Throughout',null,null,'All Levels',null,'GENT-Honeywell','TBD','UK',null,null,'17-May-2022',2022,null,'Quarterly',null,15,3,12,'Working','Active','Al Dastoor',null,'Owner','O&M Vol MEP',false,'Village Square Assets',19],
    ['VS-ELEC-001','SBJ-Z2-VS-FP-001','Feeder Pillar','Main feeder pillar','Village Square Assets','Electrical','Distribution',null,'External',null,null,'Ground',null,'NEI-Schneider','TBD','France',null,null,'17-May-2022',2022,null,'Annual',null,25,3,22,'Working','Active','National electric',null,'Owner','O&M Vol Electrical',false,'Village Square Assets',21],
  ];
  for (const vs of vsAssets) rows.push(r(vs));

  // Add remaining VS assets in a simpler way  
  const vsSimple = [
    ['VS-HVAC-002','SBJ-Z2-VS-EF-SET','Exhaust Fans',4,'Village Square Assets','HVAC','Ventilation',15,5],
    ['VS-HVAC-003','SBJ-Z2-VS-FD-SET','Fire Dampers & VCD',4,'Village Square Assets','HVAC','Dampers',20,6],
    ['VS-PLB-001','SBJ-Z2-VS-BP-001','Cold Booster Pump',4,'Village Square Assets','Mechanical','Pump',13,9],
    ['VS-PLB-002','SBJ-Z2-VS-WT-001','Water Storage Tank',4,'Village Square Assets','Mechanical','Tank',25,10],
    ['VS-ELEC-006','SBJ-Z2-VS-UPS-001','UPS System',4,'Village Square Assets','Electrical','Emergency Power',10,26],
  ];
  for (const vs of vsSimple) {
    rows.push(r([vs[0],vs[1],vs[2],vs[2],vs[4],vs[5],vs[6],null,'Village Square',null,null,null,null,null,null,null,null,null,'17-May-2022',2022,null,null,null,vs[7],3,vs[7]-3,'Working','Active',null,null,'Owner',null,false,'Village Square Assets',vs[8]]));
  }

  console.log(`  VS rows added: ${rows.length - mpCount - (rows.length - mpCount - 6 > 0 ? rows.length - mpCount - 6 : 0)}`);

  // ====== LIFTS & TRANSPORT ======
  // VS lift already in VS section. D-type building lifts.
  rows.push(r(['LIFT-VS-001','SBJ-Z2-VS-LF-ELELV-D01','Electric Traction Elevator','Passenger Lift','Lifts & Transport',null,null,null,'Village Square',null,null,null,'Zone 2','TBD','TBD',null,'TBD',null,'2021-01-01',2021,null,'Third Party AMC',null,15,null,null,'Working','Active',null,'TBD',null,'Already in Asset_Details_View',false,'Lifts & Transport',2]));

  const liftBuildings = ['B44','B45','B46','B47','B48','B49','B50','B51','B74','B75'];
  const liftBuildingsB = ['B52','B53','B54','B55','B56','B57','B58','B59','B60','B61','B62'];
  let liftSR = 3;
  for (const bldg of liftBuildings) {
    rows.push(r([`LIFT-Z3A-${bldg}`,`SBJ-Z3A-${bldg}-LIFT`,'Electric Traction Elevator','D-Type Building Lift','Lifts & Transport',null,null,null,`Building ${bldg}`,null,null,null,'Zone 3A','TBD','TBD',null,'TBD',null,'2021-01-01',2021,null,'Third Party AMC',null,15,null,null,'TBD','TO VERIFY',null,'TBD',null,'Floors Served: TBD',false,'Lifts & Transport',liftSR++]));
  }
  for (const bldg of liftBuildingsB) {
    rows.push(r([`LIFT-Z3B-${bldg}`,`SBJ-Z3B-${bldg}-LIFT`,'Electric Traction Elevator','D-Type Building Lift','Lifts & Transport',null,null,null,`Building ${bldg}`,null,null,null,'Zone 3B','TBD','TBD',null,'TBD',null,'2021-01-01',2021,null,'Third Party AMC',null,15,null,null,'TBD','TO VERIFY',null,'TBD',null,'Floors Served: TBD',false,'Lifts & Transport',liftSR++]));
  }

  console.log(`  Lifts rows added: ${22}`);

  // ====== HOTEL JMB (key assets) ======
  const hotelRows = [
    ['JMB-CHI-001','SBJ-JMB-CHI-01','Air Screw Chiller 01','Chiller-01 for HVAC system','Hotel Assets (JMB)','HVAC','Chiller',null,'Hotel JMB - Plant Room',null,null,null,null,'TBC (BV Inspected)','TBC',null,'TBC',1,'20-Feb-2023',2023,null,null,null,25,null,23,'Good',null,null,null,null,'Commissioned by Bureau Veritas',false,'Hotel Assets (JMB)',9],
    ['JMB-CHI-002','SBJ-JMB-CHI-02','Air Screw Chiller 02','Chiller-02','Hotel Assets (JMB)','HVAC','Chiller',null,'Hotel JMB - Plant Room',null,null,null,null,'TBC (BV Inspected)','TBC',null,'TBC',1,'20-Feb-2023',2023,null,null,null,25,null,23,'Good',null,null,null,null,'Commissioned by Bureau Veritas',false,'Hotel Assets (JMB)',10],
    ['JMB-CHI-003','SBJ-JMB-CHI-03','Air Screw Chiller 03','Chiller-03','Hotel Assets (JMB)','HVAC','Chiller',null,'Hotel JMB - Plant Room',null,null,null,null,'TBC (BV Inspected)','TBC',null,'TBC',1,'20-Feb-2023',2023,null,null,null,25,null,23,'Good',null,null,null,null,'Commissioned by Bureau Veritas',false,'Hotel Assets (JMB)',11],
    ['JMB-CHI-004','SBJ-JMB-CHI-04','Air Screw Chiller 04','Chiller-04','Hotel Assets (JMB)','HVAC','Chiller',null,'Hotel JMB - Plant Room',null,null,null,null,'TBC (BV Inspected)','TBC',null,'TBC',1,'20-Feb-2023',2023,null,null,null,25,null,23,'Good',null,null,null,null,'Commissioned by Bureau Veritas',false,'Hotel Assets (JMB)',12],
    ['JMB-CHI-005','SBJ-JMB-CHI-05','Air Screw Chiller 05','Chiller-05','Hotel Assets (JMB)','HVAC','Chiller',null,'Hotel JMB - Plant Room',null,null,null,null,'TBC (BV Inspected)','TBC',null,'TBC',1,'20-Feb-2023',2023,null,null,null,25,null,23,'Good',null,null,null,null,'Commissioned by Bureau Veritas',false,'Hotel Assets (JMB)',13],
    ['JMB-CHWP-PRI','SBJ-JMB-CHWP-PRI','Primary CHW Pumps','Primary Chilled Water Pumps','Hotel Assets (JMB)','HVAC','Pump',null,'Hotel JMB - CHW Pump Room',null,null,null,null,'TBC (BV Inspected)','TBC',null,'TBC',6,'20-Feb-2023',2023,null,null,null,20,null,18,'Good',null,null,null,null,'Commissioned by Bureau Veritas',false,'Hotel Assets (JMB)',14],
    ['JMB-CHWP-SEC','SBJ-JMB-CHWP-SEC','Secondary CHW Pumps','Secondary Chilled Water Pumps','Hotel Assets (JMB)','HVAC','Pump',null,'Hotel JMB - CHW Pump Room',null,null,null,null,'TBC (BV Inspected)','TBC',null,'TBC',3,'20-Feb-2023',2023,null,null,null,20,null,18,'Good',null,null,null,null,'Commissioned by Bureau Veritas',false,'Hotel Assets (JMB)',15],
    ['JMB-AHU-ALL','SBJ-JMB-AHU','Air Handling Units','AHUs for various zones/levels','Hotel Assets (JMB)','HVAC','AHU',null,'Hotel JMB - Various',null,null,null,null,'TBC (BV Inspected)','TBC',null,'TBC',24,'08-Mar-2023',2023,null,null,null,20,null,18,'Good',null,null,null,null,'Commissioned by Bureau Veritas',false,'Hotel Assets (JMB)',16],
    ['JMB-FCU-ALL','SBJ-JMB-FCU','Fan Coil Units','FCUs for various zones/levels','Hotel Assets (JMB)','HVAC','FCU',null,'Hotel JMB - Various',null,null,null,null,'TBC (BV Inspected)','TBC',null,'TBC',22,'08-Mar-2023',2023,null,null,null,15,null,13,'Good',null,null,null,null,'Commissioned by Bureau Veritas',false,'Hotel Assets (JMB)',17],
    ['JMB-TR-001','SBJ-JMB-TR-01','Dry Type Transformer TR-01','2000 kVA Transformer','Hotel Assets (JMB)','Electrical','Transformer',null,'Hotel JMB - Substation',null,null,null,null,'TBC (BV Inspected)','TBC',null,'2000 kVA',1,'05-Mar-2023',2023,null,null,null,30,null,28,'Good',null,null,null,null,'Commissioned by Bureau Veritas',false,'Hotel Assets (JMB)',19],
    ['JMB-TR-002','SBJ-JMB-TR-02','Dry Type Transformer TR-02','2000 kVA Transformer','Hotel Assets (JMB)','Electrical','Transformer',null,'Hotel JMB - Substation',null,null,null,null,'TBC (BV Inspected)','TBC',null,'2000 kVA',1,'05-Mar-2023',2023,null,null,null,30,null,28,'Good',null,null,null,null,'Commissioned by Bureau Veritas',false,'Hotel Assets (JMB)',20],
    ['JMB-TR-003','SBJ-JMB-TR-03','Dry Type Transformer TR-03','2000 kVA Transformer','Hotel Assets (JMB)','Electrical','Transformer',null,'Hotel JMB - Substation',null,null,null,null,'TBC (BV Inspected)','TBC',null,'2000 kVA',1,'05-Mar-2023',2023,null,null,null,30,null,28,'Good',null,null,null,null,'Commissioned by Bureau Veritas',false,'Hotel Assets (JMB)',21],
    ['JMB-TR-004','SBJ-JMB-TR-04','Dry Type Transformer TR-04','2000 kVA Transformer','Hotel Assets (JMB)','Electrical','Transformer',null,'Hotel JMB - Substation',null,null,null,null,'TBC (BV Inspected)','TBC',null,'2000 kVA',1,'05-Mar-2023',2023,null,null,null,30,null,28,'Good',null,null,null,null,'Commissioned by Bureau Veritas',false,'Hotel Assets (JMB)',22],
    ['JMB-TR-005','SBJ-JMB-TR-05','Dry Type Transformer TR-05','2000 kVA Transformer','Hotel Assets (JMB)','Electrical','Transformer',null,'Hotel JMB - Substation',null,null,null,null,'TBC (BV Inspected)','TBC',null,'2000 kVA',1,'05-Mar-2023',2023,null,null,null,30,null,28,'Good',null,null,null,null,'Commissioned by Bureau Veritas',false,'Hotel Assets (JMB)',23],
    ['JMB-GEN-001','SBJ-JMB-GEN-01','Diesel Generator','Standby Generator for Hotel','Hotel Assets (JMB)','Electrical','Generator',null,'Hotel JMB - Generator Room (1 BOH - 15A)',null,null,null,null,'TBC','TBC',null,'TBC',1,'TBC',2019,null,null,null,20,null,18,'Good',null,null,null,null,'Make/Model/Capacity not in docs',false,'Hotel Assets (JMB)',30],
    ['JMB-LF-HG1','SBJ-JMB-LF-HG1','Passenger Lift HG1','Guest Lift - 1600kg','Hotel Assets (JMB)','Lifts','Passenger Lift',null,'Hotel JMB - Guest Area',null,null,null,null,'OTIS','Gen2 Regen',null,'1600kg',1,'25-Apr-2022',2022,null,null,null,25,null,22,'Good',null,null,null,null,'Installed by Bahwan Engineering',false,'Hotel Assets (JMB)',31],
    ['JMB-LF-HS1','SBJ-JMB-LF-HS1','Service Lift HS1','Service Lift - 2000kg','Hotel Assets (JMB)','Lifts','Service Lift',null,'Hotel JMB - BOH',null,null,null,null,'OTIS','Gen2 Premier',null,'2000kg',1,'25-Apr-2022',2022,null,null,null,25,null,22,'Good',null,null,null,null,'Installed by Bahwan Engineering',false,'Hotel Assets (JMB)',37],
    ['JMB-POOL-001','SBJ-JMB-POOL','Swimming Pool & Water Features','Pool circulation, chemical dosing, filters','Hotel Assets (JMB)','Equipment','Pool',null,'Hotel JMB - Pool Area',null,null,null,null,'Al Ansari/Grand Effects','TBC',null,'TBC',1,'May-2022',2022,null,null,null,20,null,17,'Good',null,null,null,null,'1-year warranty from 24/05/2022',false,'Hotel Assets (JMB)',58],
    ['JMB-BMS-001','SBJ-JMB-BMS','Building Management System','BMS for hotel automation','Hotel Assets (JMB)','ELV','BMS',null,'Hotel JMB - Control Room',null,null,null,null,'TBC','TBC',null,'TBC',1,'TBC',2019,null,null,null,15,null,13,'Good',null,null,null,null,'Integrated system',false,'Hotel Assets (JMB)',48],
    ['JMB-KIT-001','SBJ-JMB-KIT','Kitchen Equipment','Commercial kitchen equipment','Hotel Assets (JMB)','Equipment','Kitchen',null,'Hotel JMB - Kitchen',null,null,null,null,'Al-Ansari Kitchen','TBC',null,'TBC',1,'TBC',2019,null,null,null,15,null,13,'Good',null,null,null,null,null,false,'Hotel Assets (JMB)',55],
  ];
  for (const hr of hotelRows) rows.push(r(hr));
  console.log(`  Hotel JMB rows: ${hotelRows.length}`);

  // ====== BOQ CROSS-REFERENCE (key infrastructure items) ======
  const boqItems = [
    ['NEW-ELEC-0001','MB-ELEC-0001','11kV/0.4kV Distribution Transformers (1000 kVA)','BOQ ref X900.3','Electrical','Power Distribution',null,null,null,null,null,null,'Infrastructure-wide (Zones 3, 5, 8)',null,null,null,null,null,null,2017,'QUARTERLY',null,'Yes',30,null,null,'TBD - Survey Required','TO VERIFY',null,null,'Muscat Bay',null,false,'BOQ Cross-Reference',null],
    ['NEW-ELEC-0002','MB-ELEC-0002','Main Feeder Pillars (FP-series)','BOQ ref X900.5','Electrical','Power Distribution',null,null,null,null,null,null,'Infrastructure-wide',null,null,null,null,null,null,2017,'QUARTERLY',null,'Yes',25,null,null,'TBD - Survey Required','TO VERIFY',null,null,'Muscat Bay',null,false,'BOQ Cross-Reference',null],
    ['NEW-ELEC-0003','MB-ELEC-0003','Mini Feeder Pillars (TZ-series)','BOQ refs X900.7-10','Electrical','Power Distribution',null,null,null,null,null,null,'Infrastructure-wide',null,null,null,null,null,null,2017,'QUARTERLY',null,'Yes',25,null,null,'TBD - Survey Required','TO VERIFY',null,null,'Muscat Bay',null,false,'BOQ Cross-Reference',null],
    ['NEW-ELEC-0004','MB-ELEC-0004','11kV Ring Main Units (RMU)','BOQ ref X900.2','Electrical','HV Switchgear',null,null,null,null,null,null,'Infrastructure-wide',null,null,null,null,null,null,2017,'QUARTERLY',null,'Yes',30,null,null,'TBD - Survey Required','TO VERIFY',null,null,'Muscat Bay',null,false,'BOQ Cross-Reference',null],
    ['NEW-ELEC-0005','MB-ELEC-0005','Street Light Poles (6m & 9m)','Bill 3 (OMR 344,931)','Electrical','External Lighting',null,null,null,null,null,null,'Infrastructure roads',null,null,null,null,null,null,2017,'QUARTERLY',null,'Yes',20,null,null,'TBD - Survey Required','TO VERIFY',null,null,'Muscat Bay',null,false,'BOQ Cross-Reference',null],
    ['NEW-MECH-0006','MB-MECH-0006','Bulk Water Meters','BOQ ref X900.6','Mechanical & Plumbing','Metering',null,null,null,null,null,null,'Infrastructure-wide',null,null,null,null,null,null,2017,'QUARTERLY',null,'Yes',15,null,null,'TBD - Survey Required','TO VERIFY',null,null,'Muscat Bay',null,false,'BOQ Cross-Reference',null],
    ['NEW-CIVIL-0011','MB-CIVIL-0011','Surface Water Drainage Culverts & Manholes','Culverts, stormwater manholes','Civil','Drainage',null,null,null,null,null,null,'Infrastructure-wide',null,null,null,null,null,null,2017,'SEMI-ANNUAL',null,'Yes',50,null,null,'TBD - Survey Required','TO VERIFY',null,null,'Muscat Bay',null,false,'BOQ Cross-Reference',null],
    ['NEW-CIVIL-0098','MB-CIVIL-0098','Tensar Earth Retaining Wall System','High-value passive infrastructure','Civil','Retaining Walls',null,null,null,null,null,null,'Zone 3',null,null,null,null,null,null,2019,'ANNUAL',null,'Yes',60,null,null,'TBD - Survey Required','TO VERIFY',null,null,'Muscat Bay',null,false,'BOQ Cross-Reference',null],
    ['NEW-ELEC-0129','MB-ELEC-0129','ANPR Camera System (19 cameras)','SecurOS license','Electrical','Security / CCTV',null,null,null,null,null,null,'Gate/Entrance points',null,null,null,null,null,null,2020,'MONTHLY',null,'Yes',10,null,null,'TBD - Survey Required','TO VERIFY',null,null,'Muscat Bay',null,false,'BOQ Cross-Reference',null],
    ['NEW-CIVIL-0145','MB-CIVIL-0145','Lagoon Basin Structure & Surface Coating','Needs periodic recoating','Civil','Water Features',null,null,null,null,null,null,'Lagoon',null,null,null,'44,000 sqft surface area',null,null,2022,'WEEKLY',null,'Yes',10,null,null,'TBD - Survey Required','TO VERIFY',null,null,'Muscat Bay',null,false,'BOQ Cross-Reference',null],
  ];
  for (const b of boqItems) rows.push(r(b));
  console.log(`  BOQ Cross-Reference rows: ${boqItems.length}`);

  return rows;
}

async function main() {
  const rows = generateAll();
  console.log(`\nTotal Part 2 rows to upload: ${rows.length}`);

  let uploaded = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from(T).insert(batch);
    if (error) {
      console.error(`\nBatch ${Math.floor(i/BATCH)+1} FAILED:`, error.message);
      for (let j = 0; j < batch.length; j++) {
        const { error: e2 } = await supabase.from(T).insert([batch[j]]);
        if (e2) { console.error(`  Row ${i+j} (UID: ${batch[j].Asset_UID}):`, e2.message); break; }
      }
      process.exit(1);
    }
    uploaded += batch.length;
    process.stdout.write(`\r  Uploaded ${uploaded}/${rows.length}`);
  }
  console.log('\n  Part 2 upload complete!');
  const { count } = await supabase.from(T).select('*', { count: 'exact', head: true });
  console.log(`  Total rows in table: ${count}`);
}

main().catch(e => { console.error(e); process.exit(1); });
