#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
    rootDir: path.join(__dirname, '..'),
    criticalPages: [
        'index.html',
        'contact-us/index.html',
        'our-team/index.html',
        'class-action/index.html'
    ],
    excludedPaths: [
        'node_modules',
        '.git',
        'admin-react',
        'api',
        'wp-content',
        'data',
        'scripts',
        'screenshots',
        'DOCS'
    ],
    outputFile: 'translation-status.json'
};

class TranslationValidator {
    constructor() {
        this.englishPages = [];
        this.hebrewPages = [];
        this.translationGaps = [];
        this.criticalGaps = [];
        this.translationStatus = {
            timestamp: new Date().toISOString(),
            totalEnglishPages: 0,
            totalHebrewPages: 0,
            translationGaps: 0,
            criticalGaps: 0,
            completionPercentage: 0,
            gaps: [],
            criticalMissing: [],
            summary: ''
        };
    }

    scanDirectory(dir, basePath = '') {
        const items = fs.readdirSync(dir);

        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            const relativePath = path.join(basePath, item);

            // Skip excluded paths
            if (CONFIG.excludedPaths.some(excluded =>
                relativePath.startsWith(excluded) || item.startsWith('.')
            )) {
                return;
            }

            if (stat.isDirectory()) {
                this.scanDirectory(fullPath, relativePath);
            } else if (stat.isFile()) {
                if (item === 'index.html') {
                    this.englishPages.push({
                        path: relativePath,
                        fullPath,
                        directory: basePath || 'root',
                        isCritical: CONFIG.criticalPages.includes(relativePath)
                    });
                } else if (item === 'index.he.html') {
                    this.hebrewPages.push({
                        path: relativePath,
                        fullPath,
                        directory: basePath || 'root'
                    });
                }
            }
        });
    }

    analyzeTranslationGaps() {
        console.log('🔍 Analyzing translation gaps...');

        this.englishPages.forEach(englishPage => {
            const expectedHebrewPath = englishPage.path.replace('index.html', 'index.he.html');
            const hebrewExists = this.hebrewPages.some(hebPage =>
                hebPage.path === expectedHebrewPath
            );

            if (!hebrewExists) {
                const gap = {
                    englishPath: englishPage.path,
                    missingHebrewPath: expectedHebrewPath,
                    directory: englishPage.directory,
                    isCritical: englishPage.isCritical,
                    priority: englishPage.isCritical ? 'CRITICAL' : 'NORMAL'
                };

                this.translationGaps.push(gap);

                if (englishPage.isCritical) {
                    this.criticalGaps.push(gap);
                }
            }
        });
    }

    generateReport() {
        const totalPages = this.englishPages.length;
        const translatedPages = totalPages - this.translationGaps.length;
        const completionPercentage = totalPages > 0 ? Math.round((translatedPages / totalPages) * 100) : 0;

        this.translationStatus = {
            timestamp: new Date().toISOString(),
            totalEnglishPages: totalPages,
            totalHebrewPages: this.hebrewPages.length,
            translationGaps: this.translationGaps.length,
            criticalGaps: this.criticalGaps.length,
            completionPercentage,
            gaps: this.translationGaps,
            criticalMissing: this.criticalGaps,
            summary: this.generateSummaryText(completionPercentage)
        };

        // Save detailed report
        const reportPath = path.join(CONFIG.rootDir, CONFIG.outputFile);
        fs.writeFileSync(reportPath, JSON.stringify(this.translationStatus, null, 2));

        return this.translationStatus;
    }

    generateSummaryText(completionPercentage) {
        const status = completionPercentage === 100 ? '✅ COMPLETE' :
                      completionPercentage >= 80 ? '⚠️ MOSTLY COMPLETE' :
                      completionPercentage >= 50 ? '🔄 IN PROGRESS' : '❌ NEEDS ATTENTION';

        return `Translation Status: ${status} (${completionPercentage}% complete)
${this.translationStatus.totalEnglishPages} English pages found
${this.translationStatus.totalHebrewPages} Hebrew pages found
${this.translationStatus.translationGaps} missing Hebrew translations
${this.criticalGaps.length} critical pages missing Hebrew versions`;
    }

    printResults() {
        console.log('\n📊 TRANSLATION VALIDATION RESULTS');
        console.log('=====================================');
        console.log(this.translationStatus.summary);

        if (this.criticalGaps.length > 0) {
            console.log('\n🚨 CRITICAL MISSING TRANSLATIONS:');
            this.criticalGaps.forEach(gap => {
                console.log(`   ❌ ${gap.englishPath} → ${gap.missingHebrewPath}`);
            });
        }

        if (this.translationGaps.length > 0) {
            console.log('\n📋 ALL MISSING TRANSLATIONS:');
            this.translationGaps.forEach(gap => {
                const icon = gap.isCritical ? '🚨' : '⚠️';
                console.log(`   ${icon} ${gap.directory}/ → Missing Hebrew version`);
            });
        }

        console.log(`\n📄 Detailed report saved to: ${CONFIG.outputFile}`);
    }

    validateAndReport(options = {}) {
        console.log('🚀 Starting Translation Validation...');
        console.log(`📁 Scanning directory: ${CONFIG.rootDir}`);

        // Scan filesystem
        this.scanDirectory(CONFIG.rootDir);

        // Analyze gaps
        this.analyzeTranslationGaps();

        // Generate report
        const report = this.generateReport();

        // Print results
        this.printResults();

        // Handle build failure for critical gaps
        if (options.failOnCritical && this.criticalGaps.length > 0) {
            console.log('\n💥 BUILD FAILED: Critical pages missing Hebrew translations!');
            console.log('Fix these critical translations before proceeding:');
            this.criticalGaps.forEach(gap => {
                console.log(`   Create: ${gap.missingHebrewPath}`);
            });
            process.exit(1);
        }

        // Handle build warning for any gaps
        if (options.warnOnAny && this.translationGaps.length > 0) {
            console.log('\n⚠️ WARNING: Some pages missing Hebrew translations');
            if (options.verbose) {
                console.log('Consider creating Hebrew versions for better user experience.');
            }
        }

        return report;
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const options = {
        failOnCritical: args.includes('--fail-critical'),
        warnOnAny: args.includes('--warn-all'),
        verbose: args.includes('--verbose'),
        help: args.includes('--help')
    };

    if (options.help) {
        console.log(`
Translation Validator - Build-time validation for Hebrew translations

Usage:
  node validate-translations.js [options]

Options:
  --fail-critical    Fail build if critical pages missing Hebrew versions
  --warn-all         Show warnings for any missing translations
  --verbose          Show detailed output
  --help             Show this help message

Examples:
  node validate-translations.js --fail-critical
  node validate-translations.js --warn-all --verbose
`);
        return;
    }

    const validator = new TranslationValidator();
    const report = validator.validateAndReport(options);

    // Return exit code for CI/CD
    if (options.failOnCritical && report.criticalGaps > 0) {
        process.exit(1);
    }

    process.exit(0);
}

// Export for use as module
export default TranslationValidator;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}