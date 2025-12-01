// =====================================================================
// Image Generator Component - Handles image generation and character memory
// =====================================================================

import { generateImagePrompt as generateImagePromptAPI } from '../services/scriptService.js';
import { generateImage } from '../services/imageService.js';
import { parseScriptIntoScenes, getCharacterMemory, setCharacterMemory, getCurrentSceneIndex, setCurrentSceneIndex } from './ScriptGenerator.js';

// Global state for image generation
let selectedStyle = { id: 'realistic', name: 'Realistic' };
let generatedScenes = [];
let currentImageIndex = 0;
let totalImagesToGenerate = 0;

/**
 * Set selected image style
 * @param {Object} style - Style object with id and name
 */
export function setSelectedStyle(style) {
  selectedStyle = style;
}

/**
 * Get selected image style
 * @returns {Object} Selected style
 */
export function getSelectedStyle() {
  return selectedStyle;
}

/**
 * Get generated scenes
 * @returns {Array} Generated scenes
 */
export function getGeneratedScenes() {
  return generatedScenes;
}

/**
 * Set generated scenes
 * @param {Array} scenes - Scenes array
 */
export function setGeneratedScenes(scenes) {
  generatedScenes = scenes;
}

/**
 * Get current image index
 * @returns {number} Current image index
 */
export function getCurrentImageIndex() {
  return currentImageIndex;
}

/**
 * Set current image index
 * @param {number} index - Image index
 */
export function setCurrentImageIndex(index) {
  currentImageIndex = index;
}

/**
 * Get total images to generate
 * @returns {number} Total images
 */
export function getTotalImagesToGenerate() {
  return totalImagesToGenerate;
}

/**
 * Set total images to generate
 * @param {number} total - Total images
 */
export function setTotalImagesToGenerate(total) {
  totalImagesToGenerate = total;
}

/**
 * Extract and save character descriptions from scene text and generated prompt
 * @param {string} sceneText - Scene text
 * @param {string} generatedPrompt - Generated image prompt
 */
