const express = require('express');
const router = express.Router();
const { API_KEYS } = require('../config/apiKeys');

router.get('/health', (req, res) => {
  const apiKeyStatus = {
    anthropic: {
      present: !!API_KEYS.ANTHROPIC_API_KEY,
      format: API_KEYS.ANTHROPIC_API_KEY ? 'Valid format' : 'Missing',
      preview: API_KEYS.ANTHROPIC_API_KEY ? API_KEYS.ANTHROPIC_API_KEY.substring(0, 10) + '...' : 'N/A'
    },
    ideogram: {
      present: !!API_KEYS.IDEOGRAM_API_KEY,
      format: API_KEYS.IDEOGRAM_API_KEY ? 'Valid format' : 'Missing',
      preview: API_KEYS.IDEOGRAM_API_KEY ? API_KEYS.IDEOGRAM_API_KEY.substring(0, 10) + '...' : 'N/A',
      length: API_KEYS.IDEOGRAM_API_KEY ? API_KEYS.IDEOGRAM_API_KEY.length : 0
    },
    ai33pro: {
      present: !!API_KEYS.AI33_API_KEY,
      format: API_KEYS.AI33_API_KEY ? 'Valid format' : 'Missing',
      preview: API_KEYS.AI33_API_KEY ? API_KEYS.AI33_API_KEY.substring(0, 10) + '...' : 'N/A'
    }
  };
  
  res.json({ 
    status: 'ok',
    message: 'Server is running',
    apiKeys: apiKeyStatus,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

