const express = require('express');
const cors = require('cors');
const path = require('path');
const { validateApiKeys } = require('./src/config/apiKeys');
const logger = require('./src/middleware/logger');
const errorHandler = require('./src/middleware/errorHandler');

// Import route modules
const claudeRoutes = require('./src/routes/claude');
const imageRoutes = require('./src/routes/images');
const voiceRoutes = require('./src/routes/voice');
const videoRoutes = require('./src/routes/video');
const youtubeRoutes = require('./src/routes/youtube');
const healthRoutes = require('./src/routes/health');

const app = express();
// Port is now determined dynamically by findAvailablePort()

// Validate API keys on startup
validateApiKeys();

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Serve static files from dist directory (Vite build output) - React app
app.use(express.static(path.join(__dirname, 'dist')));

// Serve static files from public directory (for other assets)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve src directory for ES modules (needed for /src/app.js)
app.use('/src', express.static(path.join(__dirname, 'src')));

// Logging middleware
app.use(logger);

// Mount API route modules (must be before catch-all route)
app.use('/api', claudeRoutes);
app.use('/api', imageRoutes);
app.use('/api', voiceRoutes);
app.use('/api', videoRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api', healthRoutes);

// Serve test page (must be before catch-all route)
app.get('/test.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// Serve the main HTML file from dist (React app)
// Handle all other routes - let React Router handle client-side routing
// This must be last to catch all non-API routes
app.get('*', (req, res) => {
  // Skip API routes (already handled above)
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  const distIndexPath = path.join(__dirname, 'dist', 'index.html');
  const fs = require('fs');
  
  // Check if dist/index.html exists (production build)
  if (fs.existsSync(distIndexPath)) {
    res.sendFile(distIndexPath);
  } else {
    // Dev mode: dist doesn't exist, return helpful message
    res.status(503).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Development Mode - StoryVid AI</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          h1 { color: #2563eb; }
          code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>🚀 Backend Server Running</h1>
        <p>The backend API is running on <strong>http://localhost:${process.env.PORT || 3000}</strong></p>
        <p><strong>To run the frontend in development mode:</strong></p>
        <ol>
          <li>Open a new terminal</li>
          <li>Run: <code>npm run dev:frontend</code></li>
          <li>Access the app at <code>http://localhost:5173</code></li>
        </ol>
        <p><strong>Or build for production:</strong></p>
        <ol>
          <li>Run: <code>npm run build</code></li>
          <li>Then restart the server</li>
        </ol>
        <p><em>Note: In development, the React app runs on Vite's dev server (port 5173) which proxies API calls to this backend.</em></p>
      </body>
      </html>
    `);
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Function to find an available port
const findAvailablePort = (startPort, maxAttempts = 10) => {
  return new Promise((resolve, reject) => {
    let currentPort = startPort;
    let attempts = 0;

    const tryPort = () => {
      if (attempts >= maxAttempts) {
        reject(new Error(`Could not find available port after ${maxAttempts} attempts`));
        return;
      }

      const server = app.listen(currentPort)
        .on('listening', () => {
          console.log('\n');
          console.log('═══════════════════════════════════════════════════════════');
          console.log('   🚀 StoryVid AI Backend Server (REFACTORED!)');
          console.log('═══════════════════════════════════════════════════════════');
          console.log(`   📍 Running on: http://localhost:${currentPort}`);
          console.log(`   🧪 Test page: http://localhost:${currentPort}/test.html`);
          console.log('');
          console.log('   🚀 PERFORMANCE MODE (TUBEGEN-LEVEL OPTIMIZED!):');
          console.log('   ⚡ Hardware acceleration: Intel QSV → VAAPI → CPU ultrafast');
          console.log('   💡 Intel Quick Sync optimized for Windows/Linux!');
          console.log('   ✓ 4-way parallel rendering (matches 4 CPU cores)');
          console.log('   ✓ Ultrafast fallback for max speed');
          console.log('   ✓ 1080p Full HD quality maintained ✅');
          console.log('   ✓ CRF 23 (high quality encoding)');
          console.log('   ⏱️  Expected: 17-min video in ~4-6 minutes! 🔥🔥🔥');
          console.log('');
          console.log('   API Endpoints:');
          console.log('   ✓ POST /api/claude          - Script generation');
          console.log('   ✓ POST /api/generate-image  - Image generation');
          console.log('   ✓ POST /api/generate-voice  - Voice generation');
          console.log('   ✓ POST /api/render-videos   - Video rendering 🎬');
          console.log('   ✓ GET  /api/proxy-image     - Image proxy');
          console.log('   ✓ GET  /api/health          - Health check');
          console.log('   ✓ GET  /api/youtube/auth    - YouTube OAuth');
          console.log('   ✓ GET  /api/youtube/callback - YouTube OAuth callback');
          console.log('   ✓ POST /api/youtube/upload  - YouTube video upload');
          console.log('');
          console.log('   💡 Press Ctrl+C to stop');
          console.log('═══════════════════════════════════════════════════════════');
          console.log('\n');
          resolve({ server, port: currentPort });
        })
        .on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`⚠️  Port ${currentPort} is in use, trying ${currentPort + 1}...`);
            currentPort++;
            attempts++;
            tryPort();
          } else {
            reject(err);
          }
        });
    };

    tryPort();
  });
};

// Start server with automatic port finding
const startPort = process.env.PORT || 3000;
findAvailablePort(startPort)
  .then(({ port }) => {
    console.log(`✅ Server successfully started on port ${port}`);
  })
  .catch((err) => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });
