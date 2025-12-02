import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ScriptGenerator from '../components/ScriptGenerator';
import ScriptEditor from '../components/ScriptEditor';
import ImageGenerator from '../components/ImageGenerator';
import VoiceGenerator from '../components/VoiceGenerator';
import VideoRenderer from '../components/VideoRenderer';

const AppPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans">
            {/* App Navbar */}
            <nav className="fixed w-full top-0 z-50 glass border-b border-white/20 dark:border-gray-800/50">
                <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                            <Video size={20} strokeWidth={2.5} />
                        </div>
                        <span className="font-heading font-bold text-xl sm:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                            StoryVid AI
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {user?.name || 'User'}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 min-h-[44px] text-sm sm:text-base flex items-center gap-2"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main App Area */}
            <main className="w-full bg-gray-50 dark:bg-gray-900 min-h-screen pt-20">
                <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-24 max-w-6xl">
                    <div className="space-y-8 sm:space-y-12">
                        <ScriptGenerator />
                        <ScriptEditor />
                        <ImageGenerator />
                        <VoiceGenerator />
                        <VideoRenderer />
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AppPage;

