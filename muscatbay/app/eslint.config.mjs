import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
]);

export default eslintConfig;
