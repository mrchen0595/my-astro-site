/// <reference types="vitest/config" />

import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    environment: "node",

    include: ["src/lib/__tests__/**/*.test.ts"],

    exclude: [
      "e2e/**",
      "node_modules/**",
      "dist/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
});
