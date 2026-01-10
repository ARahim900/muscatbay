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

function toIso(dateStr) {
    if (!dateStr) return null;
    // Expecting formats like 1/1/2026 or 2026-01-01
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('/').map(p => p.trim());
    if (parts.length === 3) {
        // m/d/yyyy or mm/dd/yyyy
        const [m, d, y] = parts;
        return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return null;
}

const rows = [
    {
        contractor: 'KONE Assarain LLC',
        service: 'Lift Maintenance Services',
        status: 'Active',
        contract_type: 'Contract',
        start_date: '1/1/2026',
        end_date: '12/31/2027',
        monthly: '962.50',
        annual_value: '11550'
    },
    {
        contractor: 'Oman Water Treatment Company (OWATCO)',
        service: 'Comprehensive STP Operation and Maintenance',
        status: 'Active',
        contract_type: 'Contract',
        start_date: '1/26/2024',
        end_date: '1/25/2029',
        monthly: '3103.8',
        annual_value: '37245.4'
    },
    {
        contractor: 'Kalhat',
        service: 'Facility Management (FM)',
        status: 'Active',
        contract_type: 'Contract',
        start_date: '5/7/2024',
        end_date: '5/6/2030',
        monthly: '32200.8',
        annual_value: '386409.718'
    },
    {
        contractor: 'Future Cities S.A.O.C (Tadoom)',
        service: 'Supply and Installation of Smart Water Meters, Billing for Water Consumption',
        status: 'Active',
        contract_type: 'Contract',
        start_date: '9/24/2024',
        end_date: '9/23/2032',
        monthly: '2.7 per meter',
        annual_value: '184.3'
    },
    {
        contractor: 'Muna Noor International LLC',
        service: 'Pest Control Services',
        status: 'Active',
        contract_type: 'Contract',
        start_date: '7/1/2024',
        end_date: '6/30/2026',
        monthly: '1400',
        annual_value: '16000'
    },
    {
        contractor: 'Gulf Expert',
        service: 'Chillers, BMS & Pressurisation Units',
        status: 'Active',
        contract_type: 'Contract',
        start_date: '6/3/2025',
        end_date: '6/2/2026',
        monthly: '603',
        annual_value: '7234.5'
    },
    {
        contractor: 'Bahwan Engineering Company LLC',
        service: 'Maintenance of Fire Alarm & Fire Fighting Equipment',
        status: 'Active',
        contract_type: 'Contract',
        start_date: '11/1/2025',
        end_date: '10/31/2027',
        monthly: '634.38',
        annual_value: '7612.5'
    },
    {
        contractor: 'Gulf Expert',
        service: 'BMS AMC FM & Staff Accommodation',
        status: 'Active',
        contract_type: 'Contract',
        start_date: '6/3/2025',
        end_date: '6/2/2026',
        monthly: '2205',
        annual_value: '26460'
    },
    {
        contractor: 'National Marine Services LLC',
        service: 'Diving Services',
        status: 'Active',
        contract_type: 'PO',
        start_date: '11/6/2024',
        end_date: '11/5/2026',
        monthly: '4757.76',
        annual_value: '57093.12'
    },
    {
        contractor: 'Muscat Electronics LLC',
        service: 'Daikin AC at Sale Center',
        status: 'Active',
        contract_type: 'PO',
        start_date: '6/3/2025',
        end_date: '6/2/2026',
        monthly: '871.82',
        annual_value: '10461.84'
    },
    {
        contractor: 'Iron Mountain / ARAMEX',
        service: 'Offsite Record Storage',
        status: 'Active',
        contract_type: 'Contract',
        start_date: '1/1/2025',
        end_date: '12/31/2025',
        monthly: null,
        annual_value: null
    },
    {
        contractor: 'Al Khalili',
        service: 'CCTV Contract',
        status: 'Active',
        contract_type: 'Contract',
        start_date: '9/1/2025',
        end_date: '8/31/2030',
        monthly: '1166.31',
        annual_value: '13995.66'
    },
    // Expired / Not renewing entries
    {
        contractor: 'Celar Water',
        service: 'Comprehensive STP Operation and Maintenance',
        status: 'Expired',
        contract_type: 'Contract',
        start_date: '1/16/2021',
        end_date: '1/15/2025',
        monthly: '4439',
        annual_value: null
    },
    {
        contractor: 'Advanced Technology and Projects Company',
        service: 'BMS Non-Comprehensive Annual Maintenance',
        status: 'Expired',
        contract_type: 'PO',
        start_date: '3/26/2023',
        end_date: '3/25/2024',
        monthly: '3800',
        annual_value: '3800'
    },
    {
        contractor: 'Al Naba Services LLC',
        service: 'Garbage Removal Services',
        status: 'Expired',
        contract_type: 'Contract',
        start_date: '4/2/2023',
        end_date: '4/1/2024',
        monthly: '32',
        annual_value: null
    },
    {
        contractor: 'Oman Pumps Manufacturing Co.',
        service: 'Supply, Installation, and Commissioning of Pumps',
        status: 'Expired',
        contract_type: 'Contract',
        start_date: '2/23/2020',
        end_date: '7/22/2025',
        monthly: null,
        annual_value: '37800'
    },
    {
        contractor: 'Rimal Global',
        service: 'Provision of Services',
        status: 'Expired',
        contract_type: 'Contract',
        start_date: '11/22/2021',
        end_date: '11/21/2031',
        monthly: null,
        annual_value: '51633'
    },
    {
        contractor: 'COMO',
        service: 'Facility Management (FM)',
        status: 'Expired',
        contract_type: 'Contract',
        start_date: '3/1/2022',
        end_date: '2/28/2025',
        monthly: '44382',
        annual_value: null
    },
    {
        contractor: 'Muscat Electronics LLC',
        service: 'Daikin AC Chillers (Sale Center) Maintenance Services',
        status: 'Expired',
        contract_type: 'Contract',
        start_date: '3/26/2023',
        end_date: '4/25/2024',
        monthly: '199.5',
        annual_value: null
    },
    {
        contractor: 'Uni Gaz',
        service: 'Gas Refilling for Flame Operation at Muscat Bay Main Entrance',
        status: 'Expired',
        contract_type: 'PO',
        start_date: null,
        end_date: null,
        monthly: null,
        annual_value: null
    },
    {
        contractor: 'Genetco',
        service: 'York AC Chillers (Zone 01) Maintenance Services',
        status: 'Expired',
        contract_type: 'Contract',
        start_date: null,
        end_date: null,
        monthly: null,
        annual_value: null
    }
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

        let insertedContracts = 0;
        let insertedExpiry = 0;
        let insertedPricing = 0;

        for (const r of rows) {
            const contractPayload = {
                name: r.contractor,
                company: r.contractor.includes('(') ? r.contractor : r.contractor,
                category: r.service || 'General',
                status: r.status || 'Active',
                start_date: toIso(r.start_date)
            };

            const { data: contractData, error: contractError } = await supabase.from('amc_contracts').insert(contractPayload).select('id').limit(1).single();
            if (contractError) {
                console.error('Failed to insert contract', r.contractor, '-', contractError.message || contractError.code || contractError);
                continue;
            }
            insertedContracts++;
            const contractId = contractData.id;

            // expiry
            if (r.end_date) {
                const expiryPayload = {
                    contract_id: contractId,
                    expiry_date: toIso(r.end_date),
                    notification_sent: false
                };
                const { error: expiryError } = await supabase.from('amc_expiry').insert(expiryPayload);
                if (expiryError) {
                    console.error('Failed to insert expiry for', r.contractor, '-', expiryError.message || expiryError.code || expiryError);
                } else {
                    insertedExpiry++;
                }
            }

            // pricing - if numeric annual_value
            const av = r.annual_value;
            const numeric = av && !isNaN(Number(String(av).replace(/[,\s]/g, '')));
            if (numeric) {
                const val = Number(String(av).replace(/[,\s]/g, ''));
                const pricingPayload = {
                    contract_id: contractId,
                    contract_value: val,
                    currency: 'OMR',
                    payment_terms: null
                };
                const { error: pricingError } = await supabase.from('amc_pricing').insert(pricingPayload);
                if (pricingError) {
                    console.error('Failed to insert pricing for', r.contractor, '-', pricingError.message || pricingError.code || pricingError);
                } else {
                    insertedPricing++;
                }
            }
        }

        console.log('\nInserted contracts:', insertedContracts);
        console.log('Inserted expiry rows:', insertedExpiry);
        console.log('Inserted pricing rows:', insertedPricing);

        process.exit(0);
    } catch (err) {
        console.error('Unexpected error:', err && err.message ? err.message : err);
        process.exit(1);
    }
})();
