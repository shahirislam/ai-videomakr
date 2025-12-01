// =====================================================================
// Video Renderer Component - Handles video rendering and video library
// =====================================================================

import { checkFFmpegStatus, renderVideos as callRenderVideos, getDownloadUrl, getDownloadAllUrl } from '../services/videoService.js';
import { appStorage } from '../utils/storage.js';
import { getProxyImageUrl } from '../services/imageService.js';

// Video library storage key
const VIDEO_LIBRARY_KEY = 'videoLibrary';

/**
 * Get video library from localStorage
 * @returns {Array} Array of video objects
 */
export function getVideoLibrary() {
  try {
    const stored = localStorage.getItem(VIDEO_LIBRARY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading video library:', error);
    return [];
  }
}

/**
 * Save video to library
 * @param {Object} videoData - Video data object
 */
export function saveVideoToLibrary(videoData) {
  try {
    const library = getVideoLibrary();
    library.push(videoData);
    localStorage.setItem(VIDEO_LIBRARY_KEY, JSON.stringify(library));
    console.log('✅ Video saved to library:', videoData.title);
  } catch (error) {
    console.error('Error saving video to library:', error);
  }
}

/**
 * Delete video from library
 * @param {number} index - Video index
 */
export function deleteVideoFromLibrary(index) {
  if (!confirm('Are you sure you want to delete this video from your library?')) {
    return;
  }
  
  const library = getVideoLibrary();
  library.splice(index, 1);
  localStorage.setItem(VIDEO_LIBRARY_KEY, JSON.stringify(library));
  
  // Re-render library if function exists
  if (window.renderVideoLibraryNew && typeof window.renderVideoLibraryNew === 'function') {
    window.renderVideoLibraryNew(library);
  } else if (window.renderVideoLibrary && typeof window.renderVideoLibrary === 'function') {
    window.renderVideoLibrary(library);
  }
  
  // Update library count if function exists
  if (window.updateLibraryCount && typeof window.updateLibraryCount === 'function') {
    window.updateLibraryCount();
  }
}

/**
 * Render video library (display videos in UI)
 * @param {Array} library - Video library array (optional, will fetch if not provided)
 */
export function renderVideoLibrary(library = null) {
  const contentEl = document.getElementById('libraryContent');
  if (!contentEl) {
    console.warn('Library content element not found');
    return;
  }
  
  if (!library) {
    library = getVideoLibrary();
  }
  
  if (library.length === 0) {
    contentEl.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <svg class="w-24 h-24 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
        </svg>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">No videos yet</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Generate your first video to see it here</p>
        <button onclick="closeVideoLibrary()" 
                class="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition">
          Create Video
        </button>
      </div>
    `;
    return;
  }
  
  const videosHTML = library.map((video, index) => `
    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 transition">
      <div class="flex items-start gap-6">
        <!-- Video Player Thumbnail -->
        <div class="flex-shrink-0">
          ${video.videoUrl ? `
            <video class="w-48 h-28 rounded-lg object-cover cursor-pointer" 
                   onclick="playVideoInLibrary('${video.videoUrl}')"
                   poster="">
              <source src="${video.videoUrl}" type="video/mp4">
            </video>
          ` : `
            <div class="w-48 h-28 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center cursor-pointer"
                 onclick="playVideoInLibrary('${video.videoUrl}')">
              <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          `}
        </div>
        
        <!-- Video Info -->
        <div class="flex-1 min-w-0">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">${video.title}</h3>
          <div class="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <span>📅 ${new Date(video.createdAt).toLocaleDateString()} ${new Date(video.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
          </div>
          
          <!-- Actions -->
          <div class="flex flex-wrap gap-2">
            ${video.videoUrl ? `
              <a href="${video.videoUrl}" download class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition inline-flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Download
              </a>
            ` : ''}
            
            <button onclick="openUploadWithStyleSelection(${index})" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition inline-flex items-center gap-2">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Upload to YouTube
            </button>
            
            <button onclick="deleteVideoFromLibrary(${index})" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium rounded-lg transition inline-flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
  
  contentEl.innerHTML = `
    <div class="space-y-4">
      ${videosHTML}
    </div>
  `;
}

/**
 * Play video in library (opens modal)
 * @param {string} videoUrl - Video URL
 */
export function playVideoInLibrary(videoUrl) {
  if (!videoUrl) {
    alert('Video URL not available');
    return;
  }
  
  // Create video player modal
  const modalHTML = `
    <div id="videoPlayerModal" class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div class="relative w-full max-w-4xl">
        <button onclick="closeVideoPlayer()" 
                class="absolute -top-12 right-0 text-white hover:text-gray-300 transition">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <video class="w-full rounded-lg" controls autoplay>
          <source src="${videoUrl}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  `;
  
  // Remove existing modal if any
  const existingModal = document.getElementById('videoPlayerModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Close video player modal
 */
export function closeVideoPlayer() {
  const modal = document.getElementById('videoPlayerModal');
  if (modal) {
    modal.remove();
  }
}

/**
 * Render videos with FFmpeg (automatic MP4 generation)
 * @param {Object} projectData - Current project data with scenes, title, etc.
 * @returns {Promise<Object>} Render result data
 */
export async function renderVideos(projectData) {
  if (!projectData || !projectData.scenes) {
    throw new Error('No media to render! Please generate images first.');
  }
  
  // Validate all scenes have images
  const missingImages = projectData.scenes.filter(s => !s.imageUrl || s.imageUrl === 'error');
  if (missingImages.length > 0) {
    throw new Error(`Cannot render videos: ${missingImages.length} scene(s) are missing images. Please regenerate missing images first.`);
  }
  
  // Step 1: Check if FFmpeg is available on server
  const statusData = await checkFFmpegStatus();
  
  if (!statusData.installed) {
    // FFmpeg not available - offer manual download
    const userChoice = confirm(
      '⚠️ Automatic Video Rendering Not Available\n\n' +
      'FFmpeg is not installed on the server. You have two options:\n\n' +
      '1. Click OK to download images + audio + instructions for manual editing\n' +
      '2. Click Cancel and contact support to enable automatic rendering\n\n' +
      'Would you like to download the manual rendering package?'
    );
    
    if (userChoice) {
      await renderVideosManual(projectData);
      return null; // Manual rendering doesn't return render data
    }
    throw new Error('FFmpeg not available and user cancelled manual rendering');
  }
  
  // Step 2: Prepare render request
  console.log('🎬 Sending render request to server...');
  console.log('   Scenes:', projectData.scenes.length);
  
  // Validate all scene image URLs before sending
  console.log('🔍 Validating scene image URLs...');
  for (let i = 0; i < projectData.scenes.length; i++) {
    const scene = projectData.scenes[i];
    console.log(`   Scene ${i + 1}: imageUrl = ${scene.imageUrl ? scene.imageUrl.substring(0, 60) + '...' : 'MISSING'}`);
    
    if (!scene.imageUrl || scene.imageUrl === 'error' || scene.imageUrl === '') {
      throw new Error(`Scene ${i + 1} is missing a valid image URL. Please regenerate that scene's image.`);
    }
    
    if (!scene.imageUrl.startsWith('http://') && !scene.imageUrl.startsWith('https://')) {
      throw new Error(`Scene ${i + 1} has invalid image URL: ${scene.imageUrl.substring(0, 50)}`);
    }
  }
  console.log('✅ All scene images validated');
  
  // Get transition settings from storage
  const transitionType = appStorage.getTransitionType() || 'fade';
  const transitionDuration = appStorage.getTransitionDuration() || 0.5;
  const enableTransitions = appStorage.getEnableTransitions();
  const renderFullVideo = enableTransitions; // Use transition checkbox state for full video
  
  console.log('🎬 Transition settings:', { type: transitionType, duration: transitionDuration });
  console.log('🎬 Render full merged video:', renderFullVideo ? '✅ YES' : '❌ NO (individual scenes only)');
  
  // Get audio URL (from global state or window)
  const audioUrl = (window.getGeneratedAudioUrlNew && typeof window.getGeneratedAudioUrlNew === 'function') 
    ? window.getGeneratedAudioUrlNew() 
    : (window.generatedAudioUrl || null);
  
  // Prepare scenes data
  const scenesData = projectData.scenes.map(s => ({
    number: s.number,
    imageUrl: s.imageUrl,
    startTime: s.startTime,
    endTime: s.endTime,
    startSeconds: s.startSeconds,
    endSeconds: s.endSeconds,
    duration: (s.endSeconds - s.startSeconds).toFixed(3),
    text: s.text || '' // Include scene text for script.txt
  }));
  
  // Call render API
  const renderData = await callRenderVideos(
    scenesData,
    audioUrl,
    projectData.title,
    {
      type: transitionType,
      duration: transitionDuration
    },
    renderFullVideo,
    null // captions (can be added later)
  );
  
  if (!renderData.success) {
    throw new Error(renderData.message || 'Rendering failed');
  }
  
  console.log('✅ Videos rendered successfully!');
  console.log('   Session ID:', renderData.sessionId);
  
  return renderData;
}

/**
 * Render videos manually (fallback when FFmpeg not available)
 * @param {Object} projectData - Current project data
 */
export async function renderVideosManual(projectData) {
  // Load JSZip library if needed
  if (typeof JSZip === 'undefined') {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  }
  
  const zip = new JSZip();
  
  // Create folder name from first 3 words of title
  const titleWords = projectData.title.trim().split(/\s+/);
  const folderName = titleWords.slice(0, 3).join('_').replace(/[^a-z0-9_]/gi, '').toLowerCase() || 'story';
  const folder = zip.folder(folderName + '_manual_render');
  
  // Add all media
  folder.file('script.txt', projectData.script);
  folder.file('timestamps.txt', projectData.scenes.map(s => 
    `Scene ${s.number}: ${s.startTime} - ${s.endTime} (Duration: ${(s.endSeconds - s.startSeconds).toFixed(2)}s)`
  ).join('\n'));
  
  // Add images
  const imagesFolder = folder.folder('images');
  let successCount = 0;
  let failCount = 0;
  
  for (const scene of projectData.scenes) {
    if (scene.imageUrl && scene.imageUrl !== 'error') {
      try {
        const proxyUrl = getProxyImageUrl(scene.imageUrl);
        const response = await fetch(proxyUrl);
        
        if (!response.ok) throw new Error('Fetch failed');
        
        const imageBlob = await response.blob();
        imagesFolder.file(`scene_${String(scene.number).padStart(3, '0')}.jpg`, imageBlob);
        successCount++;
      } catch (error) {
        console.warn(`Failed to download scene ${scene.number} image:`, error);
        failCount++;
        imagesFolder.file(`scene_${String(scene.number).padStart(3, '0')}_URL.txt`, 
          `Image URL:\n${scene.imageUrl}`);
      }
    }
  }
  
  // Add rendering guide
  const videosFolder = folder.folder('videos');
  let renderGuide = '═══════════════════════════════════════════════════════\n';
  renderGuide += '   MANUAL VIDEO RENDERING INSTRUCTIONS\n';
  renderGuide += '═══════════════════════════════════════════════════════\n\n';
  renderGuide += 'Use CapCut, DaVinci Resolve, or Adobe Premiere:\n\n';
  
  projectData.scenes.forEach(s => {
    const duration = (s.endSeconds - s.startSeconds).toFixed(2);
    renderGuide += `Scene ${s.number}: ${duration}s (${s.startTime} - ${s.endTime})\n`;
  });
  
  videosFolder.file('RENDERING_GUIDE.txt', renderGuide);
  
  // Add audio
  const audioUrl = getGeneratedAudioUrl();
  if (audioUrl) {
    try {
      const audioBlob = await fetch(audioUrl).then(r => r.blob());
      folder.file(folderName + '_voiceover.mp3', audioBlob);
    } catch (error) {
      console.warn('Failed to download audio:', error);
      folder.file('audio_URL.txt', `Audio URL:\n${audioUrl}`);
    }
  }
  
  // Generate and download
  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = folderName + '_manual_render.zip';
  link.click();
  URL.revokeObjectURL(link.href);
  
  alert('✅ Manual Render Package Downloaded!\n\nFollow the instructions in RENDERING_GUIDE.txt');
}

/**
 * Load external script dynamically
 * @param {string} src - Script source URL
 * @returns {Promise<void>}
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Show video download modal with render results
 * @param {Object} renderData - Render result data
 * @param {Object} projectData - Project data
 */
export function showVideoDownloadModal(renderData, projectData) {
  // Build full video section conditionally
  const fullVideoSection = renderData.renderFullVideo && renderData.finalVideo ? `
    <div class="mb-6 p-4 bg-gradient-to-r from-[#5B7FFF]/5 to-[#5B7FFF]/10 dark:from-gray-700 dark:to-gray-600 rounded-lg border-2 border-[#5B7FFF]/20 dark:border-[#5B7FFF]/30">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg class="w-8 h-8 text-[#5B7FFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <div>
              <h4 class="font-bold text-lg text-gray-900 dark:text-white mb-1">Complete Video (with Audio)</h4>
              <p class="text-sm text-gray-600 dark:text-gray-300">All scenes combined with voiceover</p>
            </div>
          </div>
          <div class="flex gap-3">
            <a href="${renderData.finalVideo}" download 
               class="px-6 py-3 bg-[#5B7FFF] hover:bg-[#4A6BFF] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all">
              Download Full Video
            </a>
            <button onclick="openYouTubeUpload('${renderData.sessionId}')" 
                    class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Upload to YouTube
            </button>
          </div>
        </div>
      </div>
  ` : '';
  
  // Build audio link if available
  const audioSection = renderData.audio ? `
    <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-[#5B7FFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
        </svg>
        <div>
          <span class="font-medium text-gray-900 dark:text-white">Audio File</span>
          <span class="text-sm text-gray-600 dark:text-gray-400 ml-2">(MP3)</span>
        </div>
      </div>
      <a href="${renderData.audio}" download 
         class="px-4 py-2 bg-[#5B7FFF] hover:bg-[#4A6BFF] text-white rounded-lg text-sm font-medium transition-all">
        Download
      </a>
    </div>
  ` : '';
  
  // Create download modal
  const modalHTML = `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" id="videoDownloadModal">
      <div class="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-[#5B7FFF]/10 dark:bg-[#5B7FFF]/20 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-[#5B7FFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Videos Rendered Successfully!</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">Folder: ${renderData.sessionId}</p>
              </div>
            </div>
            <button onclick="closeVideoDownloadModal()" 
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="p-6">
          <!-- Full Video (conditional) -->
          ${fullVideoSection}
          
          <!-- Script & Audio -->
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h4 class="font-bold text-gray-900 dark:text-white">Project Files:</h4>
          </div>
          
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-[#5B7FFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <div>
                <span class="font-medium text-gray-900 dark:text-white">Script</span>
                <span class="text-sm text-gray-600 dark:text-gray-400 ml-2">(TXT with timestamps)</span>
              </div>
            </div>
            <a href="${renderData.script}" download 
               class="px-4 py-2 bg-[#5B7FFF] hover:bg-[#4A6BFF] text-white rounded-lg text-sm font-medium transition-all">
              Download
            </a>
          </div>
          
          ${audioSection}
          
          <!-- Individual Scenes -->
          <div class="flex items-center gap-2 mb-3 mt-6">
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <h4 class="font-bold text-gray-900 dark:text-white">Individual Scene Videos:</h4>
          </div>
          <div class="space-y-2 mb-6">
            ${renderData.sceneVideos.map(v => `
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <span class="font-medium text-gray-900 dark:text-white">Scene ${v.scene}</span>
                  <span class="text-sm text-gray-600 dark:text-gray-400 ml-2">(${v.duration}s)</span>
                </div>
                <a href="${v.url}" download 
                   class="px-4 py-2 bg-[#5B7FFF] hover:bg-[#4A6BFF] text-white rounded-lg text-sm font-medium transition-all">
                  Download
                </a>
              </div>
            `).join('')}
          </div>
          
          <!-- Download All Button -->
          <a href="${renderData.downloadAll}" download 
             class="block w-full py-3 bg-[#5B7FFF] hover:bg-[#4A6BFF] text-white text-center font-semibold rounded-lg flex items-center justify-center gap-2 transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Download All Videos (ZIP)
          </a>
        </div>
      </div>
    </div>
  `;
  
  // Remove existing modal if any
  const existingModal = document.getElementById('videoDownloadModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Close video download modal
 */
export function closeVideoDownloadModal() {
  const modal = document.getElementById('videoDownloadModal');
  if (modal) {
    modal.remove();
  }
}

/**
 * Initialize video renderer (set up event listeners)
 */
export function initializeVideoRenderer() {
  // Expose functions globally for onclick handlers in HTML
  window.deleteVideoFromLibrary = deleteVideoFromLibrary;
  window.playVideoInLibrary = playVideoInLibrary;
  window.closeVideoPlayer = closeVideoPlayer;
  window.closeVideoDownloadModal = closeVideoDownloadModal;
}

