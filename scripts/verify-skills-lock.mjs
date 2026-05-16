#!/usr/bin/env node
/**
 * verify-skills-lock.mjs — integrity + provenance gate for skills-lock.json.
 *
 * Run BEFORE any skill is trusted/executed (prebuild / CI / pre-commit):
 *
 *   node scripts/verify-skills-lock.mjs            # human output, exits 1 on failure
 *   node scripts/verify-skills-lock.mjs --json     # machine-readable report
 *   node scripts/verify-skills-lock.mjs --quiet    # only print failures
 *
 * What it enforces (exit non-zero on any FAIL):
 *
 *   1. INTEGRITY (cryptographic, authoritative) — for every locked skill,
 *      recompute the installed folder hash using the EXACT algorithm the
 *      `skills` CLI uses (sha256 over sorted relativePath+content, skipping
 *      .git/node_modules) and require it to equal the lock's `computedHash`.
 *      A mismatch means the on-disk skill was tampered with or drifted from
 *      what was locked — the skill must NOT be executed.
 *
 *   2. PROVENANCE (structural) — every github-sourced entry must be pinned
 *      to an immutable 40-hex commit SHA via `ref`. A branch name, tag, or
 *      missing `ref` is a moving target and fails the gate.
 *
 *   3. STRUCTURE — required fields present and well-formed.
 *
 * Honesty note: `computedHash` is the cryptographic tamper-evidence and is
 * verified here against the bytes on disk. `ref` records the immutable
 * upstream commit (pbakaus/impeccable @ tag skill-v3.1.1) as declared
 * provenance and is structurally enforced; binding the local content to
 * that exact commit additionally would require replaying the CLI's install
 * transform, which is out of scope for this gate.
 *
 * No external dependencies. Node 18+.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCK_PATH = join(REPO_ROOT, "skills-lock.json");
const SUPPORTED_VERSION = 1;
const SHA1_RE = /^[0-9a-f]{40}$/;
const SHA256_RE = /^[0-9a-f]{64}$/;
// Harness dirs the `skills` CLI installs into; first existing match is canonical.
const SKILL_DIRS = [".agents/skills", ".claude/skills"];

const args = new Set(process.argv.slice(2));
const asJson = args.has("--json");
const quiet = args.has("--quiet");

/**
 * Byte-for-byte reimplementation of the `skills` CLI's computeSkillFolderHash:
 * collect every file under skillDir (skipping .git / node_modules), sort by
 * POSIX relativePath via localeCompare, then sha256 of relativePath + content
 * for each file in order. Verified to reproduce the CLI's hashes exactly.
 */
async function computeSkillFolderHash(skillDir) {
  const files = [];
  await collectFiles(skillDir, skillDir, files);
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file.relativePath);
    hash.update(file.content);
  }
  return hash.digest("hex");
}

async function collectFiles(baseDir, currentDir, results) {
  const entries = await readdir(currentDir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === ".git" || entry.name === "node_modules") return;
        await collectFiles(baseDir, fullPath, results);
      } else if (entry.isFile()) {
        const content = await readFile(fullPath);
        const relativePath = relative(baseDir, fullPath).split("\\").join("/");
        results.push({ relativePath, content });
      }
    }),
  );
}

function resolveInstalledDir(skillName) {
  const found = [];
  for (const base of SKILL_DIRS) {
    const dir = join(REPO_ROOT, base, skillName);
    if (existsSync(dir)) found.push({ base, dir });
  }
  return found;
}

