// =====================================================================
// Text File Upload Handler - Handles .txt file uploads for scripts
// =====================================================================

import { setCopyDownloadEnabled } from './ScriptManager.js';
import { updateScriptWordCount } from './ScriptManager.js';

/**
 * Handle text file upload
 * @param {Event} event - File input change event
 */
export function handleTextFileUpload(event) {
  const file = event.target.files[0];
  
  if (!file) return;
  
  // Validate file type
  if (!file.name.endsWith('.txt')) {
    alert('Please upload only .txt files');
    event.target.value = ''; // Reset input
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const textContent = e.target.result;
    
    // Show the script wrapper if hidden
    const scriptWrapper = document.getElementById('scriptWrapper');
    if (scriptWrapper && scriptWrapper.classList.contains('hidden')) {
      scriptWrapper.classList.remove('hidden');
    }
    
    // Populate the script content (no word limit)
    const scriptContent = document.getElementById('scriptContent');
    if (scriptContent) {
      scriptContent.textContent = textContent;
    }
    
    // Update word count
    const wordCount = textContent.trim().split(/\s+/).filter(word => word.length > 0).length;
    updateScriptWordCount(wordCount);
    
    // Set isGenerating to false so voice icon becomes enabled
    if (typeof window !== 'undefined') {
      window.isGenerating = false;
    }
    
    // Enable copy and download buttons
    setCopyDownloadEnabled(true);
    
    // Enable voice and image icons
    if (typeof window.refreshVoiceIcon === 'function') {
      window.refreshVoiceIcon();
    }
    if (typeof window.refreshImageIcon === 'function') {
      window.refreshImageIcon();
    }
    
    // Scroll to the script output
    const scriptOutput = document.getElementById('scriptOutput');
    if (scriptOutput) {
      scriptOutput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    console.log('✅ Text file uploaded successfully - Word count:', wordCount);
  };
  
  reader.onerror = function() {
    alert('Error reading file. Please try again.');
    console.error('❌ Error reading file');
  };
  
  reader.readAsText(file);
  
  // Reset file input so same file can be uploaded again
  event.target.value = '';
}

/**
 * Initialize text file upload handler
 */
export function initializeTextFileUpload() {
  const txtFileInput = document.getElementById('txtFileInput');
  if (txtFileInput) {
    // Remove any existing listeners
    const newInput = txtFileInput.cloneNode(true);
    txtFileInput.parentNode.replaceChild(newInput, txtFileInput);
    
    // Get fresh reference
    const fileInput = document.getElementById('txtFileInput');
    
    // Attach event listener
    fileInput.addEventListener('change', handleTextFileUpload);
    
    console.log('✅ Text file upload handler initialized');
  } else {
    console.warn('⚠️ txtFileInput element not found');
  }
}

