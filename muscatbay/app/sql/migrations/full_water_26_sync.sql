-- =====================================================
-- Water System 2026: FULL SYNC from Airtable
-- Generated: 2026-04-07
-- Total meters: 346
-- This updates ALL meter metadata + Jan-26/Feb-26/Mar-26 values
-- Also inserts any meters missing from Supabase
-- =====================================================

UPDATE "Water System" SET label='Irrigation Tank 04 - (Z08)', level='DC', zone='Direct Connection', parent_meter='Main Bulk (NAMA)', type='IRR_Servies', jan_26=0, feb_26=0, mar_26=1 WHERE account_number='4300294';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Irrigation Tank 04 - (Z08)','4300294','DC','Direct Connection','Main Bulk (NAMA)','IRR_Servies',0,0,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300294');

UPDATE "Water System" SET label='Sales Center Common Building', level='DC', zone='Direct Connection', parent_meter='Main Bulk (NAMA)', type='MB_Common', jan_26=152, feb_26=159, mar_26=163 WHERE account_number='4300295';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Sales Center Common Building','4300295','DC','Direct Connection','Main Bulk (NAMA)','MB_Common',152,159,163 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300295');

UPDATE "Water System" SET label='Building (Security)', level='DC', zone='Direct Connection', parent_meter='Main Bulk (NAMA)', type='MB_Common', jan_26=27, feb_26=26, mar_26=26 WHERE account_number='4300297';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Building (Security)','4300297','DC','Direct Connection','Main Bulk (NAMA)','MB_Common',27,26,26 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300297');

UPDATE "Water System" SET label='Building (ROP)', level='DC', zone='Direct Connection', parent_meter='Main Bulk (NAMA)', type='MB_Common', jan_26=33, feb_26=31, mar_26=30 WHERE account_number='4300299';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Building (ROP)','4300299','DC','Direct Connection','Main Bulk (NAMA)','MB_Common',33,31,30 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300299');

UPDATE "Water System" SET label='Irrigation Tank 01 (Inlet)', level='DC', zone='Direct Connection', parent_meter='Main Bulk (NAMA)', type='IRR_Servies', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300323';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Irrigation Tank 01 (Inlet)','4300323','DC','Direct Connection','Main Bulk (NAMA)','IRR_Servies',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300323');

UPDATE "Water System" SET label='Hotel Main Building', level='DC', zone='Direct Connection', parent_meter='Main Bulk (NAMA)', type='Retail', jan_26=17722, feb_26=13931, mar_26=12937 WHERE account_number='4300334';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Hotel Main Building','4300334','DC','Direct Connection','Main Bulk (NAMA)','Retail',17722,13931,12937 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300334');

UPDATE "Water System" SET label='Community Mgmt - Technical Zone, STP', level='DC', zone='Direct Connection', parent_meter='Main Bulk (NAMA)', type='MB_Common', jan_26=40, feb_26=71, mar_26=62 WHERE account_number='4300336';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Community Mgmt - Technical Zone, STP','4300336','DC','Direct Connection','Main Bulk (NAMA)','MB_Common',40,71,62 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300336');

UPDATE "Water System" SET label='PHASE 02, MAIN ENTRANCE (Infrastructure)', level='DC', zone='Direct Connection', parent_meter='Main Bulk (NAMA)', type='MB_Common', jan_26=16, feb_26=4, mar_26=5 WHERE account_number='4300338';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'PHASE 02, MAIN ENTRANCE (Infrastructure)','4300338','DC','Direct Connection','Main Bulk (NAMA)','MB_Common',16,4,5 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300338');

UPDATE "Water System" SET label='Al Adrak Camp', level='DC', zone='Direct Connection', parent_meter='Main Bulk (NAMA)', type='Retail', jan_26=833, feb_26=1094, mar_26=680 WHERE account_number='4300348';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Al Adrak Camp','4300348','DC','Direct Connection','Main Bulk (NAMA)','Retail',833,1094,680 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300348');

UPDATE "Water System" SET label='Al Adrak Company (accommodation)Camp Area', level='DC', zone='Direct Connection', parent_meter='Main Bulk (NAMA)', type='Retail', jan_26=1352, feb_26=1452, mar_26=1573 WHERE account_number='4300349';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Al Adrak Company (accommodation)Camp Area','4300349','DC','Direct Connection','Main Bulk (NAMA)','Retail',1352,1452,1573 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300349');

UPDATE "Water System" SET label='Main Bulk (NAMA)', level='L1', zone='Main Bulk', parent_meter='NAMA', type='Main BULK', jan_26=33666, feb_26=34758, mar_26=47219 WHERE account_number='C43659';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Main Bulk (NAMA)','C43659','L1','Main Bulk','NAMA','Main BULK',33666,34758,47219 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='C43659');

UPDATE "Water System" SET label='Building FM', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='MB_Common', jan_26=30, feb_26=25, mar_26=18 WHERE account_number='4300296';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Building FM','4300296','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','MB_Common',30,25,18 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300296');

UPDATE "Water System" SET label='Building Taxi', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='Retail', jan_26=15, feb_26=17, mar_26=11 WHERE account_number='4300298';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Building Taxi','4300298','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','Retail',15,17,11 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300298');

UPDATE "Water System" SET label='Building B1', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='Retail', jan_26=256, feb_26=217, mar_26=218 WHERE account_number='4300300';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Building B1','4300300','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','Retail',256,217,218 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300300');

UPDATE "Water System" SET label='Building B2', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='Retail', jan_26=280, feb_26=272, mar_26=306 WHERE account_number='4300301';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Building B2','4300301','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','Retail',280,272,306 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300301');

UPDATE "Water System" SET label='Building B3', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='Retail', jan_26=177, feb_26=171, mar_26=188 WHERE account_number='4300302';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Building B3','4300302','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','Retail',177,171,188 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300302');

UPDATE "Water System" SET label='Building B4', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='Retail', jan_26=153, feb_26=142, mar_26=134 WHERE account_number='4300303';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Building B4','4300303','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','Retail',153,142,134 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300303');

UPDATE "Water System" SET label='Building B5', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='Retail', jan_26=6, feb_26=19, mar_26=46 WHERE account_number='4300304';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Building B5','4300304','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','Retail',6,19,46 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300304');

UPDATE "Water System" SET label='Building B6', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='Retail', jan_26=287, feb_26=268, mar_26=269 WHERE account_number='4300305';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Building B6','4300305','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','Retail',287,268,269 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300305');

UPDATE "Water System" SET label='Building B7', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='Retail', jan_26=214, feb_26=189, mar_26=204 WHERE account_number='4300306';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Building B7','4300306','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','Retail',214,189,204 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300306');

UPDATE "Water System" SET label='Building B8', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='Retail', jan_26=262, feb_26=223, mar_26=254 WHERE account_number='4300307';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Building B8','4300307','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','Retail',262,223,254 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300307');

UPDATE "Water System" SET label='Irrigation Tank (Z01_FM)', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='IRR_Servies', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300308';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Irrigation Tank (Z01_FM)','4300308','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','IRR_Servies',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300308');

UPDATE "Water System" SET label='Room PUMP (FIRE)', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='MB_Common', jan_26=1, feb_26=1, mar_26=0 WHERE account_number='4300309';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Room PUMP (FIRE)','4300309','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','MB_Common',1,1,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300309');

UPDATE "Water System" SET label='Building (MEP)', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='MB_Common', jan_26=4, feb_26=4, mar_26=3 WHERE account_number='4300310';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Building (MEP)','4300310','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','MB_Common',4,4,3 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300310');

UPDATE "Water System" SET label='Building CIF/CB', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='Retail', jan_26=319, feb_26=390, mar_26=344 WHERE account_number='4300324';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Building CIF/CB','4300324','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','Retail',319,390,344 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300324');

UPDATE "Water System" SET label='Building Nursery Building', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='Retail', jan_26=4, feb_26=2, mar_26=1 WHERE account_number='4300325';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Building Nursery Building','4300325','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','Retail',4,2,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300325');

UPDATE "Water System" SET label='Cabinet FM (CONTRACTORS OFFICE)', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='Retail', jan_26=36, feb_26=31, mar_26=34 WHERE account_number='4300337';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Cabinet FM (CONTRACTORS OFFICE)','4300337','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','Retail',36,31,34 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300337');

UPDATE "Water System" SET label='Building CIF/CB (COFFEE SH)', level='L3', zone='Zone_01_(FM)', parent_meter='ZONE FM ( BULK ZONE FM )', type='Retail', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300339';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Building CIF/CB (COFFEE SH)','4300339','L3','Zone_01_(FM)','ZONE FM ( BULK ZONE FM )','Retail',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300339');

UPDATE "Water System" SET label='ZONE FM ( BULK ZONE FM )', level='L2', zone='Zone_01_(FM)', parent_meter='Main Bulk (NAMA)', type='Zone Bulk', jan_26=2271, feb_26=2193, mar_26=2412 WHERE account_number='4300346';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'ZONE FM ( BULK ZONE FM )','4300346','L2','Zone_01_(FM)','Main Bulk (NAMA)','Zone Bulk',2271,2193,2412 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300346');

UPDATE "Water System" SET label='Z3-42 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=29, feb_26=24, mar_26=28 WHERE account_number='4300002';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-42 (Villa)','4300002','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',29,24,28 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300002');

UPDATE "Water System" SET label='Z3-46(5) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-46 Building Bulk Meter', type='Residential (Apart)', jan_26=26, feb_26=23, mar_26=42 WHERE account_number='4300003';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-46(5) (Building)','4300003','L4','Zone_03_(A)','D-46 Building Bulk Meter','Residential (Apart)',26,23,42 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300003');

UPDATE "Water System" SET label='Z3-49(3) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-49 Building Bulk Meter', type='Residential (Apart)', jan_26=11, feb_26=10, mar_26=12 WHERE account_number='4300004';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-49(3) (Building)','4300004','L4','Zone_03_(A)','D-49 Building Bulk Meter','Residential (Apart)',11,10,12 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300004');

UPDATE "Water System" SET label='Z3-38 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=1, feb_26=0, mar_26=1 WHERE account_number='4300005';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-38 (Villa)','4300005','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',1,0,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300005');

UPDATE "Water System" SET label='Z3-75(4) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-75 Building Bulk Meter', type='Residential (Apart)', jan_26=5, feb_26=0, mar_26=0 WHERE account_number='4300006';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-75(4) (Building)','4300006','L4','Zone_03_(A)','D-75 Building Bulk Meter','Residential (Apart)',5,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300006');

UPDATE "Water System" SET label='Z3-46(3A) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-46 Building Bulk Meter', type='Residential (Apart)', jan_26=8, feb_26=4, mar_26=7 WHERE account_number='4300007';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-46(3A) (Building)','4300007','L4','Zone_03_(A)','D-46 Building Bulk Meter','Residential (Apart)',8,4,7 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300007');

UPDATE "Water System" SET label='Z3-049(4) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-49 Building Bulk Meter', type='Residential (Apart)', jan_26=9, feb_26=4, mar_26=0 WHERE account_number='4300010';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-049(4) (Building)','4300010','L4','Zone_03_(A)','D-49 Building Bulk Meter','Residential (Apart)',9,4,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300010');

UPDATE "Water System" SET label='Z3-46(1A) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-46 Building Bulk Meter', type='Residential (Apart)', jan_26=13, feb_26=12, mar_26=13 WHERE account_number='4300011';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-46(1A) (Building)','4300011','L4','Zone_03_(A)','D-46 Building Bulk Meter','Residential (Apart)',13,12,13 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300011');

UPDATE "Water System" SET label='Z3-47(2) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-47 Building Bulk Meter', type='Residential (Apart)', jan_26=3, feb_26=4, mar_26=0 WHERE account_number='4300012';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-47(2) (Building)','4300012','L4','Zone_03_(A)','D-47 Building Bulk Meter','Residential (Apart)',3,4,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300012');

UPDATE "Water System" SET label='Z3-45(3A) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-45 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300013';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-45(3A) (Building)','4300013','L4','Zone_03_(A)','D-45 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300013');

UPDATE "Water System" SET label='Z3-46(2A) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-46 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300014';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-46(2A) (Building)','4300014','L4','Zone_03_(A)','D-46 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300014');

UPDATE "Water System" SET label='Z3-46(6) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-46 Building Bulk Meter', type='Residential (Apart)', jan_26=3, feb_26=3, mar_26=2 WHERE account_number='4300015';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-46(6) (Building)','4300015','L4','Zone_03_(A)','D-46 Building Bulk Meter','Residential (Apart)',3,3,2 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300015');

