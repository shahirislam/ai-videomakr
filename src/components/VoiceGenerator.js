// =====================================================================
// Voice Generator Component - Handles voice generation and voice selection
// =====================================================================

import { generateVoice } from '../services/voiceService.js';
import { appStorage, creditStorage } from '../utils/storage.js';
import { ELEVENLABS_VOICES, SPEECHIFY_VOICES, ELEVENLABS_VOICE_MAP, VOICE_RATE_WORDS_PER_CREDIT } from '../utils/constants.js';

// Voice state
let selectedVoiceIdx = 0; // Juniper (safest default that always works)
let selectedVoiceId = 'aMSt68OGf4xUZAnLpTU8'; // Juniper default - ALWAYS WORKS
let currentVoiceProvider = 'premium'; // 'premium' (ElevenLabs) or 'non-premium' (Speechify)
let generatedAudioUrl = null;
let actualAudioDuration = 0;

/**
 * Get selected voice ID from style settings or default
 * @returns {string} Voice ID
 */
export function getSelectedVoiceId() {
  try {
    const styles = appStorage.getStyles();
    const currentStyleIdx = appStorage.getCurrentStyleIdx();
    
    if (styles && currentStyleIdx !== null && styles[currentStyleIdx]) {
      const style = styles[currentStyleIdx];
      
      // Check if style has a voice setting
      if (style.voice) {
        // Check if it's a voice ID (UUID format) or a voice name
        if (style.voice.match(/^[a-zA-Z0-9]{20,}$/)) {
          // It's a voice ID
          return style.voice;
        } else {
          // It's a voice name, map it to ID
          const mappedId = ELEVENLABS_VOICE_MAP[style.voice] || "aMSt68OGf4xUZAnLpTU8";
          return mappedId;
        }
      }
    }
  } catch (error) {
    console.warn('Error getting voice from style:', error);
  }
  
  // Default to Juniper
  return selectedVoiceId;
}

/**
 * Set selected voice ID
 * @param {string} voiceId - Voice ID
 */
export function setSelectedVoiceId(voiceId) {
  selectedVoiceId = voiceId;
}

/**
 * Get selected voice index
 * @returns {number} Voice index
 */
export function getSelectedVoiceIdx() {
  return selectedVoiceIdx;
}

/**
 * Set selected voice index
 * @param {number} idx - Voice index
 */
export function setSelectedVoiceIdx(idx) {
  selectedVoiceIdx = idx;
}

/**
 * Get current voice provider
 * @returns {string} Voice provider ('premium' or 'non-premium')
 */
export function getCurrentVoiceProvider() {
  return currentVoiceProvider;
}

/**
 * Set current voice provider
 * @param {string} provider - Voice provider
 */
export function setCurrentVoiceProvider(provider) {
  currentVoiceProvider = provider;
}

/**
 * Get generated audio URL
 * @returns {string|null} Audio URL
 */
export function getGeneratedAudioUrl() {
  return generatedAudioUrl;
}

/**
 * Set generated audio URL
 * @param {string|null} url - Audio URL
 */
export function setGeneratedAudioUrl(url) {
  generatedAudioUrl = url;
}

/**
 * Get actual audio duration
 * @returns {number} Audio duration in seconds
 */
export function getActualAudioDuration() {
  return actualAudioDuration;
}

/**
 * Set actual audio duration
 * @param {number} duration - Duration in seconds
 */
export function setActualAudioDuration(duration) {
  actualAudioDuration = duration;
}

/**
 * Calculate voice generation cost based on word count
 * @param {number} wordCount - Number of words
 * @returns {number} Cost in credits
 */
export function calculateVoiceCost(wordCount) {
  return Math.ceil(wordCount / VOICE_RATE_WORDS_PER_CREDIT);
}

/**
 * Get audio duration from audio URL (with timeout)
 * @param {string} audioUrl - Audio URL
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<number>} Duration in seconds
 */
