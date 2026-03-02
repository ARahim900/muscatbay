const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
    console.error('Error reading .env.local');
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing setup credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const records = [
        { date: '2026-02-01', tanker_trips: 13, inlet_sewage: 692, tse_for_irrigation: 565, generated_income: 59, water_savings: 745.8, total_impact: 804.8 },
        { date: '2026-02-02', tanker_trips: 9, inlet_sewage: 538, tse_for_irrigation: 562, generated_income: 41, water_savings: 741.84, total_impact: 782.84 },
        { date: '2026-02-03', tanker_trips: 12, inlet_sewage: 619, tse_for_irrigation: 550, generated_income: 54, water_savings: 726.0, total_impact: 780.0 },
        { date: '2026-02-05', tanker_trips: 17, inlet_sewage: 605, tse_for_irrigation: 596, generated_income: 77, water_savings: 786.72, total_impact: 863.72 },
        { date: '2026-02-06', tanker_trips: 13, inlet_sewage: 685, tse_for_irrigation: 619, generated_income: 59, water_savings: 817.08, total_impact: 876.08 },
        { date: '2026-02-07', tanker_trips: 14, inlet_sewage: 630, tse_for_irrigation: 614, generated_income: 63, water_savings: 810.48, total_impact: 873.48 },
        { date: '2026-02-08', tanker_trips: 14, inlet_sewage: 632, tse_for_irrigation: 614, generated_income: 63, water_savings: 810.48, total_impact: 873.48 },
        { date: '2026-02-09', tanker_trips: 17, inlet_sewage: 634, tse_for_irrigation: 632, generated_income: 77, water_savings: 834.24, total_impact: 911.24 },
        { date: '2026-02-10', tanker_trips: 16, inlet_sewage: 663, tse_for_irrigation: 620, generated_income: 72, water_savings: 818.4, total_impact: 890.4 },
        { date: '2026-02-11', tanker_trips: 16, inlet_sewage: 654, tse_for_irrigation: 607, generated_income: 72, water_savings: 801.24, total_impact: 873.24 },
        { date: '2026-02-12', tanker_trips: 16, inlet_sewage: 621, tse_for_irrigation: 612, generated_income: 72, water_savings: 807.84, total_impact: 879.84 },
        { date: '2026-02-13', tanker_trips: 11, inlet_sewage: 562, tse_for_irrigation: 597, generated_income: 50, water_savings: 788.04, total_impact: 838.04 },
        { date: '2026-02-14', tanker_trips: 16, inlet_sewage: 770, tse_for_irrigation: 626, generated_income: 72, water_savings: 826.32, total_impact: 898.32 },
        { date: '2026-02-15', tanker_trips: 18, inlet_sewage: 709, tse_for_irrigation: 616, generated_income: 81, water_savings: 813.12, total_impact: 894.12 },
        { date: '2026-02-16', tanker_trips: 13, inlet_sewage: 658, tse_for_irrigation: 640, generated_income: 59, water_savings: 844.8, total_impact: 903.8 },
        { date: '2026-02-17', tanker_trips: 14, inlet_sewage: 582, tse_for_irrigation: 525, generated_income: 63, water_savings: 693.0, total_impact: 756.0 },
        { date: '2026-02-18', tanker_trips: 5, inlet_sewage: 550, tse_for_irrigation: 562, generated_income: 23, water_savings: 741.84, total_impact: 764.84 },
        { date: '2026-02-19', tanker_trips: 12, inlet_sewage: 555, tse_for_irrigation: 656, generated_income: 54, water_savings: 865.92, total_impact: 919.92 },
        { date: '2026-02-20', tanker_trips: 6, inlet_sewage: 436, tse_for_irrigation: 394, generated_income: 27, water_savings: 520.08, total_impact: 547.08 },
        { date: '2026-02-21', tanker_trips: 10, inlet_sewage: 551, tse_for_irrigation: 534, generated_income: 45, water_savings: 704.88, total_impact: 749.88 },
        { date: '2026-02-22', tanker_trips: 12, inlet_sewage: 544, tse_for_irrigation: 539, generated_income: 54, water_savings: 711.48, total_impact: 765.48 },
        { date: '2026-02-23', tanker_trips: 11, inlet_sewage: 614, tse_for_irrigation: 496, generated_income: 50, water_savings: 654.72, total_impact: 704.72 },
        { date: '2026-02-24', tanker_trips: 7, inlet_sewage: 509, tse_for_irrigation: 484, generated_income: 32, water_savings: 638.88, total_impact: 670.88 },
        { date: '2026-02-25', tanker_trips: 11, inlet_sewage: 629, tse_for_irrigation: 522, generated_income: 50, water_savings: 689.04, total_impact: 739.04 },
        { date: '2026-02-26', tanker_trips: 10, inlet_sewage: 576, tse_for_irrigation: 502, generated_income: 45, water_savings: 662.64, total_impact: 707.64 },
        { date: '2026-02-27', tanker_trips: 10, inlet_sewage: 530, tse_for_irrigation: 598, generated_income: 45, water_savings: 789.36, total_impact: 834.36 },
    ];

    // First delete any existing rows for Feb to replace them
    console.log('Deleting existing February records...');
    const { error: delError } = await supabase.from('stp_operations').delete().gte('date', '2026-02-01').lte('date', '2026-02-28');
    if (delError) {
        console.error('Delete error', delError);
        return;
    }

    console.log('Inserting ' + records.length + ' records...');
    const { data, error } = await supabase.from('stp_operations').insert(records);
    if (error) {
        console.error('Insert error', error.message);
        return;
    }
    console.log('Done inserting!');
}

run();
