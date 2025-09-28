/**
 * Menu Manager - Frontend Menu Management System
 * For Normand PLLC Admin Panel
 * Preserves serverless architecture
 */

class MenuManager {
    constructor() {
        this.config = null;
        this.currentLanguage = 'en';
        this.currentUILanguage = 'en'; // Separate UI language from menu content language
        this.container = null;
        this.previewContainer = null;
        this.isDirty = false;
        this.backups = [];
        this.maxBackups = 5;

        // Bilingual UI translations
        this.translations = {
            'en': {
                'menuManager': 'Menu Manager',
                'english': 'English',
                'hebrew': 'עברית',
                'addItem': 'Add Item',
                'preview': 'Preview',
                'help': 'Help',
                'close': 'Close',
                'emptyState': 'No menu items yet. Click "Add Item" to start building your menu.',
                'previewEmpty': 'No menu items to preview',
                'helpTitle': 'How to Use Menu Manager',
                'helpContent': `
                    <h3>Getting Started</h3>
                    <p>The Menu Manager helps you organize your website's navigation menu in both English and Hebrew.</p>

                    <h3>Basic Functions</h3>
                    <ul>
                        <li><strong>Add Item:</strong> Click to add a new menu item</li>
                        <li><strong>Language Tabs:</strong> Switch between English and Hebrew menus</li>
                        <li><strong>Preview:</strong> See how your menu will look on the website</li>
                        <li><strong>Drag & Drop:</strong> Drag items to reorder them</li>
                    </ul>

                    <h3>Editing Items</h3>
                    <ul>
                        <li>Click on any title or URL to edit it directly</li>
                        <li>Use the eye icon to show/hide menu items</li>
                        <li>Use the edit button for advanced options</li>
                        <li>Use the delete button to remove items</li>
                    </ul>
                `
            },
            'he': {
                'menuManager': 'מנהל תפריטים',
                'english': 'English',
                'hebrew': 'עברית',
                'addItem': 'הוסף פריט',
                'preview': 'תצוגה מקדימה',
                'help': 'עזרה',
                'close': 'סגור',
                'emptyState': 'אין פריטי תפריט עדיין. לחץ על "הוסף פריט" כדי להתחיל לבנות את התפריט שלך.',
                'previewEmpty': 'אין פריטי תפריט לתצוגה מקדימה',
                'helpTitle': 'כיצד להשתמש במנהל התפריטים',
                'helpContent': `
                    <h3>תחילת עבודה</h3>
                    <p>מנהל התפריטים מסייע לך לארגן את תפריט הניווט של האתר שלך באנגלית ובעברית.</p>

                    <h3>פונקציות בסיסיות</h3>
                    <ul>
                        <li><strong>הוסף פריט:</strong> לחץ כדי להוסיף פריט תפריט חדש</li>
                        <li><strong>לשוניות שפה:</strong> עבור בין תפריטים באנגלית ועברית</li>
                        <li><strong>תצוגה מקדימה:</strong> ראה איך התפריט שלך יראה באתר</li>
                        <li><strong>גרור ושחרר:</strong> גרור פריטים כדי לסדר אותם מחדש</li>
                    </ul>

                    <h3>עריכת פריטים</h3>
                    <ul>
                        <li>לחץ על כל כותרת או URL כדי לערוך אותו ישירות</li>
                        <li>השתמש באייקון העין כדי להציג/להסתיר פריטי תפריט</li>
                        <li>השתמש בכפתור העריכה לאפשרויות מתקדמות</li>
                        <li>השתמש בכפתור המחיקה כדי להסיר פריטים</li>
                    </ul>

                    <h3>טיפים חשובים</h3>
                    <ul>
                        <li>התפריט בעברית מוצג מימין לשמאל (RTL)</li>
                        <li>וודא שכתובות האתר (URL) זהות בשתי השפות</li>
                        <li>שמור גיבוי לפני ביצוע שינויים גדולים</li>
                        <li>השתמש בתצוגה המקדימה כדי לוודא שהתפריט נראה טוב</li>
                    </ul>
                `
            }
        };

        this.init();
    }

    // Translation helper method
    t(key) {
        return this.translations[this.currentUILanguage][key] || this.translations['en'][key] || key;
    }

