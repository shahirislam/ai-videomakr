import React, { useState, useRef, useEffect } from 'react';
import { useScript } from '../context/ScriptContext';
import { useMedia } from '../context/MediaContext';
import { useUI } from '../context/UIContext';
import { ImageIcon, Palette, Loader2, Sparkles, Download, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../utils/constants.js';
import ProgressBar from './common/ProgressBar';

// Module-level debug
console.log('🟢 ImageGenerator module loading...');
console.log('🟢 API_BASE_URL:', API_BASE_URL);

// Animation imports removed to fix "u is not a function" error
// Animations are non-critical UI enhancements

// Direct API calls to avoid import issues
const generateImagePromptAPI = async (prompt, maxTokens = 500) => {
    const response = await fetch(`${API_BASE_URL}/api/chatgpt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt,
            max_tokens: maxTokens
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
};

const generateImageAPI = async (prompt, aspectRatio = '16:9', renderingSpeed = 'TURBO', styleType = 'REALISTIC') => {
    const response = await fetch(`${API_BASE_URL}/api/generate-image`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt,
            aspectRatio,
            renderingSpeed,
            styleType
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
};

// Image styles configuration
const IMAGE_STYLES = {
    cinematic: { name: 'Cinematic' },
    realistic: { name: 'Realistic' },
    'black & white': { name: 'Black & White' },
    'oil painting': { name: 'Oil Painting' },
    '3d model': { name: '3D Model' },
    drawing: { name: 'Drawing' },
    'comic book': { name: 'Comic Book' },
    anime: { name: 'Anime' },
    'pixel art': { name: 'Pixel Art' },
    'pop art': { name: 'Pop Art' },
    watercolor: { name: 'Watercolor' },
    'stick-style': { name: 'Stick Style' },
    'naruto anime': { name: 'Naruto Anime' },
    'game of thrones': { name: 'Game of Thrones' }
};

// Inline getIdeogramStyleType function to avoid import issues
const getIdeogramStyleType = (styleName) => {
    const styleMap = {
        'realistic': 'REALISTIC',
        'cinematic': 'REALISTIC',
        'black & white': 'REALISTIC',
        'oil painting': 'GENERAL',
        '3d model': 'RENDER_3D',
        'drawing': 'GENERAL',
        'comic book': 'GENERAL',
        'anime': 'ANIME',
        'pixel art': 'GENERAL',
        'pop art': 'GENERAL',
        'watercolor': 'GENERAL',
        'stick-style': 'DESIGN',
        'stick style': 'DESIGN',
        'naruto anime': 'ANIME',
        'naruto-anime': 'ANIME',
        'game of thrones': 'REALISTIC',
        'game-of-thrones': 'REALISTIC'
    };
    const lowerStyle = styleName.toLowerCase();
    return styleMap[lowerStyle] || 'GENERAL';
};

const ImageGenerator = () => {
    const containerRef = useRef(null);
    const scenesRef = useRef(null);
    const { scenes } = useScript();
    const { images, setImages, isGeneratingImages, setIsGeneratingImages, imageGenerationProgress, setImageGenerationProgress } = useMedia();
    const { setLoading } = useUI();

    const [selectedStyle, setSelectedStyle] = useState('cinematic');
    const [showPrompts, setShowPrompts] = useState(false);

    // Animation effect removed - was causing runtime errors
    // useEffect(() => {
    //     if (scenes.length > 0 && containerRef.current) {
    //         // fadeInUp animation removed
    //     }
    // }, [scenes]);

    // Animation effect removed - was causing runtime errors
    // useEffect(() => {
    //     if (images.length > 0 && scenesRef.current) {
    //         // staggerFadeIn animation removed
    //     }
    // }, [images]);

    const handleGenerateImages = async () => {
        console.log('🚀 handleGenerateImages CALLED!');
        console.log('🚀 scenes.length:', scenes.length);

        if (!scenes.length) {
            console.log('⚠️ No scenes, returning early');
            return;
        }

        console.log('✅ Starting image generation...');
        // Early validation - check imports at the very start
        try {
            if (typeof generateImagePromptAPI !== 'function') {
                throw new Error(`generateImagePromptAPI is ${typeof generateImagePromptAPI}, expected function`);
            }
            if (typeof generateImageAPI !== 'function') {
                throw new Error(`generateImageAPI is ${typeof generateImageAPI}, expected function`);
            }
            if (typeof getIdeogramStyleType !== 'function') {
                throw new Error(`getIdeogramStyleType is ${typeof getIdeogramStyleType}, expected function`);
            }
        } catch (error) {
            console.error('❌ Import validation failed:', error);
            alert(`Error: ${error.message}. Please refresh the page.`);
            return;
        }

        // Debug: Check if functions are imported correctly
        console.log('🔍 Debug - generateImagePromptAPI:', typeof generateImagePromptAPI);
        console.log('🔍 Debug - generateImageAPI:', typeof generateImageAPI);
        console.log('🔍 Debug - getIdeogramStyleType:', typeof getIdeogramStyleType);

        setIsGeneratingImages(true);
        setLoading(prev => ({ ...prev, images: true }));
        setImageGenerationProgress(0);

        try {
            const newImages = [...(images.length ? images : Array(scenes.length).fill({ status: 'pending', url: null }))];
            setImages(newImages);

            for (let i = 0; i < scenes.length; i++) {
                const scene = scenes[i];
                newImages[i] = { ...newImages[i], status: 'generating' };
                setImages([...newImages]);

                try {
                    // 1. Generate Prompt
                    const styleName = IMAGE_STYLES[selectedStyle]?.name || selectedStyle;
                    const promptText = `You are an expert at creating ULTRA-DETAILED, ACCURATE image prompts for ${styleName} style.

SCENE ${i + 1} TEXT:
${scene.text}

Create a detailed image prompt (55-75 words) that accurately represents this scene, including all characters, their interactions, the setting, and key visual details. Match emotions, colors, actions, and props exactly as described in the scene text.

Output ONLY the final prompt - no analysis or additional text.`;

                    console.log(`🎨 Generating prompt for scene ${i + 1}...`);

                    // Ensure function is available before calling
                    if (!generateImagePromptAPI || typeof generateImagePromptAPI !== 'function') {
                        throw new Error('generateImagePromptAPI is not available');
                    }

                    const promptResponse = await generateImagePromptAPI(promptText, 1000);
                    let prompt = '';
                    // Handle Claude format: { content: [{ text: "..." }] }
                    if (promptResponse?.content && promptResponse.content[0] && promptResponse.content[0].text) {
                        prompt = promptResponse.content[0].text;
                    }
                    // Handle ChatGPT-compatible format: { choices: [{ message: { content: "..." } }] }
                    else if (promptResponse?.choices && promptResponse.choices[0] && promptResponse.choices[0].message && promptResponse.choices[0].message.content) {
                        prompt = promptResponse.choices[0].message.content;
                    }
                    // Handle direct string response
                    else if (typeof promptResponse === 'string') {
                        prompt = promptResponse;
                    } else {
                        console.error('Invalid response format:', promptResponse);
                        throw new Error('Invalid response format from image prompt API');
                    }
                    prompt = prompt.replace(/^["']|["']$/g, '').trim();
                    newImages[i].prompt = prompt;

                    // 2. Generate Image
                    console.log(`🖼️ Generating image for scene ${i + 1} with style: ${selectedStyle}...`);

                    // Ensure function is available before calling
                    if (!generateImageAPI || typeof generateImageAPI !== 'function') {
                        throw new Error('generateImageAPI is not available');
                    }

                    const styleType = getIdeogramStyleType(selectedStyle);
                    console.log(`📐 Style type: ${styleType}`);
                    const imageResponse = await generateImageAPI(prompt, '16:9', 'TURBO', styleType);
                    console.log(`✅ Image response received for scene ${i + 1}:`, imageResponse);

                    let imageUrl = '';
                    if (imageResponse?.data && imageResponse.data[0] && imageResponse.data[0].url) {
                        imageUrl = imageResponse.data[0].url;
                    } else {
                        console.error('Invalid image response:', imageResponse);
                        throw new Error('No image URL found in response');
                    }

                    newImages[i] = { status: 'completed', url: imageUrl, prompt };
                } catch (error) {
                    console.error(`Error generating image for scene ${i + 1}:`, error);
                    newImages[i] = { status: 'error', error: error.message || 'Unknown error occurred' };
                }

                setImages([...newImages]);
                setImageGenerationProgress(((i + 1) / scenes.length) * 100);
            }

        } catch (error) {
            console.error('Error in image generation flow:', error);
            alert('Failed to generate images: ' + error.message);
        } finally {
            setIsGeneratingImages(false);
            setLoading(prev => ({ ...prev, images: false }));
        }
    };

    if (!scenes.length) return null;

    return (
        <div id="image-generator" ref={containerRef} className="glass-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl -z-10" />

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center text-pink-600 dark:text-pink-400 shadow-sm">
                        <ImageIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Visuals</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Generate cinematic scenes with AI</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Palette className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value)}
                            className="pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:ring-offset-0 focus:border-pink-500 outline-none appearance-none cursor-pointer transition-all shadow-sm hover:shadow-md min-h-[44px]"
                        >
                            {Object.entries(IMAGE_STYLES).map(([key, style]) => (
                                <option key={key} value={key}>{style.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <button
                    onClick={handleGenerateImages}
                    disabled={isGeneratingImages}
                    className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform flex items-center justify-center gap-3 min-h-[56px]
                        ${isGeneratingImages
                            ? 'bg-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-pink-500/20 hover:shadow-xl hover:shadow-pink-500/30 hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                    {isGeneratingImages ? (
                        <>
                            <Loader2 className="animate-spin" size={24} />
                            <span>Generating Scenes... {Math.round((images.filter(i => i.status === 'completed').length / scenes.length) * 100)}%</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={24} />
                            <span>Generate All Images</span>
                        </>
                    )}
                </button>

                {/* Progress Bar */}
                {isGeneratingImages && (
                    <div className="mt-4">
                        <ProgressBar
                            progress={imageGenerationProgress}
                            status={`Generating scene images...`}
                            current={images.filter(i => i.status === 'completed').length}
                            total={scenes.length}
                            variant="info"
                            showPercentage={true}
                        />
                    </div>
                )}
            </div>

            {images.length > 0 && (
                <div ref={scenesRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scenes.map((scene, index) => {
                        const img = images[index] || {};
                        return (
                            <div key={index} className="group relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-video border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                                {img.status === 'completed' ? (
                                    <>
                                        <img
                                            src={img.url}
                                            alt={`Scene ${index + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                            <p className="text-white text-sm line-clamp-2 mb-2">{scene.text}</p>
                                            <div className="flex gap-2">
                                                <button className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white/30 transition-all hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center">
                                                    <Download size={16} />
                                                </button>
                                                <button className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white/30 transition-all hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center">
                                                    <RefreshCw size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : img.status === 'generating' ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                        <Loader2 className="animate-spin mb-2" size={32} />
                                        <span className="text-sm font-medium">Creating Scene {index + 1}...</span>
                                    </div>
                                ) : img.status === 'error' ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-4 text-center">
                                        <span className="text-sm font-medium">Generation Failed</span>
                                        <button className="mt-2 text-xs underline">Retry</button>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600">
                                        <ImageIcon size={32} />
                                    </div>
                                )}

                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-xs font-bold text-white">
                                    Scene {index + 1}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ImageGenerator;
