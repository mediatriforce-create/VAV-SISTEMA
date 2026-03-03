'use client';

import { CommunicationPost } from '@/types/communication';

interface StoriesBarProps {
    stories: CommunicationPost[];
    onSelect: (post: CommunicationPost) => void;
}

export default function StoriesBar({ stories, onSelect }: StoriesBarProps) {
    if (stories.length === 0) return null;

    return (
        <div className="flex gap-4 overflow-x-auto pb-2 pt-2">
            {/* New Story Button (Placeholder) */}
            <div className="flex flex-col items-center gap-1 cursor-pointer min-w-[60px]">
                <div className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center bg-slate-50 text-slate-400 text-xl font-light">
                    +
                </div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Novo</span>
            </div>

            {stories.map(story => (
                <div
                    key={story.id}
                    onClick={() => onSelect(story)}
                    className="flex flex-col items-center gap-1 cursor-pointer min-w-[60px] group"
                >
                    <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600 group-hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                            <img src={story.media_url} alt={story.title} loading="lazy" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 truncate w-14 text-center">{story.title}</span>
                </div>
            ))}
        </div>
    );
}
