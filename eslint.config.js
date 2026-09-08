import { defineConfig } from "eslint/config";
import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: ["dist/**", ".astro/**", "node_modules/**", "worker/**"],
  },
  tseslint.configs.recommended,
  eslintPluginAstro.configs.recommended,
);
