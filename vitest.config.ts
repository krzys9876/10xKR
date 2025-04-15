/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    reporters: ["default"],
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["src/components/**/*.ts", "src/components/**/*.tsx"],
      exclude: ["**/types.ts", "**/*.d.ts", "**/index.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
