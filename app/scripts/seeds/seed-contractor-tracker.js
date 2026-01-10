const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function readEnv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    const env = {};
    for (const line of lines) {
        const m = line.match(/^\s*([^=]+)=([\s\S]*)$/);
        if (m) env[m[1].trim()] = m[2].trim();
    }
    return env;
}

const rows = [
    { 'Contractor': 'KONE Assarain LLC', 'Service Provided': 'Lift Maintenance Services', Status: 'Active', 'Contract Type': 'Contract', 'Start Date': '1/1/2026', 'End Date': '12/31/2027', 'Contract (OMR)/Month': '962.50 OMR', 'Contract Total (OMR)/Year': '11,550 OMR (Inc VAT)', 'Annual Value (OMR)': 11550, 'Renewal Plan': '', Note: 'New 2-year KONE Care AMC; existing T&C comments captured separately.' },
    { 'Contractor': 'Oman Water Treatment Company (OWATCO)', 'Service Provided': 'Comprehensive STP Operation and Maintenance', Status: 'Active', 'Contract Type': 'Contract', 'Start Date': '1/26/2024', 'End Date': '1/25/2029', 'Contract (OMR)/Month': '3,103.8 OMR', 'Contract Total (OMR)/Year': '37,245.4 OMR (Inc VAT)', 'Annual Value (OMR)': 37245.4, 'Renewal Plan': '', Note: 'New contract due to early termination of previous contract with Celar Company' },
    { 'Contractor': 'Kalhat', 'Service Provided': 'Facility Management (FM)', Status: 'Active', 'Contract Type': 'Contract', 'Start Date': '5/7/2024', 'End Date': '5/6/2030', 'Contract (OMR)/Month': '32,200.8 OMR', 'Contract Total (OMR)/Year': '386,409.718 OMR (Inc VAT)', 'Annual Value (OMR)': 386409.718, 'Renewal Plan': '', Note: 'New contract overlapping with COMO' },
    { 'Contractor': 'Future Cities S.A.O.C (Tadoom)', 'Service Provided': 'Supply and Installation of Smart Water Meters, Billing for Water Consumption', Status: 'Active', 'Contract Type': 'Contract', 'Start Date': '9/24/2024', 'End Date': '9/23/2032', 'Contract (OMR)/Month': '2.7 OMR per meter collection', 'Contract Total (OMR)/Year': '184.3 OMR', 'Annual Value (OMR)': 184.3, 'Renewal Plan': '', Note: 'New contract replacing OIFC' },
    { 'Contractor': 'Muna Noor International LLC', 'Service Provided': 'Pest Control Services', Status: 'Active', 'Contract Type': 'Contract', 'Start Date': '7/1/2024', 'End Date': '6/30/2026', 'Contract (OMR)/Month': '1,400 OMR (Inc VAT)', 'Contract Total (OMR)/Year': '16,000 OMR (Inc VAT)', 'Annual Value (OMR)': 16000, 'Renewal Plan': '', Note: '' },
    { 'Contractor': 'Gulf Expert', 'Service Provided': 'Chillers, BMS & Pressurisation Units', Status: 'Active', 'Contract Type': 'Contract', 'Start Date': '6/3/2025', 'End Date': '6/2/2026', 'Contract (OMR)/Month': '603 OMR', 'Contract Total (OMR)/Year': '7,234.500 OMR', 'Annual Value (OMR)': 7234.5, 'Renewal Plan': '', Note: '' },
    { 'Contractor': 'Bahwan Engineering Company LLC', 'Service Provided': 'Maintenance of Fire Alarm & Fire Fighting Equipment', Status: 'Active', 'Contract Type': 'Contract', 'Start Date': '11/1/2025', 'End Date': '10/31/2027', 'Contract (OMR)/Month': '634.38 OMR', 'Contract Total (OMR)/Year': '7,612.5 OMR (Inc VAT)', 'Annual Value (OMR)': 7612.5, 'Renewal Plan': '', Note: 'New 2-year contract for fire alarm & fire-fighting systems' },
    { 'Contractor': 'Gulf Expert', 'Service Provided': 'BMS AMC FM & Staff Accommodation', Status: 'Active', 'Contract Type': 'Contract', 'Start Date': '6/3/2025', 'End Date': '6/2/2026', 'Contract (OMR)/Month': '2,205.00 OMR', 'Contract Total (OMR)/Year': '26,460.00 OMR', 'Annual Value (OMR)': 26460, 'Renewal Plan': '', Note: '' },
    { 'Contractor': 'National Marine Services LLC', 'Service Provided': 'Diving Services', Status: 'Active', 'Contract Type': 'PO', 'Start Date': '11/6/2024', 'End Date': '11/5/2026', 'Contract (OMR)/Month': '4,757.76 OMR', 'Contract Total (OMR)/Year': '57,093.12 OMR', 'Annual Value (OMR)': 57093.12, 'Renewal Plan': '', Note: '' },
    { 'Contractor': 'Muscat Electronics LLC', 'Service Provided': 'Daikin AC at Sale Center', Status: 'Active', 'Contract Type': 'PO', 'Start Date': '6/3/2025', 'End Date': '6/2/2026', 'Contract (OMR)/Month': '871.82 OMR', 'Contract Total (OMR)/Year': '10,461.84 OMR', 'Annual Value (OMR)': 10461.84, 'Renewal Plan': '', Note: '' },
    { 'Contractor': 'Iron Mountain / ARAMEX', 'Service Provided': 'Offsite Record Storage', Status: 'Active', 'Contract Type': 'Contract', 'Start Date': '1/1/2025', 'End Date': '12/31/2025', 'Contract (OMR)/Month': 'Schedule of rates', 'Contract Total (OMR)/Year': 'Schedule of rates', 'Annual Value (OMR)': null, 'Renewal Plan': '', Note: 'Charges as per rate schedule (per box / retrieval, etc.)' },
    { 'Contractor': 'Al Khalili', 'Service Provided': 'CCTV Contract', Status: 'Active', 'Contract Type': 'Contract', 'Start Date': '9/1/2025', 'End Date': '8/31/2030', 'Contract (OMR)/Month': '1,166.31 OMR', 'Contract Total (OMR)/Year': '13,995.66 OMR', 'Annual Value (OMR)': 13995.66, 'Renewal Plan': '', Note: '5-year contract – total value 69,978.30 OMR over contract period.' },
    { 'Contractor': 'Celar Water', 'Service Provided': 'Comprehensive STP Operation and Maintenance', Status: 'Expired', 'Contract Type': 'Contract', 'Start Date': '1/16/2021', 'End Date': '1/15/2025', 'Contract (OMR)/Month': '4,439 OMR /Month', 'Contract Total (OMR)/Year': null, 'Annual Value (OMR)': null, 'Renewal Plan': 'Not Renewing – Service covered by other vendor', Note: 'Transitioned to OWATCO before contract end' },
    { 'Contractor': 'Advanced Technology and Projects Company', 'Service Provided': 'BMS Non-Comprehensive Annual Maintenance', Status: 'Expired', 'Contract Type': 'PO', 'Start Date': '3/26/2023', 'End Date': '3/25/2024', 'Contract (OMR)/Month': '3,800 OMR /Year', 'Contract Total (OMR)/Year': '3,800 OMR', 'Annual Value (OMR)': 3800, 'Renewal Plan': 'Not Renewing – Service covered by other vendor', Note: '' },
    { 'Contractor': 'Al Naba Services LLC', 'Service Provided': 'Garbage Removal Services', Status: 'Expired', 'Contract Type': 'Contract', 'Start Date': '4/2/2023', 'End Date': '4/1/2024', 'Contract (OMR)/Month': '32 OMR /skip trip', 'Contract Total (OMR)/Year': null, 'Annual Value (OMR)': null, 'Renewal Plan': 'Not Renewing – Service covered by other vendor', Note: '' },
    { 'Contractor': 'Oman Pumps Manufacturing Co.', 'Service Provided': 'Supply, Installation, and Commissioning of Pumps', Status: 'Expired', 'Contract Type': 'Contract', 'Start Date': '2/23/2020', 'End Date': '7/22/2025', 'Contract (OMR)/Month': '37,800 OMR on delivery', 'Contract Total (OMR)/Year': '37,800 OMR', 'Annual Value (OMR)': 37800, 'Renewal Plan': 'Not Renewing – Service covered by other vendor', Note: 'One-time delivery contract' },
    { 'Contractor': 'Rimal Global', 'Service Provided': 'Provision of Services', Status: 'Expired', 'Contract Type': 'Contract', 'Start Date': '11/22/2021', 'End Date': '11/21/2031', 'Contract (OMR)/Month': '51,633 OMR on delivery', 'Contract Total (OMR)/Year': '51,633 OMR', 'Annual Value (OMR)': 51633, 'Renewal Plan': 'Not Renewing – Service covered by other vendor', Note: 'One-time provision of services (long validity)' },
    { 'Contractor': 'COMO', 'Service Provided': 'Facility Management (FM)', Status: 'Expired', 'Contract Type': 'Contract', 'Start Date': '3/1/2022', 'End Date': '2/28/2025', 'Contract (OMR)/Month': '44,382 OMR /Month', 'Contract Total (OMR)/Year': null, 'Annual Value (OMR)': null, 'Renewal Plan': 'Not Renewing – Service covered by other vendor', Note: 'Transitioned to Kalhat before contract end' },
    { 'Contractor': 'Muscat Electronics LLC', 'Service Provided': 'Daikin AC Chillers (Sale Center) Maintenance Services', Status: 'Expired', 'Contract Type': 'Contract', 'Start Date': '3/26/2023', 'End Date': '4/25/2024', 'Contract (OMR)/Month': '199.5 OMR /service quarter', 'Contract Total (OMR)/Year': null, 'Annual Value (OMR)': null, 'Renewal Plan': 'Not Renewing – Service covered by other vendor', Note: 'Nearing expiration; reviewed for renewal' },
    { 'Contractor': 'Uni Gaz', 'Service Provided': 'Gas Refilling for Flame Operation at Muscat Bay Main Entrance', Status: 'Expired', 'Contract Type': 'PO', 'Start Date': null, 'End Date': null, 'Contract (OMR)/Month': null, 'Contract Total (OMR)/Year': null, 'Annual Value (OMR)': null, 'Renewal Plan': 'Not Renewing – Service covered by other vendor', Note: 'Details to be confirmed/updated' },
    { 'Contractor': 'Genetco', 'Service Provided': 'York AC Chillers (Zone 01) Maintenance Services', Status: 'Expired', 'Contract Type': 'Contract', 'Start Date': null, 'End Date': null, 'Contract (OMR)/Month': null, 'Contract Total (OMR)/Year': null, 'Annual Value (OMR)': null, 'Renewal Plan': 'Not Renewing – Service covered by other vendor', Note: 'Details to be confirmed/updated' }
];

(async function main() {
    try {
        const envPath = path.resolve(__dirname, '..', '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('.env.local not found at', envPath);
            process.exit(2);
        }
        const env = readEnv(envPath);
        const url = env.NEXT_PUBLIC_SUPABASE_URL;
        const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) {
            console.error('Supabase URL or anon key missing in .env.local');
            process.exit(2);
        }

        console.log('Connecting to Supabase:', url);
        const supabase = createClient(url, key);

        // Insert rows in batches to avoid very long single requests
        const batchSize = 10;
        let inserted = 0;
        for (let i = 0; i < rows.length; i += batchSize) {
            const chunk = rows.slice(i, i + batchSize);
            const { data, error } = await supabase.from('Contractor_Tracker').insert(chunk);
            if (error) {
                console.error('Insert error for chunk starting at', i, '-', error.message || error.code || error);
            } else {
                inserted += (data || []).length;
                console.log('Inserted chunk, rows:', (data || []).length);
            }
        }

        console.log('\nTotal inserted:', inserted);
        process.exit(0);
    } catch (err) {
        console.error('Unexpected error:', err && err.message ? err.message : err);
        process.exit(1);
    }
})();
