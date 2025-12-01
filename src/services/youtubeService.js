const { google } = require('googleapis');
const { API_KEYS } = require('../config/apiKeys');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

// OAuth2 client
let oauth2Client = null;

// Initialize OAuth2 client
function getOAuth2Client() {
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      API_KEYS.YOUTUBE_CLIENT_ID,
      API_KEYS.YOUTUBE_CLIENT_SECRET,
      API_KEYS.YOUTUBE_REDIRECT_URI
    );
  }
  return oauth2Client;
}

// Store tokens by channel ID
const tokenStore = {};

/**
 * Get YouTube OAuth authorization URL
 * @returns {Object} Auth URL and state
 */
function getAuthUrl() {
  const oauth2 = getOAuth2Client();
  const state = Math.random().toString(36).substring(7);
  
  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly'
    ],
    state: state,
    prompt: 'consent'
  });

  return { authUrl, state };
}

/**
 * Handle OAuth callback and exchange code for tokens
 * @param {string} code - Authorization code
 * @param {string} state - State parameter
 * @returns {Promise<Object>} Channel info and tokens
 */
async function handleCallback(code, state) {
  if (!code) {
    throw new Error('No authorization code received');
  }

  const oauth2 = getOAuth2Client();

  try {
    const { tokens } = await oauth2.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('Token exchange failed');
    }

    oauth2.setCredentials(tokens);

    // Get channel information
    const youtube = google.youtube({ version: 'v3', auth: oauth2 });
    const response = await youtube.channels.list({
      part: 'snippet,statistics',
      mine: true
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('No YouTube channel found');
    }

    const channel = response.data.items[0];
    const channelId = channel.id;
    const channelTitle = channel.snippet.title;
    const channelAvatar = channel.snippet.thumbnails?.default?.url || '';
    const subscribers = channel.statistics?.subscriberCount || '0';

    // Store tokens
    tokenStore[channelId] = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date
    };

    return {
      channelId,
      channelTitle,
      channelAvatar,
      subscribers,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token
    };
  } catch (error) {
    console.error('YouTube OAuth callback error:', error);
    if (error.message.includes('invalid_grant')) {
      throw new Error('Token exchange failed');
    }
    throw error;
  }
}

/**
 * Get connection status for a channel
 * @param {string} channelId - Channel ID
 * @returns {Object} Connection status
 */
function getConnectionStatus(channelId) {
  if (!channelId) {
    return { connected: false };
  }

  const tokens = tokenStore[channelId];
  if (!tokens) {
    return { connected: false };
  }

  // Check if token is expired
  if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
    return { connected: false, expired: true };
  }

  return {
    connected: true,
    channelId: channelId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token
  };
}

/**
 * Disconnect YouTube account
 * @param {string} channelId - Channel ID
 */
function disconnect(channelId) {
  if (channelId && tokenStore[channelId]) {
    delete tokenStore[channelId];
    console.log(`✅ Disconnected YouTube channel: ${channelId}`);
  }
}

/**
 * Upload video to YouTube
 * @param {string} channelId - Channel ID
 * @param {string} sessionId - Video session ID
 * @param {string} title - Video title
 * @param {string} description - Video description
 * @param {string} tags - Video tags (comma-separated)
 * @param {string} privacyStatus - Privacy status (private, unlisted, public)
 * @param {string} baseDir - Base directory path
 * @returns {Promise<Object>} Upload result
 */
async function uploadVideo(channelId, sessionId, title, description, tags, privacyStatus, baseDir) {
  if (!channelId) {
    throw new Error('Channel ID is required');
  }

  const tokens = tokenStore[channelId];
  if (!tokens) {
    throw new Error('YouTube account not connected');
  }

  // Get video file path
  const videoPath = path.join(baseDir, 'temp_renders', sessionId, 'final_video.mp4');
  
  try {
    await fsPromises.access(videoPath);
  } catch (error) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  // Set up OAuth2 client with stored tokens
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token
  });

  // Refresh token if expired
  if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
    try {
      const { credentials } = await oauth2.refreshAccessToken();
      oauth2.setCredentials(credentials);
      
      // Update stored tokens
      tokenStore[channelId] = {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || tokens.refresh_token,
        expiry_date: credentials.expiry_date
      };
    } catch (error) {
      throw new Error('Failed to refresh access token. Please reconnect your YouTube account.');
    }
  }

  // Initialize YouTube API
  const youtube = google.youtube({ version: 'v3', auth: oauth2 });

  // Parse tags
  const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];

  // Upload video
  try {
    const response = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: title,
          description: description || '',
          tags: tagArray,
          categoryId: '22' // People & Blogs
        },
        status: {
          privacyStatus: privacyStatus || 'private',
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: fs.createReadStream(videoPath)
      }
    });

    const videoId = response.data.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return {
      success: true,
      videoId: videoId,
      videoUrl: videoUrl,
      youtubeUrl: videoUrl
    };
  } catch (error) {
    console.error('YouTube upload error:', error);
    
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      throw new Error('Authentication expired. Please reconnect your YouTube account.');
    }

    throw new Error(error.message || 'Failed to upload video to YouTube');
  }
}

module.exports = {
  getAuthUrl,
  handleCallback,
  getConnectionStatus,
  disconnect,
  uploadVideo
};
