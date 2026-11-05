import { defineConfig } from "vitest/config";

// Separate from vite.config.ts on purpose: the React Router Vite plugin isn't meant to run in tests.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["app/**/*.test.{ts,tsx}"],
  },
});
