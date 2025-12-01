// =====================================================================
// Modals Component - Handles context and word count modals
// =====================================================================

import { appStorage } from '../utils/storage.js';
import { DEFAULTS } from '../utils/constants.js';

/**
 * Show word count modal
 */
export function showWordCountModal() {
  const modal = document.getElementById('word-count-modal');
  const overlay = document.getElementById('modal-overlay');
  
  if (!modal || !overlay) {
    console.warn('Word count modal elements not found');
    return;
  }
  
  const currentCount = document.getElementById('mainWordCount')?.value || DEFAULTS.DEFAULT_WORD_COUNT.toString();
  const input = document.getElementById('word-count-input');
  
  if (input) {
    input.value = currentCount;
    input.focus();
    input.select();
    input.addEventListener('input', liveUpdateWordCount);
  }
  
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
}

/**
 * Hide word count modal
 */
export function hideWordCountModal() {
  const modal = document.getElementById('word-count-modal');
  const overlay = document.getElementById('modal-overlay');
  const input = document.getElementById('word-count-input');
  
  if (modal) {
    modal.classList.add('hidden');
  }
  
  if (overlay) {
    overlay.classList.add('hidden');
  }
  
  if (input) {
    input.removeEventListener('input', liveUpdateWordCount);
  }
}

/**
 * Save word count from modal
 */
export function saveWordCount() {
  const input = document.getElementById('word-count-input');
  if (!input) return;
  
  let val = parseInt(input.value, 10);
  
  // Validate and enforce limits
  if (isNaN(val) || val < 1) {
    alert('Please enter a valid word count (minimum 1 word).');
    return;
  }
  
  if (val > DEFAULTS.MAX_WORDS) {
    val = DEFAULTS.MAX_WORDS;
    input.value = DEFAULTS.MAX_WORDS;
    alert(`Maximum word count is ${DEFAULTS.MAX_WORDS} words.`);
  }
  
  // Update UI elements
  const mainWordCount = document.getElementById('mainWordCount');
  const countText = document.getElementById('count-text');
  
  if (mainWordCount) {
    mainWordCount.value = val;
  }
  
  if (countText) {
    countText.textContent = val;
  }
  
  // Trigger input event to update estimate
  if (mainWordCount) {
    mainWordCount.dispatchEvent(new Event('input'));
  }
  
  // Save to storage
  appStorage.setWordCount(val);
  
  // Close modal
  hideWordCountModal();
  
  console.log(`✅ Word count set to ${val}`);
}

/**
 * Live update word count in modal (with validation)
 */
export function liveUpdateWordCount(e) {
  if (!e || !e.target) return;
  
  let val = parseInt(e.target.value, 10);
  
  // Enforce 8000 word maximum
  if (val > DEFAULTS.MAX_WORDS) {
    val = DEFAULTS.MAX_WORDS;
    e.target.value = DEFAULTS.MAX_WORDS;
    alert(`Maximum word count is ${DEFAULTS.MAX_WORDS} words.`);
  }
  
  // Update display if valid
  if (val && val > 0) {
    const mainWordCount = document.getElementById('mainWordCount');
    const countText = document.getElementById('count-text');
    
    if (mainWordCount) {
      mainWordCount.value = val;
    }
    
    if (countText) {
      countText.textContent = val;
    }
    
    // Trigger input event to update estimate
    if (mainWordCount) {
      mainWordCount.dispatchEvent(new Event('input'));
    }
  }
}

/**
 * Show context modal
 */
export function showContextModal() {
  const modal = document.getElementById('context-modal');
  const overlay = document.getElementById('context-modal-overlay');
  
  if (!modal || !overlay) {
    console.warn('Context modal elements not found');
    return;
  }
  
  const textarea = document.getElementById('additional-context-input');
  const hiddenInput = document.getElementById('additionalContextHidden');
  
  // Load existing context if available
  if (textarea && hiddenInput) {
    const existingContext = hiddenInput.value || appStorage.getAdditionalContext() || '';
    textarea.value = existingContext;
    textarea.focus();
  }
  
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
}

/**
 * Hide context modal
 */
