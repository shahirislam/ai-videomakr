# StoryVid AI - Complete Testing Workflow

## 🎯 Overview

This guide walks you through testing the entire video creation workflow from start to finish.

## 📋 Prerequisites

1. **Server is running**: `npm run dev` should be running on port 3000
2. **Browser**: Open `http://localhost:3000/`
3. **API Keys**: Ensure all API keys are configured in `.env`:
   - `ANTHROPIC_API_KEY` (for script generation)
   - `IDEOGRAM_API_KEY` (for image generation)
   - `AI33_API_KEY` (for voice generation)
   - `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET` (optional, for YouTube upload)

---

## 🚀 Step-by-Step Testing Workflow

### **Step 1: Enter Video Title** ✅

**Location**: Main input field at the top of the page

**Actions**:
1. Type a video title in the input field (e.g., "How to Build a Website")
2. The "Generate" button should become enabled when you type something
3. Check the credit balance display (should show your current credits)

**Optional Features to Test**:
- **Word Count Icon** (📊): Click to set custom word count (default: 500, max: 8000)
- **Context Icon** (✏️): Click to add additional context/instructions for the AI
- **Upload Text File** (📤): Upload a `.txt` file with your script
- **Title Helper** (☰): 
  - Generate title from YouTube channel URL
  - Generate title from sample list
- **Style Icon** (🎬): Open style modal (for advanced users)

**Expected Result**: 
- Input field accepts text
- Generate button is enabled
- Credit estimate updates based on word count

---

### **Step 2: Generate Script** ✅

**Location**: Click the "Generate" button

**Actions**:
1. Click the "Generate" button
2. Wait for script generation (this may take 30-60 seconds)
3. Watch for the script to appear below with a typewriter effect

**What to Check**:
- ✅ Script appears in the output area
- ✅ Word count is displayed
- ✅ Copy and Download buttons are enabled
- ✅ Voice icon (🎤) and Image icon (🖼️) become enabled
- ✅ Script is properly formatted with scenes

**Expected Result**: 
- Script is generated and displayed
- All script management features are enabled
- Credit balance is deducted

---

### **Step 3: Generate Images** 🖼️

**Location**: Click the image icon (🖼️) next to the Script heading

**Actions**:
1. Click the image icon to open the Image Generation Modal
2. Configure image settings:
   - **Aspect Ratio**: Choose 16:9, 9:16, or 1:1
   - **Quality Level**: Standard (30 credits), HD (50 credits), or Ultra HD (80 credits)
   - **Animation**: Toggle on/off (optional)
   - **Image Count**: Set number of images (min: 3, max: 250)
   - **Style**: Click "Choose style" to select an image style (Realistic, Oil Painting, 3D Model, etc.)
   - **Additional Context**: Add any extra instructions (optional)
3. Review the credit estimate
4. Click "Generate Images"

**What to Check**:
- ✅ Modal opens correctly
- ✅ All settings are configurable
- ✅ Credit estimate updates when you change settings
- ✅ Style selector works (multiple pages of styles)
- ✅ Images start generating (progress indicator)
- ✅ Generated images appear in the modal
- ✅ You can regenerate individual images
- ✅ You can download individual images
- ✅ "Generate Next" button appears if you set count > 3

**Expected Result**: 
- Images are generated for each scene
- Images are displayed in a grid
- You can interact with each image (regenerate, download, view details)

---

### **Step 4: Generate Voice/Narration** 🎤

**Location**: Click the voice icon (🎤) next to the Script heading

**Actions**:
1. Click the voice icon
2. Select a voice provider:
   - **ElevenLabs**: Click the voice dropdown to see available voices
   - **Speechify**: Click to switch to Speechify voices
3. Preview voices by clicking the play button
4. Select your preferred voice
5. Click "Generate Voice" or wait for automatic generation

**What to Check**:
- ✅ Voice dropdown opens
- ✅ Voice previews work
- ✅ You can switch between ElevenLabs and Speechify
- ✅ Voice generation progress is shown
- ✅ Audio player appears when voice is ready
- ✅ Credit cost is calculated and displayed
- ✅ Audio can be played/paused

**Expected Result**: 
- Voice is generated from the script
- Audio player is displayed
- Credit balance is deducted

---

### **Step 5: Render Videos** 🎬

**Location**: After images and voice are generated, click "Render Videos" in the Generated Media Modal

**Actions**:
1. Ensure you have:
   - ✅ Script generated
   - ✅ Images generated for all scenes
   - ✅ Voice/narration generated
