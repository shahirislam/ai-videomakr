// App constants
export const VOICE_RATE_WORDS_PER_CREDIT = 120;
export const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

// API endpoints
export const API_ENDPOINTS = {
  CLAUDE: '/api/claude',
  CHATGPT: '/api/chatgpt',
  GENERATE_IMAGE: '/api/generate-image',
  GENERATE_VOICE: '/api/generate-voice',
  RENDER_VIDEOS: '/api/render-videos',
  FFMPEG_STATUS: '/api/ffmpeg-status',
  PROXY_IMAGE: '/api/proxy-image',
  HEALTH: '/api/health',
  YOUTUBE_AUTH: '/api/youtube/auth',
  YOUTUBE_CALLBACK: '/api/youtube/callback',
  YOUTUBE_STATUS: '/api/youtube/status',
  YOUTUBE_DISCONNECT: '/api/youtube/disconnect',
  YOUTUBE_UPLOAD: '/api/youtube/upload',
  DOWNLOAD_VIDEO: '/api/download-video',
  DOWNLOAD_ALL: '/api/download-all-videos'
};

// Default values
export const DEFAULTS = {
  MAX_WORDS: 8000,
  DEFAULT_WORD_COUNT: 500,
  MAX_VIDEO_DURATION: 7200, // 2 hours in seconds
  TRANSITION_DURATION: 0.5,
  TRANSITION_TYPE: 'fade'
};

// Voice constants
export const ELEVENLABS_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", style: "Calm and professional" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", style: "Strong and confident" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", style: "Soft and gentle" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", style: "Warm and friendly" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", style: "Young and energetic" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", style: "Deep narrator" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", style: "Crisp storyteller" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", style: "Clear and articulate" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", style: "Raspy character" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Serena", style: "Pleasant narrator" },
  { id: "ODq5zmih8GrVes37Dizd", name: "Patrick", style: "Smooth baritone" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", style: "Casual Australian" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", style: "British narrator" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", style: "British woman" },
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", style: "English Swedish" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", style: "Casual American" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", style: "Fairy tale voice" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", style: "Hoarse male" },
  { id: "Zlb1dXrM653N07WRdFW3", name: "Emily", style: "Calm American" },
  { id: "ThT5KcBeYPX3keUQqHPh", name: "Dorothy", style: "Pleasant British" },
  { id: "aMSt68OGf4xUZAnLpTU8", name: "Juniper", style: "Expressive storyteller" }
];

export const SPEECHIFY_VOICES = [
  { id: 'henry', name: 'Henry', style: 'Warm and friendly' },
  { id: 'snoop', name: 'Snoop', style: 'Cool and laid-back' },
  { id: 'gwyneth', name: 'Gwyneth', style: 'Elegant and sophisticated' },
  { id: 'mrbeast', name: 'Mr. Beast', style: 'Energetic and enthusiastic' },
  { id: 'james', name: 'James', style: 'Professional narrator' },
  { id: 'olivia', name: 'Olivia', style: 'Clear and articulate' },
  { id: 'noah', name: 'Noah', style: 'Confident and strong' },
  { id: 'emma', name: 'Emma', style: 'Gentle and soothing' }
];

export const ELEVENLABS_VOICE_MAP = {
  "Rachel": "21m00Tcm4TlvDq8ikWAM",
  "Domi": "AZnzlk1XvdvUeBnXmlld",
  "Bella": "EXAVITQu4vr4xnSDxMaL",
  "Antoni": "ErXwobaYiN019PkySvjV",
  "Elli": "MF3mGyEYCl7XYWbV9V6O",
  "Josh": "TxGEqnHWrfWFTfGW9XjX",
  "Arnold": "VR6AewLTigWG4xSOukaG",
  "Adam": "pNInz6obpgDQGcFmaJgB",
  "Sam": "yoZ06aMxZJJ28mfd3POQ",
  "Serena": "CwhRBWXzGAHq8TQ4Fs17",
  "Patrick": "ODq5zmih8GrVes37Dizd",
  "Charlie": "IKne3meq5aSn9XLyUdCD",
  "Daniel": "onwK4e9ZLuTAKqWW03F9",
  "Lily": "pFZP5JQG7iQjIQuC4Bku",
  "Charlotte": "XB0fDUnXU5powFXDhCwa",
  "Chris": "iP95p4xoKVk53GoZ742B",
  "Brian": "nPczCjzI2devNBz1zQrb",
  "Callum": "N2lVS1w4EtoT3dr4eOWO",
  "Emily": "Zlb1dXrM653N07WRdFW3",
  "Dorothy": "ThT5KcBeYPX3keUQqHPh",
  "Juniper": "aMSt68OGf4xUZAnLpTU8"
};

// Title generation costs
export const TITLE_GENERATION_COSTS = {
  CHANNEL: 5,
  SAMPLES: 3
};

// Default voice ID
export const DEFAULT_VOICE_ID = 'aMSt68OGf4xUZAnLpTU8'; // Juniper

// Typewriter effect speed (ms per character)
export const TYPEWRITER_SPEED = 2; // milliseconds per character

