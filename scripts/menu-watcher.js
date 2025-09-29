#!/usr/bin/env node

/**
 * Development Menu Sync Watcher
 *
 * Monitors HTML files for changes and automatically checks menu synchronization.
 * This prevents menu sync bugs by alerting developers immediately when HTML
 * files are modified without updating the menu.json file.
 *
 * Usage: node scripts/menu-watcher.js
 *
 * Features:
 * - Watches HTML files for changes
 * - Automatically validates menu sync when changes detected
 * - Provides detailed sync status and issues
 * - Suggests fixes for sync problems
 * - Can be integrated into development workflow
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { validateMenuSync, performAutoSync } from '../api/menu-sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const WATCH_CONFIG = {
  // Files to watch for menu changes
  watchFiles: [
    path.join(__dirname, '..', 'index.html'),
    path.join(__dirname, '..', 'index.he.html')
  ],

  // Check interval (in milliseconds)
  checkInterval: 2000,

  // Auto-sync on detection (set to false for warnings only)
  autoSyncEnabled: false,

  // Console output styling
  colors: {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
  }
};

// Track file modification times
const fileStats = new Map();

/**
 * Initialize file tracking
 */
function initializeFileTracking() {
  console.log(`${WATCH_CONFIG.colors.cyan}🔍 Menu Sync Watcher - Initializing...${WATCH_CONFIG.colors.reset}`);

  WATCH_CONFIG.watchFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      fileStats.set(filePath, stats.mtime.getTime());
      console.log(`${WATCH_CONFIG.colors.blue}📄 Watching: ${path.basename(filePath)}${WATCH_CONFIG.colors.reset}`);
    } else {
      console.log(`${WATCH_CONFIG.colors.yellow}⚠️  File not found: ${filePath}${WATCH_CONFIG.colors.reset}`);
    }
  });

  console.log(`${WATCH_CONFIG.colors.green}✅ Watcher initialized - monitoring ${fileStats.size} files${WATCH_CONFIG.colors.reset}`);
  console.log(`${WATCH_CONFIG.colors.cyan}🔄 Auto-sync: ${WATCH_CONFIG.autoSyncEnabled ? 'ENABLED' : 'DISABLED'}${WATCH_CONFIG.colors.reset}`);
  console.log('');
}

/**
 * Check if any watched files have been modified
 */
function checkForFileChanges() {
  const changedFiles = [];

  WATCH_CONFIG.watchFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const currentMtime = stats.mtime.getTime();
      const lastMtime = fileStats.get(filePath);

      if (lastMtime && currentMtime > lastMtime) {
        changedFiles.push(filePath);
        fileStats.set(filePath, currentMtime);
      }
    }
  });

  return changedFiles;
}

/**
 * Display sync status with colored output
 */
