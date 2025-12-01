const express = require('express');
const router = express.Router();
const { generateVoice } = require('../services/ai33Service');

router.post('/generate-voice', async (req, res, next) => {
  try {
    console.log('🎤 Voice generation request received');
    const { text, voice_id = 'aMSt68OGf4xUZAnLpTU8', voice_settings } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await generateVoice(text, voice_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

