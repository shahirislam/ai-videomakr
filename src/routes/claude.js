const express = require('express');
const router = express.Router();
const { callClaudeAPI, generateImagePrompt } = require('../services/claudeService');

// Script generation endpoint
router.post('/claude', async (req, res, next) => {
  try {
    const { prompt, max_tokens = 4096 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const data = await callClaudeAPI(prompt, max_tokens);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Image prompt generation endpoint (uses Claude but returns ChatGPT-compatible format)
router.post('/chatgpt', async (req, res, next) => {
  try {
    const { prompt, max_tokens = 500 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('🤖 Calling CLAUDE API for image prompt (not ChatGPT)...');
    const response = await generateImagePrompt(prompt, max_tokens);
    console.log('✅ Claude API success (for image prompt)');
    res.json(response);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