export async function getAudioDurationWithTimeout(audioUrl, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    let resolved = false;
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Audio duration timeout'));
      }
    }, timeoutMs);
    
    audio.addEventListener('loadedmetadata', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(audio.duration);
      }
    });
    
    audio.addEventListener('error', (e) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error('Failed to load audio: ' + (e.message || 'Unknown error')));
      }
    });
    
    audio.src = audioUrl;
  });
}

/**
 * Generate voice from script text
 * @param {string} text - Script text to convert to speech
 * @param {Object} options - Generation options
 * @param {Function} options.onProgress - Progress callback
 * @param {Function} options.onComplete - Completion callback
 * @param {Function} options.onError - Error callback
 * @returns {Promise<string>} Audio URL
 */
export async function generateVoiceFromText(text, options = {}) {
  const {
    onProgress = () => {},
    onComplete = () => {},
    onError = () => {}
  } = options;
  
  if (!text || !text.trim()) {
    const error = new Error('Text is required for voice generation');
    onError(error);
    throw error;
  }
  
  try {
    // Get voice ID from style settings
    const voiceId = getSelectedVoiceId();
    console.log('🎤 Using voice ID for generation:', voiceId);
    console.log('🎤 Script text preview:', text.substring(0, 100) + '...');
    
    // Get voice settings from style
    const voiceSettings = (() => {
      try {
        const styles = appStorage.getStyles();
        const idx = appStorage.getCurrentStyleIdx();
        const style = styles?.[idx];
        return {
          stability: (style?.stability !== undefined ? style.stability / 100 : 0.5),
          similarity_boost: (style?.similarity !== undefined ? style.similarity / 100 : 0.75)
        };
      } catch {
        return { stability: 0.5, similarity_boost: 0.75 };
      }
    })();
    
    console.log('🎤 Voice settings from style:', voiceSettings);
    
    // Update progress
    onProgress(10);
    
    // Call voice generation API
    const response = await generateVoice(text, voiceId, voiceSettings);
    
    // Update progress
    onProgress(100);
    
    // Create audio URL from response
    let audioUrl;
    if (response.audio && response.contentType) {
      // Base64 audio data
      audioUrl = `data:${response.contentType};base64,${response.audio}`;
    } else if (response.url) {
      // Direct URL
      audioUrl = response.url;
    } else {
      throw new Error('Invalid response format from voice generation API');
    }
    
    // Store audio URL
    setGeneratedAudioUrl(audioUrl);
    
    // Get duration in background (non-blocking)
    getAudioDurationWithTimeout(audioUrl, 5000)
      .then(duration => {
        setActualAudioDuration(duration);
        console.log('✅ Audio duration stored:', duration, 'seconds');
      })
      .catch(err => {
        console.warn('⚠️ Could not get audio duration, will use word estimation:', err);
        setActualAudioDuration(0); // Will fall back to word-based estimation
      });
    
    // Call completion callback
    onComplete(audioUrl);
    
    return audioUrl;
  } catch (error) {
    console.error('❌ Voice generation failed:', error);
    onError(error);
    throw error;
  }
}

/**
 * Toggle voice dropdown modal
 */
export function toggleVoiceDropdownModal() {
  const modal = document.getElementById('voiceDropdownModal');
  if (!modal) return;
  modal.classList.toggle('hidden');
}

/**
 * Close voice dropdown modal
 */
