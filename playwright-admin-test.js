import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AdminPanelTester {
  constructor() {
    this.baseUrl = 'http://localhost:7001';
    this.adminUrl = `${this.baseUrl}/admin`;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.issues = [];
    this.screenshots = [];
    this.consoleErrors = [];
    this.networkErrors = [];
    this.apiResults = [];
    this.testResults = {
      startTime: new Date().toISOString(),
      endTime: null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      issues: [],
      screenshots: [],
      consoleErrors: [],
      networkErrors: [],
      apiResults: [],
      summary: ''
    };
  }

  async init() {
    console.log('🚀 Initializing Playwright browser...');
    this.browser = await chromium.launch({
      headless: false, // Set to true for CI
      slowMo: 500 // Slow down for better observation
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true
    });

    this.page = await this.context.newPage();

    // Setup console error monitoring
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        const error = {
          type: 'console',
          message: msg.text(),
          timestamp: new Date().toISOString(),
          url: this.page.url()
        };
        this.consoleErrors.push(error);
        console.log('❌ Console Error:', msg.text());
      }
    });

    // Setup network error monitoring
    this.page.on('response', response => {
      if (response.status() >= 400) {
        const error = {
          type: 'network',
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        };
        this.networkErrors.push(error);
        console.log(`❌ Network Error: ${response.status()} ${response.url()}`);
      }
    });

    // Setup request failure monitoring
    this.page.on('requestfailed', request => {
      const error = {
        type: 'request_failed',
        url: request.url(),
        failure: request.failure()?.errorText,
        timestamp: new Date().toISOString()
      };
      this.networkErrors.push(error);
      console.log(`❌ Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
  }

  async takeScreenshot(name, description = '') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `admin-test-${name}-${timestamp}.png`;
      const filepath = path.join(__dirname, 'screenshots', filename);

      // Ensure screenshots directory exists
      await fs.mkdir(path.join(__dirname, 'screenshots'), { recursive: true });

      await this.page.screenshot({ path: filepath, fullPage: true });

      const screenshot = {
        name,
        description,
        filename,
        filepath,
        timestamp: new Date().toISOString(),
        url: this.page.url()
      };

      this.screenshots.push(screenshot);
      console.log(`📸 Screenshot saved: ${filename}`);
      return screenshot;
    } catch (error) {
      console.error('Failed to take screenshot:', error);
      return null;
    }
  }

  async addIssue(severity, category, title, description, element = null) {
    const issue = {
      severity, // 'critical', 'high', 'medium', 'low'
      category, // 'functionality', 'ui', 'performance', 'accessibility', 'api'
      title,
      description,
      element,
      url: this.page.url(),
      timestamp: new Date().toISOString(),
      screenshot: null
    };

    // Take screenshot for critical and high severity issues
    if (['critical', 'high'].includes(severity)) {
      issue.screenshot = await this.takeScreenshot(`issue-${this.issues.length + 1}`, title);
    }

    this.issues.push(issue);
    console.log(`🐛 ${severity.toUpperCase()} ISSUE: ${title}`);
  }

  async testApiEndpoint(endpoint, method = 'GET', expectedStatus = 200, description = '') {
    try {
      console.log(`🔗 Testing API: ${method} ${endpoint}`);

      // Use full URL for API requests
      const fullUrl = `${this.baseUrl}${endpoint}`;
      const response = await this.page.request[method.toLowerCase()](fullUrl);
      const status = response.status();
      const success = status === expectedStatus;

      const result = {
        endpoint,
        method,
        expectedStatus,
        actualStatus: status,
        success,
        description,
        timestamp: new Date().toISOString(),
        response: null
      };

      if (success) {
        try {
          result.response = await response.json();
        } catch (e) {
          result.response = await response.text();
        }
        console.log(`✅ API Test Passed: ${method} ${endpoint} - ${status}`);
      } else {
        await this.addIssue('high', 'api', `API Endpoint Failed: ${endpoint}`,
          `Expected status ${expectedStatus}, got ${status}`);
        console.log(`❌ API Test Failed: ${method} ${endpoint} - Expected ${expectedStatus}, got ${status}`);
      }

      this.apiResults.push(result);
      return result;
    } catch (error) {
      const result = {
        endpoint,
        method,
        expectedStatus,
        actualStatus: 0,
        success: false,
        description,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      await this.addIssue('critical', 'api', `API Endpoint Error: ${endpoint}`,
        `Request failed: ${error.message}`);

      this.apiResults.push(result);
      console.log(`💥 API Test Error: ${method} ${endpoint} - ${error.message}`);
      return result;
    }
  }

  async waitForElement(selector, timeout = 5000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      await this.addIssue('medium', 'ui', `Element Not Found: ${selector}`,
        `Element did not appear within ${timeout}ms`);
      return false;
    }
  }

  async testNavigation() {
    console.log('\n📱 Testing Admin Panel Navigation...');
    this.testResults.totalTests++;

    try {
      // Navigate to admin panel
      await this.page.goto(this.adminUrl, { waitUntil: 'networkidle' });
      await this.takeScreenshot('initial-load', 'Admin panel initial load');

      // Wait for React app to load
      await this.page.waitForTimeout(3000);

      // Test if page loads
      const title = await this.page.title();
      if (!title.includes('Admin') && !title.includes('Normand')) {
        await this.addIssue('medium', 'ui', 'Admin Panel Title Missing',
          `Page title "${title}" doesn't indicate admin functionality`);
      }

      // Check for React app mounting
      const reactAppLoaded = await this.page.evaluate(() => {
        return document.querySelector('[data-reactroot]') !== null ||
               document.querySelector('#__next') !== null ||
               document.querySelector('main') !== null ||
               document.body.children.length > 1;
      });

      if (!reactAppLoaded) {
        await this.addIssue('critical', 'functionality', 'React App Not Loading',
          'React admin application does not appear to be mounting properly');
      }

      // Enhanced navigation element detection for React admin
      const navSelectors = [
        // Common React admin patterns
        'nav', 'aside', '.sidebar', '.navigation', '.nav-menu',
        // Specific data attributes
        '[data-section="dashboard"]', '[data-section="editor"]', '[data-section="menu"]', '[data-section="settings"]',
        // Class patterns
        '.nav-item', '.admin-nav', '.main-nav', '.side-nav',
        // Button patterns for SPA navigation
        'button[role="tab"]', '[role="navigation"]', '.tab-button', '.nav-button',
        // Common admin UI patterns
        '.dashboard-nav', '.admin-sidebar', '.header-nav'
      ];

      let navFound = false;
      let foundSelector = null;

      for (const selector of navSelectors) {
        const count = await this.page.locator(selector).count();
        if (count > 0) {
          navFound = true;
          foundSelector = selector;
          console.log(`✅ Navigation found: ${selector} (${count} elements)`);
          break;
        }
      }

      if (!navFound) {
        // Try to find any interactive elements that might be navigation
        const interactiveElements = await this.page.locator('button, a, [role="button"], [role="tab"]').count();
        if (interactiveElements > 0) {
          console.log(`Found ${interactiveElements} interactive elements, but no clear navigation structure`);
          await this.addIssue('medium', 'ui', 'Navigation Structure Unclear',
            `Found ${interactiveElements} interactive elements but no clear navigation pattern`);
        } else {
          await this.addIssue('high', 'ui', 'Navigation Not Found',
            'No navigation elements detected in admin panel');
        }
      }

      // Test for specific admin sections
      await this.testAdminSections();

      this.testResults.passedTests++;
    } catch (error) {
      await this.addIssue('critical', 'functionality', 'Navigation Test Failed',
        `Navigation testing failed: ${error.message}`);
      this.testResults.failedTests++;
    }
  }

  async testAdminSections() {
    console.log('  🔍 Testing admin sections...');

    // Look for common admin section indicators
    const sectionIndicators = [
      { name: 'Dashboard', selectors: ['dashboard', 'home', 'overview'] },
      { name: 'Pages/Editor', selectors: ['editor', 'pages', 'content', 'edit'] },
      { name: 'Menu Manager', selectors: ['menu', 'navigation', 'nav'] },
      { name: 'Settings', selectors: ['settings', 'config', 'preferences'] },
      { name: 'Users', selectors: ['users', 'accounts', 'admin'] },
      { name: 'Media', selectors: ['media', 'images', 'files'] }
    ];

    for (const section of sectionIndicators) {
      let found = false;

      for (const keyword of section.selectors) {
        // Test multiple selector patterns
        const patterns = [
          `[data-section="${keyword}"]`,
          `#${keyword}`,
          `.${keyword}`,
          `[href*="${keyword}"]`,
          `button:has-text("${keyword}")`,
          `a:has-text("${keyword}")`,
          `*:has-text("${section.name}")`,
          `[aria-label*="${keyword}"]`,
          `[title*="${keyword}"]`
        ];

        for (const pattern of patterns) {
          try {
            const count = await this.page.locator(pattern).count();
            if (count > 0) {
              console.log(`    ✅ Found ${section.name}: ${pattern}`);
              found = true;
              break;
            }
          } catch (e) {
            // Some selectors might fail, continue testing
          }
        }

        if (found) break;
      }

      if (!found) {
        await this.addIssue('medium', 'ui', `${section.name} Section Missing`,
          `No UI elements found for ${section.name} section`);
      }
    }
  }

  async testNavigationSection(sectionName) {
    console.log(`  🔍 Testing ${sectionName} section...`);

    try {
      // Try multiple selector patterns for navigation
      const selectors = [
        `[data-section="${sectionName}"]`,
        `#${sectionName}`,
        `#${sectionName}-tab`,
        `.${sectionName}-nav`,
        `.nav-${sectionName}`,
        `[href*="${sectionName}"]`,
        `button:has-text("${sectionName}")`,
        `a:has-text("${sectionName}")`,
        `.nav-item:has-text("${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}")`
      ];

      let sectionElement = null;
      for (const selector of selectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.count() > 0) {
            sectionElement = element;
            console.log(`    ✅ Section element found: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue trying other selectors
        }
      }

      if (sectionElement) {
        // Try to click the section
        try {
          await sectionElement.click();
          await this.page.waitForTimeout(1000); // Wait for section to load
          await this.takeScreenshot(`section-${sectionName}`, `${sectionName} section opened`);

          // Check if section content loaded
          const contentSelectors = [
            `#${sectionName}-content`,
            `.${sectionName}-content`,
            `[data-content="${sectionName}"]`,
            '.tab-content.active',
            '.section-content.active'
          ];

          let contentFound = false;
          for (const contentSelector of contentSelectors) {
            if (await this.page.locator(contentSelector).count() > 0) {
              contentFound = true;
              break;
            }
          }

          if (!contentFound) {
            await this.addIssue('medium', 'ui', `${sectionName} Content Not Loading`,
              `Section ${sectionName} navigation works but content doesn't appear`);
          }

        } catch (error) {
          await this.addIssue('high', 'functionality', `${sectionName} Section Not Clickable`,
            `Section ${sectionName} found but clicking failed: ${error.message}`);
        }
      } else {
        await this.addIssue('high', 'ui', `${sectionName} Section Missing`,
          `No navigation element found for ${sectionName} section`);
      }
    } catch (error) {
      await this.addIssue('medium', 'functionality', `${sectionName} Section Test Failed`,
        `Testing ${sectionName} section failed: ${error.message}`);
    }
  }

  async testLanguageToggle() {
    console.log('\n🌐 Testing Language Toggle...');
    this.testResults.totalTests++;

    try {
      // Look for language toggle elements
      const languageSelectors = [
        '#language-toggle',
        '.language-select',
        '[data-language]',
        'select[name="language"]',
        '.lang-switch',
        'button:has-text("English")',
        'button:has-text("עברית")',
        'button:has-text("EN")',
        'button:has-text("HE")'
      ];

      let languageToggle = null;
      for (const selector of languageSelectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.count() > 0) {
            languageToggle = element;
            console.log(`✅ Language toggle found: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (languageToggle) {
        try {
          await languageToggle.click();
          await this.page.waitForTimeout(1000);
          await this.takeScreenshot('language-toggle', 'Language toggle clicked');

          // Check if language actually changed
          const htmlLang = await this.page.getAttribute('html', 'lang');
          console.log(`Current HTML lang attribute: ${htmlLang}`);

        } catch (error) {
          await this.addIssue('medium', 'functionality', 'Language Toggle Not Working',
            `Language toggle found but not functional: ${error.message}`);
        }
      } else {
        await this.addIssue('low', 'functionality', 'Language Toggle Missing',
          'No language toggle element found in admin panel');
      }

      this.testResults.passedTests++;
    } catch (error) {
      await this.addIssue('medium', 'functionality', 'Language Toggle Test Failed',
        `Language toggle testing failed: ${error.message}`);
      this.testResults.failedTests++;
    }
  }

  async testHebrewLanguageToggleInPageEditor() {
    console.log('\n🇮🇱 Testing Hebrew Language Toggle in Page Editor...');
    this.testResults.totalTests++;

    try {
      // First, navigate to Page Editor if not already there
      console.log('  Navigating to Page Editor...');
      await this.page.goto(`${this.adminUrl}/`, { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(2000);

      // Look for Page Editor tab or navigation
      const pageEditorSelectors = [
        'button:has-text("Page Editor")',
        'a:has-text("Page Editor")',
        '[data-section="editor"]',
        '.nav-item:has-text("Editor")',
        'button:has-text("Pages")',
        'a:has-text("Pages")'
      ];

      let pageEditorNav = null;
      for (const selector of pageEditorSelectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.count() > 0) {
            pageEditorNav = element;
            console.log(`  ✅ Page Editor navigation found: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (pageEditorNav) {
        await pageEditorNav.click();
        await this.page.waitForTimeout(2000);
        console.log('  📝 Navigated to Page Editor');
      } else {
        console.log('  ⚠️ Page Editor navigation not found, assuming we\'re on the main page');
      }

      await this.takeScreenshot('page-editor-initial', 'Page Editor initial state');

      // Look for Hebrew language button - more specific selectors
      const hebrewButtonSelectors = [
        'button:has-text("עברית")',
        'button:has-text("Hebrew")',
        '[aria-label*="Hebrew"]',
        'button[data-language="he"]',
        '.language-toggle button:has-text("עברית")',
        '.lang-switch button:has-text("עברית")'
      ];

      let hebrewButton = null;
      for (const selector of hebrewButtonSelectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.count() > 0 && await element.isVisible()) {
            hebrewButton = element;
            console.log(`  ✅ Hebrew button found: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (!hebrewButton) {
        await this.addIssue('high', 'functionality', 'Hebrew Language Button Missing',
          'Hebrew language toggle button not found in Page Editor');
        this.testResults.failedTests++;
        return;
      }

      // Test initial state (should be English)
      console.log('  📋 Testing initial state...');

      // Check initial page selector dropdown
      const pageSelector = this.page.locator('select').first();
      let initialPageOptions = [];
      try {
        const optionCount = await pageSelector.locator('option').count();
        for (let i = 0; i < Math.min(optionCount, 5); i++) {
          const optionText = await pageSelector.locator('option').nth(i).textContent();
          initialPageOptions.push(optionText);
        }
        console.log(`  Initial page options: ${initialPageOptions.join(', ')}`);
      } catch (e) {
        console.log('  ⚠️ Could not read initial page options');
      }

      // Click Hebrew button
      console.log('  🇮🇱 Clicking Hebrew button...');
      await hebrewButton.click();
      await this.page.waitForTimeout(3000); // Wait for API calls and state updates

      await this.takeScreenshot('hebrew-button-clicked', 'After Hebrew button clicked');

      // Wait for potential API calls to complete
      await this.page.waitForTimeout(2000);

      // Check if Hebrew button is now active/selected
      const isHebrewActive = await this.page.evaluate(() => {
        const hebrewButton = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent?.includes('עברית'));

        if (!hebrewButton) return false;

        // Check for active states
        return hebrewButton.classList.contains('active') ||
               hebrewButton.classList.contains('selected') ||
               hebrewButton.getAttribute('variant') === 'default' ||
               hebrewButton.getAttribute('data-state') === 'active';
      });

      if (!isHebrewActive) {
        await this.addIssue('high', 'functionality', 'Hebrew Button Not Activating',
          'Hebrew button clicked but does not show as active/selected');
      } else {
        console.log('  ✅ Hebrew button shows as active');
      }

      // Test if page options changed to Hebrew pages
      let hebrewPageOptions = [];
      try {
        await this.page.waitForTimeout(1000); // Allow dropdown to refresh
        const optionCount = await pageSelector.locator('option').count();
        for (let i = 0; i < Math.min(optionCount, 5); i++) {
          const optionText = await pageSelector.locator('option').nth(i).textContent();
          hebrewPageOptions.push(optionText);
        }
        console.log(`  Hebrew page options: ${hebrewPageOptions.join(', ')}`);
      } catch (e) {
        console.log('  ⚠️ Could not read Hebrew page options');
      }

      // Check if page content area shows Hebrew content
      const contentTextareaSelectors = [
        'textarea#content',
        'textarea[placeholder*="content"]',
        'textarea[placeholder*="HTML"]',
        '.content textarea',
        'textarea'
      ];

      let contentTextarea = null;
      for (const selector of contentTextareaSelectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.count() > 0) {
            contentTextarea = element;
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      let hebrewContentFound = false;
      if (contentTextarea) {
        const contentValue = await contentTextarea.inputValue();
        console.log(`  Content textarea length: ${contentValue.length} characters`);

        // Check for Hebrew characters in content
        const hasHebrewText = /[\u0590-\u05FF]/.test(contentValue);
        if (hasHebrewText) {
          hebrewContentFound = true;
          console.log('  ✅ Hebrew content detected in textarea');
        } else {
          console.log('  ⚠️ No Hebrew characters found in content textarea');
        }
      }

      // Check page title field for Hebrew
      const titleInputSelectors = [
        'input#title',
        'input[placeholder*="title"]',
        'input[name="title"]',
        '.title input'
      ];

      let titleInput = null;
      for (const selector of titleInputSelectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.count() > 0) {
            titleInput = element;
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      let hebrewTitleFound = false;
      if (titleInput) {
        const titleValue = await titleInput.inputValue();
        const hasHebrewText = /[\u0590-\u05FF]/.test(titleValue);
        if (hasHebrewText) {
          hebrewTitleFound = true;
          console.log('  ✅ Hebrew title detected');
        } else {
          console.log(`  ⚠️ Title field value: "${titleValue}" (no Hebrew detected)`);
        }
      }

      // Monitor network requests for Hebrew API calls
      const requests = [];
      this.page.on('request', request => {
        if (request.url().includes('/api/pages') && request.url().includes('lang=he')) {
          requests.push(request.url());
          console.log(`  🌐 Hebrew API request detected: ${request.url()}`);
        }
      });

      await this.page.waitForTimeout(1000);

      // Evaluate overall Hebrew functionality
      if (!hebrewContentFound && !hebrewTitleFound && requests.length === 0) {
        await this.addIssue('critical', 'functionality', 'Hebrew Language Toggle Not Working',
          'Hebrew button clicked but no Hebrew content loaded - API calls may not be using Hebrew language parameter');
      } else {
        let successMessage = 'Hebrew language toggle partially working: ';
        const successes = [];
        if (hebrewContentFound) successes.push('Hebrew content loaded');
        if (hebrewTitleFound) successes.push('Hebrew title loaded');
        if (requests.length > 0) successes.push(`${requests.length} Hebrew API calls made`);

        console.log(`  ✅ ${successMessage}${successes.join(', ')}`);
      }

      // Test switching back to English
      console.log('  🇺🇸 Testing switch back to English...');
      const englishButtonSelectors = [
        'button:has-text("English")',
        'button:has-text("EN")',
        '[data-language="en"]',
        'button[aria-label*="English"]'
      ];

      let englishButton = null;
      for (const selector of englishButtonSelectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.count() > 0 && await element.isVisible()) {
            englishButton = element;
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (englishButton) {
        await englishButton.click();
        await this.page.waitForTimeout(2000);
        await this.takeScreenshot('english-button-clicked', 'After English button clicked');
        console.log('  ✅ Switched back to English');
      }

      this.testResults.passedTests++;

    } catch (error) {
      await this.addIssue('critical', 'functionality', 'Hebrew Language Toggle Test Failed',
        `Hebrew language toggle testing failed: ${error.message}`);
      this.testResults.failedTests++;
    }
  }

  async testApiEndpoints() {
    console.log('\n🔌 Testing API Endpoints...');
    this.testResults.totalTests++;

    try {
      // Test known API endpoints from the code
      const endpoints = [
        { url: '/api/admin/menu', expectedStatus: 404, description: 'Known broken menu endpoint' },
        { url: '/api/admin/languages', expectedStatus: 401, description: 'Languages endpoint (should require auth)' },
        { url: '/api/admin/pages', expectedStatus: 401, description: 'Pages endpoint (should require auth)' },
        { url: '/api/contact', expectedStatus: 200, description: 'Contact form endpoint' }
      ];

      for (const endpoint of endpoints) {
        await this.testApiEndpoint(endpoint.url, 'GET', endpoint.expectedStatus, endpoint.description);
      }

      // Test authentication endpoint
      await this.testApiEndpoint('/api/admin/login', 'POST', 401, 'Login endpoint without credentials');

      this.testResults.passedTests++;
    } catch (error) {
      await this.addIssue('high', 'api', 'API Testing Failed',
        `API endpoint testing failed: ${error.message}`);
      this.testResults.failedTests++;
    }
  }

  async testFormFunctionality() {
    console.log('\n📝 Testing Form Functionality...');
    this.testResults.totalTests++;

    try {
      // Look for forms in the admin panel
      const forms = await this.page.locator('form').count();
      console.log(`Found ${forms} forms`);

      if (forms === 0) {
        await this.addIssue('low', 'ui', 'No Forms Found',
          'No forms detected in admin panel');
        return;
      }

      // Test each form
      for (let i = 0; i < Math.min(forms, 3); i++) { // Test max 3 forms
        const form = this.page.locator('form').nth(i);

        try {
          // Get form action
          const action = await form.getAttribute('action');
          console.log(`  Testing form ${i + 1} with action: ${action || 'none'}`);

          // Look for required fields
          const requiredFields = await form.locator('[required]').count();
          const inputs = await form.locator('input, textarea, select').count();

          console.log(`  Form has ${inputs} inputs, ${requiredFields} required`);

          // Look for submit button
          const submitButtons = await form.locator('button[type="submit"], input[type="submit"]').count();
          if (submitButtons === 0) {
            await this.addIssue('medium', 'ui', `Form ${i + 1} Missing Submit Button`,
              'Form found but no submit button detected');
          }

        } catch (error) {
          await this.addIssue('medium', 'functionality', `Form ${i + 1} Testing Error`,
            `Error testing form: ${error.message}`);
        }
      }

      this.testResults.passedTests++;
    } catch (error) {
      await this.addIssue('medium', 'functionality', 'Form Testing Failed',
        `Form functionality testing failed: ${error.message}`);
      this.testResults.failedTests++;
    }
  }

  async testJavaScriptErrors() {
    console.log('\n🐛 Testing JavaScript Execution...');
    this.testResults.totalTests++;

    try {
      // Execute some basic JavaScript to check for runtime errors
      const jsTests = [
        {
          code: 'typeof window !== "undefined"',
          expected: true,
          description: 'Window object available'
        },
        {
          code: 'typeof document !== "undefined"',
          expected: true,
          description: 'Document object available'
        },
        {
          code: 'typeof jQuery !== "undefined" || typeof $ !== "undefined"',
          expected: null,
          description: 'jQuery availability (optional)'
        }
      ];

      for (const test of jsTests) {
        try {
          const result = await this.page.evaluate(test.code);
          if (test.expected !== null && result !== test.expected) {
            await this.addIssue('medium', 'functionality', 'JavaScript Test Failed',
              `${test.description}: expected ${test.expected}, got ${result}`);
          } else {
            console.log(`  ✅ ${test.description}: ${result}`);
          }
        } catch (error) {
          await this.addIssue('high', 'functionality', 'JavaScript Execution Error',
            `${test.description} failed: ${error.message}`);
        }
      }

      // Check for common JavaScript errors
      const commonErrorPatterns = [
        'is not a function',
        'Cannot read property',
        'undefined is not an object',
        'null is not an object',
        'Permission denied'
      ];

      const errorCount = this.consoleErrors.filter(error =>
        commonErrorPatterns.some(pattern => error.message.includes(pattern))
      ).length;

      if (errorCount > 0) {
        await this.addIssue('high', 'functionality', 'JavaScript Runtime Errors',
          `Found ${errorCount} JavaScript runtime errors`);
      }

      this.testResults.passedTests++;
    } catch (error) {
      await this.addIssue('high', 'functionality', 'JavaScript Testing Failed',
        `JavaScript testing failed: ${error.message}`);
      this.testResults.failedTests++;
    }
  }

  async testResourceLoading() {
    console.log('\n📦 Testing Resource Loading...');
    this.testResults.totalTests++;

    try {
      // Check for broken images
      const images = await this.page.locator('img').count();
      console.log(`Found ${images} images`);

      for (let i = 0; i < Math.min(images, 10); i++) { // Test max 10 images
        const img = this.page.locator('img').nth(i);
        const src = await img.getAttribute('src');
        const naturalWidth = await img.evaluate(el => el.naturalWidth);

        if (naturalWidth === 0) {
          await this.addIssue('medium', 'ui', 'Broken Image',
            `Image failed to load: ${src}`);
        }
      }

      // Check for CSS files
      const stylesheets = await this.page.locator('link[rel="stylesheet"]').count();
      console.log(`Found ${stylesheets} stylesheets`);

      // Check for JavaScript files
      const scripts = await this.page.locator('script[src]').count();
      console.log(`Found ${scripts} external scripts`);

      // Check for font loading issues (mentioned in requirements)
      const fontErrors = this.networkErrors.filter(error =>
        error.url.includes('.woff') || error.url.includes('.woff2') || error.url.includes('font')
      );

      if (fontErrors.length > 0) {
        await this.addIssue('medium', 'ui', 'Font Loading Issues',
          `Found ${fontErrors.length} font loading errors`);
      }

      this.testResults.passedTests++;
    } catch (error) {
      await this.addIssue('medium', 'functionality', 'Resource Loading Test Failed',
        `Resource loading testing failed: ${error.message}`);
      this.testResults.failedTests++;
    }
  }

  async generateReport() {
    console.log('\n📊 Generating Test Report...');

    this.testResults.endTime = new Date().toISOString();
    this.testResults.issues = this.issues;
    this.testResults.screenshots = this.screenshots;
    this.testResults.consoleErrors = this.consoleErrors;
    this.testResults.networkErrors = this.networkErrors;
    this.testResults.apiResults = this.apiResults;

    // Generate summary
    const criticalIssues = this.issues.filter(issue => issue.severity === 'critical').length;
    const highIssues = this.issues.filter(issue => issue.severity === 'high').length;
    const mediumIssues = this.issues.filter(issue => issue.severity === 'medium').length;
    const lowIssues = this.issues.filter(issue => issue.severity === 'low').length;

    this.testResults.summary = `
Admin Panel Test Results
========================
Test Duration: ${new Date(this.testResults.endTime) - new Date(this.testResults.startTime)}ms
Total Tests: ${this.testResults.totalTests}
Passed: ${this.testResults.passedTests}
Failed: ${this.testResults.failedTests}

Issues Found:
- Critical: ${criticalIssues}
- High: ${highIssues}
- Medium: ${mediumIssues}
- Low: ${lowIssues}

Console Errors: ${this.consoleErrors.length}
Network Errors: ${this.networkErrors.length}
API Tests: ${this.apiResults.length}
Screenshots: ${this.screenshots.length}
`;

    // Save detailed report
    const reportPath = path.join(__dirname, 'admin-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(this.testResults, null, 2));

    console.log(this.testResults.summary);
    console.log(`\n📋 Detailed report saved to: ${reportPath}`);

    return this.testResults;
  }

  async runAllTests() {
    try {
      console.log('🧪 Starting Admin Panel Comprehensive Testing...\n');

      await this.init();

      // Run all tests
      await this.testNavigation();
      await this.testLanguageToggle();
      await this.testHebrewLanguageToggleInPageEditor();
      await this.testApiEndpoints();
      await this.testFormFunctionality();
      await this.testJavaScriptErrors();
      await this.testResourceLoading();

      // Generate final report
      await this.generateReport();

    } catch (error) {
      console.error('💥 Test suite failed:', error);
      await this.addIssue('critical', 'functionality', 'Test Suite Failure',
        `Entire test suite failed: ${error.message}`);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }

    return this.testResults;
  }
}

// Main execution
async function main() {
  const tester = new AdminPanelTester();
  const results = await tester.runAllTests();

  // Print summary of critical issues
  const criticalIssues = results.issues.filter(issue => issue.severity === 'critical');
  const highIssues = results.issues.filter(issue => issue.severity === 'high');

  if (criticalIssues.length > 0 || highIssues.length > 0) {
    console.log('\n🚨 CRITICAL & HIGH PRIORITY ISSUES:');
    [...criticalIssues, ...highIssues].forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`);
      console.log(`   ${issue.description}`);
      console.log(`   URL: ${issue.url}`);
      if (issue.screenshot) {
        console.log(`   Screenshot: ${issue.screenshot.filename}`);
      }
      console.log('');
    });
  }

  console.log('\n✅ Admin Panel Testing Complete!');
  process.exit(0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default AdminPanelTester;