export function hideContextModal() {
  const modal = document.getElementById('context-modal');
  const overlay = document.getElementById('context-modal-overlay');
  
  if (modal) {
    modal.classList.add('hidden');
  }
  
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

/**
 * Save additional context from modal
 */
export function saveAdditionalContext() {
  const input = document.getElementById('additional-context-input');
  const hiddenInput = document.getElementById('additionalContextHidden');
  const icon = document.getElementById('icon');
  
  if (!input) return;
  
  const context = input.value.trim();
  
  // Update hidden input
  if (hiddenInput) {
    hiddenInput.value = context;
  }
  
  // Update global variable for backward compatibility
  if (typeof window !== 'undefined') {
    window.additionalContext = context;
  }
  
  // Save to storage
  appStorage.setAdditionalContext(context);
  
  // Visual feedback on icon
  if (icon) {
    if (context) {
      icon.classList.add('text-blue-600', 'dark:text-blue-400');
      icon.classList.remove('text-gray-800', 'dark:text-gray-200');
    } else {
      icon.classList.remove('text-blue-600', 'dark:text-blue-400');
      icon.classList.add('text-gray-800', 'dark:text-gray-200');
    }
  }
  
  // Close modal
  hideContextModal();
  
  console.log('✅ Additional context saved');
}

/**
 * Handle icon click (opens word count modal)
 */
export function handleIconClick() {
  showWordCountModal();
}

/**
 * Initialize modals (set up event listeners)
 */
export function initializeModals() {
  // Mark as initialized
  if (typeof window !== 'undefined') {
    window.modalsInitialized = true;
  }
  
  // Word count modal overlay click handler
  const wordCountOverlay = document.getElementById('modal-overlay');
  if (wordCountOverlay && !wordCountOverlay.hasAttribute('data-listener-added')) {
    wordCountOverlay.addEventListener('click', hideWordCountModal);
    wordCountOverlay.setAttribute('data-listener-added', 'true');
  }
  
  // Word count modal click handler (prevent closing when clicking inside)
  const wordCountModal = document.getElementById('word-count-modal');
  if (wordCountModal && !wordCountModal.hasAttribute('data-listener-added')) {
    wordCountModal.addEventListener('click', (e) => e.stopPropagation());
    wordCountModal.setAttribute('data-listener-added', 'true');
  }
  
  // Context modal overlay click handler
  const contextOverlay = document.getElementById('context-modal-overlay');
  if (contextOverlay && !contextOverlay.hasAttribute('data-listener-added')) {
    contextOverlay.addEventListener('click', hideContextModal);
    contextOverlay.setAttribute('data-listener-added', 'true');
  }
  
  // Context modal click handler (prevent closing when clicking inside)
  const contextModal = document.getElementById('context-modal');
  if (contextModal && !contextModal.hasAttribute('data-listener-added')) {
    contextModal.addEventListener('click', (e) => e.stopPropagation());
    contextModal.setAttribute('data-listener-added', 'true');
  }
  
  // Set up word count modal save button
  const wordCountInput = document.getElementById('word-count-input');
  if (wordCountInput) {
    // Add Enter key handler to save
    wordCountInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveWordCount();
      }
    });
  }
  
  // Load saved word count on page load
  const savedWordCount = appStorage.getWordCount();
  const mainWordCount = document.getElementById('mainWordCount');
  const countText = document.getElementById('count-text');
  
  if (mainWordCount && savedWordCount) {
    mainWordCount.value = savedWordCount;
  }
  
  if (countText && savedWordCount) {
    countText.textContent = savedWordCount;
  }
  
  // Load saved context on page load
  const savedContext = appStorage.getAdditionalContext();
  const hiddenInput = document.getElementById('additionalContextHidden');
  
  if (hiddenInput && savedContext) {
    hiddenInput.value = savedContext;
    if (typeof window !== 'undefined') {
      window.additionalContext = savedContext;
    }
    
    // Update icon color if context exists
    const icon = document.getElementById('icon');
    if (icon && savedContext) {
      icon.classList.add('text-blue-600', 'dark:text-blue-400');
      icon.classList.remove('text-gray-800', 'dark:text-gray-200');
    }
  }
}

