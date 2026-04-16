#!/usr/bin/env node
/**
 * Generate and upload zone-based repetitive asset rows
 * (Elec, Ac, MECH, PLUM, CIVIL, PAINT for all villa/apartment zones)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Define the 260 zone units in exact order
function getZoneUnits() {
  const units = [];
  // Z8: Z8022 down to Z8001
  for (let i = 22; i >= 1; i--) units.push({ id: `Z80${i < 10 ? '0' + i : i}`, tag: `SBJ-Z8-Z80${i < 10 ? '0' + i : i}`, zone: `Z80${i < 10 ? '0' + i : i}` });
  // Z5: Z5033 down to Z5001
  for (let i = 33; i >= 1; i--) units.push({ id: `Z50${i < 10 ? '0' + i : i}`, tag: `SBJ-Z5-Z50${i < 10 ? '0' + i : i}`, zone: `Z50${i < 10 ? '0' + i : i}` });
  // Z3A: Z3075 (6 sub-units)
  for (let s = 6; s >= 1; s--) units.push({ id: `Z3075-${s}`, tag: `SBJ-Z3A-Z3075-${s}`, zone: 'Z3075' });
  // Z3A: Z3074 (6 sub-units)
  for (let s = 6; s >= 1; s--) units.push({ id: `Z3074-${s}`, tag: `SBJ-Z3A-Z3074-${s}`, zone: 'Z3074' });
  // Z3B: Z3062 (6 sub-units, simple -1 to -6)
  for (let s = 6; s >= 1; s--) units.push({ id: `Z3062-${s}`, tag: `SBJ-Z3B-Z3062-${s}`, zone: 'Z3062' });
  // Z3B: buildings 3061 down to 3053 (10 sub-units each: -6,-5,-4B,-4A,-3B,-3A,-2B,-2A,-1B,-1A)
  const tenSubs = ['6', '5', '4B', '4A', '3B', '3A', '2B', '2A', '1B', '1A'];
  for (let b = 61; b >= 53; b--) {
    for (const s of tenSubs) {
      units.push({ id: `Z30${b}-${s}`, tag: `SBJ-Z3B-Z30${b}-${s}`, zone: `Z30${b}` });
    }
  }
  // Z3B: Z3052 (6 sub-units, simple)
  for (let s = 6; s >= 1; s--) units.push({ id: `Z3052-${s}`, tag: `SBJ-Z3B-Z3052-${s}`, zone: 'Z3052' });
  // Z3A: Z3051 down to Z3044 (6 sub-units each, simple)
  for (let b = 51; b >= 44; b--) {
    for (let s = 6; s >= 1; s--) {
      units.push({ id: `Z30${b}-${s}`, tag: `SBJ-Z3A-Z30${b}-${s}`, zone: `Z30${b}` });
    }
  }
  // Z3A: Z3043 down to Z3023 (single villas)
  for (let i = 43; i >= 23; i--) units.push({ id: `Z30${i}`, tag: `SBJ-Z3A-Z30${i}`, zone: `Z30${i}` });
  // Z3B: Z3022 down to Z3001 (single villas)
  for (let i = 22; i >= 1; i--) units.push({ id: `Z30${i < 10 ? '0' + i : i}`, tag: `SBJ-Z3B-Z30${i < 10 ? '0' + i : i}`, zone: `Z30${i < 10 ? '0' + i : i}` });
  return units;
}

function generateRows() {
  const zones = getZoneUnits();
  console.log(`Zone units: ${zones.length}`); // Should be 260
  const rows = [];

  const disciplines = [
    // [prefix, baseUID, discipline, category, lifeExp, installDate, sourceSheet, startSourceRow]
    ['Elec', 1060, 'Electrical', 'ELECTRICAL', 15, '2019-01-01', 'Electrical', 418],
    ['Ac', 1320, 'Electrical', 'ELECTRICAL', 15, '2019-01-01', 'Electrical', 678],
    ['MECH', 1580, 'Mechanical & Plumbing', 'MECHANICAL & PLUMBING', 15, '2019-01-01', 'Mechanical & Plumbing', 365],
    ['PLUM', 1840, 'Mechanical & Plumbing', 'MECHANICAL & PLUMBING', 15, '2019-01-01', 'Mechanical & Plumbing', 625],
    ['CIVIL', 2100, 'Civil', 'CIVIL', 20, '2019-01-01', 'Civil', 2],
    ['PAINT', 2360, 'Painting', 'PAINTING', 10, null, 'Painting', 2],
  ];

  for (const [prefix, baseUID, discipline, category, lifeExp, installDate, sourceSheet, startRow] of disciplines) {
    zones.forEach((z, idx) => {
      const n = idx + 1;
      const uid = baseUID + idx;
      const assetName = `${prefix} ${n}`;
      // Determine install year based on discipline and zone
      let installYear = 2019;
      if (prefix === 'PAINT' && z.zone.startsWith('Z30')) installYear = 2018;

      rows.push({
        Asset_UID: `${uid}`,
        Asset_Tag: assetName,
        Asset_Name: assetName,
        Asset_Description: assetName,
        Discipline: discipline,
        Category: category,
        Subcategory: 'OTHERS',
        System_Area: null,
        Location_Name: z.id,
        Location_Tag: z.tag,
        Building: null,
        Floor_Area: null,
        Zone: z.zone,
        Manufacturer_Brand: null,
        Model: null,
        Country_Of_Origin: null,
        Capacity_Size: null,
        Quantity: null,
        Install_Date: installDate,
        Install_Year: installYear,
        PPM_Frequency: 'Q',
        PPM_Interval: null,
        Is_Asset_Active: 'Y',
        Life_Expectancy_Years: lifeExp,
        Current_Age_Years: null,
        ERL_Years: null,
        Condition: null,
        Status: null,
        Supplier_Vendor: null,
        AMC_Contractor: null,
        Responsibility_Owner: null,
        Notes_Remarks: null,
        Tag_Duplicate_Flag: false,
        Source_Sheet: sourceSheet,
        Source_Row: startRow + idx,
      });
    });
  }

  // Extra M&P OTHERS row
  rows.push({
    Asset_UID: '3444', Asset_Tag: 'OTHERS', Asset_Name: 'OTHERS', Asset_Description: 'OTHERS',
    Discipline: 'Mechanical & Plumbing', Category: 'MECHANICAL & PLUMBING', Subcategory: 'OTHERS',
    System_Area: null, Location_Name: 'Z5004', Location_Tag: 'SBJ-Z5-Z5004', Building: null,
    Floor_Area: null, Zone: 'Z5004', Manufacturer_Brand: null, Model: null, Country_Of_Origin: null,
    Capacity_Size: null, Quantity: null, Install_Date: '2019-01-01', Install_Year: 2019,
    PPM_Frequency: 'Q', PPM_Interval: null, Is_Asset_Active: 'Y', Life_Expectancy_Years: 15,
    Current_Age_Years: null, ERL_Years: null, Condition: null, Status: null,
    Supplier_Vendor: null, AMC_Contractor: null, Responsibility_Owner: null, Notes_Remarks: null,
    Tag_Duplicate_Flag: false, Source_Sheet: 'Mechanical & Plumbing', Source_Row: 885,
  });

  return rows;
}

async function main() {
  const rows = generateRows();
  console.log(`Generated ${rows.length} zone rows`);

  const BATCH = 100;
  let uploaded = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('Assets_Register_Database').insert(batch);
    if (error) {
      console.error(`Batch ${Math.floor(i/BATCH)+1} FAILED:`, error.message);
      // Try to show which row failed
      if (error.message.includes('duplicate')) console.error('Duplicate key issue');
      process.exit(1);
    }
    uploaded += batch.length;
    process.stdout.write(`\r  Uploaded ${uploaded}/${rows.length}`);
  }
  console.log('\nZone data upload complete!');
}

main().catch(e => { console.error(e); process.exit(1); });
