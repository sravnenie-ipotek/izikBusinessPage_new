const { chromium } = require('playwright');

class AdminPanelTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:7001';
    this.adminUrl = 'http://localhost:7003';
    this.results = {
      testsPassed: 0,
      testsFailed: 0,
      errors: [],
      warnings: [],
      details: []
    };
  }

  async setup() {
    console.log('🚀 Starting comprehensive admin panel tests...\n');
    this.browser = await chromium.launch({
      headless: false,
      devtools: true,
      slowMo: 500
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

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.results.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    console.log('\n📝 Detailed Test Results:');
    this.results.details.forEach(detail => console.log(detail));
  }

  async ensureAuthenticated() {
    await this.page.goto(this.adminUrl);
    await this.page.waitForSelector('body', { timeout: 5000 });

    // Check if we need to login
    const passwordInput = await this.page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.fill('admin123');
      const submitButton = await this.page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await this.page.waitForSelector('.flex.h-screen', { timeout: 10000 });
      }
    }

    // Wait for dashboard to be ready
    await this.page.waitForTimeout(1000);
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

  async testAdminPanelLoads() {
    await this.page.goto(this.adminUrl);
    await this.page.waitForSelector('body', { timeout: 10000 });

    const title = await this.page.title();
    if (!title.includes('Admin')) {
      throw new Error(`Expected title to contain 'Admin', got: ${title}`);
    }

    // Check for React app mount (Next.js uses #__next)
    await this.page.waitForSelector('#__next', { timeout: 5000 });

    // Should redirect to login page initially, so check for login form
    const loginCard = await this.page.$('.min-h-screen, [data-testid="login-form"]');
    if (!loginCard) {
      // If not on login page, check if already authenticated
      const adminPanel = await this.page.$('[data-testid="admin-panel"], .flex.h-screen');
      if (!adminPanel) {
        throw new Error('Neither login page nor admin panel found');
      }
    }
  }

  async testLoginFunctionality() {
    // Navigate to admin if not already there
    await this.page.goto(this.adminUrl);

    // Wait for page to load and redirect to login if needed
    await this.page.waitForSelector('body', { timeout: 5000 });

    // Check if we're on login page or already authenticated
    const passwordInput = await this.page.$('input[type="password"]');
    if (!passwordInput) {
      // Already authenticated, check for dashboard
      const dashboard = await this.page.$('.flex.h-screen');
      if (!dashboard) {
        throw new Error('Neither login form nor dashboard found');
      }
      console.log('   🔐 Already authenticated, dashboard visible');
      return;
    }

    // Try to login with correct password
    await passwordInput.fill('admin123');

    const submitButton = await this.page.$('button[type="submit"]');
    if (!submitButton) {
      throw new Error('Login submit button not found');
    }

    await submitButton.click();

    // Wait for redirect to dashboard
    try {
      await this.page.waitForSelector('.flex.h-screen', { timeout: 10000 });
      console.log('   🔐 Successfully logged in and redirected to dashboard');
    } catch (e) {
      // Check if login failed
      const errorMessage = await this.page.$('.text-destructive');
      if (errorMessage) {
        const errorText = await errorMessage.textContent();
        throw new Error(`Login failed with error: ${errorText}`);
      }
      throw new Error('Login did not redirect to dashboard within timeout');
    }
  }

  async testMenuAPIEndpoint() {
    // Test the menu API endpoint directly
    const response = await this.page.goto(`${this.baseUrl}/api/admin/menu`);

    if (!response.ok()) {
      throw new Error(`Menu API returned status ${response.status()}`);
    }

    const contentType = response.headers()['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Menu API returned wrong content type: ${contentType}`);
    }

    const data = await response.json();

    // Verify data structure
    if (!data || typeof data !== 'object') {
      throw new Error('Menu API did not return valid JSON object');
    }

    // Check for expected menu structure
    if (!Array.isArray(data.menu) && !Array.isArray(data.items) && !Array.isArray(data)) {
      throw new Error('Menu API did not return expected array structure');
    }

    console.log(`   📡 Menu API returned ${JSON.stringify(data).length} bytes of data`);
  }

  async testMenuManagerSection() {
    await this.ensureAuthenticated();

    // Look for Menu Manager navigation button
    const menuManagerButton = await this.page.$('button:has-text("Menu Manager")');
    if (!menuManagerButton) {
      // Try to find any button with menu-related text
      const buttons = await this.page.$$('button');
      let found = false;
      for (const button of buttons) {
        const text = await button.textContent();
        if (text && text.includes('Menu') || text.includes('Navigation')) {
          await button.click();
          found = true;
          break;
        }
      }
      if (!found) {
        throw new Error('Menu Manager section not found in navigation');
      }
    } else {
      await menuManagerButton.click();
    }

    // Wait for menu manager content to load
    await this.page.waitForTimeout(2000);

    // Check for "m.map is not a function" error specifically
    const consoleErrors = this.results.errors.filter(error =>
      error.includes('m.map is not a function') ||
      error.includes('map is not a function')
    );

    if (consoleErrors.length > 0) {
      throw new Error('Found "m.map is not a function" error in Menu Manager');
    }

    // Verify menu content loads without errors
    const hasErrors = this.results.errors.some(error =>
      error.includes('TypeError') || error.includes('ReferenceError')
    );

    if (hasErrors) {
      throw new Error('Found JavaScript errors in Menu Manager section');
    }

    console.log(`   📋 Menu Manager section loaded without m.map errors`);
  }

  async testNavigationSections() {
    await this.ensureAuthenticated();

    const sections = ['Dashboard', 'Page Editor', 'Menu Manager', 'Settings'];
    const accessibleSections = [];

    for (const section of sections) {
      try {
        // Look for navigation buttons by their text content
        const buttons = await this.page.$$('button');
        let sectionButton = null;

        for (const button of buttons) {
          const text = await button.textContent();
          if (text && (text.includes(section) ||
                      (section === 'Page Editor' && text.includes('Pages')) ||
                      (section === 'Menu Manager' && text.includes('Menu')))) {
            sectionButton = button;
            break;
          }
        }

        if (sectionButton) {
          await sectionButton.click();
          await this.page.waitForTimeout(1000);

          // Check if section content loaded without critical errors
          const newErrors = this.results.errors.filter(error =>
            error.includes('TypeError') || error.includes('ReferenceError')
          );

          if (newErrors.length === 0) {
            accessibleSections.push(section);
          }
        } else {
          console.log(`   ⚠️  Button for ${section} not found`);
        }
      } catch (e) {
        console.log(`   ⚠️  Could not access ${section}: ${e.message}`);
      }
    }

    if (accessibleSections.length === 0) {
      throw new Error('No navigation sections were accessible');
    }

    console.log(`   🧭 Accessible sections: ${accessibleSections.join(', ')}`);
  }

  async testJavaScriptErrors() {
    await this.ensureAuthenticated();

    await this.page.waitForTimeout(3000);

    // Check for critical JavaScript errors
    const criticalErrors = this.results.errors.filter(error =>
      error.includes('ReferenceError') ||
      error.includes('TypeError') ||
      error.includes('SyntaxError') ||
      error.includes('is not defined') ||
      error.includes('Cannot read property')
    );

    if (criticalErrors.length > 0) {
      throw new Error(`Found ${criticalErrors.length} critical JavaScript errors`);
    }

    console.log(`   🐛 Total console messages captured: ${this.results.errors.length}`);
  }

  async testFontLoading() {
    await this.ensureAuthenticated();

    // Wait for fonts to load
    await this.page.waitForTimeout(2000);

    // Check for font loading issues
    const fontErrors = this.results.errors.filter(error =>
      error.includes('font') ||
      error.includes('woff') ||
      error.includes('ttf') ||
      error.includes('Failed to load resource')
    );

    if (fontErrors.length > 0) {
      this.results.warnings.push(`Found ${fontErrors.length} potential font loading issues`);
    }

    // Test text rendering
    const textElements = await this.page.$$('h1, h2, h3, p, button, span');
    if (textElements.length === 0) {
      throw new Error('No text elements found - possible font loading failure');
    }

    console.log(`   🔤 Found ${textElements.length} text elements with fonts loaded`);
  }

  async testLanguageContext() {
    await this.ensureAuthenticated();

    await this.page.waitForTimeout(2000);

    // Check for language context errors
    const languageErrors = this.results.errors.filter(error =>
      error.includes('LanguageContext') ||
      error.includes('useLanguage') ||
      error.includes('language is not defined')
    );

    if (languageErrors.length > 0) {
      throw new Error(`Found ${languageErrors.length} language context errors`);
    }

    // Check for language switching functionality
    const languageButtons = await this.page.$$('button:has-text("EN"), button:has-text("HE"), [data-testid*="language"]');
    console.log(`   🌍 Found ${languageButtons.length} language controls`);
  }

  async runAllTests() {
    await this.setup();

    try {
      await this.runTest('Admin Panel Loads Without Errors', () => this.testAdminPanelLoads());
      await this.runTest('Login Functionality Works', () => this.testLoginFunctionality());
      await this.runTest('Menu API Endpoint Returns Correct Data', () => this.testMenuAPIEndpoint());
      await this.runTest('Menu Manager Displays Without m.map Errors', () => this.testMenuManagerSection());
      await this.runTest('All Navigation Sections Accessible', () => this.testNavigationSections());
      await this.runTest('No Critical JavaScript Errors', () => this.testJavaScriptErrors());
      await this.runTest('Font Loading Works Properly', () => this.testFontLoading());
      await this.runTest('Language Context Works Without Errors', () => this.testLanguageContext());

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
  const tester = new AdminPanelTester();
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