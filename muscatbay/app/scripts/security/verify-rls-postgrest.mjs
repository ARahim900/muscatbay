import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const PRODUCTION_PROJECT_REF = "utnlgeuqajmwibqmdmgt";
const required = [
    "RLS_TEST_SUPABASE_URL",
    "RLS_TEST_EXPECTED_PROJECT_REF",
    "RLS_TEST_ANON_KEY",
    "RLS_TEST_VIEWER_EMAIL",
    "RLS_TEST_VIEWER_PASSWORD",
    "RLS_TEST_CONTRACTOR_EMAIL",
    "RLS_TEST_CONTRACTOR_PASSWORD",
    "RLS_TEST_ADMIN_EMAIL",
    "RLS_TEST_ADMIN_PASSWORD",
    "RLS_TEST_TABLE",
    "RLS_TEST_ID_COLUMN",
    "RLS_TEST_MUTABLE_COLUMN",
    "RLS_TEST_INSERT_TEMPLATE_JSON",
];

function stop(message) {
    console.error(`[RLS test] ${message}`);
    process.exit(1);
}

if (process.env.RLS_TEST_CONFIRM_STAGING !== "YES") {
    stop("Set RLS_TEST_CONFIRM_STAGING=YES after confirming the target is disposable staging.");
}

for (const name of required) {
    if (!process.env[name]) stop(`Missing required environment variable: ${name}`);
}

const supabaseUrl = process.env.RLS_TEST_SUPABASE_URL;
const expectedProjectRef = process.env.RLS_TEST_EXPECTED_PROJECT_REF;
const targetHost = new URL(supabaseUrl).hostname;
if (expectedProjectRef === PRODUCTION_PROJECT_REF || targetHost.includes(PRODUCTION_PROJECT_REF)) {
    stop("Refusing to run against the production Supabase project.");
}
if (targetHost !== `${expectedProjectRef}.supabase.co`) {
    stop("RLS_TEST_SUPABASE_URL does not match RLS_TEST_EXPECTED_PROJECT_REF.");
}

const anonKey = process.env.RLS_TEST_ANON_KEY;
const table = process.env.RLS_TEST_TABLE;
const idColumn = process.env.RLS_TEST_ID_COLUMN;
const mutableColumn = process.env.RLS_TEST_MUTABLE_COLUMN;
const templateText = process.env.RLS_TEST_INSERT_TEMPLATE_JSON;

function clientFor(email, password) {
    const client = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    return client.auth.signInWithPassword({ email, password }).then(({ error }) => {
        if (error) throw new Error(`Sign-in failed for ${email}: ${error.message}`);
        return client;
    });
}

function payloadFor(runId) {
    const rendered = templateText.replaceAll("{{RUN_ID}}", runId);
    const parsed = JSON.parse(rendered);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        throw new Error("RLS_TEST_INSERT_TEMPLATE_JSON must be one JSON object");
    }
    return parsed;
}

const failures = [];
const cleanupIds = new Set();
const runPrefix = `codex-rls-${randomUUID()}`;

function record(condition, message) {
    if (condition) {
        console.log(`[PASS] ${message}`);
    } else {
        failures.push(message);
        console.error(`[FAIL] ${message}`);
    }
}

async function insertFixture(client, label) {
    const { data, error } = await client
        .from(table)
        .insert(payloadFor(`${runPrefix}-${label}`))
        .select(idColumn)
        .single();
    if (error || !data || data[idColumn] === undefined) {
        throw new Error(`Admin could not create ${label} fixture: ${error?.message ?? "missing id"}`);
    }
    cleanupIds.add(data[idColumn]);
    return data[idColumn];
}

async function verifyRestrictedRole(label, client, fixtureId) {
    const selectResult = await client.from(table).select(idColumn).eq(idColumn, fixtureId);
    record(!selectResult.error && selectResult.data?.length === 1, `${label} SELECT is allowed`);

    const insertResult = await client
        .from(table)
        .insert(payloadFor(`${runPrefix}-${label}-forbidden-insert`))
        .select(idColumn);
    if (!insertResult.error && insertResult.data) {
        for (const row of insertResult.data) {
            if (row[idColumn] !== undefined) cleanupIds.add(row[idColumn]);
        }
    }
    record(Boolean(insertResult.error) || insertResult.data?.length === 0, `${label} INSERT is denied`);

    const updateResult = await client
        .from(table)
        .update({ [mutableColumn]: `${runPrefix}-${label}-forbidden-update` })
        .eq(idColumn, fixtureId)
        .select(idColumn);
    record(Boolean(updateResult.error) || updateResult.data?.length === 0, `${label} UPDATE affects zero rows`);

    const deleteResult = await client
        .from(table)
        .delete()
        .eq(idColumn, fixtureId)
        .select(idColumn);
    record(Boolean(deleteResult.error) || deleteResult.data?.length === 0, `${label} DELETE affects zero rows`);
}

let admin;
try {
    const [viewer, contractor, adminClient] = await Promise.all([
        clientFor(process.env.RLS_TEST_VIEWER_EMAIL, process.env.RLS_TEST_VIEWER_PASSWORD),
        clientFor(process.env.RLS_TEST_CONTRACTOR_EMAIL, process.env.RLS_TEST_CONTRACTOR_PASSWORD),
        clientFor(process.env.RLS_TEST_ADMIN_EMAIL, process.env.RLS_TEST_ADMIN_PASSWORD),
    ]);
    admin = adminClient;

    const viewerFixture = await insertFixture(admin, "viewer");
    const contractorFixture = await insertFixture(admin, "contractor");
    await verifyRestrictedRole("Viewer", viewer, viewerFixture);
    await verifyRestrictedRole("Contractor", contractor, contractorFixture);

    const adminFixture = await insertFixture(admin, "admin");
    const adminSelect = await admin.from(table).select(idColumn).eq(idColumn, adminFixture);
    record(!adminSelect.error && adminSelect.data?.length === 1, "Admin SELECT is allowed");
    const adminUpdate = await admin
        .from(table)
        .update({ [mutableColumn]: `${runPrefix}-admin-update` })
        .eq(idColumn, adminFixture)
        .select(idColumn);
    record(!adminUpdate.error && adminUpdate.data?.length === 1, "Admin UPDATE is allowed");
    const adminDelete = await admin.from(table).delete().eq(idColumn, adminFixture).select(idColumn);
    record(!adminDelete.error && adminDelete.data?.length === 1, "Admin DELETE is allowed");
    cleanupIds.delete(adminFixture);
} catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
} finally {
    if (admin) {
        for (const id of cleanupIds) {
            const { error } = await admin.from(table).delete().eq(idColumn, id);
            if (error) failures.push(`Cleanup failed for ${String(id)}: ${error.message}`);
        }
        await admin.auth.signOut();
    }
}

if (failures.length > 0) {
    stop(`${failures.length} check(s) failed:\n- ${failures.join("\n- ")}`);
}
console.log("[RLS test] Viewer, Contractor and Admin direct REST checks passed.");