UPDATE "Water System" SET label='Z3-47(4) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-47 Building Bulk Meter', type='Residential (Apart)', jan_26=6, feb_26=8, mar_26=10 WHERE account_number='4300016';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-47(4) (Building)','4300016','L4','Zone_03_(A)','D-47 Building Bulk Meter','Residential (Apart)',6,8,10 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300016');

UPDATE "Water System" SET label='Z3-45(5) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-45 Building Bulk Meter', type='Residential (Apart)', jan_26=13, feb_26=11, mar_26=14 WHERE account_number='4300017';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-45(5) (Building)','4300017','L4','Zone_03_(A)','D-45 Building Bulk Meter','Residential (Apart)',13,11,14 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300017');

UPDATE "Water System" SET label='Z3-47(5) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-47 Building Bulk Meter', type='Residential (Apart)', jan_26=11, feb_26=15, mar_26=21 WHERE account_number='4300018';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-47(5) (Building)','4300018','L4','Zone_03_(A)','D-47 Building Bulk Meter','Residential (Apart)',11,15,21 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300018');

UPDATE "Water System" SET label='Z3-45(6) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-45 Building Bulk Meter', type='Residential (Apart)', jan_26=3, feb_26=5, mar_26=4 WHERE account_number='4300019';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-45(6) (Building)','4300019','L4','Zone_03_(A)','D-45 Building Bulk Meter','Residential (Apart)',3,5,4 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300019');

UPDATE "Water System" SET label='Z3-50(4) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-50 Building Bulk Meter', type='Residential (Apart)', jan_26=14, feb_26=5, mar_26=6 WHERE account_number='4300021';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-50(4) (Building)','4300021','L4','Zone_03_(A)','D-50 Building Bulk Meter','Residential (Apart)',14,5,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300021');

UPDATE "Water System" SET label='Z3-74(3) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-74 Building Bulk Meter', type='Residential (Apart)', jan_26=26, feb_26=30, mar_26=35 WHERE account_number='4300022';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-74(3) (Building)','4300022','L4','Zone_03_(A)','D-74 Building Bulk Meter','Residential (Apart)',26,30,35 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300022');

UPDATE "Water System" SET label='Z3-45(4A) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-45 Building Bulk Meter', type='Residential (Apart)', jan_26=6, feb_26=5, mar_26=4 WHERE account_number='4300026';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-45(4A) (Building)','4300026','L4','Zone_03_(A)','D-45 Building Bulk Meter','Residential (Apart)',6,5,4 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300026');

UPDATE "Water System" SET label='Z3-50(5) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-50 Building Bulk Meter', type='Residential (Apart)', jan_26=24, feb_26=10, mar_26=13 WHERE account_number='4300027';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-50(5) (Building)','4300027','L4','Zone_03_(A)','D-50 Building Bulk Meter','Residential (Apart)',24,10,13 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300027');

UPDATE "Water System" SET label='Z3-50(6) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-50 Building Bulk Meter', type='Residential (Apart)', jan_26=17, feb_26=15, mar_26=20 WHERE account_number='4300028';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-50(6) (Building)','4300028','L4','Zone_03_(A)','D-50 Building Bulk Meter','Residential (Apart)',17,15,20 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300028');

UPDATE "Water System" SET label='Z3-44(1A) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-44 Building Bulk Meter', type='Residential (Apart)', jan_26=12, feb_26=8, mar_26=10 WHERE account_number='4300030';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-44(1A) (Building)','4300030','L4','Zone_03_(A)','D-44 Building Bulk Meter','Residential (Apart)',12,8,10 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300030');

UPDATE "Water System" SET label='Z3-44(1B) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-44 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300031';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-44(1B) (Building)','4300031','L4','Zone_03_(A)','D-44 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300031');

UPDATE "Water System" SET label='Z3-44(2A) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-44 Building Bulk Meter', type='Residential (Apart)', jan_26=9, feb_26=3, mar_26=6 WHERE account_number='4300032';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-44(2A) (Building)','4300032','L4','Zone_03_(A)','D-44 Building Bulk Meter','Residential (Apart)',9,3,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300032');

UPDATE "Water System" SET label='Z3-44(2B) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-44 Building Bulk Meter', type='Residential (Apart)', jan_26=6, feb_26=7, mar_26=7 WHERE account_number='4300033';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-44(2B) (Building)','4300033','L4','Zone_03_(A)','D-44 Building Bulk Meter','Residential (Apart)',6,7,7 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300033');

UPDATE "Water System" SET label='Z3-44(5) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-44 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300034';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-44(5) (Building)','4300034','L4','Zone_03_(A)','D-44 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300034');

UPDATE "Water System" SET label='Z3-44(6) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-44 Building Bulk Meter', type='Residential (Apart)', jan_26=85, feb_26=39, mar_26=37 WHERE account_number='4300035';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-44(6) (Building)','4300035','L4','Zone_03_(A)','D-44 Building Bulk Meter','Residential (Apart)',85,39,37 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300035');

UPDATE "Water System" SET label='Z3-75(1) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-75 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300036';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-75(1) (Building)','4300036','L4','Zone_03_(A)','D-75 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300036');

UPDATE "Water System" SET label='Z3-75(3) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-75 Building Bulk Meter', type='Residential (Apart)', jan_26=11, feb_26=9, mar_26=11 WHERE account_number='4300037';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-75(3) (Building)','4300037','L4','Zone_03_(A)','D-75 Building Bulk Meter','Residential (Apart)',11,9,11 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300037');

UPDATE "Water System" SET label='Z3-23 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=20, feb_26=21, mar_26=25 WHERE account_number='4300038';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-23 (Villa)','4300038','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',20,21,25 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300038');

UPDATE "Water System" SET label='Z3-47(3) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-47 Building Bulk Meter', type='Residential (Apart)', jan_26=19, feb_26=20, mar_26=21 WHERE account_number='4300039';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-47(3) (Building)','4300039','L4','Zone_03_(A)','D-47 Building Bulk Meter','Residential (Apart)',19,20,21 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300039');

UPDATE "Water System" SET label='Z3-48(3) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-48 Building Bulk Meter', type='Residential (Apart)', jan_26=8, feb_26=7, mar_26=10 WHERE account_number='4300040';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-48(3) (Building)','4300040','L4','Zone_03_(A)','D-48 Building Bulk Meter','Residential (Apart)',8,7,10 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300040');

UPDATE "Water System" SET label='Z3-48(6) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-48 Building Bulk Meter', type='Residential (Apart)', jan_26=2, feb_26=0, mar_26=2 WHERE account_number='4300041';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-48(6) (Building)','4300041','L4','Zone_03_(A)','D-48 Building Bulk Meter','Residential (Apart)',2,0,2 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300041');

UPDATE "Water System" SET label='Z3-46(4A) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-46 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=3, mar_26=1 WHERE account_number='4300043';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-46(4A) (Building)','4300043','L4','Zone_03_(A)','D-46 Building Bulk Meter','Residential (Apart)',0,3,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300043');

UPDATE "Water System" SET label='Z3-41 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=27, feb_26=26, mar_26=30 WHERE account_number='4300044';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-41 (Villa)','4300044','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',27,26,30 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300044');

UPDATE "Water System" SET label='Z3-74(5) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-74 Building Bulk Meter', type='Residential (Apart)', jan_26=17, feb_26=12, mar_26=17 WHERE account_number='4300045';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-74(5) (Building)','4300045','L4','Zone_03_(A)','D-74 Building Bulk Meter','Residential (Apart)',17,12,17 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300045');

UPDATE "Water System" SET label='Z3-74(6) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-74 Building Bulk Meter', type='Residential (Apart)', jan_26=7, feb_26=3, mar_26=4 WHERE account_number='4300046';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-74(6) (Building)','4300046','L4','Zone_03_(A)','D-74 Building Bulk Meter','Residential (Apart)',7,3,4 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300046');

UPDATE "Water System" SET label='Z3-50(3) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-50 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300047';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-50(3) (Building)','4300047','L4','Zone_03_(A)','D-50 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300047');

UPDATE "Water System" SET label='Z3-48(5) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-48 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=5 WHERE account_number='4300048';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-48(5) (Building)','4300048','L4','Zone_03_(A)','D-48 Building Bulk Meter','Residential (Apart)',0,0,5 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300048');

UPDATE "Water System" SET label='Z3-37 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=30, feb_26=26, mar_26=18 WHERE account_number='4300049';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-37 (Villa)','4300049','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',30,26,18 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300049');

UPDATE "Water System" SET label='Z3-43 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=145, feb_26=81, mar_26=36 WHERE account_number='4300050';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-43 (Villa)','4300050','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',145,81,36 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300050');

UPDATE "Water System" SET label='Z3-47(6) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-47 Building Bulk Meter', type='Residential (Apart)', jan_26=18, feb_26=7, mar_26=12 WHERE account_number='4300051';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-47(6) (Building)','4300051','L4','Zone_03_(A)','D-47 Building Bulk Meter','Residential (Apart)',18,7,12 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300051');

UPDATE "Water System" SET label='Z3-31 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=97, feb_26=82, mar_26=119 WHERE account_number='4300052';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-31 (Villa)','4300052','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',97,82,119 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300052');

UPDATE "Water System" SET label='Z3-49(5) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-49 Building Bulk Meter', type='Residential (Apart)', jan_26=1, feb_26=5, mar_26=9 WHERE account_number='4300053';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-49(5) (Building)','4300053','L4','Zone_03_(A)','D-49 Building Bulk Meter','Residential (Apart)',1,5,9 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300053');

UPDATE "Water System" SET label='Z3-75(5) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-75 Building Bulk Meter', type='Residential (Apart)', jan_26=20, feb_26=11, mar_26=12 WHERE account_number='4300055';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-75(5) (Building)','4300055','L4','Zone_03_(A)','D-75 Building Bulk Meter','Residential (Apart)',20,11,12 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300055');

UPDATE "Water System" SET label='Z3-49(6) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-49 Building Bulk Meter', type='Residential (Apart)', jan_26=30, feb_26=27, mar_26=18 WHERE account_number='4300061';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-49(6) (Building)','4300061','L4','Zone_03_(A)','D-49 Building Bulk Meter','Residential (Apart)',30,27,18 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300061');

UPDATE "Water System" SET label='Z3-75(6) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-75 Building Bulk Meter', type='Residential (Apart)', jan_26=26, feb_26=25, mar_26=47 WHERE account_number='4300063';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-75(6) (Building)','4300063','L4','Zone_03_(A)','D-75 Building Bulk Meter','Residential (Apart)',26,25,47 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300063');

UPDATE "Water System" SET label='Z3-35 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=66, feb_26=54, mar_26=44 WHERE account_number='4300075';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-35 (Villa)','4300075','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',66,54,44 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300075');

UPDATE "Water System" SET label='Z3-40 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=40, feb_26=36, mar_26=33 WHERE account_number='4300079';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-40 (Villa)','4300079','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',40,36,33 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300079');

UPDATE "Water System" SET label='Z3-30 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=3, feb_26=1, mar_26=13 WHERE account_number='4300081';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-30 (Villa)','4300081','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',3,1,13 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300081');

UPDATE "Water System" SET label='Z3-33 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=49, feb_26=47, mar_26=52 WHERE account_number='4300082';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-33 (Villa)','4300082','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',49,47,52 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300082');

UPDATE "Water System" SET label='Z3-36 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=86, feb_26=76, mar_26=83 WHERE account_number='4300084';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-36 (Villa)','4300084','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',86,76,83 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300084');

UPDATE "Water System" SET label='Z3-32 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=34, feb_26=15, mar_26=20 WHERE account_number='4300085';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-32 (Villa)','4300085','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',34,15,20 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300085');

UPDATE "Water System" SET label='Z3-39 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=37, feb_26=30, mar_26=32 WHERE account_number='4300086';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-39 (Villa)','4300086','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',37,30,32 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300086');

UPDATE "Water System" SET label='Z3-34 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=42, feb_26=28, mar_26=36 WHERE account_number='4300087';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-34 (Villa)','4300087','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',42,28,36 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300087');

UPDATE "Water System" SET label='Z3-27 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=44, feb_26=38, mar_26=19 WHERE account_number='4300089';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-27 (Villa)','4300089','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',44,38,19 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300089');

UPDATE "Water System" SET label='Z3-24 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=57, feb_26=33, mar_26=35 WHERE account_number='4300091';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-24 (Villa)','4300091','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',57,33,35 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300091');

UPDATE "Water System" SET label='Z3-25 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Un-Sold', jan_26=0, feb_26=16, mar_26=4 WHERE account_number='4300093';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-25 (Villa)','4300093','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Un-Sold',0,16,4 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300093');

