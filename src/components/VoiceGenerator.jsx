import React, { useState, useRef, useEffect } from 'react';
import { useScript } from '../context/ScriptContext';
import { useMedia } from '../context/MediaContext';
import { useUI } from '../context/UIContext';
import { VOICES, VOICE_PROVIDERS, API_BASE_URL } from '../utils/constants';
import { Mic, Play, Pause, Volume2, Loader2, Music } from 'lucide-react';

// Module-level debug
console.log('🟢 VoiceGenerator module loading...');
console.log('🟢 API_BASE_URL:', API_BASE_URL);

// Animation imports removed to fix "u is not a function" error
// Animations are non-critical UI enhancements

// Direct API call to avoid import issues
const generateVoice = async (text, voiceId = 'aMSt68OGf4xUZAnLpTU8', voiceSettings = {}) => {
    const response = await fetch(`${API_BASE_URL}/api/generate-voice`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text,
            voice_id: voiceId,
            voice_settings: voiceSettings
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    // The backend returns { audio_url: "..." } or similar
    // Return the audio URL from the response
    return data.audio_url || data.url || data.audioUrl || data;
};

const VoiceGenerator = () => {
    const containerRef = useRef(null);
    const audioRef = useRef(null);
    const { script } = useScript();
    const {
        generatedAudioUrl, setGeneratedAudioUrl,
        setAudioDuration,
        isGeneratingVoice, setIsGeneratingVoice
    } = useMedia();
    const { setLoading } = useUI();

    const [provider, setProvider] = useState(VOICE_PROVIDERS.ELEVENLABS);
    const [selectedVoiceId, setSelectedVoiceId] = useState(VOICES[VOICE_PROVIDERS.ELEVENLABS][0].id);
    const [isPlaying, setIsPlaying] = useState(false);

    // Animation effect removed - was causing runtime errors
    // useEffect(() => {
    //     if (script && containerRef.current) {
    //         // fadeInUp animation removed
    //     }
    // }, [script]);

    const handleGenerateVoice = async () => {
        console.log('🚀 handleGenerateVoice CALLED!');
        console.log('🚀 script exists:', !!script);
        console.log('🚀 generateVoice function type:', typeof generateVoice);

        if (!script) {
            console.log('⚠️ No script, returning early');
            return;
        }

        console.log('✅ Starting voice generation...');

        setIsGeneratingVoice(true);
        setLoading(prev => ({ ...prev, voice: true }));

        try {
            const response = await generateVoice(script, selectedVoiceId, provider);
            // Backend returns { audioUrl: "...", audio: "...", ... }
            const audioUrl = response.audioUrl || response.audio_url || response.url || response;
            setGeneratedAudioUrl(audioUrl);

            // Get duration
            const audio = new Audio(audioUrl);
            audio.onloadedmetadata = () => {
                setAudioDuration(audio.duration);
            };
        } catch (error) {
            console.error('Error generating voice:', error);
            alert('Failed to generate voice: ' + error.message);
        } finally {
            setIsGeneratingVoice(false);
            setLoading(prev => ({ ...prev, voice: false }));
        }
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    if (!script) return null;

    return (
        <div ref={containerRef} className="glass-card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -z-10" />

            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm">
                    <Mic size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Voiceover</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Give your story a voice</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Voice Provider
                        </label>
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            {Object.values(VOICE_PROVIDERS).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setProvider(p)}
                                    className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all min-h-[44px]
                                        ${provider === p
                                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Voice
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {VOICES[provider].map((voice) => (
                                <button
                                    key={voice.id}
                                    onClick={() => setSelectedVoiceId(voice.id)}
                                    className={`p-3 rounded-xl border text-left transition-all hover:shadow-md
                                        ${selectedVoiceId === voice.id
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500 shadow-sm'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:-translate-y-0.5'}`}
                                >
                                    <div className="font-medium text-gray-900 dark:text-white">{voice.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{voice.gender} • {voice.accent || 'Standard'}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center space-y-6">
                    <button
                        onClick={handleGenerateVoice}
                        disabled={isGeneratingVoice}
                        className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform flex items-center justify-center gap-3 min-h-[56px]
                            ${isGeneratingVoice
                                ? 'bg-gray-400 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98]'}`}
                    >
                        {isGeneratingVoice ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                <span>Synthesizing Voice...</span>
                            </>
                        ) : (
                            <>
                                <Volume2 size={24} />
                                <span>Generate Voiceover</span>
                            </>
                        )}
                    </button>

                    {generatedAudioUrl && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">
                                        <Music size={20} />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">Generated Audio</div>
                                        <div className="text-xs text-gray-500">Ready to use</div>
                                    </div>
                                </div>
                                <button
                                    onClick={togglePlay}
                                    className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-green-500/30 min-w-[48px] min-h-[48px]"
                                >
                                    {isPlaying ? <Pause size={20} /> : <Play size={20} ml={1} />}
                                </button>
                            </div>
                            <audio
                                ref={audioRef}
                                src={generatedAudioUrl}
                                onEnded={() => setIsPlaying(false)}
                                className="hidden"
                            />
                            {/* Fake waveform visualization */}
                            <div className="flex items-center gap-1 h-8">
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-green-500/30 rounded-full transition-all duration-300"
                                        style={{
                                            height: isPlaying ? `${Math.random() * 100}%` : '20%',
                                            opacity: isPlaying ? 1 : 0.5
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoiceGenerator;
