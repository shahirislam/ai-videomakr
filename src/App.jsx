import React from 'react';

function App() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
            {/* Header */}
            <header className="fixed w-full top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-all duration-300">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
                            S
                        </div>
                        <span className="font-['Poppins'] font-bold text-xl tracking-tight">StoryVid AI</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        </button>
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing</a>
                            <a href="#" className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Library
                            </a>
                            <div className="relative group">
                                <button className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    Features
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="relative group">
                            <button className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:ring-2 hover:ring-indigo-500 transition-all">
                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-400 min-h-[600px] flex items-center py-20">
                <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-8">
                            <h1 className="font-['Poppins'] text-5xl md:text-6xl font-extrabold leading-tight text-white drop-shadow-2xl tracking-tight animate-slide-up-delay-1">
                                Create AI-Powered Videos in Minutes
                            </h1>
                            <p className="animate-slide-up-delay-2 mt-6 text-xl md:text-2xl text-white max-w-3xl mx-auto font-medium">
                                From idea to YouTube-ready video with AI script, images, and voice
                            </p>
                        </div>

                        {/* Credits and CTA Bar */}
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8 mt-12 shadow-2xl animate-on-load-delay-3">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6 flex-wrap justify-center">
                                    <div className="flex items-center gap-3">
                                        <span className="text-white/90 font-medium text-base">Credits Balance:</span>
                                        <span className="text-2xl font-bold text-white font-['Poppins']">198</span>
                                    </div>
                                    <span className="text-white/50 text-2xl hidden sm:block">|</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-white/90 font-medium text-base">Estimated Cost:</span>
                                        <span className="text-2xl font-bold text-white font-['Poppins']">0</span>
                                    </div>
                                </div>

                                <button className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 animate-scale-up-delay-1">
                                    <span>Start Creating</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Placeholder */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">React App Successfully Running!</h2>
                    <p className="text-gray-600 dark:text-gray-400">The hero section has been migrated. More components coming soon.</p>
                </div>
            </section>
        </div>
    );
}

export default App;
