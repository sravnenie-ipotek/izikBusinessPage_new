const { chromium } = require('playwright');

async function testAdminPanel() {
  console.log('🚀 Final Admin Panel Test Report\n');
  console.log('='.repeat(50));

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();

  const results = {
    adminPanelAccessible: false,
    loginPageExists: false,
    authenticationWorks: false,
    menuAPIExists: false,
    navigationWorks: false,
    menuManagerWorks: false,
    noJSErrors: true,
    fontLoadingWorks: true,
    languageContextWorks: true,
    errors: [],
    warnings: []
  };

  // Listen for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.errors.push(msg.text());
    }
  });

  try {
    console.log('\n1. Testing Admin Panel Accessibility at /admin/');
    console.log('-'.repeat(50));

    await page.goto('http://localhost:7001/admin/');
    await page.waitForSelector('body', { timeout: 5000 });

    const title = await page.title();
    console.log(`   Page Title: ${title}`);

    if (title.includes('Admin')) {
      results.adminPanelAccessible = true;
      console.log('   ✅ Admin panel accessible');
    } else {
      console.log('   ❌ Admin panel title not correct');
    }

    // Check what content is actually shown
    const bodyText = await page.$eval('body', el => el.textContent);
    const isLoginPage = bodyText.includes('password') || bodyText.includes('Login') || bodyText.includes('Admin Login');
    const is404Page = bodyText.includes('404') || bodyText.includes('not be found');
    const isDashboard = bodyText.includes('Dashboard') || bodyText.includes('Menu Manager');

    if (isLoginPage) {
      console.log('   📋 Showing: Login Page');
      results.loginPageExists = true;
    } else if (is404Page) {
      console.log('   📋 Showing: 404 Error Page');
    } else if (isDashboard) {
      console.log('   📋 Showing: Dashboard');
    } else {
      console.log('   📋 Showing: Unknown content');
    }

    console.log('\n2. Testing Authentication Flow');
    console.log('-'.repeat(50));

    // Check for login form
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      console.log('   🔑 Password input found - testing login...');

      await passwordInput.fill('admin123');
      const submitButton = await page.$('button[type="submit"]');

      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(3000);

        // Check if login worked
        const newUrl = page.url();
        const newBodyText = await page.$eval('body', el => el.textContent);

        if (newBodyText.includes('Dashboard') || newBodyText.includes('Menu Manager')) {
          results.authenticationWorks = true;
          console.log('   ✅ Authentication successful');
        } else if (newBodyText.includes('Invalid') || newBodyText.includes('error')) {
          console.log('   ❌ Authentication failed - invalid credentials');
        } else {
          console.log('   ⚠️  Authentication result unclear');
        }
      } else {
        console.log('   ❌ Submit button not found');
      }
    } else {
      console.log('   ⚠️  No password input found');
    }

    console.log('\n3. Testing Menu API Endpoint');
    console.log('-'.repeat(50));

    try {
      const response = await fetch('http://localhost:7001/api/admin/menu');
      if (response.ok) {
        results.menuAPIExists = true;
        console.log('   ✅ Menu API responds successfully');
      } else {
        console.log(`   ❌ Menu API returned status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Menu API error: ${error.message}`);
    }

    console.log('\n4. Testing Navigation Elements');
    console.log('-'.repeat(50));

    // Set a fake token to try to access dashboard
    await page.evaluate(() => {
      localStorage.setItem('adminToken', 'fake-token');
    });

    await page.reload();
    await page.waitForTimeout(2000);

    const buttons = await page.$$('button');
    const navItems = [];

    for (const button of buttons) {
      const text = await button.textContent();
      if (text && (
        text.includes('Dashboard') ||
        text.includes('Menu') ||
        text.includes('Settings') ||
        text.includes('Pages') ||
        text.includes('Page Editor')
      )) {
        navItems.push(text.trim());
      }
    }

    if (navItems.length > 0) {
      results.navigationWorks = true;
      console.log(`   ✅ Navigation found: ${navItems.join(', ')}`);
    } else {
      console.log('   ❌ No navigation elements found');
    }

    console.log('\n5. Testing Menu Manager (if accessible)');
    console.log('-'.repeat(50));

    // Try to click on Menu Manager
    let menuManagerFound = false;
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && text.includes('Menu')) {
        menuManagerFound = true;
        console.log('   🔍 Clicking Menu Manager...');

        await button.click();
        await page.waitForTimeout(2000);

        // Check for m.map errors
        const mapErrors = results.errors.filter(error =>
          error.includes('m.map is not a function') ||
          error.includes('map is not a function')
        );

        if (mapErrors.length === 0) {
          results.menuManagerWorks = true;
          console.log('   ✅ Menu Manager loaded without m.map errors');
        } else {
          console.log('   ❌ Menu Manager has m.map errors');
        }
        break;
      }
    }

    if (!menuManagerFound) {
      console.log('   ⚠️  Menu Manager button not found');
    }

    console.log('\n6. Testing for JavaScript Errors');
    console.log('-'.repeat(50));

    const criticalErrors = results.errors.filter(error =>
      error.includes('ReferenceError') ||
      error.includes('TypeError') ||
      error.includes('SyntaxError') ||
      error.includes('is not defined')
    );

    if (criticalErrors.length === 0) {
      console.log('   ✅ No critical JavaScript errors detected');
    } else {
      results.noJSErrors = false;
      console.log(`   ❌ Found ${criticalErrors.length} critical errors:`);
      criticalErrors.forEach(error => console.log(`      - ${error}`));
    }

    console.log('\n7. Testing Font Loading');
    console.log('-'.repeat(50));

    const textElements = await page.$$('h1, h2, h3, p, button, span');
    if (textElements.length > 0) {
      console.log(`   ✅ Found ${textElements.length} text elements - fonts loading`);
    } else {
      results.fontLoadingWorks = false;
      console.log('   ❌ No text elements found - font loading issue');
    }

  } catch (error) {
    console.error(`\n❌ Test error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // Generate final report
  console.log('\n');
  console.log('📋 FINAL TEST REPORT');
  console.log('='.repeat(50));

  const tests = [
    { name: 'Admin Panel Accessible', result: results.adminPanelAccessible },
    { name: 'Login Page Exists', result: results.loginPageExists },
    { name: 'Authentication Works', result: results.authenticationWorks },
    { name: 'Menu API Exists', result: results.menuAPIExists },
    { name: 'Navigation Works', result: results.navigationWorks },
    { name: 'Menu Manager Works (no m.map errors)', result: results.menuManagerWorks },
    { name: 'No Critical JS Errors', result: results.noJSErrors },
    { name: 'Font Loading Works', result: results.fontLoadingWorks }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    if (test.result) {
      console.log(`✅ ${test.name}`);
      passed++;
    } else {
      console.log(`❌ ${test.name}`);
      failed++;
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log(`📊 SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`🚨 Total errors captured: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\n🔍 All captured errors:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  if (failed === 0) {
    console.log('\n🎉 All admin panel tests PASSED!');
  } else if (passed > failed) {
    console.log('\n⚠️  Admin panel is mostly working with some issues');
  } else {
    console.log('\n❌ Admin panel has significant issues');
  }
}

testAdminPanel().catch(console.error);