2. Click "Render Videos" button
3. Configure video settings (if modal appears):
   - **Transition Type**: Fade, Slide, etc.
   - **Transition Duration**: Set duration
   - **Captions**: Enable/disable
   - **Render Full Video**: Choose to render full video or individual scenes
4. Wait for rendering (this may take several minutes)

**What to Check**:
- ✅ FFmpeg status is checked (if not installed, manual download option appears)
- ✅ Rendering progress is shown
- ✅ Video download modal appears when complete
- ✅ You can download the final video
- ✅ Video is saved to library (check Library button in header)

**Expected Result**: 
- Video is rendered successfully
- Download link is provided
- Video is saved to library

---

### **Step 6: Upload to YouTube** (Optional) 📺

**Location**: After video is rendered, click "Upload to YouTube" button

**Actions**:
1. **First Time**: Click "Connect YouTube" to authorize
   - You'll be redirected to Google OAuth
   - Authorize the application
   - You'll be redirected back
2. **After Connection**: Click "Upload to YouTube"
3. Fill in video details:
   - **Title**: Video title
   - **Description**: Video description
   - **Tags**: Comma-separated tags
   - **Privacy**: Private, Unlisted, or Public
4. Click "Upload to YouTube"
5. Wait for upload to complete

**What to Check**:
- ✅ YouTube connection works
- ✅ OAuth flow completes successfully
- ✅ Upload modal opens
- ✅ Upload progress is shown
- ✅ Success message appears
- ✅ Video URL is provided

**Expected Result**: 
- Video is uploaded to YouTube
- You receive a link to the uploaded video

---

## 🧪 Additional Features to Test

### **Video Library** 📚
- Click "Library" button in header
- View all rendered videos
- Play videos in the library
- Delete videos from library

### **Dark Mode** 🌙
- Click the dark mode toggle in header
- Verify all UI elements adapt to dark mode
- Check that preference is saved

### **Session Recovery** 💾
- Start creating a video
- Refresh the page
- Check if session is recovered

### **Error Handling** ⚠️
- Test with invalid API keys
- Test with network errors
- Test with invalid inputs
- Verify error messages are user-friendly

### **Responsive Design** 📱
- Test on different screen sizes
- Test on mobile devices
- Verify modals work on small screens

---

## 🐛 Common Issues & Troubleshooting

### **Script Generation Fails**
- Check `ANTHROPIC_API_KEY` in `.env`
- Check browser console for errors
- Verify credit balance is sufficient

### **Image Generation Fails**
- Check `IDEOGRAM_API_KEY` in `.env`
- Verify images are being generated (check network tab)
- Try regenerating individual images

### **Voice Generation Fails**
- Check `AI33_API_KEY` in `.env`
- Verify voice provider is selected
- Check audio file is generated

### **Video Rendering Fails**
- Check if FFmpeg is installed on server
- Verify all images and audio are generated
- Check server logs for FFmpeg errors

### **YouTube Upload Fails**
- Check `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET` in `.env`
- Verify OAuth redirect URI is configured correctly
- Check if tokens are expired (reconnect if needed)

---

## ✅ Testing Checklist

- [ ] **Step 1**: Enter title and configure settings
- [ ] **Step 2**: Generate script successfully
- [ ] **Step 3**: Generate images with different styles
- [ ] **Step 4**: Generate voice with different providers
- [ ] **Step 5**: Render video successfully
- [ ] **Step 6**: Upload to YouTube (optional)
- [ ] **Additional**: Test video library
- [ ] **Additional**: Test dark mode
- [ ] **Additional**: Test session recovery
- [ ] **Additional**: Test error handling
- [ ] **Additional**: Test responsive design

---

## 📝 Notes

- **Credit Costs**: Each operation consumes credits. Monitor your balance.
- **Processing Time**: 
  - Script generation: 30-60 seconds
  - Image generation: 1-3 minutes (depends on count)
  - Voice generation: 30-90 seconds
  - Video rendering: 2-10 minutes (depends on length)
- **Browser Console**: Keep it open to see detailed logs and errors
- **Network Tab**: Monitor API calls to understand the flow

---

## 🎉 Success Criteria

You've successfully tested the application if:
1. ✅ You can generate a complete script
2. ✅ You can generate images for the script
3. ✅ You can generate voice narration
4. ✅ You can render a final video
5. ✅ You can download or upload the video
6. ✅ All UI interactions work smoothly
7. ✅ Error messages are clear and helpful

---

**Happy Testing! 🚀**