export function closeVoiceDropdownModal() {
  const modal = document.getElementById('voiceDropdownModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Select voice from modal (ElevenLabs)
 * @param {string} voiceId - Voice ID
 * @param {string} voiceName - Voice name
 * @param {string} voiceStyle - Voice style
 */
export function selectVoiceFromModal(voiceId, voiceName, voiceStyle) {
  setSelectedVoiceId(voiceId);
  
  // Update display
  const display = document.getElementById('selectedVoiceDisplay');
  if (display) {
    display.textContent = `${voiceName} - ${voiceStyle}`;
  }
  
  // Update hidden select if it exists
  const select = document.getElementById('styleVoiceSelect');
  if (select) {
    select.value = voiceId;
  }
  
  // Close modal
  closeVoiceDropdownModal();
  
  console.log(`✅ Selected voice: ${voiceName} (${voiceId})`);
}

/**
 * Select Speechify voice
 * @param {string} voiceId - Voice ID
 * @param {string} voiceName - Voice name
 * @param {string} voiceStyle - Voice style
 */
export function selectSpeechifyVoice(voiceId, voiceName, voiceStyle) {
  setSelectedVoiceId(voiceId);
  const display = document.getElementById('selectedVoiceDisplay');
  if (display) {
    display.textContent = `${voiceName} - ${voiceStyle}`;
  }
  closeSpeechifyVoiceModal();
  console.log(`✅ Selected Speechify voice: ${voiceName} (${voiceId})`);
}

/**
 * Toggle Speechify voice modal
 */
export function toggleSpeechifyVoiceModal() {
  const modal = document.getElementById('speechifyVoiceModal');
  if (!modal) return;
  modal.classList.toggle('hidden');
}

/**
 * Close Speechify voice modal
 */
export function closeSpeechifyVoiceModal() {
  const modal = document.getElementById('speechifyVoiceModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Play voice preview
 * @param {string} voiceId - Voice ID
 * @param {string} voiceName - Voice name
 */
export function playVoicePreview(voiceId, voiceName) {
  console.log(`🔊 Playing preview for: ${voiceName} (${voiceId})`);
  
  // ElevenLabs preview URL
  const previewUrl = `https://api.elevenlabs.io/v1/voices/${voiceId}/preview`;
  
  // Create audio element and play
  const audio = new Audio();
  audio.src = previewUrl;
  audio.play().catch(err => {
    console.log('Preview not available, showing voice info instead');
    alert(`Voice Preview:\n\nName: ${voiceName}\nID: ${voiceId}\n\nNote: To enable voice previews, add your ElevenLabs API key.`);
  });
}

/**
 * Switch voice provider (premium/non-premium)
 * @param {string} provider - Provider type ('premium' or 'non-premium')
 */
export function switchVoiceProvider(provider) {
  setCurrentVoiceProvider(provider);
  console.log('🔄 Switching to:', provider);
  
  const voiceLabel = document.getElementById('voiceLabel');
  if (voiceLabel) {
    voiceLabel.textContent = provider === 'premium' 
      ? 'Voice (21 ElevenLabs Voices)' 
      : 'Voice (Speechify Voices)';
  }
  
  // Toggle voice selection controls
  const elevenlabsControls = document.getElementById('elevenlabsVoiceControls');
  const speechifyControls = document.getElementById('speechifyVoiceControls');
  
  if (provider === 'premium') {
    if (elevenlabsControls) elevenlabsControls.classList.remove('hidden');
    if (speechifyControls) speechifyControls.classList.add('hidden');
  } else {
    if (elevenlabsControls) elevenlabsControls.classList.add('hidden');
    if (speechifyControls) speechifyControls.classList.remove('hidden');
  }
}

/**
 * Initialize voice generator (set up event listeners)
 */
export function initializeVoiceGenerator() {
  // Expose functions globally for onclick handlers in HTML
  window.selectVoiceFromModal = selectVoiceFromModal;
  window.selectSpeechifyVoice = selectSpeechifyVoice;
  window.playVoicePreview = playVoicePreview;
  window.toggleVoiceDropdownModal = toggleVoiceDropdownModal;
  window.closeVoiceDropdownModal = closeVoiceDropdownModal;
  window.toggleSpeechifyVoiceModal = toggleSpeechifyVoiceModal;
  window.closeSpeechifyVoiceModal = closeSpeechifyVoiceModal;
  
  // Set up voice provider switcher
  const providerSelect = document.getElementById('voiceProvider');
  if (providerSelect) {
    providerSelect.addEventListener('change', (e) => {
      switchVoiceProvider(e.target.value);
    });
  }
}

