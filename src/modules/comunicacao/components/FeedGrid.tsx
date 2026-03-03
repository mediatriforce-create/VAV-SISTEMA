'use client';

import { CommunicationPost } from '@/types/communication';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedGridProps {
    posts: CommunicationPost[];
    onSelect: (post: CommunicationPost) => void;
}

export default function FeedGrid({ posts, onSelect }: FeedGridProps) {
    if (posts.length === 0) return (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-gray-800/30 rounded-2xl border border-slate-200/50 dark:border-gray-700/50 backdrop-blur-sm">
            <span className="material-icons text-5xl text-slate-300 dark:text-gray-600 mb-4">image_not_supported</span>
            <span className="text-slate-500 dark:text-gray-400 font-medium">Nenhum post no feed ainda.</span>
        </div>
    );

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1 md:gap-3">
            {posts.map((post) => (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    key={post.id}
                    onClick={() => onSelect(post)}
                    className="relative aspect-square bg-slate-200/50 dark:bg-gray-800/50 group cursor-pointer overflow-hidden rounded-md md:rounded-xl shadow-sm hover:shadow-lg flex items-center justify-center border border-slate-200/20"
                >
                    {/* If video/reel shown in feed, show thumbnail or video */}
                    {post.type === 'reel' ? (
                        <video src={post.media_url} preload="metadata" muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <img
                            src={post.media_url}
                            alt={post.title}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <span className="text-white font-bold text-sm md:text-base tracking-wide transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out">{post.title}</span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
