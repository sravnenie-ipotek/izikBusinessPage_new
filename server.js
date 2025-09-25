// Simple Node.js server to test the site locally with API functions
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 7001;

// Import our API function
let contactHandler;
try {
  contactHandler = require('./api/contact.js').default;
} catch (e) {
  console.log('Loading contact handler...');
}

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.otf': 'font/otf'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Handle API routes
  if (pathname === '/api/contact' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const mockRequest = {
          method: 'POST',
          body: JSON.parse(body),
          headers: req.headers
        };

        const mockResponse = {
          statusCode: 200,
          headers: {},
          setHeader: (key, value) => mockResponse.headers[key] = value,
          status: (code) => {
            mockResponse.statusCode = code;
            return mockResponse;
          },
          json: (data) => {
            res.writeHead(mockResponse.statusCode, {
              'Content-Type': 'application/json',
              ...mockResponse.headers
            });
            res.end(JSON.stringify(data));
          }
        };

        // Simple mock contact handler since we can't easily import ES6 modules
        console.log('📧 Form submission received:', JSON.parse(body));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Form submitted successfully! (Local development mode - no email sent)'
        }));

      } catch (error) {
        console.error('API Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  }

  // Serve static files
  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = path.join(__dirname, pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
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