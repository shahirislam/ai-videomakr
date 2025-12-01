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
const PORT = process.env.PORT || 3000;

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

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve src directory for ES modules (needed for /src/app.js)
app.use('/src', express.static(path.join(__dirname, 'src')));

// Logging middleware
app.use(logger);

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve test page
app.get('/test.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// Mount route modules
app.use('/api', claudeRoutes);
app.use('/api', imageRoutes);
app.use('/api', voiceRoutes);
app.use('/api', videoRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api', healthRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   🚀 StoryVid AI Backend Server (REFACTORED!)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   📍 Running on: http://localhost:${PORT}`);
  console.log(`   🧪 Test page: http://localhost:${PORT}/test.html`);
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
});
