const express = require('express');
const router = express.Router();
const path = require('path');
const archiver = require('archiver');
const { checkFFmpegInstallation, renderVideos } = require('../services/ffmpegService');
const { fileExists } = require('../utils/fileUtils');

router.get('/ffmpeg-status', async (req, res, next) => {
  try {
    const status = await checkFFmpegInstallation();
    if (status.installed) {
      console.log('✅ FFmpeg is installed');
    } else {
      console.error('❌ FFmpeg not installed');
    }
    res.json(status);
  } catch (error) {
    next(error);
  }
});

router.post('/render-videos', async (req, res, next) => {
  try {
    const { scenes, audioUrl, projectName, transition, renderFullVideo, captions } = req.body;
    
    console.log('📥 Received render request:');
    console.log('   projectName:', projectName);
    console.log('   renderFullVideo:', renderFullVideo);
    console.log('   transition:', transition);
    console.log('   captions:', captions ? `enabled (${captions.style})` : 'disabled');

    const response = await renderVideos(
      scenes,
      audioUrl,
      projectName,
      transition,
      renderFullVideo,
      captions,
      path.join(__dirname, '../..')
    );

    res.json(response);
  } catch (error) {
    console.error('❌ Error rendering videos:', error);
    
    // Cleanup on error
    const { sanitizeTitle } = require('../utils/fileUtils');
    const sessionId = sanitizeTitle(req.body.projectName, req.body.scenes);
    const tempDir = path.join(__dirname, '../..', 'temp_renders', sessionId);
    try {
      const fs = require('fs').promises;
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}

    next(error);
  }
});

router.get('/download-video/:sessionId/:filename', async (req, res, next) => {
  try {
    const { sessionId, filename } = req.params;
    const baseDir = path.join(__dirname, '../..');
    const tempDir = path.join(baseDir, 'temp_renders', sessionId);
    
    // Check for final video
    if (filename === 'final_video_with_audio.mp4') {
      const finalPath = path.join(tempDir, filename);
      if (await fileExists(finalPath)) {
        const displayName = sessionId.replace(/_/g, ' ');
        return res.download(finalPath, `${displayName} full video.mp4`);
      }
    }
    
    // Check for script.txt
    if (filename === 'script.txt') {
      const scriptPath = path.join(tempDir, filename);
      if (await fileExists(scriptPath)) {
        return res.download(scriptPath);
      }
    }
    
    // Check for audio.mp3
    if (filename === 'audio.mp3') {
      const audioPath = path.join(tempDir, filename);
      if (await fileExists(audioPath)) {
        return res.download(audioPath);
      }
    }
    
    // Check for scene videos
    const scenePath = path.join(tempDir, 'scenes', filename);
    if (await fileExists(scenePath)) {
      return res.download(scenePath);
    }
    
    // Fallback
    const videoPath = path.join(tempDir, 'videos', filename);
    if (await fileExists(videoPath)) {
      return res.download(videoPath);
    }
    
    res.status(404).json({ error: 'File not found' });
  } catch (error) {
    next(error);
  }
});

router.get('/download-all-videos/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const baseDir = path.join(__dirname, '../..');
    const tempDir = path.join(baseDir, 'temp_renders', sessionId);
    
    if (!await fileExists(tempDir)) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const archive = archiver('zip', { zlib: { level: 9 } });
    const displayName = sessionId.replace(/_/g, ' ');
    res.attachment(`${displayName} render video.zip`);
    archive.pipe(res);
    
    const fs = require('fs').promises;
    
    // Add all scene videos
    const scenesPath = path.join(tempDir, 'scenes');
    if (await fileExists(scenesPath)) {
      archive.directory(scenesPath, 'scenes');
    }
    
    // Add script.txt
    const scriptPath = path.join(tempDir, 'script.txt');
    if (await fileExists(scriptPath)) {
      archive.file(scriptPath, { name: 'script.txt' });
    }
    
    // Add audio.mp3
    const audioPath = path.join(tempDir, 'audio.mp3');
    if (await fileExists(audioPath)) {
      archive.file(audioPath, { name: 'audio.mp3' });
    }
    
    // Add final video
    const finalVideoPath = path.join(tempDir, 'final_video_with_audio.mp4');
    if (await fileExists(finalVideoPath)) {
      archive.file(finalVideoPath, { name: `${displayName} full video.mp4` });
    }
    
    await archive.finalize();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