UPDATE "Water System" SET label='Z3-26 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Un-Sold', jan_26=0, feb_26=22, mar_26=21 WHERE account_number='4300095';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-26 (Villa)','4300095','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Un-Sold',0,22,21 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300095');

UPDATE "Water System" SET label='Z3-29 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=23, feb_26=17, mar_26=35 WHERE account_number='4300097';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-29 (Villa)','4300097','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',23,17,35 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300097');

UPDATE "Water System" SET label='Z3-28 (Villa)', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='Residential (Villa)', jan_26=95, feb_26=48, mar_26=107 WHERE account_number='4300101';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-28 (Villa)','4300101','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','Residential (Villa)',95,48,107 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300101');

UPDATE "Water System" SET label='Z3-74(1) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-74 Building Bulk Meter', type='Residential (Apart)', jan_26=3, feb_26=11, mar_26=4 WHERE account_number='4300106';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-74(1) (Building)','4300106','L4','Zone_03_(A)','D-74 Building Bulk Meter','Residential (Apart)',3,11,4 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300106');

UPDATE "Water System" SET label='Z3-49(1) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-49 Building Bulk Meter', type='Residential (Apart)', jan_26=10, feb_26=10, mar_26=6 WHERE account_number='4300107';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-49(1) (Building)','4300107','L4','Zone_03_(A)','D-49 Building Bulk Meter','Residential (Apart)',10,10,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300107');

UPDATE "Water System" SET label='Z3-49(2) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-49 Building Bulk Meter', type='Residential (Apart)', jan_26=17, feb_26=13, mar_26=1 WHERE account_number='4300108';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-49(2) (Building)','4300108','L4','Zone_03_(A)','D-49 Building Bulk Meter','Residential (Apart)',17,13,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300108');

UPDATE "Water System" SET label='Z3-50(1) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-50 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=33 WHERE account_number='4300109';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-50(1) (Building)','4300109','L4','Zone_03_(A)','D-50 Building Bulk Meter','Residential (Apart)',0,0,33 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300109');

UPDATE "Water System" SET label='Z3-45(1A) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-45 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=1 WHERE account_number='4300110';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-45(1A) (Building)','4300110','L4','Zone_03_(A)','D-45 Building Bulk Meter','Residential (Apart)',0,0,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300110');

UPDATE "Water System" SET label='Z3-51(1) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-51 Building Bulk Meter', type='Residential (Apart)', jan_26=19, feb_26=18, mar_26=21 WHERE account_number='4300111';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-51(1) (Building)','4300111','L4','Zone_03_(A)','D-51 Building Bulk Meter','Residential (Apart)',19,18,21 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300111');

UPDATE "Water System" SET label='Z3-51(2) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-51 Building Bulk Meter', type='Residential (Apart)', jan_26=36, feb_26=37, mar_26=39 WHERE account_number='4300112';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-51(2) (Building)','4300112','L4','Zone_03_(A)','D-51 Building Bulk Meter','Residential (Apart)',36,37,39 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300112');

UPDATE "Water System" SET label='Z3-45(2A) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-45 Building Bulk Meter', type='Residential (Apart)', jan_26=3, feb_26=14, mar_26=6 WHERE account_number='4300113';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-45(2A) (Building)','4300113','L4','Zone_03_(A)','D-45 Building Bulk Meter','Residential (Apart)',3,14,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300113');

UPDATE "Water System" SET label='Z3-050(2) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-50 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=2, mar_26=0 WHERE account_number='4300114';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-050(2) (Building)','4300114','L4','Zone_03_(A)','D-50 Building Bulk Meter','Residential (Apart)',0,2,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300114');

UPDATE "Water System" SET label='Z3-47(1) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-47 Building Bulk Meter', type='Residential (Apart)', jan_26=13, feb_26=15, mar_26=14 WHERE account_number='4300115';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-47(1) (Building)','4300115','L4','Zone_03_(A)','D-47 Building Bulk Meter','Residential (Apart)',13,15,14 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300115');

UPDATE "Water System" SET label='Z3-48(1) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-48 Building Bulk Meter', type='Residential (Apart)', jan_26=19, feb_26=11, mar_26=10 WHERE account_number='4300117';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-48(1) (Building)','4300117','L4','Zone_03_(A)','D-48 Building Bulk Meter','Residential (Apart)',19,11,10 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300117');

UPDATE "Water System" SET label='Z3-74(2) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-74 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300118';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-74(2) (Building)','4300118','L4','Zone_03_(A)','D-74 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300118');

UPDATE "Water System" SET label='Z3-51(3) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-51 Building Bulk Meter', type='Residential (Apart)', jan_26=19, feb_26=12, mar_26=12 WHERE account_number='4300121';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-51(3) (Building)','4300121','L4','Zone_03_(A)','D-51 Building Bulk Meter','Residential (Apart)',19,12,12 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300121');

UPDATE "Water System" SET label='Z3-75(2) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-75 Building Bulk Meter', type='Residential (Apart)', jan_26=8, feb_26=10, mar_26=12 WHERE account_number='4300122';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-75(2) (Building)','4300122','L4','Zone_03_(A)','D-75 Building Bulk Meter','Residential (Apart)',8,10,12 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300122');

UPDATE "Water System" SET label='Z3-48(2) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-48 Building Bulk Meter', type='Residential (Apart)', jan_26=1, feb_26=0, mar_26=0 WHERE account_number='4300123';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-48(2) (Building)','4300123','L4','Zone_03_(A)','D-48 Building Bulk Meter','Residential (Apart)',1,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300123');

UPDATE "Water System" SET label='Z3-74(4) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-74 Building Bulk Meter', type='Residential (Apart)', jan_26=4, feb_26=3, mar_26=2 WHERE account_number='4300125';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-74(4) (Building)','4300125','L4','Zone_03_(A)','D-74 Building Bulk Meter','Residential (Apart)',4,3,2 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300125');

UPDATE "Water System" SET label='Z3-51(4) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-51 Building Bulk Meter', type='Residential (Apart)', jan_26=12, feb_26=12, mar_26=18 WHERE account_number='4300127';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-51(4) (Building)','4300127','L4','Zone_03_(A)','D-51 Building Bulk Meter','Residential (Apart)',12,12,18 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300127');

UPDATE "Water System" SET label='Z3-051(5) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-51 Building Bulk Meter', type='Residential (Apart)', jan_26=22, feb_26=23, mar_26=22 WHERE account_number='4300128';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-051(5) (Building)','4300128','L4','Zone_03_(A)','D-51 Building Bulk Meter','Residential (Apart)',22,23,22 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300128');

UPDATE "Water System" SET label='Z3-48(4) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-48 Building Bulk Meter', type='Residential (Apart)', jan_26=5, feb_26=5, mar_26=6 WHERE account_number='4300131';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-48(4) (Building)','4300131','L4','Zone_03_(A)','D-48 Building Bulk Meter','Residential (Apart)',5,5,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300131');

UPDATE "Water System" SET label='Z3-51(6) (Building)', level='L4', zone='Zone_03_(A)', parent_meter='D-51 Building Bulk Meter', type='Residential (Apart)', jan_26=4, feb_26=5, mar_26=6 WHERE account_number='4300134';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-51(6) (Building)','4300134','L4','Zone_03_(A)','D-51 Building Bulk Meter','Residential (Apart)',4,5,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300134');

UPDATE "Water System" SET label='D 45-Building Common Meter', level='L4', zone='Zone_03_(A)', parent_meter='D-45 Building Bulk Meter', type='D_Building_Common', jan_26=1, feb_26=0, mar_26=1 WHERE account_number='4300135';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 45-Building Common Meter','4300135','L4','Zone_03_(A)','D-45 Building Bulk Meter','D_Building_Common',1,0,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300135');

UPDATE "Water System" SET label='D 50-Building Common Meter', level='L4', zone='Zone_03_(A)', parent_meter='D-50 Building Bulk Meter', type='D_Building_Common', jan_26=1, feb_26=2, mar_26=2 WHERE account_number='4300136';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 50-Building Common Meter','4300136','L4','Zone_03_(A)','D-50 Building Bulk Meter','D_Building_Common',1,2,2 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300136');

UPDATE "Water System" SET label='D 51-Building Common Meter', level='L4', zone='Zone_03_(A)', parent_meter='D-51 Building Bulk Meter', type='D_Building_Common', jan_26=2, feb_26=2, mar_26=2 WHERE account_number='4300137';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 51-Building Common Meter','4300137','L4','Zone_03_(A)','D-51 Building Bulk Meter','D_Building_Common',2,2,2 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300137');

UPDATE "Water System" SET label='D 46-Building Common Meter', level='L4', zone='Zone_03_(A)', parent_meter='D-46 Building Bulk Meter', type='D_Building_Common', jan_26=1, feb_26=0, mar_26=1 WHERE account_number='4300138';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 46-Building Common Meter','4300138','L4','Zone_03_(A)','D-46 Building Bulk Meter','D_Building_Common',1,0,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300138');

UPDATE "Water System" SET label='D 74-Building Common Meter', level='L4', zone='Zone_03_(A)', parent_meter='D-74 Building Bulk Meter', type='D_Building_Common', jan_26=1, feb_26=1, mar_26=1 WHERE account_number='4300139';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 74-Building Common Meter','4300139','L4','Zone_03_(A)','D-74 Building Bulk Meter','D_Building_Common',1,1,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300139');

UPDATE "Water System" SET label='D 49-Building Common Meter', level='L4', zone='Zone_03_(A)', parent_meter='D-49 Building Bulk Meter', type='D_Building_Common', jan_26=1, feb_26=1, mar_26=1 WHERE account_number='4300140';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 49-Building Common Meter','4300140','L4','Zone_03_(A)','D-49 Building Bulk Meter','D_Building_Common',1,1,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300140');

UPDATE "Water System" SET label='D 48-Building Common Meter', level='L4', zone='Zone_03_(A)', parent_meter='D-48 Building Bulk Meter', type='D_Building_Common', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300141';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 48-Building Common Meter','4300141','L4','Zone_03_(A)','D-48 Building Bulk Meter','D_Building_Common',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300141');

UPDATE "Water System" SET label='D 47-Building Common Meter', level='L4', zone='Zone_03_(A)', parent_meter='D-47 Building Bulk Meter', type='D_Building_Common', jan_26=1, feb_26=1, mar_26=1 WHERE account_number='4300143';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 47-Building Common Meter','4300143','L4','Zone_03_(A)','D-47 Building Bulk Meter','D_Building_Common',1,1,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300143');

UPDATE "Water System" SET label='D 44-Building Common Meter', level='L4', zone='Zone_03_(A)', parent_meter='D-44 Building Bulk Meter', type='D_Building_Common', jan_26=1, feb_26=1, mar_26=1 WHERE account_number='4300144';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 44-Building Common Meter','4300144','L4','Zone_03_(A)','D-44 Building Bulk Meter','D_Building_Common',1,1,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300144');

UPDATE "Water System" SET label='D 75-Building Common Meter', level='L4', zone='Zone_03_(A)', parent_meter='D-75 Building Bulk Meter', type='D_Building_Common', jan_26=4, feb_26=3, mar_26=2 WHERE account_number='4300145';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 75-Building Common Meter','4300145','L4','Zone_03_(A)','D-75 Building Bulk Meter','D_Building_Common',4,3,2 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300145');

UPDATE "Water System" SET label='D-75 Building Bulk Meter', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='D_Building_Bulk', jan_26=74, feb_26=59, mar_26=83 WHERE account_number='4300176';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-75 Building Bulk Meter','4300176','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','D_Building_Bulk',74,59,83 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300176');

UPDATE "Water System" SET label='D-74 Building Bulk Meter', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='D_Building_Bulk', jan_26=56, feb_26=60, mar_26=66 WHERE account_number='4300177';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-74 Building Bulk Meter','4300177','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','D_Building_Bulk',56,60,66 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300177');

UPDATE "Water System" SET label='D-44 Building Bulk Meter', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='D_Building_Bulk', jan_26=114, feb_26=58, mar_26=61 WHERE account_number='4300178';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-44 Building Bulk Meter','4300178','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','D_Building_Bulk',114,58,61 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300178');

UPDATE "Water System" SET label='D-45 Building Bulk Meter', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='D_Building_Bulk', jan_26=27, feb_26=35, mar_26=31 WHERE account_number='4300179';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-45 Building Bulk Meter','4300179','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','D_Building_Bulk',27,35,31 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300179');

