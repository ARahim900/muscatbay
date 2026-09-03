import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import design from "./eslint.design-rules.mjs";

// Design-system enforcement (DESIGN_SYSTEM.md §8). The rule itself is the
// verbatim kit file; only its scope is narrowed here. Pages are migrated one
// per session — Water → Dashboard → STP → Electricity → Contractors →
// Fire Safety → HVAC → Assets → Pest Control → Settings — and each migrated
// page's route folder and component folder are ADDED to this list in the same
// PR. When the last page lands, drop the `files` override so the kit's default
// (`app/**`, `components/**`) applies to everything.
const designRules = {
  ...design,
  files: [
    "app/water/**/*.{ts,tsx}",
    "components/water/**/*.{ts,tsx}",
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored third-party bundles served as static assets (e.g. the
    // Satellite View's self-hosted MapLibre build) — not ours to lint.
    "public/**/vendor/**",
  ]),
  {
    files: ["**/*.tsx", "**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/\\[#[0-9a-fA-F]{3,8}\\]/]",
          message:
            "Avoid arbitrary hex colors in Tailwind classes. Use design tokens (bg-primary, text-secondary, etc.) instead.",
        },
      ],
    },
  },
  // Standalone Node.js utility scripts (seed/upload/verify).
  // These are CommonJS scripts executed via `node scripts/*.js`, not bundled
  // with the Next.js app. `require()` is legitimate here, and unused locals
  // in one-off data scripts are not worth flagging as errors.
  {
    files: ["scripts/**/*.js", "scripts/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  designRules,
]);

export default eslintConfig;