function displaySyncStatus(syncResult) {
  const { colors } = WATCH_CONFIG;

  console.log(`${colors.magenta}${colors.bold}📊 SYNC STATUS REPORT${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════${colors.reset}`);

  if (syncResult.success) {
    const sync = syncResult.sync;

    if (sync.isInSync) {
      console.log(`${colors.green}✅ Status: MENUS IN SYNC${colors.reset}`);
      console.log(`${colors.green}📈 No issues detected${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Status: SYNC ISSUES DETECTED${colors.reset}`);
      console.log(`${colors.yellow}📊 Total Issues: ${sync.totalIssues}${colors.reset}`);
      console.log(`${colors.red}🚨 Errors: ${sync.errorCount}${colors.reset}`);
      console.log(`${colors.yellow}⚠️  Warnings: ${sync.warningCount}${colors.reset}`);

      if (sync.issues && sync.issues.length > 0) {
        console.log(`\n${colors.bold}🔍 DETAILED ISSUES:${colors.reset}`);
        sync.issues.slice(0, 5).forEach((issue, index) => {
          const severityColor = issue.severity === 'error' ? colors.red : colors.yellow;
          const severityIcon = issue.severity === 'error' ? '🚨' : '⚠️';

          console.log(`${severityColor}${severityIcon} ${issue.type.replace(/_/g, ' ').toUpperCase()}${colors.reset}`);
          console.log(`   ${issue.description}`);

          if (issue.htmlValue && issue.jsonValue) {
            console.log(`   ${colors.blue}HTML: ${issue.htmlValue}${colors.reset}`);
            console.log(`   ${colors.cyan}JSON: ${issue.jsonValue}${colors.reset}`);
          }
          console.log('');
        });

        if (sync.issues.length > 5) {
          console.log(`${colors.yellow}... and ${sync.issues.length - 5} more issues${colors.reset}`);
        }
      }

      console.log(`\n${colors.magenta}💡 RECOMMENDED ACTIONS:${colors.reset}`);
      console.log(`${colors.cyan}1. Run auto-sync: npm run menu:sync${colors.reset}`);
      console.log(`${colors.cyan}2. Check admin panel: http://localhost:7001/admin${colors.reset}`);
      console.log(`${colors.cyan}3. Manual sync via API: GET /api/menu?action=sync${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}❌ SYNC CHECK FAILED${colors.reset}`);
    console.log(`${colors.red}Error: ${syncResult.error}${colors.reset}`);
  }

  console.log(`${colors.cyan}═══════════════════════${colors.reset}`);
  console.log(`${colors.blue}📅 Checked at: ${new Date().toLocaleString()}${colors.reset}`);
  console.log('');
}

/**
 * Handle file changes and perform sync validation
 */
async function handleFileChanges(changedFiles) {
  const { colors } = WATCH_CONFIG;

  console.log(`${colors.yellow}🔄 FILE CHANGES DETECTED${colors.reset}`);
  changedFiles.forEach(file => {
    console.log(`${colors.yellow}📝 Modified: ${path.basename(file)}${colors.reset}`);
  });
  console.log('');

  // Perform sync validation
  console.log(`${colors.blue}🔍 Checking menu synchronization...${colors.reset}`);

  try {
    const syncResult = validateMenuSync();
    displaySyncStatus(syncResult);

    // Auto-sync if enabled and issues detected
    if (WATCH_CONFIG.autoSyncEnabled && syncResult.success && !syncResult.sync.isInSync) {
      console.log(`${colors.magenta}🔄 Auto-sync enabled - attempting to fix issues...${colors.reset}`);

      const autoSyncResult = performAutoSync();

      if (autoSyncResult.success) {
        console.log(`${colors.green}✅ Auto-sync completed successfully!${colors.reset}`);
        console.log(`${colors.green}📈 Added ${autoSyncResult.addedItems?.length || 0} items${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ Auto-sync failed: ${autoSyncResult.error}${colors.reset}`);
      }
      console.log('');
    }

  } catch (error) {
    console.log(`${colors.red}❌ Sync validation error: ${error.message}${colors.reset}`);
    console.log('');
  }
}

/**
 * Main watcher loop
 */
function startWatcher() {
  console.log(`${WATCH_CONFIG.colors.cyan}👀 Starting file watcher (checking every ${WATCH_CONFIG.checkInterval}ms)...${WATCH_CONFIG.colors.reset}`);
  console.log(`${WATCH_CONFIG.colors.blue}💡 Press Ctrl+C to stop${WATCH_CONFIG.colors.reset}`);
  console.log('');

  setInterval(() => {
    const changedFiles = checkForFileChanges();

    if (changedFiles.length > 0) {
      handleFileChanges(changedFiles);
    }
  }, WATCH_CONFIG.checkInterval);
}

/**
 * CLI Commands
 */
function handleCliCommands() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'check':
      console.log(`${WATCH_CONFIG.colors.cyan}🔍 Manual sync check...${WATCH_CONFIG.colors.reset}`);
      const syncResult = validateMenuSync();
      displaySyncStatus(syncResult);
      process.exit(0);
      break;

    case 'sync':
      console.log(`${WATCH_CONFIG.colors.magenta}🔄 Manual auto-sync...${WATCH_CONFIG.colors.reset}`);
      const autoSyncResult = performAutoSync();

      if (autoSyncResult.success) {
        console.log(`${WATCH_CONFIG.colors.green}✅ Auto-sync completed!${WATCH_CONFIG.colors.reset}`);
      } else {
        console.log(`${WATCH_CONFIG.colors.red}❌ Auto-sync failed: ${autoSyncResult.error}${WATCH_CONFIG.colors.reset}`);
      }
      process.exit(0);
      break;

    case 'help':
    case '--help':
    case '-h':
      console.log(`${WATCH_CONFIG.colors.cyan}Menu Sync Watcher - Usage:${WATCH_CONFIG.colors.reset}`);
      console.log('');
      console.log(`${WATCH_CONFIG.colors.yellow}node scripts/menu-watcher.js${WATCH_CONFIG.colors.reset}          Start file watcher`);
      console.log(`${WATCH_CONFIG.colors.yellow}node scripts/menu-watcher.js check${WATCH_CONFIG.colors.reset}     One-time sync check`);
      console.log(`${WATCH_CONFIG.colors.yellow}node scripts/menu-watcher.js sync${WATCH_CONFIG.colors.reset}      Perform auto-sync`);
      console.log(`${WATCH_CONFIG.colors.yellow}node scripts/menu-watcher.js help${WATCH_CONFIG.colors.reset}      Show this help`);
      console.log('');
      process.exit(0);
      break;

    default:
      // No command = start watcher
      initializeFileTracking();
      startWatcher();
      break;
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('');
  console.log(`${WATCH_CONFIG.colors.cyan}👋 Menu sync watcher stopped${WATCH_CONFIG.colors.reset}`);
  process.exit(0);
});

/**
 * Start the application
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  handleCliCommands();
}