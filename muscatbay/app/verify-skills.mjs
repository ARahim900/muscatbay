#!/usr/bin/env node
/**
 * Wrapper around the repo-root skills lockfile verification.
 *
 * Deployment clones (Vercel) strip `scripts/` and the skills tree via
 * .vercelignore, and no skills execute in those environments — so when the
 * verifier isn't present we skip instead of failing the build. Local and CI
 * checkouts always contain the script, so verification still gates them.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const script = fileURLToPath(
    new URL("../../scripts/verify-skills-lock.mjs", import.meta.url),
);

if (!existsSync(script)) {
    console.log(
        "verify:skills — verifier not present in this clone (deploy build); skipping.",
    );
    process.exit(0);
}

const result = spawnSync(process.execPath, [script], { stdio: "inherit" });
process.exit(result.status ?? 1);
