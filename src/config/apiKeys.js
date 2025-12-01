require('dotenv').config();

const API_KEYS = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  IDEOGRAM_API_KEY: process.env.IDEOGRAM_API_KEY,
  AI33_API_KEY: process.env.AI33_API_KEY,
  YOUTUBE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  YOUTUBE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  YOUTUBE_REDIRECT_URI: process.env.YOUTUBE_REDIRECT_URI || `http://localhost:${process.env.PORT || 3000}/api/youtube/callback`
};

// Validate API keys on startup
function validateApiKeys() {
  console.log('\n🔑 Checking API Keys...');
  
  if (!API_KEYS.ANTHROPIC_API_KEY) {
    console.warn('⚠️  WARNING: ANTHROPIC_API_KEY not set in .env file');
  } else {
    console.log('✅ Anthropic API key found');
  }

  if (!API_KEYS.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not set in .env file');
  } else {
    console.log('✅ OpenAI API key found');
  }

  if (!API_KEYS.IDEOGRAM_API_KEY) {
    console.warn('⚠️  WARNING: IDEOGRAM_API_KEY not set in .env file');
  } else {
    console.log('✅ Ideogram API key found');
  }

  if (!API_KEYS.AI33_API_KEY) {
    console.warn('⚠️  WARNING: AI33_API_KEY not set in .env file');
  } else {
    console.log('✅ AI33.pro API key found');
  }

  if (!API_KEYS.YOUTUBE_CLIENT_ID || !API_KEYS.YOUTUBE_CLIENT_SECRET) {
    console.warn('⚠️  WARNING: YouTube API credentials not set in .env file');
    console.warn('   Add YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET to enable YouTube upload');
  } else {
    console.log('✅ YouTube API credentials found');
    console.log(`   Redirect URI: ${API_KEYS.YOUTUBE_REDIRECT_URI}`);
  }
}

module.exports = {
  API_KEYS,
  validateApiKeys
};

