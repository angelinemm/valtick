import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  // Ignore built artefacts and generated files
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.prisma/**",
      "**/prisma/migrations/**",
      "apps/backend/static/**",
    ],
  },

  // Base JS rules everywhere
  js.configs.recommended,

  // TypeScript rules everywhere
  ...tseslint.configs.recommended,

  // React hooks rules — frontend only
  {
    files: ["apps/frontend/src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Prettier must be last — disables conflicting formatting rules
  prettierConfig
);
