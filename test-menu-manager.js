// Simple test to verify menu manager functionality
// Run this in browser console after loading the admin panel

console.log('🧪 Testing Menu Manager Functionality...\n');

// Test 1: Check if MenuManager class exists
console.log('1. Testing MenuManager class existence:');
if (typeof MenuManager !== 'undefined') {
    console.log('✅ MenuManager class is defined');
} else {
    console.log('❌ MenuManager class is not defined');
}

// Test 2: Check if menu manager instance exists
console.log('\n2. Testing MenuManager instance:');
if (typeof window.menuManager !== 'undefined') {
    console.log('✅ MenuManager instance exists in window.menuManager');

    // Test 3: Check translation functionality
    console.log('\n3. Testing translation system:');
    if (typeof window.menuManager.t === 'function') {
        console.log('✅ Translation function exists');
        console.log('📝 English welcome:', window.menuManager.t('welcome'));

        // Switch to Hebrew and test
        if (typeof window.menuManager.switchUILanguage === 'function') {
            window.menuManager.switchUILanguage('he');
            console.log('📝 Hebrew welcome:', window.menuManager.t('welcome'));
            // Switch back to English
            window.menuManager.switchUILanguage('en');
        }
    } else {
        console.log('❌ Translation function missing');
    }

    // Test 4: Check if showEditItemModal method exists
    console.log('\n4. Testing showEditItemModal method:');
    if (typeof window.menuManager.showEditItemModal === 'function') {
        console.log('✅ showEditItemModal method exists');
    } else {
        console.log('❌ showEditItemModal method missing');
    }

    // Test 5: Check if menu configuration loaded
    console.log('\n5. Testing menu configuration:');
    if (window.menuManager.config) {
        console.log('✅ Menu configuration loaded');
        console.log('📋 Menu languages available:', Object.keys(window.menuManager.config.languages || {}));
    } else {
        console.log('⚠️  Menu configuration not loaded yet');
    }

} else {
    console.log('❌ MenuManager instance not found');
}

console.log('\n🏁 Test completed!');
console.log('💡 To run more specific tests, try calling methods directly:');
console.log('   window.menuManager.switchUILanguage("he")');
console.log('   window.menuManager.t("welcome")');
