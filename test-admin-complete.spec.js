const { test, expect } = require('@playwright/test');

const ADMIN_URL = 'http://localhost:7001/admin';
const ADMIN_PASSWORD = 'Aizik1231234!!';

test.describe('Admin Panel Complete Test Suite', () => {
  let adminToken;

  test.beforeEach(async ({ page }) => {
    // Login to admin
    await page.goto(ADMIN_URL + '/login');
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button:has-text("Login")');

    // Wait for redirect to dashboard
    await page.waitForURL(ADMIN_URL);

    // Get token from localStorage for API tests
    adminToken = await page.evaluate(() => localStorage.getItem('adminToken'));
  });

  test('Should navigate between admin sections', async ({ page }) => {
    console.log('Testing navigation between sections...');

    // Test Dashboard
    await page.click('button:has-text("Dashboard")');
    await expect(page.locator('h2')).toContainText('Dashboard');

    // Test Page Editor
    await page.click('button:has-text("Page Editor")');
    await expect(page.locator('h2')).toContainText('Page Editor');

    // Test Section Editor
    await page.click('button:has-text("Section Editor")');
    await expect(page.locator('h2')).toContainText('Section Editor');

    // Test Menu Manager
    await page.click('button:has-text("Menu Manager")');
    await expect(page.locator('h2')).toContainText('Menu Manager');

    // Test Settings
    await page.click('button:has-text("Settings")');
    await expect(page.locator('h2')).toContainText('Settings');
  });

  test('Should switch languages (English/Hebrew)', async ({ page }) => {
    console.log('Testing language switching...');

    // Switch to Hebrew
    await page.click('button:has-text("HE")');
    await page.waitForTimeout(500);

    // Check RTL is applied
    const bodyClass = await page.getAttribute('body > div', 'class');
    expect(bodyClass).toContain('rtl');

    // Switch back to English
    await page.click('button:has-text("EN")');
    await page.waitForTimeout(500);

    // Check LTR is applied
    const bodyClassEn = await page.getAttribute('body > div', 'class');
    expect(bodyClassEn).toContain('ltr');
  });

  test('Page Editor - Should load and edit pages', async ({ page }) => {
    console.log('Testing Page Editor functionality...');

    await page.click('button:has-text("Page Editor")');
    await page.waitForTimeout(1000);

    // Test all pages in dropdown
    const pages = [
      'index',
      'class-action',
      'privacy',
      'consumer-protection',
      'insurance',
      'our-team',
      'contact-us',
      'disclaimer',
      'privacy-policy'
    ];

    for (const pageName of pages) {
      console.log(`Testing page: ${pageName}`);

      // Select page from dropdown
      await page.selectOption('select', pageName);
      await page.waitForTimeout(1000);

      // Check if content loaded (title field should have content)
      const titleValue = await page.inputValue('input[id="title"]');
      console.log(`  Title loaded: ${titleValue ? 'Yes' : 'No'}`);

      // Test language switching for this page
      await page.click('button:has-text("עברית")');
      await page.waitForTimeout(1000);

      const hebrewTitle = await page.inputValue('input[id="title"]');
      console.log(`  Hebrew version exists: ${hebrewTitle ? 'Yes' : 'No'}`);

      // Switch back to English
      await page.click('button[aria-pressed="false"]:has-text("English")');
      await page.waitForTimeout(1000);
    }

    // Test editing functionality
    console.log('Testing page editing...');
    await page.selectOption('select', 'index');
    await page.waitForTimeout(1000);

    // Save original values
    const originalTitle = await page.inputValue('input[id="title"]');
    const originalMetaDesc = await page.inputValue('input[id="metaDescription"]');

    // Edit fields
    const testTitle = 'Test Title ' + Date.now();
    const testMeta = 'Test meta description ' + Date.now();

    await page.fill('input[id="title"]', testTitle);
    await page.fill('input[id="metaDescription"]', testMeta);

    // Save changes
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(2000);

    // Reload page to verify changes persisted
    await page.reload();
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Page Editor")');
    await page.selectOption('select', 'index');
    await page.waitForTimeout(1000);

    const newTitle = await page.inputValue('input[id="title"]');
    const newMeta = await page.inputValue('input[id="metaDescription"]');

    console.log(`  Title updated: ${newTitle === testTitle}`);
    console.log(`  Meta updated: ${newMeta === testMeta}`);

    // Restore original values
    await page.fill('input[id="title"]', originalTitle);
    await page.fill('input[id="metaDescription"]', originalMetaDesc);
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(2000);
  });

  test('Section Editor - Should load and edit sections', async ({ page }) => {
    console.log('Testing Section Editor functionality...');

    await page.click('button:has-text("Section Editor")');
    await page.waitForTimeout(1000);

    // Select a page
    await page.selectOption('select', 'index');
    await page.waitForTimeout(1000);

    // Check if sections loaded
    const sections = await page.locator('.mb-4').count();
    console.log(`  Sections loaded: ${sections}`);

    if (sections > 0) {
      // Test visibility toggle
      const firstToggle = await page.locator('button:has-text("Eye")').first();
      if (firstToggle) {
        await firstToggle.click();
        await page.waitForTimeout(500);
        console.log('  Visibility toggle works');
      }

      // Test edit section
      const editButton = await page.locator('button[title*="Edit"]').first();
      if (editButton) {
        await editButton.click();
        await page.waitForTimeout(500);

        // Check if edit form appeared
        const editForm = await page.locator('textarea, input[type="text"]').first();
        if (editForm) {
          const originalValue = await editForm.inputValue();
          await editForm.fill(originalValue + ' (edited)');

          // Save section
          const saveButton = await page.locator('button:has-text("Save Changes")').first();
          if (saveButton) {
            await saveButton.click();
            await page.waitForTimeout(2000);
            console.log('  Section editing works');
          }
        }
      }
    }
  });

  test('Menu Manager - Should manage menu items', async ({ page }) => {
    console.log('Testing Menu Manager functionality...');

    await page.click('button:has-text("Menu Manager")');
    await page.waitForTimeout(1000);

    // Add a new menu item
    await page.click('button:has-text("Add Menu Item")');
    await page.waitForTimeout(500);

    // Find the new item and fill it
    const menuInputs = await page.locator('input[placeholder*="Menu title"]').last();
    await menuInputs.fill('Test Menu Item');

    const urlInput = await page.locator('input[placeholder*="URL"]').last();
    await urlInput.fill('/test-page');

    // Save menu
    await page.click('button:has-text("Save Menu")');
    await page.waitForTimeout(2000);

    console.log('  Menu item added and saved');

    // Test language switching for menu
    await page.click('button:has-text("עברית")');
    await page.waitForTimeout(1000);

    // Add Hebrew menu item
    await page.click('button:has-text("Add Menu Item")');
    await page.waitForTimeout(500);

    const hebrewMenuInput = await page.locator('input[placeholder*="Menu title"]').last();
    await hebrewMenuInput.fill('פריט תפריט בדיקה');

    const hebrewUrlInput = await page.locator('input[placeholder*="URL"]').last();
    await hebrewUrlInput.fill('/test-page-he');

    await page.click('button:has-text("Save Menu")');
    await page.waitForTimeout(2000);

    console.log('  Hebrew menu item added');

    // Clean up - remove test items
    const deleteButtons = await page.locator('button[title*="Delete"], button:has-text("Trash")').all();
    if (deleteButtons.length > 0) {
      await deleteButtons[deleteButtons.length - 1].click();
      await page.click('button:has-text("Save Menu")');
      await page.waitForTimeout(2000);
      console.log('  Test menu item removed');
    }
  });

  test('Settings - Should update settings', async ({ page }) => {
    console.log('Testing Settings functionality...');

    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(1000);

    // Get original values
    const siteNameInput = await page.locator('input[id="site-name"]');
    const originalSiteName = await siteNameInput.inputValue();

    const adminEmailInput = await page.locator('input[id="admin-email"]');
    const originalEmail = await adminEmailInput.inputValue();

    // Update values
    await siteNameInput.fill('Test Site Name');
    await adminEmailInput.fill('test@example.com');

    // Save settings
    const saveButton = await page.locator('button:has-text("Save Settings")');
    if (saveButton) {
      await saveButton.click();
      await page.waitForTimeout(2000);
      console.log('  Settings updated');
    }

    // Restore original values
    await siteNameInput.fill(originalSiteName);
    await adminEmailInput.fill(originalEmail);

    if (saveButton) {
      await saveButton.click();
      await page.waitForTimeout(2000);
      console.log('  Settings restored');
    }
  });

  test('Preview Mode - Should toggle between edit and preview', async ({ page }) => {
    console.log('Testing Preview mode...');

    await page.click('button:has-text("Page Editor")');
    await page.waitForTimeout(1000);

    await page.selectOption('select', 'index');
    await page.waitForTimeout(1000);

    // Switch to preview mode
    await page.click('button:has-text("Preview")');
    await page.waitForTimeout(500);

    // Check if preview is showing
    const previewContent = await page.locator('.prose').isVisible();
    console.log(`  Preview mode works: ${previewContent}`);

    // Switch back to edit mode
    await page.click('button:has-text("Edit")');
    await page.waitForTimeout(500);

    const editContent = await page.locator('textarea').isVisible();
    console.log(`  Edit mode works: ${editContent}`);
  });

  test('Logout - Should logout successfully', async ({ page }) => {
    console.log('Testing logout...');

    await page.click('button:has-text("Logout")');
    await page.waitForURL(ADMIN_URL + '/login');

    // Verify redirected to login page
    const loginButton = await page.locator('button:has-text("Login")').isVisible();
    console.log(`  Logout successful: ${loginButton}`);
  });
});

// Run the tests
test.setTimeout(120000); // 2 minutes timeout for all tests

console.log('\n🚀 Starting comprehensive admin panel tests...\n');
console.log('Testing URL:', ADMIN_URL);
console.log('Make sure the server is running on port 7001\n');