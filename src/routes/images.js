const express = require('express');
const router = express.Router();
const { generateImage } = require('../services/ideogramService');
const fetch = require('node-fetch');

// Image generation endpoint
router.post('/generate-image', async (req, res, next) => {
  try {
    console.log('🖼️  Image generation request received');
    const { prompt, aspectRatio = '16:9', renderingSpeed = 'TURBO', styleType } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const data = await generateImage(prompt, aspectRatio, renderingSpeed, styleType);
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Image proxy endpoint
router.get('/proxy-image', async (req, res, next) => {
  try {
    const imageUrl = req.query.url;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    console.log('🖼️  Proxying image download:', imageUrl);
    
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1].split('?')[0] || 'image.jpg';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
    console.log('✅ Image proxied successfully');
  } catch (error) {
    next(error);
  }
});

module.exports = router;