UPDATE "Water System" SET label='D-46 Building Bulk Meter', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='D_Building_Bulk', jan_26=50, feb_26=45, mar_26=65 WHERE account_number='4300180';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-46 Building Bulk Meter','4300180','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','D_Building_Bulk',50,45,65 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300180');

UPDATE "Water System" SET label='D-47 Building Bulk Meter', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='D_Building_Bulk', jan_26=71, feb_26=68, mar_26=78 WHERE account_number='4300181';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-47 Building Bulk Meter','4300181','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','D_Building_Bulk',71,68,78 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300181');

UPDATE "Water System" SET label='D-48 Building Bulk Meter', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='D_Building_Bulk', jan_26=35, feb_26=23, mar_26=32 WHERE account_number='4300182';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-48 Building Bulk Meter','4300182','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','D_Building_Bulk',35,23,32 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300182');

UPDATE "Water System" SET label='D-49 Building Bulk Meter', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='D_Building_Bulk', jan_26=78, feb_26=65, mar_26=46 WHERE account_number='4300183';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-49 Building Bulk Meter','4300183','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','D_Building_Bulk',78,65,46 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300183');

UPDATE "Water System" SET label='D-50 Building Bulk Meter', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='D_Building_Bulk', jan_26=57, feb_26=33, mar_26=73 WHERE account_number='4300184';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-50 Building Bulk Meter','4300184','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','D_Building_Bulk',57,33,73 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300184');

UPDATE "Water System" SET label='D-51 Building Bulk Meter', level='L3', zone='Zone_03_(A)', parent_meter='ZONE 3A (BULK ZONE 3A)', type='D_Building_Bulk', jan_26=129, feb_26=141, mar_26=181 WHERE account_number='4300185';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-51 Building Bulk Meter','4300185','L3','Zone_03_(A)','ZONE 3A (BULK ZONE 3A)','D_Building_Bulk',129,141,181 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300185');

UPDATE "Water System" SET label='ZONE 3A (Bulk Zone 3A)', level='L2', zone='Zone_03_(A)', parent_meter='Main Bulk (NAMA)', type='Zone Bulk', jan_26=2616, feb_26=8545, mar_26=2867 WHERE account_number='4300343';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'ZONE 3A (Bulk Zone 3A)','4300343','L2','Zone_03_(A)','Main Bulk (NAMA)','Zone Bulk',2616,8545,2867 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300343');

UPDATE "Water System" SET label='Z3-52(6) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-52 Building Bulk Meter', type='Residential (Apart)', jan_26=12, feb_26=7, mar_26=13 WHERE account_number='4300008';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-52(6) (Building)','4300008','L4','Zone_03_(B)','D-52 Building Bulk Meter','Residential (Apart)',12,7,13 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300008');

UPDATE "Water System" SET label='Z3-21 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=41, feb_26=41, mar_26=34 WHERE account_number='4300009';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-21 (Villa)','4300009','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',41,41,34 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300009');

UPDATE "Water System" SET label='Z3-20 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=9, feb_26=10, mar_26=10 WHERE account_number='4300020';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-20 (Villa)','4300020','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',9,10,10 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300020');

UPDATE "Water System" SET label='Z3-13 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=18, feb_26=17, mar_26=17 WHERE account_number='4300025';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-13 (Villa)','4300025','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',18,17,17 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300025');

UPDATE "Water System" SET label='Z3-52(4A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-52 Building Bulk Meter', type='Residential (Apart)', jan_26=7, feb_26=6, mar_26=11 WHERE account_number='4300029';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-52(4A) (Building)','4300029','L4','Zone_03_(B)','D-52 Building Bulk Meter','Residential (Apart)',7,6,11 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300029');

UPDATE "Water System" SET label='Z3-52(3A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-52 Building Bulk Meter', type='Residential (Apart)', jan_26=7, feb_26=5, mar_26=6 WHERE account_number='4300042';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-52(3A) (Building)','4300042','L4','Zone_03_(B)','D-52 Building Bulk Meter','Residential (Apart)',7,5,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300042');

UPDATE "Water System" SET label='Z3-62(6) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-62 Building Bulk Meter', type='Residential (Apart)', jan_26=7, feb_26=8, mar_26=6 WHERE account_number='4300054';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-62(6) (Building)','4300054','L4','Zone_03_(B)','D-62 Building Bulk Meter','Residential (Apart)',7,8,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300054');

UPDATE "Water System" SET label='Z3-52(5) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-52 Building Bulk Meter', type='Residential (Apart)', jan_26=5, feb_26=3, mar_26=4 WHERE account_number='4300056';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-52(5) (Building)','4300056','L4','Zone_03_(B)','D-52 Building Bulk Meter','Residential (Apart)',5,3,4 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300056');

UPDATE "Water System" SET label='Z3-15 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=38, feb_26=26, mar_26=37 WHERE account_number='4300057';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-15 (Villa)','4300057','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',38,26,37 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300057');

UPDATE "Water System" SET label='Z3-14 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=6, feb_26=10, mar_26=5 WHERE account_number='4300060';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-14 (Villa)','4300060','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',6,10,5 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300060');

UPDATE "Water System" SET label='Z3-62(1) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-62 Building Bulk Meter', type='Residential (Apart)', jan_26=3, feb_26=8, mar_26=3 WHERE account_number='4300062';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-62(1) (Building)','4300062','L4','Zone_03_(B)','D-62 Building Bulk Meter','Residential (Apart)',3,8,3 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300062');

UPDATE "Water System" SET label='Z3-53(4B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-53 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300064';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-53(4B) (Building)','4300064','L4','Zone_03_(B)','D-53 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300064');

UPDATE "Water System" SET label='Z3-60(1B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-60 Building Bulk Meter', type='Residential (Apart)', jan_26=7, feb_26=10, mar_26=10 WHERE account_number='4300065';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-60(1B) (Building)','4300065','L4','Zone_03_(B)','D-60 Building Bulk Meter','Residential (Apart)',7,10,10 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300065');

UPDATE "Water System" SET label='Z3-59(4B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-59 Building Bulk Meter', type='Residential (Apart)', jan_26=7, feb_26=7, mar_26=4 WHERE account_number='4300066';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-59(4B) (Building)','4300066','L4','Zone_03_(B)','D-59 Building Bulk Meter','Residential (Apart)',7,7,4 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300066');

UPDATE "Water System" SET label='Z3-60(3B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-60 Building Bulk Meter', type='Residential (Apart)', jan_26=1, feb_26=0, mar_26=0 WHERE account_number='4300067';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-60(3B) (Building)','4300067','L4','Zone_03_(B)','D-60 Building Bulk Meter','Residential (Apart)',1,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300067');

UPDATE "Water System" SET label='Z3-60(4B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-60 Building Bulk Meter', type='Residential (Apart)', jan_26=3, feb_26=3, mar_26=4 WHERE account_number='4300068';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-60(4B) (Building)','4300068','L4','Zone_03_(B)','D-60 Building Bulk Meter','Residential (Apart)',3,3,4 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300068');

UPDATE "Water System" SET label='Z3-52(2A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-52 Building Bulk Meter', type='Residential (Apart)', jan_26=1, feb_26=0, mar_26=1 WHERE account_number='4300069';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-52(2A) (Building)','4300069','L4','Zone_03_(B)','D-52 Building Bulk Meter','Residential (Apart)',1,0,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300069');

UPDATE "Water System" SET label='Z3-58(1B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-58 Building Bulk Meter', type='Residential (Apart)', jan_26=1, feb_26=2, mar_26=2 WHERE account_number='4300070';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-58(1B) (Building)','4300070','L4','Zone_03_(B)','D-58 Building Bulk Meter','Residential (Apart)',1,2,2 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300070');

UPDATE "Water System" SET label='Z3-55(1B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-55 Building Bulk Meter', type='Residential (Apart)', jan_26=3, feb_26=7, mar_26=1 WHERE account_number='4300071';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-55(1B) (Building)','4300071','L4','Zone_03_(B)','D-55 Building Bulk Meter','Residential (Apart)',3,7,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300071');

UPDATE "Water System" SET label='Z3-60(2B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-60 Building Bulk Meter', type='Residential (Apart)', jan_26=11, feb_26=10, mar_26=10 WHERE account_number='4300072';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-60(2B) (Building)','4300072','L4','Zone_03_(B)','D-60 Building Bulk Meter','Residential (Apart)',11,10,10 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300072');

UPDATE "Water System" SET label='Z3-59(3A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-59 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300073';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-59(3A) (Building)','4300073','L4','Zone_03_(B)','D-59 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300073');

UPDATE "Water System" SET label='Z3-53(6) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-53 Building Bulk Meter', type='Residential (Apart)', jan_26=51, feb_26=42, mar_26=47 WHERE account_number='4300074';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-53(6) (Building)','4300074','L4','Zone_03_(B)','D-53 Building Bulk Meter','Residential (Apart)',51,42,47 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300074');

UPDATE "Water System" SET label='Z3-12 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=110, feb_26=83, mar_26=134 WHERE account_number='4300076';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-12 (Villa)','4300076','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',110,83,134 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300076');

UPDATE "Water System" SET label='Z3-11 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300077';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-11 (Villa)','4300077','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300077');

UPDATE "Water System" SET label='Z3-4 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=48, feb_26=79, mar_26=81 WHERE account_number='4300078';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-4 (Villa)','4300078','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',48,79,81 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300078');

UPDATE "Water System" SET label='Z3-17 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=28, feb_26=15, mar_26=18 WHERE account_number='4300080';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-17 (Villa)','4300080','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',28,15,18 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300080');

UPDATE "Water System" SET label='Z3-18 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Un-Sold', jan_26=2, feb_26=30, mar_26=34 WHERE account_number='4300083';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-18 (Villa)','4300083','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Un-Sold',2,30,34 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300083');

UPDATE "Water System" SET label='Z3-3 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=76, feb_26=105, mar_26=148 WHERE account_number='4300088';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-3 (Villa)','4300088','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',76,105,148 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300088');

UPDATE "Water System" SET label='Z3-7 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=43, feb_26=38, mar_26=45 WHERE account_number='4300090';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-7 (Villa)','4300090','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',43,38,45 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300090');

UPDATE "Water System" SET label='Z3-10 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=32, feb_26=75, mar_26=73 WHERE account_number='4300092';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-10 (Villa)','4300092','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',32,75,73 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300092');

UPDATE "Water System" SET label='Z3-1 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=10, feb_26=7, mar_26=12 WHERE account_number='4300094';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-1 (Villa)','4300094','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',10,7,12 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300094');

UPDATE "Water System" SET label='Z3-9 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=60, feb_26=41, mar_26=49 WHERE account_number='4300096';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-9 (Villa)','4300096','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',60,41,49 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300096');

UPDATE "Water System" SET label='Z3-2 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=22, feb_26=23, mar_26=22 WHERE account_number='4300098';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-2 (Villa)','4300098','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',22,23,22 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300098');

UPDATE "Water System" SET label='Z3-19 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=7, feb_26=23, mar_26=16 WHERE account_number='4300099';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-19 (Villa)','4300099','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',7,23,16 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300099');

UPDATE "Water System" SET label='Z3-6 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=25, feb_26=24, mar_26=23 WHERE account_number='4300100';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-6 (Villa)','4300100','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',25,24,23 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300100');

UPDATE "Water System" SET label='Z3-22 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=22, feb_26=18, mar_26=22 WHERE account_number='4300102';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-22 (Villa)','4300102','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',22,18,22 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300102');

UPDATE "Water System" SET label='Z3-16 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=16, feb_26=20, mar_26=15 WHERE account_number='4300103';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-16 (Villa)','4300103','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',16,20,15 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300103');

UPDATE "Water System" SET label='Z3-5 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=163, feb_26=148, mar_26=163 WHERE account_number='4300104';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-5 (Villa)','4300104','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',163,148,163 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300104');

UPDATE "Water System" SET label='Z3-8 (Villa)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='Residential (Villa)', jan_26=61, feb_26=65, mar_26=96 WHERE account_number='4300105';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-8 (Villa)','4300105','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','Residential (Villa)',61,65,96 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300105');

UPDATE "Water System" SET label='Z3-52(1A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-52 Building Bulk Meter', type='Residential (Apart)', jan_26=6, feb_26=4, mar_26=14 WHERE account_number='4300116';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-52(1A) (Building)','4300116','L4','Zone_03_(B)','D-52 Building Bulk Meter','Residential (Apart)',6,4,14 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300116');

UPDATE "Water System" SET label='Z3-62(2) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-62 Building Bulk Meter', type='Residential (Apart)', jan_26=18, feb_26=11, mar_26=6 WHERE account_number='4300119';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-62(2) (Building)','4300119','L4','Zone_03_(B)','D-62 Building Bulk Meter','Residential (Apart)',18,11,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300119');