export function extractAndSaveCharacters(sceneText, generatedPrompt) {
  const characterMemory = getCharacterMemory();
  const currentSceneIndex = getCurrentSceneIndex();
  
  // 🔒 CRITICAL: SPECIES DETECTION AND LOCKING
  // If Scene 1 has a lion, ALL scenes must have the SAME lion!
  // If Scene 1 has a human, ALL scenes must have the SAME human!
  
  if (currentSceneIndex === 0) {
    // SCENE 1: Detect the species from the generated prompt
    const promptLower = generatedPrompt.toLowerCase();
    
    // Check for animals (lion, elephant, tiger, etc.)
    const animalSpecies = [
      'lion', 'lioness', 'elephant', 'tiger', 'leopard', 'cheetah',
      'wolf', 'bear', 'fox', 'deer', 'giraffe', 'zebra', 'monkey',
      'dog', 'cat', 'bird', 'eagle', 'hawk', 'owl', 'horse', 'rabbit'
    ];
    
    let detectedSpecies = null;
    for (const animal of animalSpecies) {
      if (promptLower.includes(animal)) {
        detectedSpecies = animal;
        break;
      }
    }
    
    if (detectedSpecies) {
      // 🦁 ANIMAL STORY DETECTED!
      characterMemory['MAIN_SPECIES'] = detectedSpecies;
      characterMemory['SPECIES_LOCK'] = 'ANIMAL';
      console.log(`🦁 SPECIES LOCKED: ${detectedSpecies.toUpperCase()} - ALL scenes will feature this animal!`);
      
      // Extract animal description from prompt
      const animalDescPattern = new RegExp(`(a[^,\\.]*${detectedSpecies}[^,\\.]{0,100})`, 'i');
      const animalMatch = generatedPrompt.match(animalDescPattern);
      if (animalMatch) {
        characterMemory['MainCharacter'] = animalMatch[1].trim();
        console.log(`📝 Animal character saved: ${characterMemory['MainCharacter']}`);
      }
    } else if (promptLower.includes('person') || promptLower.includes('man') || 
               promptLower.includes('woman') || promptLower.includes('child') ||
               promptLower.match(/\d+[-\s]year[-\s]old/)) {
      // 👤 HUMAN STORY DETECTED!
      characterMemory['SPECIES_LOCK'] = 'HUMAN';
      console.log(`👤 SPECIES LOCKED: HUMAN - ALL scenes will feature human characters!`);
    }
  }
  
  // Extract names (capitalized words that appear multiple times)
  const namePattern = /\b([A-Z][a-z]+)\b/g;
  const names = {};
  let match;
  
  while ((match = namePattern.exec(sceneText)) !== null) {
    const name = match[1];
    // Skip common words and pronouns
    if (['The', 'This', 'That', 'She', 'He', 'They', 'I', 'It', 'We', 'You', 'A', 'An', 'In', 'On', 'At'].includes(name)) continue;
    names[name] = (names[name] || 0) + 1;
  }
  
  // Save frequently mentioned names (appeared 2+ times OR update existing)
  Object.entries(names).forEach(([name, count]) => {
    // Save if appeared 2+ times, OR if it's already in memory (to update/enhance description)
    const shouldSave = count >= 2 || characterMemory[name];
    
    if (shouldSave) {
      // Try multiple extraction strategies for better accuracy
      const nameLower = name.toLowerCase();
      
      // Strategy 1: Find age-based descriptions (e.g., "73-year-old woman named Cordelia")
      const ageDescPattern = new RegExp(`(\\d+[\\s-]year[\\s-]old[^,\\.]*\\b${nameLower}\\b[^,\\.]*)`, 'i');
      const ageMatch = generatedPrompt.match(ageDescPattern);
      
      // Strategy 2: Find descriptive phrases with name
      const contextPattern = new RegExp(`([^,\\.]{10,80}\\b${nameLower}\\b[^,\\.]{10,80})`, 'i');
      const contextMatch = generatedPrompt.match(contextPattern);
      
      // Strategy 3: Find "character in clothing" patterns
      const clothingPattern = new RegExp(`(${nameLower}[^,\\.]*(?:wearing|in a|in an|with)[^,\\.]{10,50})`, 'i');
      const clothingMatch = generatedPrompt.match(clothingPattern);
      
      // Choose best description
      let bestDescription = null;
      if (ageMatch && ageMatch[1]) {
        bestDescription = ageMatch[1].trim();
      } else if (clothingMatch && clothingMatch[1]) {
        bestDescription = clothingMatch[1].trim();
      } else if (contextMatch && contextMatch[1]) {
        bestDescription = contextMatch[1].trim();
      }
      
      // Only update if we found a better/first description
      if (bestDescription) {
        // If character exists, only update if new description is longer/more detailed
        if (!characterMemory[name] || bestDescription.length > characterMemory[name].length) {
          characterMemory[name] = bestDescription;
          console.log(`📝 Character saved: ${name} → ${characterMemory[name].substring(0, 60)}...`);
        }
      }
    }
  });
  
  // Update character memory
  setCharacterMemory(characterMemory);
}

/**
 * Generate image prompt from scene text using Claude API
 * @param {string} sceneText - Scene text
 * @param {number} sceneIndex - Scene index (0-based)
 * @returns {Promise<string>} Generated image prompt
 */
