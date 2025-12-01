// =====================================================================
// YouTube Integration Component - Handles YouTube OAuth and video upload
// =====================================================================

import { getYouTubeAuthUrl, getYouTubeStatus, disconnectYouTube as disconnectYouTubeAPI, uploadToYouTube as uploadToYouTubeAPI } from '../services/youtubeService.client.js';

// YouTube state
let youtubeSessionId = null;
let youtubeChannelInfo = null;

/**
 * Get YouTube session ID
 * @returns {string|null} Session ID
 */
export function getYouTubeSessionId() {
  return youtubeSessionId;
}

/**
 * Set YouTube session ID
 * @param {string|null} sessionId - Session ID
 */
export function setYouTubeSessionId(sessionId) {
  youtubeSessionId = sessionId;
}

/**
 * Get YouTube channel info
 * @returns {Object|null} Channel info
 */
export function getYouTubeChannelInfo() {
  return youtubeChannelInfo;
}

/**
 * Set YouTube channel info
 * @param {Object|null} info - Channel info
 */
export function setYouTubeChannelInfo(info) {
  youtubeChannelInfo = info;
}

/**
 * Connect YouTube account (OAuth flow)
 * @param {string} styleId - Style ID
 * @returns {Promise<void>}
 */
export async function connectYouTube(styleId) {
  console.log('🎥 Initiating YouTube OAuth connection for style:', styleId);
  
  try {
    // Get auth URL from backend
    const response = await getYouTubeAuthUrl();
    const { authUrl } = response;
    
    // Open OAuth popup
    const width = 600;
    const height = 700;
    const left = (screen.width / 2) - (width / 2);
    const top = (screen.height / 2) - (height / 2);
    
    const popup = window.open(
      authUrl,
      'youtube-oauth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    if (!popup) {
      alert('Please allow popups to connect your YouTube account');
      return;
    }
    
    // Listen for OAuth callback
    const messageListener = (event) => {
      if (event.data.type === 'youtube-oauth-success') {
        const { channelId, channelName, channelAvatar, subscribers, accessToken, refreshToken } = event.data;
        
        console.log('✅ YouTube connected:', channelName);
        
        // Update UI
        const connectBtn = document.getElementById(`youtubeConnectBtn-${styleId}`);
        const connectedDisplay = document.getElementById(`youtubeConnectedDisplay-${styleId}`);
        const avatarImg = document.getElementById(`youtubeChannelAvatar-${styleId}`);
        const nameEl = document.getElementById(`youtubeChannelName-${styleId}`);
        const subsEl = document.getElementById(`youtubeChannelSubs-${styleId}`);
        
        if (connectBtn) connectBtn.classList.add('hidden');
        if (connectedDisplay) connectedDisplay.classList.remove('hidden');
        if (avatarImg) avatarImg.src = channelAvatar;
        if (nameEl) nameEl.textContent = channelName;
        if (subsEl) subsEl.textContent = `${subscribers} subscribers`;
        
        // Update hidden inputs
        const connectedInput = document.getElementById(`youtubeConnected-${styleId}`);
        const channelIdInput = document.getElementById(`youtubeChannelId-${styleId}`);
        const accessTokenInput = document.getElementById(`youtubeAccessToken-${styleId}`);
        const refreshTokenInput = document.getElementById(`youtubeRefreshToken-${styleId}`);
        
        if (connectedInput) connectedInput.value = 'true';
        if (channelIdInput) channelIdInput.value = channelId;
        if (accessTokenInput) accessTokenInput.value = accessToken;
        if (refreshTokenInput) refreshTokenInput.value = refreshToken;
        
        // Store channel info
        setYouTubeChannelInfo({
          channelId,
          channelTitle: channelName,
          channelAvatar,
          subscribers
        });
        
        popup.close();
        window.removeEventListener('message', messageListener);
      }
    };
    
    window.addEventListener('message', messageListener);
    
    // Check if popup was closed
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ YouTube connection error:', error);
    alert('Failed to connect YouTube account: ' + (error.message || 'Unknown error'));
  }
}

