'use client';

import { useDroppable } from '@dnd-kit/core';
import { Demand } from '@/types/demands';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
    id: string; // "a_fazer", "em_andamento", etc.
    title: string;
    demands: Demand[];
    color: string;
}

export default function KanbanColumn({ id, title, demands, color }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    return (
        <div className="flex flex-col h-full bg-white/40 dark:bg-zinc-900/40 rounded-3xl border border-white/20 dark:border-white/10 shadow-inner flex-1 min-w-[220px] max-w-xs backdrop-blur-md">
            {/* Header */}
            <div className={`p-4 border-b border-white/20 dark:border-white/10 rounded-t-3xl ${color} bg-opacity-30 dark:bg-opacity-20 backdrop-blur-sm`}>
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                    <span className="text-xs font-semibold bg-white dark:bg-zinc-900 bg-opacity-60 dark:bg-opacity-60 px-2 py-1 rounded-full text-slate-600 dark:text-zinc-300">
                        {demands.length}
                    </span>
                </div>
            </div>

            {/* Cards Container */}
            <div
                ref={setNodeRef}
                className={`flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar min-h-[150px] transition-colors ${isOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''
                    }`}
            >
                {demands.map(demand => (
                    <KanbanCard key={demand.id} demand={demand} />
                ))}
                {demands.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-300 dark:text-zinc-600 text-sm border-2 border-dashed border-slate-200 dark:border-white/10 rounded-lg">
                        Solte aqui
                    </div>
                )}
            </div>
        </div>
    );
}