export async function generateImagePrompt(sceneText, sceneIndex) {
  console.log('🎨 Generating ultra-detailed image prompt with Claude API...');
  
  setCurrentSceneIndex(sceneIndex);
  
  // Get the selected style
  const styleName = selectedStyle ? selectedStyle.name : 'Realistic';
  console.log('📌 Using style:', styleName);
  
  const characterMemory = getCharacterMemory();
  
  try {
    // Build the prompt for Claude
    const prompt = `You are an expert at creating ULTRA-DETAILED, ACCURATE image prompts for ${styleName} style.

SCENE ${sceneIndex + 1} TEXT:
${sceneText}

${Object.keys(characterMemory).length > 0 ? `
PREVIOUS CHARACTERS (keep consistent):
${Object.entries(characterMemory).map(([name, desc]) => `${name}: ${desc}`).join('\n')}
` : ''}

Create a detailed image prompt (55-75 words) that accurately represents this scene, including all characters, their interactions, the setting, and key visual details. Match emotions, colors, actions, and props exactly as described in the scene text.

Output ONLY the final prompt - no analysis or additional text.`;

    const response = await generateImagePromptAPI(prompt, 1000);
    
    // Handle different response formats
    let imagePrompt = '';
    if (response.content && response.content[0] && response.content[0].text) {
      imagePrompt = response.content[0].text;
    } else if (response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content) {
      imagePrompt = response.choices[0].message.content;
    } else if (response.response) {
      imagePrompt = response.response;
    } else if (response.message) {
      imagePrompt = response.message;
    } else if (typeof response === 'string') {
      imagePrompt = response;
    } else {
      console.error('Unexpected response format:', response);
      throw new Error('Invalid response format from image prompt API');
    }
    
    // Clean up the prompt
    imagePrompt = imagePrompt.replace(/^["']|["']$/g, '').trim();
    
    // Remove any analysis text
    const paragraphs = imagePrompt.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 1) {
      const promptParagraph = paragraphs.find(p => 
        p.startsWith('A realistic photograph') || 
        p.startsWith('An official') || 
        p.startsWith('A professional') ||
        p.startsWith('A classical') ||
        p.startsWith('A stick figure') ||
        p.match(/^A .+ (image|illustration|photograph|painting)/)
      );
      if (promptParagraph) {
        imagePrompt = promptParagraph;
      } else {
        imagePrompt = paragraphs[paragraphs.length - 1];
      }
    }
    
    // Remove analysis headers
    imagePrompt = imagePrompt.split('\n')
      .filter(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('**ANALYZING') ||
            trimmed.startsWith('✅') ||
            trimmed.startsWith('❌') ||
            trimmed.startsWith('━━━') ||
            trimmed.startsWith('TUBEGEN-QUALITY') ||
            trimmed === '') {
          return false;
        }
        return true;
      })
      .join(' ')
      .trim();
    
    // Remove markdown
    imagePrompt = imagePrompt.replace(/\*\*/g, '');
    
    // Extract and save character descriptions
    extractAndSaveCharacters(sceneText, imagePrompt);
    
    // Ensure professional photography specs
    if (!imagePrompt.includes('(no visible text)')) {
      imagePrompt = imagePrompt.replace(/,?\s*(cinematic composition|photorealistic style|sharp details).*$/i, '');
      imagePrompt = imagePrompt.trim() + ', professional photography, studio lighting, high resolution 8K, sharp focus on faces, vivid colors, high contrast, dramatic lighting, cinematic composition, photorealistic style, commercial photography quality, crystal clear image (no visible text)';
    }
    
    console.log('✅ Generated professional quality prompt:', imagePrompt.substring(0, 100) + '...');
    return imagePrompt;
  } catch (error) {
    console.warn('⚠️ Claude prompt generation failed, using smart fallback:', error.message);
    
    // Smart fallback
    const firstSentences = sceneText.slice(0, 800);
    const nameMatches = firstSentences.match(/\b[A-Z][a-z]+\b/g) || [];
    const characters = [];
    nameMatches.forEach(name => {
      if (!['The', 'A', 'An', 'I', 'He', 'She', 'They', 'It'].includes(name) && !characters.includes(name)) {
        characters.push(name);
      }
    });
    
    let setting = 'indoor setting';
    if (firstSentences.match(/bank|office|conference/i)) setting = 'bank conference room';
    if (firstSentences.match(/car|vehicle|driving/i)) setting = 'car interior';
    if (firstSentences.match(/outdoor|street|park|forest/i)) setting = 'outdoor location';
    if (firstSentences.match(/home|house|kitchen|bedroom/i)) setting = 'home interior';
    
    const ageMatch = firstSentences.match(/(\d+)[-\s]year[-\s]old/i);
    const age = ageMatch ? ageMatch[1] : '';
    const mainChar = characters[0] || 'a person';
    const ageDesc = age ? `${age}-year-old ` : '';
    
    let mediumShotPrompt = `A realistic photograph of a ${ageDesc}${mainChar} with expressive face`;
    
    if (firstSentences.match(/grip|hold/i)) mediumShotPrompt += ' holding something';
    if (firstSentences.match(/sit|seat/i)) mediumShotPrompt += ' seated';
    if (firstSentences.match(/stand/i)) mediumShotPrompt += ' standing';
    
    mediumShotPrompt += ` in ${setting}, natural lighting, cinematic composition, photorealistic style, sharp details (no visible text)`;
    
    return mediumShotPrompt;
  }
}

