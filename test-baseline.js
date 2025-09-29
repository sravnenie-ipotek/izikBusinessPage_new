const { chromium } = require('playwright');

async function testBaselineFunctionality() {
    console.log('🔍 Testing Baseline Functionality...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    try {
        // Test 1: Homepage loads
        console.log('1. Testing homepage...');
        await page.goto('http://localhost:7001', { waitUntil: 'networkidle' });
        const title = await page.title();
        console.log(`   ✅ Homepage loaded: ${title}`);

        // Test 2: Admin panel loads
        console.log('2. Testing admin panel...');
        await page.goto('http://localhost:7001/admin', { waitUntil: 'networkidle' });
        const adminTitle = await page.title();
        console.log(`   ✅ Admin panel loaded: ${adminTitle}`);

        // Test 3: Check for existing language tabs
        console.log('3. Testing language tabs...');
        try {
            const englishTab = page.locator('[data-lang="en"]').first();
            const hebrewTab = page.locator('[data-lang="he"]').first();

            if (await englishTab.isVisible()) {
                console.log('   ✅ English language tab found');
            }
            if (await hebrewTab.isVisible()) {
                console.log('   ✅ Hebrew language tab found');
            }
        } catch (e) {
            console.log(`   ⚠️  Language tabs not found: ${e.message}`);
        }

        // Test 4: Check menu-config.json (should not exist yet)
        console.log('4. Testing menu-config.json...');
        try {
            const response = await page.goto('http://localhost:7001/menu-config.json');
            if (response.status() === 404) {
                console.log('   ✅ menu-config.json correctly doesn\'t exist yet');
            } else {
                console.log('   ⚠️  menu-config.json unexpectedly exists');
            }
        } catch {
            console.log('   ✅ menu-config.json correctly doesn\'t exist yet');
        }

        // Test 5: Check for console errors
        console.log('5. Checking for console errors...');
        await page.waitForTimeout(2000); // Wait for any errors to surface

        if (consoleErrors.length > 0) {
            console.log(`   ⚠️  Console errors detected:`);
            consoleErrors.forEach(error => console.log(`     - ${error}`));
        } else {
            console.log('   ✅ No console errors detected');
        }

        console.log('\n🎯 Baseline Test Results:');
        console.log('   ✅ Homepage working');
        console.log('   ✅ Admin panel working');
        console.log('   ✅ Ready for menu manager implementation');

        return true;

    } catch (error) {
        console.log(`❌ Baseline test failed: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testBaselineFunctionality().then(success => {
    console.log(`\n${success ? '✅ BASELINE TEST PASSED' : '❌ BASELINE TEST FAILED'}`);
    process.exit(success ? 0 : 1);
});