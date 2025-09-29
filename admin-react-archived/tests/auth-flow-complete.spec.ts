import { test, expect, Page } from '@playwright/test';

interface AuthFlowReport {
  timestamp: string;
  phase: string;
  success: boolean;
  errors: string[];
  screenshots: string[];
  authToken?: string;
  menuItemsLoaded: boolean;
  jsErrors: string[];
  networkRequests: {
    url: string;
    method: string;
    status: number;
    headers: Record<string, string>;
  }[];
  localStorage: {
    beforeLogin: Record<string, string>;
    afterLogin: Record<string, string>;
  };
  menuManagerState: {
    componentLoaded: boolean;
    menuItemsCount: number;
    hasMapError: boolean;
    apiCallsMade: string[];
  };
}

class AuthFlowTester {
  private report: AuthFlowReport;
  private testStartTime: number;

  constructor(private page: Page) {
    this.testStartTime = Date.now();
    this.report = {
      timestamp: new Date().toISOString(),
      phase: 'initialization',
      success: false,
      errors: [],
      screenshots: [],
      menuItemsLoaded: false,
      jsErrors: [],
      networkRequests: [],
      localStorage: {
        beforeLogin: {},
        afterLogin: {}
      },
      menuManagerState: {
        componentLoaded: false,
        menuItemsCount: 0,
        hasMapError: false,
        apiCallsMade: []
      }
    };

    this.setupLogging();
  }

  private setupLogging() {
    // Track JavaScript errors (especially looking for "m.map is not a function")
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const errorText = msg.text();
        this.report.jsErrors.push(errorText);
        console.log(`🔴 JS Error: ${errorText}`);

        // Check for the specific map error
        if (errorText.includes('map is not a function') || errorText.includes('m.map')) {
          this.report.menuManagerState.hasMapError = true;
          console.log(`🚨 FOUND MAP ERROR: ${errorText}`);
        }
      }
    });

    // Track network requests
    this.page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const request = response.request();
        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(request.headers())) {
          headers[key] = value;
        }

        this.report.networkRequests.push({
          url: response.url(),
          method: request.method(),
          status: response.status(),
          headers
        });

        this.report.menuManagerState.apiCallsMade.push(`${request.method()} ${response.url()} -> ${response.status()}`);
        console.log(`🌐 API: ${request.method()} ${response.url()} -> ${response.status()}`);
      }
    });
  }

  async takeScreenshot(name: string): Promise<void> {
    try {
      const timestamp = Date.now() - this.testStartTime;
      const filename = `auth-flow-${timestamp}ms-${name}.png`;
      await this.page.screenshot({
        path: `/tmp/claude/${filename}`,
        fullPage: true
      });
      this.report.screenshots.push(filename);
      console.log(`📸 Screenshot: ${filename}`);
    } catch (error) {
      console.log(`❌ Screenshot failed: ${error}`);
    }
  }

  async setPhase(phase: string) {
    this.report.phase = phase;
    console.log(`\n🔄 Phase: ${phase}`);
  }

  async captureLocalStorage(when: 'beforeLogin' | 'afterLogin'): Promise<void> {
    try {
      const storage = await this.page.evaluate(() => {
        const result: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            result[key] = localStorage.getItem(key) || '';
          }
        }
        return result;
      });

      this.report.localStorage[when] = storage;
      console.log(`🗄️ LocalStorage ${when}:`, Object.keys(storage));
    } catch (error) {
      console.log(`❌ Failed to capture localStorage: ${error}`);
    }
  }

  async checkForSSRIssues(): Promise<void> {
    console.log('🔍 Checking for SSR/hydration issues...');

    // Check for hydration mismatches
    const hydrationErrors = this.report.jsErrors.filter(error =>
      error.includes('hydration') ||
      error.includes('server') ||
      error.includes('client') ||
      error.includes('window is not defined') ||
      error.includes('localStorage is not defined')
    );

    if (hydrationErrors.length > 0) {
      console.log('🚨 SSR/Hydration issues found:', hydrationErrors);
    } else {
      console.log('✅ No SSR/hydration issues detected');
    }
  }

  async testMenuManagerState(): Promise<void> {
    console.log('🧪 Testing MenuManager component state...');

    try {
      const menuState = await this.page.evaluate(() => {
        // Check if MenuManager is rendered
        const menuManager = document.querySelector('[data-testid="menu-manager"], .menu-manager, #menu-manager');
        const menuItems = document.querySelectorAll('[data-testid="menu-item"], .menu-item, li');

        // Check for loading states
        const hasLoading = document.querySelector('.loading, [data-loading="true"]');
        const hasError = document.querySelector('.error, [data-error]');

        // Check for specific error messages
        const errorMessages = Array.from(document.querySelectorAll('*')).map(el => el.textContent).filter(text =>
          text && (text.includes('map is not a function') || text.includes('Cannot read'))
        );

        return {
          componentExists: !!menuManager,
          menuItemsCount: menuItems.length,
          hasLoading: !!hasLoading,
          hasError: !!hasError,
          errorMessages,
          visibleText: document.body.textContent?.substring(0, 1000) || ''
        };
      });

      this.report.menuManagerState.componentLoaded = menuState.componentExists;
      this.report.menuManagerState.menuItemsCount = menuState.menuItemsCount;

      console.log('📊 MenuManager state:', menuState);

      if (menuState.errorMessages.length > 0) {
        console.log('🚨 Error messages in DOM:', menuState.errorMessages);
        this.report.errors.push(...menuState.errorMessages);
      }

    } catch (error) {
      console.log(`❌ Failed to check MenuManager state: ${error}`);
      this.report.errors.push(`MenuManager state check failed: ${error}`);
    }
  }

  getReport(): AuthFlowReport {
    this.report.success = this.report.errors.length === 0 &&
                         this.report.jsErrors.length === 0 &&
                         !this.report.menuManagerState.hasMapError;
    return { ...this.report };
  }
}

