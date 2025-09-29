#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
    rootDir: path.join(__dirname, '..'),
    templatesDir: path.join(__dirname, '..', 'DOCS', 'translation-templates'),
    logsDir: path.join(__dirname, '..', 'DOCS', 'translation-logs'),
    excludedPaths: [
        'node_modules', '.git', 'admin-react', 'api', 'wp-content',
        'data', 'scripts', 'screenshots', 'DOCS', '.next', '.vercel'
    ]
};

class TranslationHelpers {
    constructor() {
        this.ensureDirectories();
    }

    ensureDirectories() {
        [CONFIG.templatesDir, CONFIG.logsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    // Quick create missing critical Hebrew pages
    async createCriticalPages() {
        console.log('🚀 Creating missing critical Hebrew pages...');

        const criticalPages = [
            'index.html',
            'contact-us/index.html',
            'our-team/index.html',
            'class-action/index.html'
        ];

        const results = [];

        for (const pagePath of criticalPages) {
            const englishFile = path.join(CONFIG.rootDir, pagePath);
            const hebrewFile = englishFile.replace('index.html', 'index.he.html');

            if (fs.existsSync(englishFile) && !fs.existsSync(hebrewFile)) {
                try {
                    console.log(`📄 Creating Hebrew version: ${pagePath}`);

                    const template = this.generateSmartTemplate(englishFile);

                    // Ensure directory exists
                    const hebrewDir = path.dirname(hebrewFile);
                    if (!fs.existsSync(hebrewDir)) {
                        fs.mkdirSync(hebrewDir, { recursive: true });
                    }

                    fs.writeFileSync(hebrewFile, template, 'utf8');

                    results.push({
                        page: pagePath,
                        status: 'CREATED',
                        hebrewPath: hebrewFile.replace(CONFIG.rootDir, '')
                    });

                    console.log(`✅ Created: ${hebrewFile.replace(CONFIG.rootDir, '')}`);

                } catch (error) {
                    results.push({
                        page: pagePath,
                        status: 'FAILED',
                        error: error.message
                    });
                    console.log(`❌ Failed: ${pagePath} - ${error.message}`);
                }
            } else {
                const status = fs.existsSync(hebrewFile) ? 'EXISTS' : 'ENGLISH_MISSING';
                results.push({ page: pagePath, status });
                console.log(`⏭️  Skipped: ${pagePath} (${status})`);
            }
        }

        this.logActivity({
            action: 'CREATE_CRITICAL_PAGES',
            results,
            timestamp: new Date().toISOString()
        });

        console.log(`\n📊 Results: ${results.filter(r => r.status === 'CREATED').length} created, ${results.filter(r => r.status === 'FAILED').length} failed`);
        return results;
    }

    // Generate a smart template based on English content
    generateSmartTemplate(englishFilePath) {
        const englishContent = fs.readFileSync(englishFilePath, 'utf8');
        const pagePath = englishFilePath.replace(CONFIG.rootDir, '');
        const pageDir = path.dirname(pagePath);
        const pageName = pageDir === '.' ? 'Home' :
                        pageDir.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // Extract key elements from English page
        const titleMatch = englishContent.match(/<title>(.*?)<\/title>/i);
        const descMatch = englishContent.match(/<meta name="description" content="(.*?)"/i);

        const englishTitle = titleMatch ? titleMatch[1] : pageName;
        const englishDesc = descMatch ? descMatch[1] : 'Professional legal services';

        return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[HE: ${englishTitle}]</title>
    <meta name="description" content="[HE: ${englishDesc}]">
    <meta property="og:locale" content="he_IL">
    <meta property="og:title" content="[HE: ${englishTitle}]">
    <meta property="og:description" content="[HE: ${englishDesc}]">

    <!-- Hebrew RTL Styles -->
    <style>
    body {
        direction: rtl;
        text-align: right;
        font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .translation-banner {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        margin: 20px 0;
        border-radius: 10px;
        text-align: center;
    }
    .translation-checklist {
        background: #f8f9fa;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
    }
    .checklist-item {
        margin: 10px 0;
        padding: 8px;
        background: white;
        border-radius: 4px;
        border-left: 4px solid #007bff;
    }
    .content-section {
        margin: 30px 0;
        padding: 20px;
        border: 1px dashed #ccc;
        border-radius: 5px;
    }
    .nav-menu { direction: rtl; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Translation Status Banner -->
        <div class="translation-banner">
            <h2>🌍 Hebrew Page Template Created</h2>
            <p>Auto-generated on ${new Date().toLocaleDateString('he-IL')}</p>
            <p>Source: ${pagePath}</p>
        </div>

        <!-- Translation Checklist -->
        <div class="translation-checklist">
            <h3>📋 Translation Checklist</h3>
            <div class="checklist-item">
                <input type="checkbox" id="translate-title">
                <label for="translate-title">Translate page title and meta tags</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="translate-navigation">
                <label for="translate-navigation">Update navigation menu links</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="translate-content">
                <label for="translate-content">Replace all [HE: ...] markers with Hebrew text</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="test-rtl">
                <label for="test-rtl">Test RTL layout and styling</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="review-links">
                <label for="review-links">Review and update all internal links</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="cultural-adapt">
                <label for="cultural-adapt">Adapt content for Hebrew-speaking audience</label>
            </div>
        </div>

        <!-- Navigation Template -->
        <header>
            <nav class="nav-menu">
                <a href="/he/">[HE: בית]</a> |
                <a href="/class-action/he/">[HE: תובענות ייצוגיות]</a> |
                <a href="/our-team/he/">[HE: הצוות שלנו]</a> |
                <a href="/contact-us/he/">[HE: צור קשר]</a>
            </nav>
        </header>

        <!-- Main Content Template -->
        <main>
            <div class="content-section">
                <h1>[HE: ${pageName}]</h1>
                <p class="lead">[HE: Main page description and value proposition]</p>
            </div>

            <div class="content-section">
                <h2>[HE: Key Information]</h2>
                <p>[HE: Important content for this page]</p>

                <ul>
                    <li>[HE: Important point 1]</li>
                    <li>[HE: Important point 2]</li>
                    <li>[HE: Important point 3]</li>
                </ul>
            </div>

            <div class="content-section">
                <h2>[HE: Take Action]</h2>
                <p>[HE: Call to action description]</p>
                <a href="/contact-us/he/" class="cta-button">[HE: צור קשר]</a>
            </div>
        </main>

        <!-- Footer Template -->
        <footer class="content-section">
            <p>[HE: Legal disclaimer and copyright notice]</p>
            <p>[HE: Contact information and office hours]</p>
        </footer>
    </div>

    <!-- Translation Metadata -->
    <script type="application/json" id="translation-metadata">
    {
        "sourceFile": "${pagePath}",
        "createdAt": "${new Date().toISOString()}",
        "language": "he",
        "status": "TEMPLATE_CREATED",
        "translationMarkers": "All [HE: ...] markers need translation",
        "nextSteps": [
            "Translate all marked content",
            "Update navigation links",
            "Test RTL layout",
            "Cultural adaptation review"
        ]
    }
    </script>

    <!-- Remove this banner when translation is complete -->
    <div style="position: fixed; bottom: 20px; right: 20px; background: #ff6b6b; color: white; padding: 15px; border-radius: 10px; z-index: 1000;">
        <strong>🚧 Translation in Progress</strong><br>
        Remove this notice when complete
    </div>
</body>
</html>`;
    }

    // Create translation workflow templates
    async createWorkflowTemplates() {
        console.log('📝 Creating translation workflow templates...');

        const templates = {
            'critical-page.html': this.getCriticalPageTemplate(),
            'landing-page.html': this.getLandingPageTemplate(),
            'contact-form.html': this.getContactFormTemplate(),
            'team-bio.html': this.getTeamBioTemplate(),
            'case-study.html': this.getCaseStudyTemplate()
        };

        Object.entries(templates).forEach(([filename, content]) => {
            const templatePath = path.join(CONFIG.templatesDir, filename);
            fs.writeFileSync(templatePath, content, 'utf8');
            console.log(`✅ Created template: ${filename}`);
        });

        // Create workflow guide
        const workflowGuide = this.getWorkflowGuide();
        fs.writeFileSync(path.join(CONFIG.templatesDir, 'TRANSLATION_WORKFLOW.md'), workflowGuide, 'utf8');
        console.log(`✅ Created workflow guide`);

        return Object.keys(templates);
    }

    getCriticalPageTemplate() {
        return `<!-- Critical Page Template - High Priority -->
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>[HE: Page Title] - Normand PLLC</title>
    <meta name="description" content="[HE: Critical page description]">
    <style>
    body { direction: rtl; font-family: Arial, sans-serif; }
    .critical-notice { background: #dc3545; color: white; padding: 15px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="critical-notice">
        🚨 CRITICAL PAGE - Priority Translation Required
    </div>

    <h1>[HE: Main Heading]</h1>
    <p>[HE: Essential information that users need immediately]</p>

    <h2>[HE: Contact Information]</h2>
    <p>[HE: Phone, email, and emergency contact details]</p>

    <h2>[HE: Quick Links]</h2>
    <ul>
        <li><a href="/contact-us/he/">[HE: Contact Us]</a></li>
        <li><a href="/class-action/he/">[HE: Class Action Info]</a></li>
    </ul>
</body>
</html>`;
    }

    getLandingPageTemplate() {
        return `<!-- Landing Page Template -->
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>[HE: Landing Page Title] - Normand PLLC</title>
    <meta name="description" content="[HE: Compelling landing page description]">
</head>
<body>
    <header>
        <h1>[HE: Compelling Headline]</h1>
        <p class="lead">[HE: Value proposition]</p>
    </header>

    <section>
        <h2>[HE: Benefits]</h2>
        <ul>
            <li>[HE: Benefit 1]</li>
            <li>[HE: Benefit 2]</li>
            <li>[HE: Benefit 3]</li>
        </ul>
    </section>

    <section>
        <h2>[HE: Call to Action]</h2>
        <a href="/contact-us/he/" class="cta">[HE: Get Started]</a>
    </section>
</body>
</html>`;
    }

    getContactFormTemplate() {
        return `<!-- Contact Form Template -->
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>[HE: Contact Us] - Normand PLLC</title>
</head>
<body>
    <h1>[HE: Contact Us]</h1>
    <form>
        <label>[HE: Name]</label>
        <input type="text" name="name" required>

        <label>[HE: Email]</label>
        <input type="email" name="email" required>

        <label>[HE: Message]</label>
        <textarea name="message" required></textarea>

        <button type="submit">[HE: Send Message]</button>
    </form>
</body>
</html>`;
    }

    getTeamBioTemplate() {
        return `<!-- Team Biography Template -->
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>[HE: Team Member Name] - Normand PLLC</title>
</head>
<body>
    <h1>[HE: Team Member Name]</h1>
    <p class="title">[HE: Professional Title]</p>

    <h2>[HE: Background]</h2>
    <p>[HE: Professional background and experience]</p>

    <h2>[HE: Specializations]</h2>
    <ul>
        <li>[HE: Specialization 1]</li>
        <li>[HE: Specialization 2]</li>
    </ul>
</body>
</html>`;
    }

    getCaseStudyTemplate() {
        return `<!-- Case Study Template -->
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>[HE: Case Study Title] - Normand PLLC</title>
</head>
<body>
    <h1>[HE: Case Study Title]</h1>

    <h2>[HE: Challenge]</h2>
    <p>[HE: Description of the legal challenge]</p>

    <h2>[HE: Solution]</h2>
    <p>[HE: How we solved the problem]</p>

    <h2>[HE: Results]</h2>
    <p>[HE: Outcome and client satisfaction]</p>
</body>
</html>`;
    }

    getWorkflowGuide() {
        return `# Translation Workflow Guide

## Quick Start Commands

\`\`\`bash
# Create critical Hebrew pages
node scripts/translation-helpers.js create-critical

# Create all templates
node scripts/translation-helpers.js create-templates

# Audit translation status
node scripts/translation-helpers.js audit

# Generate translation report
npm run translate:report
\`\`\`

## Translation Process

### 1. Identify Missing Pages
- Run \`npm run translate:check\` to see gaps
- Priority: Critical pages first

### 2. Create Hebrew Templates
- Use \`create-critical\` for important pages
- Use templates for specific page types

### 3. Translation Workflow
1. Replace [HE: ...] markers with Hebrew text
2. Update navigation links to Hebrew versions
3. Test RTL layout and styling
4. Cultural adaptation review
5. Remove translation notices

### 4. Quality Assurance
- Run \`npm run translate:validate\` before deployment
- Test Hebrew pages in browser
- Verify all links work correctly

## Best Practices

### Hebrew Text Guidelines
- Use proper Hebrew typography
- Right-to-left text alignment
- Cultural context considerations
- Legal terminology accuracy

### Technical Requirements
- \`lang="he"\` and \`dir="rtl"\` attributes
- Hebrew meta tags and OpenGraph
- RTL-appropriate CSS styling
- Navigation link updates

### Maintenance
- Regular translation status audits
- Update Hebrew pages when English changes
- Monitor translation completion metrics

## Troubleshooting

### Common Issues
1. **Missing Hebrew files**: Use template creation tools
2. **RTL layout issues**: Check CSS direction properties
3. **Broken links**: Update to Hebrew versions
4. **Character encoding**: Ensure UTF-8 encoding

### Support Commands
- \`npm run translate:audit\` - Full translation analysis
- \`npm run translate:report\` - Detailed status report
- \`npm run menu:sync\` - Update navigation menus
- \`npm run test\` - Run quality assurance tests
`;
    }

    // Audit all translation status
    async auditTranslations() {
        console.log('🔍 Running comprehensive translation audit...');

        const englishPages = [];
        const hebrewPages = [];

        this.scanForPages(CONFIG.rootDir, '', englishPages, hebrewPages);

        const audit = {
            timestamp: new Date().toISOString(),
            totalEnglishPages: englishPages.length,
            totalHebrewPages: hebrewPages.length,
            missingPages: [],
            orphanedPages: [],
            partialTranslations: [],
            completedPages: []
        };

        // Check for missing Hebrew pages
        englishPages.forEach(engPage => {
            const expectedHebrewPath = engPage.path.replace('index.html', 'index.he.html');
            const hebrewExists = hebrewPages.some(hebPage => hebPage.path === expectedHebrewPath);

            if (!hebrewExists) {
                audit.missingPages.push({
                    englishPath: engPage.path,
                    expectedHebrewPath,
                    isCritical: engPage.isCritical
                });
            } else {
                // Check if translation is complete
                const hebrewFilePath = path.join(CONFIG.rootDir, expectedHebrewPath);
                const hebrewContent = fs.readFileSync(hebrewFilePath, 'utf8');

                if (hebrewContent.includes('[HE:') || hebrewContent.includes('Translation in Progress')) {
                    audit.partialTranslations.push(expectedHebrewPath);
                } else {
                    audit.completedPages.push(expectedHebrewPath);
                }
            }
        });

        // Check for orphaned Hebrew pages
        hebrewPages.forEach(hebPage => {
            const expectedEnglishPath = hebPage.path.replace('index.he.html', 'index.html');
            const englishExists = englishPages.some(engPage => engPage.path === expectedEnglishPath);

            if (!englishExists) {
                audit.orphanedPages.push(hebPage.path);
            }
        });

        this.logActivity({
            action: 'TRANSLATION_AUDIT',
            audit,
            timestamp: new Date().toISOString()
        });

        console.log(`\n📊 Translation Audit Results:`);
        console.log(`   English Pages: ${audit.totalEnglishPages}`);
        console.log(`   Hebrew Pages: ${audit.totalHebrewPages}`);
        console.log(`   Missing Hebrew: ${audit.missingPages.length}`);
        console.log(`   Partial Translations: ${audit.partialTranslations.length}`);
        console.log(`   Completed: ${audit.completedPages.length}`);
        console.log(`   Orphaned: ${audit.orphanedPages.length}`);

        return audit;
    }

    scanForPages(dir, basePath, englishPages, hebrewPages) {
        const criticalPages = [
            'index.html',
            'contact-us/index.html',
            'our-team/index.html',
            'class-action/index.html'
        ];

        try {
            const items = fs.readdirSync(dir);

            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const relativePath = path.join(basePath, item);

                if (CONFIG.excludedPaths.some(excluded =>
                    relativePath.startsWith(excluded) || item.startsWith('.')
                )) {
                    return;
                }

                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    this.scanForPages(fullPath, relativePath, englishPages, hebrewPages);
                } else if (stat.isFile()) {
                    if (item === 'index.html') {
                        englishPages.push({
                            path: relativePath,
                            fullPath,
                            directory: basePath || 'root',
                            isCritical: criticalPages.includes(relativePath)
                        });
                    } else if (item === 'index.he.html') {
                        hebrewPages.push({
                            path: relativePath,
                            fullPath,
                            directory: basePath || 'root'
                        });
                    }
                }
            });
        } catch (error) {
            console.warn(`Cannot scan directory ${dir}:`, error.message);
        }
    }

    logActivity(activity) {
        try {
            const logFile = path.join(CONFIG.logsDir, 'translation-helpers.log');
            const logEntry = `${activity.timestamp} [${activity.action}] ${JSON.stringify(activity, null, 2)}\n\n`;
            fs.appendFileSync(logFile, logEntry, 'utf8');
        } catch (error) {
            console.warn('Failed to log activity:', error);
        }
    }
}

// CLI Interface
async function main() {
    const helpers = new TranslationHelpers();
    const command = process.argv[2];

    switch (command) {
        case 'create-critical':
            await helpers.createCriticalPages();
            break;

        case 'create-templates':
            await helpers.createWorkflowTemplates();
            break;

        case 'audit':
            await helpers.auditTranslations();
            break;

        case 'help':
        default:
            console.log(`
Translation Helpers - Quick translation management tools

Commands:
  create-critical    Create Hebrew versions of critical pages
  create-templates   Generate translation workflow templates
  audit             Run comprehensive translation audit
  help              Show this help message

Examples:
  node scripts/translation-helpers.js create-critical
  node scripts/translation-helpers.js audit
            `);
            break;
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export default TranslationHelpers;