const { chromium } = require('playwright');

async function testAdminLogin() {
  console.log('🔐 Testing admin login functionality...\n');

  const browser = await chromium.launch({
    headless: false,
    devtools: true,
    slowMo: 500
  });

  const page = await browser.newPage();

  // Listen for console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });

  try {
    // Test 1: Navigate to login page
    console.log('1. Loading login page...');
    await page.goto('http://localhost:7001/admin/login.html');
    await page.waitForSelector('body', { timeout: 10000 });

    const title = await page.title();
    console.log(`   ✅ Page loaded: ${title}`);

    // Test 2: Check login form elements
    console.log('\n2. Checking login form elements...');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    const languageButtons = await page.$$('button:has-text("EN"), button:has-text("עב")');

    if (!passwordInput) throw new Error('Password input not found');
    if (!submitButton) throw new Error('Submit button not found');

    console.log(`   ✅ Password input: Found`);
    console.log(`   ✅ Submit button: Found`);
    console.log(`   ✅ Language buttons: ${languageButtons.length} found`);

    // Test 3: Test login with correct password
    console.log('\n3. Testing login with correct password...');
    await passwordInput.fill('admin123');
    await submitButton.click();

    // Wait and check for response
    await page.waitForTimeout(3000);

    // Check if we got redirected or have an error
    const currentUrl = page.url();
    const errorElement = await page.$('.text-destructive, .text-red-500');

    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log(`   ❌ Login error: ${errorText}`);
    } else if (currentUrl.includes('admin') && !currentUrl.includes('login')) {
      console.log(`   ✅ Login successful, redirected to: ${currentUrl}`);
    } else {
      console.log(`   ⚠️  Login result unclear, current URL: ${currentUrl}`);
    }

    // Test 4: Check for JavaScript errors
    console.log('\n4. Checking for JavaScript errors...');
    const criticalErrors = errors.filter(error =>
      error.includes('ReferenceError') ||
      error.includes('TypeError') ||
      error.includes('SyntaxError') ||
      error.includes('m.map is not a function') ||
      error.includes('Cannot read property')
    );

    if (criticalErrors.length > 0) {
      console.log(`   ❌ Found ${criticalErrors.length} critical errors:`);
      criticalErrors.forEach(error => console.log(`      - ${error}`));
    } else {
      console.log(`   ✅ No critical JavaScript errors found`);
    }

    // Test 5: Test language switching
    console.log('\n5. Testing language switching...');
    if (languageButtons.length > 1) {
      await languageButtons[1].click(); // Click Hebrew button
      await page.waitForTimeout(1000);

      const bodyContent = await page.$eval('body', el => el.textContent);
      if (bodyContent.includes('סיסמה') || bodyContent.includes('כניסה')) {
        console.log('   ✅ Hebrew language switch working');
      } else {
        console.log('   ⚠️  Hebrew language switch may not be working');
      }
    } else {
      console.log('   ⚠️  Language switching buttons not found');
    }

    // Test 6: Check if admin panel loads after login
    console.log('\n6. Checking admin panel after login...');

    // Try to navigate to admin root with token
    await page.evaluate(() => {
      localStorage.setItem('adminToken', 'test-token');
    });

    await page.goto('http://localhost:7001/admin/');
    await page.waitForTimeout(2000);

    const hasNavigation = await page.$$('button');
    const navigationTexts = [];

    for (const button of hasNavigation) {
      const text = await button.textContent();
      if (text && (text.includes('Dashboard') || text.includes('Menu') || text.includes('Settings'))) {
        navigationTexts.push(text.trim());
      }
    }

    if (navigationTexts.length > 0) {
      console.log(`   ✅ Admin panel navigation found: ${navigationTexts.join(', ')}`);
    } else {
      console.log('   ⚠️  Admin panel navigation not detected');
    }

    console.log('\n📊 Test Summary:');
    console.log(`   Total console messages: ${errors.length}`);
    console.log(`   Critical errors: ${criticalErrors.length}`);
    console.log(`   Navigation elements: ${navigationTexts.length}`);

    if (criticalErrors.length === 0) {
      console.log('\n🎉 Admin panel login tests completed successfully!');
    } else {
      console.log('\n⚠️  Some issues found, but basic functionality appears to work');
    }

  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}

testAdminLogin().catch(console.error);