test.describe('Complete Authentication Flow Test', () => {
  test('Full auth journey: Login → Dashboard → MenuManager with localStorage fix verification', async ({ page }) => {
    const tester = new AuthFlowTester(page);

    console.log('🚀 Starting complete authentication flow test...');
    console.log('🎯 Focus: Verifying localStorage SSR fix and map error resolution');

    // Phase 1: Initial state capture
    await tester.setPhase('Initial State Capture');
    await tester.captureLocalStorage('beforeLogin');
    await tester.takeScreenshot('01-initial-state');

    // Phase 2: Navigate to admin
    await tester.setPhase('Navigation to Admin');
    try {
      await page.goto('http://localhost:7001/admin/', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      await tester.takeScreenshot('02-admin-page-loaded');
      console.log('✅ Successfully navigated to admin page');
    } catch (error) {
      console.log(`❌ Failed to navigate to admin: ${error}`);
      tester.getReport().errors.push(`Navigation failed: ${error}`);
    }

    // Phase 3: SSR Issue Detection
    await tester.setPhase('SSR Issue Detection');
    await tester.checkForSSRIssues();

    // Phase 4: Login process
    await tester.setPhase('Login Process');
    try {
      // Wait for and fill password field
      const passwordField = page.locator('input[type="password"]');
      await expect(passwordField).toBeVisible({ timeout: 10000 });
      console.log('✅ Login form visible');

      await passwordField.fill('admin123');
      await tester.takeScreenshot('03-password-filled');

      // Submit login
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
      await submitButton.click();
      console.log('✅ Login submitted');

      // Wait for redirect/response
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await tester.takeScreenshot('04-after-login');

    } catch (error) {
      console.log(`❌ Login process failed: ${error}`);
      tester.getReport().errors.push(`Login failed: ${error}`);
    }

    // Phase 5: Post-login state verification
    await tester.setPhase('Post-Login Verification');
    await tester.captureLocalStorage('afterLogin');

    // Check if auth token is stored
    const authToken = await page.evaluate(() => {
      return localStorage.getItem('authToken') ||
             localStorage.getItem('token') ||
             sessionStorage.getItem('authToken') ||
             sessionStorage.getItem('token');
    });

    if (authToken) {
      console.log('✅ Auth token found in storage');
      tester.getReport().authToken = authToken.substring(0, 20) + '...';
    } else {
      console.log('❌ No auth token found in storage');
      tester.getReport().errors.push('Auth token not stored');
    }

    // Phase 6: Navigate to Menu Manager
    await tester.setPhase('Menu Manager Navigation');
    try {
      // Try to find menu manager link or navigate directly
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);

      if (currentUrl.includes('/admin/dashboard') || currentUrl.includes('/admin/')) {
        // Try to find Menu Manager link
        const menuLink = page.locator('a:has-text("Menu"), a[href*="menu"], button:has-text("Menu")');
        const linkCount = await menuLink.count();

        if (linkCount > 0) {
          console.log(`✅ Found ${linkCount} menu-related links`);
          await menuLink.first().click();
          await page.waitForLoadState('networkidle');
        } else {
          console.log('⚠️ No menu links found, trying direct navigation');
          await page.goto('http://localhost:7001/admin/menu-manager', {
            waitUntil: 'networkidle',
            timeout: 15000
          });
        }

        await tester.takeScreenshot('05-menu-manager-loaded');
        console.log('✅ Navigated to Menu Manager');
      }

    } catch (error) {
      console.log(`❌ Menu Manager navigation failed: ${error}`);
      tester.getReport().errors.push(`Menu Manager navigation failed: ${error}`);
    }

    // Phase 7: Menu Manager component testing
    await tester.setPhase('Menu Manager Component Testing');
    await tester.testMenuManagerState();

    // Wait a moment for any async operations to complete
    await page.waitForTimeout(3000);

    // Phase 8: Check for the specific "map" error
    await tester.setPhase('Map Error Detection');
    const hasMapError = tester.getReport().menuManagerState.hasMapError;

    if (hasMapError) {
      console.log('🚨 MAP ERROR DETECTED - The fix did not work');
    } else {
      console.log('✅ No map errors detected - Fix appears successful');
    }

    // Phase 9: Final API verification
    await tester.setPhase('API Verification');
    try {
      // Force a component re-render by refreshing
      await page.reload({ waitUntil: 'networkidle' });
      await tester.takeScreenshot('06-after-refresh');

      // Check if authenticated API calls are being made
      await page.waitForTimeout(2000); // Wait for any API calls

    } catch (error) {
      console.log(`❌ API verification failed: ${error}`);
    }

    // Final report generation
    await tester.setPhase('Report Generation');
    const finalReport = tester.getReport();
    await tester.takeScreenshot('07-final-state');

    // Comprehensive report output
    console.log('\n' + '='.repeat(80));
    console.log('🔍 COMPREHENSIVE AUTHENTICATION FLOW TEST REPORT');
    console.log('='.repeat(80));

    console.log(`\n📊 OVERVIEW:`);
    console.log(`  Success: ${finalReport.success ? '✅' : '❌'}`);
    console.log(`  Test Duration: ${Date.now() - tester['testStartTime']}ms`);
    console.log(`  Screenshots: ${finalReport.screenshots.length}`);
    console.log(`  JavaScript Errors: ${finalReport.jsErrors.length}`);
    console.log(`  General Errors: ${finalReport.errors.length}`);
    console.log(`  API Calls Made: ${finalReport.networkRequests.length}`);

    console.log(`\n🔐 AUTHENTICATION:`);
    console.log(`  Token Stored: ${finalReport.authToken ? '✅' : '❌'}`);
    if (finalReport.authToken) {
      console.log(`  Token Preview: ${finalReport.authToken}`);
    }
    console.log(`  LocalStorage Before: ${Object.keys(finalReport.localStorage.beforeLogin).length} items`);
    console.log(`  LocalStorage After: ${Object.keys(finalReport.localStorage.afterLogin).length} items`);

    console.log(`\n🍴 MENU MANAGER:`);
    console.log(`  Component Loaded: ${finalReport.menuManagerState.componentLoaded ? '✅' : '❌'}`);
    console.log(`  Menu Items Count: ${finalReport.menuManagerState.menuItemsCount}`);
    console.log(`  Map Error Present: ${finalReport.menuManagerState.hasMapError ? '🚨 YES' : '✅ NO'}`);
    console.log(`  API Calls Made: ${finalReport.menuManagerState.apiCallsMade.length}`);

    console.log(`\n❌ JAVASCRIPT ERRORS:`);
    if (finalReport.jsErrors.length === 0) {
      console.log('  ✅ No JavaScript errors detected');
    } else {
      finalReport.jsErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log(`\n🌐 API CALLS:`);
    finalReport.menuManagerState.apiCallsMade.forEach(call => {
      console.log(`  ${call}`);
    });

    console.log(`\n🚨 CRITICAL ISSUES:`);
    if (finalReport.menuManagerState.hasMapError) {
      console.log('  ❌ MAP ERROR STILL PRESENT - SSR fix incomplete');
    } else {
      console.log('  ✅ No map errors - SSR fix successful');
    }

    console.log(`\n📸 SCREENSHOTS CAPTURED:`);
    finalReport.screenshots.forEach((screenshot, index) => {
      console.log(`  ${index + 1}. ${screenshot}`);
    });

    // Test assertions
    expect(finalReport.authToken).toBeDefined();
    expect(finalReport.menuManagerState.hasMapError).toBe(false);
    expect(finalReport.jsErrors.filter(e => e.includes('localStorage is not defined'))).toHaveLength(0);
    expect(finalReport.networkRequests.length).toBeGreaterThan(0);

    console.log('\n✅ Authentication flow test completed');
  });
});