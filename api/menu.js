import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { validateMenuSync, performAutoSync, getDetailedSyncStatus } from './menu-sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to menu data
const MENU_DATA_PATH = path.join(__dirname, '..', 'data', 'menu.json');

// Function to read menu data
function readMenuData() {
  try {
    const data = fs.readFileSync(MENU_DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading menu data:', error);
    return null;
  }
}

// Function to write menu data
function writeMenuData(data) {
  try {
    fs.writeFileSync(MENU_DATA_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing menu data:', error);
    return false;
  }
}

// Function to generate HTML menu from JSON
function generateMenuHTML(menuItems) {
  let html = '<ul id="primary-menu" class="menu">';

  menuItems.forEach((item, index) => {
    const hasChildren = item.children && item.children.length > 0;
    const classes = `menu-item menu-item-type-post_type menu-item-object-page ${item.id}${hasChildren ? ' menu-item-has-children' : ''}`;

    html += `<li id="${item.id}" class="${classes}">`;
    const href = item.url === '/' ? 'index.html' : `${item.url}${item.url.endsWith('/') ? 'index.html' : ''}`;
    html += `<a href="${href}">${item.title}</a>`;

    if (hasChildren) {
      html += '<ul class="sub-menu">';
      item.children.forEach(child => {
        html += `<li id="${child.id}" class="menu-item menu-item-type-post_type menu-item-object-page ${child.id}">`;
        const childHref = child.url === '/' ? 'index.html' : `${child.url}${child.url.endsWith('/') ? 'index.html' : ''}`;
        html += `<a href="${childHref}">${child.title}</a></li>`;
      });
      html += '</ul>';
    }

    html += '</li>';
  });

  html += '</ul>';
  return html;
}

// Function to update HTML files with new menu
function updateHTMLFiles(menuHTML) {
  const htmlFiles = [
    path.join(__dirname, '..', 'index.html'),
    // Focus on main file first
    // path.join(__dirname, '..', 'index.he.html'),
  ];

  htmlFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');

        // More robust regex to find and replace the entire menu structure
        // This matches the menu from opening <ul id="primary-menu" to the last closing </ul>
        const menuRegex = /<ul id="primary-menu"[^>]*>[\s\S]*?<\/ul>(?=\s*<div class="contact-links">)/;

        if (menuRegex.test(content)) {
          const originalContent = content;
          content = content.replace(menuRegex, menuHTML);
          if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Successfully updated menu in: ${filePath}`);
          } else {
            console.error(`❌ Menu replacement failed in ${filePath} - content unchanged`);
          }
        } else {
          console.error(`❌ Could not find menu structure in ${filePath}`);
          console.log(`Debugging: File exists: ${fs.existsSync(filePath)}`);
          console.log(`Debugging: Has primary-menu: ${/<ul id="primary-menu"/.test(content)}`);
          console.log(`Debugging: Has contact-links: ${/<div class="contact-links">/.test(content)}`);
        }
      } catch (error) {
        console.error(`Error updating ${filePath}:`, error);
      }
    }
  });
}

// API handler
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  switch (req.method) {
    case 'GET':
      const { action, validate, sync, detailed } = req.query;

      // Handle sync operations
      if (action === 'validate' || validate === 'true') {
        try {
          const syncStatus = validateMenuSync();
          res.status(200).json({
            type: 'sync_validation',
            ...syncStatus
          });
        } catch (error) {
          res.status(500).json({
            error: 'Sync validation failed',
            details: error.message
          });
        }
        break;
      }

      if (action === 'sync' || sync === 'true') {
        try {
          const syncResult = performAutoSync();
          if (syncResult.success) {
            res.status(200).json({
              type: 'auto_sync',
              ...syncResult
            });
          } else {
            res.status(400).json({
              type: 'auto_sync',
              ...syncResult
            });
          }
        } catch (error) {
          res.status(500).json({
            error: 'Auto-sync failed',
            details: error.message
          });
        }
        break;
      }

      if (action === 'status' || detailed === 'true') {
        try {
          const detailedStatus = getDetailedSyncStatus();
          res.status(200).json({
            type: 'detailed_status',
            ...detailedStatus
          });
        } catch (error) {
          res.status(500).json({
            error: 'Failed to get detailed status',
            details: error.message
          });
        }
        break;
      }

      // Default: Get current menu with basic sync check
      const menuData = readMenuData();
      if (menuData) {
        // Include basic sync status in response
        try {
          const basicSyncCheck = validateMenuSync();
          res.status(200).json({
            ...menuData,
            syncStatus: {
              isInSync: basicSyncCheck.sync?.isInSync || false,
              issueCount: basicSyncCheck.sync?.totalIssues || 0,
              lastChecked: basicSyncCheck.lastChecked
            }
          });
        } catch (error) {
          // If sync check fails, just return menu data
          res.status(200).json(menuData);
        }
      } else {
        res.status(500).json({ error: 'Failed to read menu data' });
      }
      break;

    case 'POST':
    case 'PUT':
      // Update menu
      const newMenuData = req.body;

      // Validate menu data
      if (!newMenuData || !newMenuData.mainMenu) {
        res.status(400).json({ error: 'Invalid menu data' });
        return;
      }

      // Add timestamp
      newMenuData.lastUpdated = new Date().toISOString();

      // Save menu data
      if (writeMenuData(newMenuData)) {
        // Generate new HTML menu
        const menuHTML = generateMenuHTML(newMenuData.mainMenu);

        // Update HTML files
        updateHTMLFiles(menuHTML);

        res.status(200).json({
          success: true,
          message: 'Menu updated successfully',
          data: newMenuData
        });
      } else {
        res.status(500).json({ error: 'Failed to save menu data' });
      }
      break;

    case 'DELETE':
      // Delete menu item
      const { itemId } = req.query;

      if (!itemId) {
        res.status(400).json({ error: 'Item ID required' });
        return;
      }

      const currentMenu = readMenuData();
      if (!currentMenu) {
        res.status(500).json({ error: 'Failed to read menu data' });
        return;
      }

      // Remove item from menu
      currentMenu.mainMenu = currentMenu.mainMenu.filter(item => {
        if (item.id === itemId) return false;
        if (item.children) {
          item.children = item.children.filter(child => child.id !== itemId);
        }
        return true;
      });

      currentMenu.lastUpdated = new Date().toISOString();

      if (writeMenuData(currentMenu)) {
        // Generate new HTML menu
        const menuHTML = generateMenuHTML(currentMenu.mainMenu);

        // Update HTML files
        updateHTMLFiles(menuHTML);

        res.status(200).json({
          success: true,
          message: 'Menu item deleted successfully',
          data: currentMenu
        });
      } else {
        res.status(500).json({ error: 'Failed to delete menu item' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}