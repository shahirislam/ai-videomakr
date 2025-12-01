const fs = require('fs').promises;
const path = require('path');

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function sanitizeTitle(title, scenes) {
  // Handle empty, null, undefined, or generic titles
  if (!title || title.trim() === '' || title === 'Untitled' || title === 'unnamed' || title === 'untitled') {
    // Try to use first 3 words from first scene text
    if (scenes && scenes.length > 0 && scenes[0].text) {
      console.log('📝 No title provided, using first 3 words from script...');
      const scriptWords = scenes[0].text
        .trim()
        .split(/\s+/)
        .slice(0, 3)
        .map(word => word.replace(/[^a-zA-Z0-9]/g, ''))
        .filter(word => word.length > 0);
      
      if (scriptWords.length > 0) {
        const generatedName = scriptWords.join('_');
        console.log(`   Generated folder name: ${generatedName}`);
        return generatedName;
      }
    }
    
    // Fallback to timestamp if no script text available
    return `Video_${Date.now()}`;
  }
  
  // Get first 3 words from provided title
  const words = title
    .trim()
    .split(/\s+/)  // Split by whitespace
    .slice(0, 3)   // Take first 3 words
    .map(word => word.replace(/[^a-zA-Z0-9]/g, ''))  // Remove special chars
    .filter(word => word.length > 0);  // Remove empty strings
  
  // If no valid words after cleaning, use timestamp
  if (words.length === 0) {
    return `Video_${Date.now()}`;
  }
  
  // Join with underscore for better folder compatibility
  return words.join('_');
}

module.exports = {
  fileExists,
  sanitizeTitle
};

