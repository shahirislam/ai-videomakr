const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const fetch = require('node-fetch');
const path = require('path');
const { sanitizeTitle } = require('../utils/fileUtils');
const { formatTime, generateScriptFile, getCaptionStyle, buildTransitionFilter } = require('../utils/videoUtils');

// Enhanced execPromise with timeout and large buffer for long video renders
const execPromise = (command, options = {}) => {
  return promisify(exec)(command, {
    maxBuffer: 1024 * 1024 * 50, // 50MB buffer
    timeout: 3600000, // 60 minutes timeout
    ...options
  });
};

async function checkFFmpegInstallation() {
  try {
    const { stdout } = await execPromise('ffmpeg -version');
    return {
      installed: true,
      version: stdout.split('\n')[0],
      message: 'FFmpeg is ready for video rendering'
    };
  } catch (error) {
    return {
      installed: false,
      message: 'FFmpeg not found. Please install FFmpeg to enable automatic video rendering.',
      installGuide: 'https://ffmpeg.org/download.html'
    };
  }
}

async function renderVideos(scenes, audioUrl, projectName, transition, renderFullVideo, captions, baseDir) {
  const transitionType = transition?.type || 'fade';
  const transitionDuration = transition?.duration || 0.5;
  const captionsEnabled = captions?.enabled || false;
  const captionStyle = captions?.style || 'classic';
  const captionTexts = captions?.texts || [];

  if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
    throw new Error('Scenes array is required and cannot be empty');
  }

  const totalDuration = scenes[scenes.length - 1]?.endSeconds || 0;
  if (totalDuration > 7200) {
    throw new Error(`Maximum video length is 2 hours (7200 seconds). Your video is ${Math.round(totalDuration / 60)} minutes.`);
  }

  console.log('🎬 Starting ULTRA-OPTIMIZED FFmpeg video rendering...');
  console.log(`   Project: ${projectName || 'unnamed'}`);
  console.log(`   Total scenes: ${scenes.length}`);
  console.log(`   Total duration: ${formatTime(totalDuration)}`);
  console.log(`   Render full video: ${renderFullVideo ? 'YES ✅' : 'NO ❌ (scenes only)'}`);
  console.log(`   Transition: ${transitionType} (${transitionDuration}s)`);

  const sessionId = sanitizeTitle(projectName, scenes);
  const tempDir = path.join(baseDir, 'temp_renders', sessionId);

  // Check FFmpeg installation
  await execPromise('ffmpeg -version');

  // Create directories
  await fs.rm(tempDir, { recursive: true, force: true });
  await fs.mkdir(tempDir, { recursive: true });
  await fs.mkdir(path.join(tempDir, 'images'), { recursive: true });
  await fs.mkdir(path.join(tempDir, 'scenes'), { recursive: true });

  console.log(`✅ Created temp directory: ${tempDir}`);

  // Step 1: Download all images
  console.log('📥 Step 1: Downloading images...');
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    if (!scene.imageUrl || scene.imageUrl === 'error') {
      throw new Error(`Scene ${i + 1} has invalid or missing imageUrl`);
    }

    if (!scene.imageUrl.startsWith('http://') && !scene.imageUrl.startsWith('https://')) {
      throw new Error(`Scene ${i + 1} has invalid URL protocol`);
    }

    console.log(`  📥 Downloading scene ${i + 1}: ${scene.imageUrl.substring(0, 60)}...`);
    const imageResponse = await fetch(scene.imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image for scene ${i + 1}: HTTP ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.buffer();
    const imagePath = path.join(tempDir, 'images', `scene_${String(i + 1).padStart(3, '0')}.jpg`);
    await fs.writeFile(imagePath, imageBuffer);
    console.log(`  ✅ Downloaded scene ${i + 1}/${scenes.length}`);
  }

  // Step 2: Download audio
  console.log('📥 Step 2: Downloading audio...');
  let audioPath = null;
  if (audioUrl) {
    if (audioUrl.startsWith('data:')) {
      try {
        console.log('  📝 Extracting base64 audio data...');
        const base64Data = audioUrl.split(',')[1];
        if (!base64Data) {
          throw new Error('Invalid data URI format');
        }
        const audioBuffer = Buffer.from(base64Data, 'base64');
        audioPath = path.join(tempDir, 'audio.mp3');
        await fs.writeFile(audioPath, audioBuffer);
        console.log('  ✅ Audio extracted from data URI successfully');
      } catch (audioError) {
        console.warn(`  ⚠️ Failed to extract audio from data URI: ${audioError.message}`);
      }
    } else if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
      try {
        console.log(`  📥 Downloading audio from: ${audioUrl.substring(0, 80)}...`);
        const audioResponse = await fetch(audioUrl);
        if (audioResponse.ok) {
          const audioBuffer = await audioResponse.buffer();
          audioPath = path.join(tempDir, 'audio.mp3');
          await fs.writeFile(audioPath, audioBuffer);
          console.log('  ✅ Audio downloaded successfully');
        } else {
          console.warn(`  ⚠️ Audio download failed: HTTP ${audioResponse.status}`);
        }
      } catch (audioError) {
        console.warn(`  ⚠️ Audio download error: ${audioError.message}`);
      }
    }
  } else {
    console.log('  ⚠️ No audio URL provided, video will have no sound');
  }

  // Step 2.5: Generate and save script.txt
  console.log('📝 Step 2.5: Generating script file...');
  const scriptContent = generateScriptFile(scenes, projectName || 'Untitled');
  const scriptPath = path.join(tempDir, 'script.txt');
  await fs.writeFile(scriptPath, scriptContent, 'utf-8');
  console.log('  ✅ Script file created: script.txt');

  // Step 3: Create individual scene videos
  console.log('🎨 Step 3: Creating individual scene videos...');
  const PARALLEL_LIMIT = 4;

  for (let i = 0; i < scenes.length; i += PARALLEL_LIMIT) {
    const batch = scenes.slice(i, Math.min(i + PARALLEL_LIMIT, scenes.length));
    console.log(`  🔄 Processing batch ${Math.floor(i / PARALLEL_LIMIT) + 1} (scenes ${i + 1}-${Math.min(i + PARALLEL_LIMIT, scenes.length)})...`);

    await Promise.all(batch.map(async (scene, batchIdx) => {
      const sceneIndex = i + batchIdx;
      const imagePath = path.join(tempDir, 'images', `scene_${String(sceneIndex + 1).padStart(3, '0')}.jpg`);
      const videoPath = path.join(tempDir, 'scenes', `scene_${String(sceneIndex + 1).padStart(3, '0')}.mp4`);
      const duration = scene.endSeconds - scene.startSeconds;
      const timeoutDuration = Math.round(Math.min(1800000, Math.max(120000, duration * 30000)));

      console.log(`    🎬 Scene ${sceneIndex + 1}/${scenes.length}: ${duration.toFixed(2)}s`);

      // Build caption filter if enabled
      let captionFilter = '';
      if (captionsEnabled && captionTexts[sceneIndex]) {
        const style = getCaptionStyle(captionStyle);
        const text = captionTexts[sceneIndex].replace(/'/g, "\\'").replace(/:/g, '\\:');
        captionFilter = `drawtext=fontfile='${style.fontfile}':text='${text}':fontsize=${style.fontsize}:fontcolor=${style.fontcolor}:x=(w-text_w)/2:y=h-th-80`;
        if (style.box === 1) {
          captionFilter += `:box=${style.box}:boxcolor=${style.boxcolor}:boxborderw=${style.boxborderw}`;
        }
        if (style.borderw) {
          captionFilter += `:borderw=${style.borderw}:bordercolor=${style.bordercolor}`;
        }
        if (style.shadowcolor) {
          captionFilter += `:shadowcolor=${style.shadowcolor}:shadowx=${style.shadowx || 2}:shadowy=${style.shadowy || 2}`;
        }
      }

      // Try hardware encoders in priority order
      // CRITICAL: All encoders must produce yuv420p (not yuvj420p) for xfade compatibility
      try {
        if (!captionsEnabled || !captionTexts[sceneIndex]) {
          // QSV: Convert to yuv420p after hardware processing
          const qsvVF = "hwupload=extra_hw_frames=64,format=qsv,scale_qsv=1920:1080";
          const qsvCommand = `ffmpeg -init_hw_device qsv=hw -filter_hw_device hw -loop 1 -i "${imagePath}" -t ${duration.toFixed(3)} -vf "${qsvVF}" -c:v h264_qsv -preset veryfast -global_quality 23 -look_ahead 0 -r 24 -pix_fmt yuv420p -g 24 -bf 0 "${videoPath}" -y`;
          await execPromise(qsvCommand, { timeout: timeoutDuration });
          console.log(`    ⚡ Intel Quick Sync (QSV)`);
        } else {
          throw new Error('QSV skip for captions');
        }
      } catch (qsvError) {
        try {
          if (!captionsEnabled || !captionTexts[sceneIndex]) {
            // VAAPI: Ensure proper pixel format output
            const vaApiVF = "format=nv12|vaapi,hwupload,scale_vaapi=1920:1080:force_original_aspect_ratio=decrease,pad_vaapi=1920:1080:(ow-iw)/2:(oh-ih)/2";
            const vaApiCommand = `ffmpeg -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi -loop 1 -i "${imagePath}" -t ${duration.toFixed(3)} -vf "${vaApiVF}" -c:v h264_vaapi -qp 23 -r 24 -pix_fmt yuv420p -g 24 -bf 0 "${videoPath}" -y`;
            await execPromise(vaApiCommand, { timeout: timeoutDuration });
            console.log(`    ⚡ Hardware (VAAPI)`);
          } else {
            throw new Error('VAAPI skip for captions');
          }
        } catch (vaApiError) {
          // Fallback to CPU - ensure constant frame rate and proper pixel format for xfade compatibility
          let cpuVF = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2";
          if (captionFilter) {
            cpuVF += `,${captionFilter}`;
          }
          // -g 24 sets GOP size to match frame rate, -bf 0 disables B-frames for constant frame rate
          const cpuCommand = `ffmpeg -loop 1 -i "${imagePath}" -t ${duration.toFixed(3)} -c:v libx264 -preset ultrafast -crf 23 -tune stillimage -vf "${cpuVF}" -pix_fmt yuv420p -r 24 -g 24 -bf 0 "${videoPath}" -y`;
          await execPromise(cpuCommand, { timeout: timeoutDuration });
          console.log(`    💻 CPU Ultrafast${captionFilter ? ' (with captions)' : ''}`);
        }
      }

      console.log(`    ✅ Scene ${sceneIndex + 1}/${scenes.length} complete`);
    }));

    console.log(`  ✅ Batch ${Math.floor(i / PARALLEL_LIMIT) + 1} complete!`);
    if (global.gc) {
      global.gc();
      console.log(`  🧹 Memory cleanup after batch`);
    }
  }

  // Step 4: Create merged video with transitions (if requested)
  let finalVideoPath = null;

  if (renderFullVideo) {
    console.log(`🎨 Step 4: Creating full merged video with ${transitionType} transitions...`);

    if (scenes.length === 1) {
      const singleVideoPath = path.join(tempDir, 'scenes', 'scene_001.mp4');
      const mergedVideoPath = path.join(tempDir, 'merged_video.mp4');
      await fs.copyFile(singleVideoPath, mergedVideoPath);
    } else {
      const filterComplex = buildTransitionFilter(scenes, transitionType, transitionDuration, tempDir, captionsEnabled, captionStyle, captionTexts);
      let ffmpegCommand = 'ffmpeg ';

      for (let i = 0; i < scenes.length; i++) {
        const videoPath = path.join(tempDir, 'scenes', `scene_${String(i + 1).padStart(3, '0')}.mp4`);
        ffmpegCommand += `-i "${videoPath}" `;
      }

      const mergedVideoPath = path.join(tempDir, 'merged_video.mp4');
      ffmpegCommand += `-filter_complex "${filterComplex}" `;
      ffmpegCommand += `-map "[outv]" `;

      const qsvTransitionCmd = ffmpegCommand + `-c:v h264_qsv -preset veryfast -global_quality 23 "${mergedVideoPath}" -y`;
      const vaApiTransitionCmd = ffmpegCommand + `-vf "format=nv12|vaapi,hwupload" -c:v h264_vaapi -qp 23 "${mergedVideoPath}" -y`;
      const cpuTransitionCmd = ffmpegCommand + `-c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p "${mergedVideoPath}" -y`;

      try {
        await execPromise(qsvTransitionCmd);
        console.log('  ⚡ Intel Quick Sync transitions');
      } catch {
        try {
          await execPromise(vaApiTransitionCmd);
          console.log('  ⚡ VAAPI transitions');
        } catch {
          await execPromise(cpuTransitionCmd);
          console.log('  💻 CPU ultrafast transitions');
        }
      }
    }

    // Step 5: Add audio to merged video
    const mergedVideoPath = path.join(tempDir, 'merged_video.mp4');

    if (audioPath) {
      console.log('🎵 Step 5: Adding audio...');
      finalVideoPath = path.join(tempDir, 'final_video_with_audio.mp4');
      const audioCommand = `ffmpeg -i "${mergedVideoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 "${finalVideoPath}" -y`;
      await execPromise(audioCommand);
      console.log('  ✅ Audio added!');
    } else {
      finalVideoPath = mergedVideoPath;
      console.log('⚠️ No audio provided, video created without sound');
    }

    console.log('✅ Full merged video complete!');
  } else {
    console.log('⏭️  Step 4: Skipping full video (user chose scenes only)');
  }

  // Prepare response
  const sceneVideos = scenes.map((scene, i) => ({
    scene: String(i + 1).padStart(3, '0'),
    url: `/api/download-video/${sessionId}/scene_${String(i + 1).padStart(3, '0')}.mp4`,
    duration: (scene.endSeconds - scene.startSeconds).toFixed(2),
    startTime: scene.startTime,
    endTime: scene.endTime
  }));

  const response = {
    success: true,
    sessionId: sessionId,
    message: renderFullVideo
      ? `🚀 Video rendered in record time with ${transitionType} transitions (1080p HD)`
      : '✅ Individual scene videos rendered (1080p HD)',
    sceneVideos: sceneVideos,
    script: `/api/download-video/${sessionId}/script.txt`,
    audio: audioPath ? `/api/download-video/${sessionId}/audio.mp3` : null,
    downloadAll: `/api/download-all-videos/${sessionId}`,
    renderFullVideo: renderFullVideo,
    transition: {
      type: transitionType,
      duration: transitionDuration
    }
  };

  if (renderFullVideo && finalVideoPath) {
    response.finalVideo = `/api/download-video/${sessionId}/final_video_with_audio.mp4`;
  }

  // Schedule cleanup after 1 hour
  setTimeout(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`🗑️ Cleaned up temp directory: ${sessionId}`);
    } catch (err) {
      console.error('Error cleaning up:', err);
    }
  }, 60 * 60 * 1000);

  return response;
}

module.exports = {
  checkFFmpegInstallation,
  renderVideos,
  execPromise
};

