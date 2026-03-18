import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    environment: "node",
    include: [
      "lib/__tests__/**/*.test.ts",
      "hooks/__tests__/**/*.test.ts",
      "components/**/__tests__/**/*.test.{ts,tsx}",
    ],
  },
});
