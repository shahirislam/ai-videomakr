// =====================================================================
// Image Modal Component - Handles image modal, style selector, and scene display
// =====================================================================

import { setSelectedStyle, getSelectedStyle, getGeneratedScenes, setGeneratedScenes, callIdeogramAPI } from './ImageGenerator.js';
import { getProxyImageUrl } from '../services/imageService.js';

// Style selector state
let currentStylePage = 1;

/**
 * Open style selector modal
 */
export function openStyleSelector() {
  const modal = document.getElementById('styleSelectorModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    currentStylePage = 1;
    showStylePage(1);
  }
}

/**
 * Close style selector modal
 */
export function closeStyleSelector() {
  const modal = document.getElementById('styleSelectorModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

/**
 * Show specific style page (1, 2, or 3)
 * @param {number} page - Page number (1-3)
 */
export function showStylePage(page) {
  // Hide all pages
  const page1 = document.getElementById('stylesPage1');
  const page2 = document.getElementById('stylesPage2');
  const page3 = document.getElementById('stylesPage3');
  
  if (page1) page1.classList.add('hidden');
  if (page2) page2.classList.add('hidden');
  if (page3) page3.classList.add('hidden');
  
  // Show selected page
  const selectedPage = document.getElementById(`stylesPage${page}`);
  if (selectedPage) {
    selectedPage.classList.remove('hidden');
    selectedPage.classList.add('grid');
  }
  
  // Update page number
  const currentPageEl = document.getElementById('currentPage');
  if (currentPageEl) {
    currentPageEl.textContent = page;
  }
  
  // Update button states
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  
  if (prevBtn) {
    prevBtn.disabled = page === 1;
  }
  
  if (nextBtn) {
    nextBtn.disabled = page === 3;
  }
  
  currentStylePage = page;
}

/**
 * Go to next style page
 */
export function nextStylePage() {
  if (currentStylePage < 3) {
    showStylePage(currentStylePage + 1);
  }
}

/**
 * Go to previous style page
 */
export function previousStylePage() {
  if (currentStylePage > 1) {
    showStylePage(currentStylePage - 1);
  }
}

/**
 * Select image style
 * @param {string} styleId - Style ID
 * @param {string} styleName - Style name
 * @param {string} imageUrl - Style preview image URL (optional)
 * @param {Event} event - Click event (optional)
 * @returns {boolean} False to prevent default behavior
 */
export function selectImageStyle(styleId, styleName, imageUrl, event) {
  // Prevent event bubbling
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  // Update selected style
  setSelectedStyle({ id: styleId, name: styleName });
  
  console.log('🎨 Style selected:', styleId, styleName);
  
  // Update the selected style display in main modal
  const nameElement = document.getElementById('selectedStyleName');
  if (nameElement) {
    nameElement.textContent = styleName;
    console.log('✅ Updated style name to:', styleName);
  }
  
  // Update the image preview
  const imageElement = document.getElementById('selectedStyleImage');
  if (imageElement) {
    if (imageUrl) {
      // Use provided imageUrl
      imageElement.src = imageUrl;
      imageElement.alt = styleName;
      console.log('✅ Updated image URL');
    } else {
      // Try to find the image from the style card
      const styleCards = document.querySelectorAll('.style-card');
      for (const card of styleCards) {
        const cardImage = card.querySelector('img');
        if (cardImage && cardImage.alt === styleName) {
          imageElement.src = cardImage.src;
          imageElement.alt = styleName;
          console.log('✅ Found and updated image from card');
          break;
        }
      }
    }
  }
  
  // Highlight selected style card
  document.querySelectorAll('.style-card').forEach(card => {
    card.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
  });
  
  // Find the clicked card - could be the element itself or a parent
  let clickedCard = null;
  if (event) {
    // Start from the event target and go up until we find style-card
    let element = event.target || event.srcElement;
    while (element && element !== document.body) {
      if (element.classList && element.classList.contains('style-card')) {
        clickedCard = element;
        break;
      }
      element = element.parentElement;
    }
    
    // If not found, try currentTarget
    if (!clickedCard && event.currentTarget && event.currentTarget.classList && event.currentTarget.classList.contains('style-card')) {
      clickedCard = event.currentTarget;
    }
  }
  
  // Add highlight to clicked card
  if (clickedCard) {
    clickedCard.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
    console.log('✅ Highlighted selected card');
  }
  
  // Close style selector
  closeStyleSelector();
  
  console.log('✅ Style selection complete:', getSelectedStyle());
  
  return false; // Prevent default behavior
}

/**
 * Update credits estimate based on image generation settings
 */
export function updateImageCreditsEstimate() {
  const quality = document.getElementById('imageQuality')?.value || 'better';
  const count = parseInt(document.getElementById('imageCount')?.value || 3);
  const animate = document.getElementById('imageAnimate')?.checked || false;
  
  let costPerImage = quality === 'standard' ? 30 : quality === 'better' ? 60 : 120;
  if (animate) costPerImage *= 2; // Animation doubles the cost
  
  const total = costPerImage * count;
  const estimateEl = document.getElementById('imageCreditsEstimate');
  if (estimateEl) {
    estimateEl.textContent = total;
  }
}

/**
 * Display generated scenes with images
 * @param {Array} scenes - Array of scene objects with text, imageUrl, prompt, etc.
 */
export function displayGeneratedScenes(scenes) {
  const container = document.getElementById('generatedScenesContainer');
  const loading = document.getElementById('scenesLoading');
  
  if (!container) {
    console.warn('Generated scenes container not found');
    return;
  }
  
  // Hide loading
  if (loading) {
    loading.classList.add('hidden');
  }
  
  // Clear container
  container.innerHTML = '';
  
  if (!scenes || scenes.length === 0) {
    container.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-8">No scenes generated yet.</p>';
    return;
  }
  
  // Display each scene
  scenes.forEach((scene, index) => {
    const sceneCard = document.createElement('div');
    sceneCard.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 border border-gray-200 dark:border-gray-700';
    sceneCard.id = `scene-${index}`;
    
    // Scene header with timestamp
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-3';
    
    const sceneTitle = document.createElement('h3');
    sceneTitle.className = 'text-lg font-semibold text-gray-900 dark:text-white';
    sceneTitle.textContent = `Scene ${index + 1}`;
    
    const timestamp = document.createElement('span');
    timestamp.className = 'text-sm text-gray-500 dark:text-gray-400';
    if (scene.startSeconds !== undefined && scene.endSeconds !== undefined) {
      const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
      };
      timestamp.textContent = `${formatTime(scene.startSeconds)} - ${formatTime(scene.endSeconds)}`;
    }
    
    header.appendChild(sceneTitle);
    header.appendChild(timestamp);
    
    // Scene text
    const sceneText = document.createElement('p');
    sceneText.className = 'text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap';
    sceneText.textContent = scene.text || '';
    
    // Image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'relative mb-3';
    
    if (scene.imageUrl) {
      if (scene.imageUrl === 'error') {
        // Show error state
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center';
        
        const errorIcon = document.createElement('div');
        errorIcon.className = 'text-red-600 dark:text-red-400 mb-2';
        errorIcon.innerHTML = '<svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
        
        const errorText = document.createElement('p');
        errorText.className = 'text-red-700 dark:text-red-300 text-sm';
        errorText.textContent = scene.error || 'Failed to generate image';
        
        errorDiv.appendChild(errorIcon);
        errorDiv.appendChild(errorText);
        imageContainer.appendChild(errorDiv);
      } else {
        // Show image
        const img = document.createElement('img');
        img.src = scene.imageUrl;
        img.alt = `Scene ${index + 1} image`;
        img.className = 'w-full h-auto rounded-lg shadow-md';
        img.loading = 'lazy';
        
        // Add error handler
        img.onerror = () => {
          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="16"%3EImage failed to load%3C/text%3E%3C/svg%3E';
        };
        
        imageContainer.appendChild(img);
      }
    } else {
      // Show placeholder
      const placeholder = document.createElement('div');
      placeholder.className = 'bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center';
      
      const placeholderIcon = document.createElement('div');
      placeholderIcon.className = 'text-gray-400 dark:text-gray-500 mb-2';
      placeholderIcon.innerHTML = '<svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
      
      const placeholderText = document.createElement('p');
      placeholderText.className = 'text-gray-500 dark:text-gray-400 text-sm';
      placeholderText.textContent = 'Image not generated yet';
      
      placeholder.appendChild(placeholderIcon);
      placeholder.appendChild(placeholderText);
      imageContainer.appendChild(placeholder);
    }
    
    // Prompt display (collapsible)
    if (scene.prompt) {
      const promptContainer = document.createElement('details');
      promptContainer.className = 'mt-3';
      
      const promptSummary = document.createElement('summary');
      promptSummary.className = 'text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200';
      promptSummary.textContent = 'View image prompt';
      
      const promptText = document.createElement('p');
      promptText.className = 'text-xs text-gray-500 dark:text-gray-500 mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded';
      promptText.textContent = scene.prompt;
      
      promptContainer.appendChild(promptSummary);
      promptContainer.appendChild(promptText);
      
      sceneCard.appendChild(promptContainer);
    }
    
    // Assemble scene card
    sceneCard.appendChild(header);
    sceneCard.appendChild(sceneText);
    sceneCard.appendChild(imageContainer);
    
    container.appendChild(sceneCard);
  });
}

/**
 * Show "Generate Next" button for remaining images
 * @param {number} remainingCount - Number of remaining images to generate
 */
export function showGenerateNextButton(remainingCount) {
  // Find the main container
  const container = document.getElementById('generatedScenesContainer');
  
  if (!container) return;
  
  // Check if button already exists
  let btn = document.getElementById('generateNextBtn');
  
  if (!btn) {
    // Create button container
    btn = document.createElement('div');
    btn.id = 'generateNextBtn';
    btn.className = 'py-1 pr-5 text-right';
    
    const button = document.createElement('button');
    button.onclick = () => {
      if (window.generateRemainingImagesNew && typeof window.generateRemainingImagesNew === 'function') {
        window.generateRemainingImagesNew();
      } else if (window.generateRemainingImages && typeof window.generateRemainingImages === 'function') {
        window.generateRemainingImages();
      }
    };
    button.className = 'px-6 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-base rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] flex items-center gap-1 ml-auto';
    
    const buttonIcon = document.createElement('svg');
    buttonIcon.className = 'w-5 h-5';
    buttonIcon.setAttribute('fill', 'none');
    buttonIcon.setAttribute('stroke', 'currentColor');
    buttonIcon.setAttribute('viewBox', '0 0 24 24');
    buttonIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>';
    
    const buttonText = document.createTextNode(`Generate ${remainingCount} More Image${remainingCount > 1 ? 's' : ''}`);
    
    button.appendChild(buttonIcon);
    button.appendChild(buttonText);
    
    const helpText = document.createElement('p');
    helpText.className = 'text-sm text-gray-500 dark:text-gray-400 text-right mt-1';
    helpText.textContent = 'Click to generate all remaining images at once';
    
    btn.appendChild(button);
    btn.appendChild(helpText);
    
    // Append to the main container (after all scenes)
    container.appendChild(btn);
  } else {
    // Update existing button
    btn.classList.remove('hidden');
    const buttonEl = btn.querySelector('button');
    if (buttonEl) {
      const icon = buttonEl.querySelector('svg');
      const textNode = Array.from(buttonEl.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
      
      if (textNode) {
        textNode.textContent = `Generate ${remainingCount} More Image${remainingCount > 1 ? 's' : ''}`;
      } else {
        // Create new text node if it doesn't exist
        const newText = document.createTextNode(`Generate ${remainingCount} More Image${remainingCount > 1 ? 's' : ''}`);
        if (icon) {
          icon.parentNode.insertBefore(newText, icon.nextSibling);
        } else {
          buttonEl.appendChild(newText);
        }
      }
    }
  }
}

/**
 * Hide "Generate Next" button
 */
export function hideGenerateNextButton() {
  const btn = document.getElementById('generateNextBtn');
  if (btn) {
    btn.classList.add('hidden');
  }
}

/**
 * Open regenerate modal for a specific scene
 * @param {number} index - Scene index
 */
export function openRegenerateModal(index) {
  // Better error handling for regenerate
  const scenes = getGeneratedScenes();
  
  if (!scenes) {
    console.error('❌ No scenes available - generatedScenes is null/undefined');
    alert('⚠️ No scenes available. Please generate images first before trying to regenerate.');
    return;
  }
  
  if (index < 0 || index >= scenes.length) {
    console.error(`❌ Scene index ${index} out of bounds (array length: ${scenes.length})`);
    alert(`⚠️ Scene ${index + 1} not found. Available scenes: ${scenes.length}`);
    return;
  }
  
  const scene = scenes[index];
  if (!scene || typeof scene !== 'object') {
    console.error(`❌ Scene at index ${index} is null/undefined or not an object`);
    alert(`⚠️ Scene ${index + 1} data is missing. Please try regenerating all images.`);
    return;
  }
  
  // Store the index for regeneration
  if (typeof window !== 'undefined') {
    window.currentRegenerateIndex = index;
  }
  
  // Show the regenerate modal (if it exists in HTML)
  const modal = document.getElementById('regenerateModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  } else {
    // If modal doesn't exist, regenerate directly
    console.warn('⚠️ Regenerate modal not found, regenerating directly');
    regenerateScene(index);
  }
}

/**
 * Close regenerate modal
 */
export function closeRegenerateModal() {
  const modal = document.getElementById('regenerateModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

/**
 * Regenerate a single scene image
 * @param {number} index - Scene index
 */
export async function regenerateScene(index) {
  console.log('🔍 DEBUG regenerateScene called with index:', index);
  
  const scenes = getGeneratedScenes();
  
  if (!scenes) {
    console.error('❌ Cannot regenerate: generatedScenes array is null/undefined');
    alert('⚠️ No scenes available. Please generate images first before trying to regenerate.');
    return;
  }
  
  // Check if index is within bounds
  if (index < 0 || index >= scenes.length) {
    console.error(`❌ Cannot regenerate: Index ${index} out of bounds (array length: ${scenes.length})`);
    alert(`⚠️ Scene ${index + 1} not found. Available scenes: ${scenes.length}`);
    return;
  }
  
  const scene = scenes[index];
  if (!scene || typeof scene !== 'object') {
    console.error(`❌ Cannot regenerate: Scene at index ${index} is null/undefined or not an object`);
    alert(`⚠️ Scene ${index + 1} data is missing. Please try regenerating all images.`);
    return;
  }
  
  if (!scene.prompt) {
    console.error(`❌ Cannot regenerate: Scene at index ${index} has no prompt`);
    alert(`⚠️ Scene ${index + 1} has no prompt. Please try regenerating all images.`);
    return;
  }
  
  console.log(`🔄 Regenerating scene ${index + 1}/${scenes.length}...`);
  
  // Get settings from current project or use defaults
  const settings = (typeof window !== 'undefined' && window.currentProjectData?.settings) || { 
    aspectRatio: '16:9', 
    quality: 'better',
    style: getSelectedStyle() || { name: 'realistic' }
  };
  
  console.log('📊 Using settings for regeneration:', JSON.stringify(settings, null, 2));
  
  // Show loading state with spinner
  scene.imageUrl = null; // This will show the loading spinner
  scene.error = null; // Clear any previous errors
  setGeneratedScenes(scenes);
  
  // Update display
  if (window.displayGeneratedScenesNew && typeof window.displayGeneratedScenesNew === 'function') {
    window.displayGeneratedScenesNew(scenes);
  } else if (window.displayGeneratedScenes && typeof window.displayGeneratedScenes === 'function') {
    window.displayGeneratedScenes(scenes);
  }
  
  console.log(`🎨 Using prompt: ${scene.prompt}`);
  console.log(`📊 Quality: ${settings.quality}, Aspect: ${settings.aspectRatio}`);
  
  try {
    const imageUrl = await callIdeogramAPI(scene.prompt, settings);
    console.log(`✅ Scene ${index + 1} regenerated successfully`);
    
    // Update scene with new image
    scene.imageUrl = imageUrl;
    scene.error = null;
    setGeneratedScenes(scenes);
    
    // Update display
    if (window.displayGeneratedScenesNew && typeof window.displayGeneratedScenesNew === 'function') {
      window.displayGeneratedScenesNew(scenes);
    } else if (window.displayGeneratedScenes && typeof window.displayGeneratedScenes === 'function') {
      window.displayGeneratedScenes(scenes);
    }
    
    // Close modal if open
    closeRegenerateModal();
    
    // Show success message
    console.log(`✅ Scene ${index + 1} image regenerated successfully!`);
  } catch (error) {
    console.error(`❌ Error regenerating scene ${index + 1}:`, error);
    
    // Update scene with error state
    scene.imageUrl = 'error';
    scene.error = error.message || 'Failed to regenerate image';
    setGeneratedScenes(scenes);
    
    // Update display
    if (window.displayGeneratedScenesNew && typeof window.displayGeneratedScenesNew === 'function') {
      window.displayGeneratedScenesNew(scenes);
    } else if (window.displayGeneratedScenes && typeof window.displayGeneratedScenes === 'function') {
      window.displayGeneratedScenes(scenes);
    }
    
    // Show error message
    alert(`❌ Failed to regenerate scene ${index + 1}: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Download a scene image
 * @param {number} index - Scene index
 */
export async function downloadScene(index) {
  const scenes = getGeneratedScenes();
  
  if (!scenes || !scenes[index]) {
    console.error('❌ Cannot download: Scene not found');
    alert('⚠️ Scene not found. Please generate images first.');
    return;
  }
  
  const scene = scenes[index];
  
  if (!scene.imageUrl || scene.imageUrl === 'error') {
    console.error('❌ Cannot download: Scene has no valid image');
    alert('⚠️ No image available to download. Please generate or regenerate the image first.');
    return;
  }
  
  try {
    console.log(`📥 Downloading scene ${index + 1} image...`);
    
    // Use proxy URL for downloading
    const proxyUrl = getProxyImageUrl(scene.imageUrl);
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.download = `scene-${index + 1}-image.jpg`;
    link.target = '_blank';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`✅ Scene ${index + 1} image download initiated`);
  } catch (error) {
    console.error(`❌ Error downloading scene ${index + 1}:`, error);
    alert(`❌ Failed to download image: ${error.message || 'Unknown error'}`);
  }
}

/**
 * View scene detail (open in new tab or modal)
 * @param {number} index - Scene index
 */
export function viewSceneDetail(index) {
  const scenes = getGeneratedScenes();
  
  if (!scenes || !scenes[index]) {
    console.error('❌ Cannot view: Scene not found');
    alert('⚠️ Scene not found.');
    return;
  }
  
  const scene = scenes[index];
  
  if (!scene.imageUrl || scene.imageUrl === 'error') {
    console.error('❌ Cannot view: Scene has no valid image');
    alert('⚠️ No image available to view. Please generate or regenerate the image first.');
    return;
  }
  
  // Open image in new tab
  window.open(scene.imageUrl, '_blank');
}

/**
 * Toggle scene text visibility
 * @param {number} index - Scene index
 */
export function toggleSceneText(index) {
  const textContent = document.getElementById(`sceneTextContent${index}`);
  const toggleIcon = document.getElementById(`sceneTextIcon${index}`);
  const toggleText = document.getElementById(`sceneTextToggle${index}`);
  
  if (textContent && toggleIcon && toggleText) {
    if (textContent.classList.contains('hidden')) {
      // Show text
      textContent.classList.remove('hidden');
      toggleIcon.style.transform = 'rotate(180deg)';
      toggleText.textContent = 'Hide Scene Text';
    } else {
      // Hide text
      textContent.classList.add('hidden');
      toggleIcon.style.transform = 'rotate(0deg)';
      toggleText.textContent = 'Show Scene Text';
    }
  }
}

/**
 * Toggle first scene text visibility
 */
export function toggleFirstSceneText() {
  const textContent = document.getElementById('firstSceneTextContent');
  const toggleIcon = document.getElementById('firstSceneTextIcon');
  const toggleText = document.getElementById('firstSceneTextToggle');
  
  if (textContent && toggleIcon && toggleText) {
    if (textContent.classList.contains('hidden')) {
      // Show text
      textContent.classList.remove('hidden');
      toggleIcon.style.transform = 'rotate(180deg)';
      toggleText.textContent = 'Hide Scene Text';
    } else {
      // Hide text
      textContent.classList.add('hidden');
      toggleIcon.style.transform = 'rotate(0deg)';
      toggleText.textContent = 'Show Scene Text';
    }
  }
}

/**
 * Toggle script visibility
 */
export function toggleScriptVisibility() {
  const scriptContent = document.getElementById('scriptContentCollapse');
  const toggleIcon = document.getElementById('scriptToggleIcon');
  const toggleText = document.getElementById('scriptToggleText');
  
  if (scriptContent && toggleIcon && toggleText) {
    if (scriptContent.classList.contains('hidden')) {
      // Show script
      scriptContent.classList.remove('hidden');
      toggleIcon.style.transform = 'rotate(180deg)';
      toggleText.textContent = 'Hide Full Script';
    } else {
      // Hide script
      scriptContent.classList.add('hidden');
      toggleIcon.style.transform = 'rotate(0deg)';
      toggleText.textContent = 'Show Full Script';
    }
  }
}

/**
 * Initialize image modal (set up event listeners)
 */
export function initializeImageModal() {
  // Mark as initialized
  if (typeof window !== 'undefined') {
    window.imageModalInitialized = true;
  }
  
  // Set up credits estimate listeners
  const qualitySelect = document.getElementById('imageQuality');
  const countInput = document.getElementById('imageCount');
  const animateCheckbox = document.getElementById('imageAnimate');
  
  if (qualitySelect) {
    qualitySelect.addEventListener('change', updateImageCreditsEstimate);
  }
  
  if (countInput) {
    countInput.addEventListener('input', updateImageCreditsEstimate);
  }
  
  if (animateCheckbox) {
    animateCheckbox.addEventListener('change', updateImageCreditsEstimate);
  }
  
  // Initial estimate
  updateImageCreditsEstimate();
  
  // Expose functions globally for onclick handlers in HTML
  window.selectImageStyle = selectImageStyle;
  window.openRegenerateModal = openRegenerateModal;
  window.regenerateScene = regenerateScene;
  window.downloadScene = downloadScene;
  window.viewSceneDetail = viewSceneDetail;
  window.toggleSceneText = toggleSceneText;
  window.toggleFirstSceneText = toggleFirstSceneText;
  window.toggleScriptVisibility = toggleScriptVisibility;
}