    async init() {
        try {
            await this.loadConfiguration();
            this.render();
            this.setupEventListeners();
        } catch (error) {
            this.showError('Failed to initialize Menu Manager', error);
        }
    }

    async loadConfiguration() {
        try {
            const response = await fetch('/menu-config.json?t=' + Date.now());
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            this.config = await response.json();
            console.log('✅ Menu configuration loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load menu configuration:', error);
            // Create default configuration if file doesn't exist
            this.config = this.createDefaultConfig();
        }
    }

    createDefaultConfig() {
        return {
            version: "1.0.0",
            lastModified: new Date().toISOString(),
            languages: {
                en: { name: "English", direction: "ltr" },
                he: { name: "Hebrew", direction: "rtl" }
            },
            menu: {
                en: { items: [] },
                he: { items: [] }
            },
            settings: {
                defaultLanguage: "en",
                maxDepth: 3,
                enableAnimations: true,
                theme: "default"
            }
        };
    }

    render() {
        const container = document.getElementById('menu-manager-container');
        if (!container) {
            console.error('Menu Manager container not found');
            return;
        }

        // Set direction for the entire container based on UI language
        const direction = this.currentUILanguage === 'he' ? 'rtl' : 'ltr';

        container.innerHTML = `
            <div class="menu-manager" dir="${direction}">
                <div class="menu-manager-header">
                    <div class="language-tabs">
                        <button class="tab-button ${this.currentLanguage === 'en' ? 'active' : ''}"
                                data-lang="en">${this.t('english')}</button>
                        <button class="tab-button ${this.currentLanguage === 'he' ? 'active' : ''}"
                                data-lang="he">${this.t('hebrew')}</button>
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-info" id="show-help">${this.t('help')}</button>
                        <button class="btn btn-secondary" id="create-backup">Backup</button>
                        <button class="btn btn-primary" id="generate-files">Generate Files</button>
                    </div>
                </div>

                <div class="menu-manager-content">
                    <div class="menu-editor">
                        <div class="toolbar">
                            <button class="btn btn-success" id="add-menu-item">
                                <span class="icon">+</span> ${this.t('addItem')}
                            </button>
                        </div>

                        <div class="menu-tree" id="menu-tree">
                            ${this.renderMenuTree()}
                        </div>
                    </div>

                    <div class="menu-preview">
                        <h3>${this.t('preview')}</h3>
                        <div class="preview-container ${this.currentLanguage === 'he' ? 'rtl' : 'ltr'}"
                             id="preview-container">
                            ${this.renderPreview()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderMenuTree() {
        if (!this.config?.menu?.[this.currentLanguage]?.items) {
            return `<div class="empty-state">${this.t('emptyState')}</div>`;
        }

        return `
            <ul class="menu-tree-list" id="sortable-menu">
                ${this.config.menu[this.currentLanguage].items.map(item => this.renderMenuItem(item)).join('')}
            </ul>
        `;
    }

    renderMenuItem(item, depth = 0) {
        const hasChildren = item.children && item.children.length > 0;
        const isVisible = item.visible !== false;

        return `
            <li class="menu-item ${!isVisible ? 'hidden' : ''}" data-id="${item.id}" data-depth="${depth}">
                <div class="menu-item-content">
                    <div class="drag-handle">⋮⋮</div>
                    <div class="item-info">
                        <div class="item-title" contenteditable="true" data-field="title">${item.title}</div>
                        <div class="item-url" contenteditable="true" data-field="url">${item.url}</div>
                    </div>
                    <div class="item-controls">
                        <button class="btn btn-sm toggle-visibility" title="Toggle Visibility">
                            ${isVisible ? '👁' : '🚫'}
                        </button>
                        <button class="btn btn-sm edit-item" title="Edit">✏️</button>
                        <button class="btn btn-sm delete-item" title="Delete">🗑</button>
                    </div>
                </div>
                ${hasChildren ? `
                    <ul class="menu-sub-items">
                        ${item.children.map(child => this.renderMenuItem(child, depth + 1)).join('')}
                    </ul>
                ` : ''}
            </li>
        `;
    }

    renderPreview() {
        if (!this.config?.menu?.[this.currentLanguage]?.items) {
            return `<div class="preview-empty">${this.t('previewEmpty')}</div>`;
        }

        return `
            <nav class="menu-preview-nav ${this.currentLanguage === 'he' ? 'rtl' : ''}">
                <ul class="primary-menu">
                    ${this.config.menu[this.currentLanguage].items
                        .filter(item => item.visible !== false)
                        .map(item => this.renderPreviewItem(item)).join('')}
                </ul>
            </nav>
        `;
    }

    renderPreviewItem(item) {
        const hasChildren = item.children && item.children.filter(child => child.visible !== false).length > 0;

        return `
            <li class="menu-item ${hasChildren ? 'has-children' : ''}">
                <a href="${item.url}" class="menu-link">${item.title}</a>
                ${hasChildren ? `
                    <ul class="sub-menu">
                        ${item.children
                            .filter(child => child.visible !== false)
                            .map(child => this.renderPreviewItem(child)).join('')}
                    </ul>
                ` : ''}
            </li>
        `;
    }

    setupEventListeners() {
        // Language tab switching
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                this.switchLanguage(lang);
            });
        });

        // Add menu item
        const addButton = document.getElementById('add-menu-item');
        if (addButton) {
            addButton.addEventListener('click', () => this.showAddItemModal());
        }

        // Show help
        const helpButton = document.getElementById('show-help');
        if (helpButton) {
            // Remove any existing listeners to prevent double-clicking
            helpButton.replaceWith(helpButton.cloneNode(true));
            const newHelpButton = document.getElementById('show-help');
            newHelpButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showHelpModal();
            });
        }

        // Generate files
        const generateButton = document.getElementById('generate-files');
        if (generateButton) {
            generateButton.addEventListener('click', () => this.generateFiles());
        }

        // Create backup
        const backupButton = document.getElementById('create-backup');
        if (backupButton) {
            backupButton.addEventListener('click', () => this.createBackup());
        }

        // Menu item interactions
        this.setupMenuItemListeners();

        // Real-time editing
        this.setupInlineEditing();
    }

    setupMenuItemListeners() {
        document.querySelectorAll('.toggle-visibility').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.closest('.menu-item').dataset.id;
                this.toggleItemVisibility(itemId);
            });
        });

        document.querySelectorAll('.edit-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.closest('.menu-item').dataset.id;
                this.showEditItemModal(itemId);
            });
        });

        document.querySelectorAll('.delete-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.closest('.menu-item').dataset.id;
                this.deleteItem(itemId);
            });
        });
    }

    setupInlineEditing() {
        document.querySelectorAll('[contenteditable="true"]').forEach(element => {
            element.addEventListener('blur', (e) => {
                const itemId = e.target.closest('.menu-item').dataset.id;
                const field = e.target.dataset.field;
                const value = e.target.textContent.trim();
                this.updateItemField(itemId, field, value);
            });

            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        });
    }

    switchLanguage(lang) {
        if (this.currentLanguage === lang && this.currentUILanguage === lang) return;

        console.log('🔄 Switching language from', this.currentLanguage, '/', this.currentUILanguage, 'to', lang);

        // Switch both UI language and menu content language
        this.currentLanguage = lang;
        this.currentUILanguage = lang;

        console.log('✅ Language switched to:', lang);
        console.log('🧪 Testing translation:', this.t('welcomeTitle'));

        // Verify we have menu data for this language
        if (!this.config?.menu?.[lang]) {
            console.warn(`⚠️ No menu data found for language: ${lang}`);
        } else {
            const itemCount = this.config.menu[lang].items?.length || 0;
            console.log(`📊 Menu items for ${lang}:`, itemCount);
        }

        // Update tab states
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.lang === lang);
        });

        // Re-render content with new language
        this.render();
        this.updatePreview();

        console.log('🎯 Re-render completed for language:', lang);
    }

    toggleItemVisibility(itemId) {
        const item = this.findMenuItem(itemId);
        if (item) {
            item.visible = !item.visible;
            this.markDirty();
            this.updatePreview();
            this.render();
        }
    }

    updateItemField(itemId, field, value) {
        const item = this.findMenuItem(itemId);
        if (item && item[field] !== value) {
            item[field] = value;
            this.markDirty();
            this.updatePreview();
        }
    }

    findMenuItem(itemId, items = null) {
        if (!items) {
            items = this.config.menu[this.currentLanguage].items;
        }

        for (const item of items) {
            if (item.id === itemId) {
                return item;
            }
            if (item.children) {
                const found = this.findMenuItem(itemId, item.children);
                if (found) return found;
            }
        }
        return null;
    }

    showAddItemModal() {
        const modal = this.createModal('Add Menu Item', `
            <form id="add-item-form">
                <div class="form-group">
                    <label for="item-title">Title:</label>
                    <input type="text" id="item-title" name="title" required>
                </div>
                <div class="form-group">
                    <label for="item-url">URL:</label>
                    <input type="text" id="item-url" name="url" placeholder="/page-url/" required>
                </div>
                <div class="form-group">
                    <label for="parent-item">Parent Item:</label>
                    <select id="parent-item" name="parent">
                        <option value="">Top Level</option>
                        ${this.renderParentOptions()}
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="item-visible" name="visible" checked>
                        Visible
                    </label>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Add Item</button>
                    <button type="button" class="btn btn-secondary close-modal">Cancel</button>
                </div>
            </form>
        `);

        modal.querySelector('#add-item-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addMenuItem(new FormData(e.target));
            this.closeModal();
        });
    }

    showHelpModal() {
        // Simple approach - create help panel directly
        const existingHelp = document.querySelector('.help-panel-overlay');
        if (existingHelp) {
            existingHelp.remove();
            return;
        }

        const helpPanel = document.createElement('div');
        helpPanel.className = 'help-panel-overlay';
        helpPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #007cba;
            border-radius: 10px;
            padding: 30px;
            max-width: 600px;
            width: 90%;
            max-height: 70vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        const isHebrew = this.currentUILanguage === 'he';
        helpPanel.innerHTML = `
            <div style="direction: ${isHebrew ? 'rtl' : 'ltr'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #007cba; margin: 0;">${this.t('helpTitle')}</h2>
                    <button onclick="document.querySelector('.help-backdrop').remove(); this.closest('.help-panel-overlay').remove()" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: bold;
                    ">✕ ${this.t('close')}</button>
                </div>
                <div style="color: #333; line-height: 1.8;">
                    ${this.t('helpContent')}
                </div>
            </div>
        `;

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'help-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999998;
        `;
        backdrop.onclick = () => {
            helpPanel.remove();
            backdrop.remove();
        };

        document.body.appendChild(backdrop);
        document.body.appendChild(helpPanel);
    }

