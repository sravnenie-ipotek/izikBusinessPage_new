import { test, expect } from '@playwright/test';

test.describe('Authentication Flow - SSR Fix Verification', () => {
  test('Complete auth flow: Login → MenuManager (verifying localStorage SSR fix)', async ({ page }) => {
    console.log('🚀 Starting authentication flow test...');
    console.log('🎯 Verifying localStorage SSR fix and map error resolution');

    const consoleErrors: string[] = [];
    const mapErrors: string[] = [];

    // Track console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const errorText = msg.text();
        consoleErrors.push(errorText);
        console.log(`🔴 Console Error: ${errorText}`);

        // Check for map-related errors
        if (errorText.includes('map is not a function') || errorText.includes('m.map')) {
          mapErrors.push(errorText);
          console.log(`🚨 MAP ERROR DETECTED: ${errorText}`);
        }
      }
    });

    // Step 1: Navigate to admin login
    console.log('📍 Step 1: Navigating to admin login...');
    await page.goto('http://localhost:7001/admin/login', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: '/tmp/claude/01-login-page.png' });

    // Verify login form is visible
    await expect(page.locator('input[type="password"]')).toBeVisible();
    console.log('✅ Login form is visible');

    // Step 2: Login with credentials
    console.log('📍 Step 2: Performing login...');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for navigation/redirect
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/claude/02-after-login.png' });

    // Check if we're on the dashboard
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);

    // Step 3: Verify authentication token is stored
    console.log('📍 Step 3: Checking authentication token...');
    const authToken = await page.evaluate(() => {
      return localStorage.getItem('adminToken');
    });

    expect(authToken).toBeTruthy();
    console.log('✅ Authentication token is stored in localStorage');

    // Step 4: Navigate to Menu Manager
    console.log('📍 Step 4: Navigating to Menu Manager...');

    // Try to find and click menu button
    try {
      const menuButton = page.locator('button:has-text("Menu"), button:has-text("menuManager"), button[data-id="menu"]');
      await menuButton.first().click();
      console.log('✅ Clicked on Menu Manager button');
    } catch (error) {
      console.log('⚠️ Menu button not found, using navigation');
      // If button not found, try looking for the menu item with Navigation icon
      const navButton = page.locator('button').filter({ has: page.locator('[data-lucide="navigation"]') });
      if (await navButton.count() > 0) {
        await navButton.click();
        console.log('✅ Clicked on Navigation menu item');
      }
    }

    // Wait for Menu Manager to load
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/claude/03-menu-manager.png' });

    // Step 5: Verify MenuManager component loaded properly
    console.log('📍 Step 5: Verifying MenuManager component...');

    // Check if MenuManager card is visible
    const menuManagerCard = page.locator('text=Menu Manager').first();
    await expect(menuManagerCard).toBeVisible({ timeout: 10000 });
    console.log('✅ MenuManager component is visible');

    // Check for language buttons (indicates MenuManager is properly rendered)
    const englishButton = page.locator('button:has-text("English")');
    const hebrewButton = page.locator('button:has-text("עברית")');

    await expect(englishButton).toBeVisible();
    await expect(hebrewButton).toBeVisible();
    console.log('✅ Language selector buttons are visible');

    // Check for "Add Menu Item" button
    const addMenuButton = page.locator('button:has-text("Add"), button:has-text("addMenuItem")');
    await expect(addMenuButton.first()).toBeVisible();
    console.log('✅ Add Menu Item button is visible');

    // Step 6: Test menu API calls
    console.log('📍 Step 6: Testing menu API interactions...');

    // Monitor network requests
    const menuApiCalls: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/api/admin/menu')) {
        menuApiCalls.push(`${response.request().method()} ${response.url()} -> ${response.status()}`);
        console.log(`🌐 Menu API: ${response.request().method()} ${response.url()} -> ${response.status()}`);
      }
    });

    // Try to add a menu item to trigger API call
    try {
      await addMenuButton.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ Add menu item button clicked');
    } catch (error) {
      console.log(`⚠️ Could not click add menu item: ${error}`);
    }

    // Step 7: Final verification
    console.log('📍 Step 7: Final verification...');
    await page.screenshot({ path: '/tmp/claude/04-final-state.png' });

    // Wait a moment for any final async operations
    await page.waitForTimeout(2000);

    // Generate report
    console.log('\n' + '='.repeat(80));
    console.log('🔍 AUTHENTICATION FLOW TEST REPORT');
    console.log('='.repeat(80));

    console.log(`\n📊 SUMMARY:`);
    console.log(`✅ Authentication: ${authToken ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ MenuManager Loaded: SUCCESS`);
    console.log(`✅ Console Errors: ${consoleErrors.length} detected`);
    console.log(`✅ Map Errors: ${mapErrors.length} detected`);
    console.log(`✅ Menu API Calls: ${menuApiCalls.length} made`);

    console.log(`\n🔐 AUTHENTICATION DETAILS:`);
    console.log(`Token Present: ${authToken ? '✅ YES' : '❌ NO'}`);
    if (authToken) {
      console.log(`Token Preview: ${authToken.substring(0, 20)}...`);
    }

    console.log(`\n🍴 MENU MANAGER STATUS:`);
    console.log(`Component Visible: ✅ YES`);
    console.log(`Language Buttons: ✅ YES`);
    console.log(`Add Button: ✅ YES`);

    console.log(`\n❌ CONSOLE ERRORS (${consoleErrors.length}):`);
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors detected');
    } else {
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log(`\n🚨 MAP ERRORS (${mapErrors.length}):`);
    if (mapErrors.length === 0) {
      console.log('✅ No map errors detected - SSR fix is working!');
    } else {
      mapErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log(`\n🌐 API CALLS (${menuApiCalls.length}):`);
    if (menuApiCalls.length === 0) {
      console.log('ℹ️ No menu API calls detected (this is normal if no actions were taken)');
    } else {
      menuApiCalls.forEach((call, index) => {
        console.log(`  ${index + 1}. ${call}`);
      });
    }

    console.log(`\n🎯 SSR FIX VERIFICATION:`);
    const ssrErrors = consoleErrors.filter(error =>
      error.includes('localStorage is not defined') ||
      error.includes('window is not defined') ||
      error.includes('hydration') ||
      error.includes('server') && error.includes('client')
    );

    if (ssrErrors.length === 0) {
      console.log('✅ No SSR-related errors detected - fix is successful!');
    } else {
      console.log('❌ SSR-related errors still present:');
      ssrErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // Final assertions
    expect(authToken).toBeTruthy();
    expect(mapErrors).toHaveLength(0);
    expect(ssrErrors).toHaveLength(0);

    console.log('\n✅ Authentication flow test completed successfully!');
  });
});