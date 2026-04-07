'use client';

import { useDraggable } from '@dnd-kit/core';
import { Demand } from '@/types/demands';
import DemandCard from '@/modules/coord/components/DemandCard';

interface KanbanCardProps {
    demand: Demand;
    onCardClick: (demand: Demand) => void;
}

export default function KanbanCard({ demand, onCardClick }: KanbanCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: demand.id,
        data: { ...demand },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 1,
        position: 'relative' as const,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <DemandCard demand={demand} onClick={!isDragging ? onCardClick : undefined} />
        </div>
    );
}