    renderParentOptions(items = null, prefix = '') {
        if (!items) {
            items = this.config.menu[this.currentLanguage].items;
        }

        return items.map(item => `
            <option value="${item.id}">${prefix}${item.title}</option>
            ${item.children ? this.renderParentOptions(item.children, prefix + '— ') : ''}
        `).join('');
    }

    addMenuItem(formData) {
        const newItem = {
            id: 'menu-item-' + Date.now(),
            title: formData.get('title'),
            url: formData.get('url'),
            type: 'page',
            visible: formData.get('visible') === 'on',
            order: 1,
            children: []
        };

        const parentId = formData.get('parent');

        if (parentId) {
            const parent = this.findMenuItem(parentId);
            if (parent) {
                newItem.order = parent.children.length + 1;
                parent.children.push(newItem);
            }
        } else {
            newItem.order = this.config.menu[this.currentLanguage].items.length + 1;
            this.config.menu[this.currentLanguage].items.push(newItem);
        }

        this.markDirty();
        this.render();
        this.updatePreview();
    }

    deleteItem(itemId) {
        if (confirm('Are you sure you want to delete this menu item?')) {
            this.removeMenuItem(itemId);
            this.markDirty();
            this.render();
            this.updatePreview();
        }
    }

    removeMenuItem(itemId, items = null) {
        if (!items) {
            items = this.config.menu[this.currentLanguage].items;
        }

        for (let i = 0; i < items.length; i++) {
            if (items[i].id === itemId) {
                items.splice(i, 1);
                return true;
            }
            if (items[i].children && this.removeMenuItem(itemId, items[i].children)) {
                return true;
            }
        }
        return false;
    }

