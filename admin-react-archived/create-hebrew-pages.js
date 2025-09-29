const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Pages that need Hebrew versions
const pages = [
  { path: 'index.html', title: 'נורמנד משרד עורכי דין' },
  { path: 'class-action/index.html', title: 'תביעות ייצוגיות' },
  { path: 'class-action/privacy/index.html', title: 'פרטיות' },
  { path: 'class-action/consumer-protection/index.html', title: 'הגנת הצרכן' },
  { path: 'class-action/insurance/index.html', title: 'ביטוח' },
  { path: 'our-team/index.html', title: 'הצוות שלנו' },
  { path: 'case-studies/index.html', title: 'מקרי בוחן' },
  { path: 'disclaimer/index.html', title: 'הצהרת פטור' },
  { path: 'privacy-policy/index.html', title: 'מדיניות פרטיות' }
];

function createHebrewPage(pagePath, hebrewTitle) {
  const englishPath = path.join(__dirname, pagePath);
  const hebrewPath = englishPath.replace('.html', '.he.html');

  try {
    // Check if Hebrew version already exists
    if (fs.existsSync(hebrewPath)) {
      console.log('✓ Hebrew version already exists: ' + hebrewPath);
      return;
    }

    // Check if English page exists
    if (!fs.existsSync(englishPath)) {
      console.log('⚠ Skipping ' + pagePath + ' - English version not found');
      return;
    }

    // Read English version
    const englishContent = fs.readFileSync(englishPath, 'utf-8');
    const $ = cheerio.load(englishContent, { decodeEntities: false });

    // Update for Hebrew
    $('html').attr('lang', 'he');
    $('html').attr('dir', 'rtl');
    $('title').text(hebrewTitle + ' - נורמנד PLLC');

    // Update meta tags
    $('meta[name="description"]').attr('content', hebrewTitle + ' - משרד עורכי דין נורמנד PLLC');

    // Add RTL stylesheet if not present
    if (!$('link[href*="rtl.css"]').length) {
      $('head').append('<link rel="stylesheet" href="/wp-content/themes/normand/assets/css/rtl.css">');
    }

    // Update main heading if exists
    const h1 = $('h1').first();
    if (h1.length) {
      h1.text(hebrewTitle);
    }

    // Add Hebrew class to body
    $('body').addClass('hebrew-version rtl');

    // Add Hebrew notice to main content
    const mainContent = $('.entry-content, .main-content, main, .content').first();
    if (mainContent.length) {
      mainContent.prepend('<div class="notice" style="padding: 20px; background: #f0f0f0; margin-bottom: 30px; border-radius: 5px;"><p style="margin: 0; direction: rtl;">זהו דף זמני בעברית. התוכן המלא יתווסף בקרוב.</p><p style="margin: 10px 0 0; direction: ltr;">This is a temporary Hebrew page. Full content will be added soon.</p></div>');
    }

    // Save Hebrew version
    fs.writeFileSync(hebrewPath, $.html());
    console.log('✅ Created Hebrew page: ' + hebrewPath);

  } catch (error) {
    console.error('❌ Failed to create ' + hebrewPath + ':', error.message);
  }
}

// Create RTL CSS file if it doesn't exist
function createRtlCss() {
  const rtlCssPath = path.join(__dirname, 'wp-content/themes/normand/assets/css/rtl.css');

  if (fs.existsSync(rtlCssPath)) {
    console.log('✓ RTL CSS already exists');
    return;
  }

  const rtlCss = '/* RTL Support for Hebrew */\n' +
'body.rtl,\n' +
'body.hebrew-version {\n' +
'  direction: rtl;\n' +
'  text-align: right;\n' +
'}\n' +
'\n' +
'.rtl .container,\n' +
'.rtl .row {\n' +
'  direction: rtl;\n' +
'}\n' +
'\n' +
'.rtl .text-left {\n' +
'  text-align: right !important;\n' +
'}\n' +
'\n' +
'.rtl .text-right {\n' +
'  text-align: left !important;\n' +
'}\n' +
'\n' +
'.rtl .float-left {\n' +
'  float: right !important;\n' +
'}\n' +
'\n' +
'.rtl .float-right {\n' +
'  float: left !important;\n' +
'}\n' +
'\n' +
'/* Spacing utilities RTL */\n' +
'.rtl .ml-auto {\n' +
'  margin-left: 0 !important;\n' +
'  margin-right: auto !important;\n' +
'}\n' +
'\n' +
'.rtl .mr-auto {\n' +
'  margin-right: 0 !important;\n' +
'  margin-left: auto !important;\n' +
'}\n' +
'\n' +
'/* Navigation RTL */\n' +
'.rtl .navbar-nav {\n' +
'  flex-direction: row-reverse;\n' +
'}\n' +
'\n' +
'.rtl .dropdown-menu {\n' +
'  text-align: right;\n' +
'  right: auto;\n' +
'  left: 0;\n' +
'}\n' +
'\n' +
'/* Forms RTL */\n' +
'.rtl .form-check {\n' +
'  padding-left: 0;\n' +
'  padding-right: 1.25rem;\n' +
'}\n' +
'\n' +
'.rtl .form-check-input {\n' +
'  margin-left: 0;\n' +
'  margin-right: -1.25rem;\n' +
'}\n' +
'\n' +
'/* Hebrew Typography */\n' +
'.hebrew-version {\n' +
'  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, "Noto Sans Hebrew", sans-serif;\n' +
'}\n' +
'\n' +
'.hebrew-version h1,\n' +
'.hebrew-version h2,\n' +
'.hebrew-version h3,\n' +
'.hebrew-version h4,\n' +
'.hebrew-version h5,\n' +
'.hebrew-version h6 {\n' +
'  font-weight: 700;\n' +
'  line-height: 1.4;\n' +
'}\n' +
'\n' +
'/* Tables RTL */\n' +
'.rtl table {\n' +
'  text-align: right;\n' +
'}\n' +
'\n' +
'.rtl th,\n' +
'.rtl td {\n' +
'  text-align: right;\n' +
'}\n' +
'\n' +
'/* Lists RTL */\n' +
'.rtl ul,\n' +
'.rtl ol {\n' +
'  padding-right: 2rem;\n' +
'  padding-left: 0;\n' +
'}';

  // Ensure directory exists
  const rtlDir = path.dirname(rtlCssPath);
  if (!fs.existsSync(rtlDir)) {
    fs.mkdirSync(rtlDir, { recursive: true });
  }

  fs.writeFileSync(rtlCssPath, rtlCss);
  console.log('✅ Created RTL CSS file');
}

// Main function
function main() {
  console.log('Creating Hebrew versions of pages...\n');

  // Create RTL CSS first
  createRtlCss();
  console.log('');

  // Create Hebrew pages
  for (const page of pages) {
    createHebrewPage(page.path, page.title);
  }

  console.log('\n✨ Done! Hebrew pages created.');
  console.log('The admin panel can now edit both English and Hebrew versions.');
}

main();
