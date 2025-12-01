const fetch = require('node-fetch');
const { API_KEYS } = require('../config/apiKeys');

async function callClaudeAPI(prompt, maxTokens = 4096, timeout = 120000) {
  if (!API_KEYS.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  console.log('📝 Calling Claude API...');
  console.log('   Model: claude-sonnet-4-20250514');
  console.log('   Max tokens:', maxTokens);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEYS.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages: [
          { role: 'user', content: prompt }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Claude API error:', data);
      
      if (data?.error?.type === 'authentication_error') {
        const error = new Error('Invalid API key');
        error.statusCode = 401;
        error.message = 'Your Anthropic API key is invalid. Please check your .env file.';
        throw error;
      }
      
      throw new Error(data?.error?.message || 'Claude API error');
    }

    console.log('✅ Claude API success');
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error('❌ Claude API timeout');
      const timeoutError = new Error('Request timeout');
      timeoutError.statusCode = 408;
      timeoutError.message = 'Claude API took too long to respond.';
      throw timeoutError;
    }
    
    throw error;
  }
}

async function generateImagePrompt(prompt, maxTokens = 500) {
  const response = await callClaudeAPI(prompt, maxTokens, 60000);
  
  // Convert Claude response format to match ChatGPT format for compatibility
  return {
    choices: [
      {
        message: {
          content: response.content[0].text
        }
      }
    ]
  };
}

module.exports = {
  callClaudeAPI,
  generateImagePrompt
};

