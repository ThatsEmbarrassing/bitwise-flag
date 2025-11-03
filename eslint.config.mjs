import eslint from "@eslint/js";

import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

import stylistic from "@stylistic/eslint-plugin";

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "no-unused-vars": "off",
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "_", argsIgnorePattern: "_" },
      ],
    },
  },
  globalIgnores(["dist/**/*"], "Ignore build directory"),
  globalIgnores(["**/*.test.*"], "Ignore test files")
);
