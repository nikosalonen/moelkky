/** @format */

import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  base: process.env.NODE_ENV === "production" ? "/moelkky/" : "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "terser",
    target: "es2020",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk for external dependencies
          if (id.includes("node_modules")) {
            if (id.includes("preact")) {
              return "preact";
            }
            return "vendor";
          }

          // Component chunks for better code splitting
          if (id.includes("/components/")) {
            if (id.includes("GameHistory")) {
              return "game-history";
            }
            if (
              id.includes("WinnerDisplay") ||
              id.includes("NoWinnerDisplay")
            ) {
              return "game-end";
            }
            if (id.includes("TeamManager")) {
              return "team-management";
            }
          }

          // Utils and hooks
          if (id.includes("/utils/") || id.includes("/hooks/")) {
            return "utils";
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["preact", "preact/hooks"],
  },
});
