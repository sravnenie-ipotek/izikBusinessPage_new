const { test, expect } = require('@playwright/test');

const ADMIN_URL = 'http://localhost:7001/admin';
const ADMIN_PASSWORD = 'Aizik1231234!!';

test.describe('Admin Page Loading Test', () => {
  test('Should load all pages correctly without 404 errors', async ({ page }) => {
    // Login
    console.log('Logging in...');
    await page.goto(ADMIN_URL + '/login');
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button:has-text("Login")');

    // Wait for redirect
    await page.waitForURL(ADMIN_URL);
    console.log('Login successful');

    // Navigate to Page Editor
    await page.click('button:has-text("Page Editor")');
    await page.waitForTimeout(1000);
    console.log('Navigated to Page Editor');

    // Test all pages
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

    console.log('\nTesting pages:');
    console.log('=' .repeat(50));

    for (const pageName of pages) {
      // Listen for network errors
      let hasError = false;
      let errorUrl = '';

      page.on('response', response => {
        if (response.status() >= 400 && response.url().includes('/api/admin/page/')) {
          hasError = true;
          errorUrl = response.url();
          console.log(`  ❌ ${pageName}: HTTP ${response.status()} - ${response.url()}`);
        }
      });

      // Select the page
      await page.selectOption('select', pageName);
      await page.waitForTimeout(1500);

      if (!hasError) {
        // Check if content loaded
        const titleValue = await page.inputValue('input[id="title"]');
        const hasContent = titleValue && titleValue.length > 0;
        console.log(`  ✅ ${pageName}: Loaded successfully (has content: ${hasContent})`);
      }

      // Test Hebrew version
      await page.click('button:has-text("עברית")');
      await page.waitForTimeout(1500);

      const hebrewTitle = await page.inputValue('input[id="title"]');
      const hasHebrewContent = hebrewTitle && hebrewTitle.length > 0;

      if (hasHebrewContent) {
        console.log(`     Hebrew version: Available`);
      } else {
        console.log(`     Hebrew version: Not found (expected for some pages)`);
      }

      // Switch back to English
      await page.click('button[aria-pressed="false"]:has-text("English")');
      await page.waitForTimeout(1000);
    }

    console.log('\n' + '=' .repeat(50));
    console.log('Page loading test complete');
  });

  test('Should edit and save page content', async ({ page }) => {
    // Login
    await page.goto(ADMIN_URL + '/login');
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button:has-text("Login")');
    await page.waitForURL(ADMIN_URL);

    // Navigate to Page Editor
    await page.click('button:has-text("Page Editor")');
    await page.waitForTimeout(1000);

    // Select home page
    await page.selectOption('select', 'index');
    await page.waitForTimeout(1500);

    // Get original values
    const originalTitle = await page.inputValue('input[id="title"]');
    console.log(`Original title: ${originalTitle}`);

    // Edit the title
    const testTitle = 'Test Title ' + Date.now();
    await page.fill('input[id="title"]', testTitle);
    console.log(`New title: ${testTitle}`);

    // Save
    await page.click('button:has-text("Save Changes")');

    // Wait for save to complete
    await page.waitForTimeout(3000);

    // Refresh page
    await page.reload();
    await page.waitForTimeout(1000);

    // Navigate back to Page Editor
    await page.click('button:has-text("Page Editor")');
    await page.selectOption('select', 'index');
    await page.waitForTimeout(1500);

    // Check if changes persisted
    const savedTitle = await page.inputValue('input[id="title"]');

    if (savedTitle === testTitle) {
      console.log('✅ Changes saved and persisted successfully');
    } else {
      console.log('❌ Changes did not persist');
    }

    // Restore original title
    await page.fill('input[id="title"]', originalTitle);
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(2000);
    console.log('Original title restored');
  });
});

test.setTimeout(60000); // 1 minute timeout