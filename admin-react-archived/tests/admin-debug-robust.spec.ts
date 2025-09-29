import { test, expect, Page } from '@playwright/test';

interface DebugReport {
  timestamp: string;
  testPhase: string;
  currentUrl: string;
  consoleErrors: string[];
  networkRequests: any[];
  authStatus: {
    hasToken: boolean;
    token?: string;
  };
  uiElements: {
    loginForm: boolean;
    passwordField: boolean;
    submitButton: boolean;
    menuManager: boolean;
    dashboardElements: number;
  };
  apiEndpoints: {
    [key: string]: {
      status: number | string;
      response: string;
      error?: string;
    };
  };
  screenshots: string[];
}

class RobustAdminDebugger {
  private report: DebugReport;

  constructor(private page: Page) {
    this.report = {
      timestamp: new Date().toISOString(),
      testPhase: 'initialization',
      currentUrl: '',
      consoleErrors: [],
      networkRequests: [],
      authStatus: { hasToken: false },
      uiElements: {
        loginForm: false,
        passwordField: false,
        submitButton: false,
        menuManager: false,
        dashboardElements: 0
      },
      apiEndpoints: {},
      screenshots: []
    };

    this.setupLogging();
  }

  private setupLogging() {
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const errorText = `[${msg.type()}] ${msg.text()}`;
        this.report.consoleErrors.push(errorText);
        console.log(`🔴 ${errorText}`);
      }
    });

    this.page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        console.log(`🌐 API Request: ${request.method()} ${request.url()}`);
      }
    });

    this.page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        try {
          const text = await response.text();
          const endpoint = new URL(response.url()).pathname;
          this.report.apiEndpoints[endpoint] = {
            status: response.status(),
            response: text.substring(0, 500)
          };
          console.log(`🌐 API Response: ${response.status()} ${response.url()}`);
        } catch (e) {
          console.log(`❌ Failed to read API response: ${e}`);
        }
      }
    });
  }

  async takeScreenshot(name: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `debug-${name}-${timestamp}.png`;
      await this.page.screenshot({
        path: `test-results/${filename}`,
        fullPage: true
      });
      this.report.screenshots.push(filename);
      console.log(`📸 Screenshot: ${filename}`);
      return filename;
    } catch (error) {
      console.log(`❌ Screenshot failed: ${error}`);
      return '';
    }
  }

  async updateCurrentUrl() {
    this.report.currentUrl = this.page.url();
    console.log(`🌍 Current URL: ${this.report.currentUrl}`);
  }

  async checkAuthStatus() {
    try {
      const authData = await this.page.evaluate(() => {
        const token = localStorage.getItem('authToken') ||
                     sessionStorage.getItem('authToken') ||
                     localStorage.getItem('token') ||
                     sessionStorage.getItem('token');
        return {
          hasToken: !!token,
          token: token || 'none'
        };
      });

      this.report.authStatus = authData;
      console.log(`🔐 Auth Status: ${authData.hasToken ? 'Token found' : 'No token'}`);
    } catch (error) {
      console.log(`❌ Auth check failed: ${error}`);
    }
  }

  async analyzeUIElements() {
    try {
      // Check for login elements
      this.report.uiElements.loginForm = await this.page.locator('form, [data-testid="login"]').count() > 0;
      this.report.uiElements.passwordField = await this.page.locator('input[type="password"]').isVisible().catch(() => false);
      this.report.uiElements.submitButton = await this.page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').count() > 0;

      // Check for admin/dashboard elements
      this.report.uiElements.dashboardElements = await this.page.locator('h1, h2, [role="main"], .dashboard, #dashboard, nav').count();
      this.report.uiElements.menuManager = await this.page.locator(':has-text("Menu"), :has-text("menu"), [href*="menu"]').count() > 0;

      console.log(`🎛️  UI Elements:`, this.report.uiElements);
    } catch (error) {
      console.log(`❌ UI analysis failed: ${error}`);
    }
  }

  async testAPIEndpoint(endpoint: string): Promise<void> {
    try {
      console.log(`🧪 Testing API: ${endpoint}`);
      const response = await this.page.request.get(`http://localhost:7001${endpoint}`);
      const text = await response.text();

      this.report.apiEndpoints[endpoint] = {
        status: response.status(),
        response: text.substring(0, 500)
      };

      console.log(`   Status: ${response.status()}`);
      console.log(`   Response: ${text.substring(0, 100)}...`);
    } catch (error) {
      this.report.apiEndpoints[endpoint] = {
        status: 'error',
        response: '',
        error: String(error)
      };
      console.log(`   Error: ${error}`);
    }
  }

  setPhase(phase: string) {
    this.report.testPhase = phase;
    console.log(`\n🔄 Phase: ${phase}`);
  }

  getReport(): DebugReport {
    return { ...this.report };
  }
}

