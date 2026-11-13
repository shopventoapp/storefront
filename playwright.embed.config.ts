import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// These tests start the production Worker fixture themselves and only use out/.
export default defineConfig({
  ...base,
  testMatch: "embed.spec.ts",
  timeout: 60_000,
  webServer: undefined,
});
