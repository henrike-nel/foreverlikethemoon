import { defineConfig } from "eslint/config";
import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";
import local from "./eslint-plugin-local.js";

export default defineConfig(
  {
    ignores: [
      "dist/**",
      ".astro/**",
      "node_modules/**",
      "worker/**",
      "functions/**",
      ".wrangler/**",
    ],
  },
  tseslint.configs.recommended,
  eslintPluginAstro.configs.recommended,
  {
    plugins: { local },
    rules: {
      "local/no-accent-decorative-on-text": "error",
      "local/no-arbitrary-tailwind": "error",
    },
  },
  {
    files: ["**/*.{js,mjs,ts,astro}"],
    ignores: ["src/lib/motion.ts", "eslint-plugin-local.js"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "motion",
              message: "Use the named primitives in src/lib/motion.ts.",
            },
            {
              name: "motion/mini",
              message: "Use the named primitives in src/lib/motion.ts.",
            },
          ],
        },
      ],
    },
  },
);
