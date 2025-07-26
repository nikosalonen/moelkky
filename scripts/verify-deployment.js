#!/usr/bin/env node

/**
 * Deployment verification script
 * Checks that the build output is correctly configured for GitHub Pages
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DIST_DIR = 'dist';
const EXPECTED_BASE_PATH = '/moelkky/';

function verifyDeployment() {
  console.log('🔍 Verifying deployment configuration...\n');

  // Check if dist directory exists
  if (!existsSync(DIST_DIR)) {
    console.error('❌ dist directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  // Check if index.html exists
  const indexPath = join(DIST_DIR, 'index.html');
  if (!existsSync(indexPath)) {
    console.error('❌ index.html not found in dist directory.');
    process.exit(1);
  }

  // Read and verify index.html content
  const indexContent = readFileSync(indexPath, 'utf-8');

  // Check for correct base path in assets
  const assetRegex = new RegExp(`href="${EXPECTED_BASE_PATH}|src="${EXPECTED_BASE_PATH}`, 'g');
  const matches = indexContent.match(assetRegex);

  if (!matches || matches.length === 0) {
    console.error(`❌ Base path "${EXPECTED_BASE_PATH}" not found in asset URLs.`);
    console.log('Current index.html content:');
    console.log(indexContent);
    process.exit(1);
  }

  console.log(`✅ Found ${matches.length} asset URLs with correct base path`);
  console.log(`✅ Base path "${EXPECTED_BASE_PATH}" correctly configured`);

  // Check for favicon
  if (indexContent.includes(`href="${EXPECTED_BASE_PATH}vite.svg"`)) {
    console.log('✅ Favicon correctly configured');
  }

  // Check for CSS and JS assets
  if (indexContent.includes(`${EXPECTED_BASE_PATH}assets/`)) {
    console.log('✅ CSS and JS assets correctly configured');
  }

  console.log('\n🎉 Deployment configuration verified successfully!');
  console.log(`📦 Ready for deployment to GitHub Pages`);
  console.log(`🌐 Will be available at: https://[username].github.io${EXPECTED_BASE_PATH}`);
}

verifyDeployment();
