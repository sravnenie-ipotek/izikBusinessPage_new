import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function handler(req, res) {
    if (req.method === 'POST') {
        return handleCreateHebrewPage(req, res);
    } else if (req.method === 'GET') {
        return handleGetTemplateOptions(req, res);
    } else if (req.method === 'PUT') {
        return handleBulkTranslationSync(req, res);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}

async function handleCreateHebrewPage(req, res) {
    try {
        const { englishPagePath, copyContent = true, useTemplate = 'auto' } = req.body;

        if (!englishPagePath) {
            return res.status(400).json({ error: 'English page path is required' });
        }

        const rootDir = path.join(__dirname, '..');
        const englishFilePath = path.join(rootDir, englishPagePath);

        // Verify English file exists
        if (!fs.existsSync(englishFilePath)) {
            return res.status(404).json({ error: 'English page not found' });
        }

        // Generate Hebrew file path
        const hebrewFilePath = englishFilePath.replace('index.html', 'index.he.html');

        // Check if Hebrew file already exists
        if (fs.existsSync(hebrewFilePath)) {
            return res.status(409).json({
                error: 'Hebrew page already exists',
                hebrewPath: hebrewFilePath.replace(rootDir, '')
            });
        }

        let hebrewContent;

        if (copyContent) {
            // Copy from English and prepare for translation
            hebrewContent = await createHebrewFromEnglish(englishFilePath, useTemplate);
        } else {
            // Create from template only
            hebrewContent = await createHebrewFromTemplate(englishPagePath, useTemplate);
        }

        // Ensure directory exists
        const hebrewDir = path.dirname(hebrewFilePath);
        if (!fs.existsSync(hebrewDir)) {
            fs.mkdirSync(hebrewDir, { recursive: true });
        }

        // Write Hebrew file
        fs.writeFileSync(hebrewFilePath, hebrewContent, 'utf8');

        // Log creation for audit trail
        await logTranslationActivity({
            action: 'CREATE_HEBREW_PAGE',
            englishPath: englishPagePath,
            hebrewPath: hebrewFilePath.replace(rootDir, ''),
            method: copyContent ? 'COPY_FROM_ENGLISH' : 'TEMPLATE_ONLY',
            template: useTemplate,
            timestamp: new Date().toISOString()
        });

        return res.status(201).json({
            success: true,
            message: 'Hebrew page created successfully',
            hebrewPath: hebrewFilePath.replace(rootDir, ''),
            method: copyContent ? 'COPY_FROM_ENGLISH' : 'TEMPLATE_ONLY'
        });

    } catch (error) {
        console.error('Create Hebrew page failed:', error);
        return res.status(500).json({
            error: 'Failed to create Hebrew page',
            details: error.message
        });
    }
}

async function createHebrewFromEnglish(englishFilePath, template) {
    const englishContent = fs.readFileSync(englishFilePath, 'utf8');
    const $ = cheerio.load(englishContent);

    // Update language attributes
    $('html').attr('lang', 'he');
    $('html').attr('dir', 'rtl');

    // Update meta tags
    $('meta[property="og:locale"]').attr('content', 'he_IL');

    // Add translation markers to text content
    $('h1, h2, h3, h4, h5, h6, p, span, div').each((i, element) => {
        const $el = $(element);
        const text = $el.text().trim();

        // Only process elements with meaningful text content
        if (text && text.length > 3 && !text.match(/^\d+$/) && !text.includes('{{')) {
            // Skip elements that are likely navigation or technical
            const classes = $el.attr('class') || '';
            const skipClasses = ['btn', 'nav', 'menu', 'header', 'footer', 'logo'];

            if (!skipClasses.some(skipClass => classes.includes(skipClass))) {
                // Wrap text content in translation markers
                const childElements = $el.contents();
                if (childElements.length === 1 && childElements[0].type === 'text') {
                    $el.text(`[HE: ${text}]`);
                }
            }
        }
    });

    // Update navigation links to Hebrew versions
    $('a[href]').each((i, element) => {
        const $el = $(element);
        const href = $el.attr('href');

        if (href && href.endsWith('/') && !href.includes('.he.')) {
            $el.attr('href', href.replace(/\/$/, '/he/'));
        }
    });

    // Add Hebrew-specific CSS if needed
    const hebrewStyles = `
    <style>
    /* Hebrew-specific styles */
    body { direction: rtl; text-align: right; }
    .content { direction: rtl; }
    .nav-menu { direction: rtl; }
    </style>`;

    $('head').append(hebrewStyles);

    // Add translation completion markers
    $('body').prepend(`
    <!-- TRANSLATION STATUS: TEMPLATE CREATED -->
    <!-- TODO: Translate all [HE: ...] markers -->
    <!-- Review and update navigation links -->
    `);

    return $.html();
}

async function createHebrewFromTemplate(englishPagePath, template) {
    // Create a basic Hebrew template
    const pageDir = path.dirname(englishPagePath);
    const pageName = pageDir === '.' ? 'Home' :
                    pageDir.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[HE: ${pageName}] - Normand PLLC</title>
    <meta name="description" content="[HE: Professional legal services description]">
    <meta property="og:locale" content="he_IL">
    <style>
    body { direction: rtl; text-align: right; font-family: Arial, sans-serif; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .content { direction: rtl; }
    .translation-notice {
        background: #f0f8ff;
        border: 2px dashed #0066cc;
        padding: 15px;
        margin: 20px 0;
        border-radius: 5px;
    }
    </style>
</head>
<body>
    <div class="container">
        <div class="translation-notice">
            <h3>🔧 Hebrew Page Template Created</h3>
            <p>This page has been automatically generated and needs translation.</p>
            <ul>
                <li>Replace all [HE: ...] markers with Hebrew translations</li>
                <li>Update navigation links</li>
                <li>Customize content for Hebrew audience</li>
                <li>Test RTL layout and styling</li>
            </ul>
        </div>

        <header>
            <h1>[HE: ${pageName}]</h1>
            <nav>
                <a href="/he/">[HE: Home]</a>
                <a href="/class-action/he/">[HE: Class Action]</a>
                <a href="/our-team/he/">[HE: Our Team]</a>
                <a href="/contact-us/he/">[HE: Contact Us]</a>
            </nav>
        </header>

        <main>
            <section>
                <h2>[HE: Welcome to ${pageName}]</h2>
                <p>[HE: Page description and main content goes here]</p>

                <h3>[HE: Key Features]</h3>
                <ul>
                    <li>[HE: Feature 1]</li>
                    <li>[HE: Feature 2]</li>
                    <li>[HE: Feature 3]</li>
                </ul>

                <h3>[HE: Get Started]</h3>
                <p>[HE: Call to action and next steps]</p>
                <a href="/contact-us/he/" class="cta-button">[HE: Contact Us]</a>
            </section>
        </main>

        <footer>
            <p>[HE: Legal disclaimer and copyright notice]</p>
        </footer>
    </div>

    <!-- TRANSLATION STATUS: TEMPLATE CREATED ${new Date().toISOString()} -->
    <!-- TODO: Complete Hebrew translation -->
</body>
</html>`;
}

async function handleGetTemplateOptions(req, res) {
    try {
        const templates = {
            'auto': 'Automatically detect best template based on page type',
            'legal-page': 'Legal services page template',
            'contact-form': 'Contact and consultation page template',
            'team-bio': 'Team member biography template',
            'case-study': 'Case study and results template',
            'landing-page': 'Marketing landing page template',
            'basic': 'Simple content page template'
        };

        return res.status(200).json({
            templates,
            recommendation: 'auto',
            supportedMethods: ['COPY_FROM_ENGLISH', 'TEMPLATE_ONLY']
        });

    } catch (error) {
        console.error('Get template options failed:', error);
        return res.status(500).json({
            error: 'Failed to get template options',
            details: error.message
        });
    }
}

async function handleBulkTranslationSync(req, res) {
    try {
        const { action, pages = [] } = req.body;

        if (action === 'CREATE_MISSING_CRITICAL') {
            return await createMissingCriticalPages(req, res);
        } else if (action === 'BULK_CREATE' && pages.length > 0) {
            return await bulkCreateHebrewPages(pages, req, res);
        } else {
            return res.status(400).json({ error: 'Invalid bulk action or missing pages' });
        }

    } catch (error) {
        console.error('Bulk translation sync failed:', error);
        return res.status(500).json({
            error: 'Failed to sync translations',
            details: error.message
        });
    }
}

async function createMissingCriticalPages(req, res) {
    const criticalPages = [
        'index.html',
        'contact-us/index.html',
        'our-team/index.html',
        'class-action/index.html'
    ];

    const results = [];
    const rootDir = path.join(__dirname, '..');

    for (const pagePath of criticalPages) {
        const englishFile = path.join(rootDir, pagePath);
        const hebrewFile = englishFile.replace('index.html', 'index.he.html');

        if (fs.existsSync(englishFile) && !fs.existsSync(hebrewFile)) {
            try {
                const hebrewContent = await createHebrewFromEnglish(englishFile, 'auto');

                // Ensure directory exists
                const hebrewDir = path.dirname(hebrewFile);
                if (!fs.existsSync(hebrewDir)) {
                    fs.mkdirSync(hebrewDir, { recursive: true });
                }

                fs.writeFileSync(hebrewFile, hebrewContent, 'utf8');

                results.push({
                    page: pagePath,
                    status: 'CREATED',
                    hebrewPath: hebrewFile.replace(rootDir, '')
                });

                await logTranslationActivity({
                    action: 'BULK_CREATE_CRITICAL',
                    englishPath: pagePath,
                    hebrewPath: hebrewFile.replace(rootDir, ''),
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                results.push({
                    page: pagePath,
                    status: 'FAILED',
                    error: error.message
                });
            }
        } else {
            results.push({
                page: pagePath,
                status: fs.existsSync(hebrewFile) ? 'EXISTS' : 'ENGLISH_MISSING'
            });
        }
    }

    return res.status(200).json({
        success: true,
        message: `Processed ${criticalPages.length} critical pages`,
        results,
        created: results.filter(r => r.status === 'CREATED').length,
        failed: results.filter(r => r.status === 'FAILED').length
    });
}

async function logTranslationActivity(activity) {
    try {
        const logDir = path.join(__dirname, '..', 'DOCS', 'translation-logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const logFile = path.join(logDir, 'translation-manager.log');
        const logEntry = `${activity.timestamp} [${activity.action}] ${JSON.stringify(activity)}\n`;

        fs.appendFileSync(logFile, logEntry, 'utf8');
    } catch (error) {
        console.warn('Failed to log translation activity:', error);
    }
}