/**
 * Disconnect YouTube account
 * @param {string} styleId - Style ID
 * @returns {Promise<void>}
 */
export async function disconnectYouTube(styleId) {
  console.log('🔌 Disconnecting YouTube for style:', styleId);
  
  try {
    const channelIdInput = document.getElementById(`youtubeChannelId-${styleId}`);
    const channelId = channelIdInput?.value;
    
    if (channelId) {
      await disconnectYouTubeAPI(channelId);
    }
    
    // Update UI
    const connectBtn = document.getElementById(`youtubeConnectBtn-${styleId}`);
    const connectedDisplay = document.getElementById(`youtubeConnectedDisplay-${styleId}`);
    
    if (connectBtn) connectBtn.classList.remove('hidden');
    if (connectedDisplay) connectedDisplay.classList.add('hidden');
    
    // Clear hidden inputs
    const connectedInput = document.getElementById(`youtubeConnected-${styleId}`);
    const channelIdInputEl = document.getElementById(`youtubeChannelId-${styleId}`);
    const accessTokenInput = document.getElementById(`youtubeAccessToken-${styleId}`);
    const refreshTokenInput = document.getElementById(`youtubeRefreshToken-${styleId}`);
    
    if (connectedInput) connectedInput.value = '';
    if (channelIdInputEl) channelIdInputEl.value = '';
    if (accessTokenInput) accessTokenInput.value = '';
    if (refreshTokenInput) refreshTokenInput.value = '';
    
    // Clear channel info
    setYouTubeChannelInfo(null);
    
    console.log('✅ YouTube disconnected');
  } catch (error) {
    console.error('❌ YouTube disconnection error:', error);
    alert('Failed to disconnect YouTube account: ' + (error.message || 'Unknown error'));
  }
}

/**
 * Open YouTube upload modal
 * @param {string} sessionId - Video session ID
 * @param {Object} style - Style object with YouTube connection info
 */
export function openYouTubeUpload(sessionId, style = null) {
  setYouTubeSessionId(sessionId);
  
  // Get current style if not provided
  if (!style) {
    try {
      const styles = JSON.parse(localStorage.getItem('styles') || '[]');
      const currentStyleIdx = parseInt(localStorage.getItem('currentStyleIdx') || '0');
      style = styles[currentStyleIdx];
    } catch (error) {
      console.error('Error getting style:', error);
    }
  }
  
  if (!style || !style.youtubeConnected) {
    showYouTubeConnectionRequired();
    return;
  }
  
  showYouTubeUploadModal(style);
}

/**
 * Show YouTube connection required modal
 */