    updatePreview() {
        const previewContainer = document.getElementById('preview-container');
        if (previewContainer) {
            previewContainer.className = `preview-container ${this.currentLanguage === 'he' ? 'rtl' : 'ltr'}`;
            previewContainer.innerHTML = this.renderPreview();
        }
    }

    createBackup() {
        const backup = {
            id: 'backup-' + Date.now(),
            timestamp: new Date().toISOString(),
            config: JSON.parse(JSON.stringify(this.config))
        };

        this.backups.push(backup);

        // Keep only the latest backups
        if (this.backups.length > this.maxBackups) {
            this.backups = this.backups.slice(-this.maxBackups);
        }

        this.showSuccess('Backup created successfully');
    }

    async generateFiles() {
        try {
            this.showProgress('Generating files...');

            // Save current configuration
            this.config.lastModified = new Date().toISOString();

            const files = await this.generateAllFiles();
            this.downloadFiles(files);

            this.showSuccess('Files generated and downloaded successfully!');
        } catch (error) {
            this.showError('Failed to generate files', error);
        }
    }

    async generateAllFiles() {
        const files = {};

        // Generate menu-config.json
        files['menu-config.json'] = JSON.stringify(this.config, null, 2);

        // TODO: Generate HTML files with updated menus
        // This will be implemented in the next phase

        return files;
    }