/**
 * Map style names to Ideogram style types
 * @param {string} styleName - Style name
 * @returns {string} Ideogram style type
 */
export function getIdeogramStyleType(styleName) {
  const styleMap = {
    'realistic': 'REALISTIC',
    'cinematic': 'REALISTIC',
    'black & white': 'REALISTIC',
    'oil painting': 'GENERAL',
    '3d model': 'RENDER_3D',
    'drawing': 'GENERAL',
    'comic book': 'GENERAL',
    'anime': 'ANIME',
    'pixel art': 'GENERAL',
    'pop art': 'GENERAL',
    'watercolor': 'GENERAL',
    'stick-style': 'DESIGN',
    'stick style': 'DESIGN',
    'naruto anime': 'ANIME',
    'naruto-anime': 'ANIME',
    'game of thrones': 'REALISTIC',
    'game-of-thrones': 'REALISTIC'
  };
  
  const lowerStyle = styleName.toLowerCase();
  return styleMap[lowerStyle] || 'GENERAL';
}

/**
 * Call Ideogram API to generate image
 * @param {string} prompt - Image generation prompt
 * @param {Object} settings - Generation settings
 * @returns {Promise<string>} Image URL
 */
export async function callIdeogramAPI(prompt, settings) {
  console.log('🎨 Generating image with Ideogram V3 API...');
  console.log('Detailed Prompt (first 200 chars):', prompt.substring(0, 200) + '...');
  console.log('Style:', settings.style?.name || 'Realistic');
  console.log('Quality:', settings.quality);
  console.log('Aspect Ratio:', settings.aspectRatio);
  
  // Map quality to Ideogram V3 rendering speeds
  let renderingSpeed = 'TURBO'; // Default: Fast generation
  
  if (settings.quality === 'standard') {
    renderingSpeed = 'TURBO'; // Fast - $0.06
  } else if (settings.quality === 'better') {
    renderingSpeed = 'DEFAULT'; // Balanced - $0.12
  } else if (settings.quality === 'best') {
    renderingSpeed = 'QUALITY'; // Best quality - $0.18
  }
  
  console.log(`📊 Using Ideogram V3 with Speed: ${renderingSpeed}`);
  
  // Get style type
  const styleName = settings.style?.name || settings.imageStyle || 'realistic';
  const styleType = getIdeogramStyleType(styleName);
  
  // Retry logic
  let retryCount = 0;
  const maxRetries = 3;
  let lastError = null;
  
  while (retryCount < maxRetries) {
    try {
      const data = await generateImage(
        prompt,
        settings.aspectRatio || '16:9',
        renderingSpeed,
        styleType
      );
      
      // Ideogram V3 returns image URL in data array
      if (data.data && data.data[0] && data.data[0].url) {
        console.log('✅ Image generated successfully:', data.data[0].url);
        return data.data[0].url;
      } else {
        console.error('❌ Unexpected response format:', data);
        throw new Error('No image URL found in Ideogram response');
      }
    } catch (error) {
      lastError = error;
      retryCount++;
      
      // Check if it's an SSL/connection error
      if (error.message && (error.message.includes('SSL') || error.message.includes('ECONNRESET'))) {
        console.warn(`⚠️ SSL/Connection error (attempt ${retryCount}/${maxRetries}):`, error.message);
        
        if (retryCount < maxRetries) {
          // Wait before retrying (exponential backoff)
          const waitTime = 1000 * Math.pow(2, retryCount - 1); // 1s, 2s, 4s
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue; // Try again
        }
      }
      
      // If not SSL error or max retries reached, throw
      throw error;
    }
  }
  
  // If we get here, all retries failed
  throw lastError || new Error('Image generation failed after retries');
}

