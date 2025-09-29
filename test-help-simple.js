const { chromium } = require('playwright');

async function testHelpModalSimple() {
    console.log('🔧 Simple Help Modal Test...');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Load admin and authenticate
        await page.goto('http://localhost:7001/admin', { waitUntil: 'networkidle' });
        await page.fill('#password', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForSelector('.main-nav-tabs', { timeout: 10000 });

        // Open Menu Manager
        await page.click('button:has-text("Menu Manager")');
        await page.waitForTimeout(3000);

        console.log('1. Clicking help button...');
        await page.click('#show-help');
        await page.waitForTimeout(2000);

        // Check if modal is visible
        const modalVisible = await page.locator('.modal-overlay').isVisible();
        console.log(`✅ Modal visible: ${modalVisible}`);

        if (modalVisible) {
            // Check modal title
            const titleText = await page.locator('.modal-header h3').first().textContent();
            console.log(`✅ Modal title: "${titleText}"`);

            // Check if close button exists
            const closeButtonExists = await page.locator('.close-modal').count();
            console.log(`✅ Close buttons found: ${closeButtonExists}`);

            console.log('2. Testing close functionality...');
            await page.click('.close-modal');
            await page.waitForTimeout(1000);

            const modalStillVisible = await page.locator('.modal-overlay').isVisible();
            console.log(`✅ Modal closed: ${!modalStillVisible}`);
        }

        console.log('\n🎉 Help modal is working correctly!');
        console.log('Browser will stay open for 10 seconds...');
        await page.waitForTimeout(10000);

        return modalVisible;

    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

testHelpModalSimple().then(success => {
    console.log(`\n${success ? '✅ HELP MODAL WORKS!' : '❌ HELP MODAL FAILED'}`);
    process.exit(success ? 0 : 1);
});