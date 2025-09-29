/**
 * Global Setup for Menu Sync Tests
 *
 * This script runs before all tests to ensure the testing environment
 * is properly configured for menu sync testing.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function globalSetup() {
  console.log('🔧 Setting up menu sync test environment...');

  // Ensure test directories exist
  const testResultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }

  // Ensure tests directory exists
  const testsDir = path.join(__dirname);
  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir, { recursive: true });
  }

  // Verify required files exist
  const requiredFiles = [
    path.join(__dirname, '..', 'data', 'menu.json'),
    path.join(__dirname, '..', 'index.html'),
    path.join(__dirname, '..', 'api', 'menu.js'),
    path.join(__dirname, '..', 'api', 'menu-sync.js')
  ];

  for (const filePath of requiredFiles) {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Required file missing: ${filePath}`);
    }
  }

  // Wait a moment to ensure server is ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('✅ Menu sync test environment setup complete');
}

export default globalSetup;