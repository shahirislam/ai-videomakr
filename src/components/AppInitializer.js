// =====================================================================
// App Initializer - Handles UI initialization and setup
// =====================================================================

import { appStorage, creditStorage } from '../utils/storage.js';

/**
 * Initialize the application UI
 * Sets up dropdowns, dark mode, form validation, and credit balance
 */
export function initializeUI() {
  console.log('🔧 Initializing UI...');

  // Initialize dark mode
  initializeDarkMode();

  // Setup dropdowns
  setupProfileDropdown();
  setupFeaturesDropdown();

  // Setup form validation (with retry logic)
  setupFormValidation();

  // Initialize credit balance
  initializeCreditBalance();

  console.log('✅ UI initialization complete');
  
  // Also expose globally for old app.js compatibility
  window.initializeUI = initializeUI;
}

/**
 * Initialize dark mode from localStorage
 */
function initializeDarkMode() {
  if (appStorage.getDarkMode()) {
    document.documentElement.classList.add('dark');
  }
  updateDarkIcon();
}

/**
 * Setup profile dropdown menu
 */
function setupProfileDropdown() {
  const profileBtn = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');

  if (!profileBtn || !profileDropdown) {
    console.warn('⚠️ Profile dropdown elements not found');
    return;
  }

  profileBtn.addEventListener('click', () => {
    profileDropdown.classList.toggle('hidden');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
      profileDropdown.classList.add('hidden');
    }
  });
}

/**
 * Setup features dropdown menu
 */
function setupFeaturesDropdown() {
  const featuresBtn = document.getElementById('featuresBtn');
  const featuresDropdown = document.getElementById('featuresDropdown');
  const profileDropdown = document.getElementById('profileDropdown');

  if (!featuresBtn || !featuresDropdown) {
    console.warn('⚠️ Features dropdown elements not found');
    return;
  }

  featuresBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    featuresDropdown.classList.toggle('hidden');
    // Close profile dropdown if open
    if (profileDropdown) {
      profileDropdown.classList.add('hidden');
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!featuresDropdown.contains(e.target) && !featuresBtn.contains(e.target)) {
      featuresDropdown.classList.add('hidden');
    }
  });
}

/**
 * Setup form validation (enable/disable generate button based on title input)
 */
function setupFormValidation() {
  console.log('🔧 [NEW CODE] Setting up form validation...');
  
  // Function to check and update button state
  const updateButtonState = () => {
    const videoTitleInput = document.getElementById('video-title');
    const generateBtn = document.getElementById('generate-btn');
    
    if (!videoTitleInput || !generateBtn) {
      return false;
    }
    
    const hasValue = videoTitleInput.value.trim() !== '';
    generateBtn.disabled = !hasValue;
    return true;
  };

  // Try to get elements immediately
  let videoTitleInput = document.getElementById('video-title');
  let generateBtn = document.getElementById('generate-btn');

  if (!videoTitleInput || !generateBtn) {
    console.warn('⚠️ Elements not found, retrying in 200ms...');
    console.warn('   video-title:', videoTitleInput);
    console.warn('   generate-btn:', generateBtn);
    // Retry after a short delay in case DOM isn't ready yet
    setTimeout(() => {
      setupFormValidation();
    }, 200);
    return;
  }

  console.log('✅ Found form elements, attaching listeners...');

  // Enable/disable generate button based on title input
  const handleInput = (event) => {
    const hasValue = videoTitleInput.value.trim() !== '';
    generateBtn.disabled = !hasValue;
    console.log('📝 Title input event:', event.type, '| Value:', videoTitleInput.value.substring(0, 30), '| Button enabled:', hasValue);
  };

  // Remove any existing listeners by cloning (clean approach)
  const newInput = videoTitleInput.cloneNode(true);
  videoTitleInput.parentNode.replaceChild(newInput, videoTitleInput);
  
  // Get fresh references after cloning
  videoTitleInput = document.getElementById('video-title');
  generateBtn = document.getElementById('generate-btn');

  // Attach multiple event listeners for better coverage
  videoTitleInput.addEventListener('input', handleInput);
  videoTitleInput.addEventListener('keyup', handleInput);
  videoTitleInput.addEventListener('keydown', handleInput);
  videoTitleInput.addEventListener('paste', () => {
    // Handle paste with a small delay to ensure value is updated
    setTimeout(() => handleInput({ type: 'paste' }), 50);
  });
  videoTitleInput.addEventListener('change', handleInput);

  // Also check on page load in case there's already text
  const initialValue = videoTitleInput.value.trim();
  generateBtn.disabled = initialValue === '';
  console.log('📝 Initial state - Value:', initialValue, '| Button disabled:', !initialValue);

  // Set up a periodic check as a fallback (in case events don't fire)
  let checkInterval = setInterval(() => {
    const videoTitleInput = document.getElementById('video-title');
    const generateBtn = document.getElementById('generate-btn');
    if (videoTitleInput && generateBtn) {
      const hasValue = videoTitleInput.value.trim() !== '';
      if (generateBtn.disabled === hasValue) {
        generateBtn.disabled = !hasValue;
        console.log('📝 Periodic check - Button state updated:', !hasValue);
      }
    }
  }, 1000);
  
  // Clear interval after 30 seconds (should be enough time for setup)
  setTimeout(() => {
    clearInterval(checkInterval);
    console.log('📝 Stopped periodic button state check');
  }, 30000);

  console.log('✅ Generate button listener attached successfully');
}

/**
 * Initialize credit balance from user data
 */
function initializeCreditBalance() {
  const creditBalanceEl = document.getElementById('creditBalance');
  if (!creditBalanceEl) {
    console.warn('⚠️ Credit balance element not found');
    return;
  }

  const currentUser = appStorage.getCurrentUser();
  if (!currentUser) {
    // Default balance if no user logged in
    creditBalanceEl.textContent = '198';
    return;
  }

  const userData = appStorage.getUserData(currentUser);
  const balance = (userData && userData.credits !== undefined) ? userData.credits : 198;
  creditStorage.setUiBalance(balance);
}

/**
 * Toggle dark mode
 */
export function toggleDarkMode() {
  const html = document.documentElement;
  html.classList.toggle('dark');
  const isDark = html.classList.contains('dark');
  appStorage.setDarkMode(isDark);
  updateDarkIcon();
}

/**
 * Update dark mode icon based on current state
 */
export function updateDarkIcon() {
  const icon = document.getElementById('darkIcon');
  if (!icon) return;

  const isDark = document.documentElement.classList.contains('dark');
  
  icon.innerHTML = isDark
    ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`;
}

