// =====================================================================
// Script Manager Component - Handles script display, copy, download, and word count
// =====================================================================

import { countWords } from '../utils/formatters.js';
import { scriptStore } from '../store/scriptStore.js';

/**
 * Enable or disable copy and download buttons
 * @param {boolean} enabled - Whether buttons should be enabled
 */
export function setCopyDownloadEnabled(enabled) {
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  
  [copyBtn, downloadBtn].forEach(btn => {
    if (!btn) return;
    btn.disabled = !enabled;
    btn.setAttribute('aria-disabled', String(!enabled));
  });
}

/**
 * Update script word count display
 */
export function updateScriptWordCount() {
  const scriptContent = document.getElementById('scriptContent');
  const wcDisplay = document.getElementById('wordCount');
  
  if (!scriptContent || !wcDisplay) return;
  
  const text = scriptContent.innerText || scriptContent.textContent || '';
  const wordCount = countWords(text);
  
  wcDisplay.textContent = wordCount;
  
  // Update store
  scriptStore.setScript(text);
}

/**
 * Copy script to clipboard
 * @returns {Promise<void>}
 */
export async function copyScript() {
  const scriptContent = document.getElementById('scriptContent');
  if (!scriptContent) {
    console.warn('Script content element not found');
    return;
  }
  
  const text = scriptContent.innerText || scriptContent.textContent || '';
  
  if (!text || text.trim() === '') {
    alert('No script to copy!');
    return;
  }
  
  try {
    // Copy to clipboard
    await navigator.clipboard.writeText(text);
    
    // Visual feedback
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
      const originalHTML = copyBtn.innerHTML;
      
      copyBtn.innerHTML = `
        <svg class="w-6 h-6 stroke-green-600 dark:stroke-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      
      setTimeout(() => {
        copyBtn.innerHTML = originalHTML;
      }, 2000);
    }
    
    console.log('✅ Script copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
    alert('Failed to copy script. Please try selecting and copying manually.');
  }
}

/**
 * Download script as text file
 */
export function downloadScript() {
  const scriptContent = document.getElementById('scriptContent');
  const videoTitleInput = document.getElementById('video-title');
  
  if (!scriptContent) {
    console.warn('Script content element not found');
    return;
  }
  
  const text = scriptContent.innerText || scriptContent.textContent || '';
  
  if (!text || text.trim() === '') {
    alert('No script to download!');
    return;
  }
  
  // Get video title for filename
  const videoTitle = videoTitleInput?.value?.trim() || 'script';
  const sanitizedTitle = videoTitle
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50) || 'script';
  
  // Create blob and download
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizedTitle}_script.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('✅ Script downloaded!');
}

/**
 * Update script content in the UI
 * @param {string} scriptText - The script text to display
 * @param {boolean} updateWordCount - Whether to update word count (default: true)
 */
export function updateScriptContent(scriptText, updateWordCount = true) {
  const scriptContent = document.getElementById('scriptContent');
  const scriptWrapper = document.getElementById('scriptWrapper');
  const scriptOutput = document.getElementById('scriptOutput');
  
  if (scriptContent) {
    scriptContent.textContent = scriptText;
  }
  
  if (scriptWrapper) {
    scriptWrapper.classList.remove('hidden');
  }
  
  if (scriptOutput) {
    scriptOutput.classList.remove('hidden');
  }
  
  if (updateWordCount) {
    updateScriptWordCount();
  }
  
  // Update store
  scriptStore.setScript(scriptText);
}

/**
 * Show script output area
 */
export function showScriptOutput() {
  const scriptWrapper = document.getElementById('scriptWrapper');
  const scriptOutput = document.getElementById('scriptOutput');
  
  if (scriptWrapper) {
    scriptWrapper.classList.remove('hidden');
  }
  
  if (scriptOutput) {
    scriptOutput.classList.remove('hidden');
    scriptOutput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Hide script output area
 */
export function hideScriptOutput() {
  const scriptWrapper = document.getElementById('scriptWrapper');
  
  if (scriptWrapper) {
    scriptWrapper.classList.add('hidden');
  }
}

/**
 * Initialize script manager (disable buttons on load)
 */
export function initializeScriptManager() {
  // Disable copy/download buttons on page load
  setCopyDownloadEnabled(false);
  
  // Set up word count display listener if needed
  const scriptContent = document.getElementById('scriptContent');
  if (scriptContent) {
    // Observer for automatic word count updates when script changes
    const observer = new MutationObserver(() => {
      updateScriptWordCount();
    });
    
    observer.observe(scriptContent, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
}

