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

// Serve admin panel
app.get('/admin', (req, res) => {
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

// Handle API routes (existing contact form)
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

// Serve static files (including admin.html as admin)
app.use(express.static(__dirname, {
  extensions: ['html'],
  index: 'index.html'
}));

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