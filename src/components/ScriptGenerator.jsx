import React, { useState, useRef, useEffect } from 'react';
import { useScript } from '../context/ScriptContext';
import { useUI } from '../context/UIContext';
import { useToast } from '../context/ToastContext';
import { generateScript } from '../services/scriptService';
import { DEFAULTS } from '../utils/constants';
import { Sparkles, Settings, FileText, ChevronDown, Loader2, Upload, X } from 'lucide-react';
// Animation imports removed to prevent runtime errors

const ScriptGenerator = () => {
    const containerRef = useRef(null);
    const {
        title, setTitle,
        setScript,
        wordCount, setWordCount,
        isGenerating, setIsGenerating
    } = useScript();

    const { setLoading } = useUI();
    const { showSuccess, showError, showWarning } = useToast();

    const [additionalContext, setAdditionalContext] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState(null);
    const fileInputRef = useRef(null);

    // Animation effect removed - was causing runtime errors
    // useEffect(() => {
    //     fadeInUp(containerRef.current);
    // }, []);

    const handleGenerate = async () => {
        if (!title) {
            showWarning('Please enter a title');
            return;
        }

        setIsGenerating(true);
        setLoading(prev => ({ ...prev, script: true }));

        try {
            const mainWordCount = wordCount || DEFAULTS.DEFAULT_WORD_COUNT;
            let userPrompt = `Write a ${mainWordCount}-word story for this title: "${title}".`;

            if (additionalContext) {
                userPrompt += ` Additional context: ${additionalContext}`;
            }

            const fullPrompt = `NARRATION RULES - STRICTLY FOLLOW:
- Write in pure narrative form only - NO subtitles, headings, or section breaks
- Do NOT use any special characters like #, *, _, or formatting symbols
- Do NOT include [Scene descriptions] or (parenthetical notes)
- NO chapter markers, timestamps, or labeled segments
- Write as one continuous flowing story from beginning to end
- Use natural paragraph breaks only
- Write EXACTLY as it should be spoken aloud by a narrator

STORYTELLING RULES FOR 90%+ RETENTION:
- Start with an immediate hook in the first 5 seconds that creates curiosity or shock
- Use the "open loop" technique - raise questions early and answer them later
- Build tension constantly - every paragraph should make viewers want to know "what happens next"
- Include unexpected plot twists every 30-45 seconds of narration
- Use cliffhangers before natural pause points
- Add specific, vivid details that paint mental pictures
- Include emotional moments that connect with viewers
- Use short, punchy sentences mixed with longer descriptive ones for rhythm
- Employ "pattern interrupts" - sudden changes in tone, pace, or revelation
- Foreshadow future events to create anticipation: "Little did they know..." or "But that was before..."
- End paragraphs with questions or incomplete thoughts that pull readers forward
- Use power words: "suddenly", "but then", "without warning", "the truth was"
- Build to a climactic reveal or satisfying conclusion
- Pace the story like a rollercoaster - tension, release, bigger tension
- Make every sentence earn its place - cut all filler
- Create relatable stakes - make audience care about what happens

USER REQUEST:
${userPrompt}`;

            const data = await generateScript(fullPrompt, 8000);

            if (data && data.content && data.content[0] && data.content[0].text) {
                setScript(data.content[0].text);
            } else {
                throw new Error('Invalid response from script generation API');
            }

        } catch (error) {
            console.error('Error generating script:', error);
            showError('Failed to generate script: ' + error.message);
        } finally {
            setIsGenerating(false);
            setLoading(prev => ({ ...prev, script: false }));
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.txt')) {
            showWarning('Please upload a .txt file');
            return;
        }

        // Validate file size (max 1MB)
        if (file.size > 1024 * 1024) {
            showWarning('File size must be less than 1MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                parseUploadedScript(content, file.name);
            } catch (error) {
                console.error('Error reading file:', error);
                showError('Failed to read file. Please try again.');
            }
        };
        reader.onerror = () => {
            showError('Error reading file. Please try again.');
        };
        reader.readAsText(file);
    };

    const parseUploadedScript = (content, fileName) => {
        // Try to extract title from first line or filename
        let scriptContent = content.trim();
        let extractedTitle = '';

        // Check if first line looks like a title (short, no punctuation at end, or has "Title:" prefix)
        const lines = scriptContent.split('\n').filter(line => line.trim());

        if (lines.length > 0) {
            const firstLine = lines[0].trim();

            // Check for "Title:" prefix
            if (firstLine.toLowerCase().startsWith('title:')) {
                extractedTitle = firstLine.substring(6).trim();
                scriptContent = lines.slice(1).join('\n').trim();
            }
            // Check if first line is short and looks like a title
            else if (firstLine.length < 100 && !firstLine.match(/[.!?]$/)) {
                // Check if second line is empty or starts with capital (likely paragraph start)
                if (lines.length > 1 && (lines[1].trim() === '' || /^[A-Z]/.test(lines[1].trim()))) {
                    extractedTitle = firstLine;
                    scriptContent = lines.slice(1).join('\n').trim();
                }
            }
        }

        // If no title extracted, use filename without extension
        if (!extractedTitle && fileName) {
            extractedTitle = fileName.replace(/\.txt$/i, '').replace(/[_-]/g, ' ');
        }

        // Set the script and title
        if (extractedTitle) {
            setTitle(extractedTitle);
        }

        setScript(scriptContent);
        setUploadedFileName(fileName);

        // Show success message
        showSuccess(`Script uploaded successfully!${extractedTitle ? ` Title: ${extractedTitle}` : ''}`);
        setTimeout(() => {
            showSuccess('You can now proceed to edit and parse it into scenes.');
        }, 500);
    };

    const handleRemoveUpload = () => {
        setUploadedFileName(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Debug: Log when component renders
    useEffect(() => {
        console.log('ScriptGenerator: Component rendered, upload section should be visible');
    }, []);

    return (
        <div ref={containerRef} className="glass-card relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10 group-hover:bg-indigo-500/10 transition-colors duration-500" />

            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <FileText size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Script Generation</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Start your video creation journey here</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* File Upload Section - Prominent - MUST BE VISIBLE */}
                <div className="p-8 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border-2 border-dashed border-indigo-400 dark:border-indigo-500 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all shadow-lg" style={{ display: 'block !important', visibility: 'visible !important' }}>
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-200 dark:bg-indigo-900/50 mb-4 shadow-md">
                            <Upload className="text-indigo-700 dark:text-indigo-300" size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            Upload Your Script
                        </h3>
                        <p className="text-base text-gray-700 dark:text-gray-300 mb-6 font-medium">
                            Have a script ready? Upload a .txt file to get started instantly
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="script-upload"
                            />
                            <label
                                htmlFor="script-upload"
                                className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-3 text-lg"
                            >
                                <Upload size={24} />
                                Choose .txt File
                            </label>
                            {uploadedFileName && (
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800">
                                    <FileText size={18} />
                                    <span className="text-sm font-medium">{uploadedFileName}</span>
                                    <button
                                        onClick={handleRemoveUpload}
                                        className="ml-2 hover:bg-green-200 dark:hover:bg-green-900/50 rounded p-1 transition-colors"
                                        title="Remove file"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative flex items-center my-6">
                    <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                    <span className="px-4 text-sm text-gray-500 dark:text-gray-400 font-semibold bg-white dark:bg-gray-800">OR</span>
                    <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                </div>

                <div className="group/input">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">
                        Video Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., The Mystery of the Lost City"
                        className="w-full px-6 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-500 transition-all outline-none text-lg placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm hover:shadow-md"
                    />
                </div>

                <div>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                        <Settings size={16} />
                        {showSettings ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                        <ChevronDown size={16} className={`transform transition-transform duration-300 ${showSettings ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`grid transition-all duration-300 ease-in-out ${showSettings ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Target Word Count
                                    </label>
                                    <input
                                        type="number"
                                        value={wordCount || DEFAULTS.DEFAULT_WORD_COUNT}
                                        onChange={(e) => setWordCount(parseInt(e.target.value))}
                                        min="100"
                                        max="8000"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-500 outline-none transition-all shadow-sm hover:shadow-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Additional Context
                                    </label>
                                    <textarea
                                        value={additionalContext}
                                        onChange={(e) => setAdditionalContext(e.target.value)}
                                        placeholder="Any specific details, tone, or style instructions..."
                                        rows="3"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-500 outline-none resize-none transition-all shadow-sm hover:shadow-md"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !title}
                    className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform flex items-center justify-center gap-3 min-h-[56px]
                        ${isGenerating || !title
                            ? 'bg-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="animate-spin" size={24} />
                            <span>Generating Magic...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={24} />
                            <span>Generate Script</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ScriptGenerator;