    downloadFiles(files) {
        // Create zip file and download
        const zip = new JSZip();

        Object.entries(files).forEach(([filename, content]) => {
            zip.file(filename, content);
        });

        zip.generateAsync({ type: 'blob' }).then(content => {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `menu-files-${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    markDirty() {
        this.isDirty = true;
        // Show unsaved changes indicator
        this.updateSaveStatus();
    }

    updateSaveStatus() {
        let indicator = document.querySelector('.save-status');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'save-status';
            document.querySelector('.menu-manager-header').appendChild(indicator);
        }

        indicator.textContent = this.isDirty ? '● Unsaved changes' : '✓ Saved';
        indicator.className = `save-status ${this.isDirty ? 'dirty' : 'clean'}`;
    }

    // Utility methods
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: rgba(0, 0, 0, 0.7) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 99999 !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;

        modal.innerHTML = `
            <div class="modal" style="
                background: white !important;
                border-radius: 8px !important;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
                max-width: 600px !important;
                width: 90% !important;
                max-height: 80vh !important;
                overflow: auto !important;
                position: relative !important;
                z-index: 100000 !important;
            ">
                <div class="modal-header" style="
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    padding: 20px !important;
                    border-bottom: 1px solid #eee !important;
                ">
                    <h3 style="margin: 0 !important; color: #333 !important;">${title}</h3>
                    <button class="close-modal" style="
                        background: none !important;
                        border: none !important;
                        font-size: 24px !important;
                        cursor: pointer !important;
                        color: #666 !important;
                        padding: 5px !important;
                        line-height: 1 !important;
                    ">&times;</button>
                </div>
                <div class="modal-body" style="padding: 0 !important;">
                    ${content}
                </div>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('close-modal')) {
                this.closeModal();
            }
        });

        document.body.appendChild(modal);
        return modal;
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    showProgress(message) {
        this.showNotification(message, 'progress');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message, error = null) {
        const fullMessage = error ? `${message}: ${error.message}` : message;
        this.showNotification(fullMessage, 'error');
        if (error) {
            console.error(error);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, type === 'progress' ? 10000 : 5000);
    }
}

// Global instance holder
window.menuManager = null;

// Initialize Menu Manager only when tab is activated
function initializeMenuManager() {
    if (window.menuManager) {
        return window.menuManager;
    }

    const container = document.getElementById('menu-manager-container');
    if (!container) {
        console.error('Menu Manager container not found');
        return null;
    }

    console.log('🍽️ Initializing Menu Manager...');
    window.menuManager = new MenuManager();
    return window.menuManager;
}

// Export for global access
window.initializeMenuManager = initializeMenuManager;