UPDATE "Water System" SET label='Z3-58(5) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-58 Building Bulk Meter', type='Residential (Apart)', jan_26=24, feb_26=25, mar_26=36 WHERE account_number='4300120';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-58(5) (Building)','4300120','L4','Zone_03_(B)','D-58 Building Bulk Meter','Residential (Apart)',24,25,36 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300120');

UPDATE "Water System" SET label='Z3-62(3) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-62 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=1 WHERE account_number='4300124';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-62(3) (Building)','4300124','L4','Zone_03_(B)','D-62 Building Bulk Meter','Residential (Apart)',0,0,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300124');

UPDATE "Water System" SET label='D 52-Building Common Meter', level='L4', zone='Zone_03_(B)', parent_meter='D-52 Building Bulk Meter', type='D_Building_Common', jan_26=1, feb_26=1, mar_26=1 WHERE account_number='4300126';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 52-Building Common Meter','4300126','L4','Zone_03_(B)','D-52 Building Bulk Meter','D_Building_Common',1,1,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300126');

UPDATE "Water System" SET label='Z3-62(4) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-62 Building Bulk Meter', type='Residential (Apart)', jan_26=4, feb_26=8, mar_26=6 WHERE account_number='4300129';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-62(4) (Building)','4300129','L4','Zone_03_(B)','D-62 Building Bulk Meter','Residential (Apart)',4,8,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300129');

UPDATE "Water System" SET label='Z3-58(3B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-58 Building Bulk Meter', type='Residential (Apart)', jan_26=8, feb_26=6, mar_26=6 WHERE account_number='4300130';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-58(3B) (Building)','4300130','L4','Zone_03_(B)','D-58 Building Bulk Meter','Residential (Apart)',8,6,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300130');

UPDATE "Water System" SET label='Z3-058(4B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-58 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300132';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-058(4B) (Building)','4300132','L4','Zone_03_(B)','D-58 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300132');

UPDATE "Water System" SET label='Z3-62(5) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-62 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300133';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-62(5) (Building)','4300133','L4','Zone_03_(B)','D-62 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300133');

UPDATE "Water System" SET label='D 62-Building Common Meter', level='L4', zone='Zone_03_(B)', parent_meter='D-62 Building Bulk Meter', type='D_Building_Common', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300142';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 62-Building Common Meter','4300142','L4','Zone_03_(B)','D-62 Building Bulk Meter','D_Building_Common',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300142');

UPDATE "Water System" SET label='D-52 Building Bulk Meter', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='D_Building_Bulk', jan_26=37, feb_26=26, mar_26=43 WHERE account_number='4300186';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-52 Building Bulk Meter','4300186','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','D_Building_Bulk',37,26,43 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300186');

UPDATE "Water System" SET label='D-62 Building Bulk Meter', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='D_Building_Bulk', jan_26=82, feb_26=41, mar_26=42 WHERE account_number='4300187';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-62 Building Bulk Meter','4300187','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','D_Building_Bulk',82,41,42 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300187');

UPDATE "Water System" SET label='D 53-Building Common Meter', level='L4', zone='Zone_03_(B)', parent_meter='D-53 Building Bulk Meter', type='D_Building_Common', jan_26=0, feb_26=1, mar_26=1 WHERE account_number='4300201';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 53-Building Common Meter','4300201','L4','Zone_03_(B)','D-53 Building Bulk Meter','D_Building_Common',0,1,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300201');

UPDATE "Water System" SET label='D 54-Building Common Meter', level='L4', zone='Zone_03_(B)', parent_meter='D-54 Building Bulk Meter', type='D_Building_Common', jan_26=0, feb_26=0, mar_26=1 WHERE account_number='4300202';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 54-Building Common Meter','4300202','L4','Zone_03_(B)','D-54 Building Bulk Meter','D_Building_Common',0,0,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300202');

UPDATE "Water System" SET label='D 55-Building Common Meter', level='L4', zone='Zone_03_(B)', parent_meter='D-55 Building Bulk Meter', type='D_Building_Common', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300203';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 55-Building Common Meter','4300203','L4','Zone_03_(B)','D-55 Building Bulk Meter','D_Building_Common',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300203');

UPDATE "Water System" SET label='D 56-Building Common Meter', level='L4', zone='Zone_03_(B)', parent_meter='D-56 Building Bulk Meter', type='D_Building_Common', jan_26=2, feb_26=4, mar_26=2 WHERE account_number='4300204';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 56-Building Common Meter','4300204','L4','Zone_03_(B)','D-56 Building Bulk Meter','D_Building_Common',2,4,2 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300204');

UPDATE "Water System" SET label='D 57-Building Common Meter', level='L4', zone='Zone_03_(B)', parent_meter='D-57 Building Bulk Meter', type='D_Building_Common', jan_26=1, feb_26=1, mar_26=1 WHERE account_number='4300205';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 57-Building Common Meter','4300205','L4','Zone_03_(B)','D-57 Building Bulk Meter','D_Building_Common',1,1,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300205');

UPDATE "Water System" SET label='D 58-Building Common Meter', level='L4', zone='Zone_03_(B)', parent_meter='D-58 Building Bulk Meter', type='D_Building_Common', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300206';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 58-Building Common Meter','4300206','L4','Zone_03_(B)','D-58 Building Bulk Meter','D_Building_Common',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300206');

UPDATE "Water System" SET label='D 59-Building Common Meter', level='L4', zone='Zone_03_(B)', parent_meter='D-59 Building Bulk Meter', type='D_Building_Common', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300207';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 59-Building Common Meter','4300207','L4','Zone_03_(B)','D-59 Building Bulk Meter','D_Building_Common',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300207');

UPDATE "Water System" SET label='D 60-Building Common Meter', level='L4', zone='Zone_03_(B)', parent_meter='D-60 Building Bulk Meter', type='D_Building_Common', jan_26=0, feb_26=1, mar_26=1 WHERE account_number='4300208';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 60-Building Common Meter','4300208','L4','Zone_03_(B)','D-60 Building Bulk Meter','D_Building_Common',0,1,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300208');

UPDATE "Water System" SET label='D 61-Building Common Meter', level='L4', zone='Zone_03_(B)', parent_meter='D-61 Building Bulk Meter', type='D_Building_Common', jan_26=1, feb_26=2, mar_26=1 WHERE account_number='4300209';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D 61-Building Common Meter','4300209','L4','Zone_03_(B)','D-61 Building Bulk Meter','D_Building_Common',1,2,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300209');

UPDATE "Water System" SET label='Z3-53(1A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-53 Building Bulk Meter', type='Residential (Apart)', jan_26=16, feb_26=10, mar_26=12 WHERE account_number='4300210';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-53(1A) (Building)','4300210','L4','Zone_03_(B)','D-53 Building Bulk Meter','Residential (Apart)',16,10,12 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300210');

UPDATE "Water System" SET label='Z3-53(1B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-53 Building Bulk Meter', type='Residential (Apart)', jan_26=8, feb_26=6, mar_26=8 WHERE account_number='4300211';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-53(1B) (Building)','4300211','L4','Zone_03_(B)','D-53 Building Bulk Meter','Residential (Apart)',8,6,8 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300211');

UPDATE "Water System" SET label='Z3-53(2A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-53 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300212';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-53(2A) (Building)','4300212','L4','Zone_03_(B)','D-53 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300212');

UPDATE "Water System" SET label='Z3-53(2B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-53 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300213';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-53(2B) (Building)','4300213','L4','Zone_03_(B)','D-53 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300213');

UPDATE "Water System" SET label='Z3-53(3A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-53 Building Bulk Meter', type='Residential (Apart)', jan_26=4, feb_26=0, mar_26=2 WHERE account_number='4300214';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-53(3A) (Building)','4300214','L4','Zone_03_(B)','D-53 Building Bulk Meter','Residential (Apart)',4,0,2 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300214');

UPDATE "Water System" SET label='Z3-53(3B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-53 Building Bulk Meter', type='Residential (Apart)', jan_26=3, feb_26=1, mar_26=0 WHERE account_number='4300215';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-53(3B) (Building)','4300215','L4','Zone_03_(B)','D-53 Building Bulk Meter','Residential (Apart)',3,1,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300215');

UPDATE "Water System" SET label='Z3-53(4A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-53 Building Bulk Meter', type='Residential (Apart)', jan_26=11, feb_26=3, mar_26=3 WHERE account_number='4300216';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-53(4A) (Building)','4300216','L4','Zone_03_(B)','D-53 Building Bulk Meter','Residential (Apart)',11,3,3 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300216');

UPDATE "Water System" SET label='Z3-53(5) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-53 Building Bulk Meter', type='Residential (Apart)', jan_26=3, feb_26=3, mar_26=4 WHERE account_number='4300217';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-53(5) (Building)','4300217','L4','Zone_03_(B)','D-53 Building Bulk Meter','Residential (Apart)',3,3,4 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300217');

UPDATE "Water System" SET label='Z3-54(1A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-54 Building Bulk Meter', type='Residential (Apart)', jan_26=14, feb_26=11, mar_26=13 WHERE account_number='4300218';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-54(1A) (Building)','4300218','L4','Zone_03_(B)','D-54 Building Bulk Meter','Residential (Apart)',14,11,13 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300218');

UPDATE "Water System" SET label='Z3-54(1B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-54 Building Bulk Meter', type='Residential (Apart)', jan_26=2, feb_26=2, mar_26=2 WHERE account_number='4300219';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-54(1B) (Building)','4300219','L4','Zone_03_(B)','D-54 Building Bulk Meter','Residential (Apart)',2,2,2 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300219');

UPDATE "Water System" SET label='Z3-54(2A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-54 Building Bulk Meter', type='Residential (Apart)', jan_26=1, feb_26=2, mar_26=0 WHERE account_number='4300220';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-54(2A) (Building)','4300220','L4','Zone_03_(B)','D-54 Building Bulk Meter','Residential (Apart)',1,2,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300220');

UPDATE "Water System" SET label='Z3-54(2B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-54 Building Bulk Meter', type='Residential (Apart)', jan_26=7, feb_26=10, mar_26=0 WHERE account_number='4300221';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-54(2B) (Building)','4300221','L4','Zone_03_(B)','D-54 Building Bulk Meter','Residential (Apart)',7,10,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300221');

UPDATE "Water System" SET label='Z3-54(3A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-54 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300222';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-54(3A) (Building)','4300222','L4','Zone_03_(B)','D-54 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300222');

UPDATE "Water System" SET label='Z3-54(3B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-54 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=1, mar_26=0 WHERE account_number='4300223';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-54(3B) (Building)','4300223','L4','Zone_03_(B)','D-54 Building Bulk Meter','Residential (Apart)',0,1,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300223');

UPDATE "Water System" SET label='Z3-54(4A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-54 Building Bulk Meter', type='Residential (Apart)', jan_26=8, feb_26=6, mar_26=19 WHERE account_number='4300224';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-54(4A) (Building)','4300224','L4','Zone_03_(B)','D-54 Building Bulk Meter','Residential (Apart)',8,6,19 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300224');

UPDATE "Water System" SET label='Z3-54(4B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-54 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300225';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-54(4B) (Building)','4300225','L4','Zone_03_(B)','D-54 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300225');

UPDATE "Water System" SET label='Z3-54(5) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-54 Building Bulk Meter', type='Residential (Apart)', jan_26=14, feb_26=12, mar_26=15 WHERE account_number='4300226';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-54(5) (Building)','4300226','L4','Zone_03_(B)','D-54 Building Bulk Meter','Residential (Apart)',14,12,15 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300226');

UPDATE "Water System" SET label='Z3-54(6) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-54 Building Bulk Meter', type='Residential (Apart)', jan_26=5, feb_26=26, mar_26=9 WHERE account_number='4300227';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-54(6) (Building)','4300227','L4','Zone_03_(B)','D-54 Building Bulk Meter','Residential (Apart)',5,26,9 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300227');

UPDATE "Water System" SET label='Z3-55(1A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-55 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300228';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-55(1A) (Building)','4300228','L4','Zone_03_(B)','D-55 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300228');

UPDATE "Water System" SET label='Z3-55(2A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-55 Building Bulk Meter', type='Residential (Apart)', jan_26=19, feb_26=7, mar_26=6 WHERE account_number='4300229';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-55(2A) (Building)','4300229','L4','Zone_03_(B)','D-55 Building Bulk Meter','Residential (Apart)',19,7,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300229');

