'use client';

import { useState, useEffect } from 'react';
import { CommunicationPost } from '@/types/communication';
import { Plus, Grid, Disc, Clapperboard, Briefcase } from 'lucide-react'; // Icons
import FeedGrid from '@/modules/comunicacao/components/FeedGrid';
import StoriesBar from '@/modules/comunicacao/components/StoriesBar';
import ReelsGrid from '@/modules/comunicacao/components/ReelsGrid';
import SmartUploadModal from '@/modules/comunicacao/components/SmartUploadModal';
import MediaDetailModal from '@/modules/comunicacao/components/MediaDetailModal';
import { motion, AnimatePresence } from 'framer-motion';

interface GalleryClientPageProps {
    initialPosts: CommunicationPost[];
}

export default function GalleryClientPage({ initialPosts }: GalleryClientPageProps) {
    const [activeTab, setActiveTab] = useState<'feed' | 'reels' | 'stories'>('feed');
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<CommunicationPost | null>(null);

    // Local state for immediate UI updates
    const [posts, setPosts] = useState<CommunicationPost[]>(initialPosts);

    // Sync state when Server Actions complete and trigger router.refresh()
    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

    // Filter data
    const feedPosts = posts.filter(p => p.type === 'post');
    const stories = posts.filter(p => p.type === 'story');
    const reels = posts.filter(p => p.type === 'reel');

    const handleUploadSuccess = (newPost: CommunicationPost) => {
        setPosts(prev => [newPost, ...prev]);
    };
    return (
        <div className="space-y-3 md:space-y-4 w-full max-w-6xl mx-auto pb-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md p-4 rounded-2xl border border-slate-200/50 dark:border-gray-700/50 shadow-sm">
                <div className="flex-shrink-0">
                    <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Galeria Viva a Vida</h2>
                    <p className="text-slate-500 dark:text-gray-400 text-xs md:text-sm mt-0.5 font-medium">Acervo oficial de mídias e registros.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    {/* Tabs Movidas para dentro do Header */}
                    <div className="flex justify-center gap-1 md:gap-2 p-1 bg-slate-100/50 dark:bg-gray-900/50 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-gray-700/50 w-full md:w-auto overflow-x-auto no-scrollbar">
                        {[
                            { id: 'feed', icon: Grid, label: 'PUBLICAÇÕES' },
                            { id: 'reels', icon: Clapperboard, label: 'REELS' },
                            { id: 'stories', icon: Disc, label: 'STORIES' }
                        ].map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as 'feed' | 'reels' | 'stories')}
                                    className="relative flex items-center gap-1.5 px-3 py-1.5 text-[11px] md:text-xs font-bold uppercase tracking-wide rounded-lg transition-colors shrink-0"
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="galleryTab"
                                            className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-slate-200/50 dark:border-gray-600/50"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <span className={`relative z-10 flex items-center gap-1.5 ${isActive ? 'text-primary dark:text-blue-400' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'}`}>
                                        <Icon size={14} /> {tab.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsUploadOpen(true)}
                        className="flex flex-shrink-0 items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-5 py-2 rounded-xl shadow-md hover:shadow-lg transition-all font-bold text-sm h-full w-full sm:w-auto"
                    >
                        <Plus size={18} />
                        Novo Upload
                    </motion.button>
                </div>
            </div>

            {/* Stories (Always visible on top if Feed is active, or generic place) */}
            <div className="hidden">
                <StoriesBar stories={stories} onSelect={setSelectedPost} />
            </div>

            {/* Content */}
            <div className="min-h-[250px] relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        {activeTab === 'feed' && <FeedGrid posts={feedPosts} onSelect={setSelectedPost} />}
                        {activeTab === 'reels' && <ReelsGrid reels={reels} onSelect={setSelectedPost} />}
                        {activeTab === 'stories' && <ReelsGrid reels={stories} onSelect={setSelectedPost} />}
                    </motion.div>
                </AnimatePresence>
            </div>

            <SmartUploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUploadSuccess={handleUploadSuccess}
            />
            <MediaDetailModal
                post={selectedPost}
                onClose={() => setSelectedPost(null)}
                onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
            />
        </div>
    );
}
