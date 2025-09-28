import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get list of all HTML pages
function getAllPages(lang = 'en') {
  const rootDir = path.join(__dirname, '..');
  const pages = [];
  const fileName = lang === 'he' ? 'index.he.html' : 'index.html';

  function scanDirectory(dir, basePath = '') {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && !['node_modules', 'api', 'admin-react', 'wp-content', 'data'].includes(item)) {
        // Check if directory has the appropriate language file
        const indexPath = path.join(fullPath, fileName);
        if (fs.existsSync(indexPath)) {
          const relativePath = path.join(basePath, item);
          pages.push({
            id: relativePath || 'home',
            path: relativePath ? `/${relativePath}/` : '/',
            title: item.charAt(0).toUpperCase() + item.slice(1).replace(/-/g, ' '),
            file: indexPath,
            lang: lang
          });
        }
        // Recursively scan subdirectories
        scanDirectory(fullPath, path.join(basePath, item));
      } else if (stat.isFile() && item === fileName && basePath === '') {
        // Root index file for specific language
        pages.push({
          id: 'home',
          path: '/',
          title: 'Home',
          file: fullPath,
          lang: lang
        });
      }
    });
  }

  scanDirectory(rootDir);
  return pages;
}

// Read page content
function readPageContent(pagePath, lang = 'en') {
  try {
    const pages = getAllPages(lang);
    const page = pages.find(p => p.path === pagePath || p.id === pagePath);

    if (!page) {
      return null;
    }

    const html = fs.readFileSync(page.file, 'utf8');
    const $ = cheerio.load(html);

    // Extract content sections
    const content = {
      title: $('title').text(),
      metaDescription: $('meta[name="description"]').attr('content') || '',
      heading: $('h1').first().text(),
      mainContent: $('.content-body').html() || $('.main-content').html() || $('main').html() || '',
      sections: []
    };

    // Extract sections
    $('.section, .content-section, article').each((i, elem) => {
      const section = $(elem);
      content.sections.push({
        id: section.attr('id') || `section-${i}`,
        class: section.attr('class'),
        content: section.html()
      });
    });

    return content;
  } catch (error) {
    console.error('Error reading page content:', error);
    return null;
  }
}

// Update page content
function updatePageContent(pagePath, updates) {
  try {
    const pages = getAllPages();
    const page = pages.find(p => p.path === pagePath || p.id === pagePath);

    if (!page) {
      return { success: false, error: 'Page not found' };
    }

    let html = fs.readFileSync(page.file, 'utf8');
    const $ = cheerio.load(html, { decodeEntities: false });

    // Update title
    if (updates.title) {
      $('title').text(updates.title);
    }

    // Update meta description
    if (updates.metaDescription) {
      if ($('meta[name="description"]').length) {
        $('meta[name="description"]').attr('content', updates.metaDescription);
      } else {
        $('head').append(`<meta name="description" content="${updates.metaDescription}">`);
      }
    }

    // Update heading
    if (updates.heading) {
      $('h1').first().text(updates.heading);
    }

    // Update main content
    if (updates.mainContent) {
      if ($('.content-body').length) {
        $('.content-body').html(updates.mainContent);
      } else if ($('.main-content').length) {
        $('.main-content').html(updates.mainContent);
      } else if ($('main').length) {
        $('main').html(updates.mainContent);
      }
    }

    // Update specific sections
    if (updates.sections && Array.isArray(updates.sections)) {
      updates.sections.forEach(sectionUpdate => {
        const selector = sectionUpdate.id ? `#${sectionUpdate.id}` : `.${sectionUpdate.class}`;
        if ($(selector).length) {
          $(selector).html(sectionUpdate.content);
        }
      });
    }

    // Save updated HTML
    fs.writeFileSync(page.file, $.html());

    return { success: true, message: 'Page updated successfully' };
  } catch (error) {
    console.error('Error updating page:', error);
    return { success: false, error: error.message };
  }
}

// Create new page
function createPage(pagePath, content) {
  try {
    const fullPath = path.join(__dirname, '..', pagePath.replace(/^\/|\/$/g, ''));
    const indexPath = path.join(fullPath, 'index.html');

    // Create directory if it doesn't exist
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    // Create basic HTML template
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title || 'New Page'}</title>
    <meta name="description" content="${content.metaDescription || ''}">
    <link rel="stylesheet" href="/wp-content/themes/normand/assets/css/global.min.css">
</head>
<body>
    <h1>${content.heading || content.title || 'New Page'}</h1>
    <main class="main-content">
        ${content.mainContent || '<p>Page content goes here.</p>'}
    </main>
    <script src="/wp-content/themes/normand/assets/js/global.min.js"></script>
</body>
</html>`;

    fs.writeFileSync(indexPath, html);

    return { success: true, message: 'Page created successfully', path: pagePath };
  } catch (error) {
    console.error('Error creating page:', error);
    return { success: false, error: error.message };
  }
}

// API handler
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  switch (req.method) {
    case 'GET':
      const { page, action, lang } = req.query;

      if (action === 'list' || !page) {
        // Get list of all pages
        const pages = getAllPages(lang);
        res.status(200).json({ pages });
      } else {
        // Get specific page content
        const content = readPageContent(page, lang);
        if (content) {
          res.status(200).json({ page, content });
        } else {
          res.status(404).json({ error: 'Page not found' });
        }
      }
      break;

    case 'POST':
      // Create new page
      const { path: newPath, content: newContent } = req.body;

      if (!newPath) {
        res.status(400).json({ error: 'Path is required' });
        return;
      }

      const createResult = createPage(newPath, newContent || {});
      if (createResult.success) {
        res.status(201).json(createResult);
      } else {
        res.status(500).json(createResult);
      }
      break;

    case 'PUT':
    case 'PATCH':
      // Update existing page
      const { page: updatePage, updates } = req.body;

      if (!updatePage) {
        res.status(400).json({ error: 'Page path is required' });
        return;
      }

      const updateResult = updatePageContent(updatePage, updates || {});
      if (updateResult.success) {
        res.status(200).json(updateResult);
      } else {
        res.status(updateResult.error === 'Page not found' ? 404 : 500).json(updateResult);
      }
      break;

    case 'DELETE':
      // Delete page
      const { page: deletePage } = req.query;

      if (!deletePage || deletePage === '/' || deletePage === 'home') {
        res.status(400).json({ error: 'Cannot delete home page' });
        return;
      }

      try {
        const pages = getAllPages();
        const page = pages.find(p => p.path === deletePage || p.id === deletePage);

        if (!page) {
          res.status(404).json({ error: 'Page not found' });
          return;
        }

        // Delete the directory
        const dirPath = path.dirname(page.file);
        fs.rmSync(dirPath, { recursive: true, force: true });

        res.status(200).json({ success: true, message: 'Page deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete page' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}