async function main() {
  const failures = [];
  const warnings = [];
  const checked = [];

  if (!existsSync(LOCK_PATH)) {
    failures.push({ skill: "(lockfile)", reason: `skills-lock.json not found at ${LOCK_PATH}` });
    return report(failures, warnings, checked);
  }

  let lock;
  try {
    lock = JSON.parse(await readFile(LOCK_PATH, "utf-8"));
  } catch (err) {
    failures.push({ skill: "(lockfile)", reason: `skills-lock.json is not valid JSON: ${err.message}` });
    return report(failures, warnings, checked);
  }

  if (lock.version !== SUPPORTED_VERSION) {
    failures.push({
      skill: "(lockfile)",
      reason: `Unsupported lock version ${lock.version} (this gate understands v${SUPPORTED_VERSION}).`,
    });
    return report(failures, warnings, checked);
  }
  if (!lock.skills || typeof lock.skills !== "object") {
    failures.push({ skill: "(lockfile)", reason: "Lock has no `skills` map." });
    return report(failures, warnings, checked);
  }

  for (const [name, entry] of Object.entries(lock.skills)) {
    // --- 3. STRUCTURE ---
    if (!entry || typeof entry !== "object") {
      failures.push({ skill: name, reason: "Entry is not an object." });
      continue;
    }
    if (typeof entry.source !== "string" || !entry.source) {
      failures.push({ skill: name, reason: "Missing `source`." });
    }
    if (typeof entry.computedHash !== "string" || !SHA256_RE.test(entry.computedHash)) {
      failures.push({ skill: name, reason: "`computedHash` missing or not a 64-hex sha256." });
      continue;
    }

    // --- 2. PROVENANCE: immutable commit-SHA pin required for github sources ---
    if (entry.sourceType === "github") {
      if (typeof entry.ref !== "string" || !SHA1_RE.test(entry.ref)) {
        failures.push({
          skill: name,
          reason: `Not pinned to an immutable commit SHA — \`ref\` is ${JSON.stringify(entry.ref)} (need a 40-hex git SHA, not a branch/tag).`,
        });
      }
    } else if (entry.sourceType && entry.ref && !SHA1_RE.test(entry.ref)) {
      warnings.push({ skill: name, reason: `\`ref\` "${entry.ref}" is not a 40-hex SHA.` });
    }

    // --- 1. INTEGRITY: recompute installed folder hash vs lock ---
    const installed = resolveInstalledDir(name);
    if (installed.length === 0) {
      failures.push({
        skill: name,
        reason: `Locked but not installed under any of ${SKILL_DIRS.join(", ")} — cannot verify before execution.`,
      });
      continue;
    }

    const hashes = [];
    for (const { base, dir } of installed) {
      try {
        const st = await stat(dir);
        if (!st.isDirectory()) {
          failures.push({ skill: name, reason: `${base}/${name} exists but is not a directory.` });
          continue;
        }
        const actual = await computeSkillFolderHash(dir);
        hashes.push({ base, actual });
        if (actual !== entry.computedHash) {
          failures.push({
            skill: name,
            reason: `INTEGRITY FAIL in ${base}/${name}: computed ${actual.slice(0, 12)}… ≠ locked ${entry.computedHash.slice(0, 12)}… (tampered or drifted — do not execute).`,
          });
        } else {
          checked.push({ skill: name, base, status: "ok" });
        }
      } catch (err) {
        failures.push({ skill: name, reason: `Failed to hash ${base}/${name}: ${err.message}` });
      }
    }
    // Mirror divergence: same skill must be identical across harness dirs.
    if (hashes.length > 1) {
      const distinct = new Set(hashes.map((h) => h.actual));
      if (distinct.size > 1) {
        warnings.push({
          skill: name,
          reason: `Installed copies diverge across ${hashes.map((h) => h.base).join(" vs ")} — only matching copies were accepted above.`,
        });
      }
    }
  }

  return report(failures, warnings, checked);
}

function report(failures, warnings, checked) {
  if (asJson) {
    console.log(JSON.stringify({ ok: failures.length === 0, failures, warnings, checkedCount: checked.length }, null, 2));
  } else {
    if (!quiet && checked.length) {
      console.log(`✓ ${checked.length} skill copy integrity check(s) passed.`);
    }
    for (const w of warnings) console.warn(`⚠ ${w.skill}: ${w.reason}`);
    for (const f of failures) console.error(`✗ ${f.skill}: ${f.reason}`);
    if (failures.length === 0) {
      if (!quiet) console.log("skills-lock.json verified: integrity + immutable-SHA pin OK.");
    } else {
      console.error(`\n${failures.length} failure(s). Skills must NOT be executed until resolved.`);
    }
  }
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(`verify-skills-lock crashed: ${err?.stack || err}`);
  process.exit(2);
});
