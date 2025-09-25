const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testUrls() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const tests = [
    {
      name: 'English Homepage',
      url: 'http://localhost:7001/',
      expectedStatus: 200,
      description: 'Should show English homepage (working according to user)'
    },
    {
      name: 'Admin Panel',
      url: 'http://localhost:7001/admin.html',
      expectedStatus: 200,
      description: 'Should show admin panel'
    },
    {
      name: 'Hebrew Homepage',
      url: 'http://localhost:7001/he/',
      expectedStatus: 200,
      description: 'Should show Hebrew homepage'
    },
    {
      name: 'Admin Panel (Clean URL)',
      url: 'http://localhost:7001/admin',
      expectedStatus: 200,
      description: 'Should show admin panel via Express route'
    }
  ];

  console.log('🔍 Starting URL diagnostic tests...\n');

  // Test each URL
  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    console.log(`URL: ${test.url}`);

    try {
      const response = await page.goto(test.url, {
        waitUntil: 'networkidle',
        timeout: 10000
      });

      const status = response.status();
      const title = await page.title();
      const h1Text = await page.$eval('h1', el => el.textContent).catch(() => 'No H1 found');

      // Take screenshot
      const screenshotName = `${test.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      await page.screenshot({
        path: path.join(screenshotsDir, screenshotName),
        fullPage: true
      });

      const result = {
        name: test.name,
        url: test.url,
        status: status,
        expected: test.expectedStatus,
        success: status === test.expectedStatus,
        title: title,
        h1: h1Text,
        screenshot: screenshotName,
        error: null
      };

      results.tests.push(result);

      console.log(`  Status: ${status} (Expected: ${test.expectedStatus})`);
      console.log(`  Title: ${title}`);
      console.log(`  H1: ${h1Text}`);
      console.log(`  Screenshot: ${screenshotName}`);
      console.log(`  Result: ${result.success ? '✅ PASS' : '❌ FAIL'}\n`);

    } catch (error) {
      console.log(`  Error: ${error.message}`);

      const result = {
        name: test.name,
        url: test.url,
        status: 'ERROR',
        expected: test.expectedStatus,
        success: false,
        title: null,
        h1: null,
        screenshot: null,
        error: error.message
      };

      results.tests.push(result);
      console.log(`  Result: ❌ FAIL\n`);
    }
  }

  console.log('🧪 Testing API Endpoints...\n');

  // Test API endpoints
  const apiTests = [
    {
      name: 'Admin Login API',
      url: 'http://localhost:7001/api/admin/login',
      method: 'POST',
      body: { password: 'admin123' },
      expectedStatus: 200
    },
    {
      name: 'Contact API',
      url: 'http://localhost:7001/api/contact',
      method: 'POST',
      body: { name: 'Test', email: 'test@test.com', message: 'Test message' },
      expectedStatus: 200
    }
  ];

  for (const apiTest of apiTests) {
    console.log(`Testing API: ${apiTest.name}`);
    console.log(`URL: ${apiTest.url}`);

    try {
      const response = await page.evaluate(async ({ url, method, body }) => {
        const res = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        });

        return {
          status: res.status,
          statusText: res.statusText,
          body: await res.text()
        };
      }, { url: apiTest.url, method: apiTest.method, body: apiTest.body });

      const result = {
        name: apiTest.name,
        url: apiTest.url,
        status: response.status,
        expected: apiTest.expectedStatus,
        success: response.status === apiTest.expectedStatus,
        response: response.body,
        error: null
      };

      results.tests.push(result);

      console.log(`  Status: ${response.status} (Expected: ${apiTest.expectedStatus})`);
      console.log(`  Response: ${response.body}`);
      console.log(`  Result: ${result.success ? '✅ PASS' : '❌ FAIL'}\n`);

    } catch (error) {
      console.log(`  Error: ${error.message}`);

      const result = {
        name: apiTest.name,
        url: apiTest.url,
        status: 'ERROR',
        expected: apiTest.expectedStatus,
        success: false,
        response: null,
        error: error.message
      };

      results.tests.push(result);
      console.log(`  Result: ❌ FAIL\n`);
    }
  }

  // Test static file serving
  console.log('📁 Testing Static File Serving...\n');

  const staticTests = [
    'http://localhost:7001/wp-content/themes/normand/assets/css/global.css',
    'http://localhost:7001/wp-content/themes/normand/assets/js/scripts.js'
  ];

  for (const staticUrl of staticTests) {
    console.log(`Testing static file: ${staticUrl}`);

    try {
      const response = await page.goto(staticUrl);
      const status = response.status();

      const result = {
        name: `Static File: ${path.basename(staticUrl)}`,
        url: staticUrl,
        status: status,
        expected: 200,
        success: status === 200,
        error: null
      };

      results.tests.push(result);

      console.log(`  Status: ${status}`);
      console.log(`  Result: ${result.success ? '✅ PASS' : '❌ FAIL'}\n`);

    } catch (error) {
      console.log(`  Error: ${error.message}`);
      console.log(`  Result: ❌ FAIL\n`);
    }
  }

  await browser.close();

  // Save results
  fs.writeFileSync(
    path.join(__dirname, 'test-results.json'),
    JSON.stringify(results, null, 2)
  );

  // Print summary
  console.log('📊 TEST SUMMARY\n');
  console.log('='.repeat(50));

  const passed = results.tests.filter(t => t.success).length;
  const failed = results.tests.filter(t => !t.success).length;

  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);

  console.log('\nFailed Tests:');
  results.tests.filter(t => !t.success).forEach(test => {
    console.log(`  - ${test.name}: ${test.error || `Status ${test.status} (expected ${test.expected})`}`);
  });

  console.log('\n📸 Screenshots saved in ./screenshots/');
  console.log('📄 Full results saved in ./test-results.json');

  return results;
}

// Run the tests
testUrls().catch(console.error);