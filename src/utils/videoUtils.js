function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function generateScriptFile(scenes, projectTitle) {
  let script = `Title: ${projectTitle}\n`;
  script += `Total Duration: ${formatTime(scenes[scenes.length - 1].endSeconds)}\n`;
  script += `Total Scenes: ${scenes.length}\n`;
  script += `\n${'='.repeat(60)}\n\n`;

  scenes.forEach((scene, index) => {
    script += `[Scene ${index + 1}: ${scene.startTime} - ${scene.endTime}]\n`;
    script += `Duration: ${(scene.endSeconds - scene.startSeconds).toFixed(2)}s\n`;
    if (scene.text) {
      script += `\n${scene.text}\n`;
    }
    script += `\n${'-'.repeat(60)}\n\n`;
  });

  return script;
}

function getCaptionStyle(style) {
  const styles = {
    classic: {
      fontfile: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      fontsize: 42,
      fontcolor: 'white',
      box: 1,
      boxcolor: 'black@0.85',
      boxborderw: 10
    },
    yellow: {
      fontfile: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      fontsize: 42,
      fontcolor: 'white',
      box: 0,
      shadowcolor: 'black@0.8',
      shadowx: 2,
      shadowy: 2
    },
    white: {
      fontfile: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      fontsize: 42,
      fontcolor: 'black',
      box: 1,
      boxcolor: 'white@0.95',
      boxborderw: 10
    },
    gradient: {
      fontfile: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      fontsize: 44,
      fontcolor: '#FFD700',
      box: 0
    },
    outlined: {
      fontfile: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      fontsize: 42,
      fontcolor: 'white',
      box: 0,
      borderw: 3,
      bordercolor: 'black'
    },
    neon: {
      fontfile: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      fontsize: 42,
      fontcolor: '#00f7ff',
      box: 0,
      shadowcolor: '#00f7ff@0.8',
      shadowx: 0,
      shadowy: 0
    },
    shadow: {
      fontfile: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      fontsize: 42,
      fontcolor: 'white',
      box: 1,
      boxcolor: 'white@0.25',
      boxborderw: 8
    },
    minimal: {
      fontfile: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      fontsize: 42,
      fontcolor: 'white',
      box: 0,
      shadowcolor: 'black@0.8',
      shadowx: 3,
      shadowy: 3
    },
    colorful: {
      fontfile: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      fontsize: 42,
      fontcolor: 'white',
      box: 1,
      boxcolor: '#667eea@1.0',
      boxborderw: 10
    }
  };

  return styles[style] || styles.classic;
}

function buildTransitionFilter(scenes, transitionType, transitionDuration, tempDir, captionsEnabled = false, captionStyle = 'classic', captionTexts = []) {
  const filters = [];

  console.log(`\n🔧 Building transition filter for ${scenes.length} scenes:`);

  // Step 1: Scale each video input (1080p Full HD maintained!)
  // CRITICAL: Convert pixel format and ensure constant frame rate for xfade
  // xfade requires: constant frame rate and proper pixel format (yuv420p, not yuvj420p)
  scenes.forEach((scene, i) => {
    // Convert deprecated yuvj420p to yuv420p with proper color range
    // Then scale, pad, set constant frame rate, and normalize timestamps
    // Enhanced: Add explicit time base (settb=1/24) to ensure CFR detection by xfade
    let videoFilter = `[${i}:v]` +
      `scale=1920:1080:force_original_aspect_ratio=decrease,` +
      `pad=1920:1080:(ow-iw)/2:(oh-ih)/2,` +
      `setsar=1,` +
      `fps=24,` +
      `settb=1/24`;  // Explicit time base for CFR detection

    // Add captions if enabled and text exists for this scene
    if (captionsEnabled && captionTexts[i]) {
      const style = getCaptionStyle(captionStyle);
      const text = captionTexts[i].replace(/'/g, "\\'").replace(/:/g, '\\:');

      // Build drawtext filter based on style
      let drawtext = `drawtext=fontfile='${style.fontfile}':` +
        `text='${text}':` +
        `fontsize=${style.fontsize}:` +
        `fontcolor=${style.fontcolor}:` +
        `x=(w-text_w)/2:` + // Centered horizontally
        `y=h-th-80`; // 80px from bottom

      // Add box if style has it
      if (style.box === 1) {
        drawtext += `:box=${style.box}:boxcolor=${style.boxcolor}:boxborderw=${style.boxborderw}`;
      }

      // Add border if style has it (outlined style)
      if (style.borderw) {
        drawtext += `:borderw=${style.borderw}:bordercolor=${style.bordercolor}`;
      }

      // Add shadow if style has it
      if (style.shadowcolor) {
        drawtext += `:shadowcolor=${style.shadowcolor}:shadowx=${style.shadowx || 2}:shadowy=${style.shadowy || 2}`;
      }

      videoFilter += `,${drawtext}`;
    }

    videoFilter += `[v${i}]`;
    filters.push(videoFilter);

    const duration = scenes[i].endSeconds - scenes[i].startSeconds;
    console.log(`   Scene ${i + 1}: ${duration.toFixed(2)}s (${scenes[i].startSeconds}s → ${scenes[i].endSeconds}s)`);
    console.log(`      Filter chain: scale → pad → setsar → fps=24 → settb=1/24${captionsEnabled && captionTexts[i] ? ' → drawtext' : ''}`);
  });

  // Step 2: Chain xfade transitions
  // CRITICAL: For xfade, the offset is when the transition starts on the FIRST input
  // When chaining transitions, the "first input" duration shrinks due to overlaps
  let lastOutput = 'v0';
  let combinedDuration = scenes[0].endSeconds - scenes[0].startSeconds; // Duration of the first scene

  console.log(`\n🔗 Creating ${scenes.length - 1} transitions:`);

  for (let i = 0; i < scenes.length - 1; i++) {
    const nextSceneDuration = scenes[i + 1].endSeconds - scenes[i + 1].startSeconds;

    // The offset is when the transition should start on the current combined stream
    // This is its total duration minus the transition duration
    const offset = combinedDuration - transitionDuration;
    const outputLabel = i === scenes.length - 2 ? 'outv' : `vout${i}`;

    console.log(`   Transition ${i + 1}: [${lastOutput}] + [v${i + 1}] → [${outputLabel}] at offset ${offset.toFixed(3)}s (combined duration: ${combinedDuration.toFixed(3)}s)`);

    filters.push(
      `[${lastOutput}][v${i + 1}]xfade=` +
      `transition=${transitionType}:` +
      `duration=${transitionDuration.toFixed(3)}:` +
      `offset=${Math.max(0, offset).toFixed(3)}[${outputLabel}]`
    );

    lastOutput = outputLabel;
    // After the transition, the new combined duration is:
    // previous combined duration + next scene duration - transition overlap
    combinedDuration = combinedDuration + nextSceneDuration - transitionDuration;
  }

  console.log(`\n✅ Total filter segments: ${filters.length}`);
  console.log(`✅ Total transitions: ${scenes.length - 1}\n`);

  return filters.join(';');
}

function buildConcatFile(scenePaths) {
  // Creates concat demuxer file format for simple video joining
  // Format: file 'scene_001.mp4'\nfile 'scene_002.mp4'...
  // Escapes single quotes in paths for FFmpeg compatibility
  return scenePaths
    .map(p => `file '${p.replace(/'/g, "\\'")}'`)
    .join('\n');
}

module.exports = {
  formatTime,
  generateScriptFile,
  getCaptionStyle,
  buildTransitionFilter,
  buildConcatFile
};

