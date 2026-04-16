#!/usr/bin/env node
/**
 * Delete ALL rows from Assets_Register_Database table.
 * Uses service_role key to bypass RLS.
 *
 * The table has Realtime enabled but no replica identity, which blocks
 * normal DELETE operations. This script works around that by:
 *   1. Removing the table from the Realtime publication
 *   2. Deleting all rows
 *   3. Re-adding the table to the Realtime publication
 *
 * All done via Supabase's rpc('exec_sql') or direct REST calls.
 *
 * Usage: node scripts/delete-all-assets.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = 'Assets_Register_Database';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helper: run raw SQL via Supabase Management API ──
async function runSQL(sql) {
    // Extract project ref from URL: https://<ref>.supabase.co
    const ref = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (!ref) throw new Error('Could not extract project ref from URL: ' + SUPABASE_URL);

    const mgmtUrl = `https://api.supabase.com/v1/projects/${ref}/database/query`;

    const res = await fetch(mgmtUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + SUPABASE_KEY,
        },
        body: JSON.stringify({ query: sql }),
    });

    if (!res.ok) {
        const text = await res.text();
        return { ok: false, status: res.status, body: text };
    }

    const data = await res.json();
    return { ok: true, data };
}

async function main() {
    console.log('='.repeat(55));
    console.log('  DELETE ALL ASSETS');
    console.log('  Table: ' + TABLE);
    console.log('='.repeat(55));

    // Step 1: Count existing rows
    console.log('\n[1/3] Counting existing rows...');
    const { count: beforeCount, error: countError } = await supabase
        .from(TABLE)
        .select('Asset_UID', { count: 'exact', head: true });

    if (countError) {
        console.error('  COUNT failed:', countError.message);
        process.exit(1);
    }
    console.log('  Current row count: ' + beforeCount);

    if (beforeCount === 0) {
        console.log('\n  Table is already empty. Nothing to delete.');
        return;
    }

    // Step 2: Try multiple deletion strategies
    console.log('\n[2/3] Deleting all rows...');

    // Strategy A: Try TRUNCATE via Management API
    console.log('  Trying TRUNCATE via Management API...');
    const truncResult = await runSQL('TRUNCATE TABLE public."' + TABLE + '";');

    if (truncResult.ok) {
        console.log('  TRUNCATE succeeded via Management API.');
    } else {
        console.log('  Management API returned ' + truncResult.status + '. Trying next strategy...');

        // Strategy B: Drop from publication, delete, re-add
        console.log('  Trying: drop from publication -> delete -> re-add...');

        // Drop from realtime publication
        const dropPubResult = await runSQL(
            'ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public."' + TABLE + '";'
        );
        if (dropPubResult.ok) {
            console.log('  Dropped table from supabase_realtime publication.');
        } else {
            console.log('  Could not drop from publication: ' + dropPubResult.body);
        }

        // Now try the delete via PostgREST
        const { error: deleteError } = await supabase
            .from(TABLE)
            .delete()
            .neq('Asset_UID', '__never_match__');

        if (deleteError) {
            console.log('  PostgREST DELETE still failed: ' + deleteError.message);

            // Strategy C: Set replica identity to FULL, delete, reset
            console.log('  Trying: set REPLICA IDENTITY FULL -> delete...');
            const riResult = await runSQL(
                'ALTER TABLE public."' + TABLE + '" REPLICA IDENTITY FULL;'
            );
            if (riResult.ok) {
                console.log('  Set REPLICA IDENTITY FULL.');
                const { error: deleteError2 } = await supabase
                    .from(TABLE)
                    .delete()
                    .neq('Asset_UID', '__never_match__');

                if (deleteError2) {
                    console.error('  DELETE still failed after REPLICA IDENTITY change: ' + deleteError2.message);
                    console.log('\n  =============================================');
                    console.log('  MANUAL ACTION REQUIRED');
                    console.log('  =============================================');
                    console.log('  Please run this SQL in the Supabase Dashboard SQL Editor:');
                    console.log('');
                    console.log('    TRUNCATE TABLE public."Assets_Register_Database";');
                    console.log('');
                    process.exit(1);
                } else {
                    console.log('  DELETE succeeded after setting REPLICA IDENTITY FULL.');
                }
            } else {
                console.log('  Could not set replica identity: ' + riResult.body);
                console.log('\n  =============================================');
                console.log('  MANUAL ACTION REQUIRED');
                console.log('  =============================================');
                console.log('  Please run this SQL in the Supabase Dashboard SQL Editor:');
                console.log('');
                console.log('    TRUNCATE TABLE public."Assets_Register_Database";');
                console.log('');
                process.exit(1);
            }
        } else {
            console.log('  DELETE succeeded after dropping from publication.');

            // Re-add to publication
            const addPubResult = await runSQL(
                'ALTER PUBLICATION supabase_realtime ADD TABLE public."' + TABLE + '";'
            );
            if (addPubResult.ok) {
                console.log('  Re-added table to supabase_realtime publication.');
            } else {
                console.log('  Note: Could not re-add to publication. You may need to re-enable Realtime manually.');
            }
        }
    }

    // Step 3: Verify
    console.log('\n[3/3] Verifying deletion...');
    const { count: afterCount, error: verifyError } = await supabase
        .from(TABLE)
        .select('Asset_UID', { count: 'exact', head: true });

    if (verifyError) {
        console.error('  Verification failed:', verifyError.message);
        process.exit(1);
    }

    console.log('  Rows remaining: ' + afterCount);

    if (afterCount === 0) {
        console.log('\n  SUCCESS: All ' + beforeCount + ' rows deleted. Table is now empty.');
    } else {
        console.error('\n  WARNING: ' + afterCount + ' rows still remain (deleted ' + (beforeCount - afterCount) + ').');
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
