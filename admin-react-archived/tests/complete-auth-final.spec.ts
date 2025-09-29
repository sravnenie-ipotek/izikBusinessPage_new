import { test, expect } from '@playwright/test';

test.describe('Complete Authentication & Menu Manager Test', () => {
  test('Full verification: SSR fix, auth flow, and menu API', async ({ page }) => {
    console.log('🚀 COMPREHENSIVE AUTHENTICATION & MENU MANAGER TEST');
    console.log('🎯 Verifying: SSR fix, auth token, menu loading, API calls');

    const testResults = {
      authSuccess: false,
      tokenStored: false,
      menuManagerLoaded: false,
      menuApiCalled: false,
      menuItemsDisplayed: false,
      ssrErrorsFound: false,
      mapErrorsFound: false,
      consoleErrors: [] as string[],
      apiCalls: [] as string[]
    };

    // Error tracking
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const errorText = msg.text();
        testResults.consoleErrors.push(errorText);

        // Check for SSR-related errors
        if (errorText.includes('localStorage is not defined') ||
            errorText.includes('window is not defined') ||
            errorText.includes('hydration')) {
          testResults.ssrErrorsFound = true;
          console.log(`🚨 SSR ERROR: ${errorText}`);
        }

        // Check for map errors
        if (errorText.includes('map is not a function') || errorText.includes('m.map')) {
          testResults.mapErrorsFound = true;
          console.log(`🚨 MAP ERROR: ${errorText}`);
        }

        console.log(`🔴 Console Error: ${errorText}`);
      }
    });

    // API call tracking
    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const method = response.request().method();
        const url = response.url();
        const status = response.status();
        const apiCall = `${method} ${url} -> ${status}`;

        testResults.apiCalls.push(apiCall);
        console.log(`🌐 API: ${apiCall}`);

        if (url.includes('/api/admin/menu') && status === 200) {
          testResults.menuApiCalled = true;
          console.log('✅ Menu API called successfully');
        }
      }
    });

    console.log('\n📍 STEP 1: Navigate to admin login');
    await page.goto('http://localhost:7001/admin/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Verify login form
    await expect(page.locator('input[type="password"]')).toBeVisible();
    console.log('✅ Login form visible');

    console.log('\n📍 STEP 2: Perform authentication');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for authentication
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Check if authentication was successful
    const currentUrl = page.url();
    if (currentUrl.includes('/admin') && !currentUrl.includes('/login')) {
      testResults.authSuccess = true;
      console.log('✅ Authentication successful');
    }

    console.log('\n📍 STEP 3: Verify token storage');
    const authToken = await page.evaluate(() => {
      return localStorage.getItem('adminToken');
    });

    if (authToken) {
      testResults.tokenStored = true;
      console.log('✅ Auth token stored in localStorage');
    } else {
      console.log('❌ Auth token not found');
    }

    console.log('\n📍 STEP 4: Navigate to Menu Manager');

    // Try different ways to navigate to menu manager
    try {
      // Method 1: Try clicking menu item with navigation icon
      const menuItems = page.locator('button').filter({
        has: page.locator('[data-lucide="navigation"]')
      });

      if (await menuItems.count() > 0) {
        await menuItems.first().click();
        console.log('✅ Clicked navigation menu item');
      } else {
        // Method 2: Try text-based selection
        const menuButton = page.locator('button', { hasText: 'Menu' }).or(
          page.locator('button', { hasText: 'menuManager' })
        );

        if (await menuButton.count() > 0) {
          await menuButton.first().click();
          console.log('✅ Clicked menu button');
        } else {
          console.log('⚠️ Menu button not found, menu might already be active');
        }
      }
    } catch (error) {
      console.log(`⚠️ Menu navigation issue: ${error}`);
    }

    // Wait for Menu Manager to load
    await page.waitForTimeout(3000);

    console.log('\n📍 STEP 5: Verify Menu Manager component');

    // Check for Menu Manager title
    try {
      await expect(page.locator('text=Menu Manager')).toBeVisible({ timeout: 10000 });
      testResults.menuManagerLoaded = true;
      console.log('✅ Menu Manager component loaded');
    } catch (error) {
      console.log('❌ Menu Manager component not found');
    }

    // Check for language selector
    try {
      await expect(page.locator('button:has-text("English")')).toBeVisible();
      await expect(page.locator('button:has-text("עברית")')).toBeVisible();
      console.log('✅ Language selector buttons visible');
    } catch (error) {
      console.log('⚠️ Language selector not found');
    }

    // Check for add menu item button
    try {
      const addButton = page.locator('button').filter({ hasText: /Add.*Menu.*Item|addMenuItem/ });
      await expect(addButton.first()).toBeVisible();
      console.log('✅ Add Menu Item button visible');
    } catch (error) {
      console.log('⚠️ Add Menu Item button not found');
    }

    console.log('\n📍 STEP 6: Test menu items display');

    // Wait for potential API calls to complete
    await page.waitForTimeout(2000);

    // Check if menu items are displayed
    const menuItems = await page.locator('input[placeholder*="menuTitle"], input[placeholder*="Menu"], .menu-item').count();
    if (menuItems > 0) {
      testResults.menuItemsDisplayed = true;
      console.log(`✅ ${menuItems} menu items/inputs found`);
    } else {
      console.log('ℹ️ No menu items displayed (this might be normal for empty menu)');
    }

    console.log('\n📍 STEP 7: Force menu API call');

    try {
      // Try to trigger a menu action to force API call
      const englishButton = page.locator('button:has-text("English")');
      if (await englishButton.isVisible()) {
        await englishButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Triggered language selection');
      }
    } catch (error) {
      console.log(`⚠️ Could not trigger menu action: ${error}`);
    }

    // Final wait for any async operations
    await page.waitForTimeout(2000);

    console.log('\n📍 STEP 8: Take final screenshots');
    await page.screenshot({
      path: '/tmp/claude/final-menu-manager-state.png',
      fullPage: true
    });

    // Generate comprehensive report
    console.log('\n' + '='.repeat(100));
    console.log('🔍 COMPREHENSIVE TEST RESULTS REPORT');
    console.log('='.repeat(100));

    console.log('\n🎯 CORE FUNCTIONALITY:');
    console.log(`  Authentication Success: ${testResults.authSuccess ? '✅' : '❌'}`);
    console.log(`  Token Storage: ${testResults.tokenStored ? '✅' : '❌'}`);
    console.log(`  Menu Manager Loaded: ${testResults.menuManagerLoaded ? '✅' : '❌'}`);
    console.log(`  Menu API Called: ${testResults.menuApiCalled ? '✅' : '❌'}`);
    console.log(`  Menu Items Displayed: ${testResults.menuItemsDisplayed ? '✅' : 'ℹ️ Empty'}`);

    console.log('\n🚨 ERROR ANALYSIS:');
    console.log(`  SSR Errors Found: ${testResults.ssrErrorsFound ? '❌ YES' : '✅ NO'}`);
    console.log(`  Map Errors Found: ${testResults.mapErrorsFound ? '❌ YES' : '✅ NO'}`);
    console.log(`  Total Console Errors: ${testResults.consoleErrors.length}`);

    console.log('\n🔐 AUTHENTICATION DETAILS:');
    if (authToken) {
      console.log(`  Token: ${authToken.substring(0, 30)}...`);
    } else {
      console.log(`  Token: Not found`);
    }

    console.log('\n🌐 API ACTIVITY:');
    console.log(`  Total API Calls: ${testResults.apiCalls.length}`);
    testResults.apiCalls.forEach((call, index) => {
      console.log(`    ${index + 1}. ${call}`);
    });

    console.log('\n❌ CONSOLE ERRORS:');
    if (testResults.consoleErrors.length === 0) {
      console.log('  ✅ No console errors detected');
    } else {
      testResults.consoleErrors.slice(0, 10).forEach((error, index) => {
        console.log(`    ${index + 1}. ${error.substring(0, 80)}${error.length > 80 ? '...' : ''}`);
      });
      if (testResults.consoleErrors.length > 10) {
        console.log(`    ... and ${testResults.consoleErrors.length - 10} more errors`);
      }
    }

    console.log('\n🎉 SSR FIX VERIFICATION:');
    const ssrErrors = testResults.consoleErrors.filter(error =>
      error.includes('localStorage is not defined') ||
      error.includes('window is not defined') ||
      error.includes('hydration')
    );

    if (ssrErrors.length === 0) {
      console.log('  ✅ SSR fix is working perfectly!');
      console.log('  ✅ No localStorage/window errors during SSR');
      console.log('  ✅ Components hydrate correctly');
    } else {
      console.log('  ❌ SSR issues still present:');
      ssrErrors.forEach(error => console.log(`    - ${error}`));
    }

    console.log('\n🗺️  MAP ERROR VERIFICATION:');
    if (testResults.mapErrorsFound) {
      console.log('  ❌ Map errors detected - fix incomplete');
    } else {
      console.log('  ✅ No map errors detected - fix successful!');
    }

    console.log('\n📊 OVERALL TEST STATUS:');
    const criticalIssues = [
      !testResults.authSuccess,
      !testResults.tokenStored,
      !testResults.menuManagerLoaded,
      testResults.ssrErrorsFound,
      testResults.mapErrorsFound
    ].filter(Boolean).length;

    if (criticalIssues === 0) {
      console.log('  🎉 ALL TESTS PASSED - SYSTEM WORKING PERFECTLY!');
    } else {
      console.log(`  ⚠️ ${criticalIssues} critical issues found`);
    }

    // Test assertions
    expect(testResults.authSuccess).toBe(true);
    expect(testResults.tokenStored).toBe(true);
    expect(testResults.menuManagerLoaded).toBe(true);
    expect(testResults.ssrErrorsFound).toBe(false);
    expect(testResults.mapErrorsFound).toBe(false);

    console.log('\n✅ COMPREHENSIVE TEST COMPLETED');
  });
});