export function showYouTubeConnectionRequired() {
  const modal = document.getElementById('youtubeConnectionRequiredModal');
  if (!modal) {
    createYouTubeConnectionRequiredModal();
  }
  
  const createdModal = document.getElementById('youtubeConnectionRequiredModal');
  if (createdModal) {
    createdModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Create YouTube connection required modal
 */
function createYouTubeConnectionRequiredModal() {
  const modalHTML = `
    <div id="youtubeConnectionRequiredModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 hidden">
      <div class="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">YouTube Connection Required</h3>
            <button onclick="closeYouTubeConnectionRequiredModal()" 
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="p-6">
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            You need to connect your YouTube account before uploading videos. Please go to Settings and connect your YouTube channel.
          </p>
          <div class="flex gap-3">
            <button onclick="closeYouTubeConnectionRequiredModal()" 
                    class="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium rounded-lg transition">
              Close
            </button>
            <button onclick="window.location.href='#settings'" 
                    class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition">
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Close YouTube connection required modal
 */
export function closeYouTubeConnectionRequiredModal() {
  const modal = document.getElementById('youtubeConnectionRequiredModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
}

/**
 * Show YouTube upload modal
 * @param {Object} style - Style object with YouTube connection info
 */
export function showYouTubeUploadModal(style) {
  const modal = document.getElementById('youtubeUploadModal');
  if (!modal) {
    createYouTubeUploadModal();
  }
  
  const createdModal = document.getElementById('youtubeUploadModal');
  if (!createdModal) return;
  
  // Update channel name
  const channelNameEl = document.getElementById('youtubeChannelName');
  if (channelNameEl && youtubeChannelInfo) {
    channelNameEl.textContent = `Channel: ${youtubeChannelInfo.channelTitle}`;
  }
  
  // Show modal
  createdModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/**
 * Create YouTube upload modal
 */
function createYouTubeUploadModal() {
  const modalHTML = `
    <div id="youtubeUploadModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 hidden">
      <div class="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <svg class="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Upload to YouTube</h3>
                <p id="youtubeChannelName" class="text-sm text-gray-600 dark:text-gray-400">Channel: Not connected</p>
              </div>
            </div>
            <button onclick="closeYouTubeModal()" 
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <form id="youtubeUploadForm" onsubmit="uploadToYouTube(event)" class="p-6">
          <div class="space-y-4">
            <!-- Title -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Video Title <span class="text-red-500">*</span>
                <span class="text-xs text-gray-500 ml-2" id="titleCharCount">0</span>/100
              </label>
              <input type="text" 
                     id="youtubeTitle" 
                     name="title" 
                     required 
                     maxlength="100"
                     class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                     placeholder="Enter video title">
            </div>
            
            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
                <span class="text-xs text-gray-500 ml-2" id="descCharCount">0</span>/5000
              </label>
              <textarea id="youtubeDescription" 
                        name="description" 
                        rows="4" 
                        maxlength="5000"
                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Enter video description"></textarea>
            </div>
            
            <!-- Tags -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input type="text" 
                     id="youtubeTags" 
                     name="tags"
                     class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                     placeholder="tag1, tag2, tag3">
            </div>
            
            <!-- Privacy -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Privacy Status
              </label>
              <select id="youtubePrivacy" 
                      name="privacy"
                      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent">
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>
          
          <!-- Upload Button -->
          <div class="mt-6">
            <button type="submit" 
                    id="youtubeUploadBtn"
                    class="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all">
              Upload to YouTube
            </button>
          </div>
          
          <!-- Upload Progress -->
          <div id="youtubeUploadProgress" class="hidden mt-4">
            <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div id="youtubeProgressBar" class="bg-red-600 h-full transition-all duration-300" style="width: 0%"></div>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center" id="youtubeProgressText">
              Uploading...
            </p>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add character counters
  const titleInput = document.getElementById('youtubeTitle');
  const descInput = document.getElementById('youtubeDescription');
  const titleCount = document.getElementById('titleCharCount');
  const descCount = document.getElementById('descCharCount');
  
  if (titleInput && titleCount) {
    titleInput.addEventListener('input', (e) => {
      titleCount.textContent = e.target.value.length;
    });
  }
  
  if (descInput && descCount) {
    descInput.addEventListener('input', (e) => {
      descCount.textContent = e.target.value.length;
    });
  }
}

/**
 * Close YouTube upload modal
 */
export function closeYouTubeModal() {
  const modal = document.getElementById('youtubeUploadModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
}

/**
 * Upload video to YouTube
 * @param {Event} event - Form submit event
 * @returns {Promise<void>}
 */
export async function uploadToYouTube(event) {
  event.preventDefault();
  
  // Get current style
  const styles = JSON.parse(localStorage.getItem('styles') || '[]');
  const currentStyleIdx = parseInt(localStorage.getItem('currentStyleIdx') || '0');
  const currentStyle = styles[currentStyleIdx];
  
  if (!currentStyle || !currentStyle.youtubeConnected) {
    alert('YouTube account not connected. Please connect your account in Settings.');
    return;
  }
  
  // Get form data
  const title = document.getElementById('youtubeTitle')?.value?.trim();
  const description = document.getElementById('youtubeDescription')?.value?.trim() || '';
  const tags = document.getElementById('youtubeTags')?.value?.trim() || '';
  const privacy = document.getElementById('youtubePrivacy')?.value || 'private';
  
  if (!title) {
    alert('Please enter a video title');
    return;
  }
  
  // Get UI elements
  const btn = document.getElementById('youtubeUploadBtn');
  const progress = document.getElementById('youtubeUploadProgress');
  const progressBar = document.getElementById('youtubeProgressBar');
  const progressText = document.getElementById('youtubeProgressText');
  
  if (!btn || !progress || !progressBar || !progressText) {
    console.error('YouTube upload UI elements not found');
    return;
  }
  
  btn.disabled = true;
  btn.textContent = 'Uploading...';
  progress.classList.remove('hidden');
  progressBar.style.width = '20%';
  progressText.textContent = 'Preparing upload...';
  
  try {
    const response = await uploadToYouTubeAPI(
      currentStyle.youtubeChannelId,
      getYouTubeSessionId(),
      title,
      description,
      tags,
      privacy
    );
    
    progressBar.style.width = '80%';
    progressText.textContent = 'Uploading to YouTube...';
    
    if (!response.success) {
      throw new Error(response.message || 'Upload failed');
    }
    
    progressBar.style.width = '100%';
    progressText.textContent = '✅ Upload complete!';
    
    console.log('✅ Video uploaded to YouTube!');
    console.log('   Video URL:', response.videoUrl);
    
    // Show success message with link
    alert(`✅ Video uploaded successfully to YouTube!\n\nVideo URL: ${response.videoUrl}`);
    
    // Open video in new tab
    if (response.videoUrl) {
      window.open(response.videoUrl, '_blank');
    }
    
    // Close modal after delay
    setTimeout(() => {
      closeYouTubeModal();
    }, 1500);
    
  } catch (error) {
    console.error('❌ YouTube upload error:', error);
    alert('❌ Upload failed: ' + (error.message || 'Unknown error'));
    
    progressBar.style.width = '0%';
    progress.classList.add('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Upload to YouTube';
  }
}

/**
 * Check YouTube authentication status
 * @returns {Promise<void>}
 */
export async function checkYouTubeAuth() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('youtube_success');
    const error = urlParams.get('youtube_error');
    const channel = urlParams.get('channel');
    const channelId = urlParams.get('channelId');
    
    if (success === 'true' && channel && channelId) {
      // OAuth success - send message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'youtube-oauth-success',
          channelId: channelId,
          channelName: decodeURIComponent(channel),
          channelAvatar: '',
          subscribers: '0',
          accessToken: '',
          refreshToken: ''
        }, window.location.origin);
        
        // Close popup
        window.close();
      }
    } else if (error) {
      console.error('YouTube OAuth error:', error);
      alert('Failed to connect YouTube account. Please try again.');
      if (window.opener) {
        window.close();
      }
    }
  } catch (error) {
    console.error('Error checking YouTube auth:', error);
  }
}

