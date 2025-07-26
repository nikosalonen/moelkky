/** @format */

import { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Running Playwright global teardown...");

  // Clean up any global resources if needed
  // For now, just log completion
  console.log("✅ Playwright tests completed");
}

export default globalTeardown;
