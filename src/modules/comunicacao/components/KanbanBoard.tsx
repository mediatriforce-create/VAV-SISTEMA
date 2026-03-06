'use client';

import { useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import { Demand } from '@/types/demands';
import KanbanColumn from './KanbanColumn';
import DemandCard from '@/modules/coord/components/DemandCard';
import { createClient } from '@/lib/supabase';

interface KanbanBoardProps {
    initialDemands: Demand[];
}

const COLUMNS = [
    { id: 'a_fazer', title: 'A Fazer', color: 'bg-slate-200' },
    { id: 'em_andamento', title: 'Em Andamento', color: 'bg-yellow-200' },
    { id: 'revisao', title: 'Revisão', color: 'bg-purple-200' },
    { id: 'aprovacao', title: 'Esperando Aprovação', color: 'bg-violet-200' },
    { id: 'finalizado', title: 'Finalizado', color: 'bg-green-200' },
];

export default function KanbanBoard({ initialDemands }: KanbanBoardProps) {
    const [demands, setDemands] = useState<Demand[]>(initialDemands);
    const [activeDemand, setActiveDemand] = useState<Demand | null>(null);

    const supabase = createClient();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Prevent accidental drags on click
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDemand(event.active.data.current as Demand);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const demandId = active.id as string;
            const newStatus = over.id as string;

            // Optimistic UI Update
            setDemands(prev => prev.map(d =>
                d.id === demandId ? { ...d, status: newStatus as any } : d
            ));

            // Persist to Supabase
            // We know newStatus is one of the valid statuses because columns have those IDs
            const { error } = await supabase
                .from('demands')
                .update({ status: newStatus })
                .eq('id', demandId);

            if (error) {
                console.error('Failed to update demand status:', error);
                // Revert on error? Or just show toast. For now, log.
                alert('Erro ao atualizar status. Tente novamente.');
            }
        }

        setActiveDemand(null);
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6 overflow-x-auto custom-scrollbar pb-4 items-start custom-scrollbar">
                {COLUMNS.map(col => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        color={col.color}
                        demands={demands.filter(d => d.status === col.id)}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeDemand ? (
                    <div className="w-[300px] opacity-80 rotate-2 cursor-grabbing">
                        <DemandCard demand={activeDemand} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext >
    );
}