/**
 * Check YouTube connection status
 * @param {string} channelId - Channel ID
 * @returns {Promise<Object|null>} Connection status
 */
export async function checkYouTubeConnection(channelId) {
  if (!channelId) return null;
  
  try {
    const status = await getYouTubeStatus(channelId);
    if (status.connected) {
      setYouTubeChannelInfo({
        channelId: status.channelId,
        channelTitle: status.channelTitle,
        channelAvatar: status.channelAvatar || '',
        subscribers: status.subscribers || '0'
      });
      return status;
    }
    return null;
  } catch (error) {
    console.error('Error checking YouTube connection:', error);
    return null;
  }
}

/**
 * Initialize YouTube integration (set up event listeners)
 */
export function initializeYouTubeIntegration() {
  // Expose functions globally for onclick handlers in HTML
  window.connectYouTube = connectYouTube;
  window.disconnectYouTube = disconnectYouTube;
  window.openYouTubeUpload = (sessionId) => openYouTubeUpload(sessionId);
  window.closeYouTubeModal = closeYouTubeModal;
  window.uploadToYouTube = uploadToYouTube;
  window.showYouTubeConnectionRequired = showYouTubeConnectionRequired;
  window.closeYouTubeConnectionRequiredModal = closeYouTubeConnectionRequiredModal;
  
  // Check for OAuth callback
  checkYouTubeAuth();
}

