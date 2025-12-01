// =====================================================================
// Script Generator Component - Handles script generation and parsing
// =====================================================================

import { generateScript } from '../services/scriptService.js';
import { appStorage, creditStorage } from '../utils/storage.js';
import { formatTimestamp, countWords } from '../utils/formatters.js';
import { scriptStore } from '../store/scriptStore.js';
import { TYPEWRITER_SPEED, DEFAULTS } from '../utils/constants.js';

// Global state for script parsing (needed for image generation)
let characterMemory = {};
let currentSceneIndex = 0;
let actualAudioDuration = 0;

/**
 * Generate full script from title and settings
 * @param {Object} options - Generation options
 * @param {string} options.title - Video title
 * @param {number} options.wordCount - Target word count
 * @param {string} options.additionalContext - Additional context/instructions
 * @param {number} options.styleIdx - Current style index
 * @param {Array} options.styles - Array of styles
 * @returns {Promise<string>} Generated script text
 */
/**
 * Add loading state to generate button
 */
function setGenerateButtonLoading(isLoading) {
  const generateBtn = document.getElementById('generate-btn');
  if (!generateBtn) return;
  
  if (isLoading) {
    generateBtn.classList.add('loading');
    generateBtn.disabled = true;
    const originalText = generateBtn.textContent;
    generateBtn.dataset.originalText = originalText;
    generateBtn.innerHTML = '<span style="opacity: 0;">Generating</span>';
  } else {
    generateBtn.classList.remove('loading');
    generateBtn.disabled = false;
    const originalText = generateBtn.dataset.originalText || 'Generate';
    generateBtn.textContent = originalText;
  }
}

export async function generateFullScript({
  title,
  wordCount,
  additionalContext = '',
  styleIdx = null,
  styles = []
}) {
  // Validate inputs
  if (!title || !wordCount) {
    throw new Error('Please enter both a title and word count.');
  }

  // Get style settings if available
  let mainWordCount = wordCount;
  let styleLang = "English";
  
  if (styles.length && styleIdx !== null && styles[styleIdx]?.wordCount) {
    styleLang = styles[styleIdx].lang || "English";
    mainWordCount = Math.min(styles[styleIdx].wordCount, DEFAULTS.MAX_WORDS);
  }

  // Calculate cost
  const cost = Math.round(mainWordCount / 100);
  const currentCredits = creditStorage.getUiBalance();
  
  if (currentCredits < cost) {
    throw new Error("Not enough credits to generate this script.");
  }

  // Build user prompt
  let userPrompt = `Write a ${mainWordCount}-word story in ${styleLang} for this title: "${title}".`;
  
  // Add competitor video analysis if available
  if (styles.length && styleIdx !== null && styles[styleIdx]?.competitorUrl) {
    const compUrl = styles[styleIdx].competitorUrl;
    userPrompt += `\n\nIMPORTANT: Analyze the structure and pacing style from this competitor video: ${compUrl}
Use similar narrative techniques, chapter flow, and emotional beats, but create completely original content. DO NOT copy any text word-for-word.`;
  }
  
  if (additionalContext.length > 0) {
    userPrompt += ` Additional context: ${additionalContext}`;
  }

  // Build full prompt with narration rules
  const fullPrompt = `NARRATION RULES - STRICTLY FOLLOW:
- Write in pure narrative form only - NO subtitles, headings, or section breaks
- Do NOT use any special characters like #, *, _, or formatting symbols
- Do NOT include [Scene descriptions] or (parenthetical notes)
- NO chapter markers, timestamps, or labeled segments
- Write as one continuous flowing story from beginning to end
- Use natural paragraph breaks only
- Write EXACTLY as it should be spoken aloud by a narrator

STORYTELLING RULES FOR 90%+ RETENTION:
- Start with an immediate hook in the first 5 seconds that creates curiosity or shock
- Use the "open loop" technique - raise questions early and answer them later
- Build tension constantly - every paragraph should make viewers want to know "what happens next"
- Include unexpected plot twists every 30-45 seconds of narration
- Use cliffhangers before natural pause points
- Add specific, vivid details that paint mental pictures
- Include emotional moments that connect with viewers
- Use short, punchy sentences mixed with longer descriptive ones for rhythm
- Employ "pattern interrupts" - sudden changes in tone, pace, or revelation
- Foreshadow future events to create anticipation: "Little did they know..." or "But that was before..."
- End paragraphs with questions or incomplete thoughts that pull readers forward
- Use power words: "suddenly", "but then", "without warning", "the truth was"
- Build to a climactic reveal or satisfying conclusion
- Pace the story like a rollercoaster - tension, release, bigger tension
- Make every sentence earn its place - cut all filler
- Create relatable stakes - make audience care about what happens

USER REQUEST:
${userPrompt}`;

  // Call API
  const data = await generateScript(fullPrompt, 8000);
  
  if (!data || !data.content || !data.content[0] || !data.content[0].text) {
    throw new Error('Invalid response from script generation API');
  }
  
  const scriptText = data.content[0].text;

  // Deduct credits
  creditStorage.debitCredits(cost);

  // Save session for recovery
  if (window.saveCurrentSession) {
    window.saveCurrentSession({
      title: title,
      script: scriptText,
      wordCount: countWords(scriptText),
      styleId: styleIdx,
      timestamp: new Date().toISOString()
    });
  }

  return scriptText;
}

