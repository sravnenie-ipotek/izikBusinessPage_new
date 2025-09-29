const { chromium } = require('playwright');

async function testHelpModal() {
    console.log('🔧 Testing Help Modal Functionality...');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 500
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Step 1: Load and authenticate
        console.log('1. Loading admin and authenticating...');
        await page.goto('http://localhost:7001/admin', { waitUntil: 'networkidle' });
        await page.fill('#password', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForSelector('.main-nav-tabs', { timeout: 10000 });

        // Step 2: Open Menu Manager
        console.log('2. Opening Menu Manager...');
        await page.click('button:has-text("Menu Manager")');
        await page.waitForTimeout(3000);

        // Step 3: Check if help button exists
        console.log('3. Checking if help button exists...');
        const helpButton = await page.locator('#show-help').count();
        console.log(`   📊 Help buttons found: ${helpButton}`);

        if (helpButton === 0) {
            console.log('   ❌ Help button not found!');
            return false;
        }

        // Step 4: Check button text
        const helpButtonText = await page.locator('#show-help').textContent();
        console.log(`   📝 Help button text: "${helpButtonText}"`);

        // Step 5: Listen to console logs
        page.on('console', msg => {
            if (msg.text().includes('🔧') || msg.text().includes('📝') || msg.text().includes('✅')) {
                console.log(`   🖥️ Browser console: ${msg.text()}`);
            }
        });

        // Step 6: Click help button
        console.log('4. Clicking help button...');
        await page.click('#show-help');
        await page.waitForTimeout(2000);

        // Step 7: Check if modal appears
        const modalCount = await page.locator('.modal-overlay').count();
        console.log(`   📊 Modal overlays found: ${modalCount}`);

        if (modalCount > 0) {
            const modalVisible = await page.locator('.modal-overlay').isVisible();
            console.log(`   👁️ Modal visible: ${modalVisible}`);

            if (modalVisible) {
                const modalTitle = await page.locator('.modal h3').textContent();
                console.log(`   📝 Modal title: "${modalTitle}"`);

                const helpContent = await page.locator('.help-content').textContent();
                console.log(`   📝 Help content length: ${helpContent.length} characters`);
                console.log(`   📝 Help content preview: "${helpContent.substring(0, 100)}..."`);

                // Check if close button works
                console.log('5. Testing close button...');
                await page.click('.close-modal');
                await page.waitForTimeout(1000);

                const modalStillVisible = await page.locator('.modal-overlay').isVisible();
                console.log(`   👁️ Modal still visible after close: ${modalStillVisible}`);
            }
        } else {
            console.log('   ❌ No modal found after clicking help button');

            // Check for any errors
            const errorElements = await page.locator('.error, .notification').count();
            console.log(`   ⚠️ Error elements found: ${errorElements}`);
        }

        // Keep browser open for inspection
        console.log('\n🔍 Browser will stay open for 15 seconds for inspection...');
        await page.waitForTimeout(15000);

        return modalCount > 0;

    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

testHelpModal().then(success => {
    console.log(`\n${success ? '✅ HELP MODAL TEST PASSED' : '❌ HELP MODAL TEST FAILED'}`);
    process.exit(success ? 0 : 1);
});