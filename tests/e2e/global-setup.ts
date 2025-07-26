/** @format */

import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  console.log("🎭 Starting Playwright global setup...");

  // Ensure the application is built before running tests
  const { spawn } = await import("child_process");

  return new Promise<void>((resolve, reject) => {
    console.log("📦 Building application for testing...");
    const buildProcess = spawn("npm", ["run", "build"], {
      stdio: "inherit",
      shell: true,
    });

    buildProcess.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Application built successfully");
        resolve();
      } else {
        console.error("❌ Application build failed");
        reject(new Error(`Build process exited with code ${code}`));
      }
    });

    buildProcess.on("error", (error) => {
      console.error("❌ Build process error:", error);
      reject(error);
    });
  });
}

export default globalSetup;