/**
 * Parse script into scenes with timestamps
 * @param {string} scriptText - The full script text
 * @param {number} targetCount - Target number of scenes
 * @returns {Promise<Array>} Array of scene objects
 */
export async function parseScriptIntoScenes(scriptText, targetCount) {
  const words = scriptText.split(/\s+/);
  const wordsPerScene = Math.floor(words.length / targetCount);
  const scenes = [];
  
  console.log(`📝 Parsing script into ${targetCount} scenes and generating image prompts...`);
  
  // Use actual audio duration if available, otherwise estimate
  const useActualDuration = actualAudioDuration > 0;
  const totalDuration = useActualDuration ? actualAudioDuration : (words.length / (150 / 60));
  
  if (useActualDuration) {
    console.log('✅ Using ACTUAL audio duration:', actualAudioDuration, 'seconds');
  } else {
    console.log('⚠️ Audio duration not available, using word-based estimation');
  }
  
  // Reset character memory for new generation
  characterMemory = {};
  currentSceneIndex = 0;
  
  // Helper function: Find nearest sentence ending after target word position
  function findSentenceEnd(words, targetWordIndex) {
    const textFromTarget = words.slice(targetWordIndex).join(' ');
    const sentenceEndMatch = textFromTarget.match(/[.!?]\s+(?=[A-Z"])/);
    
    if (!sentenceEndMatch) {
      return targetWordIndex;
    }
    
    const endPosition = sentenceEndMatch.index + sentenceEndMatch[0].length;
    const textUpToEnd = textFromTarget.slice(0, endPosition);
    const wordsUpToEnd = textUpToEnd.trim().split(/\s+/).length;
    
    return targetWordIndex + wordsUpToEnd;
  }
  
  // Store scene boundaries to ensure next scene starts where previous ended
  const sceneBoundaries = [];
  
  for (let i = 0; i < targetCount; i++) {
    const startWord = i === 0 ? 0 : sceneBoundaries[i - 1];
    let endWord = (i === targetCount - 1) ? words.length : (i + 1) * wordsPerScene;
    
    // For all scenes except the last, find the nearest sentence ending
    if (i < targetCount - 1) {
      endWord = findSentenceEnd(words, endWord);
      if (endWord > words.length) endWord = words.length;
    }
    
    sceneBoundaries.push(endWord);
    
    const sceneText = words.slice(startWord, endWord).join(' ');
    
    // Calculate timestamps
    const startRatio = startWord / words.length;
    const endRatio = endWord / words.length;
    const startTime = startRatio * totalDuration;
    const endTime = endRatio * totalDuration;
    
    // Generate AI-powered image prompt (this will be handled by ImageGenerator)
    // For now, we'll leave it null and let ImageGenerator handle it
    const imagePrompt = null; // Will be generated later
    
    scenes.push({
      number: i + 1,
      text: sceneText,
      startTime: formatTimestamp(startTime),
      endTime: formatTimestamp(endTime),
      startSeconds: startTime,
      endSeconds: endTime,
      imageUrl: null,
      prompt: imagePrompt
    });
    
    console.log(`✅ Scene ${i + 1} created (${formatTimestamp(startTime)} - ${formatTimestamp(endTime)})`);
  }
  
  return scenes;
}

/**
 * Typewriter effect for displaying script text
 * @param {string} text - Text to display
 * @param {HTMLElement} element - DOM element to update
 * @param {Function} onComplete - Callback when typing is complete
 */
export function typeWriterEffect(text, element, onComplete) {
  if (!element) return;
  
  element.textContent = "";
  element.style.opacity = "1";
  let i = 0;
  
  function typeWriter() {
    if (i < text.length) {
      element.textContent += text.charAt(i++);
      setTimeout(typeWriter, TYPEWRITER_SPEED);
    } else {
      // Finished typing - call completion handlers
      if (onComplete) {
        onComplete();
      }
      
      // Also ensure voice and image icons are enabled
      if (typeof window !== 'undefined') {
        window.isGenerating = false;
        
        // Directly enable icons (don't wait for checks)
        const voiceIcon = document.getElementById('voiceIcon');
        const imageIcon = document.getElementById('imageIcon');
        
        if (voiceIcon) {
          voiceIcon.classList.remove('disabled');
          voiceIcon.setAttribute('aria-disabled', 'false');
          voiceIcon.style.pointerEvents = 'auto'; // Force enable pointer events
          voiceIcon.style.cursor = 'pointer'; // Force cursor
          console.log('✅ Voice icon enabled directly in typeWriterEffect');
        }
        
        if (imageIcon) {
          imageIcon.classList.remove('disabled');
          imageIcon.setAttribute('aria-disabled', 'false');
          imageIcon.style.pointerEvents = 'auto'; // Force enable pointer events
          imageIcon.style.cursor = 'pointer'; // Force cursor
          console.log('✅ Image icon enabled directly in typeWriterEffect');
        }
        
        // Also call the completion handlers
        if (typeof window.refreshVoiceIcon === 'function') {
          window.refreshVoiceIcon();
        }
        if (typeof window.onScriptGenerationComplete === 'function') {
          window.onScriptGenerationComplete();
        }
        
        // Re-check after a delay to ensure everything is synced
        setTimeout(() => {
          if (typeof window.refreshVoiceIcon === 'function') {
            window.refreshVoiceIcon();
          }
          if (typeof window.refreshImageIcon === 'function') {
            window.refreshImageIcon();
          }
        }, 300);
      }
    }
  }
  
  typeWriter();
}

/**
 * Set actual audio duration (used for scene parsing)
 * @param {number} duration - Duration in seconds
 */
export function setActualAudioDuration(duration) {
  actualAudioDuration = duration;
}

/**
 * Get character memory (for image generation consistency)
 * @returns {Object} Character memory object
 */
export function getCharacterMemory() {
  return characterMemory;
}

/**
 * Set character memory
 * @param {Object} memory - Character memory object
 */
export function setCharacterMemory(memory) {
  characterMemory = memory;
}

/**
 * Get current scene index
 * @returns {number} Current scene index
 */
export function getCurrentSceneIndex() {
  return currentSceneIndex;
}

/**
 * Set current scene index
 * @param {number} index - Scene index
 */
export function setCurrentSceneIndex(index) {
  currentSceneIndex = index;
}

