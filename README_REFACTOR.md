# StoryVid AI - Refactoring Documentation

## Overview

This project has been refactored from a monolithic structure into a modern, modular architecture with improved UI/UX.

## Project Structure

### Backend (`src/`)

```
src/
├── config/
│   └── apiKeys.js          # API key configuration and validation
├── middleware/
│   ├── errorHandler.js     # Centralized error handling
│   ├── logger.js           # Request logging
│   └── validation.js       # Request validation
├── routes/
│   ├── claude.js           # Script generation endpoints
│   ├── images.js           # Image generation endpoints
│   ├── voice.js            # Voice generation endpoints
│   ├── video.js            # Video rendering endpoints
│   ├── youtube.js          # YouTube integration endpoints
│   └── health.js           # Health check endpoints
├── services/
│   ├── claudeService.js    # Claude API integration
│   ├── ideogramService.js  # Ideogram API integration
│   ├── ai33Service.js      # AI33.pro API integration
│   ├── ffmpegService.js    # FFmpeg video processing
│   └── youtubeService.js  # YouTube API integration
└── utils/
    ├── fileUtils.js        # File operations
    └── videoUtils.js       # Video processing helpers
```

### Frontend (`src/`)

```
src/
├── components/              # UI components
│   ├── Button.js
│   ├── Modal.js
│   ├── LoadingSpinner.js
│   └── ErrorBoundary.js
├── services/               # API service layer
│   ├── api.js             # Centralized API client
│   ├── scriptService.js
│   ├── imageService.js
│   ├── voiceService.js
│   ├── videoService.js
│   └── youtubeService.js
├── store/                  # State management
│   ├── scriptStore.js
│   ├── imageStore.js
│   ├── videoStore.js
│   └── uiStore.js
├── styles/                 # Stylesheets
│   ├── main.css
│   ├── components.css
│   └── utilities.css
├── utils/                  # Utilities
│   ├── constants.js
│   ├── storage.js
│   ├── formatters.js
│   ├── validators.js
│   ├── toast.js
│   └── progress.js
└── app.js                  # Main entry point
```

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (`.env` file):
```
ANTHROPIC_API_KEY=your_key
IDEOGRAM_API_KEY=your_key
AI33_API_KEY=your_key
YOUTUBE_CLIENT_ID=your_id
YOUTUBE_CLIENT_SECRET=your_secret
PORT=3000
```

### Development

1. Start backend server:
```bash
npm run dev
```

2. Start frontend dev server (in another terminal):
```bash
npm run dev:frontend
```

The frontend will be available at `http://localhost:5173` and will proxy API requests to the backend at `http://localhost:3000`.

### Building for Production

```bash
npm run build
```

This will build the frontend to the `dist/` directory.

## Migration Notes

The original `public/app.js` (6687 lines) is being gradually migrated to the new modular structure. The new `src/app.js` provides a compatibility layer that allows the old code to continue working during migration.

### Migration Strategy

1. **Phase 1 (Complete)**: Backend refactoring - All backend code is now modular
2. **Phase 2 (Complete)**: Frontend build setup - Vite configured, ES modules ready
3. **Phase 3 (In Progress)**: Component extraction - Reusable components created
4. **Phase 4 (Pending)**: UI improvements - Loading states, error handling, responsive design
5. **Phase 5 (Pending)**: Full migration - Complete extraction of old app.js

## Key Improvements

### Backend
- ✅ Modular route structure
- ✅ Service layer separation
- ✅ Centralized error handling
- ✅ Better code organization

### Frontend
- ✅ Modern build system (Vite)
- ✅ ES modules
- ✅ Component-based architecture
- ✅ State management
- ✅ Service layer for API calls

### UI/UX (Planned)
- ⏳ Better loading states
- ⏳ Progress indicators
- ⏳ Toast notifications
- ⏳ Error boundaries
- ⏳ Responsive design improvements
- ⏳ Step-by-step wizard
- ⏳ Better navigation

## API Endpoints

All endpoints are prefixed with `/api`:

- `POST /api/claude` - Script generation
- `POST /api/chatgpt` - Image prompt generation
- `POST /api/generate-image` - Image generation
- `POST /api/generate-voice` - Voice generation
- `POST /api/render-videos` - Video rendering
- `GET /api/ffmpeg-status` - Check FFmpeg installation
- `GET /api/health` - Health check
- `GET /api/proxy-image` - Image proxy
- `GET /api/youtube/auth` - YouTube OAuth
- `GET /api/youtube/callback` - YouTube OAuth callback
- `GET /api/youtube/status` - Check YouTube connection
- `POST /api/youtube/disconnect` - Disconnect YouTube
- `POST /api/youtube/upload` - Upload video to YouTube

## Next Steps

1. Continue extracting components from `public/app.js`
2. Implement UI improvements (loading states, progress bars, etc.)
3. Add responsive design enhancements
4. Implement step-by-step wizard for video creation
5. Add better error handling and user feedback
6. Complete full migration from legacy code

