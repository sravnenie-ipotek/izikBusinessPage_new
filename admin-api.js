const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cheerio = require('cheerio');
const multer = require('multer');
const sharp = require('sharp');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'normand-admin-secret-2024';
const ADMIN_PASSWORD = bcrypt.hashSync('admin123', 10); // Change this!

// Languages configuration
const LANGUAGES = {
  'en': { name: 'English', default: true },
  'he': { name: 'עברית', rtl: true }
};

// Image upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'temp');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

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

      // Page path mapping
      const pageMapping = {
        'index': 'index.html',
        'class-action': 'class-action/index.html',
        'privacy': 'class-action/privacy/index.html',
        'consumer-protection': 'class-action/consumer-protection/index.html',
        'insurance': 'class-action/insurance/index.html',
        'our-team': 'our-team/index.html',
        'contact-us': 'contact-us/index.html',
        'disclaimer': 'disclaimer/index.html',
        'privacy-policy': 'privacy-policy/index.html'
      };

      // Get the base path for the page
      const basePath = pageMapping[name] || `${name}/index.html`;

      // Determine filename based on language
      const filename = lang === 'en'
        ? basePath
        : basePath.replace('.html', `.${lang}.html`);

      const filePath = path.join(__dirname, filename);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        // For Hebrew pages that don't exist, return empty content instead of 404
        if (lang === 'he') {
          return res.json({
            title: '',
            h1: '',
            metaDescription: '',
            mainContent: '',
            language: lang,
            filename,
            message: 'Hebrew version not available for this page'
          });
        }
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

      // Page path mapping (reuse same mapping)
      const pageMapping = {
        'index': 'index.html',
        'class-action': 'class-action/index.html',
        'privacy': 'class-action/privacy/index.html',
        'consumer-protection': 'class-action/consumer-protection/index.html',
        'insurance': 'class-action/insurance/index.html',
        'our-team': 'our-team/index.html',
        'contact-us': 'contact-us/index.html',
        'disclaimer': 'disclaimer/index.html',
        'privacy-policy': 'privacy-policy/index.html'
      };

      // Get the base path for the page
      const basePath = pageMapping[name] || `${name}/index.html`;

      // Determine filename based on language
      const filename = lang === 'en'
        ? basePath
        : basePath.replace('.html', `.${lang}.html`);

      const filePath = path.join(__dirname, filename);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        // For Hebrew pages that don't exist, return empty sections instead of 404
        if (lang === 'he') {
          return res.json({
            sections: [],
            language: lang,
            filename,
            message: 'Hebrew version not available for this page'
          });
        }
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

      // Page path mapping (reuse same mapping)
      const pageMapping = {
        'index': 'index.html',
        'class-action': 'class-action/index.html',
        'privacy': 'class-action/privacy/index.html',
        'consumer-protection': 'class-action/consumer-protection/index.html',
        'insurance': 'class-action/insurance/index.html',
        'our-team': 'our-team/index.html',
        'contact-us': 'contact-us/index.html',
        'disclaimer': 'disclaimer/index.html',
        'privacy-policy': 'privacy-policy/index.html'
      };

      // Get the base path for the page
      const basePath = pageMapping[name] || `${name}/index.html`;

      // Determine filename based on language
      const filename = lang === 'en'
        ? basePath
        : basePath.replace('.html', `.${lang}.html`);

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

      // Page path mapping (same as get endpoint)
      const pageMapping = {
        'index': 'index.html',
        'class-action': 'class-action/index.html',
        'privacy': 'class-action/privacy/index.html',
        'consumer-protection': 'class-action/consumer-protection/index.html',
        'insurance': 'class-action/insurance/index.html',
        'our-team': 'our-team/index.html',
        'contact-us': 'contact-us/index.html',
        'disclaimer': 'disclaimer/index.html',
        'privacy-policy': 'privacy-policy/index.html'
      };

      // Get the base path for the page
      const basePath = pageMapping[name] || `${name}/index.html`;

      // Determine filename based on language
      const filename = lang === 'en'
        ? basePath
        : basePath.replace('.html', `.${lang}.html`);

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
      // Define main pages that can be edited
      const editablePages = {
        'index': { name: 'Home', path: 'index.html' },
        'class-action': { name: 'Class Action', path: 'class-action/index.html' },
        'privacy': { name: 'Privacy', path: 'class-action/privacy/index.html' },
        'consumer-protection': { name: 'Consumer Protection', path: 'class-action/consumer-protection/index.html' },
        'insurance': { name: 'Insurance', path: 'class-action/insurance/index.html' },
        'our-team': { name: 'Our Team', path: 'our-team/index.html' },
        'contact-us': { name: 'Contact Us', path: 'contact-us/index.html' },
        'disclaimer': { name: 'Disclaimer', path: 'disclaimer/index.html' },
        'privacy-policy': { name: 'Privacy Policy', path: 'privacy-policy/index.html' }
      };

      const pages = {};

      // Check each page for both English and Hebrew versions
      for (const [key, pageInfo] of Object.entries(editablePages)) {
        pages[key] = {
          en: {
            filename: pageInfo.path,
            pageName: key,
            language: 'en',
            languageName: 'English',
            title: pageInfo.name,
            path: pageInfo.path.replace('/index.html', '').replace('index.html', '')
          }
        };

        // Check for Hebrew version (same path with .he before .html)
        const hebrewPath = pageInfo.path.replace('.html', '.he.html');
        const hebrewFilePath = path.join(__dirname, hebrewPath);

        try {
          await fs.access(hebrewFilePath);
          pages[key].he = {
            filename: hebrewPath,
            pageName: key,
            language: 'he',
            languageName: 'עברית',
            title: pageInfo.name + ' (Hebrew)',
            path: hebrewPath.replace('/index.html', '').replace('index.html', '')
          };
        } catch {
          // Hebrew version doesn't exist for this page
        }
      }

      res.json({ pages, languages: LANGUAGES });
    } catch (error) {
      console.error('List pages error:', error);
      res.status(500).json({ error: 'Failed to list pages' });
    }
  });

  // Get language configuration
  app.get('/api/admin/languages', authenticate, (req, res) => {
    res.json(LANGUAGES);
  });

  // Menu management endpoints
  app.get('/api/admin/menu', authenticate, async (req, res) => {
    try {
      // Mock menu data formatted for MenuManager component
      const menuConfig = {
        en: {
          menuItems: [
            {
              id: 'item-1',
              title: 'Home',
              url: '/',
              target: '_self'
            },
            {
              id: 'item-2',
              title: 'Class Action',
              url: '/class-action/',
              target: '_self'
            },
            {
              id: 'item-3',
              title: 'Our Team',
              url: '/our-team/',
              target: '_self'
            },
            {
              id: 'item-4',
              title: 'Contact',
              url: '/contact/',
              target: '_self'
            }
          ]
        },
        he: {
          menuItems: [
            {
              id: 'item-1',
              title: 'בית',
              url: '/he',
              target: '_self'
            },
            {
              id: 'item-2',
              title: 'תביעה ייצוגית',
              url: '/he/class-action',
              target: '_self'
            },
            {
              id: 'item-3',
              title: 'הצוות שלנו',
              url: '/he/our-team',
              target: '_self'
            },
            {
              id: 'item-4',
              title: 'צור קשר',
              url: '/he/contact',
              target: '_self'
            }
          ]
        }
      };

      res.json(menuConfig);
    } catch (error) {
      console.error('Get menu error:', error);
      res.status(500).json({ error: 'Failed to load menu' });
    }
  });

  app.post('/api/admin/menu', authenticate, async (req, res) => {
    try {
      const { menuItems } = req.body;

      // Mock save - in real implementation, this would save to files or database
      console.log('Menu items updated:', menuItems);

      res.json({
        success: true,
        message: 'Menu updated successfully',
        menuItems
      });
    } catch (error) {
      console.error('Update menu error:', error);
      res.status(500).json({ error: 'Failed to update menu' });
    }
  });

  // Upload image endpoint
  app.post('/api/admin/upload', authenticate, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { targetElement, page, lang } = req.body;
      const tempPath = req.file.path;
      const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
      const finalPath = path.join(__dirname, 'uploads', 'images', fileName);

      // Get image dimensions
      const metadata = await sharp(tempPath).metadata();

      // Optimize and save image
      await sharp(tempPath)
        .resize(metadata.width, metadata.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85, progressive: true })
        .toFile(finalPath);

      // Delete temp file
      await fs.unlink(tempPath);

      // Return the new image URL
      const imageUrl = `/uploads/images/${fileName}`;

      res.json({
        success: true,
        imageUrl,
        dimensions: {
          width: metadata.width,
          height: metadata.height
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  // Update image in HTML (SAFE - only changes src attribute)
  app.post('/api/admin/update-image', authenticate, async (req, res) => {
    try {
      const { page, lang, selector, newImageUrl, oldImageUrl } = req.body;

      // Determine filename
      const filename = lang === 'en'
        ? `${page || 'index'}.html`
        : `${page || 'index'}.${lang}.html`;

      const filePath = path.join(__dirname, filename);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ error: 'Page not found' });
      }

      // Create backup
      const backupPath = path.join(__dirname, 'uploads', 'backups', `${filename}.${Date.now()}.backup`);
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      const originalContent = await fs.readFile(filePath, 'utf-8');
      await fs.writeFile(backupPath, originalContent);

      // Load HTML with cheerio
      const $ = cheerio.load(originalContent, { decodeEntities: false });

      // CRITICAL: Only update the src attribute, nothing else
      // This preserves all animations and structure
      let updated = false;

      if (selector) {
        // Update specific element by selector
        const element = $(selector);
        if (element.length > 0 && element.is('img')) {
          element.attr('src', newImageUrl);
          updated = true;
        }
      } else if (oldImageUrl) {
        // Find and replace by old URL
        $('img').each((i, elem) => {
          const $img = $(elem);
          if ($img.attr('src') === oldImageUrl) {
            $img.attr('src', newImageUrl);
            updated = true;
          }
        });
      }

      if (!updated) {
        return res.status(404).json({ error: 'Image not found in HTML' });
      }

      // Save updated HTML
      await fs.writeFile(filePath, $.html());

      res.json({
        success: true,
        message: 'Image updated successfully',
        backup: backupPath
      });
    } catch (error) {
      console.error('Update image error:', error);
      res.status(500).json({ error: 'Failed to update image' });
    }
  });

  // Get images for a specific page
  app.get('/api/admin/images/:lang/:name', authenticate, async (req, res) => {
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

      // Extract all images with their context
      const images = [];
      $('img').each((i, elem) => {
        const $img = $(elem);
        const $parent = $img.parent();

        images.push({
          src: $img.attr('src'),
          alt: $img.attr('alt') || '',
          class: $img.attr('class') || '',
          id: $img.attr('id') || '',
          parentClass: $parent.attr('class') || '',
          parentTag: $parent.prop('tagName'),
          selector: $img.attr('id') ? `#${$img.attr('id')}` : null,
          index: i
        });
      });

      res.json({
        images,
        count: images.length,
        filename
      });
    } catch (error) {
      console.error('Get images error:', error);
      res.status(500).json({ error: 'Failed to get images' });
    }
  });

  console.log('✅ Admin API routes configured with image upload support');
}

module.exports = { setupAdminRoutes, authenticate };