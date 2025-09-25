const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cheerio = require('cheerio');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'normand-admin-secret-2024';
const ADMIN_PASSWORD = bcrypt.hashSync('admin123', 10); // Change this!

// Languages configuration
const LANGUAGES = {
  'en': { name: 'English', default: true },
  'he': { name: 'עברית', rtl: true }
};

// Admin authentication middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Setup admin routes
function setupAdminRoutes(app) {
  // Login endpoint
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { password } = req.body;

      if (bcrypt.compareSync(password, ADMIN_PASSWORD)) {
        const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token });
      } else {
        res.status(401).json({ error: 'Invalid password' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get page content
  app.get('/api/admin/page/:lang/:name', authenticate, async (req, res) => {
    try {
      const { lang, name } = req.params;

      // Determine filename
      const filename = lang === 'en'
        ? `${name || 'index'}.html`
        : `${name || 'index'}.${lang}.html`;

      const filePath = path.join(__dirname, filename);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ error: 'Page not found' });
      }

      const html = await fs.readFile(filePath, 'utf-8');
      const $ = cheerio.load(html);

      // Extract content
      const content = {
        title: $('title').text(),
        h1: $('h1').first().text(),
        metaDescription: $('meta[name="description"]').attr('content'),
        mainContent: $('.entry-content').html() || $('main').html() || 'No content found',
        language: lang,
        filename
      };

      res.json(content);
    } catch (error) {
      console.error('Get page error:', error);
      res.status(500).json({ error: 'Failed to load page' });
    }
  });

  // Update page content
  app.post('/api/admin/page/:lang/:name', authenticate, async (req, res) => {
    try {
      const { lang, name } = req.params;
      const { title, h1, metaDescription, mainContent } = req.body;

      // Determine filename
      const filename = lang === 'en'
        ? `${name || 'index'}.html`
        : `${name || 'index'}.${lang}.html`;

      const filePath = path.join(__dirname, filename);

      // Load existing file
      const html = await fs.readFile(filePath, 'utf-8');
      const $ = cheerio.load(html, { decodeEntities: false });

      // Update content - PRESERVES ALL ANIMATION STRUCTURE
      if (title) $('title').text(title);
      if (h1) $('h1').first().text(h1);
      if (metaDescription) $('meta[name="description"]').attr('content', metaDescription);
      if (mainContent) {
        if ($('.entry-content').length) {
          $('.entry-content').html(mainContent);
        } else if ($('main').length) {
          $('main').html(mainContent);
        }
      }

      // Set language attribute
      $('html').attr('lang', lang);

      // Set RTL for Hebrew
      if (lang === 'he') {
        $('html').attr('dir', 'rtl');
      } else {
        $('html').removeAttr('dir');
      }

      // Save updated file
      await fs.writeFile(filePath, $.html());

      res.json({
        success: true,
        message: `Content updated for ${LANGUAGES[lang].name}`,
        filename
      });
    } catch (error) {
      console.error('Update page error:', error);
      res.status(500).json({ error: 'Failed to update page' });
    }
  });

  // List available pages
  app.get('/api/admin/pages', authenticate, async (req, res) => {
    try {
      const files = await fs.readdir(__dirname);
      const htmlFiles = files.filter(f => f.endsWith('.html') && !f.startsWith('admin'));

      const pages = [];

      for (const file of htmlFiles) {
        const filePath = path.join(__dirname, file);
        const html = await fs.readFile(filePath, 'utf-8');
        const $ = cheerio.load(html);

        // Determine language and page name
        const parts = file.replace('.html', '').split('.');
        let lang = 'en';
        let pageName = parts[0];

        if (parts.length > 1) {
          lang = parts[parts.length - 1];
          pageName = parts.slice(0, -1).join('.');
        }

        pages.push({
          filename: file,
          pageName,
          language: lang,
          languageName: LANGUAGES[lang]?.name || lang,
          title: $('title').text() || file,
          path: file.replace('.html', '').replace(/\./g, '/')
        });
      }

      // Group by page name
      const groupedPages = pages.reduce((acc, page) => {
        if (!acc[page.pageName]) acc[page.pageName] = {};
        acc[page.pageName][page.language] = page;
        return acc;
      }, {});

      res.json({ pages: groupedPages, languages: LANGUAGES });
    } catch (error) {
      console.error('List pages error:', error);
      res.status(500).json({ error: 'Failed to list pages' });
    }
  });

  // Get language configuration
  app.get('/api/admin/languages', authenticate, (req, res) => {
    res.json(LANGUAGES);
  });

  console.log('✅ Admin API routes configured');
}

module.exports = { setupAdminRoutes, authenticate };