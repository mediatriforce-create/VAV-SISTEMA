'use client';

import { CommunicationPost } from '@/types/communication';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReelsGridProps {
    reels: CommunicationPost[];
    onSelect: (post: CommunicationPost) => void;
}

export default function ReelsGrid({ reels, onSelect }: ReelsGridProps) {
    if (reels.length === 0) return (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-gray-800/30 rounded-2xl border border-slate-200/50 dark:border-gray-700/50 backdrop-blur-sm">
            <span className="material-icons text-5xl text-slate-300 dark:text-gray-600 mb-4">movie</span>
            <span className="text-slate-500 dark:text-gray-400 font-medium">Nenhum reel carregado.</span>
        </div>
    );

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
            {reels.map((reel) => (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    key={reel.id}
                    onClick={() => onSelect(reel)}
                    className="relative aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden group cursor-pointer shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-700/50"
                >
                    <video
                        src={reel.media_url}
                        preload="metadata"
                        muted playsInline
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-transparent">
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-full shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                            <Play className="text-white drop-shadow-md" size={32} fill="white" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-white text-sm font-bold truncate tracking-wide">{reel.title}</p>
                        <p className="text-white/70 text-xs mt-1 font-medium flex items-center gap-1">
                            <span className="material-icons text-[12px]">visibility</span>
                            {(Math.random() * 10).toFixed(1)}k
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
