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
        <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 min-w-[280px] w-full max-w-sm">
            {/* Header */}
            <div className={`p-4 border-b border-slate-200 rounded-t-xl ${color} bg-opacity-20`}>
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">{title}</h3>
                    <span className="text-xs font-semibold bg-white bg-opacity-60 px-2 py-1 rounded-full text-slate-600">
                        {demands.length}
                    </span>
                </div>
            </div>

            {/* Cards Container */}
            <div
                ref={setNodeRef}
                className={`flex-1 p-3 space-y-3 overflow-y-auto min-h-[150px] transition-colors ${isOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''
                    }`}
            >
                {demands.map(demand => (
                    <KanbanCard key={demand.id} demand={demand} />
                ))}
                {demands.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-300 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                        Solte aqui
                    </div>
                )}
            </div>
        </div>
    );
}
