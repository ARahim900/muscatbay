const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read env
const envPath = path.resolve(__dirname, '../.env.local');
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex > 0) {
            const key = trimmed.substring(0, equalsIndex).trim();
            const value = trimmed.substring(equalsIndex + 1).trim().replace(/^["']|["']$/g, '');
            if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
            if (key === 'SUPABASE_SERVICE_ROLE_KEY' || key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
                if (!supabaseKey || key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = value;
            }
        }
    }
} catch (e) {
    console.error('Error reading .env.local:', e.message);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// All meters with their Jan-26 and Feb-26 readings
// Format: [meter_name, jan_26_value, feb_26_value]
// null means no data for that month
const meterData = [
    ['Beachwell', 16247.0, 38806.0],
    ['ROP Building', 75472.0, 76771.0],
    ['Security Building', 195192.0, 199711.0],
    ['Central Park', 1088385.0, 1108274.0],
    ['Village Square', 268033.0, 272517.0],
    ['D Building 51', 106817.0, 107583.0],
    ['D Building 45', 89093.0, 89616.0],
    ['D Building 48', 104394.0, 105000.0],
    ['D Building 75', 97063.0, 97656.0],
    ['D Building 50', 101870.0, 102472.0],
    ['D Building 74', 82111.0, 82493.0],
    ['D Building 47', 105194.0, 106100.0],
    ['D Building 52', 111193.0, 112004.0],
    ['D Building 46', 101905.0, 102629.0],
    ['D Building 44', 95930.0, 96566.0],
    ['D Building 49', 89394.0, 89849.0],
    ['D Building 62', 88446.0, 89175.0],
    ['D Building 53', 22724.0, 23668.0],
    ['D Building 54', 22226.0, 22943.0],
    ['D Building 55', 24072.0, 24629.0],
    ['D Building 56', 30389.0, 31367.0],
    ['D Building 57', 30910.0, 32215.0],
    ['D Building 58', 22101.0, 22869.0],
    ['D Building 59', 23982.0, 24812.0],
    ['D Building 60', 24382.0, 25177.0],
    ['D Building 61', 28755.0, 29501.0],
    ['Actuator DB 02', 2800.0, 3190.0],
    ['Actuator DB 04', 11567.0, 11825.0],
    ['Actuator DB 03', 2000.0, 2129.0],
    ['Actuator DB 05', 213.0, 230.0],
    ['Actuator DB 06', 867.0, 912.0],
    ['Helipad', 14.0, 14.0],
    ['Actuator DB 01 (Z8)', 621.0, 635.0],
    ['Guard House', 47863.0, 48768.0],
    ['Zone-3 landscape light 21', 708.0, 762.0],
    ['Zone-3 landscape light 22', 14.0, 20.0],
    ['Irrigation Tank 03', 77588.0, 78439.0],
    ['Irrigation Tank 01', 142166.0, 144853.0],
    ['Irrigation Tank 02', 158849.0, null],
    ['Irrigation Tank 04', 9192.0, 9434.0],
    ['Lifting Station 04', 39688.0, 40564.0],
    ['Lifting Station 02', 7729.0, 7729.0],
    ['Lifting Station 05', 108984.0, 109035.0],
    ['Lifting Station 03', 10406.0, 10468.0],
    ['Pumping Station 05', 93494.0, 96705.0],
    ['Pumping Station 04', 11282.0, 12085.0],
    ['Pumping Station 03', 1706.0, 1769.0],
    ['Pumping Station 01', 81667.0, 83870.0],
    ['Street Light FP 05', 36078.0, 37616.0],
    ['Street Light FP 03', 24136.0, 26169.0],
    ['Street Light FP 02', 27623.0, 30038.0],
    ['Street Light FP 04', 29445.0, 31117.0],
    ['Street Light FP 01 (Z8)', 40009.0, 43294.0],
];

// Also add Nov-25 and Dec-25 data that may be missing
const novDecData = [
    ['Beachwell', 30159, 17344],
    ['ROP Building', 2084, 1308],
    ['Security Building', 5180, 6995],
    ['Central Park', 18028, 22191],
    ['Village Square', 4798, 4425],
    ['D Building 51', 1308, 916],
    ['D Building 45', 725, 629],
    ['D Building 48', 1060, 748],
    ['D Building 75', 1940, 1127],
    ['D Building 50', 1142, 809],
    ['D Building 74', 607, 429],
    ['D Building 47', 989, 977],
    ['D Building 52', 1300, 912],
    ['D Building 46', 1691, 1010],
    ['D Building 44', 1141, 650],
    ['D Building 49', 1137, 805],
    ['D Building 62', 1220, 722],
    ['D Building 53', 1375, 1224],
    ['D Building 54', 1030, 842],
    ['D Building 55', 1090, 751],
    ['D Building 56', 1725, 1076],
    ['D Building 57', 1515, 1498],
    ['D Building 58', 1517, 1104],
    ['D Building 59', 1193, 921],
    ['D Building 60', 1843, 1082],
    ['D Building 61', 1455, 733],
    ['Actuator DB 02', 172, 382],
    ['Actuator DB 04', 240, 255],
    ['Actuator DB 03', 141, 136],
    ['Actuator DB 05', 18, 18],
    ['Actuator DB 06', 46, 46],
    ['Helipad', 0, 0],
    ['Actuator DB 01 (Z8)', 3, 3],
    ['Guard House', 1077, 816],
    ['Zone-3 landscape light 17', 0, 0],
    ['Zone-3 landscape light 21', 67, 70],
    ['Zone-3 landscape light 22', 0, 0],
    ['Irrigation Tank 03', 1304, 851],
    ['Irrigation Tank 01', 2781, 2678],
    ['Irrigation Tank 02', 1950, 1323],
    ['Irrigation Tank 04', 796, 294],
    ['Lifting Station 04', 401, 487],
    ['Lifting Station 02', 0, 0],
    ['Lifting Station 05', 2816, 2983],
    ['Lifting Station 03', 65, 71],
    ['Pumping Station 05', 2653, 2773],
    ['Pumping Station 04', 915, 924],
    ['Pumping Station 03', 67, 68],
    ['Pumping Station 01', 2439, 2195],
    ['Bank muscat', 69, 744],
    ['CIF kitchen', 13920, 13586],
    ['OUA Store (BTU Meter)', 1242, 1948],
    ['Street Light FP 05', 1690, 1418],
    ['Street Light FP 03', 2100, 2048],
    ['Street Light FP 02', 2739, 2619],
    ['Street Light FP 04', 2092, 1653],
    ['Street Light FP 01 (Z8)', 3581, 3518],
];

async function run() {
    console.log('=== Electricity Readings Update: Nov-25, Dec-25, Jan-26, Feb-26 ===\n');

    // Step 1: Fetch all meter IDs by name
    console.log('Fetching meter list...');
    const { data: meters, error: metersError } = await supabase
        .from('electricity_meters')
        .select('id, name');

    if (metersError) {
        console.error('Error fetching meters:', metersError.message);
        return;
    }

    // Create name -> id lookup
    const meterIdMap = {};
    meters.forEach(m => { meterIdMap[m.name] = m.id; });
    console.log(`Found ${meters.length} meters.\n`);

    // Step 2: Delete existing readings for the target months
    const targetMonths = ['Nov-25', 'Dec-25', 'Jan-26', 'Feb-26'];
    console.log(`Deleting existing readings for: ${targetMonths.join(', ')}...`);
    const { error: delError } = await supabase
        .from('electricity_readings')
        .delete()
        .in('month', targetMonths);

    if (delError) {
        console.error('Delete error:', delError.message);
        return;
    }
    console.log('Deleted existing records.\n');

    // Step 3: Build all insert records
    const records = [];

    // Nov-25 and Dec-25
    for (const [name, nov, dec] of novDecData) {
        const meterId = meterIdMap[name];
        if (!meterId) {
            console.warn(`WARNING: Meter "${name}" not found in database, skipping.`);
            continue;
        }
        if (nov !== null && nov !== undefined) {
            records.push({ meter_id: meterId, month: 'Nov-25', consumption: nov });
        }
        if (dec !== null && dec !== undefined) {
            records.push({ meter_id: meterId, month: 'Dec-25', consumption: dec });
        }
    }

    // Jan-26 and Feb-26
    for (const [name, jan, feb] of meterData) {
        const meterId = meterIdMap[name];
        if (!meterId) {
            console.warn(`WARNING: Meter "${name}" not found in database, skipping.`);
            continue;
        }
        if (jan !== null && jan !== undefined) {
            records.push({ meter_id: meterId, month: 'Jan-26', consumption: jan });
        }
        if (feb !== null && feb !== undefined) {
            records.push({ meter_id: meterId, month: 'Feb-26', consumption: feb });
        }
    }

    console.log(`Inserting ${records.length} readings...`);

    // Insert in batches of 200 to avoid payload limits
    const batchSize = 200;
    let inserted = 0;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error: insError } = await supabase
            .from('electricity_readings')
            .insert(batch);

        if (insError) {
            console.error(`Insert error on batch ${Math.floor(i / batchSize) + 1}:`, insError.message);
            return;
        }
        inserted += batch.length;
        console.log(`  Batch ${Math.floor(i / batchSize) + 1}: inserted ${batch.length} records (total: ${inserted})`);
    }

    console.log(`\n✅ Successfully inserted ${inserted} readings for Nov-25, Dec-25, Jan-26, Feb-26!`);

    // Step 4: Verify
    const { data: verifyData, error: verifyError } = await supabase
        .from('electricity_readings')
        .select('month')
        .in('month', targetMonths);

    if (!verifyError && verifyData) {
        const counts = {};
        verifyData.forEach(r => { counts[r.month] = (counts[r.month] || 0) + 1; });
        console.log('\nVerification:');
        for (const m of targetMonths) {
            console.log(`  ${m}: ${counts[m] || 0} readings`);
        }
    }
}

run().catch(console.error);
