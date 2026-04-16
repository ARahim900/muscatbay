#!/usr/bin/env node
/**
 * Upload ALL remaining non-zone asset data to Supabase
 * Zone data (Elec/Ac/MECH/PLUM/CIVIL/PAINT OTHERS) already uploaded by gen-zone-assets.js
 * STP rows 2-100 already uploaded via SQL
 * This script handles: remaining STP, all Electrical specific, all M&P specific, all HVAC,
 *                       Village Square, Lifts, Hotel JMB, BOQ Cross-Reference
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const BATCH = 100;
const TABLE = 'Assets_Register_Database';

// Helper: create row with defaults
function r(uid, tag, name, desc, disc, cat, subcat, sysArea, loc, locTag, bldg, flrArea, zone, mfr, model, country, capSize, qty, instDate, instYear, ppmFreq, ppmInt, active, lifeExp, curAge, erl, cond, status, supplier, amc, owner, notes, dupFlag, srcSheet, srcRow) {
  return {
    Asset_UID: uid||null, Asset_Tag: tag||null, Asset_Name: name||null, Asset_Description: desc||null,
    Discipline: disc||null, Category: cat||null, Subcategory: subcat||null, System_Area: sysArea||null,
    Location_Name: loc||null, Location_Tag: locTag||null, Building: bldg||null, Floor_Area: flrArea||null,
    Zone: zone||null, Manufacturer_Brand: mfr||null, Model: model||null, Country_Of_Origin: country||null,
    Capacity_Size: capSize||null, Quantity: qty ? parseInt(qty) : null, Install_Date: instDate||null,
    Install_Year: instYear ? parseInt(instYear) : null, PPM_Frequency: ppmFreq||null, PPM_Interval: ppmInt||null,
    Is_Asset_Active: active||null, Life_Expectancy_Years: lifeExp ? parseInt(lifeExp) : null,
    Current_Age_Years: curAge ? parseInt(curAge) : null, ERL_Years: erl ? parseInt(erl) : null,
    Condition: cond||null, Status: status||null, Supplier_Vendor: supplier||null,
    AMC_Contractor: amc||null, Responsibility_Owner: owner||null, Notes_Remarks: notes||null,
    Tag_Duplicate_Flag: dupFlag === true || dupFlag === 'true' ? true : false,
    Source_Sheet: srcSheet||null, Source_Row: srcRow ? parseInt(srcRow) : null
  };
}

// Shorthand for STP Equipment rows
function stp(uid, tag, name, desc, cat, subcat, sysArea, loc, mfr, model, country, lifeExp, notes, srcRow) {
  return r(uid, tag, name, desc, 'STP Equipment', cat, subcat, sysArea, loc, null, null, null, null, mfr, model, country, null, null, null, 2019, null, null, null, lifeExp, null, null, null, 'Working', null, null, null, notes, false, 'STP Equipment', srcRow);
}

// Shorthand for Electrical rows (Zone 1 FM/building pattern)
function elec(uid, tag, name, desc, subcat, loc, locTag, zone, capSize, instDate, ppmFreq, lifeExp, srcRow) {
  return r(uid, tag, name, desc, 'Electrical', 'ELECTRICAL', subcat, null, loc, locTag, null, null, zone, null, null, null, capSize, null, instDate||'2019-01-01', 2019, ppmFreq||'Q', null, 'Y', lifeExp, null, null, null, null, null, null, null, null, false, 'Electrical', srcRow);
}

// Shorthand for M&P rows
function mp(uid, tag, name, desc, subcat, loc, locTag, zone, capSize, ppmFreq, lifeExp, notes, srcRow) {
  return r(uid, tag, name, desc, 'Mechanical & Plumbing', 'MECHANICAL & PLUMBING', subcat, null, loc, locTag, null, null, zone, null, null, null, capSize, null, '2019-01-01', 2019, ppmFreq||'Q', null, 'Y', lifeExp, null, null, null, null, null, null, null, notes, false, 'Mechanical & Plumbing', srcRow);
}

// Shorthand for HVAC rows
function hvac(uid, tag, name, desc, subcat, loc, locTag, zone, capSize, ppmFreq, lifeExp, notes, srcRow) {
  return r(uid, tag, name, desc, 'HVAC', 'HVAC', subcat, null, loc, locTag, null, null, zone, null, null, null, capSize, null, '2019-01-01', 2019, ppmFreq, null, 'Y', lifeExp, null, null, null, null, null, null, null, notes, false, 'HVAC', srcRow);
}

function generateAllRows() {
  const rows = [];

  // ==================== REMAINING STP (rows 101-170) ====================
  // Pumps 13-19
  rows.push(stp('STP-PUMP-013','STP-601-P-01','Tankering Effluent Offsite Pump-01','Duty Pump','Duty Pump','Pumps','Offsite',null,'TBD','TBD','TBD',13,'Tankering effluent',101));
  rows.push(stp('STP-PUMP-014','STP-601-P-02','Tankering Effluent Offsite Pump-02','Standby Pump','Standby Pump','Pumps','Offsite',null,'TBD','TBD','TBD',13,'Tankering effluent',102));
  rows.push(stp('STP-INST-056','STP-OFF-PS-01','Offsite Pressure Switch-01','Offsite','Offsite','Instrumentation','Offsite',null,'TBD','TBD','TBD',10,'Pressure switch',103));
  rows.push(stp('STP-INST-057','STP-OFF-PS-02','Offsite Pressure Switch-02','Offsite','Offsite','Instrumentation','Offsite',null,'TBD','TBD','TBD',10,'Pressure switch',104));
  rows.push(stp('STP-PUMP-015','STP-603-P-01','Process Water Pump-01','Duty Pump','Duty Pump','Pumps','Process Water',null,'TBD','TBD','TBD',13,'Process water supply',105));
  rows.push(stp('STP-PUMP-016','STP-603-P-02','Process Water Pump-02','Standby Pump','Standby Pump','Pumps','Process Water',null,'TBD','TBD','TBD',13,'Process water supply',106));
  rows.push(stp('STP-INST-058','STP-PROC-PS-01','Process Water Pressure Switch-01','Process Water','Process Water','Instrumentation','Process Water',null,'TBD','TBD','TBD',10,'Pressure switch',107));
  rows.push(stp('STP-INST-059','STP-PROC-PS-02','Process Water Pressure Switch-02','Process Water','Process Water','Instrumentation','Process Water',null,'TBD','TBD','TBD',10,'Pressure switch',108));
  rows.push(stp('STP-INST-060','STP-PROC-PS-03','Process Water Pressure Switch-03','Process Water','Process Water','Instrumentation','Process Water',null,'TBD','TBD','TBD',10,'Pressure switch',109));
  rows.push(stp('STP-PUMP-017','STP-RAS-P-01','RAS/WAS Pump-01','Duty Pump','Duty Pump','Pumps','MBR Area',null,'TBD','TBD','TBD',13,'Return/Waste Activated Sludge',110));
  rows.push(stp('STP-PUMP-018','STP-RAS-P-02','RAS/WAS Pump-02','Duty Pump','Duty Pump','Pumps','MBR Area',null,'TBD','TBD','TBD',13,'Return/Waste Activated Sludge',111));
  rows.push(stp('STP-PUMP-019','STP-RAS-P-03','RAS/WAS Pump-03','Standby Pump','Standby Pump','Pumps','MBR Area',null,'TBD','TBD','TBD',13,'Return/Waste Activated Sludge',112));
  rows.push(stp('STP-INST-061','STP-RAS-DP-01','RAW/WAS Pump-01 Discharge Pressure Switch','MBR Area','MBR Area','Instrumentation','MBR Area',null,'TBD','TBD','TBD',10,'Low-pressure alarm',113));
  rows.push(stp('STP-INST-062','STP-RAS-DP-02','RAW/WAS Pump-02 Discharge Pressure Switch','MBR Area','MBR Area','Instrumentation','MBR Area',null,'TBD','TBD','TBD',10,'Low-pressure alarm',114));
  rows.push(stp('STP-INST-063','STP-RAS-DP-03','RAW/WAS Pump-03 Discharge Pressure Switch','MBR Area','MBR Area','Instrumentation','MBR Area',null,'TBD','TBD','TBD',10,'Low-pressure alarm',115));
  rows.push(stp('STP-INST-064','STP-SHT-LT','Sludge Holding Tank Level Transmitter','Sludge tank','Sludge tank','Instrumentation','Sludge Tank',null,'TBD','TBD','TBD',10,'Tank level',116));
  rows.push(stp('STP-INST-065','STP-SHT-DOT','Sludge Holding Tank Dissolved Oxygen Transmitter','Sludge tank','Sludge tank','Instrumentation','Sludge Tank',null,'JUMO','AQUIS 500RS','Germany',10,'DO measurement',117));
  rows.push(stp('STP-SAMP-001','STP-ILS-SAMP','ILS Automatic Sampler','Lifting station','Lifting station','Samplers','Lifting Station',null,'HACH','AS950 AWRS','USA',10,'All Weather Refrigerated Sampler, CE/UL/CSA',118));
  rows.push(stp('STP-SAMP-002','STP-AWRS-02','Automatic Sampler 2','Duty sampler','Duty sampler','Samplers','Process Area',null,'HACH','AS950 AWRS','USA',10,'All Weather Refrigerated Sampler, CE/UL/CSA',119));

  // STP Valves
  const valveDescs = [
    ['STP-VALVE-001','STP-MBR-V01','VALVE-01 TO MBR TANK 400-T-03','Raw Sewage Butterfly','Raw Sewage Butterfly','DN400','Size 400',120],
    ['STP-VALVE-002','STP-MBR-V02','VALVE-02 TO MBR TANK 400-T-03','Raw Water Ball Valve','Raw Water Ball Valve','DN220','Size 220',121],
    ['STP-VALVE-003','STP-MBR-V03','VALVE-01 TO MBR TANK 401-T-03','Raw Sewage Butterfly','Raw Sewage Butterfly','DN400','Size 400',122],
    ['STP-VALVE-004','STP-MBR-V04','VALVE-02 TO MBR TANK 401-T-03','Raw Water Butterfly','Raw Water Butterfly','DN220','Size 220',123],
    ['STP-VALVE-005','STP-SLD-V01','FLOW TO SLUDGE STORAGE TANK','Raw Sewage Wedge Gate','Raw Sewage Wedge Gate','DN400','Size 400',124],
    ['STP-VALVE-006','STP-MBR-V05','VALVE-01 TO MBR STREAM-1 400-T-03','Treated Sewage Butterfly','Treated Sewage Butterfly','DN400','Size 400',125],
    ['STP-VALVE-007','STP-MBR-V06','VALVE-02 FROM MBR STREAM-1 400-T-03','Treated Sewage Butterfly','Treated Sewage Butterfly','DN400','Size 400',126],
    ['STP-VALVE-008','STP-MBR-V07','VALVE-03 TO MBR STREAM-2 401-T-03','Treated Sewage Butterfly','Treated Sewage Butterfly','DN400','Size 400',127],
    ['STP-VALVE-009','STP-MBR-V08','VALVE-04 FROM MBR STREAM-2 401-T-03','Treated Sewage Butterfly','Treated Sewage Butterfly','DN400','Size 400',128],
    ['STP-VALVE-010','STP-MBR-V09','VALVE-05 MBR PUMP SUCTION P1&P2','Treated Sewage Butterfly','Treated Sewage Butterfly','DN400','Common for Pump 1 & 2',129],
    ['STP-VALVE-011','STP-MBR-V10','VALVE-06 MBR PUMP SUCTION P2&P3','Treated Sewage Butterfly','Treated Sewage Butterfly','DN400','Common for Pump 2 & 3',130],
    ['STP-VALVE-012','STP-MBR-V11','VALVE-07 MBR PUMP SUCTION P1','Treated Sewage Butterfly','Treated Sewage Butterfly','DN400','For Pump-1',131],
    ['STP-VALVE-013','STP-MBR-V12','VALVE-08 MBR PUMP SUCTION P2','Treated Sewage Butterfly','Treated Sewage Butterfly','DN400','For Pump-2',132],
  ];
  for (const v of valveDescs) {
    const area = v[0].includes('SLD') ? 'Sludge Area' : 'MBR Area';
    rows.push(r(v[0], v[1], v[2], v[3], 'STP Equipment', v[4], 'Valves', area, null, null, null, null, null, 'TBD', v[5], 'TBD', null, null, null, 2019, null, null, null, 20, null, null, null, 'Working', null, null, null, v[6], false, 'STP Equipment', v[7]));
  }

  // STP Fire, Security, Auxiliary (rows 153-170)
  rows.push(stp('STP-FIRE-001','STP-FADP','Fire Alarm Control Panel','Fire Detection','Fire Detection','Control Panel','STP - Admin Building',null,'JSB','FX2208','TBC',15,'From Celar Register - ROP/Civil Defense approved',153));
  rows.push(stp('STP-FIRE-002','STP-SMK-DET','Optical Smoke Detectors','Fire Detection','Fire Detection','Detector','STP - Admin Building',null,'JSB','TBC','TBC',10,'Multiple units - quantity TBC',154));
  rows.push(stp('STP-FIRE-003','STP-HEAT-DET','Heat Detectors','Fire Detection','Fire Detection','Detector','STP - Process Area',null,'JSB','TBC','TBC',10,'Multiple units - quantity TBC',155));
  rows.push(stp('STP-FIRE-004','STP-SOUND','Fire Alarm Sounders','Fire Detection','Fire Detection','Sounder','STP - Site Wide',null,'JSB','TBC','TBC',10,'Multiple units - quantity TBC',156));
  rows.push(stp('STP-FIRE-005','STP-EXTG','Fire Extinguishers','Fire Safety','Fire Safety','Extinguisher','STP - Site Wide',null,'TBC','TBC','TBC',10,'Various types - inventory TBC',157));
  rows.push(stp('STP-CCTV-001','STP-NVR','CCTV Network Video Recorder','Security','Security','NVR','STP - Admin Building',null,'Watchnet','TBC','TBC',10,'From Celar Register',158));
  rows.push(stp('STP-CCTV-002','STP-CAM','CCTV Cameras','Security','Security','Camera','STP - Site Wide',null,'Watchnet','TBC','TBC',10,'Multiple units - quantity TBC',159));
  rows.push(stp('STP-ACS-001','STP-BIO-01','Biometric Access Reader 1','Security','Security','Access Control','STP - Main Entrance',null,'Watchnet','WAB BEM FCKS','TBC',10,'From Celar Register',160));
  rows.push(stp('STP-ACS-002','STP-BIO-02','Biometric Access Reader 2','Security','Security','Access Control','STP - Admin Building',null,'Watchnet','WAB BEM FCKS','TBC',10,'From Celar Register',161));
  rows.push(stp('STP-HVAC-001','STP-AC-ADMIN','Admin Building AC Units','HVAC','HVAC','Split AC','STP - Admin Building',null,'TBC','TBC','TBC',12,'From Celar Register - details TBC',162));
  rows.push(stp('STP-LIT-001','STP-EXT-LIT','Exterior Lighting System','Electrical','Electrical','Lighting','STP - Site Wide',null,'TBC','TBC','TBC',15,'From Celar Register - details TBC',163));
  rows.push(stp('STP-NET-001','STP-DATA-NET','Data & Telephone Network','IT/Comms','IT/Comms','Cabling','STP - Admin Building',null,'Avayo','Cat6','TBC',20,'From Celar Register',164));
  rows.push(stp('STP-TANK-005','STP-DWT-TANK','Domestic Water Tank','Plumbing','Plumbing','Tank','STP - Admin Building',null,'TBC','TBC','TBC',25,'From Celar Register - capacity TBC',165));
  rows.push(stp('STP-HW-001','STP-WH','Water Heater','Plumbing','Plumbing','Water Heater','STP - Admin Building',null,'TBC','TBC','TBC',10,'From Celar Register',166));
  rows.push(stp('STP-UPS-001','STP-UPS-CTRL','Control System UPS','Electrical','Electrical','UPS','STP - Electrical Room',null,'APC','Smart-UPS SRT','USA',8,'2 kVA - Supplies control system',167));
  rows.push(stp('STP-GEN-001','STP-DG-01','Standby Diesel Generator','Electrical','Electrical','Generator','STP - Generator Room',null,'TBC','TBC','TBC',25,'350 kVA confirmed, brand/model to be verified with OWATCO',168));
  rows.push(r('STP-MBR-MEM-001','STP-MBR-M1','MBR Membrane Module Stream 1','MBR','STP Equipment','MBR','Membrane',null,'STP - MBR Tank 1',null,null,null,null,'Koch Membrane Systems (KMS)','PURON® PSH 660-10','USA',null,null,null,2019,null,null,null,8,null,null,null,'Working',null,null,null,'PVDF Hollow Fiber, 0.03µm pore, recently replaced (charged back to Celar Water)',false,'STP Equipment',169));
  rows.push(r('STP-MBR-MEM-002','STP-MBR-M2','MBR Membrane Module Stream 2','MBR','STP Equipment','MBR','Membrane',null,'STP - MBR Tank 2',null,null,null,null,'Koch Membrane Systems (KMS)','PURON® PSH 660-10','USA',null,null,null,2019,null,null,null,8,null,null,null,'Working',null,null,null,'PVDF Hollow Fiber, 0.03µm pore, recently replaced (charged back to Celar Water)',false,'STP Equipment',170));

  // ==================== ELECTRICAL SPECIFIC (non-OTHERS) ====================
  // These are rows 1-416 + GEN-STP-001 in Source_Sheet=Electrical
  // Generating programmatically where patterns repeat across buildings

  // APFC panels (rows 2-3)
  rows.push(elec('1','SBJ-Z1-FM-GF-LVP-APFC1','APFC1','APFC PANEL-01 (675 KVAR)(MB-1-1GF-0142)','AUTOMATIC POWER FACTOR CONTROL PANEL','LV PANEL ROOM','SBJ-Z1-FM-GF-LVP','Z1',null,'2019-01-01','Q',20,2));
  rows.push(elec('2','SBJ-Z1-FM-GF-LVP-APFC2','APFC2','APFC PANEL-02 (675 KVAR)(MB-1-1GF-0143)','AUTOMATIC POWER FACTOR CONTROL PANEL','LV PANEL ROOM','SBJ-Z1-FM-GF-LVP','Z1',null,'2019-01-01','Q',20,3));
  rows.push(elec('3','SBJ-Z1-FM-GF-LVP-MCC','MCC','MCC-FM(MB-1-1GF-0137)','MOTOR CONTROL CENTRE PANEL','LV PANEL ROOM','SBJ-Z1-FM-GF-LVP','Z1',null,'2019-01-01','Q',20,4));

  // Power DBs in LV Panel Room (rows 5-8)
  rows.push(elec('4','SBJ-Z1-FM-GF-LVP-ELDB1','ELDB1','MDB-01(MB-1-1GF-0140)','POWER DB','LV PANEL ROOM','SBJ-Z1-FM-GF-LVP','Z1',null,'2019-01-01','Q',25,5));
  rows.push(elec('5','SBJ-Z1-FM-GF-LVP-ELDB2','ELDB2','MDB-02(MB-1-1GF-0141)','POWER DB','LV PANEL ROOM','SBJ-Z1-FM-GF-LVP','Z1',null,'2019-01-01','Q',25,6));
  rows.push(elec('6','SBJ-Z1-FM-GF-LVP-ELDB3','ELDB3','DB (DB-UP-LP)(MB-1-1GF-0144)','POWER DB','LV PANEL ROOM','SBJ-Z1-FM-GF-LVP','Z1',null,'2019-01-01','Q',25,7));
  rows.push(elec('7','SBJ-Z1-FM-GF-LVP-ELDB4','ELDB4','SATELLITE FACILITY MEP BLDG PANEL (DDC-22)(MB-1-1GF-0145)','POWER DB','LV PANEL ROOM','SBJ-Z1-FM-GF-LVP','Z1',null,'2019-01-01','Q',25,8));

  // Access Doors for Z3 buildings (rows 9-28)
  const accessDoorBuildings = [
    ['8','SBJ-Z3A-B75-GF-ENT-CVLAD-2759','CVLAD-2759','ENTRANCE','SBJ-Z3A-B75-GF-ENT',null,9],
    ['9','SBJ-Z3A-B74-GF-ENT-CVLAD-2758','CVLAD-2758','ENTRANCE','SBJ-Z3A-B74-GF-ENT',null,10],
    ['10','SBJ-Z3A-B44-GF-ENT-CVLAD-2757','CVLAD-2757','ENTRANCE','SBJ-Z3A-B44-GF-ENT',null,11],
    ['11','SBJ-Z3A-B45-GF-ENT-CVLAD-2756','CVLAD-2756','ENTRANCE','SBJ-Z3A-B45-GF-ENT',null,12],
    ['12','SBJ-Z3A-B46-GF-ENT-CVLAD-2755','CVLAD-2755','ENTRANCE','SBJ-Z3A-B46-GF-ENT',null,13],
    ['13','SBJ-Z3A-B47-GF-ENT-CVLAD-2754','CVLAD-2754','ENTRANCE','SBJ-Z3A-B47-GF-ENT',null,14],
    ['14','SBJ-Z3A-B48-GF-ENT-CVLAD-2753','CVLAD-2753','ENTRANCE','SBJ-Z3A-B48-GF-ENT',null,15],
    ['15','SBJ-Z3A-B49-GF-ENT-CVLAD-2752','CVLAD-2752','ENTRANCE','SBJ-Z3A-B49-GF-ENT',null,16],
    ['16','SBJ-Z3A-B50-GF-ENT-CVLAD-2751','CVLAD-2751','ENTRANCE','SBJ-Z3A-B50-GF-ENT',null,17],
    ['17','SBJ-Z3A-B51-GF-ENT-CVLAD-2750','CVLAD-2750','ENTRANCE','SBJ-Z3A-B51-GF-ENT',null,18],
    ['18','SBJ-Z3B-B52-GF-ENT-CVLAD-2749','CVLAD-2749','ENTRANCE','SBJ-Z3B-B52-GF-ENT',null,19],
    ['19','SBJ-Z3B-B53-GF-ENT-CVLAD-2748','CVLAD-2748','ENTRANCE','SBJ-Z3B-B53-GF-ENT',null,20],
    ['20','SBJ-Z3B-B54-GF-ENT-CVLAD-2747','CVLAD-2747','ENTRANCE','SBJ-Z3B-B54-GF-ENT',null,21],
    ['21','SBJ-Z3B-B55-GF-ENT-CVLAD-2746','CVLAD-2746','ENTRANCE','SBJ-Z3B-B55-GF-ENT',null,22],
    ['22','SBJ-Z3B-B56-GF-ENT-CVLAD-2745','CVLAD-2745','ENTRANCE','SBJ-Z3B-B56-GF-ENT',null,23],
    ['23','SBJ-Z3B-B57-GF-ENT-CVLAD-2744','CVLAD-2744','ENTRANCE','SBJ-Z3B-B57-GF-ENT',null,24],
    ['24','SBJ-Z3B-B58-GF-ENT-CVLAD-2743','CVLAD-2743','ENTRANCE','SBJ-Z3B-B58-GF-ENT',null,25],
    ['25','SBJ-Z3B-B59-GF-ENT-CVLAD-2742','CVLAD-2742','ENTRANCE','SBJ-Z3B-B59-GF-ENT',null,26],
    ['26','SBJ-Z3B-B60-GF-ENT-CVLAD-2741','CVLAD-2741','ENTRANCE','SBJ-Z3B-B60-GF-ENT',null,27],
    ['27','SBJ-Z3B-B61-GF-ENT-CVLAD-2740','CVLAD-2740','ENTRANCE','SBJ-Z3B-B61-GF-ENT',null,28],
    ['28','SBJ-Z3B-B62-GF-ENT-CVLAD-2739','CVLAD-2739','ENTRANCE','SBJ-Z3B-B62-GF-ENT',null,29],
  ];
  for (const ad of accessDoorBuildings) {
    rows.push(elec(ad[0], ad[1], ad[2], 'ACCESS DOORS', 'ACCESS DOORS', ad[3], ad[4], null, null, '2019-01-01', 'Q', 15, ad[6]));
  }

  // Various Z1 control panels (rows 29-52)
  rows.push(elec('29','SBJ-Z1-IP1-APFC','APFC','CAPACITOR PANEL','AUTOMATIC POWER FACTOR CONTROL PANEL','Irrigation Pump 1','SBJ-Z1-IP1','Z1',null,'2019-01-01','Q',20,30));

  // Exhaust/Control panels on rooftops
  const z1RoofPanels = [
    ['30','SBJ-Z1-FM-RT-EXP1','EXP1','EXHAUST FAN PANEL','CONTROL PANEL','ROOF TOP','SBJ-Z1-FM-RF','Z1',15,31],
    ['31','SBJ-Z1-FM-RT-EXP2','EXP2','EXHAUST FAN PANEL','CONTROL PANEL','ROOF TOP','SBJ-Z1-FM-RF','Z1',15,32],
    ['32','SBJ-Z1-FM-RT-CAP1','CAP1','CALORIFIER PANEL','CONTROL PANEL','ROOF TOP','SBJ-Z1-FM-RF','Z1',15,33],
    ['33','SBJ-Z1-FM-RT-CAP2','CAP2','CALORIFIER PANEL','CONTROL PANEL','ROOF TOP','SBJ-Z1-FM-RF','Z1',15,34],
    ['34','SBJ-Z1-B1-RF-CPMUP','CPMUP','MAKE UP WATER PUMP CONTROL PANEL','CONTROL PANEL','ROOF TOP','SBJ-Z1-B1-RF','Z1',15,35],
    ['35','SBJ-Z1-B2-RF-CPHWR','CPHWR','CONTROL PANEL HWR','CONTROL PANEL','ROOF TOP','SBJ-Z1-B2-RF','Z1',15,36],
    ['36','SBJ-Z1-B2-RF-CPMUP','CPMUP','MAKE UP WATER PUMP CONTROL PANEL','CONTROL PANEL','ROOF TOP','SBJ-Z1-B2-RF','Z1',15,37],
    ['37','SBJ-Z1-B3-RF-CPMUP','CPMUP','MAKE UP WATER PUMP CONTROL PANEL','CONTROL PANEL','ROOF TOP','SBJ-Z1-B3-RF','Z1',15,38],
    ['38','SBJ-Z1-B4-RF-CPHWR','CPHWR','CONTROL PANEL HWR','CONTROL PANEL','ROOF TOP','SBJ-Z1-B4-RF','Z1',15,39],
    ['39','SBJ-Z1-B4-RF-CPMUP','CPMUP','MAKE UP WATER PUMP CONTROL PANEL','CONTROL PANEL','ROOF TOP','SBJ-Z1-B4-RF','Z1',15,40],
    ['40','SBJ-Z1-B4-RF-CPBP','CPBP','BOOSTER PUMP CONTROL PANEL','CONTROL PANEL','ROOF TOP','SBJ-Z1-B4-RF','Z1',15,41],
    ['41','SBJ-Z1-B5-RF-CPHWR','CPHWR','CONTROL PANEL HWR','CONTROL PANEL','ROOF TOP','SBJ-Z1-B5-RF','Z1',15,42],
    ['42','SBJ-Z1-B5-RF-CPMUP','CPMUP','MAKE UP WATER PUMP CONTROL PANEL','CONTROL PANEL','ROOF TOP','SBJ-Z1-B5-RF','Z1',15,43],
    ['43','SBJ-Z1-B5-RF-CPBP','CPBP','BOOSTER PUMP CONTROL PANEL','CONTROL PANEL','ROOF TOP','SBJ-Z1-B5-RF','Z1',15,44],
    ['44','SBJ-Z1-B6-RF-CPHWR','CPHWR','CONTROL PANEL HWR','CONTROL PANEL','ROOF TOP','SBJ-Z1-B6-RF','Z1',15,45],
    ['45','SBJ-Z1-B6-RF-CPMUP','CPMUP','MAKE UP WATER PUMP CONTROL PANEL','CONTROL PANEL','ROOF TOP','SBJ-Z1-B6-RF','Z1',15,46],
    ['46','SBJ-Z1-B6-RF-CPBP','CPBP','BOOSTER PUMP CONTROL PANEL','CONTROL PANEL','ROOF TOP','SBJ-Z1-B6-RF','Z1',15,47],
    ['47','SBJ-Z1-B7-RF-CPMUP','CPMUP','MAKE UP WATER PUMP CONTROL PANEL','CONTROL PANEL','ROOF TOP','SBJ-Z1-B7-RF','Z1',15,48],
    ['48','SBJ-Z1-B8-RF-CPMUP','CPMUP','MAKE UP WATER PUMP CONTROL PANEL','CONTROL PANEL','Accommodation Block 8','SBJ-Z1-B8','Z1',15,49],
    ['49','SBJ-Z1-IP1-VFD1','VFD1','VFD CONTROL PANEL-01','CONTROL PANEL','Irrigation Pump 1','SBJ-Z1-IP1','Z1',15,50],
    ['50','SBJ-Z1-IP1-VFD2','VFD2','VFD CONTROL PANEL-02','CONTROL PANEL','Irrigation Pump 1','SBJ-Z1-IP1','Z1',15,51],
    ['51','SBJ-Z1-IP1-MSP','MSP','MOV STARTER PANEL','CONTROL PANEL','Irrigation Pump 1','SBJ-Z1-IP1','Z1',15,52],
  ];
  for (const p of z1RoofPanels) {
    const ppmF = [34,35,36,37,38,39,40,41,42,43,44,45,46,47,48].includes(p[0]*1) ? '2' :
                 [38,40,41,43,44,46].includes(p[0]*1) ? 'OC' : 'Q';
    rows.push(elec(p[0]+'', p[1], p[2], p[3], p[4], p[5], p[6], p[7], null, '2019-01-01', p[0]*1 >= 34 && p[0]*1 <= 48 ? '2' : 'Q', p[8], p[9]));
  }

  // Fire panels
  rows.push(elec('52','SBJ-Z1-FM-GF-FPR-DPC','DPC','DIESEL FIRE PUMP CONTROLER(MB-1-1GF-0148)','DIESEL FIRE PUMP CONTROLER','FIRE PUMP ROOM','SBJ-Z1-FM-GF-FPR','Z1',null,'2019-01-01','2',15,53));
  rows.push(elec('53','SBJ-Z1-FM-GF-FPR-EFP','EFP','ELECTRIC FIRE PUMP CONTROLER(MB-1-1GF-0147)','ELECTRIC FIRE PUMP CONTROLER','FIRE PUMP ROOM','SBJ-Z1-FM-GF-FPR','Z1',null,'2019-01-01','Q',15,54));

  // Electrical Fittings & Fixtures (rows 55-111) - generated for buildings
  const effBuildings = [
    ['54','SBJ-Z1-SCB-EFF','Security & CCTV Building','SBJ-Z1-SCB','Z1','Q',55],
    ['55','SBJ-Z1-ROP-EFF','ROP BUILDING','SBJ-Z1-ROP','Z1','Q',56],
    ['56','SBJ-Z1-SLP-EFF','Security LV Patch Panel Room','SBJ-Z1-SLP','Z1','Q',57],
    ['57','SBJ-Z1-SLP-SCR-EFF','SECURITY ROOM','SBJ-Z1-SLP-SCR','Z1','Q',58],
    ['58','SBJ-Z1-SLP-TR-EFF','IT ROOM','SBJ-Z1-SLP-TR','Z1','Q',59],
    ['59','SBJ-Z1-SLP-LVR-EFF','LV ROOM','SBJ-Z1-SLP-LV','Z1','Q',60],
    ['60','SBJ-Z1-SLP-SCP-EFF','SECURITY CHECK POINT','SBJ-Z1-SLP-SCP','Z1','Q',61],
    ['61','SBJ-Z1-FPR-EFF','Fire Pump Room','SBJ-Z1-FPR','Z1','Q',62],
    ['62','SBJ-Z1-FM-EFF','FM Building','SBJ-Z1-FM','Z1','Q',63],
    ['63','SBJ-Z1-B4-EFF','Accommodation Block 4','SBJ-Z1-B4','Z1','OC',64],
    ['64','SBJ-Z1-B5-EFF','Accommodation Block 5','SBJ-Z1-B5','Z1','OC',65],
    ['65','SBJ-Z1-B6-EFF','Accommodation Block 6','SBJ-Z1-B6','Z1','OC',66],
    ['66','SBJ-Z2-ESC-EFF','Experience & Sales Centre','SBJ-Z2-ESC','Z2','Q',67],
  ];
  for (const b of effBuildings) {
    const capSize = b[0] === '58' ? '1000 kVA 11/0.4kV' : null;
    rows.push(r(b[0], b[1], 'EFF', 'ELECTRICAL FITTINGS AND FIXTURES', 'Electrical', 'ELECTRICAL', 'ELECTRICAL FITTINGS & FIXTURES', null, b[2], b[3], null, null, b[4], null, null, null, capSize, null, '2019-01-01', 2019, b[5], null, 'Y', 15, null, null, null, null, null, null, null, null, false, 'Electrical', b[6]));
  }

  // VS Electrical Fittings (rows 68-92) - all in Village Square Z2
  const vsEffLocs = [
    ['67','SBJ-Z2-VS-CS1-EFF','Village Square','SBJ-Z2-VS','Z2',68],
    ['68','SBJ-Z2-VS-CS2-EFF','Village Square','SBJ-Z2-VS','Z2',69],
    ['69','SBJ-Z2-VS-CS3-EFF','Village Square','SBJ-Z2-VS','Z2',70],
    ['70','SBJ-Z2-VS-EFF','Village Square','SBJ-Z2-VS','Z2',71],
    ['71','SBJ-Z2-VS-LV','LIFT','SBJ-Z2-VS-LIFT','Z2',72],
    ['72','SBJ-Z2-VS-MTCA-EFF','MALE TOILET COMMON AREA','SBJ-Z2-VS-MTCA','Z2',73],
    ['73','SBJ-Z2-VS-MTS-EFF','MALE TOILET STORE','SBJ-Z2-VS-MTS','Z2',74],
    ['74','SBJ-Z2-VS-MTT-EFF','MALE TOILET','SBJ-Z2-VS-MTT','Z2',75],
    ['75','SBJ-Z2-VS-FTCA-EFF','FEMALE TOILET COMMON AREA','SBJ-Z2-VS-FTCA','Z2',76],
    ['76','SBJ-Z2-VS-FTS-EFF','FEMALE TOILET STORE','SBJ-Z2-VS-FTS','Z2',77],
    ['77','SBJ-Z2-VS-FTT-EFF','FEMALE TOILET','SBJ-Z2-VS-FTT','Z2',78],
    ['78','SBJ-Z2-VS-QTO-EFF','QANTAB TOURISM OFFICE','SBJ-Z2-VS-QTO','Z2',79],
    ['79','SBJ-Z2-VS-IDF1-EFF','TELCOM ROOM 1(IDF1)','SBJ-Z2-VS-IDF1','Z2',80],
    ['80','SBJ-Z2-VS-PR-EFF','PRAYER ROOM','SBJ-Z2-VS-PR','Z2',81],
    ['81','SBJ-Z2-VS-MPR-EFF','MALE PRAYER ROOM','SBJ-Z2-VS-MPR','Z2',82],
    ['82','SBJ-Z2-VS-FPR-EFF','FEMALE PRAYER ROOM','SBJ-Z2-VS-FPR','Z2',83],
    ['83','SBJ-Z2-VS-FWR-EFF','FEMALE WASH ROOM','SBJ-Z2-VS-FWR','Z2',84],
    ['84','SBJ-Z2-VS-IDF2CA-EFF','TELCOM ROOM 2 COMMON AREA(IDF2CA)','SBJ-Z2-VS-IDF2CA','Z2',85],
    ['85','SBJ-Z2-VS-ELR1-EFF','ELECTRICAL ROOM 1','SBJ-Z2-VS-ELR1','Z2',86],
    ['86','SBJ-Z2-VS-IDF2-EFF','TELECOM ROOM 2','SBJ-Z2-VS-IDF2','Z2',87],
    ['87','SBJ-Z2-VS-ELR2-EFF','ELECTRICAL ROOM 2','SBJ-Z2-VS-ELR2','Z2',88],
    ['88','SBJ-Z2-VS-PPR-EFF','PUMP ROOM','SBJ-Z2-VS-PPR','Z2',89],
  ];
  for (const v of vsEffLocs) {
    rows.push(r(v[0], v[1], 'EFF', 'ELECTRICAL FITTINGS AND FIXTURES', 'Electrical', 'ELECTRICAL', 'ELECTRICAL FITTINGS & FIXTURES', null, v[2], v[3], null, null, v[4], null, null, null, null, null, '2019-01-01', 2019, 'Q', null, 'Y', 15, null, null, null, null, null, null, null, null, false, 'Electrical', v[5]));
  }

  // Central Park & Z3 building EFFs (rows 90-111)
  rows.push(r('89','SBJ-Z3-CP-EFF','EFF','ELECTRICAL FITTINGS AND FIXTURES','Electrical','ELECTRICAL','ELECTRICAL FITTINGS & FIXTURES',null,'CENTRAL PARK','SBJ-Z3-CP',null,null,'Z3',null,null,null,null,null,'2019-01-01',2019,'Q',null,'Y',15,null,null,null,null,null,null,null,null,false,'Electrical',90));
  rows.push(r('90','SBJ-Z3-CP-MTT-EFF','EFF','ELECTRICAL FITTINGS AND FIXTURES','Electrical','ELECTRICAL','ELECTRICAL FITTINGS & FIXTURES',null,'MALE TOILET','SBJ-Z3-CP-MTT',null,null,'Z3',null,null,null,null,null,'2019-01-01',2019,'Q',null,'Y',15,null,null,null,null,null,null,null,null,false,'Electrical',91));
  rows.push(r('91','SBJ-Z3-CP-FTT-EFF','EFF','ELECTRICAL FITTINGS AND FIXTURES','Electrical','ELECTRICAL','ELECTRICAL FITTINGS & FIXTURES',null,'FEMALE TOILET','SBJ-Z3-CP-FTT',null,null,'Z3',null,null,null,null,null,'2019-01-01',2019,'Q',null,'Y',15,null,null,null,null,null,null,null,null,false,'Electrical',92));

  // Z3 Building EFFs (B75-B62)
  const z3EFFBuildings = [
    ['92','SBJ-Z3A-B75-EFF','Building D 75','SBJ-Z3A-B75',93],
    ['93','SBJ-Z3A-B74-EFF','Building D 74','SBJ-Z3A-B74',94],
    ['94','SBJ-Z3A-B44-EFF','Building D 44','SBJ-Z3A-B44',95],
    ['95','SBJ-Z3A-B45-EFF','Building D 45','SBJ-Z3A-B45',96],
    ['96','SBJ-Z3A-B46-EFF','Building D 46','SBJ-Z3A-B46',97],
    ['97','SBJ-Z3A-B47-EFF','Building D 47','SBJ-Z3A-B47',98],
    ['98','SBJ-Z3A-B48-EFF','Building D 48','SBJ-Z3A-B48',99],
    ['99','SBJ-Z3A-B49-EFF','Building D 49','SBJ-Z3A-B49',100],
    ['100','SBJ-Z3A-B50-EFF','Building D 50','SBJ-Z3A-B50',101],
    ['101','SBJ-Z3A-B51-EFF','Building D 51','SBJ-Z3A-B51',102],
    ['102','SBJ-Z3A-B52-EFF','Building D 52','SBJ-Z3A-B52',103],
    ['103','SBJ-Z3B-B53-EFF','Building D 53','SBJ-Z3B-B53',104],
    ['104','SBJ-Z3B-B54-EFF','Building D 54','SBJ-Z3B-B54',105],
    ['105','SBJ-Z3B-B56-EFF','Building D 56','SBJ-Z3B-B56',106],
    ['106','SBJ-Z3B-B57-EFF','Building D 57','SBJ-Z3B-B57',107],
    ['107','SBJ-Z3B-B58-EFF','Building D 58','SBJ-Z3B-B58',108],
    ['108','SBJ-Z3B-B59-EFF','Building D 59','SBJ-Z3B-B59',109],
    ['109','SBJ-Z3B-B60-EFF','Building D 60','SBJ-Z3B-B60',110],
    ['110','SBJ-Z3B-B61-EFF','Building D 61','SBJ-Z3B-B61',111],
    ['111','SBJ-Z3B-B62-EFF','Building D 62','SBJ-Z3B-B62',112],
  ];
  for (const b of z3EFFBuildings) {
    rows.push(r(b[0], b[1], 'EFF', 'ELECTRICAL FITTINGS AND FIXTURES', 'Electrical', 'ELECTRICAL', 'ELECTRICAL FITTINGS & FIXTURES', null, b[2], b[3], null, null, null, null, null, null, null, null, '2019-01-01', 2019, 'Q', null, 'Y', 15, null, null, null, null, null, null, null, null, false, 'Electrical', b[4]));
  }

  // Exhaust Fans in Z3 parking (rows 113-153) - 2 per building
  const z3ExhaustBuildings = ['B75','B74','B44','B45','B46','B47','B48','B49','B50','B51','B52','B53','B54','B55','B56','B57','B58','B59','B60','B61','B62'];
  let exhBaseNum = 2590;
  let exhSrcRow = 113;
  let exhUID = 112;
  for (const bldg of z3ExhaustBuildings) {
    const prefix = parseInt(bldg.slice(1)) <= 51 ? 'Z3A' : 'Z3B';
    for (let j = 0; j < 2; j++) {
      rows.push(r((exhUID++)+'', `SBJ-${prefix}-${bldg}-GF-PRK-JETF-${exhBaseNum + j}`, `JETF-${exhBaseNum + j}`, 'EXHAUST FAN', 'Electrical', 'ELECTRICAL', 'EXHAUST FAN', null, 'PARKING', `SBJ-${prefix}-${bldg}-GF-PRK`, null, null, null, null, null, null, null, null, '2019-01-01', 2019, 'Q', null, 'Y', 15, null, null, null, null, null, null, null, null, false, 'Electrical', exhSrcRow++));
    }
    exhBaseNum += 2;
  }

  // B4-B6 extract fans (rows 155-156) 
  rows.push(r('154','SBJ-Z1-B4-RF-HVEXF-0615','HVEXF','EXTRACT FANS','Electrical','ELECTRICAL','EXTRACT FAN',null,'ROOF TOP','SBJ-Z1-B4-RF',null,null,'Z1',null,null,null,null,null,'2019-01-01',2019,'OC',null,'Y',15,null,null,null,null,null,null,null,null,false,'Electrical',155));
  rows.push(r('155','SBJ-Z1-B4-RF-HVEXF-0616','HVEXF616','EXTRACT FANS','Electrical','ELECTRICAL','EXTRACT FAN',null,'ROOF TOP','SBJ-Z1-B4-RF',null,null,'Z1',null,null,null,null,null,'2019-01-01',2019,'OC',null,'Y',15,null,null,null,null,null,null,null,null,false,'Electrical',156));

  // Fire alarm panels
  rows.push(elec('156','SBJ-Z2-ESC-GF-RCP-FACP','FACP','FIRE ALARM PANEL(MB-Z2-SCEGF-ELFA-0785)','FACP','RECEPTION','SBJ-Z2-ESC-GF-RCP','Z2',null,'2019-01-01','2',15,157));
  rows.push(elec('157','SBJ-Z1-FM-GF-EL-FACP','FACP','FIRE ALARM PANEL(MB-ZA-FMBGBF-ELFA)','FIRE ALARM PANEL','ELECTRICAL ROOM','SBJ-Z1-FM-GF-EL','Z1',null,'2019-01-01','2',15,158));
  rows.push(elec('158','SBJ-Z1-FM-GF-FPR-FPC','FPC','FIRE PUMP CONTROLER(MB-1-1GF-0149)','FIRE PUMP CONTROLER','FIRE PUMP ROOM','SBJ-Z1-FM-GF-FPR','Z1',null,'2019-01-01','2',15,159));
  rows.push(elec('159','SBJ-Z1-FM-BAR','BAR','PARKING','GATE BARRIER','FM Building','SBJ-Z1-FM','Z1',null,'2019-01-01','2',15,160));

  // Irrigation panels
  rows.push(elec('160','SBJ-Z1-FM-GF-FPR-IPC','IPC','IRRIGATION PUMP CONTROL PANEL(MB-1-1GF-0150)','IRRIGATION PUMP CONTROL PANEL','GROUND FLOOR','SBJ-Z1-FM-GF','Z1',null,'2019-01-01','Q',15,161));
  rows.push(elec('161','SBJ-Z3B-V16-CMA-ELPCP-0198','ELPCP198','IRRIGATION PANEL-2','IRRIGATION PUMP CONTROL PANEL','Villa No 16','SBJ-Z3B-V16',null,null,'2019-01-01','4M',15,162));
  rows.push(elec('162','SBJ-Z5-ICP3','ICP3','IRRIGATION PANEL-3','IRRIGATION PUMP CONTROL PANEL','Irrigation Panel 3 (Near Villa No 22)','SBJ-Z5-ICP3','Z5',null,'2019-01-01','4M',15,163));
  rows.push(elec('163','SBJ-Z8-IP4-IP4','IP4','IRRIGATION PANEL-4','IRRIGATION PUMP CONTROL PANEL','Irrigation Pump Room 4','SBJ-Z8-IP4','Z8',null,'2019-01-01','4M',15,164));

  // Jet Fans in Z3 parking (rows 165-248) - 4 per building for most buildings
  let jfBaseNum = 2632;
  let jfSrcRow = 165;
  let jfUID = 164;
  for (const bldg of z3ExhaustBuildings) {
    const prefix = parseInt(bldg.slice(1)) <= 51 ? 'Z3A' : 'Z3B';
    for (let j = 0; j < 4; j++) {
      rows.push(r((jfUID++)+'', `SBJ-${prefix}-${bldg}-GF-PRK-JETF-${jfBaseNum + j}`, `JETF-${jfBaseNum + j}`, 'JET FAN', 'Electrical', 'ELECTRICAL', 'JET FAN', null, 'PARKING', `SBJ-${prefix}-${bldg}-GF-PRK`, null, null, null, null, null, null, null, null, '2019-01-01', 2019, 'Q', null, 'Y', 15, null, null, null, null, null, null, null, null, false, 'Electrical', jfSrcRow++));
    }
    jfBaseNum += 4;
  }

  // B55 EFF special row
  rows.push(r('220-EFF','SBJ-Z3B-B55-EFF','EFF','ELECTRICAL FITTINGS AND FIXTURES','Electrical','ELECTRICAL','JET FAN',null,'Building D 55','SBJ-Z3B-B55',null,null,null,null,null,null,null,null,'2019-01-01',2019,'Q',null,'Y',15,null,null,null,null,null,null,null,null,false,'Electrical',221));

  // Jet Fan Controls (rows 249-269) - 1 per building
  let jcBaseNum = 2485;
  let jcSrcRow = 250;
  let jcUID = 249;
  for (const bldg of z3ExhaustBuildings) {
    const prefix = parseInt(bldg.slice(1)) <= 51 ? 'Z3A' : 'Z3B';
    const locName = parseInt(bldg.slice(1)) === 53 ? 'ELECTRICAL' : 'ELECTRICAL ROOM';
    rows.push(r((jcUID++)+'', `SBJ-${prefix}-${bldg}-GF-ELR-JETCP-${jcBaseNum}`, `JETCP-${jcBaseNum}`, 'JET FAN CONTROL', 'Electrical', 'ELECTRICAL', 'JET FAN CONTROL', null, locName, `SBJ-${prefix}-${bldg}-GF-ELR`, null, null, null, null, null, null, null, null, '2019-01-01', 2019, 'Q', null, 'Y', 15, null, null, null, null, null, null, null, null, false, 'Electrical', jcSrcRow++));
    jcBaseNum++;
  }

  // Light Control Panels (rows 270-302)
  rows.push(elec('270','SBJ-Z2-VS-ELR1-ELCP','ELCP','LIGHT CONTROL PANEL','LIGHT CONTROL PANEL','ELECTRICAL ROOM 1','SBJ-Z2-VS-ELR1','Z2',null,'2019-01-01','Q',15,271));
  rows.push(elec('271','SBJ-Z2-VS-ELR2-ELCP','ELCP','LIGHT CONTROL PANEL (LCP-EX2-GF)','LIGHT CONTROL PANEL','ELECTRICAL ROOM 2','SBJ-Z2-VS-ELR2','Z2',null,'2019-01-01','Q',15,272));

  // LCP for Z3 buildings
  let lcpBaseNum = 2506;
  let lcpSrcRow = 273;
  let lcpUID = 272;
  for (const bldg of z3ExhaustBuildings) {
    const prefix = parseInt(bldg.slice(1)) <= 51 ? 'Z3A' : 'Z3B';
    const locName = parseInt(bldg.slice(1)) === 53 ? 'ELECTRICAL' : 'ELECTRICAL ROOM';
    rows.push(r((lcpUID++)+'', `SBJ-${prefix}-${bldg}-GF-ELR-ELLCP-${lcpBaseNum}`, `ELLCP-${lcpBaseNum}`, 'LIGHT CONTROL PANEL', 'Electrical', 'ELECTRICAL', 'LIGHT CONTROL PANEL', null, locName, `SBJ-${prefix}-${bldg}-GF-ELR`, null, null, null, null, null, null, null, null, '2019-01-01', 2019, 'Q', null, 'Y', 15, null, null, null, null, null, null, null, null, false, 'Electrical', lcpSrcRow++));
    lcpBaseNum++;
  }

  // Additional LCP/feeder pillar rows (rows 293-302)
  rows.push(r('293','SBJ-Z8-V16-GF-STR-ELDB-0903','ELDB-903','LIGHT CONTROL PANEL','Electrical','ELECTRICAL','LIGHT CONTROL PANEL',null,'GROUND FLOOR','SBJ-Z8-V16-GF',null,null,'Z8',null,null,null,'1000 kVA 11/0.4kV',null,'2019-01-01',2019,'4',null,'Y',15,null,null,null,null,null,null,null,null,false,'Electrical',294));
  rows.push(elec('294','SBJ-Z2-LP1','FPILLAR-04,','FEEDER PILLAR-04','LIGHT CONTROL PANEL','ZONE 2','SBJ-Z2','Z2','LV Feeder Pillar','2019-01-01','Q',15,295));
  rows.push(elec('295','SBJ-Z3-LP1','FPILLAR-02,','FEEDER PILLAR-02','LIGHT CONTROL PANEL','ZONE 3','SBJ-Z3','Z3','LV Feeder Pillar','2019-01-01','Q',15,296));
  rows.push(elec('296','SBJ-Z8-LP1','FPILLAR-01,','FEEDER PILLAR-01','LIGHT CONTROL PANEL','ZONE 8','SBJ-Z8','Z8','LV Feeder Pillar','2019-01-01','Q',15,297));

  // Landscaping lighting
  rows.push(elec('297','SBJ-Z1-R01-ELLCP-0201','ELLCP-201','LANDSCAPING LIGHTING-01','LIGHT CONTROL PANEL','Road 1','SBJ-Z1-RO1','Z1',null,'2019-01-01','Q',15,298));
  rows.push(elec('298','SBJ-Z1-R01-ELLCP-0202','ELLCP-202','LANDSCAPING LIGHTING-02','LIGHT CONTROL PANEL','Road 1','SBJ-Z1-RO1','Z1',null,'2019-01-01','Q',15,299));
  rows.push(elec('299','SBJ-Z3-R02-LP3','LP3','LANDSCAPING LIGHTING-03','LIGHT CONTROL PANEL','RAOD 2','SBJ-Z3-R02','Z3',null,'2019-01-01','Q',15,300));
  rows.push(elec('300','SBJ-Z3-R10-LP4','LP4','LANDSCAPING LIGHTING-04','LIGHT CONTROL PANEL','ROAD 10','SBJ-Z3-R10','Z3',null,'2019-01-01','Q',15,301));
  rows.push(elec('301','SBJ-Z8-LP5','LP5','LANDSCAPING LIGHTING-05','LIGHT CONTROL PANEL','ZONE 8','SBJ-Z8','Z8',null,'2019-01-01','Q',15,302));
  rows.push(elec('302','SBJ-Z8-LP6','LP6','LANDSCAPING LIGHTING-06','LIGHT CONTROL PANEL','ZONE 8','SBJ-Z8','Z8',null,'2019-01-01','Q',15,303));

  // Odour control & PLC
  rows.push(elec('303','SBJ-Z3-PS4-PLOCU-0212','PLOCU-212','ODOUR CONTROL UNITS(MB-3-43GL-0212)','ODOUR CONTROL PANEL','PUMPING STATION 4','SBJ-Z3-PS4','Z3',null,'2019-01-01','Q',15,304));
  rows.push(elec('304','SBJ-Z8-BWP-PLC-0176','PLC-176','PLC PANEL(MB-8-45GL-0176)','PLC PANEL','Beach Well Pump Room','SBJ-Z8-BWP','Z8',null,'2019-01-01','2',25,305));
  rows.push(elec('305','SBJ-Z1-IP1-PLC','PLC','PLC CONTROL PANEL','PLC PANEL','Irrigation Pump 1','SBJ-Z1-IP1','Z1',null,'2019-01-01','Q',25,306));

  // More Power DBs (rows 306-348) 
  const powerDBRows = [
    ['306','SBJ-Z1-FM-GF-EL-ELDB1','ELDB1','POWER DB','ELECTRICAL ROOM','SBJ-Z1-FM-GF-EL','Z1','Q',25,307],
    ['307','SBJ-Z1-FM-GF-EL-ELDB2','ELDB2','POWER DB','ELECTRICAL ROOM','SBJ-Z1-FM-GF-EL','Z1','Q',25,308],
    ['308','SBJ-Z1-FM-GF-FPR-ELDB3','ELDB3','POWER DB(MB-1-1GF-0146)','FIRE PUMP ROOM','SBJ-Z1-FM-GF-FPR','Z1','Q',25,309],
    ['309','SBJ-Z1-FM-GF-RCP-ELDB','ELDB','POWER DB(MB-1-1RF-0163)','RECEPTION','SBJ-Z1-FM-GF-RCP','Z1','Q',25,310],
    ['310','SBJ-Z1-FM-FF-COR-ELDB1','ELDB1','POWER DB','CORRIDOR','SBJ-Z1-FM-FF-COR','Z1','Q',25,311],
    ['311','SBJ-Z1-FM-FF-COR-ELDB2','ELDB2','POWER DB','CORRIDOR','SBJ-Z1-FM-FF-COR','Z1','Q',25,312],
    ['312','SBJ-Z1-FM-RT-ELDB1','ELDB1','AHU DB','ROOF TOP','SBJ-Z1-FM-RF','Z1','Q',25,313],
    ['313','SBJ-Z1-FM-RT-CSW1','CSW1','CHILLER SWITCH-01(MB-Z1-FMBRF-ELDB-14155)','ROOF TOP','SBJ-Z1-FM-RF','Z1','Q',25,314],
    ['314','SBJ-Z1-FM-RT-CSW2','CSW2','CHILLER SWITCH-02(MB-Z1-FMBRF-ELDB-14156)','ROOF TOP','SBJ-Z1-FM-RF','Z1','Q',25,315],
    ['315','SBJ-Z2-ESC-GF-ELDB1','ELDB1','MDB(MB-Z2-SCEGF-ELDB-0164)','GROUND FLOOR','SBJ-Z2-ESC-GF','Z2','Q',25,316],
    ['316','SBJ-Z2-ESC-GF-ELDB2','ELDB2','DB(MB-Z2-SCEGF-ELDB-0165)','GROUND FLOOR','SBJ-Z2-ESC-GF','Z2','Q',25,317],
    ['317','SBJ-Z2-ESC-FF-ELDB','ELDB','DB(MB-Z2-SCEFF-ELDB-0166)','FIRST FLOOR','SBJ-Z2-ESC-FF','Z2','Q',25,318],
    ['318','SBJ-Z2-VS-IDF1-ELDB','ELDB','POWER DB (UDP-SER-GF)','TELCOM ROOM 1(IDF1)','SBJ-Z2-VS-IDF1','Z2','Q',25,319],
    ['319','SBJ-Z2-VS-PPR-ELDB','ELDB','POWER DB','PUMP ROOM','SBJ-Z2-VS-PPR','Z2','Q',25,320],
  ];
  for (const pd of powerDBRows) {
    rows.push(elec(pd[0], pd[1], pd[2], pd[3], 'POWER DB', pd[4], pd[5], pd[6], null, '2019-01-01', pd[7], pd[8], pd[9]));
  }

  // Z3 building Power DBs
  let pdbBaseNum = 2527;
  let pdbSrcRow = 321;
  let pdbUID = 320;
  for (const bldg of z3ExhaustBuildings) {
    const prefix = parseInt(bldg.slice(1)) <= 51 ? 'Z3A' : 'Z3B';
    const locName = parseInt(bldg.slice(1)) === 53 ? 'ELECTRICAL' : 'ELECTRICAL ROOM';
    rows.push(r((pdbUID++)+'', `SBJ-${prefix}-${bldg}-GF-ELR-ELDB-${pdbBaseNum}`, `ELDB-${pdbBaseNum}`, 'POWER DB', 'Electrical', 'ELECTRICAL', 'POWER DB', null, locName, `SBJ-${prefix}-${bldg}-GF-ELR`, null, null, null, null, null, null, null, null, '2019-01-01', 2019, 'Q', null, 'Y', 25, null, null, null, null, null, null, null, null, false, 'Electrical', pdbSrcRow++));
    pdbBaseNum++;
  }

  // Road/infra Power DBs  
  const infraPDBs = [
    ['341','SBJ-Z5-R01-ELDB-0188','ELDB-188','ACTUATOR-DB-05(MB-1-22GL-0188)','Road 1 (Near Road 15)','SBJ-Z5-R01','Z5',342],
    ['342','SBJ-Z8-R01-ELDB-0189','ELDB-189','ACTUATOR-DB-06(MB-1-22GL-0189)','Road 1','SBJ-Z8-R01','Z8',343],
    ['343','SBJ-Z1-R01-ELDB-0184','ELDB-184','POWER DB','Road 1','SBJ-Z1-RO1','Z1',344],
    ['344','SBJ-Z1-R01-ELDB-0185','ELDB-185','POWER DB','Road 1','SBJ-Z1-RO1','Z1',345],
    ['345','SBJ-Z1-R01-ELDB-0186','ELDB-186','ROAD-2 NEAR FOUNTAIN','Road 1','SBJ-Z1-RO1','Z1',346],
    ['346','SBJ-Z3-R01-ELDB-0187','ELDB-187','ACTUATOR-DB-04(MB-1-22GL-0187)','ROAD 1','SBJ-Z3-R01','Z3',347],
    ['347','SBJ-Z8-BWP-PDB-0175','PDB-175','POWER PANEL(MB-8-45GL-0175)','Beach Well Pump Room','SBJ-Z8-BWP','Z8',348],
    ['348','SBJ-Z1-IP1-ELDB','ELDB','POWER DB','Irrigation Pump 1','SBJ-Z1-IP1','Z1',349],
  ];
  for (const ip of infraPDBs) {
    rows.push(elec(ip[0], ip[1], ip[2], ip[3], 'POWER DB', ip[4], ip[5], ip[6], null, '2019-01-01', 'Q', 25, ip[7]));
  }

  // Pump control panels (rows 349-363)
  rows.push(elec('349','SBJ-Z1-FM-RT-PPP','PPP','PRESSURE PUMP PANEL(MB-1-1RF-0154)','PUMP CONTROL PANEL','ROOF TOP','SBJ-Z1-FM-RF','Z1',null,'2019-01-01','Q',15,350));
  rows.push(elec('350','SBJ-Z1-FM-RT-HWP','HWP','HOT WATER PUMP PANEL(MB-Z1-MBRF-ELPCP-14159)','PUMP CONTROL PANEL','ROOF TOP','SBJ-Z1-FM-RF','Z1',null,'2019-01-01','Q',15,351));
  rows.push(elec('351','SBJ-Z1-FM-RT-CWP','CWP','CHILLED WATER PRESSURE PUMP PANEL(MB-Z1-MBRF-ELPCP-14160)','PUMP CONTROL PANEL','ROOF TOP','SBJ-Z1-FM-RF','Z1',null,'2019-01-01','Q',15,352));

  const pumpCtrlPanels = [
    ['352','SBJ-Z1-R03-LS2-LS-0196','LS196','LIFTING STATION LS-02(MB-2-23GL-0196)','LIFTING STATION 2','SBJ-Z1-RO3-LS2','Z1',353],
    ['353','SBJ-Z8-LS3-LS-0194','LS-194','LIFTING STATION LS-03(MB-8-45GL-0194)','Lifting Station 3','SBJ-Z8-LS3','Z8',354],
    ['354','SBJ-Z5-LS4-LS-0193','LS-193','LIFTING STATION LS-04(MB-5-44GL-0193)','Lifting Station 4','SBJ-Z5-LS4','Z5',355],
    ['355','SBJ-Z1-LS5-LS-0197','LS-197','LIFTING STATION LS-05(MB-1-42GL-0197)','Lifting Station 5','SBJ-Z1-LS5','Z1',356],
    ['356','SBJ-Z2-R02-PS1-PS-0190','PS190','PUMPING STATION PS-01(MB-2-57GL-0190)','PUMPING STATION 1','SBJ-Z2-R02-PS1','Z2',357],
    ['357','SBJ-Z3-R1G-ELPCP-0191','ELPCP191','PUMPING STATION PS-03(MB-3-43GL-0191)','ROAD NO 2 GATE 2 EXIT','SBJ-Z3-R1G','Z3',358],
    ['358','SBJ-Z3A-V42-CMA-ELPCP-0192','ELPCP192','PUMP CONTROL PANEL','Near Villa No 42','SBJ-Z3A-V42',null,359],
    ['359','SBJ-Z8-PS5-PS-0195','PS-195','PUMPING STATION PS-05(MB-8-45GL-0195)','Pumping Station 5','SBJ-Z8-PS5','Z8',360],
    ['360','SBJ-Z8-BWP-PC-0177','PC-177','CONTROL PANEL-01(MB-8-45GL-0177)','Beach Well Pump Room','SBJ-Z8-BWP','Z8',361],
    ['361','SBJ-Z8-BWP-PC2-0178','PC2-178','CONTROL PANEL-02(MB-1-42GL-0178)','Beach Well Pump Room','SBJ-Z8-BWP','Z8',362],
    ['362','SBJ-Z8-BWP-PC3-0179','PC3-179','CONTROL PANEL-03(MB-8-45GL-0179)','Beach Well Pump Room','SBJ-Z8-BWP','Z8',363],
    ['363','SBJ-Z1-IP1-SCP','SCP','SUMP PUMP CONTROL PANEL','Irrigation Pump 1','SBJ-Z1-IP1','Z1',364],
  ];
  for (const pc of pumpCtrlPanels) {
    const ppmF = ['360','361','362'].includes(pc[0]) ? '2' : 'Q';
    rows.push(elec(pc[0], pc[1], pc[2], pc[3], 'PUMP CONTROL PANEL', pc[4], pc[5], pc[6], null, '2019-01-01', ppmF, 15, pc[7]));
  }

  // Street Lights
  const streetLights = [
    ['364','SBJ-Z2-VS-SL-D01','SL','STREET LIGHTS','Village Square','SBJ-Z2-VS','Z2',365],
    ['365','SBJ-Z1-SL','SL','ZONE-1','Street Lights','SBJ-Z1-SL','Z1',366],
    ['366','SBJ-Z2-SL','SL','ZONE-2','Street Lights','SBJ-Z2-SL','Z2',367],
    ['367','SBJ-Z3-SL','SL','ZONE-3','STREET LIGHT','SBJ-Z3-SL','Z3',368],
    ['368','SBJ-Z5-SL','SL','ZONE-5','Street Lights','SBJ-Z5-SL','Z5',369],
    ['369','SBJ-Z8-SL','SL','ZONE-8','Street Lights','SBJ-Z8-SL','Z8',370],
  ];
  for (const sl of streetLights) {
    rows.push(elec(sl[0], sl[1], sl[2], sl[3], 'STREET LIGHTS', sl[4], sl[5], sl[6], null, '2019-01-01', '2', 20, sl[7]));
  }

  // Sub Main Power DBs
  rows.push(elec('370','SBJ-Z1-FM-GF-EL-SMDB','SMDB','SMDB-FM(MB-1-1GF-0136)','SUB MAIN POWER DB','ELECTRICAL ROOM','SBJ-Z1-FM-GF-EL','Z1',null,'2019-01-01','Q',20,371));

  const vsSmdbRows = [
    ['371','SBJ-Z2-VS-ELR1-SMDB1','SMDB1','SUB MAIN POWER DB','ELECTRICAL ROOM 1','SBJ-Z2-VS-ELR1','Z2',372],
    ['372','SBJ-Z2-VS-ELR1-SMDB2','SMDB2','SUB MAIN POWER DB','ELECTRICAL ROOM 1','SBJ-Z2-VS-ELR1','Z2',373],
    ['373','SBJ-Z2-VS-ELR2-SMDB1','SMDB1','SUB MAIN POWER DB (MTR4 PANEL)','ELECTRICAL ROOM 2','SBJ-Z2-VS-ELR2','Z2',374],
    ['374','SBJ-Z2-VS-ELR2-SMDB2','SMDB2','SUB MAIN POWER DB (MTR3 PANEL)','ELECTRICAL ROOM 2','SBJ-Z2-VS-ELR2','Z2',375],
  ];
  for (const vs of vsSmdbRows) {
    rows.push(elec(vs[0], vs[1], vs[2], vs[3], 'SUB MAIN POWER DB', vs[4], vs[5], vs[6], null, '2019-01-01', 'Q', 20, vs[7]));
  }

  // Z3 building SMDBs (2 per building)
  let smdbBaseNum1 = 2548;
  let smdbBaseNum2 = 2569;
  let smdbSrcRow = 376;
  let smdbUID = 375;
  for (const bldg of z3ExhaustBuildings) {
    const prefix = parseInt(bldg.slice(1)) <= 51 ? 'Z3A' : 'Z3B';
    const locName = parseInt(bldg.slice(1)) === 53 ? 'ELECTRICAL' : 'ELECTRICAL ROOM';
    rows.push(r((smdbUID++)+'', `SBJ-${prefix}-${bldg}-GF-ELR-SMDB-${smdbBaseNum1}`, `SMDB-${smdbBaseNum1}`, 'SUB MAIN POWER DB', 'Electrical', 'ELECTRICAL', 'SUB MAIN POWER DB', null, locName, `SBJ-${prefix}-${bldg}-GF-ELR`, null, null, null, null, null, null, null, null, '2019-01-01', 2019, 'Q', null, 'Y', 20, null, null, null, null, null, null, null, null, false, 'Electrical', smdbSrcRow++));
    rows.push(r((smdbUID++)+'', `SBJ-${prefix}-${bldg}-GF-ELR-SMDB-${smdbBaseNum2}`, `SMDB-${smdbBaseNum2}`, 'SUB MAIN POWER DB', 'Electrical', 'ELECTRICAL', 'SUB MAIN POWER DB', null, locName, `SBJ-${prefix}-${bldg}-GF-ELR`, null, null, null, null, null, null, null, null, '2019-01-01', 2019, 'Q', null, 'Y', 20, null, null, null, null, null, null, null, null, false, 'Electrical', smdbSrcRow++));
    smdbBaseNum1++;
    smdbBaseNum2++;
  }

  // GEN-STP-001
  rows.push(r('GEN-STP-001','SBJ-STP-GEN-001','Diesel Generator - STP','350 kVA Standby Diesel Generator - Power backup for STP','Electrical','ELECTRICAL','Generator',null,'STP - Sewage Treatment Plant','SBJ-STP',null,null,null,'TBC','TBC','TBC',null,null,'2020-01-01',2020,'Monthly',null,'Yes',20,null,null,'Good',null,null,null,null,null,false,'Electrical',938));

  console.log(`  Electrical specific rows: ${rows.length - 32 - 13 - 19 - 18}`); // subtract STP counts

  // ============= SKIP M&P, HVAC, VS, LIFTS, HOTEL, BOQ for now - will add in part 2 =============
  // For now, return what we have
  return rows;
}

async function main() {
  const rows = generateAllRows();
  console.log(`Total rows to upload: ${rows.length}`);

  let uploaded = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from(TABLE).insert(batch);
    if (error) {
      console.error(`\nBatch ${Math.floor(i/BATCH)+1} FAILED at row ~${i}:`, error.message);
      // Try row by row to find the problem
      for (let j = 0; j < batch.length; j++) {
        const { error: e2 } = await supabase.from(TABLE).insert([batch[j]]);
        if (e2) {
          console.error(`  Row ${i+j} failed (UID: ${batch[j].Asset_UID}):`, e2.message);
          break;
        }
      }
      process.exit(1);
    }
    uploaded += batch.length;
    process.stdout.write(`\r  Uploaded ${uploaded}/${rows.length}`);
  }
  console.log('\n  Upload complete!');

  // Verify total
  const { count } = await supabase.from(TABLE).select('*', { count: 'exact', head: true });
  console.log(`  Total rows in table: ${count}`);
}

main().catch(e => { console.error(e); process.exit(1); });