UPDATE "Water System" SET label='Z3-55(2B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-55 Building Bulk Meter', type='Residential (Apart)', jan_26=3, feb_26=2, mar_26=3 WHERE account_number='4300230';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-55(2B) (Building)','4300230','L4','Zone_03_(B)','D-55 Building Bulk Meter','Residential (Apart)',3,2,3 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300230');

UPDATE "Water System" SET label='Z3-55(3A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-55 Building Bulk Meter', type='Residential (Apart)', jan_26=29, feb_26=29, mar_26=5 WHERE account_number='4300231';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-55(3A) (Building)','4300231','L4','Zone_03_(B)','D-55 Building Bulk Meter','Residential (Apart)',29,29,5 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300231');

UPDATE "Water System" SET label='Z3-55(3B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-55 Building Bulk Meter', type='Residential (Apart)', jan_26=8, feb_26=3, mar_26=16 WHERE account_number='4300232';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-55(3B) (Building)','4300232','L4','Zone_03_(B)','D-55 Building Bulk Meter','Residential (Apart)',8,3,16 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300232');

UPDATE "Water System" SET label='Z3-55(4A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-55 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300233';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-55(4A) (Building)','4300233','L4','Zone_03_(B)','D-55 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300233');

UPDATE "Water System" SET label='Z3-55(4B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-55 Building Bulk Meter', type='Residential (Apart)', jan_26=6, feb_26=6, mar_26=6 WHERE account_number='4300234';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-55(4B) (Building)','4300234','L4','Zone_03_(B)','D-55 Building Bulk Meter','Residential (Apart)',6,6,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300234');

UPDATE "Water System" SET label='Z3-55(5) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-55 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300235';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-55(5) (Building)','4300235','L4','Zone_03_(B)','D-55 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300235');

UPDATE "Water System" SET label='Z3-55(6) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-55 Building Bulk Meter', type='Residential (Apart)', jan_26=5, feb_26=0, mar_26=0 WHERE account_number='4300236';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-55(6) (Building)','4300236','L4','Zone_03_(B)','D-55 Building Bulk Meter','Residential (Apart)',5,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300236');

UPDATE "Water System" SET label='Z3-56(1A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-56 Building Bulk Meter', type='Un-Sold', jan_26=0, feb_26=3, mar_26=0 WHERE account_number='4300237';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-56(1A) (Building)','4300237','L4','Zone_03_(B)','D-56 Building Bulk Meter','Un-Sold',0,3,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300237');

UPDATE "Water System" SET label='Z3-56(1B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-56 Building Bulk Meter', type='Residential (Apart)', jan_26=1, feb_26=0, mar_26=0 WHERE account_number='4300238';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-56(1B) (Building)','4300238','L4','Zone_03_(B)','D-56 Building Bulk Meter','Residential (Apart)',1,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300238');

UPDATE "Water System" SET label='Z3-56(2A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-56 Building Bulk Meter', type='Residential (Apart)', jan_26=2, feb_26=2, mar_26=1 WHERE account_number='4300239';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-56(2A) (Building)','4300239','L4','Zone_03_(B)','D-56 Building Bulk Meter','Residential (Apart)',2,2,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300239');

UPDATE "Water System" SET label='Z3-56(2B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-56 Building Bulk Meter', type='Residential (Apart)', jan_26=5, feb_26=0, mar_26=0 WHERE account_number='4300240';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-56(2B) (Building)','4300240','L4','Zone_03_(B)','D-56 Building Bulk Meter','Residential (Apart)',5,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300240');

UPDATE "Water System" SET label='Z3-56(3A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-56 Building Bulk Meter', type='Residential (Apart)', jan_26=7, feb_26=8, mar_26=9 WHERE account_number='4300241';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-56(3A) (Building)','4300241','L4','Zone_03_(B)','D-56 Building Bulk Meter','Residential (Apart)',7,8,9 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300241');

UPDATE "Water System" SET label='Z3-56(3B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-56 Building Bulk Meter', type='Residential (Apart)', jan_26=2, feb_26=0, mar_26=6 WHERE account_number='4300242';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-56(3B) (Building)','4300242','L4','Zone_03_(B)','D-56 Building Bulk Meter','Residential (Apart)',2,0,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300242');

UPDATE "Water System" SET label='Z3-56(4A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-56 Building Bulk Meter', type='Residential (Apart)', jan_26=3, feb_26=11, mar_26=4 WHERE account_number='4300243';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-56(4A) (Building)','4300243','L4','Zone_03_(B)','D-56 Building Bulk Meter','Residential (Apart)',3,11,4 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300243');

UPDATE "Water System" SET label='Z3-56(4B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-56 Building Bulk Meter', type='Residential (Apart)', jan_26=9, feb_26=15, mar_26=20 WHERE account_number='4300244';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-56(4B) (Building)','4300244','L4','Zone_03_(B)','D-56 Building Bulk Meter','Residential (Apart)',9,15,20 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300244');

UPDATE "Water System" SET label='Z3-56(5) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-56 Building Bulk Meter', type='Residential (Apart)', jan_26=13, feb_26=3, mar_26=0 WHERE account_number='4300245';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-56(5) (Building)','4300245','L4','Zone_03_(B)','D-56 Building Bulk Meter','Residential (Apart)',13,3,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300245');

UPDATE "Water System" SET label='Z3-56(6) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-56 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300246';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-56(6) (Building)','4300246','L4','Zone_03_(B)','D-56 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300246');

UPDATE "Water System" SET label='Z3-57(1A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-57 Building Bulk Meter', type='Residential (Apart)', jan_26=1, feb_26=0, mar_26=0 WHERE account_number='4300247';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-57(1A) (Building)','4300247','L4','Zone_03_(B)','D-57 Building Bulk Meter','Residential (Apart)',1,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300247');

UPDATE "Water System" SET label='Z3-57(1B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-57 Building Bulk Meter', type='Residential (Apart)', jan_26=4, feb_26=5, mar_26=2 WHERE account_number='4300248';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-57(1B) (Building)','4300248','L4','Zone_03_(B)','D-57 Building Bulk Meter','Residential (Apart)',4,5,2 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300248');

UPDATE "Water System" SET label='Z3-57(2A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-57 Building Bulk Meter', type='Residential (Apart)', jan_26=12, feb_26=12, mar_26=9 WHERE account_number='4300249';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-57(2A) (Building)','4300249','L4','Zone_03_(B)','D-57 Building Bulk Meter','Residential (Apart)',12,12,9 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300249');

UPDATE "Water System" SET label='Z3-57(2B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-57 Building Bulk Meter', type='Residential (Apart)', jan_26=9, feb_26=7, mar_26=6 WHERE account_number='4300250';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-57(2B) (Building)','4300250','L4','Zone_03_(B)','D-57 Building Bulk Meter','Residential (Apart)',9,7,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300250');

UPDATE "Water System" SET label='Z3-57(3A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-57 Building Bulk Meter', type='Residential (Apart)', jan_26=6, feb_26=6, mar_26=4 WHERE account_number='4300251';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-57(3A) (Building)','4300251','L4','Zone_03_(B)','D-57 Building Bulk Meter','Residential (Apart)',6,6,4 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300251');

UPDATE "Water System" SET label='Z3-57(3B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-57 Building Bulk Meter', type='Residential (Apart)', jan_26=5, feb_26=1, mar_26=0 WHERE account_number='4300252';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-57(3B) (Building)','4300252','L4','Zone_03_(B)','D-57 Building Bulk Meter','Residential (Apart)',5,1,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300252');

UPDATE "Water System" SET label='Z3-57(4A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-57 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=5, mar_26=11 WHERE account_number='4300253';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-57(4A) (Building)','4300253','L4','Zone_03_(B)','D-57 Building Bulk Meter','Residential (Apart)',0,5,11 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300253');

UPDATE "Water System" SET label='Z3-57(4B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-57 Building Bulk Meter', type='Residential (Apart)', jan_26=5, feb_26=0, mar_26=0 WHERE account_number='4300254';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-57(4B) (Building)','4300254','L4','Zone_03_(B)','D-57 Building Bulk Meter','Residential (Apart)',5,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300254');

UPDATE "Water System" SET label='Z3-57(5) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-57 Building Bulk Meter', type='Residential (Apart)', jan_26=30, feb_26=16, mar_26=10 WHERE account_number='4300255';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-57(5) (Building)','4300255','L4','Zone_03_(B)','D-57 Building Bulk Meter','Residential (Apart)',30,16,10 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300255');

UPDATE "Water System" SET label='Z3-57(6) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-57 Building Bulk Meter', type='Residential (Apart)', jan_26=8, feb_26=9, mar_26=9 WHERE account_number='4300256';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-57(6) (Building)','4300256','L4','Zone_03_(B)','D-57 Building Bulk Meter','Residential (Apart)',8,9,9 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300256');

UPDATE "Water System" SET label='Z3-58(1A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-58 Building Bulk Meter', type='Residential (Apart)', jan_26=3, feb_26=5, mar_26=6 WHERE account_number='4300257';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-58(1A) (Building)','4300257','L4','Zone_03_(B)','D-58 Building Bulk Meter','Residential (Apart)',3,5,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300257');

UPDATE "Water System" SET label='Z3-58(2A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-58 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300258';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-58(2A) (Building)','4300258','L4','Zone_03_(B)','D-58 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300258');

UPDATE "Water System" SET label='Z3-58(2B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-58 Building Bulk Meter', type='Residential (Apart)', jan_26=4, feb_26=5, mar_26=5 WHERE account_number='4300259';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-58(2B) (Building)','4300259','L4','Zone_03_(B)','D-58 Building Bulk Meter','Residential (Apart)',4,5,5 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300259');

UPDATE "Water System" SET label='Z3-58(3A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-58 Building Bulk Meter', type='Residential (Apart)', jan_26=3, feb_26=2, mar_26=0 WHERE account_number='4300260';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-58(3A) (Building)','4300260','L4','Zone_03_(B)','D-58 Building Bulk Meter','Residential (Apart)',3,2,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300260');

UPDATE "Water System" SET label='Z3-58(4A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-58 Building Bulk Meter', type='Residential (Apart)', jan_26=1, feb_26=2, mar_26=3 WHERE account_number='4300261';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-58(4A) (Building)','4300261','L4','Zone_03_(B)','D-58 Building Bulk Meter','Residential (Apart)',1,2,3 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300261');

UPDATE "Water System" SET label='Z3-58(6) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-58 Building Bulk Meter', type='Residential (Apart)', jan_26=18, feb_26=17, mar_26=20 WHERE account_number='4300262';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-58(6) (Building)','4300262','L4','Zone_03_(B)','D-58 Building Bulk Meter','Residential (Apart)',18,17,20 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300262');

UPDATE "Water System" SET label='Z3-59(1A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-59 Building Bulk Meter', type='Residential (Apart)', jan_26=7, feb_26=5, mar_26=5 WHERE account_number='4300263';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-59(1A) (Building)','4300263','L4','Zone_03_(B)','D-59 Building Bulk Meter','Residential (Apart)',7,5,5 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300263');

UPDATE "Water System" SET label='Z3-59(1B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-59 Building Bulk Meter', type='Residential (Apart)', jan_26=1, feb_26=0, mar_26=3 WHERE account_number='4300264';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-59(1B) (Building)','4300264','L4','Zone_03_(B)','D-59 Building Bulk Meter','Residential (Apart)',1,0,3 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300264');

UPDATE "Water System" SET label='Z3-59(2A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-59 Building Bulk Meter', type='Residential (Apart)', jan_26=9, feb_26=4, mar_26=11 WHERE account_number='4300265';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-59(2A) (Building)','4300265','L4','Zone_03_(B)','D-59 Building Bulk Meter','Residential (Apart)',9,4,11 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300265');

UPDATE "Water System" SET label='Z3-59(2B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-59 Building Bulk Meter', type='Residential (Apart)', jan_26=10, feb_26=10, mar_26=14 WHERE account_number='4300266';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-59(2B) (Building)','4300266','L4','Zone_03_(B)','D-59 Building Bulk Meter','Residential (Apart)',10,10,14 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300266');

UPDATE "Water System" SET label='Z3-59(3B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-59 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300267';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-59(3B) (Building)','4300267','L4','Zone_03_(B)','D-59 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300267');

UPDATE "Water System" SET label='Z3-59(4A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-59 Building Bulk Meter', type='Residential (Apart)', jan_26=9, feb_26=10, mar_26=16 WHERE account_number='4300268';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-59(4A) (Building)','4300268','L4','Zone_03_(B)','D-59 Building Bulk Meter','Residential (Apart)',9,10,16 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300268');

