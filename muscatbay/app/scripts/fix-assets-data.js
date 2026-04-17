#!/usr/bin/env node
/**
 * fix-assets-data.js
 *
 * Fixes three data-quality issues in Assets_Register_Database:
 *   1. Computes Current_Age_Years from Install_Year where missing
 *   2. Computes ERL_Years from Life_Expectancy_Years - Current_Age_Years where missing
 *   3. Normalises Is_Asset_Active 'Yes' → 'Y'
 *
 * Run: node scripts/fix-assets-data.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const TABLE = 'Assets_Register_Database';
const CURRENT_YEAR = new Date().getFullYear();
const PAGE_SIZE = 500;

async function fetchAll() {
    let all = [];
    let from = 0;
    while (true) {
        const { data, error } = await supabase
            .from(TABLE)
            .select('Asset_UID, Install_Year, Life_Expectancy_Years, Current_Age_Years, ERL_Years, Is_Asset_Active')
            .range(from, from + PAGE_SIZE - 1);
        if (error) throw new Error(`Fetch failed: ${error.message}`);
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }
    return all;
}

async function main() {
    console.log('Fetching all assets...');
    const rows = await fetchAll();
    console.log(`Fetched ${rows.length} rows.`);

    const toUpdate = [];
    let ageFixed = 0, erlFixed = 0, activeFixed = 0;

    for (const row of rows) {
        const patch = { Asset_UID: row.Asset_UID };
        let changed = false;

        // 1. Compute Current_Age_Years
        const installYear = row.Install_Year ? Number(row.Install_Year) : null;
        const currentAge = installYear ? CURRENT_YEAR - installYear : null;
        if (currentAge !== null && (row.Current_Age_Years === null || row.Current_Age_Years === undefined)) {
            patch.Current_Age_Years = currentAge;
            ageFixed++;
            changed = true;
        }

        // 2. Compute ERL_Years
        const lifeExp = row.Life_Expectancy_Years ?? null;
        const ageForErl = (patch.Current_Age_Years !== undefined ? patch.Current_Age_Years : row.Current_Age_Years) ?? null;
        if (row.ERL_Years === null || row.ERL_Years === undefined) {
            if (lifeExp !== null && ageForErl !== null) {
                patch.ERL_Years = Math.max(0, lifeExp - ageForErl);
                erlFixed++;
                changed = true;
            }
        }

        // 3. Normalise Is_Asset_Active 'Yes' → 'Y'
        if ((row.Is_Asset_Active || '').trim().toLowerCase() === 'yes') {
            patch.Is_Asset_Active = 'Y';
            activeFixed++;
            changed = true;
        }

        if (changed) toUpdate.push(patch);
    }

    console.log(`\nRows to update: ${toUpdate.length}`);
    console.log(`  Current_Age_Years filled: ${ageFixed}`);
    console.log(`  ERL_Years filled:         ${erlFixed}`);
    console.log(`  Is_Asset_Active fixed:    ${activeFixed}`);

    if (toUpdate.length === 0) {
        console.log('\nNothing to update. DB is already clean.');
        return;
    }

    // Concurrent PATCH via PostgREST (no unique constraint needed)
    const CONCURRENCY = 25;
    let done = 0;
    const errors = [];

    for (let i = 0; i < toUpdate.length; i += CONCURRENCY) {
        const slice = toUpdate.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(
            slice.map(patch => {
                const { Asset_UID, ...fields } = patch;
                return supabase
                    .from(TABLE)
                    .update(fields)
                    .eq('Asset_UID', Asset_UID);
            })
        );
        results.forEach((r, j) => {
            if (r.status === 'rejected' || r.value?.error) {
                errors.push(`Row ${i + j}: ${r.reason?.message || r.value?.error?.message}`);
            }
        });
        done += slice.length;
        process.stdout.write(`  Updated ${done}/${toUpdate.length}\r`);
    }

    if (errors.length > 0) {
        console.error(`\nWarning: ${errors.length} errors:`);
        errors.slice(0, 5).forEach(e => console.error(' ', e));
    }
    console.log(`\nDone. ${toUpdate.length} rows updated, ${errors.length} errors.`);
}

main().catch(err => { console.error(err); process.exit(1); });
