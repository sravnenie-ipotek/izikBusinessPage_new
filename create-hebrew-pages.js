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
      console.log(`✓ Hebrew version already exists: ${hebrewPath}`);
      return;
    }

    // Check if English page exists
    if (!fs.existsSync(englishPath)) {
      console.log(`⚠ Skipping ${pagePath} - English version not found`);
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
    $('meta[name="description"]').attr('content', `${hebrewTitle} - משרד עורכי דין נורמנד PLLC`);

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
      mainContent.prepend(`
        <div class="notice" style="padding: 20px; background: #f0f0f0; margin-bottom: 30px; border-radius: 5px;">
          <p style="margin: 0; direction: rtl;">זהו דף זמני בעברית. התוכן המלא יתווסף בקרוב.</p>
          <p style="margin: 10px 0 0; direction: ltr;">This is a temporary Hebrew page. Full content will be added soon.</p>
        </div>
      `);
    }

    // Save Hebrew version
    fs.writeFileSync(hebrewPath, $.html());
    console.log(`✅ Created Hebrew page: ${hebrewPath}`);

  } catch (error) {
    console.error(`❌ Failed to create ${hebrewPath}:`, error.message);
  }
}

// Create RTL CSS file if it doesn't exist
function createRtlCss() {
  const rtlCssPath = path.join(__dirname, 'wp-content/themes/normand/assets/css/rtl.css');

  if (fs.existsSync(rtlCssPath)) {
    console.log('✓ RTL CSS already exists');
    return;
  }

  const rtlCss = `/* RTL Support for Hebrew */
body.rtl,
body.hebrew-version {
  direction: rtl;
  text-align: right;
}

.rtl .container,
.rtl .row {
  direction: rtl;
}

.rtl .text-left {
  text-align: right !important;
}

.rtl .text-right {
  text-align: left !important;
}

.rtl .float-left {
  float: right !important;
}

.rtl .float-right {
  float: left !important;
}

/* Spacing utilities RTL */
.rtl .ml-auto {
  margin-left: 0 !important;
  margin-right: auto !important;
}

.rtl .mr-auto {
  margin-right: 0 !important;
  margin-left: auto !important;
}

/* Navigation RTL */
.rtl .navbar-nav {
  flex-direction: row-reverse;
}

.rtl .dropdown-menu {
  text-align: right;
  right: auto;
  left: 0;
}

/* Forms RTL */
.rtl .form-check {
  padding-left: 0;
  padding-right: 1.25rem;
}

.rtl .form-check-input {
  margin-left: 0;
  margin-right: -1.25rem;
}

/* Hebrew Typography */
.hebrew-version {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, "Noto Sans Hebrew", sans-serif;
}

.hebrew-version h1,
.hebrew-version h2,
.hebrew-version h3,
.hebrew-version h4,
.hebrew-version h5,
.hebrew-version h6 {
  font-weight: 700;
  line-height: 1.4;
}

/* Tables RTL */
.rtl table {
  text-align: right;
}

.rtl th,
.rtl td {
  text-align: right;
}

/* Lists RTL */
.rtl ul,
.rtl ol {
  padding-right: 2rem;
  padding-left: 0;
}`;

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