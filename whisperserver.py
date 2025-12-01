"""
Self-Hosted Whisper Transcription Server
FREE unlimited audio transcription using OpenAI's open-source Whisper model

Installation:
    pip install openai-whisper flask flask-cors

Usage:
    python whisper-server.py

Then update your Node.js server to call http://localhost:5000/transcribe
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import tempfile
import os
import base64
import time

app = Flask(__name__)
CORS(app)  # Allow requests from your Node.js server

# Choose model size based on your hardware:
# "tiny"   - Fastest, lowest accuracy (39 MB, ~1 GB RAM)
# "base"   - Good balance (74 MB, ~1 GB RAM) ⭐ RECOMMENDED FOR MOST
# "small"  - Better accuracy (244 MB, ~2 GB RAM)
# "medium" - High accuracy (769 MB, ~5 GB RAM)
# "large"  - Best accuracy (1550 MB, ~10 GB RAM) - Requires GPU for reasonable speed

MODEL_SIZE = "tiny"  # Change this to: tiny, base, small, medium, or large

print("═══════════════════════════════════════════════════════════")
print("🎤 Self-Hosted Whisper Transcription Server")
print("═══════════════════════════════════════════════════════════")
print(f"📦 Loading Whisper model: {MODEL_SIZE}")
print("⏳ This may take a minute on first run...")

model = whisper.load_model(MODEL_SIZE)

print("✅ Whisper model loaded successfully!")
print(f"📊 Model: {MODEL_SIZE}")
print("🌐 Server ready to accept transcription requests")
print("═══════════════════════════════════════════════════════════\n")

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """
    Transcribe audio from base64 data
    
    Request body:
    {
        "audioData": "data:audio/mp3;base64,..." or just base64 string
    }
    
    Response:
    {
        "success": true,
        "transcription": "transcribed text here",
        "model": "base",
        "duration": 1.23
    }
    """
    start_time = time.time()
    temp_path = None
    
    try:
        data = request.get_json()
        
        if not data or 'audioData' not in data:
            return jsonify({'error': 'No audioData provided'}), 400
        
        # Extract base64 audio data
        audio_base64 = data['audioData']
        if ',' in audio_base64:
            audio_base64 = audio_base64.split(',')[1]
        
        # Decode base64 to bytes
        print(f"📥 Receiving audio data...")
        audio_bytes = base64.b64decode(audio_base64)
        audio_size_mb = len(audio_bytes) / (1024 * 1024)
        print(f"   Size: {audio_size_mb:.2f} MB")
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_audio:
            temp_audio.write(audio_bytes)
            temp_path = temp_audio.name
        
        print(f"🎤 Transcribing with model: {MODEL_SIZE}")
        print(f"   File: {temp_path}")
        
        # Transcribe using Whisper
        result = model.transcribe(temp_path, fp16=False)  # fp16=False for CPU compatibility
        
        duration = time.time() - start_time
        
        print(f"✅ Transcription complete!")
        print(f"   Duration: {duration:.2f} seconds")
        print(f"   Text length: {len(result['text'])} characters")
        print(f"   Text preview: {result['text'][:100]}...")
        print()
        
        return jsonify({
            'success': True,
            'transcription': result['text'],
            'model': MODEL_SIZE,
            'duration': round(duration, 2),
            'language': result.get('language', 'unknown')
        })
    
    except Exception as e:
        print(f"❌ Transcription error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'model': MODEL_SIZE,
        'message': 'Whisper server is running'
    })

if __name__ == '__main__':
    print("🚀 Starting server on http://localhost:5000")
    print("💡 Send POST requests to: http://localhost:5000/transcribe")
    print("💡 Health check: http://localhost:5000/health")
    print("\n⚠️  Keep this terminal open while using transcription\n")
    
    app.run(
        host='0.0.0.0',  # Allow connections from Node.js server
        port=5000,
        debug=False  # Set to True for development
    )