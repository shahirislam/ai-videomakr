const fetch = require('node-fetch');
const FormData = require('form-data');
const { API_KEYS } = require('../config/apiKeys');

function convertAspectRatio(aspectRatio) {
  const ratioMap = {
    '16:9': '16x9',
    '16x9': '16x9',
    '9:16': '9x16',
    '9x16': '9x16',
    '1:1': '1x1',
    '1x1': '1x1',
    '10:16': '10x16',
    '10x16': '10x16',
    '16:10': '16x10',
    '16x10': '16x10',
    '3:2': '3x2',
    '3x2': '3x2',
    '2:3': '2x3',
    '2x3': '2x3',
    '4:3': '4x3',
    '4x3': '4x3',
    '3:4': '3x4',
    '3x4': '3x4'
  };
  
  return ratioMap[aspectRatio] || '1x1';
}

function validateRenderingSpeed(speed) {
  const validSpeeds = ['FLASH', 'TURBO', 'DEFAULT', 'QUALITY'];
  return validSpeeds.includes(speed) ? speed : 'TURBO';
}

function validateStyleType(styleType) {
  const validStyleTypes = ['AUTO', 'GENERAL', 'REALISTIC', 'DESIGN', 'FICTION'];
  return validStyleTypes.includes(styleType) ? styleType : 'REALISTIC';
}

async function generateImage(prompt, aspectRatio = '16:9', renderingSpeed = 'TURBO', styleType) {
  if (!API_KEYS.IDEOGRAM_API_KEY) {
    throw new Error('Ideogram API key not configured');
  }

  const v3AspectRatio = convertAspectRatio(aspectRatio);
  const finalSpeed = validateRenderingSpeed(renderingSpeed);
  const finalStyleType = validateStyleType(styleType);

  console.log('🎨 Calling REAL Ideogram V3 API...');
  console.log('   Endpoint: /v1/ideogram-v3/generate');
  console.log('   Aspect Ratio:', v3AspectRatio);
  console.log('   Rendering Speed:', finalSpeed);
  console.log('   Style Type:', finalStyleType);

  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('aspect_ratio', v3AspectRatio);
  formData.append('rendering_speed', finalSpeed);
  formData.append('style_type', finalStyleType);
  formData.append('magic_prompt', 'AUTO');

  const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
    method: 'POST',
    headers: {
      'Api-Key': API_KEYS.IDEOGRAM_API_KEY,
      ...formData.getHeaders()
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Ideogram V3 error:', response.status, errorText);
    
    const error = new Error(`Ideogram V3 API error: ${response.status}`);
    error.statusCode = response.status;
    error.details = errorText;
    
    if (response.status === 401) {
      error.message = 'Invalid Ideogram API key';
      error.details = 'Check your IDEOGRAM_API_KEY in .env file';
    } else if (response.status === 402) {
      error.message = 'Insufficient credits';
      error.details = 'You need more Ideogram credits';
    } else if (response.status === 422) {
      error.message = 'Prompt failed safety check';
      error.details = 'Your prompt was flagged by content moderation';
    }
    
    throw error;
  }

  const data = await response.json();
  console.log('✅ Image generated successfully with REAL V3!');
  return data;
}

module.exports = {
  generateImage
};

