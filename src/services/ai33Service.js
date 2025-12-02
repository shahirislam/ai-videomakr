const fetch = require('node-fetch');
const { API_KEYS } = require('../config/apiKeys');

async function generateVoice(text, voiceId = 'aMSt68OGf4xUZAnLpTU8') {
  if (!API_KEYS.AI33_API_KEY) {
    throw new Error('AI33.pro API key not configured');
  }

  console.log('🎤 Creating TTS task with ai33.pro...');
  console.log('   Voice ID:', voiceId);
  console.log('   Text length:', text.length, 'characters');

  // STEP 1: Create TTS Task
  const createUrl = `https://api.ai33.pro/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

  console.log('📤 POST:', createUrl);

  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': API_KEYS.AI33_API_KEY
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_flash_v2_5',
      with_transcript: false
    })
  });

  console.log('📡 Create response status:', createResponse.status);

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error('❌ AI33.pro create error:', createResponse.status, errorText);

    const error = new Error('AI33.pro API error');
    error.statusCode = createResponse.status;
    error.details = errorText;

    if (createResponse.status === 401) {
      error.message = 'Invalid AI33.pro API key';
    } else if (createResponse.status === 402) {
      error.message = 'Insufficient credits';
    }

    throw error;
  }

  const createData = await createResponse.json();
  console.log('✅ Task created:', createData);

  if (!createData.success || !createData.task_id) {
    throw new Error('Failed to create voice task - no task_id returned');
  }

  const taskId = createData.task_id;
  console.log('🆔 Task ID:', taskId);
  console.log('💰 Remaining credits:', createData.ec_remain_credits);

  // STEP 2: Poll task status until done
  let attempts = 0;
  const maxAttempts = 180; // 3 minutes max (180 * 2 seconds = 360 seconds)

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    attempts++;

    console.log(`🔄 Polling task ${taskId}, attempt ${attempts}/${maxAttempts}`);

    const taskUrl = `https://api.ai33.pro/v1/task/${taskId}`;
    const taskResponse = await fetch(taskUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': API_KEYS.AI33_API_KEY
      }
    });

    if (!taskResponse.ok) {
      console.error('❌ Task polling error:', taskResponse.status);
      continue; // Try again
    }

    const taskData = await taskResponse.json();
    console.log(`📊 Task status: ${taskData.status}`);
    console.log(`📊 Full task data:`, JSON.stringify(taskData, null, 2));

    if (taskData.status === 'done' || taskData.status === 'completed' || taskData.status === 'success') {
      // Success! Get the audio URL
      const audioUrl = taskData.metadata?.audio_url || taskData.audio_url || taskData.result?.audio_url;

      if (!audioUrl) {
        console.error('❌ No audio URL found in task data:', taskData);
        throw new Error('No audio URL in completed task');
      }

      console.log('✅ Audio generated:', audioUrl);
      console.log('💰 Credit cost:', taskData.credit_cost);

      // Fetch the audio and convert to base64
      const audioResponse = await fetch(audioUrl);

      if (!audioResponse.ok) {
        throw new Error('Failed to fetch generated audio');
      }

      const audioBuffer = await audioResponse.buffer();
      const base64Audio = audioBuffer.toString('base64');

      return {
        audio: base64Audio,
        contentType: 'audio/mpeg',
        audioUrl: audioUrl,
        audio_url: audioUrl,
        credits_used: taskData.credit_cost,
        credits_remaining: createData.ec_remain_credits - (taskData.credit_cost || 0)
      };

    } else if (taskData.status === 'error' || taskData.status === 'failed') {
      console.error('❌ Task failed:', taskData.error_message || taskData.error);
      throw new Error(taskData.error_message || taskData.error || 'Voice generation failed');
    }

    // Status is still 'processing', 'queued', 'doing', 'pending', etc - continue polling
  }

  // Timeout after maxAttempts
  throw new Error(`Voice generation timeout - task took too long to complete (waited ${maxAttempts * 2} seconds)`);
}

module.exports = {
  generateVoice
};
