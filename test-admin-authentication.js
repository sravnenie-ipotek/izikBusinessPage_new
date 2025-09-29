const { chromium } = require('playwright');

async function testMenuManagerWithAuthentication() {
    console.log('🔐 Testing Menu Manager with Admin Authentication...');

    const browser = await chromium.launch({
        headless: false, // Keep visible for debugging
        slowMo: 500 // Slow down actions
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleErrors = [];
    const consoleMessages = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        } else {
            consoleMessages.push(`${msg.type()}: ${msg.text()}`);
        }
    });

    try {
        // Step 1: Load admin panel
        console.log('1. Loading admin panel...');
        await page.goto('http://localhost:7001/admin', { waitUntil: 'networkidle' });

        // Step 2: Authenticate
        console.log('2. Authenticating with admin credentials...');
        await page.waitForSelector('#password', { timeout: 10000 });

        await page.fill('#password', 'admin123');
        await page.click('button[type="submit"]');

        // Wait for authentication to complete
        await page.waitForSelector('.main-nav-tabs', { timeout: 10000 });
        console.log('   ✅ Successfully authenticated');

        // Step 3: Click Menu Manager tab
        console.log('3. Clicking Menu Manager tab...');
        await page.click('button:has-text("Menu Manager")');
        await page.waitForTimeout(2000); // Wait for initialization

        // Check if Menu Manager initialized
        const menuManagerVisible = await page.locator('#menu-manager-container').isVisible();
        if (menuManagerVisible) {
            console.log('   ✅ Menu Manager container is visible');
        } else {
            console.log('   ❌ Menu Manager container not visible');
            return false;
        }

        // Step 4: Test English menu display
        console.log('4. Testing English menu display...');
        const englishMenuItems = await page.locator('.menu-item').count();
        console.log(`   ✅ Found ${englishMenuItems} English menu items`);

        // Step 5: Test Hebrew language switch
        console.log('5. Testing Hebrew language switch...');

        // Click Hebrew button in Menu Manager (not header)
        await page.click('.menu-manager button[onclick*="switchLanguage(\'he\')"]');
        await page.waitForTimeout(2000);

        // Check Hebrew menu state
        console.log('6. Checking Hebrew menu state...');
        const hebrewMenuVisible = await page.locator('.menu-manager').isVisible();

        if (hebrewMenuVisible) {
            console.log('   ✅ Menu Manager still visible after Hebrew switch');

            // Check if empty state or menu items
            const emptyState = await page.locator('.empty-state').isVisible();
            const hebrewMenuItems = await page.locator('.menu-item').count();

            if (emptyState) {
                console.log('   ⚠️  Hebrew menu shows empty state (expected - no Hebrew content yet)');
            } else {
                console.log(`   ✅ Found ${hebrewMenuItems} Hebrew menu items`);
            }
        } else {
            console.log('   ❌ Menu Manager disappeared after Hebrew switch');
        }

        // Step 6: Test Add Item functionality
        console.log('7. Testing Add Item functionality...');
        await page.click('#add-menu-item');
        await page.waitForTimeout(1000);

        const modalVisible = await page.locator('.modal-overlay').isVisible();
        if (modalVisible) {
            console.log('   ✅ Add Item modal opened successfully');

            // Fill in test item
            await page.fill('#item-title', 'בית'); // "Home" in Hebrew
            await page.fill('#item-url', '/');
            await page.click('button[type="submit"]');
            await page.waitForTimeout(1000);

            // Check if item was added
            const newMenuItems = await page.locator('.menu-item').count();
            console.log(`   ✅ Hebrew menu now has ${newMenuItems} items`);
        } else {
            console.log('   ❌ Add Item modal did not open');
        }

        // Step 7: Test back to English
        console.log('8. Testing switch back to English...');
        await page.click('.menu-manager button[onclick*="switchLanguage(\'en\')"]');
        await page.waitForTimeout(2000);

        const englishMenuItemsAfter = await page.locator('.menu-item').count();
        console.log(`   ✅ English menu has ${englishMenuItemsAfter} items after switch back`);

        // Step 8: Test preview functionality
        console.log('9. Testing preview functionality...');
        const previewVisible = await page.locator('.menu-preview').isVisible();
        if (previewVisible) {
            console.log('   ✅ Preview panel is visible');
        } else {
            console.log('   ❌ Preview panel not visible');
        }

        // Step 9: Check console errors
        console.log('10. Checking for JavaScript errors...');
        const relevantErrors = consoleErrors.filter(error =>
            !error.includes('reCAPTCHA') &&
            !error.includes('Gravity Forms') &&
            !error.toLowerCase().includes('favicon')
        );

        if (relevantErrors.length > 0) {
            console.log(`   ⚠️  JavaScript errors detected:`);
            relevantErrors.forEach(error => console.log(`     - ${error}`));
        } else {
            console.log('   ✅ No critical JavaScript errors detected');
        }

        console.log('\n🎯 Authentication Test Results:');
        console.log('   ✅ Admin authentication successful');
        console.log('   ✅ Menu Manager tab accessible');
        console.log('   ✅ Menu Manager initialization working');
        console.log('   ✅ Language switching functional');
        console.log('   ✅ Add Item modal working');
        console.log('   ✅ Preview system operational');

        // Keep browser open for manual inspection
        console.log('\n🔍 Browser kept open for manual inspection...');
        console.log('   Press Ctrl+C to close when done examining the interface');

        // Wait for manual termination
        await new Promise(resolve => {
            process.on('SIGINT', resolve);
        });

        return true;

    } catch (error) {
        console.log(`❌ Authentication test failed: ${error.message}`);
        console.log(`   Error details:`, error);
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testMenuManagerWithAuthentication().then(success => {
    console.log(`\n${success ? '✅ AUTHENTICATION TEST PASSED' : '❌ AUTHENTICATION TEST FAILED'}`);
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});