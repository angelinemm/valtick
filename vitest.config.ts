import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "apps/backend/src/**/*.test.ts",
      "packages/shared/src/**/*.test.ts",
    ],
  },
});
