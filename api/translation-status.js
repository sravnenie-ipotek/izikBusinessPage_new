import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const rootDir = path.join(__dirname, '..');
        const translationStatus = checkTranslationStatus(rootDir);

        // Add real-time gap analysis
        const gaps = findTranslationGaps(rootDir);

        return res.status(200).json({
            ...translationStatus,
            gaps,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Translation status check failed:', error);
        return res.status(500).json({
            error: 'Failed to check translation status',
            details: error.message
        });
    }
}

function checkTranslationStatus(rootDir) {
    const englishPages = [];
    const hebrewPages = [];
    const status = new Map();

    // Scan for all pages
    scanDirectory(rootDir, '', englishPages, hebrewPages);

    // Create status map
    englishPages.forEach(page => {
        const expectedHebrewPath = page.path.replace('index.html', 'index.he.html');
        const hasHebrew = hebrewPages.some(hebPage => hebPage.path === expectedHebrewPath);

        status.set(page.directory, {
            englishPath: page.path,
            hebrewPath: expectedHebrewPath,
            hasHebrew,
            isCritical: page.isCritical,
            priority: page.isCritical ? 'CRITICAL' : 'NORMAL',
            status: hasHebrew ? 'COMPLETE' : 'MISSING'
        });
    });

    const totalPages = englishPages.length;
    const translatedPages = Array.from(status.values()).filter(s => s.hasHebrew).length;
    const completionPercentage = totalPages > 0 ? Math.round((translatedPages / totalPages) * 100) : 0;

    return {
        totalEnglishPages: totalPages,
        totalHebrewPages: hebrewPages.length,
        translatedPages,
        completionPercentage,
        status: Object.fromEntries(status),
        summary: generateStatusSummary(completionPercentage, totalPages - translatedPages)
    };
}

function findTranslationGaps(rootDir) {
    const gaps = [];
    const englishPages = [];
    const hebrewPages = [];

    scanDirectory(rootDir, '', englishPages, hebrewPages);

    englishPages.forEach(page => {
        const expectedHebrewPath = page.path.replace('index.html', 'index.he.html');
        const hasHebrew = hebrewPages.some(hebPage => hebPage.path === expectedHebrewPath);

        if (!hasHebrew) {
            gaps.push({
                directory: page.directory,
                englishPath: page.path,
                missingHebrewPath: expectedHebrewPath,
                isCritical: page.isCritical,
                urgency: page.isCritical ? 'HIGH' : 'MEDIUM'
            });
        }
    });

    return gaps;
}

function scanDirectory(dir, basePath, englishPages, hebrewPages) {
    const excludedPaths = [
        'node_modules', '.git', 'admin-react', 'api', 'wp-content',
        'data', 'scripts', 'screenshots', 'DOCS', '.next', '.vercel'
    ];

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

            // Skip excluded paths
            if (excludedPaths.some(excluded =>
                relativePath.startsWith(excluded) || item.startsWith('.')
            )) {
                return;
            }

            try {
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    scanDirectory(fullPath, relativePath, englishPages, hebrewPages);
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
            } catch (statError) {
                // Skip files that can't be accessed
                console.warn(`Cannot stat ${fullPath}:`, statError.message);
            }
        });
    } catch (readError) {
        // Skip directories that can't be read
        console.warn(`Cannot read directory ${dir}:`, readError.message);
    }
}

function generateStatusSummary(completionPercentage, missingCount) {
    const status = completionPercentage === 100 ? '✅ COMPLETE' :
                  completionPercentage >= 80 ? '⚠️ MOSTLY COMPLETE' :
                  completionPercentage >= 50 ? '🔄 IN PROGRESS' : '❌ NEEDS ATTENTION';

    return {
        status,
        message: `${completionPercentage}% of pages have Hebrew translations`,
        missingCount,
        recommendation: missingCount > 0 ?
            `Create ${missingCount} missing Hebrew translation${missingCount > 1 ? 's' : ''}` :
            'All pages have Hebrew translations'
    };
}