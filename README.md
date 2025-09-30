# Normand PLLC - Multilingual Legal Website

## 🌐 Overview

Normand PLLC is a sophisticated multilingual legal website for a class action law firm, featuring dynamic translation capabilities, an admin panel, and a custom menu management system. The site was originally built with WordPress and has been converted to a static site with dynamic admin capabilities.

**Live Site**: [www.normandpllc.com](https://www.normandpllc.com)

### Key Features
- **Multilingual Support**: English and Hebrew with real-time translation toggle
- **Admin Panel**: Content management without rebuilding
- **Menu Manager**: Visual drag-and-drop menu editor
- **Static Site Performance**: Fast loading with dynamic capabilities
- **Contact Forms**: Gravity Forms integration with serverless functions
- **GSAP Animations**: Smooth scrolling and advanced animations

## 📁 Project Structure

```
www.normandpllc.com/
├── api/                          # Serverless functions for Vercel
│   └── contact.js               # Form submission handler
├── assets/                       # Custom assets
│   ├── menu-manager/            # Menu management system
│   │   ├── dist/
│   │   │   ├── menu-manager.min.js  # Core menu manager (minified)
│   │   │   └── menu-manager.css     # Menu manager styles
│   │   └── src/
│   │       └── menu-manager.js      # Source code (development)
│   └── translate.js             # Translation toggle functionality
├── wp-content/                   # WordPress assets (static export)
│   ├── themes/normand/          # Custom theme assets
│   │   └── assets/
│   │       ├── css/            # Minified stylesheets
│   │       │   ├── global.min.css
│   │       │   ├── content.min.css
│   │       │   ├── home.min.css
│   │       │   └── team-image-fix.css  # Animation fixes
│   │       └── js/             # Minified JavaScript
│   │           ├── navigation.min.js
│   │           ├── locomotive.min.js
│   │           └── gsap/       # GSAP animation libraries
│   ├── plugins/                # WordPress plugins (static)
│   └── uploads/                # Media files organized by date
├── DOCS/                        # Documentation
│   └── bugs/
│       └── adminLog.md        # Bug fixes and development log
├── admin.html                   # Admin panel interface
├── admin-api.js                # Admin panel backend (Express)
├── server.js                    # Development server
├── package.json                # Dependencies and scripts
├── vercel.json                 # Vercel deployment config
├── CLAUDE.md                   # AI assistant instructions
└── index.html                  # English homepage
└── index.he.html              # Hebrew homepage
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Git
- Vercel CLI (for deployment)

### Installation

```bash
# Clone repository
git clone https://github.com/sravnenie-ipotek/izikBusinessPage_new.git
cd www.normandpllc.com

# Install dependencies
npm install

# Start development server (port 7001)
npm run dev

# Access the site
# Main site: http://localhost:7001
# Admin panel: http://localhost:7001/admin.html
```

## 🌍 Translation System

### How It Works

The translation system provides seamless language switching between English and Hebrew without page reloads.

#### Core Components

1. **Translation Toggle** (`/assets/translate.js`)
   - Handles language switching via URL parameter `?lang=he`
   - Stores preference in localStorage as `selectedLanguage`
   - Manages RTL/LTR layout switching
   - Updates navigation links to maintain language selection

2. **Language Files**
   - English pages: Standard HTML files (e.g., `index.html`)
   - Hebrew pages: Suffixed with `.he.html` (e.g., `index.he.html`)
   - All content pages have Hebrew counterparts

3. **Implementation Details**

```javascript
// Language detection priority:
1. URL parameter (?lang=he)
2. localStorage preference
3. Default to English

// Toggle mechanism:
- Button in navigation: "עברית" / "English"
- Clicking toggles between languages
- All navigation links updated with language parameter
- RTL support via <html dir="rtl" lang="he">
```

#### Adding New Translations

1. **Create Hebrew version**:
   ```bash
   # For new page: about.html
   cp about.html about.he.html
   ```

2. **Translate content** in the Hebrew file

3. **Update HTML attributes**:
   ```html
   <!-- Hebrew page -->
   <html dir="rtl" lang="he">
   ```

4. **Ensure translation script** is included:
   ```html
   <script src="/assets/translate.js"></script>
   ```

### RTL Support

Hebrew pages automatically apply RTL layout:
- Text direction: right-to-left
- UI elements mirrored
- Navigation adjusted for RTL reading

## 🔧 Admin Panel

### Overview

The admin panel (`/admin.html`) provides a powerful interface for managing site content without code changes.

### Features

#### 1. **Search Functionality**
- Global search across all pages
- Search in specific sections
- Real-time results with context
- Direct navigation to found content

#### 2. **Content Editing**
- In-place text editing
- HTML content support
- Image URL updates
- Meta tag modifications

#### 3. **Menu Manager**
- Visual drag-and-drop interface
- Add/edit/delete menu items
- Submenu support (nested items)
- Visibility toggles
- Real-time preview

#### 4. **Language Support**
- Edit both English and Hebrew content
- Maintain translation consistency
- Preview in both languages

### Admin API Endpoints

The admin panel uses Express.js (`admin-api.js`) with these endpoints:

```javascript
GET /admin-api/search
  Query params: q (search term), section (optional)
  Returns: Array of search results with context

POST /admin-api/save
  Body: { file, selector, value, attribute? }
  Updates specific content in HTML files

GET /admin-api/menu/[language]
  Returns: Current menu structure for language

POST /admin-api/menu/[language]
  Body: { menuData }
  Updates menu structure

GET /admin-api/pages
  Returns: List of all HTML pages

POST /admin-api/upload
  Handles file uploads for images
```

### Menu Manager System

#### Architecture

The menu manager (`/assets/menu-manager/dist/menu-manager.min.js`) is a sophisticated drag-and-drop system:

```javascript
class MenuManager {
  constructor(language = 'en') {
    this.language = language;
    this.menuData = [];
    this.draggedItem = null;
    this.maxId = 0;
  }

  // Core methods:
  - loadMenu()           // Fetch current menu
  - saveMenu()           // Save to server
  - renderMenuItem()     // Render with drag handles
  - handleDrop()         // Reorder items
  - showEditItemModal()  // Edit interface
  - toggleItemVisibility() // Show/hide items
}
```

#### Key Features

1. **Drag & Drop**
   - Visual feedback during drag
   - Nested item support
   - Auto-save on reorder

2. **Item Management**
   - Add new items/submenus
   - Edit titles and URLs
   - Delete with confirmation
   - Visibility toggles

3. **Error Handling**
   - Comprehensive try-catch blocks
   - Fallback rendering
   - User-friendly error messages

#### Menu Structure

```json
{
  "menuData": [
    {
      "id": "item-1",
      "title": "Services",
      "url": "/services",
      "visible": true,
      "submenu": [
        {
          "id": "item-2",
          "title": "Litigation",
          "url": "/services/litigation",
          "visible": true
        }
      ]
    }
  ]
}
```

## 🛠 Development Workflow

### Local Development

```bash
# Start development server
npm run dev

# The server provides:
- Static file serving
- Admin API endpoints
- Form submission handling
- Hot reload for changes
```

### Making Changes

1. **Content Updates**:
   - Use admin panel for text/image changes
   - Direct HTML editing for structure changes
   - Remember to update both language versions

2. **Style Updates**:
   - Edit source CSS files in development
   - Minify for production: `npm run build:css`
   - Clear browser cache after deployment

3. **JavaScript Updates**:
   - Edit source files in `/assets/`
   - Minify for production: `npm run build:js`
   - Test menu manager thoroughly

### Testing Checklist

- [ ] Test in both English and Hebrew
- [ ] Verify RTL layout in Hebrew
- [ ] Check all menu functionality
- [ ] Test form submissions
- [ ] Verify admin panel search
- [ ] Check mobile responsiveness
- [ ] Test page animations
- [ ] Validate translation toggle

## 📦 Deployment

### Vercel Deployment

```bash
# Deploy to production
npm run deploy
# or
vercel --prod

# Deploy to preview
vercel

# Check deployment
vercel ls
```

### Environment Variables

Set in Vercel dashboard:

```env
NODE_ENV=production
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
EMAIL_PROVIDER_API_KEY=your_api_key  # For form submissions
```

### Post-Deployment

1. **Clear CDN cache** if using Cloudflare
2. **Test admin panel** login
3. **Verify form submissions**
4. **Check both language versions**
5. **Monitor error logs** in Vercel dashboard

## 🐛 Troubleshooting

### Common Issues

#### 1. Black Screen in Menu Manager

**Problem**: Screen goes black when editing menu items

**Solution**: Fixed in latest version with error handling
```javascript
// Ensure all properties have fallbacks
const title = (item.title || '').replace(/"/g, '&quot;');
const url = (item.url || '').replace(/"/g, '&quot;');
```

#### 2. Translation Not Working

**Problem**: Language toggle doesn't switch content

**Check**:
- Translation script loaded: `<script src="/assets/translate.js">`
- Hebrew file exists: `page.he.html`
- localStorage not corrupted: Clear browser data

#### 3. Admin Panel Search Issues

**Problem**: Search returns no results

**Solution**: Verify section definitions in `admin-api.js`:
```javascript
const sections = {
  '.service-card h3': 'Service Titles',
  '.team-member-name': 'Team Names',
  // Add missing selectors
};
```

#### 4. Form Submission Errors

**Problem**: Contact form not submitting

**Check**:
- API endpoint: `/api/contact`
- Vercel functions deployed
- Environment variables set
- Network tab for errors

### Debug Mode

Enable debug logging:

```javascript
// In server.js
process.env.DEBUG = 'true';

// In browser console
localStorage.setItem('debug', 'true');
```

## 🔐 Security Considerations

1. **Admin Panel**:
   - Protected with HTTP Basic Auth
   - Rate limiting on API endpoints
   - Input sanitization for XSS prevention

2. **File Uploads**:
   - Type validation
   - Size limits
   - Sanitized filenames

3. **Menu Data**:
   - HTML escaping for user input
   - JSON validation
   - Backup before saves

## 📝 Development Notes

### Code Style

- **JavaScript**: ES6+ with async/await
- **CSS**: BEM methodology where applicable
- **HTML**: Semantic HTML5 markup
- **Comments**: JSDoc for functions

### Performance Optimization

1. **Assets**:
   - Minified CSS/JS in production
   - Lazy loading for images
   - CDN for static assets

2. **Caching**:
   - Version parameters on assets
   - Service worker for offline support
   - Browser caching headers

3. **Animations**:
   - Hardware acceleration with CSS transforms
   - GSAP for complex animations
   - Throttled scroll events

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS 14+, Android 10+)

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** Pull Request

### Commit Convention

```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scope: admin, menu, translation, api, etc.

Example: fix(menu): resolve black screen on edit modal
```

## 📄 License

This project is proprietary software for Normand PLLC. All rights reserved.

## 👥 Support

For technical issues or questions:

1. Check `/DOCS/bugs/adminLog.md` for known issues
2. Review browser console for errors
3. Contact development team
4. Create GitHub issue with details

## 🔄 Version History

- **v2.0.0** - Current version with admin panel and menu manager
- **v1.5.0** - Added Hebrew translation system
- **v1.0.0** - Initial WordPress to static conversion

---

**Last Updated**: December 2024
**Maintained By**: Development Team
**Repository**: [GitHub - izikBusinessPage_new](https://github.com/sravnenie-ipotek/izikBusinessPage_new)