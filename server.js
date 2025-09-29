// Enhanced server with Express and admin panel support
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import menuModule from './api/menu.js';
import pagesModule from './api/pages.js';
import translationStatusModule from './api/translation-status.js';
import { setupAdminRoutes } from './admin-api.js';
// import analyticsModule from './api/analytics.js';  // Temporarily disabled due to module issues

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 7001;
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup admin routes
setupAdminRoutes(app);

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve vanilla JS admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve admin.html at root level too (for backward compatibility)
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

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

// API handlers setup
const menuHandler = menuModule.default || menuModule;
const pagesHandler = pagesModule.default || pagesModule;
const translationStatusHandler = translationStatusModule.default || translationStatusModule;
// const analyticsHandler = analyticsModule.default || analyticsModule;

// Handle API routes
app.all('/api/menu', menuHandler);
app.all('/api/pages', pagesHandler);
app.all('/api/translation-status', translationStatusHandler);
// app.all('/api/analytics', analyticsHandler);  // Temporarily disabled

// Admin API routes (basic endpoints for React admin panel)
app.get('/api/admin/pages', (req, res) => {
  // Forward to pages handler with admin context
  req.query.action = 'list';
  pagesHandler(req, res);
});

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