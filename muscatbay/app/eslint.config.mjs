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
]);

export default eslintConfig;
