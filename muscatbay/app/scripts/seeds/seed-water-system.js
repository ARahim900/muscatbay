// Script to create and seed Water System table in Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');

let supabaseUrl = '';
let supabaseKey = '';

envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
    if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = value;
});

console.log('Supabase URL:', supabaseUrl ? 'FOUND' : 'NOT FOUND');
console.log('Supabase Key:', supabaseKey ? 'FOUND' : 'NOT FOUND');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Water meters data from lib/water-data.ts
const WATER_METERS = [
    // L1 - Main Source
    { label: 'Main Bulk (NAMA)', account_number: 'C43659', level: 'L1', zone: 'Main Bulk', parent_meter: 'NAMA', type: 'Main BULK', jan_25: 32580, feb_25: 44043, mar_25: 34915, apr_25: 46039, may_25: 58425, jun_25: 41840, jul_25: 41475, aug_25: 41743, sep_25: 42088, oct_25: 46049, nov_25: 47347, dec_25: null },

    // L2 - Zone Bulks
    { label: 'ZONE 8 (Bulk Zone 8)', account_number: '4300342', level: 'L2', zone: 'Zone_08', parent_meter: 'Main Bulk (NAMA)', type: 'Zone Bulk', jan_25: 1547, feb_25: 1498, mar_25: 2605, apr_25: 3203, may_25: 2937, jun_25: 3142, jul_25: 3542, aug_25: 3840, sep_25: 3385, oct_25: 14550, nov_25: null, dec_25: null },
    { label: 'ZONE 3A (Bulk Zone 3A)', account_number: '4300343', level: 'L2', zone: 'Zone_03_(A)', parent_meter: 'Main Bulk (NAMA)', type: 'Zone Bulk', jan_25: 4235, feb_25: 4273, mar_25: 3591, apr_25: 4041, may_25: 4898, jun_25: 6484, jul_25: 6440, aug_25: 6212, sep_25: 6075, oct_25: 7219, nov_25: 5208, dec_25: null },
    { label: 'ZONE 3B (Bulk Zone 3B)', account_number: '4300344', level: 'L2', zone: 'Zone_03_(B)', parent_meter: 'Main Bulk (NAMA)', type: 'Zone Bulk', jan_25: 3256, feb_25: 2962, mar_25: 3331, apr_25: 2157, may_25: 3093, jun_25: 3231, jul_25: 3243, aug_25: 2886, sep_25: 3466, oct_25: 5467, nov_25: 11824, dec_25: null },
    { label: 'ZONE 5 (Bulk Zone 5)', account_number: '4300345', level: 'L2', zone: 'Zone_05', parent_meter: 'Main Bulk (NAMA)', type: 'Zone Bulk', jan_25: 4267, feb_25: 4231, mar_25: 3862, apr_25: 3737, may_25: 3849, jun_25: 4116, jul_25: 3497, aug_25: 3968, sep_25: 3823, oct_25: 4218, nov_25: 4433, dec_25: null },
    { label: 'ZONE FM ( BULK ZONE FM )', account_number: '4300346', level: 'L2', zone: 'Zone_01_(FM)', parent_meter: 'Main Bulk (NAMA)', type: 'Zone Bulk', jan_25: 2008, feb_25: 1740, mar_25: 1880, apr_25: 1880, may_25: 1693, jun_25: 1659, jul_25: 1974, aug_25: 2305, sep_25: 1966, oct_25: 2002, nov_25: 2059, dec_25: null },
    { label: 'Village Square (Zone Bulk)', account_number: '4300335', level: 'L2', zone: 'Zone_VS', parent_meter: 'Main Bulk (NAMA)', type: 'Zone Bulk', jan_25: 14, feb_25: 12, mar_25: 21, apr_25: 13, may_25: 21, jun_25: 19, jul_25: 60, aug_25: 77, sep_25: 75, oct_25: 122, nov_25: 126, dec_25: null },
    { label: 'Sales Center Common Building', account_number: '4300295', level: 'L2', zone: 'Zone_SC', parent_meter: 'Main Bulk (NAMA)', type: 'Zone Bulk', jan_25: 76, feb_25: 68, mar_25: 37, apr_25: 67, may_25: 63, jun_25: 55, jul_25: 60, aug_25: 61, sep_25: 82, oct_25: 78, nov_25: 78, dec_25: null },

    // DC - Direct Connections
    { label: 'Hotel Main Building', account_number: '4300334', level: 'DC', zone: 'Direct Connection', parent_meter: 'Main Bulk (NAMA)', type: 'Retail', jan_25: 18048, feb_25: 19482, mar_25: 22151, apr_25: 27676, may_25: 26963, jun_25: 17379, jul_25: 14713, aug_25: 16249, sep_25: 16249, oct_25: 18876, nov_25: 18876, dec_25: null },
    { label: 'Al Adrak Camp', account_number: '4300348', level: 'DC', zone: 'Direct Connection', parent_meter: 'Main Bulk (NAMA)', type: 'Retail', jan_25: 1038, feb_25: 702, mar_25: 1161, apr_25: 1000, may_25: 1228, jun_25: 1015, jul_25: 972, aug_25: 924, sep_25: 769, oct_25: 879, nov_25: 875, dec_25: null },
    { label: 'Al Adrak Company', account_number: '4300349', level: 'DC', zone: 'Direct Connection', parent_meter: 'Main Bulk (NAMA)', type: 'Retail', jan_25: 0, feb_25: 0, mar_25: 0, apr_25: 0, may_25: 0, jun_25: 1758, jul_25: 1802, aug_25: 1511, sep_25: 1776, oct_25: 1687, nov_25: 1448, dec_25: null },
    { label: 'Community Mgmt - Technical Zone, STP', account_number: '4300336', level: 'DC', zone: 'Direct Connection', parent_meter: 'Main Bulk (NAMA)', type: 'MB_Common', jan_25: 29, feb_25: 37, mar_25: 25, apr_25: 35, may_25: 29, jun_25: 53, jul_25: 50, aug_25: 56, sep_25: 50, oct_25: 62, nov_25: 42, dec_25: null },
    { label: 'Building (Security)', account_number: '4300297', level: 'DC', zone: 'Direct Connection', parent_meter: 'Main Bulk (NAMA)', type: 'MB_Common', jan_25: 17, feb_25: 18, mar_25: 13, apr_25: 16, may_25: 16, jun_25: 13, jul_25: 19, aug_25: 16, sep_25: 16, oct_25: 20, nov_25: 25, dec_25: null },
    { label: 'Building (ROP)', account_number: '4300299', level: 'DC', zone: 'Direct Connection', parent_meter: 'Main Bulk (NAMA)', type: 'MB_Common', jan_25: 23, feb_25: 21, mar_25: 19, apr_25: 20, may_25: 20, jun_25: 17, jul_25: 22, aug_25: 20, sep_25: 20, oct_25: 23, nov_25: 31, dec_25: null },
    { label: 'PHASE 02, MAIN ENTRANCE', account_number: '4300338', level: 'DC', zone: 'Direct Connection', parent_meter: 'Main Bulk (NAMA)', type: 'MB_Common', jan_25: 11, feb_25: 8, mar_25: 6, apr_25: 7, may_25: 6, jun_25: 6, jul_25: 7, aug_25: 8, sep_25: 7, oct_25: 12, nov_25: 10, dec_25: null },
    { label: 'Irrigation Tank 01 (Inlet)', account_number: '4300323', level: 'DC', zone: 'Direct Connection', parent_meter: 'Main Bulk (NAMA)', type: 'IRR_Servies', jan_25: 0, feb_25: 0, mar_25: 0, apr_25: 0, may_25: 2, jun_25: 0, jul_25: 1, aug_25: 0, sep_25: 0, oct_25: 0, nov_25: 0, dec_25: null },
    { label: 'Irrigation- Controller UP', account_number: '4300340', level: 'DC', zone: 'Direct Connection', parent_meter: 'Main Bulk (NAMA)', type: 'IRR_Servies', jan_25: 0, feb_25: 0, mar_25: 0, apr_25: 1000, may_25: 313, jun_25: 491, jul_25: 554, aug_25: 272, sep_25: 266, oct_25: 181, nov_25: 328, dec_25: null },
    { label: 'Irrigation- Controller DOWN', account_number: '4300341', level: 'DC', zone: 'Direct Connection', parent_meter: 'Main Bulk (NAMA)', type: 'IRR_Servies', jan_25: 159, feb_25: 239, mar_25: 283, apr_25: 411, may_25: 910, jun_25: 511, jul_25: 611, aug_25: 394, sep_25: 0, oct_25: 0, nov_25: 0, dec_25: null },

    // L3 - Zone FM
    { label: 'Building FM', account_number: '4300296', level: 'L3', zone: 'Zone_01_(FM)', parent_meter: 'ZONE FM ( BULK ZONE FM )', type: 'MB_Common', jan_25: 37, feb_25: 39, mar_25: 49, apr_25: 40, may_25: 41, jun_25: 32, jul_25: 44, aug_25: 40, sep_25: 34, oct_25: 39, nov_25: 44, dec_25: null },
    { label: 'Building B1', account_number: '4300300', level: 'L3', zone: 'Zone_01_(FM)', parent_meter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', jan_25: 228, feb_25: 225, mar_25: 235, apr_25: 253, may_25: 233, jun_25: 144, jul_25: 229, aug_25: 298, sep_25: 256, oct_25: 265, nov_25: 250, dec_25: null },
    { label: 'Building B2', account_number: '4300301', level: 'L3', zone: 'Zone_01_(FM)', parent_meter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', jan_25: 236, feb_25: 213, mar_25: 202, apr_25: 187, may_25: 199, jun_25: 171, jul_25: 191, aug_25: 240, sep_25: 212, oct_25: 248, nov_25: 256, dec_25: null },
    { label: 'Building B3', account_number: '4300302', level: 'L3', zone: 'Zone_01_(FM)', parent_meter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', jan_25: 169, feb_25: 165, mar_25: 132, apr_25: 134, may_25: 160, jun_25: 151, jul_25: 170, aug_25: 149, sep_25: 156, oct_25: 210, nov_25: 257, dec_25: null },
    { label: 'Building B4', account_number: '4300303', level: 'L3', zone: 'Zone_01_(FM)', parent_meter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', jan_25: 108, feb_25: 108, mar_25: 148, apr_25: 148, may_25: 121, jun_25: 149, jul_25: 159, aug_25: 179, sep_25: 201, oct_25: 175, nov_25: 169, dec_25: null },
    { label: 'Building B5', account_number: '4300304', level: 'L3', zone: 'Zone_01_(FM)', parent_meter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', jan_25: 1, feb_25: 2, mar_25: 1, apr_25: 1, may_25: 0, jun_25: 179, jul_25: 62, aug_25: 54, sep_25: 39, oct_25: 42, nov_25: 37, dec_25: null },
    { label: 'Building B6', account_number: '4300305', level: 'L3', zone: 'Zone_01_(FM)', parent_meter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', jan_25: 254, feb_25: 228, mar_25: 268, apr_25: 281, may_25: 214, jun_25: 194, jul_25: 196, aug_25: 210, sep_25: 210, oct_25: 229, nov_25: 231, dec_25: null },
    { label: 'Building B7', account_number: '4300306', level: 'L3', zone: 'Zone_01_(FM)', parent_meter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', jan_25: 178, feb_25: 190, mar_25: 174, apr_25: 201, may_25: 200, jun_25: 154, jul_25: 192, aug_25: 155, sep_25: 158, oct_25: 200, nov_25: 201, dec_25: null },
    { label: 'Building B8', account_number: '4300307', level: 'L3', zone: 'Zone_01_(FM)', parent_meter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', jan_25: 268, feb_25: 250, mar_25: 233, apr_25: 0, may_25: 413, jun_25: 213, jul_25: 62, aug_25: 84, sep_25: 371, oct_25: 579, nov_25: 281, dec_25: null },
    { label: 'Building CIF/CB', account_number: '4300324', level: 'L3', zone: 'Zone_01_(FM)', parent_meter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', jan_25: 420, feb_25: 331, mar_25: 306, apr_25: 307, may_25: 284, jun_25: 241, jul_25: 443, aug_25: 731, sep_25: 484, oct_25: 274, nov_25: 270, dec_25: null },

    // L3 - Zone 3A Villas
    { label: 'Z3-31 (Villa)', account_number: '4300052', level: 'L3', zone: 'Zone_03_(A)', parent_meter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', jan_25: 165, feb_25: 133, mar_25: 30, apr_25: 306, may_25: 527, jun_25: 240, jul_25: 109, aug_25: 235, sep_25: 205, oct_25: 242, nov_25: 233, dec_25: null },
    { label: 'Z3-35 (Villa)', account_number: '4300075', level: 'L3', zone: 'Zone_03_(A)', parent_meter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', jan_25: 65, feb_25: 61, mar_25: 52, apr_25: 74, may_25: 68, jun_25: 86, jul_25: 70, aug_25: 65, sep_25: 65, oct_25: 79, nov_25: 74, dec_25: null },
    { label: 'Z3-36 (Villa)', account_number: '4300084', level: 'L3', zone: 'Zone_03_(A)', parent_meter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', jan_25: 81, feb_25: 83, mar_25: 69, apr_25: 83, may_25: 170, jun_25: 166, jul_25: 157, aug_25: 115, sep_25: 103, oct_25: 89, nov_25: 87, dec_25: null },
    { label: 'Z3-42 (Villa)', account_number: '4300002', level: 'L3', zone: 'Zone_03_(A)', parent_meter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', jan_25: 32, feb_25: 46, mar_25: 19, apr_25: 62, may_25: 87, jun_25: 59, jul_25: 53, aug_25: 65, sep_25: 44, oct_25: 25, nov_25: 24, dec_25: null },

    // L3 - Zone 3A Building Bulks
    { label: 'D-44 Building Bulk Meter', account_number: '4300178', level: 'L3', zone: 'Zone_03_(A)', parent_meter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', jan_25: 180, feb_25: 198, mar_25: 92, apr_25: 87, may_25: 62, jun_25: 49, jul_25: 52, aug_25: 59, sep_25: 60, oct_25: 68, nov_25: 66, dec_25: null },
    { label: 'D-45 Building Bulk Meter', account_number: '4300179', level: 'L3', zone: 'Zone_03_(A)', parent_meter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', jan_25: 20, feb_25: 32, mar_25: 44, apr_25: 56, may_25: 55, jun_25: 10, jul_25: 12, aug_25: 11, sep_25: 35, oct_25: 29, nov_25: 39, dec_25: null },
    { label: 'D-46 Building Bulk Meter', account_number: '4300180', level: 'L3', zone: 'Zone_03_(A)', parent_meter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', jan_25: 61, feb_25: 46, mar_25: 29, apr_25: 68, may_25: 69, jun_25: 55, jul_25: 65, aug_25: 85, sep_25: 114, oct_25: 134, nov_25: 68, dec_25: null },
    { label: 'D-47 Building Bulk Meter', account_number: '4300181', level: 'L3', zone: 'Zone_03_(A)', parent_meter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', jan_25: 103, feb_25: 70, mar_25: 55, apr_25: 69, may_25: 57, jun_25: 83, jul_25: 121, aug_25: 62, sep_25: 72, oct_25: 96, nov_25: 83, dec_25: null },
    { label: 'D-51 Building Bulk Meter', account_number: '4300185', level: 'L3', zone: 'Zone_03_(A)', parent_meter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', jan_25: 92, feb_25: 108, mar_25: 152, apr_25: 166, may_25: 111, jun_25: 100, jul_25: 149, aug_25: 154, sep_25: 164, oct_25: 202, nov_25: 107, dec_25: null },
    { label: 'D-74 Building Bulk Meter', account_number: '4300177', level: 'L3', zone: 'Zone_03_(A)', parent_meter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', jan_25: 41, feb_25: 35, mar_25: 36, apr_25: 54, may_25: 51, jun_25: 62, jul_25: 101, aug_25: 106, sep_25: 128, oct_25: 116, nov_25: 66, dec_25: null },
    { label: 'D-75 Building Bulk Meter', account_number: '4300176', level: 'L3', zone: 'Zone_03_(A)', parent_meter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', jan_25: 63, feb_25: 60, mar_25: 66, apr_25: 71, may_25: 59, jun_25: 62, jul_25: 67, aug_25: 101, sep_25: 66, oct_25: 65, nov_25: 64, dec_25: null },

    // L4 - D-44 Apartments
    { label: 'Z3-44(1A)', account_number: '4300030', level: 'L4', zone: 'Zone_03_(A)', parent_meter: 'D-44 Building Bulk Meter', type: 'Residential (Apart)', jan_25: 11, feb_25: 11, mar_25: 10, apr_25: 6, may_25: 11, jun_25: 8, jul_25: 2, aug_25: 7, sep_25: 9, oct_25: 9, nov_25: 11, dec_25: null },
    { label: 'Z3-44(2A)', account_number: '4300032', level: 'L4', zone: 'Zone_03_(A)', parent_meter: 'D-44 Building Bulk Meter', type: 'Residential (Apart)', jan_25: 9, feb_25: 3, mar_25: 5, apr_25: 10, may_25: 7, jun_25: 2, jul_25: 3, aug_25: 5, sep_25: 6, oct_25: 7, nov_25: 3, dec_25: null },
    { label: 'Z3-44(5)', account_number: '4300034', level: 'L4', zone: 'Zone_03_(A)', parent_meter: 'D-44 Building Bulk Meter', type: 'Residential (Apart)', jan_25: 118, feb_25: 139, mar_25: 38, apr_25: 25, may_25: 6, jun_25: 6, jul_25: 9, aug_25: 8, sep_25: 7, oct_25: 4, nov_25: 1, dec_25: null },
    { label: 'Z3-44(6)', account_number: '4300035', level: 'L4', zone: 'Zone_03_(A)', parent_meter: 'D-44 Building Bulk Meter', type: 'Residential (Apart)', jan_25: 34, feb_25: 37, mar_25: 31, apr_25: 37, may_25: 35, jun_25: 32, jul_25: 37, aug_25: 38, sep_25: 37, oct_25: 40, nov_25: 44, dec_25: null },
    { label: 'D 44-Building Common', account_number: '4300144', level: 'L4', zone: 'Zone_03_(A)', parent_meter: 'D-44 Building Bulk Meter', type: 'D_Building_Common', jan_25: 1, feb_25: 1, mar_25: 0, apr_25: 1, may_25: 1, jun_25: 1, jul_25: 1, aug_25: 1, sep_25: 1, oct_25: 1, nov_25: 1, dec_25: null },

    // L3 - Zone 3B Villas
    { label: 'Z3-3 (Villa)', account_number: '4300088', level: 'L3', zone: 'Zone_03_(B)', parent_meter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', jan_25: 66, feb_25: 59, mar_25: 63, apr_25: 73, may_25: 176, jun_25: 192, jul_25: 136, aug_25: 118, sep_25: 106, oct_25: 119, nov_25: 96, dec_25: null },
    { label: 'Z3-8 (Villa)', account_number: '4300105', level: 'L3', zone: 'Zone_03_(B)', parent_meter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', jan_25: 83, feb_25: 106, mar_25: 196, apr_25: 358, may_25: 414, jun_25: 346, jul_25: 132, aug_25: 54, sep_25: 48, oct_25: 53, nov_25: 54, dec_25: null },
    { label: 'Z3-12 (Villa)', account_number: '4300076', level: 'L3', zone: 'Zone_03_(B)', parent_meter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', jan_25: 73, feb_25: 59, mar_25: 54, apr_25: 181, may_25: 178, jun_25: 249, jul_25: 188, aug_25: 179, sep_25: 161, oct_25: 77, nov_25: 114, dec_25: null },

    // L3 - Zone 3B Building Bulks
    { label: 'D-52 Building Bulk Meter', account_number: '4300186', level: 'L3', zone: 'Zone_03_(B)', parent_meter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', jan_25: 40, feb_25: 35, mar_25: 25, apr_25: 37, may_25: 48, jun_25: 46, jul_25: 52, aug_25: 47, sep_25: 26, oct_25: 104, nov_25: 41, dec_25: null },
    { label: 'D-53 Building Bulk Meter', account_number: '4300311', level: 'L3', zone: 'Zone_03_(B)', parent_meter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', jan_25: 18, feb_25: 27, mar_25: 26, apr_25: 39, may_25: 21, jun_25: 27, jul_25: 26, aug_25: 30, sep_25: 45, oct_25: 94, nov_25: 106, dec_25: null },
    { label: 'D-54 Building Bulk Meter', account_number: '4300312', level: 'L3', zone: 'Zone_03_(B)', parent_meter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', jan_25: 63, feb_25: 52, mar_25: 66, apr_25: 95, may_25: 51, jun_25: 55, jul_25: 76, aug_25: 55, sep_25: 50, oct_25: 45, nov_25: 67, dec_25: null },

    // L3 - Zone 5 Villas
    { label: 'Z5-3', account_number: '4300170', level: 'L3', zone: 'Zone_05', parent_meter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', jan_25: 149, feb_25: 86, mar_25: 67, apr_25: 100, may_25: 70, jun_25: 82, jul_25: 95, aug_25: 100, sep_25: 135, oct_25: 120, nov_25: 114, dec_25: null },
    { label: 'Z5-13', account_number: '4300058', level: 'L3', zone: 'Zone_05', parent_meter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', jan_25: 72, feb_25: 106, mar_25: 89, apr_25: 120, may_25: 109, jun_25: 115, jul_25: 155, aug_25: 146, sep_25: 123, oct_25: 168, nov_25: 67, dec_25: null },
    { label: 'Z5-17', account_number: '4300001', level: 'L3', zone: 'Zone_05', parent_meter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', jan_25: 112, feb_25: 80, mar_25: 81, apr_25: 90, may_25: 58, jun_25: 72, jul_25: 88, aug_25: 74, sep_25: 103, oct_25: 84, nov_25: 83, dec_25: null },
    { label: 'Z5-22', account_number: '4300163', level: 'L3', zone: 'Zone_05', parent_meter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', jan_25: 15, feb_25: 40, mar_25: 186, apr_25: 243, may_25: 201, jun_25: 186, jul_25: 192, aug_25: 175, sep_25: 80, oct_25: 108, nov_25: 78, dec_25: null },
    { label: 'Z5-30', account_number: '4300147', level: 'L3', zone: 'Zone_05', parent_meter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', jan_25: 65, feb_25: 87, mar_25: 71, apr_25: 113, may_25: 203, jun_25: 238, jul_25: 212, aug_25: 155, sep_25: 76, oct_25: 73, nov_25: 110, dec_25: null },

    // L3 - Zone 8 Villas
    { label: 'Z8-5', account_number: '4300287', level: 'L3', zone: 'Zone_08', parent_meter: 'BULK ZONE 8', type: 'Residential (Villa)', jan_25: 208, feb_25: 341, mar_25: 313, apr_25: 336, may_25: 325, jun_25: 236, jul_25: 224, aug_25: 98, sep_25: 326, oct_25: 203, nov_25: 155, dec_25: null },
    { label: 'Z8-12', account_number: '4300196', level: 'L3', zone: 'Zone_08', parent_meter: 'BULK ZONE 8', type: 'Residential (Villa)', jan_25: 236, feb_25: 192, mar_25: 249, apr_25: 267, may_25: 295, jun_25: 386, jul_25: 466, aug_25: 550, sep_25: 302, oct_25: 233, nov_25: 199, dec_25: null },
    { label: 'Z8-15', account_number: '4300198', level: 'L3', zone: 'Zone_08', parent_meter: 'BULK ZONE 8', type: 'Residential (Villa)', jan_25: 99, feb_25: 61, mar_25: 70, apr_25: 125, may_25: 112, jun_25: 121, jul_25: 123, aug_25: 126, sep_25: 106, oct_25: 107, nov_25: 129, dec_25: null },
    { label: 'Z8-17', account_number: '4300200', level: 'L3', zone: 'Zone_08', parent_meter: 'BULK ZONE 8', type: 'Residential (Villa)', jan_25: 164, feb_25: 162, mar_25: 171, apr_25: 207, may_25: 238, jun_25: 211, jul_25: 192, aug_25: 200, sep_25: 177, oct_25: 206, nov_25: 200, dec_25: null },

    // L3 - Village Square & Sales Center
    { label: 'Coffee 2 (GF Shop No.594 A)', account_number: '4300329', level: 'L3', zone: 'Zone_VS', parent_meter: 'Village Square (Zone Bulk)', type: 'Retail', jan_25: 2, feb_25: 3, mar_25: 5, apr_25: 5, may_25: 5, jun_25: 4, jul_25: 9, aug_25: 5, sep_25: 15, oct_25: 10, nov_25: 11, dec_25: null },
    { label: 'Laundry Services', account_number: '4300332', level: 'L3', zone: 'Zone_VS', parent_meter: 'Village Square (Zone Bulk)', type: 'Retail', jan_25: 33, feb_25: 25, mar_25: 22, apr_25: 0, may_25: 44, jun_25: 28, jul_25: 44, aug_25: 42, sep_25: 42, oct_25: 49, nov_25: 61, dec_25: null },
    { label: 'Sale Centre Caffe & Bar', account_number: '4300328', level: 'L3', zone: 'Zone_SC', parent_meter: 'Sale Centre (Zone Bulk)', type: 'Retail', jan_25: 0, feb_25: 2, mar_25: 3, apr_25: 5, may_25: 12, jun_25: 5, jul_25: 20, aug_25: 33, sep_25: 27, oct_25: 43, nov_25: 40, dec_25: null },
];

async function seedWaterSystem() {
    console.log('\n=== Seeding Water System Table ===\n');
    console.log(`Total meters to insert: ${WATER_METERS.length}`);

    // First, try to delete existing data
    console.log('Clearing existing data...');
    const { error: deleteError } = await supabase
        .from('Water System')
        .delete()
        .neq('id', 0); // Delete all rows

    if (deleteError && !deleteError.message.includes('does not exist')) {
        console.log('Delete warning:', deleteError.message);
    }

    // Insert in batches
    const batchSize = 20;
    let successCount = 0;

    for (let i = 0; i < WATER_METERS.length; i += batchSize) {
        const batch = WATER_METERS.slice(i, i + batchSize);
        console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(WATER_METERS.length / batchSize)}...`);

        const { data, error } = await supabase
            .from('Water System')
            .insert(batch)
            .select();

        if (error) {
            console.error('Insert error:', error.message);
            if (error.message.includes('does not exist')) {
                console.log('\n--- TABLE DOES NOT EXIST ---');
                console.log('Please create the "Water System" table in Supabase with the following columns:');
                console.log(`
CREATE TABLE "Water System" (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL,
    account_number TEXT NOT NULL,
    level TEXT NOT NULL,
    zone TEXT NOT NULL,
    parent_meter TEXT,
    type TEXT,
    jan_25 INTEGER,
    feb_25 INTEGER,
    mar_25 INTEGER,
    apr_25 INTEGER,
    may_25 INTEGER,
    jun_25 INTEGER,
    jul_25 INTEGER,
    aug_25 INTEGER,
    sep_25 INTEGER,
    oct_25 INTEGER,
    nov_25 INTEGER,
    dec_25 INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and add policy for anonymous access
ALTER TABLE "Water System" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON "Water System" FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous insert" ON "Water System" FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON "Water System" FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anonymous delete" ON "Water System" FOR DELETE TO anon USING (true);
                `);
                process.exit(1);
            }
        } else {
            successCount += batch.length;
            console.log(`  Inserted ${batch.length} records`);
        }
    }

    console.log(`\n=== Complete: ${successCount}/${WATER_METERS.length} records inserted ===`);

    // Verify
    const { data: verifyData, count } = await supabase
        .from('Water System')
        .select('*', { count: 'exact' })
        .limit(5);

    console.log(`\nVerification: Found ${count || 0} records in Water System table`);
    if (verifyData && verifyData.length > 0) {
        console.log('Sample record:', verifyData[0]);
    }
}

seedWaterSystem().catch(console.error);
