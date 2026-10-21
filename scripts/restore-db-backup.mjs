#!/usr/bin/env node
/**
 * Restore a decrypted Database backup (roles.sql, schema.sql, data.sql) into a
 * Postgres database — see docs/runbooks/database-backup.md.
 *
 *   node scripts/restore-db-backup.mjs <unpacked-backup-dir> "<target connection string>"
 *
 * Supabase's plain restore command (roles → schema → data) fails on this
 * project, found by the first test restore on 2026-10-21:
 *
 * 1. Three CHECK constraints were added NOT VALID: they bind new rows only, and
 *    8 live contractor_contracts rows predate contractor_contract_pdf_url_approved.
 *    pg_dump puts them in schema.sql, so they would check every row during the
 *    data load and abort it. They are moved after the data and stay NOT VALID,
 *    exactly as on the live project.
 * 2. Empty COPY blocks of platform-owned tables (storage.buckets_vectors) are
 *    rejected with "permission denied" on a fresh Supabase stack. A COPY with no
 *    rows changes nothing, so every empty block is left out.
 *
 * Everything runs in one transaction: it restores fully or not at all.
 * Requires psql (macOS: brew install libpq).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const [dir, target] = process.argv.slice(2);
if (!dir || !target) {
    console.error('Usage: node scripts/restore-db-backup.mjs <unpacked-backup-dir> "<target connection string>"');
    process.exit(2);
}
for (const f of ["roles.sql", "schema.sql", "data.sql"]) {
    if (!existsSync(join(dir, f))) {
        console.error(`Missing ${f} in ${dir}`);
        process.exit(2);
    }
}

// 1. NOT VALID constraints → after the data.
const schema = readFileSync(join(dir, "schema.sql"), "utf8");
const notValid = /ALTER TABLE (?:ONLY )?[^;]*?ADD CONSTRAINT[^;]*?NOT VALID;\n?/gs;
const deferred = schema.match(notValid) ?? [];
writeFileSync(join(dir, "schema-predata.sql"), schema.replace(notValid, ""));
writeFileSync(join(dir, "schema-postdata.sql"), deferred.join(""));

// 2. Drop empty COPY blocks.
const lines = readFileSync(join(dir, "data.sql"), "utf8").split("\n");
const out = [];
let empty = 0;
for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("COPY ")) {
        out.push(lines[i]);
        continue;
    }
    let j = i + 1;
    while (j < lines.length && lines[j] !== "\\.") j++;
    if (j === i + 1) empty++;
    else out.push(...lines.slice(i, j + 1));
    i = j;
}
writeFileSync(join(dir, "data-restore.sql"), out.join("\n"));

console.log(`NOT VALID constraints deferred: ${deferred.length}; empty tables skipped: ${empty}`);

const psql = spawnSync(
    "psql",
    [
        "--single-transaction",
        "--variable", "ON_ERROR_STOP=1",
        "--quiet",
        "--file", "roles.sql",
        "--file", "schema-predata.sql",
        "--command", "SET session_replication_role = replica",
        "--file", "data-restore.sql",
        "--command", "SET session_replication_role = DEFAULT",
        "--file", "schema-postdata.sql",
        "--dbname", target,
    ],
    { cwd: dir, stdio: ["ignore", "ignore", "inherit"] },
);
if (psql.error) {
    console.error(`Could not run psql: ${psql.error.message}`);
    process.exit(1);
}
console.log(psql.status === 0 ? "Restore complete." : "Restore FAILED — nothing was changed (single transaction).");
process.exit(psql.status ?? 1);
