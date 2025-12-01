const express = require('express');
const router = express.Router();
const path = require('path');
const { getAuthUrl, handleCallback, getConnectionStatus, disconnect, uploadVideo } = require('../services/youtubeService');

router.get('/auth', (req, res, next) => {
  try {
    const { authUrl, state } = getAuthUrl();
    console.log('📺 YouTube OAuth initiated');
    console.log('   Redirect URI:', require('../config/apiKeys').API_KEYS.YOUTUBE_REDIRECT_URI);
    res.json({ authUrl, state });
  } catch (error) {
    next(error);
  }
});

router.get('/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.redirect('/?youtube_error=no_code');
    }

    const result = await handleCallback(code, state);
    res.redirect(`/?youtube_success=true&channel=${encodeURIComponent(result.channelTitle)}&channelId=${result.channelId}`);
  } catch (error) {
    console.error('❌ YouTube OAuth error:', error);
    if (error.message === 'No authorization code received') {
      return res.redirect('/?youtube_error=no_code');
    } else if (error.message === 'Token exchange failed') {
      return res.redirect('/?youtube_error=token_failed');
    } else if (error.message === 'No YouTube channel found') {
      return res.redirect('/?youtube_error=no_channel');
    }
    res.redirect('/?youtube_error=auth_failed');
  }
});

router.get('/status', (req, res) => {
  const { channelId } = req.query;
  const status = getConnectionStatus(channelId);
  res.json(status);
});

router.post('/disconnect', (req, res) => {
  const { channelId } = req.body;
  disconnect(channelId);
  res.json({ success: true });
});

router.post('/upload', async (req, res, next) => {
  try {
    const { 
      channelId, 
      sessionId, 
      title, 
      description, 
      tags,
      privacyStatus = 'private'
    } = req.body;

    const baseDir = path.join(__dirname, '../..');
    const result = await uploadVideo(channelId, sessionId, title, description, tags, privacyStatus, baseDir);
    res.json(result);
  } catch (error) {
    console.error('❌ YouTube upload error:', error);
    
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return res.status(401).json({
        error: 'Authentication expired',
        message: 'Please reconnect your YouTube channel'
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.message || 'Upload failed',
        message: error.message || 'Failed to upload video to YouTube'
      });
    }

    next(error);
  }
});

module.exports = router;

