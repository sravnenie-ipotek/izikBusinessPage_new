/**
 * Global Teardown for Menu Sync Tests
 *
 * This script runs after all tests to clean up the testing environment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function globalTeardown() {
  console.log('🧹 Cleaning up menu sync test environment...');

  // Clean up any backup files that might be left behind
  const backupFiles = [
    path.join(__dirname, 'backup-menu.json'),
    path.join(__dirname, 'backup-index.html')
  ];

  for (const backupFile of backupFiles) {
    if (fs.existsSync(backupFile)) {
      try {
        fs.unlinkSync(backupFile);
        console.log(`🗑️  Cleaned up backup file: ${path.basename(backupFile)}`);
      } catch (error) {
        console.warn(`⚠️  Failed to clean up backup file ${backupFile}:`, error.message);
      }
    }
  }

  // Clean up any temporary test files
  const tempFiles = [
    path.join(__dirname, '..', 'data', 'menu.json.temp'),
    path.join(__dirname, '..', 'index.html.temp')
  ];

  for (const tempFile of tempFiles) {
    if (fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
        console.log(`🗑️  Cleaned up temp file: ${path.basename(tempFile)}`);
      } catch (error) {
        console.warn(`⚠️  Failed to clean up temp file ${tempFile}:`, error.message);
      }
    }
  }

  console.log('✅ Menu sync test environment cleanup complete');
}

export default globalTeardown;