/**
 * Generate images for script (progressive mode - generates first image, then shows "Generate Next" button)
 * @param {string} scriptText - Full script text
 * @param {Object} settings - Image generation settings
 * @returns {Promise<Array>} Array of scenes with image URLs
 */
export async function generateImagesForScript(scriptText, settings) {
  // Parse script into scenes
  const scenes = await parseScriptIntoScenes(scriptText, settings.count);
  
  // Initialize state
  setGeneratedScenes(scenes);
  setCurrentImageIndex(0);
  setTotalImagesToGenerate(scenes.length);
  
  // Generate image prompts for all scenes first
  console.log('🎨 Generating image prompts for all scenes...');
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    try {
      const imagePrompt = await generateImagePrompt(scene.text, i);
      scene.prompt = imagePrompt;
      console.log(`✅ Scene ${i + 1} prompt generated`);
    } catch (error) {
      console.error(`❌ Error generating prompt for scene ${i + 1}:`, error);
      scene.prompt = `A realistic photograph of ${scene.text.substring(0, 100)}...`;
    }
  }
  
  // Generate ONLY the first image
  try {
    console.log(`\n🎨 Generating first image (1/${scenes.length})...`);
    const imageUrl = await callIdeogramAPI(scenes[0].prompt, settings);
    scenes[0].imageUrl = imageUrl;
    console.log(`✅ First image completed`);
    
    setCurrentImageIndex(1);
  } catch (error) {
    console.error(`❌ Error generating first image:`, error);
    scenes[0].imageUrl = 'error';
    scenes[0].error = error.message;
  }
  
  return scenes;
}

/**
 * Generate remaining images (called when user clicks "Generate Next")
 * @returns {Promise<void>}
 */
export async function generateRemainingImages() {
  const scenes = getGeneratedScenes();
  const currentIndex = getCurrentImageIndex();
  const total = getTotalImagesToGenerate();
  
  if (!scenes || currentIndex >= total) {
    console.error('❌ Cannot generate: No scenes or already at end');
    throw new Error('No more images to generate!');
  }
  
  const remainingCount = total - currentIndex;
  console.log(`🎬 Generating ${remainingCount} remaining images...`);
  
  // Get settings from current project data or use defaults
  const settings = window.currentProjectData?.settings || {
    aspectRatio: '16:9',
    quality: 'standard',
    style: getSelectedStyle()
  };
  
  // Generate all remaining images
  for (let i = currentIndex; i < total; i++) {
    try {
      console.log(`🎨 Generating image ${i + 1}/${total}...`);
      const imageUrl = await callIdeogramAPI(scenes[i].prompt, settings);
      scenes[i].imageUrl = imageUrl;
      console.log(`✅ Image ${i + 1} completed`);
      
      // Update display after each image (if display function is available)
      if (window.displayGeneratedScenes && typeof window.displayGeneratedScenes === 'function') {
        window.displayGeneratedScenes(scenes);
      }
    } catch (error) {
      console.error(`❌ Error generating image ${i + 1}:`, error);
      scenes[i].imageUrl = 'error';
      scenes[i].error = error.message;
    }
  }
  
  setCurrentImageIndex(total);
  setGeneratedScenes(scenes);
  
  console.log('✅ All images generated!');
}

