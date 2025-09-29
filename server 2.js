// Enhanced server with Express and admin panel support
const express = require('express');
const path = require('path');
const fs = require('fs');
const { setupAdminRoutes } = require('./admin-api');

const PORT = 7001;
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup admin routes
setupAdminRoutes(app);

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React admin panel
// For Next.js in production, we'll serve the static export
const adminPath = path.join(__dirname, 'admin-react/out');

// Check if static export exists, otherwise redirect to dev server
if (fs.existsSync(adminPath)) {
  // Serve static Next.js export
  app.use('/admin', express.static(adminPath, {
    extensions: ['html'],
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));

  // Handle all admin routes
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(adminPath, 'index.html'));
  });

  app.get('/admin*', (req, res) => {
    res.sendFile(path.join(adminPath, 'index.html'));
  });
} else {
  // Redirect to build instructions
  app.get('/admin', (req, res) => {
    res.send(`
      <h2>Admin Panel Not Built</h2>
      <p>Please build the admin panel first:</p>
      <pre>cd admin-react && npm run build:static</pre>
      <p>Or use development server at <a href="http://localhost:7003">http://localhost:7003</a></p>
    `);
  });
}

// Language routing for Hebrew
app.get('/he', (req, res) => {
  const filePath = path.join(__dirname, 'index.he.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('<h1>Hebrew version not found</h1><p>This page hasn\'t been translated yet.</p>');
  }
});

app.get('/he/:page', (req, res) => {
  const page = req.params.page;
  const hebrewFile = `${page}.he.html`;
  const filePath = path.join(__dirname, hebrewFile);

  // Check if Hebrew version exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('<h1>Hebrew version not found</h1><p>This page hasn\'t been translated yet.</p>');
  }
});

// Import API handlers
const menuHandler = require('./api/menu.js').default;
const pagesHandler = require('./api/pages.js').default;
// const analyticsHandler = require('./api/analytics.js').default;  // Temporarily disabled due to module issues

// Handle API routes
app.all('/api/menu', menuHandler);
app.all('/api/pages', pagesHandler);
// app.all('/api/analytics', analyticsHandler);  // Temporarily disabled

// Contact form handler (existing)
app.post('/api/contact', async (req, res) => {
  try {
    console.log('📧 Form submission received:', req.body);
    res.json({
      success: true,
      message: 'Form submitted successfully! (Local development mode - no email sent)'
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve main website static files (excluding admin routes)
app.use((req, res, next) => {
  // Skip admin routes to prevent conflicts
  if (req.path.startsWith('/admin') || req.path.startsWith('/api')) {
    return next();
  }
  express.static(__dirname, {
    extensions: ['html'],
    index: 'index.html'
  })(req, res, next);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Local server running at http://localhost:${PORT}`);
  console.log('📧 Contact forms will work and log submissions to console');
  console.log('✨ This simulates your Vercel deployment locally');
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});