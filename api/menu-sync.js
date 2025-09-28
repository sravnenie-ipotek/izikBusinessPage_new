import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Extract menu items from HTML files
function extractMenuFromHTML(htmlPath) {
  try {
    if (!fs.existsSync(htmlPath)) {
      return { error: `HTML file not found: ${htmlPath}`, items: [] };
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(html);
    const menuItems = [];

    $('#primary-menu > li').each((index, element) => {
      const $item = $(element);
      const id = $item.attr('id') || `generated-${index}`;
      const $link = $item.find('> a').first();
      const title = $link.text().trim();
      const url = $link.attr('href') || '#';

      // Extract children
      const children = [];
      $item.find('.sub-menu > li').each((childIndex, childElement) => {
        const $child = $(childElement);
        const $childLink = $child.find('> a').first();
        children.push({
          id: $child.attr('id') || `child-${index}-${childIndex}`,
          title: $childLink.text().trim(),
          url: $childLink.attr('href') || '#'
        });
      });

      menuItems.push({
        id,
        title,
        url: normalizeUrl(url),
        order: index + 1,
        children
      });
    });

    return { items: menuItems, error: null };
  } catch (error) {
    return { error: `Failed to extract menu from HTML: ${error.message}`, items: [] };
  }
}

// Normalize URLs for comparison
function normalizeUrl(url) {
  if (!url || url === '#') return '#';

  // Convert relative paths to absolute paths
  if (url.endsWith('/index.html')) {
    return url.replace('/index.html', '/');
  }
  if (url.endsWith('.html')) {
    return url.replace('.html', '/');
  }
  if (!url.startsWith('/')) {
    return '/' + url;
  }
  if (!url.endsWith('/') && url !== '#') {
    return url + '/';
  }
  return url;
}

// Load menu from JSON file
function loadMenuFromJSON() {
  try {
    const menuPath = path.join(__dirname, '..', 'data', 'menu.json');
    if (!fs.existsSync(menuPath)) {
      return { error: 'Menu JSON file not found', menu: null };
    }

    const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
    return { menu: menuData.mainMenu || [], error: null };
  } catch (error) {
    return { error: `Failed to load menu JSON: ${error.message}`, menu: null };
  }
}

// Compare two menu structures
function compareMenus(htmlMenu, jsonMenu) {
  const issues = [];
  const htmlItems = new Map();
  const jsonItems = new Map();

  // Index HTML items
  htmlMenu.forEach(item => {
    htmlItems.set(item.id, item);
  });

  // Index JSON items
  jsonMenu.forEach(item => {
    jsonItems.set(item.id, item);
  });

  // Check for items in HTML but not in JSON
  htmlItems.forEach((htmlItem, id) => {
    if (!jsonItems.has(id)) {
      issues.push({
        type: 'missing_in_json',
        id,
        title: htmlItem.title,
        description: `Menu item "${htmlItem.title}" exists in HTML but not in JSON`,
        severity: 'warning'
      });
    }
  });

  // Check for items in JSON but not in HTML
  jsonItems.forEach((jsonItem, id) => {
    if (!htmlItems.has(id)) {
      issues.push({
        type: 'missing_in_html',
        id,
        title: jsonItem.title,
        description: `Menu item "${jsonItem.title}" exists in JSON but not in HTML`,
        severity: 'warning'
      });
    }
  });

  // Check for differences in existing items
  htmlItems.forEach((htmlItem, id) => {
    const jsonItem = jsonItems.get(id);
    if (jsonItem) {
      // Check title differences
      if (htmlItem.title !== jsonItem.title) {
        issues.push({
          type: 'title_mismatch',
          id,
          description: `Title mismatch for ${id}: HTML="${htmlItem.title}", JSON="${jsonItem.title}"`,
          severity: 'error',
          htmlValue: htmlItem.title,
          jsonValue: jsonItem.title
        });
      }

      // Check URL differences
      const normalizedHtmlUrl = normalizeUrl(htmlItem.url);
      const normalizedJsonUrl = normalizeUrl(jsonItem.url);
      if (normalizedHtmlUrl !== normalizedJsonUrl) {
        issues.push({
          type: 'url_mismatch',
          id,
          description: `URL mismatch for ${id}: HTML="${normalizedHtmlUrl}", JSON="${normalizedJsonUrl}"`,
          severity: 'error',
          htmlValue: normalizedHtmlUrl,
          jsonValue: normalizedJsonUrl
        });
      }

      // Check children count differences
      const htmlChildrenCount = (htmlItem.children || []).length;
      const jsonChildrenCount = (jsonItem.children || []).length;
      if (htmlChildrenCount !== jsonChildrenCount) {
        issues.push({
          type: 'children_count_mismatch',
          id,
          description: `Children count mismatch for ${id}: HTML=${htmlChildrenCount}, JSON=${jsonChildrenCount}`,
          severity: 'warning',
          htmlValue: htmlChildrenCount,
          jsonValue: jsonChildrenCount
        });
      }
    }
  });

  return {
    isInSync: issues.length === 0,
    issues,
    totalIssues: issues.length,
    errorCount: issues.filter(i => i.severity === 'error').length,
    warningCount: issues.filter(i => i.severity === 'warning').length
  };
}

// Auto-sync menu by merging HTML items into JSON
function autoSyncMenus(htmlMenu, jsonMenu) {
  try {
    const syncedMenu = [...jsonMenu];
    const jsonItems = new Map(jsonMenu.map(item => [item.id, item]));
    const addedItems = [];

    // Add missing items from HTML to JSON
    htmlMenu.forEach(htmlItem => {
      if (!jsonItems.has(htmlItem.id)) {
        // Insert item maintaining order
        const insertIndex = htmlItem.order - 1;
        const itemToAdd = {
          id: htmlItem.id,
          title: htmlItem.title,
          url: normalizeUrl(htmlItem.url),
          order: htmlItem.order,
          children: htmlItem.children || []
        };

        syncedMenu.splice(insertIndex, 0, itemToAdd);
        addedItems.push(itemToAdd);
      }
    });

    // Reorder items to match HTML
    syncedMenu.sort((a, b) => {
      const htmlItemA = htmlMenu.find(item => item.id === a.id);
      const htmlItemB = htmlMenu.find(item => item.id === b.id);

      if (htmlItemA && htmlItemB) {
        return htmlItemA.order - htmlItemB.order;
      }
      if (htmlItemA) return -1;
      if (htmlItemB) return 1;
      return a.order - b.order;
    });

    // Update order numbers
    syncedMenu.forEach((item, index) => {
      item.order = index + 1;
    });

    return {
      success: true,
      syncedMenu,
      addedItems,
      message: `Successfully synced menu. Added ${addedItems.length} items.`
    };
  } catch (error) {
    return {
      success: false,
      error: `Auto-sync failed: ${error.message}`,
      syncedMenu: jsonMenu,
      addedItems: []
    };
  }
}

// Save synced menu back to JSON
function saveMenuToJSON(syncedMenu) {
  try {
    const menuPath = path.join(__dirname, '..', 'data', 'menu.json');
    const currentData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

    const updatedData = {
      ...currentData,
      mainMenu: syncedMenu,
      lastUpdated: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString()
    };

    fs.writeFileSync(menuPath, JSON.stringify(updatedData, null, 2));
    return { success: true, message: 'Menu saved successfully' };
  } catch (error) {
    return { success: false, error: `Failed to save menu: ${error.message}` };
  }
}

// Main validation function
export function validateMenuSync() {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const htmlResult = extractMenuFromHTML(htmlPath);
  const jsonResult = loadMenuFromJSON();

  if (htmlResult.error) {
    return {
      success: false,
      error: htmlResult.error,
      canSync: false
    };
  }

  if (jsonResult.error) {
    return {
      success: false,
      error: jsonResult.error,
      canSync: false
    };
  }

  const comparison = compareMenus(htmlResult.items, jsonResult.menu);

  return {
    success: true,
    sync: comparison,
    htmlMenu: htmlResult.items,
    jsonMenu: jsonResult.menu,
    canSync: true,
    lastChecked: new Date().toISOString()
  };
}

// Auto-sync function
export function performAutoSync() {
  const validation = validateMenuSync();

  if (!validation.success || !validation.canSync) {
    return {
      success: false,
      error: validation.error || 'Cannot perform sync - validation failed'
    };
  }

  if (validation.sync.isInSync) {
    return {
      success: true,
      message: 'Menus are already in sync',
      wasAlreadyInSync: true,
      addedItems: []
    };
  }

  const syncResult = autoSyncMenus(validation.htmlMenu, validation.jsonMenu);

  if (!syncResult.success) {
    return {
      success: false,
      error: syncResult.error
    };
  }

  const saveResult = saveMenuToJSON(syncResult.syncedMenu);

  if (!saveResult.success) {
    return {
      success: false,
      error: saveResult.error
    };
  }

  return {
    success: true,
    message: `Auto-sync completed. ${syncResult.addedItems.length} items added.`,
    addedItems: syncResult.addedItems,
    syncedMenu: syncResult.syncedMenu,
    wasAlreadyInSync: false
  };
}

// Get detailed sync status
export function getDetailedSyncStatus() {
  const validation = validateMenuSync();

  if (!validation.success) {
    return validation;
  }

  const htmlPath = path.join(__dirname, '..', 'index.html');
  const jsonPath = path.join(__dirname, '..', 'data', 'menu.json');

  return {
    ...validation,
    files: {
      html: {
        path: htmlPath,
        exists: fs.existsSync(htmlPath),
        lastModified: fs.existsSync(htmlPath) ? fs.statSync(htmlPath).mtime : null,
        itemCount: validation.htmlMenu?.length || 0
      },
      json: {
        path: jsonPath,
        exists: fs.existsSync(jsonPath),
        lastModified: fs.existsSync(jsonPath) ? fs.statSync(jsonPath).mtime : null,
        itemCount: validation.jsonMenu?.length || 0
      }
    }
  };
}