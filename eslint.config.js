import js from "@eslint/js";
import globals from "globals";

export default [
  // Ignore folders
  {
    ignores: ["node_modules/**", "coverage/**", "dist/**"],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // Project-specific tweaks
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        // Jest globals for tests:
        ...globals.jest,
      },
    },
    rules: {
      "no-console": "error",

      // Common niceties
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "prefer-const": "warn",
      "no-constant-binary-expression": "off",
    },
  },
];