UPDATE "Water System" SET label='Z3-59(5) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-59 Building Bulk Meter', type='Residential (Apart)', jan_26=1, feb_26=5, mar_26=1 WHERE account_number='4300269';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-59(5) (Building)','4300269','L4','Zone_03_(B)','D-59 Building Bulk Meter','Residential (Apart)',1,5,1 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300269');

UPDATE "Water System" SET label='Z3-59(6) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-59 Building Bulk Meter', type='Residential (Apart)', jan_26=17, feb_26=9, mar_26=19 WHERE account_number='4300270';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-59(6) (Building)','4300270','L4','Zone_03_(B)','D-59 Building Bulk Meter','Residential (Apart)',17,9,19 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300270');

UPDATE "Water System" SET label='Z3-60(1A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-60 Building Bulk Meter', type='Residential (Apart)', jan_26=8, feb_26=7, mar_26=6 WHERE account_number='4300271';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-60(1A) (Building)','4300271','L4','Zone_03_(B)','D-60 Building Bulk Meter','Residential (Apart)',8,7,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300271');

UPDATE "Water System" SET label='Z3-60(2A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-60 Building Bulk Meter', type='Residential (Apart)', jan_26=3, feb_26=7, mar_26=3 WHERE account_number='4300272';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-60(2A) (Building)','4300272','L4','Zone_03_(B)','D-60 Building Bulk Meter','Residential (Apart)',3,7,3 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300272');

UPDATE "Water System" SET label='Z3-60(3A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-60 Building Bulk Meter', type='Residential (Apart)', jan_26=7, feb_26=15, mar_26=14 WHERE account_number='4300273';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-60(3A) (Building)','4300273','L4','Zone_03_(B)','D-60 Building Bulk Meter','Residential (Apart)',7,15,14 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300273');

UPDATE "Water System" SET label='Z3-60(4A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-60 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300274';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-60(4A) (Building)','4300274','L4','Zone_03_(B)','D-60 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300274');

UPDATE "Water System" SET label='Z3-60(5) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-60 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=6 WHERE account_number='4300275';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-60(5) (Building)','4300275','L4','Zone_03_(B)','D-60 Building Bulk Meter','Residential (Apart)',0,0,6 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300275');

UPDATE "Water System" SET label='Z3-60(6) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-60 Building Bulk Meter', type='Residential (Apart)', jan_26=59, feb_26=45, mar_26=30 WHERE account_number='4300276';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-60(6) (Building)','4300276','L4','Zone_03_(B)','D-60 Building Bulk Meter','Residential (Apart)',59,45,30 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300276');

UPDATE "Water System" SET label='Z3-61(1A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-61 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=2, mar_26=5 WHERE account_number='4300277';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-61(1A) (Building)','4300277','L4','Zone_03_(B)','D-61 Building Bulk Meter','Residential (Apart)',0,2,5 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300277');

UPDATE "Water System" SET label='Z3-61(1B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-61 Building Bulk Meter', type='Residential (Apart)', jan_26=9, feb_26=9, mar_26=9 WHERE account_number='4300278';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-61(1B) (Building)','4300278','L4','Zone_03_(B)','D-61 Building Bulk Meter','Residential (Apart)',9,9,9 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300278');

UPDATE "Water System" SET label='Z3-61(2A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-61 Building Bulk Meter', type='Residential (Apart)', jan_26=1, feb_26=2, mar_26=3 WHERE account_number='4300279';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-61(2A) (Building)','4300279','L4','Zone_03_(B)','D-61 Building Bulk Meter','Residential (Apart)',1,2,3 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300279');

UPDATE "Water System" SET label='Z3-61(2B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-61 Building Bulk Meter', type='Residential (Apart)', jan_26=1, feb_26=1, mar_26=0 WHERE account_number='4300280';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-61(2B) (Building)','4300280','L4','Zone_03_(B)','D-61 Building Bulk Meter','Residential (Apart)',1,1,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300280');

UPDATE "Water System" SET label='Z3-61(3A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-61 Building Bulk Meter', type='Residential (Apart)', jan_26=7, feb_26=2, mar_26=4 WHERE account_number='4300281';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-61(3A) (Building)','4300281','L4','Zone_03_(B)','D-61 Building Bulk Meter','Residential (Apart)',7,2,4 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300281');

UPDATE "Water System" SET label='Z3-61(3B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-61 Building Bulk Meter', type='Residential (Apart)', jan_26=1, feb_26=0, mar_26=0 WHERE account_number='4300282';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-61(3B) (Building)','4300282','L4','Zone_03_(B)','D-61 Building Bulk Meter','Residential (Apart)',1,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300282');

UPDATE "Water System" SET label='Z3-61(4A) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-61 Building Bulk Meter', type='Residential (Apart)', jan_26=9, feb_26=7, mar_26=3 WHERE account_number='4300283';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-61(4A) (Building)','4300283','L4','Zone_03_(B)','D-61 Building Bulk Meter','Residential (Apart)',9,7,3 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300283');

UPDATE "Water System" SET label='Z3-61(4B) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-61 Building Bulk Meter', type='Residential (Apart)', jan_26=3, feb_26=4, mar_26=5 WHERE account_number='4300284';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-61(4B) (Building)','4300284','L4','Zone_03_(B)','D-61 Building Bulk Meter','Residential (Apart)',3,4,5 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300284');

UPDATE "Water System" SET label='Z3-61(5) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-61 Building Bulk Meter', type='Residential (Apart)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300285';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-61(5) (Building)','4300285','L4','Zone_03_(B)','D-61 Building Bulk Meter','Residential (Apart)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300285');

UPDATE "Water System" SET label='Z3-61(6) (Building)', level='L4', zone='Zone_03_(B)', parent_meter='D-61 Building Bulk Meter', type='Residential (Apart)', jan_26=16, feb_26=14, mar_26=19 WHERE account_number='4300286';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z3-61(6) (Building)','4300286','L4','Zone_03_(B)','D-61 Building Bulk Meter','Residential (Apart)',16,14,19 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300286');

UPDATE "Water System" SET label='D-53 Building Bulk Meter', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='D_Building_Bulk', jan_26=96, feb_26=65, mar_26=75 WHERE account_number='4300311';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-53 Building Bulk Meter','4300311','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','D_Building_Bulk',96,65,75 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300311');

UPDATE "Water System" SET label='D-54 Building Bulk Meter', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='D_Building_Bulk', jan_26=50, feb_26=74, mar_26=54 WHERE account_number='4300312';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-54 Building Bulk Meter','4300312','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','D_Building_Bulk',50,74,54 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300312');

UPDATE "Water System" SET label='D-55 Building Bulk Meter', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='D_Building_Bulk', jan_26=74, feb_26=55, mar_26=37 WHERE account_number='4300313';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-55 Building Bulk Meter','4300313','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','D_Building_Bulk',74,55,37 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300313');

UPDATE "Water System" SET label='D-56 Building Bulk Meter', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='D_Building_Bulk', jan_26=43, feb_26=39, mar_26=32 WHERE account_number='4300314';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-56 Building Bulk Meter','4300314','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','D_Building_Bulk',43,39,32 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300314');

UPDATE "Water System" SET label='D-57 Building Bulk Meter', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='D_Building_Bulk', jan_26=87, feb_26=61, mar_26=52 WHERE account_number='4300315';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-57 Building Bulk Meter','4300315','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','D_Building_Bulk',87,61,52 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300315');

UPDATE "Water System" SET label='D-58 Building Bulk Meter', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='D_Building_Bulk', jan_26=64, feb_26=64, mar_26=79 WHERE account_number='4300316';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-58 Building Bulk Meter','4300316','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','D_Building_Bulk',64,64,79 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300316');

UPDATE "Water System" SET label='D-59 Building Bulk Meter', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='D_Building_Bulk', jan_26=62, feb_26=50, mar_26=72 WHERE account_number='4300317';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-59 Building Bulk Meter','4300317','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','D_Building_Bulk',62,50,72 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300317');

UPDATE "Water System" SET label='D-60 Building Bulk Meter', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='D_Building_Bulk', jan_26=99, feb_26=96, mar_26=83 WHERE account_number='4300318';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-60 Building Bulk Meter','4300318','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','D_Building_Bulk',99,96,83 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300318');

UPDATE "Water System" SET label='D-61 Building Bulk Meter', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='D_Building_Bulk', jan_26=46, feb_26=40, mar_26=47 WHERE account_number='4300319';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'D-61 Building Bulk Meter','4300319','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','D_Building_Bulk',46,40,47 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300319');

UPDATE "Water System" SET label='Irrigation Tank 02 (Z03)', level='L3', zone='Zone_03_(B)', parent_meter='ZONE 3B (BULK ZONE 3B)', type='IRR_Servies', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300320';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Irrigation Tank 02 (Z03)','4300320','L3','Zone_03_(B)','ZONE 3B (BULK ZONE 3B)','IRR_Servies',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300320');

UPDATE "Water System" SET label='ZONE 3B (Bulk Zone 3B)', level='L2', zone='Zone_03_(B)', parent_meter='Main Bulk (NAMA)', type='Zone Bulk', jan_26=5996, feb_26=5374, mar_26=2383 WHERE account_number='4300344';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'ZONE 3B (Bulk Zone 3B)','4300344','L2','Zone_03_(B)','Main Bulk (NAMA)','Zone Bulk',5996,5374,2383 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300344');

UPDATE "Water System" SET label='Z5-17', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=97, feb_26=73, mar_26=89 WHERE account_number='4300001';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-17','4300001','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',97,73,89 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300001');

UPDATE "Water System" SET label='Z5-13', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=117, feb_26=64, mar_26=53 WHERE account_number='4300058';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-13','4300058','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',117,64,53 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300058');

UPDATE "Water System" SET label='Z5-14', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=35, feb_26=39, mar_26=82 WHERE account_number='4300059';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-14','4300059','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',35,39,82 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300059');

UPDATE "Water System" SET label='Z5-5', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=44, feb_26=32, mar_26=49 WHERE account_number='4300146';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-5','4300146','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',44,32,49 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300146');

UPDATE "Water System" SET label='Z5-30', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=120, feb_26=107, mar_26=125 WHERE account_number='4300147';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-30','4300147','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',120,107,125 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300147');

UPDATE "Water System" SET label='Z5-2', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=0, feb_26=0, mar_26=3 WHERE account_number='4300148';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-2','4300148','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',0,0,3 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300148');

UPDATE "Water System" SET label='Z5-10', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=21, feb_26=19, mar_26=73 WHERE account_number='4300149';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-10','4300149','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',21,19,73 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300149');

UPDATE "Water System" SET label='Z5-4', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=45, feb_26=42, mar_26=25 WHERE account_number='4300150';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-4','4300150','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',45,42,25 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300150');

UPDATE "Water System" SET label='Z5-6', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Un-Sold', jan_26=0, feb_26=5, mar_26=0 WHERE account_number='4300151';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-6','4300151','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Un-Sold',0,5,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300151');

UPDATE "Water System" SET label='Z5 020', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=76, feb_26=72, mar_26=91 WHERE account_number='4300152';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5 020','4300152','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',76,72,91 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300152');

UPDATE "Water System" SET label='Z5-23', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=8, feb_26=6, mar_26=7 WHERE account_number='4300153';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-23','4300153','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',8,6,7 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300153');

UPDATE "Water System" SET label='Z5-15', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=16, feb_26=11, mar_26=10 WHERE account_number='4300154';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-15','4300154','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',16,11,10 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300154');

UPDATE "Water System" SET label='Z5-9', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=66, feb_26=75, mar_26=79 WHERE account_number='4300155';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-9','4300155','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',66,75,79 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300155');

UPDATE "Water System" SET label='Z5-26', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=11, feb_26=10, mar_26=10 WHERE account_number='4300156';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-26','4300156','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',11,10,10 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300156');

UPDATE "Water System" SET label='Z5-25', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=34, feb_26=51, mar_26=44 WHERE account_number='4300157';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-25','4300157','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',34,51,44 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300157');

UPDATE "Water System" SET label='Z5-31', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=28, feb_26=22, mar_26=21 WHERE account_number='4300158';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-31','4300158','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',28,22,21 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300158');

UPDATE "Water System" SET label='Z5-33', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Un-Sold', jan_26=1, feb_26=13, mar_26=9 WHERE account_number='4300159';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-33','4300159','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Un-Sold',1,13,9 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300159');

UPDATE "Water System" SET label='Z5-29', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Un-Sold', jan_26=2, feb_26=34, mar_26=37 WHERE account_number='4300160';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-29','4300160','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Un-Sold',2,34,37 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300160');