test.describe('Robust Admin Panel Debug', () => {
  test('Complete Admin Debug Analysis', async ({ page }) => {
    const debugTool = new RobustAdminDebugger(page);

    console.log('🚀 Starting robust admin panel debug...');

    // Phase 1: Initial Navigation
    debugTool.setPhase('Initial Navigation');
    try {
      await page.goto('http://localhost:7001/admin/', { waitUntil: 'networkidle' });
      await debugTool.updateCurrentUrl();
      await debugTool.takeScreenshot('01-initial-navigation');
      await debugTool.analyzeUIElements();
    } catch (error) {
      console.log(`❌ Navigation failed: ${error}`);
    }

    // Phase 2: Authentication Analysis
    debugTool.setPhase('Authentication Analysis');
    await debugTool.checkAuthStatus();

    // Try to find and interact with login form
    try {
      const passwordField = page.locator('input[type="password"]');
      if (await passwordField.isVisible({ timeout: 5000 })) {
        console.log('✅ Login form found');
        await debugTool.takeScreenshot('02-login-form-found');

        await passwordField.fill('admin123');
        await debugTool.takeScreenshot('03-password-filled');

        // Find and click submit button
        const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          console.log('✅ Login submitted');
          await page.waitForLoadState('networkidle');
          await debugTool.takeScreenshot('04-after-login');
          await debugTool.updateCurrentUrl();
          await debugTool.checkAuthStatus();
        }
      } else {
        console.log('⚠️ No login form visible');
      }
    } catch (error) {
      console.log(`❌ Login interaction failed: ${error}`);
      await debugTool.takeScreenshot('error-login');
    }

    // Phase 3: Menu Manager Analysis
    debugTool.setPhase('Menu Manager Analysis');
    await debugTool.analyzeUIElements();

    // Try to navigate to menu manager
    try {
      // First try to find a menu manager link
      const menuLinks = page.locator('a:has-text("Menu"), a:has-text("menu"), button:has-text("Menu"), button:has-text("menu")');
      const linkCount = await menuLinks.count();

      if (linkCount > 0) {
        console.log(`✅ Found ${linkCount} menu-related links`);
        await menuLinks.first().click();
        await page.waitForLoadState('networkidle');
        await debugTool.takeScreenshot('05-menu-manager-via-link');
      } else {
        console.log('⚠️ No menu links found, trying direct navigation');
        // Try different potential URLs
        const menuUrls = [
          '/admin/menu-manager',
          '/admin/menu',
          '/admin/menus',
          '/admin/navigation'
        ];

        for (const url of menuUrls) {
          try {
            await page.goto(`http://localhost:7001${url}`, { timeout: 10000 });
            await debugTool.updateCurrentUrl();
            await debugTool.takeScreenshot(`06-direct-nav-${url.split('/').pop()}`);
            console.log(`✅ Successfully navigated to ${url}`);
            break;
          } catch (navError) {
            console.log(`❌ Failed to navigate to ${url}: ${navError}`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Menu manager navigation failed: ${error}`);
      await debugTool.takeScreenshot('error-menu-navigation');
    }

    // Phase 4: API Testing
    debugTool.setPhase('API Endpoint Testing');
    const apiEndpoints = [
      '/api/menu-items',
      '/api/menus',
      '/api/navigation',
      '/api/admin/menu-items',
      '/api/admin/menus',
      '/api/auth/login',
      '/api/auth/verify',
      '/api/login'
    ];

    for (const endpoint of apiEndpoints) {
      await debugTool.testAPIEndpoint(endpoint);
    }

    // Phase 5: Component State Analysis
    debugTool.setPhase('Component State Analysis');
    try {
      // Check for React component data
      const componentData = await page.evaluate(() => {
        // Look for common React patterns
        const reactElements = document.querySelectorAll('[data-reactroot], #__next, [class*="react"]');
        const stateElements = document.querySelectorAll('[data-state], [data-loading], [data-error]');

        return {
          reactElements: reactElements.length,
          stateElements: stateElements.length,
          hasLoadingIndicators: document.querySelectorAll('.loading, [class*="loading"], [data-loading="true"]').length,
          hasErrorMessages: document.querySelectorAll('.error, [class*="error"], [data-error]').length,
          visibleText: document.body.innerText.substring(0, 1000)
        };
      });

      console.log('🧩 Component Analysis:', componentData);
      await debugTool.takeScreenshot('07-component-state');
    } catch (error) {
      console.log(`❌ Component analysis failed: ${error}`);
    }

    // Phase 6: Network Activity Check
    debugTool.setPhase('Network Activity Check');
    try {
      // Force a page refresh to see network activity
      await page.reload({ waitUntil: 'networkidle' });
      await debugTool.takeScreenshot('08-after-refresh');
      await debugTool.analyzeUIElements();
    } catch (error) {
      console.log(`❌ Refresh failed: ${error}`);
    }

    // Final Report
    debugTool.setPhase('Report Generation');
    const finalReport = debugTool.getReport();

    console.log('\n🔍 COMPREHENSIVE ADMIN PANEL DEBUGGING REPORT');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${finalReport.timestamp}`);
    console.log(`Final URL: ${finalReport.currentUrl}`);
    console.log(`Screenshots: ${finalReport.screenshots.length}`);
    console.log(`Console Errors: ${finalReport.consoleErrors.length}`);
    console.log(`API Endpoints Tested: ${Object.keys(finalReport.apiEndpoints).length}`);

    console.log('\n🔐 AUTHENTICATION STATUS:');
    console.log(`Has Token: ${finalReport.authStatus.hasToken}`);
    if (finalReport.authStatus.token && finalReport.authStatus.token !== 'none') {
      console.log(`Token: ${finalReport.authStatus.token.substring(0, 20)}...`);
    }

    console.log('\n🎛️ UI ELEMENTS:');
    Object.entries(finalReport.uiElements).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    console.log('\n❌ CONSOLE ERRORS:');
    finalReport.consoleErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });

    console.log('\n🌐 API ENDPOINTS:');
    Object.entries(finalReport.apiEndpoints).forEach(([endpoint, data]) => {
      console.log(`  ${endpoint}: ${data.status}`);
      if (data.error) {
        console.log(`    Error: ${data.error}`);
      } else if (data.response) {
        console.log(`    Response: ${data.response.substring(0, 100)}...`);
      }
    });

    console.log('\n📸 SCREENSHOTS:');
    finalReport.screenshots.forEach((screenshot, index) => {
      console.log(`  ${index + 1}. ${screenshot}`);
    });

    // Write detailed report to file
    const reportPath = `/Users/michaelmishayev/Desktop/AizikBusinessPage/www.normandpllc.com/admin-react/test-results/debug-report-${Date.now()}.json`;
    await page.evaluate((report) => {
      // This will be handled by writing the file separately
    }, finalReport);

    console.log('\n✅ Debug analysis completed');

    // Basic assertions to ensure test ran
    expect(finalReport.screenshots.length).toBeGreaterThan(0);
    expect(finalReport.currentUrl).toContain('localhost:7001');
  });
});