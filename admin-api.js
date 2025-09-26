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

  // Get page sections
  app.get('/api/admin/sections/:lang/:name', authenticate, async (req, res) => {
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

      // Define sections with their selectors and names
      const sectionDefinitions = [
        {
          id: 'banner',
          name: 'Hero Banner',
          selector: '.wp-block-normand-banner',
          type: 'banner',
          editable: {
            subtitle: '.banner-subtitle',
            title: '.banner-title .rotation-text-1',
            scrollText: '.scroll-indicator span'
          }
        },
        {
          id: 'services',
          name: 'Services Section',
          selector: '.wp-block-normand-services',
          type: 'services',
          editable: {
            subtitle: '.normand-services--subtitle',
            title: '.normand-services--title',
            content: '.normand-services--content',
            privacyTitle: '.service-top--title',
            privacyContent: '.service-top--content',
            consumerTitle: '.service-middle--title',
            consumerContent: '.service-middle--content',
            insuranceTitle: '.service-bottom--title',
            insuranceContent: '.service-bottom--content'
          }
        },
        {
          id: 'casestudies',
          name: 'Case Studies Section',
          selector: '.wp-block-normand-heading',
          type: 'heading',
          editable: {
            subtitle: '.normand-heading--subtitle',
            title: '.normand-heading--title'
          }
        },
        {
          id: 'testimonials',
          name: 'Testimonials Section',
          selector: '.wp-block-normand-testimonials',
          type: 'testimonials',
          editable: {
            subtitle: '.normand-testimonials--subtitle',
            title: '.normand-testimonials--title',
            content: '.normand-testimonials--content'
          }
        },
        {
          id: 'team',
          name: 'Team Section',
          selector: '.wp-block-normand-team',
          type: 'team',
          editable: {
            subtitle: '.normand-team--subtitle',
            title: '.normand-team--title',
            founderRole: '.first-team-role',
            founderName: '.first-team-name',
            founderBio: '.first-team-body'
          }
        },
        {
          id: 'contact',
          name: 'Contact Section',
          selector: '.wp-block-normand-contact',
          type: 'contact',
          editable: {
            subtitle: '.normand-contact--subtitle',
            title: '.normand-contact--title',
            formNote: '.normand-contact--form-note'
          }
        }
      ];

      const sections = [];

      sectionDefinitions.forEach(def => {
        const element = $(def.selector);
        if (element.length > 0) {
          const section = {
            id: def.id,
            name: def.name,
            type: def.type,
            visible: !element.hasClass('admin-hidden'),
            content: {}
          };

          // Extract editable content
          Object.keys(def.editable).forEach(key => {
            const contentElement = element.find(def.editable[key]);
            if (contentElement.length > 0) {
              section.content[key] = contentElement.html() || contentElement.text();
            }
          });

          sections.push(section);
        }
      });

      res.json({
        sections,
        language: lang,
        filename
      });
    } catch (error) {
      console.error('Get sections error:', error);
      res.status(500).json({ error: 'Failed to load sections' });
    }
  });

  // Update specific section
  app.post('/api/admin/section/:lang/:name/:sectionId', authenticate, async (req, res) => {
    try {
      const { lang, name, sectionId } = req.params;
      const { content, visible } = req.body;

      // Determine filename
      const filename = lang === 'en'
        ? `${name || 'index'}.html`
        : `${name || 'index'}.${lang}.html`;

      const filePath = path.join(__dirname, filename);

      // Load existing file
      const html = await fs.readFile(filePath, 'utf-8');
      const $ = cheerio.load(html, { decodeEntities: false });

      // Section definitions (same as above)
      const sectionDefinitions = {
        banner: {
          selector: '.wp-block-normand-banner',
          editable: {
            subtitle: '.banner-subtitle',
            title: '.banner-title .rotation-text-1',
            scrollText: '.scroll-indicator span'
          }
        },
        services: {
          selector: '.wp-block-normand-services',
          editable: {
            subtitle: '.normand-services--subtitle',
            title: '.normand-services--title',
            content: '.normand-services--content',
            privacyTitle: '.service-top--title',
            privacyContent: '.service-top--content',
            consumerTitle: '.service-middle--title',
            consumerContent: '.service-middle--content',
            insuranceTitle: '.service-bottom--title',
            insuranceContent: '.service-bottom--content'
          }
        },
        casestudies: {
          selector: '.wp-block-normand-heading',
          editable: {
            subtitle: '.normand-heading--subtitle',
            title: '.normand-heading--title'
          }
        },
        testimonials: {
          selector: '.wp-block-normand-testimonials',
          editable: {
            subtitle: '.normand-testimonials--subtitle',
            title: '.normand-testimonials--title',
            content: '.normand-testimonials--content'
          }
        },
        team: {
          selector: '.wp-block-normand-team',
          editable: {
            subtitle: '.normand-team--subtitle',
            title: '.normand-team--title',
            founderRole: '.first-team-role',
            founderName: '.first-team-name',
            founderBio: '.first-team-body'
          }
        },
        contact: {
          selector: '.wp-block-normand-contact',
          editable: {
            subtitle: '.normand-contact--subtitle',
            title: '.normand-contact--title',
            formNote: '.normand-contact--form-note'
          }
        }
      };

      const sectionDef = sectionDefinitions[sectionId];
      if (!sectionDef) {
        return res.status(404).json({ error: 'Section not found' });
      }

      const element = $(sectionDef.selector);
      if (element.length === 0) {
        return res.status(404).json({ error: 'Section element not found' });
      }

      // Update content
      if (content) {
        Object.keys(content).forEach(key => {
          if (sectionDef.editable[key]) {
            const contentElement = element.find(sectionDef.editable[key]);
            if (contentElement.length > 0) {
              if (contentElement.is('input, textarea')) {
                contentElement.val(content[key]);
              } else {
                contentElement.html(content[key]);
              }
            }
          }
        });
      }

      // Update visibility
      if (typeof visible !== 'undefined') {
        if (visible) {
          element.removeClass('admin-hidden');
          element.css('display', '');
        } else {
          element.addClass('admin-hidden');
          element.css('display', 'none');
        }
      }

      // Save updated file
      await fs.writeFile(filePath, $.html());

      res.json({
        success: true,
        message: `Section "${sectionId}" updated successfully`,
        filename
      });
    } catch (error) {
      console.error('Update section error:', error);
      res.status(500).json({ error: 'Failed to update section' });
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