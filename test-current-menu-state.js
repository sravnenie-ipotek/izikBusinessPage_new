const { chromium } = require('playwright');

async function testCurrentMenuState() {
    console.log('🔍 Testing Current Menu Manager State...');

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

        // Step 3: Check which version is loaded
        console.log('3. Checking Menu Manager version...');
        const hasTranslations = await page.evaluate(() => {
            return window.menuManager && typeof window.menuManager.t === 'function';
        });

        const hasUILanguage = await page.evaluate(() => {
            return window.menuManager && typeof window.menuManager.currentUILanguage !== 'undefined';
        });

        console.log(`   📊 Has translations: ${hasTranslations}`);
        console.log(`   📊 Has UI language: ${hasUILanguage}`);

        // Step 4: Test English menu count
        console.log('4. Testing English menu...');
        await page.click('.menu-manager button[onclick*="switchLanguage(\'en\')"]');
        await page.waitForTimeout(2000);

        const englishCount = await page.locator('.menu-item').count();
        console.log(`   📊 English menu items: ${englishCount}`);

        // Step 5: Test Hebrew switch
        console.log('5. Testing Hebrew switch...');
        await page.click('.menu-manager button[onclick*="switchLanguage(\'he\')"]');
        await page.waitForTimeout(2000);

        const hebrewCount = await page.locator('.menu-item').count();
        console.log(`   📊 Hebrew menu items: ${hebrewCount}`);

        // Step 6: Check console for debug info
        console.log('6. Checking console logs...');
        const consoleLogs = await page.evaluate(() => {
            return window.menuManagerLogs || [];
        });

        if (consoleLogs.length > 0) {
            console.log('   📝 Menu Manager logs:', consoleLogs);
        }

        // Step 7: Test if we can access the configuration directly
        console.log('7. Testing configuration access...');
        const configAccess = await page.evaluate(() => {
            if (window.menuManager && window.menuManager.config) {
                return {
                    hasEnglish: !!window.menuManager.config.menu?.en,
                    hasHebrew: !!window.menuManager.config.menu?.he,
                    englishItems: window.menuManager.config.menu?.en?.items?.length || 0,
                    hebrewItems: window.menuManager.config.menu?.he?.items?.length || 0
                };
            }
            return null;
        });

        if (configAccess) {
            console.log('   📊 Configuration status:', configAccess);
        } else {
            console.log('   ⚠️  Could not access Menu Manager configuration');
        }

        console.log('\n🎯 Current Menu Manager Status:');
        console.log(`   Version: ${hasTranslations ? 'Enhanced' : 'Basic'}`);
        console.log(`   English items: ${englishCount}`);
        console.log(`   Hebrew items: ${hebrewCount}`);

        // Keep open for 15 seconds
        console.log('\n🔍 Keeping browser open for 15 seconds...');
        await page.waitForTimeout(15000);

        return true;

    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

testCurrentMenuState().then(success => {
    console.log(`\n${success ? '✅ MENU STATE TEST COMPLETED' : '❌ MENU STATE TEST FAILED'}`);
    process.exit(success ? 0 : 1);
});