UPDATE "Water System" SET label='Z5-28', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=55, feb_26=64, mar_26=208 WHERE account_number='4300161';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-28','4300161','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',55,64,208 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300161');

UPDATE "Water System" SET label='Z5-32', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=18, feb_26=16, mar_26=93 WHERE account_number='4300162';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-32','4300162','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',18,16,93 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300162');

UPDATE "Water System" SET label='Z5-22', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=35, feb_26=74, mar_26=408 WHERE account_number='4300163';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-22','4300163','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',35,74,408 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300163');

UPDATE "Water System" SET label='Z5-7', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300164';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-7','4300164','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300164');

UPDATE "Water System" SET label='Z5-27', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=31, feb_26=41, mar_26=42 WHERE account_number='4300165';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-27','4300165','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',31,41,42 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300165');

UPDATE "Water System" SET label='Z5-12', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=56, feb_26=31, mar_26=27 WHERE account_number='4300166';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-12','4300166','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',56,31,27 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300166');

UPDATE "Water System" SET label='Z5 024', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Un-Sold', jan_26=0, feb_26=104, mar_26=29 WHERE account_number='4300167';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5 024','4300167','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Un-Sold',0,104,29 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300167');

UPDATE "Water System" SET label='Z5 016', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=64, feb_26=58, mar_26=59 WHERE account_number='4300168';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5 016','4300168','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',64,58,59 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300168');

UPDATE "Water System" SET label='Z5-21', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=11, feb_26=17, mar_26=18 WHERE account_number='4300169';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-21','4300169','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',11,17,18 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300169');

UPDATE "Water System" SET label='Z5-3', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=109, feb_26=83, mar_26=82 WHERE account_number='4300170';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-3','4300170','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',109,83,82 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300170');

UPDATE "Water System" SET label='Z5 019', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=5, feb_26=7, mar_26=4 WHERE account_number='4300171';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5 019','4300171','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',5,7,4 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300171');

UPDATE "Water System" SET label='Z5-1', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=4, feb_26=11, mar_26=24 WHERE account_number='4300172';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-1','4300172','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',4,11,24 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300172');

UPDATE "Water System" SET label='Z5-11', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Un-Sold', jan_26=2, feb_26=80, mar_26=45 WHERE account_number='4300173';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-11','4300173','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Un-Sold',2,80,45 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300173');

UPDATE "Water System" SET label='Z5-18', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=9, feb_26=12, mar_26=10 WHERE account_number='4300174';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-18','4300174','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',9,12,10 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300174');

UPDATE "Water System" SET label='Z5-8', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='Residential (Villa)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300175';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z5-8','4300175','L3','Zone_05','ZONE 5 (Bulk Zone 5)','Residential (Villa)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300175');

UPDATE "Water System" SET label='Irrigation Tank 03 (Z05)', level='L3', zone='Zone_05', parent_meter='ZONE 5 (Bulk Zone 5)', type='IRR_Servies', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300321';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Irrigation Tank 03 (Z05)','4300321','L3','Zone_05','ZONE 5 (Bulk Zone 5)','IRR_Servies',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300321');

UPDATE "Water System" SET label='ZONE 5 (Bulk Zone 5)', level='L2', zone='Zone_05', parent_meter='Main Bulk (NAMA)', type='Zone Bulk', jan_26=4598, feb_26=3348, mar_26=4352 WHERE account_number='4300345';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'ZONE 5 (Bulk Zone 5)','4300345','L2','Zone_05','Main Bulk (NAMA)','Zone Bulk',4598,3348,4352 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300345');

UPDATE "Water System" SET label='Z8-11', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Residential (Villa)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300023';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-11','4300023','L3','Zone_08','BULK ZONE 8','Residential (Villa)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300023');

UPDATE "Water System" SET label='Z8-13', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Residential (Villa)', jan_26=157, feb_26=187, mar_26=272 WHERE account_number='4300024';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-13','4300024','L3','Zone_08','BULK ZONE 8','Residential (Villa)',157,187,272 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300024');

UPDATE "Water System" SET label='Z8-1', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Un-Sold', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300188';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-1','4300188','L3','Zone_08','BULK ZONE 8','Un-Sold',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300188');

UPDATE "Water System" SET label='Z8-2', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Residential (Villa)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300189';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-2','4300189','L3','Zone_08','BULK ZONE 8','Residential (Villa)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300189');

UPDATE "Water System" SET label='Z8-3', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Residential (Villa)', jan_26=1, feb_26=2, mar_26=2 WHERE account_number='4300190';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-3','4300190','L3','Zone_08','BULK ZONE 8','Residential (Villa)',1,2,2 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300190');

UPDATE "Water System" SET label='Z8-4', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Un-Sold', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300191';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-4','4300191','L3','Zone_08','BULK ZONE 8','Un-Sold',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300191');

UPDATE "Water System" SET label='Z8-6', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Un-Sold', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300192';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-6','4300192','L3','Zone_08','BULK ZONE 8','Un-Sold',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300192');

UPDATE "Water System" SET label='Z8-7', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Un-Sold', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300193';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-7','4300193','L3','Zone_08','BULK ZONE 8','Un-Sold',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300193');

UPDATE "Water System" SET label='Z8-8', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Un-Sold', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300194';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-8','4300194','L3','Zone_08','BULK ZONE 8','Un-Sold',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300194');

UPDATE "Water System" SET label='Z8-10', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Un-Sold', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300195';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-10','4300195','L3','Zone_08','BULK ZONE 8','Un-Sold',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300195');

UPDATE "Water System" SET label='Z8-12', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Residential (Villa)', jan_26=110, feb_26=198, mar_26=128 WHERE account_number='4300196';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-12','4300196','L3','Zone_08','BULK ZONE 8','Residential (Villa)',110,198,128 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300196');

UPDATE "Water System" SET label='Z8-14', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Residential (Villa)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300197';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-14','4300197','L3','Zone_08','BULK ZONE 8','Residential (Villa)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300197');

UPDATE "Water System" SET label='Z8-15', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Residential (Villa)', jan_26=92, feb_26=88, mar_26=67 WHERE account_number='4300198';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-15','4300198','L3','Zone_08','BULK ZONE 8','Residential (Villa)',92,88,67 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300198');

UPDATE "Water System" SET label='Z8-16', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Residential (Villa)', jan_26=72, feb_26=108, mar_26=89 WHERE account_number='4300199';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-16','4300199','L3','Zone_08','BULK ZONE 8','Residential (Villa)',72,108,89 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300199');

UPDATE "Water System" SET label='Z8-17', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Residential (Villa)', jan_26=156, feb_26=152, mar_26=160 WHERE account_number='4300200';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-17','4300200','L3','Zone_08','BULK ZONE 8','Residential (Villa)',156,152,160 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300200');

UPDATE "Water System" SET label='Z8-5', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Residential (Villa)', jan_26=156, feb_26=144, mar_26=197 WHERE account_number='4300287';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-5','4300287','L3','Zone_08','BULK ZONE 8','Residential (Villa)',156,144,197 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300287');

UPDATE "Water System" SET label='Z8-9', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Residential (Villa)', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300288';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-9','4300288','L3','Zone_08','BULK ZONE 8','Residential (Villa)',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300288');

UPDATE "Water System" SET label='Z8-18', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Residential (Villa)', jan_26=113, feb_26=125, mar_26=101 WHERE account_number='4300289';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-18','4300289','L3','Zone_08','BULK ZONE 8','Residential (Villa)',113,125,101 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300289');

UPDATE "Water System" SET label='Z8-19', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Residential (Villa)', jan_26=91, feb_26=92, mar_26=91 WHERE account_number='4300290';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-19','4300290','L3','Zone_08','BULK ZONE 8','Residential (Villa)',91,92,91 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300290');

UPDATE "Water System" SET label='Z8-20', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Residential (Villa)', jan_26=108, feb_26=119, mar_26=93 WHERE account_number='4300291';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-20','4300291','L3','Zone_08','BULK ZONE 8','Residential (Villa)',108,119,93 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300291');

UPDATE "Water System" SET label='Z8-21', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Residential (Villa)', jan_26=47, feb_26=52, mar_26=46 WHERE account_number='4300292';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-21','4300292','L3','Zone_08','BULK ZONE 8','Residential (Villa)',47,52,46 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300292');

UPDATE "Water System" SET label='Z8-22', level='L3', zone='Zone_08', parent_meter='BULK ZONE 8', type='Residential (Villa)', jan_26=16, feb_26=14, mar_26=15 WHERE account_number='4300293';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Z8-22','4300293','L3','Zone_08','BULK ZONE 8','Residential (Villa)',16,14,15 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300293');

UPDATE "Water System" SET label='ZONE 8 (Bulk Zone 8)', level='L2', zone='Zone_08', parent_meter='Main Bulk (NAMA)', type='Zone Bulk', jan_26=2336, feb_26=2425, mar_26=2416 WHERE account_number='4300342';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'ZONE 8 (Bulk Zone 8)','4300342','L2','Zone_08','Main Bulk (NAMA)','Zone Bulk',2336,2425,2416 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300342');

UPDATE "Water System" SET label='Irrigation Tank - VS PO Water', level='L3', zone='Zone_VS', parent_meter='Village Square (Zone Bulk)', type='IRR_Servies', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300326';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Irrigation Tank - VS PO Water','4300326','L3','Zone_VS','Village Square (Zone Bulk)','IRR_Servies',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300326');

UPDATE "Water System" SET label='Coffee 1 (GF Shop No.591)', level='L3', zone='Zone_VS', parent_meter='Village Square (Zone Bulk)', type='Retail', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300327';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Coffee 1 (GF Shop No.591)','4300327','L3','Zone_VS','Village Square (Zone Bulk)','Retail',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300327');

UPDATE "Water System" SET label='Village Square Caffe & Bar', level='L3', zone='Zone_VS', parent_meter='Village Square (Zone Bulk)', type='Retail', jan_26=53, feb_26=35, mar_26=35 WHERE account_number='4300328';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Village Square Caffe & Bar','4300328','L3','Zone_VS','Village Square (Zone Bulk)','Retail',53,35,35 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300328');

UPDATE "Water System" SET label='Coffee 2 (GF Shop No.594 A)', level='L3', zone='Zone_VS', parent_meter='Village Square (Zone Bulk)', type='Retail', jan_26=7, feb_26=5, mar_26=15 WHERE account_number='4300329';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Coffee 2 (GF Shop No.594 A)','4300329','L3','Zone_VS','Village Square (Zone Bulk)','Retail',7,5,15 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300329');

UPDATE "Water System" SET label='Supermarket (FF Shop No.591)', level='L3', zone='Zone_VS', parent_meter='Village Square (Zone Bulk)', type='Retail', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300330';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Supermarket (FF Shop No.591)','4300330','L3','Zone_VS','Village Square (Zone Bulk)','Retail',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300330');

UPDATE "Water System" SET label='Pharmacy (FF Shop No.591 A)', level='L3', zone='Zone_VS', parent_meter='Village Square (Zone Bulk)', type='Retail', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300331';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Pharmacy (FF Shop No.591 A)','4300331','L3','Zone_VS','Village Square (Zone Bulk)','Retail',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300331');

UPDATE "Water System" SET label='Laundry Services (FF Shop No.593)', level='L3', zone='Zone_VS', parent_meter='Village Square (Zone Bulk)', type='Retail', jan_26=86, feb_26=76, mar_26=87 WHERE account_number='4300332';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Laundry Services (FF Shop No.593)','4300332','L3','Zone_VS','Village Square (Zone Bulk)','Retail',86,76,87 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300332');

UPDATE "Water System" SET label='Shop No.593 A', level='L3', zone='Zone_VS', parent_meter='Village Square (Zone Bulk)', type='Retail', jan_26=0, feb_26=0, mar_26=0 WHERE account_number='4300333';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Shop No.593 A','4300333','L3','Zone_VS','Village Square (Zone Bulk)','Retail',0,0,0 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300333');

UPDATE "Water System" SET label='Village Square (Zone Bulk)', level='L2', zone='Zone_VS', parent_meter='Main Bulk (NAMA)', type='Zone Bulk', jan_26=249, feb_26=153, mar_26=176 WHERE account_number='4300335';
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_26, feb_26, mar_26) SELECT 'Village Square (Zone Bulk)','4300335','L2','Zone_VS','Main Bulk (NAMA)','Zone Bulk',249,153,176 WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number='4300335');

-- Verify
SELECT level, COUNT(*) as count FROM "Water System" GROUP BY level ORDER BY level;
SELECT COUNT(*) as total FROM "Water System";
