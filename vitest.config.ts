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
  assetsInclude: ["**/*.mp3", "**/*.m4a"],
  test: {
    environment: "node",
    setupFiles: ["lib/__tests__/setup.ts"],
    include: [
      "lib/__tests__/**/*.test.ts",
      "hooks/__tests__/**/*.test.ts",
      "components/**/__tests__/**/*.test.{ts,tsx}",
    ],
    server: {
      deps: {
        inline: ["expo-audio"],
      },
    },
  },
});
