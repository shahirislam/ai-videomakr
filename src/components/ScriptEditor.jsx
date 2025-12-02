import React, { useState, useEffect, useRef } from 'react';
import { useScript } from '../context/ScriptContext';
import { useMedia } from '../context/MediaContext';
import { parseScriptIntoScenes } from '../utils/scriptUtils';
import { Edit3, Scissors, LayoutList } from 'lucide-react';
// Animation imports removed to prevent runtime errors

const ScriptEditor = () => {
    const containerRef = useRef(null);
    const { script, setScript, setScenes } = useScript();
    const { audioDuration } = useMedia();
    const [sceneCount, setSceneCount] = useState(5);

    useEffect(() => {
        if (script && containerRef.current) {
            // fadeInUp animation removed - was causing runtime errors
            // Auto-calculate reasonable scene count
            const words = script.split(/\s+/).length;
            setSceneCount(Math.max(3, Math.ceil(words / 50)));
        }
    }, [script]);

    const handleParse = () => {
        const scenes = parseScriptIntoScenes(script, sceneCount, audioDuration);
        setScenes(scenes);
        // Scroll to next section
        setTimeout(() => {
            const nextSection = document.getElementById('image-generator');
            if (nextSection) nextSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    if (!script) return null;

    return (
        <div ref={containerRef} className="glass-card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -z-10" />

            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
                    <Edit3 size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Script Editor</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Refine your story and break it into scenes</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                    <textarea
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        className="relative w-full h-80 px-6 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 focus:border-purple-500 outline-none font-mono text-sm leading-relaxed resize-y shadow-sm hover:shadow-md transition-all"
                        placeholder="Your generated script will appear here..."
                    />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex-1 w-full">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <LayoutList size={16} />
                            Number of Scenes
                        </label>
                        <input
                            type="number"
                            value={sceneCount}
                            onChange={(e) => setSceneCount(parseInt(e.target.value))}
                            min="1"
                            max="50"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 focus:border-purple-500 outline-none transition-all shadow-sm hover:shadow-md"
                        />
                        <p className="text-xs text-gray-500 mt-1">Recommended: {Math.ceil(script.split(/\s+/).length / 50)} scenes based on length</p>
                    </div>
                    <button
                        onClick={handleParse}
                        className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 min-h-[44px]"
                    >
                        <Scissors size={20} />
                        Parse into Scenes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScriptEditor;
