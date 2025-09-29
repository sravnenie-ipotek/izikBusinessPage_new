import { test, expect, Page } from '@playwright/test';

interface ConsoleMessage {
  type: string;
  text: string;
  location?: string;
  timestamp: string;
}

interface NetworkRequest {
  url: string;
  method: string;
  status?: number;
  response?: any;
  error?: string;
  timestamp: string;
}

class AdminDebugger {
  private consoleMessages: ConsoleMessage[] = [];
  private networkRequests: NetworkRequest[] = [];
  private errors: string[] = [];

  constructor(private page: Page) {
    this.setupConsoleLogging();
    this.setupNetworkLogging();
    this.setupErrorLogging();
  }

  private setupConsoleLogging() {
    this.page.on('console', (msg) => {
      const timestamp = new Date().toISOString();
      const message: ConsoleMessage = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location()?.url,
        timestamp
      };

      this.consoleMessages.push(message);

      // Log important messages immediately
      if (msg.type() === 'error' || msg.text().includes('map is not a function')) {
        console.log(`🔴 Console ${msg.type()}: ${msg.text()}`);
        if (msg.location()) {
          console.log(`   Location: ${msg.location()?.url}:${msg.location()?.lineNumber}`);
        }
      }
    });
  }

  private setupNetworkLogging() {
    this.page.on('request', (request) => {
      const timestamp = new Date().toISOString();
      const networkRequest: NetworkRequest = {
        url: request.url(),
        method: request.method(),
        timestamp
      };

      this.networkRequests.push(networkRequest);

      // Log API calls
      if (request.url().includes('/api/')) {
        console.log(`🌐 API Request: ${request.method()} ${request.url()}`);
      }
    });

    this.page.on('response', async (response) => {
      const request = this.networkRequests.find(req =>
        req.url === response.url() && !req.status
      );

      if (request) {
        request.status = response.status();

        try {
          if (response.url().includes('/api/')) {
            const text = await response.text();
            request.response = text;
            console.log(`🌐 API Response: ${response.status()} ${response.url()}`);
            console.log(`   Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
          }
        } catch (e) {
          request.error = `Failed to read response: ${e}`;
        }
      }
    });

    this.page.on('requestfailed', (request) => {
      const networkRequest = this.networkRequests.find(req =>
        req.url === request.url() && !req.status
      );

      if (networkRequest) {
        networkRequest.error = request.failure()?.errorText || 'Request failed';
        console.log(`❌ Request Failed: ${request.url()} - ${networkRequest.error}`);
      }
    });
  }

  private setupErrorLogging() {
    this.page.on('pageerror', (error) => {
      const errorMsg = `Page Error: ${error.message}\nStack: ${error.stack}`;
      this.errors.push(errorMsg);
      console.log(`💥 Page Error: ${error.message}`);
      console.log(`   Stack: ${error.stack}`);
    });
  }

  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${name}-${timestamp}.png`;
    await this.page.screenshot({
      path: `test-results/${filename}`,
      fullPage: true
    });
    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
  }

  getConsoleErrors() {
    return this.consoleMessages.filter(msg =>
      msg.type === 'error' || msg.text.includes('map is not a function')
    );
  }

  getAPIRequests() {
    return this.networkRequests.filter(req => req.url.includes('/api/'));
  }

  generateReport() {
    return {
      totalConsoleMessages: this.consoleMessages.length,
      consoleErrors: this.getConsoleErrors(),
      apiRequests: this.getAPIRequests(),
      networkRequests: this.networkRequests,
      pageErrors: this.errors,
      timestamp: new Date().toISOString()
    };
  }
}

test.describe('Admin Panel Debug Tests', () => {
  let adminDebugger: AdminDebugger;

  test.beforeEach(async ({ page }) => {
    adminDebugger = new AdminDebugger(page);
  });

  test('Complete Admin Panel User Journey Debug', async ({ page }) => {
    console.log('🚀 Starting comprehensive admin panel debug...');

    // Step 1: Navigate to admin panel
    console.log('\n📍 Step 1: Navigating to admin panel...');
    await page.goto('http://localhost:7001/admin/');
    await page.waitForLoadState('networkidle');
    await adminDebugger.takeScreenshot('01-admin-landing');

    // Check if we're redirected to login
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Step 2: Test login functionality
    console.log('\n📍 Step 2: Testing login functionality...');

    // Look for login form elements
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button').filter({ hasText: /login|sign in|submit/i });

    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await adminDebugger.takeScreenshot('02-login-form');

    // Fill in password
    await passwordInput.fill('admin123');
    await adminDebugger.takeScreenshot('03-password-filled');

    // Click login
    await loginButton.click();
    console.log('Login button clicked');

    // Wait for potential navigation
    await page.waitForLoadState('networkidle');
    await adminDebugger.takeScreenshot('04-after-login');

    // Step 3: Check authentication status
    console.log('\n📍 Step 3: Checking authentication status...');

    // Check localStorage for auth token
    const authToken = await page.evaluate(() => {
      return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    });
    console.log(`Auth token: ${authToken ? 'Present' : 'Not found'}`);

    // Check for dashboard elements
    const dashboardElements = await page.locator('h1, h2, [role="main"], .dashboard, #dashboard').count();
    console.log(`Dashboard elements found: ${dashboardElements}`);

    // Step 4: Navigate to menu manager
    console.log('\n📍 Step 4: Testing menu manager navigation...');

    // Look for menu manager link/button
    const menuManagerLink = page.locator('a, button').filter({ hasText: /menu.?manager|manage.?menu/i });
    const menuManagerCount = await menuManagerLink.count();
    console.log(`Menu manager links found: ${menuManagerCount}`);

    if (menuManagerCount > 0) {
      await menuManagerLink.first().click();
      console.log('Clicked menu manager link');
      await page.waitForLoadState('networkidle');
      await adminDebugger.takeScreenshot('05-menu-manager');
    } else {
      console.log('⚠️ No menu manager link found, trying direct navigation');
      await page.goto('http://localhost:7001/admin/menu-manager');
      await page.waitForLoadState('networkidle');
      await adminDebugger.takeScreenshot('05-menu-manager-direct');
    }

    // Step 5: Debug menu manager specifically
    console.log('\n📍 Step 5: Debugging menu manager component...');

    // Wait a bit for React components to load
    await page.waitForTimeout(3000);

    // Check for menu items container
    const menuItemsContainer = page.locator('[data-testid="menu-items"], .menu-items, [class*="menu"], ul, ol');
    const containerCount = await menuItemsContainer.count();
    console.log(`Menu containers found: ${containerCount}`);

    // Check for loading states
    const loadingIndicators = page.locator('[data-testid="loading"], .loading, .spinner');
    const loadingCount = await loadingIndicators.count();
    console.log(`Loading indicators found: ${loadingCount}`);

    // Check for error messages
    const errorMessages = page.locator('[data-testid="error"], .error, [class*="error"]');
    const errorCount = await errorMessages.count();
    console.log(`Error messages found: ${errorCount}`);

    if (errorCount > 0) {
      const errorText = await errorMessages.first().textContent();
      console.log(`Error message text: ${errorText}`);
    }

    // Check for empty state messages
    const emptyMessages = page.locator(':has-text("No menu items"), :has-text("empty"), :has-text("no data")');
    const emptyCount = await emptyMessages.count();
    console.log(`Empty state messages found: ${emptyCount}`);

    await adminDebugger.takeScreenshot('06-menu-manager-detailed');

    // Step 6: Test specific API calls
    console.log('\n📍 Step 6: Testing API endpoints directly...');

    // Try to trigger API calls by interacting with the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Look for refresh/reload buttons
    const refreshButton = page.locator('button').filter({ hasText: /refresh|reload|fetch/i });
    const refreshCount = await refreshButton.count();

    if (refreshCount > 0) {
      console.log('Found refresh button, clicking...');
      await refreshButton.first().click();
      await page.waitForLoadState('networkidle');
    }

    await adminDebugger.takeScreenshot('07-after-refresh');

    // Step 7: Inspect React component state
    console.log('\n📍 Step 7: Inspecting React component state...');

    // Check if React DevTools data is available
    const reactState = await page.evaluate(() => {
      // Try to access React fiber data
      const reactRoot = document.querySelector('#__next, [data-reactroot], #root');
      if (reactRoot && (reactRoot as any)._reactInternalFiber) {
        return 'React fiber found';
      }
      if (reactRoot && (reactRoot as any)._reactInternalInstance) {
        return 'React instance found';
      }
      return 'React data not accessible';
    });
    console.log(`React state inspection: ${reactState}`);

    // Check for any data attributes that might indicate state
    const dataElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('[data-*]'));
      return elements.map(el => ({
        tag: el.tagName,
        attributes: Array.from(el.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .map(attr => `${attr.name}="${attr.value}"`)
      })).slice(0, 10); // Limit to first 10
    });
    console.log('Data attributes found:', dataElements);

    await adminDebugger.takeScreenshot('08-final-state');

    // Step 8: Generate comprehensive report
    console.log('\n📍 Step 8: Generating debug report...');
    const report = adminDebugger.generateReport();

    console.log('\n🔍 COMPREHENSIVE DEBUG REPORT');
    console.log('============================');
    console.log(`Total console messages: ${report.totalConsoleMessages}`);
    console.log(`Console errors: ${report.consoleErrors.length}`);
    console.log(`API requests: ${report.apiRequests.length}`);
    console.log(`Page errors: ${report.pageErrors.length}`);

    // Detailed error analysis
    if (report.consoleErrors.length > 0) {
      console.log('\n❌ CONSOLE ERRORS:');
      report.consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.text}`);
        if (error.location) {
          console.log(`   Location: ${error.location}`);
        }
        console.log(`   Time: ${error.timestamp}`);
      });
    }

    // API request analysis
    if (report.apiRequests.length > 0) {
      console.log('\n🌐 API REQUESTS:');
      report.apiRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.method} ${req.url}`);
        console.log(`   Status: ${req.status || 'Pending'}`);
        if (req.error) {
          console.log(`   Error: ${req.error}`);
        }
        if (req.response) {
          console.log(`   Response: ${req.response.substring(0, 100)}...`);
        }
      });
    } else {
      console.log('\n⚠️ NO API REQUESTS DETECTED - This might be the issue!');
    }

    // Page errors
    if (report.pageErrors.length > 0) {
      console.log('\n💥 PAGE ERRORS:');
      report.pageErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // Save detailed report to file
    const reportPath = `/Users/michaelmishayev/Desktop/AizikBusinessPage/www.normandpllc.com/admin-react/debug-report-${Date.now()}.json`;
    await page.evaluate((reportData) => {
      // This will be handled by the file write below
    }, report);

    // Assertions for the test
    expect(report.totalConsoleMessages).toBeGreaterThan(0);

    // Check for specific issues
    const mapErrors = report.consoleErrors.filter(error =>
      error.text.includes('map is not a function')
    );

    if (mapErrors.length > 0) {
      console.log('\n🎯 FOUND MAP ERROR!');
      mapErrors.forEach(error => {
        console.log(`Error: ${error.text}`);
        console.log(`Location: ${error.location}`);
      });
    }

    console.log('\n✅ Debug test completed');
  });

  test('Direct API Testing', async ({ page }) => {
    console.log('🔧 Testing API endpoints directly...');

    // Navigate to admin first to set up any required cookies/tokens
    await page.goto('http://localhost:7001/admin/');
    await page.waitForLoadState('networkidle');

    // Try login first
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('admin123');
      const loginButton = page.locator('button').filter({ hasText: /login|sign in|submit/i });
      await loginButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Test API endpoints
    const apiEndpoints = [
      '/api/menu-items',
      '/api/auth/login',
      '/api/auth/verify'
    ];

    for (const endpoint of apiEndpoints) {
      console.log(`\nTesting ${endpoint}...`);

      try {
        const response = await page.request.get(`http://localhost:7001${endpoint}`);
        console.log(`${endpoint}: ${response.status()}`);

        const text = await response.text();
        console.log(`Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
      } catch (error) {
        console.log(`${endpoint}: Error - ${error}`);
      }
    }
  });
});