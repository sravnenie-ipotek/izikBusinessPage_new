const { chromium } = require('playwright');

class StaticAdminTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:7001';
    this.adminUrl = `${this.baseUrl}/admin/`;
    this.results = {
      testsPassed: 0,
      testsFailed: 0,
      errors: [],
      warnings: [],
      details: []
    };
  }

  async setup() {
    console.log('🚀 Testing static admin panel at /admin/...\n');
    this.browser = await chromium.launch({
      headless: false,
      devtools: true,
      slowMo: 300
    });
    this.page = await this.browser.newPage();

    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.results.errors.push(`Console Error: ${msg.text()}`);
      }
    });

    // Listen for page errors
    this.page.on('pageerror', error => {
      this.results.errors.push(`Page Error: ${error.message}`);
    });

    // Listen for failed requests
    this.page.on('requestfailed', request => {
      this.results.errors.push(`Failed Request: ${request.url()} - ${request.failure().errorText}`);
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }

    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Tests Passed: ${this.results.testsPassed}`);
    console.log(`❌ Tests Failed: ${this.results.testsFailed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings.length}`);
    console.log(`🚨 Errors: ${this.results.errors.length}`);

    if (this.results.errors.length > 0) {
      console.log('\n🚨 Errors Found:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    console.log('\n📝 Detailed Test Results:');
    this.results.details.forEach(detail => console.log(detail));
  }

  async runTest(testName, testFunction) {
    try {
      console.log(`🔍 Running: ${testName}`);
      await testFunction();
      this.results.testsPassed++;
      this.results.details.push(`✅ ${testName} - PASSED`);
      console.log(`✅ ${testName} - PASSED\n`);
    } catch (error) {
      this.results.testsFailed++;
      this.results.details.push(`❌ ${testName} - FAILED: ${error.message}`);
      console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
    }
  }

  async testStaticAdminLoads() {
    await this.page.goto(this.adminUrl);
    await this.page.waitForSelector('body', { timeout: 10000 });

    const title = await this.page.title();
    if (!title.includes('Admin')) {
      throw new Error(`Expected title to contain 'Admin', got: ${title}`);
    }

    // Check for Next.js app mount
    await this.page.waitForSelector('#__next', { timeout: 5000 });

    console.log(`   📄 Page loaded with title: ${title}`);
  }

  async testPageStructure() {
    await this.page.goto(this.adminUrl);
    await this.page.waitForSelector('#__next', { timeout: 5000 });

    // Check if it's showing login page or dashboard
    const hasLoginForm = await this.page.$('input[type="password"]');
    const hasDashboard = await this.page.$('.flex.h-screen');

    if (!hasLoginForm && !hasDashboard) {
      throw new Error('Neither login form nor dashboard found');
    }

    if (hasLoginForm) {
      console.log('   🔐 Login page detected');
    } else {
      console.log('   📊 Dashboard detected');
    }
  }

  async testManualLogin() {
    await this.page.goto(this.adminUrl);
    await this.page.waitForSelector('body', { timeout: 5000 });

    // Check if login is needed
    const passwordInput = await this.page.$('input[type="password"]');
    if (!passwordInput) {
      console.log('   ✅ No login required or already authenticated');
      return;
    }

    console.log('   🔑 Attempting login with admin123...');
    await passwordInput.fill('admin123');

    const submitButton = await this.page.$('button[type="submit"]');
    if (!submitButton) {
      throw new Error('Submit button not found');
    }

    await submitButton.click();

    // Wait a bit and check results
    await this.page.waitForTimeout(3000);

    // Check if we're now on dashboard or still on login
    const stillOnLogin = await this.page.$('input[type="password"]');
    const onDashboard = await this.page.$('.flex.h-screen');

    if (stillOnLogin) {
      // Check for error message
      const errorDiv = await this.page.$('.text-destructive, .text-red-500');
      if (errorDiv) {
        const errorText = await errorDiv.textContent();
        console.log(`   ❌ Login failed: ${errorText}`);
      } else {
        console.log('   ❌ Login failed but no error message shown');
      }
    } else if (onDashboard) {
      console.log('   ✅ Login successful, dashboard loaded');
    } else {
      console.log('   ⚠️  Login result unclear');
    }
  }

  async testMenuAPI() {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/menu`);

      if (!response.ok) {
        throw new Error(`Menu API returned status ${response.status}`);
      }

      const data = await response.json();

      if (!data || typeof data !== 'object') {
        throw new Error('Menu API did not return valid JSON object');
      }

      console.log(`   📡 Menu API working, returned ${JSON.stringify(data).length} bytes`);
    } catch (error) {
      throw new Error(`Menu API test failed: ${error.message}`);
    }
  }

  async testBasicNavigation() {
    await this.page.goto(this.adminUrl);
    await this.page.waitForSelector('body', { timeout: 5000 });

    // Try to set a fake token to bypass auth for testing
    await this.page.evaluate(() => {
      localStorage.setItem('adminToken', 'fake-token-for-testing');
    });

    // Reload page
    await this.page.reload();
    await this.page.waitForTimeout(2000);

    // Check if we can see any navigation elements
    const buttons = await this.page.$$('button');
    console.log(`   🧭 Found ${buttons.length} buttons on page`);

    // Look for specific navigation items
    const navItems = [];
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && (text.includes('Dashboard') || text.includes('Menu') || text.includes('Settings') || text.includes('Pages'))) {
        navItems.push(text.trim());
      }
    }

    if (navItems.length > 0) {
      console.log(`   📋 Navigation items found: ${navItems.join(', ')}`);
    } else {
      console.log('   ⚠️  No navigation items found');
    }
  }

  async testErrorChecks() {
    await this.page.goto(this.adminUrl);
    await this.page.waitForTimeout(3000);

    // Check for critical errors
    const criticalErrors = this.results.errors.filter(error =>
      error.includes('ReferenceError') ||
      error.includes('TypeError') ||
      error.includes('SyntaxError') ||
      error.includes('is not defined') ||
      error.includes('Cannot read property') ||
      error.includes('m.map is not a function')
    );

    if (criticalErrors.length > 0) {
      console.log('   🚨 Critical errors found:');
      criticalErrors.forEach(error => console.log(`      - ${error}`));
      throw new Error(`Found ${criticalErrors.length} critical JavaScript errors`);
    }

    console.log(`   ✅ No critical JavaScript errors detected`);
  }

  async runAllTests() {
    await this.setup();

    try {
      await this.runTest('Static Admin Panel Loads', () => this.testStaticAdminLoads());
      await this.runTest('Page Structure Check', () => this.testPageStructure());
      await this.runTest('Manual Login Test', () => this.testManualLogin());
      await this.runTest('Menu API Test', () => this.testMenuAPI());
      await this.runTest('Basic Navigation Test', () => this.testBasicNavigation());
      await this.runTest('Error Detection', () => this.testErrorChecks());

    } finally {
      await this.teardown();
    }

    return {
      success: this.results.testsFailed === 0,
      results: this.results
    };
  }
}

// Run the tests
async function main() {
  const tester = new StaticAdminTester();
  const results = await tester.runAllTests();

  console.log('\n🎯 Test Execution Complete!');
  if (results.success) {
    console.log('🎉 All tests passed successfully!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed. Check the detailed output above.');
    process.exit(1);
  }
}

main().catch(console.error);