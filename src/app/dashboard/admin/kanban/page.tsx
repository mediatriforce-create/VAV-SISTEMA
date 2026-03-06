'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext, DragEndEvent, DragOverlay, DragStartEvent,
    PointerSensor, useSensor, useSensors, useDroppable, useDraggable
} from '@dnd-kit/core';
import { createClient } from '@/lib/supabase';
import type { Demand, DemandStatus, DemandPriority } from '@/types/demands';
import ApprovalSubmissionModal from '@/modules/shared/components/ApprovalSubmissionModal';

const COLUMNS: { id: DemandStatus; title: string; color: string; icon: string }[] = [
    { id: 'a_fazer', title: 'A Fazer', color: 'from-slate-400 to-slate-500', icon: 'inbox' },
    { id: 'em_andamento', title: 'Em Andamento', color: 'from-amber-400 to-orange-500', icon: 'pending' },
    { id: 'revisao', title: 'Revisão', color: 'from-blue-400 to-blue-600', icon: 'rate_review' },
    { id: 'aprovacao', title: 'Esperando Aprovação', color: 'from-purple-400 to-violet-600', icon: 'hourglass_top' },
    { id: 'finalizado', title: 'Finalizado', color: 'from-emerald-400 to-green-600', icon: 'check_circle' },
];

const PRIORITY_BADGES: Record<DemandPriority, { bg: string; text: string }> = {
    baixa: { bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600 dark:text-green-400' },
    media: { bg: 'bg-yellow-50 dark:bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400' },
    alta: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
};

// ---- CARD COMPONENT (draggable) ----
function DemandCardItem({ demand }: { demand: Demand }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: demand.id,
        data: demand,
    });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 999 : 1,
        position: 'relative' as const,
    } : undefined;

    const priority = PRIORITY_BADGES[demand.priority] || PRIORITY_BADGES.media;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <motion.div
                layout
                className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
            >
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white leading-snug">{demand.title}</h4>
                </div>
                {demand.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">{demand.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Priority */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priority.bg} ${priority.text}`}>
                        {demand.priority}
                    </span>
                    {/* Assignee */}
                    {demand.assignee?.full_name && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">person</span>
                            {demand.assignee.full_name}
                        </span>
                    )}
                    {/* Due date */}
                    {demand.due_date && (
                        <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">calendar_today</span>
                            {new Date(demand.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// ---- COLUMN COMPONENT (droppable) ----
function KanbanColumn({ col, demands }: { col: typeof COLUMNS[0]; demands: Demand[] }) {
    const { setNodeRef, isOver } = useDroppable({ id: col.id });

    return (
        <div className="flex flex-col h-full min-w-[300px] w-full max-w-[340px] shrink-0">
            {/* Header */}
            <div className={`bg-gradient-to-r ${col.color} rounded-t-2xl px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-white/90 text-lg">{col.icon}</span>
                    <h3 className="font-bold text-white text-sm">{col.title}</h3>
                </div>
                <span className="text-xs font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full">{demands.length}</span>
            </div>

            {/* Body */}
            <div
                ref={setNodeRef}
                className={`flex-1 bg-zinc-50 dark:bg-zinc-900/50 rounded-b-2xl border border-t-0 border-zinc-200 dark:border-zinc-800 p-3 space-y-3 overflow-y-auto custom-scrollbar transition-all ${isOver ? 'ring-2 ring-inset ring-emerald-400/30 bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}
            >
                {demands.map(demand => (
                    <DemandCardItem key={demand.id} demand={demand} />
                ))}
                {demands.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-300 dark:text-zinc-600 text-xs">
                        Arraste cards aqui
                    </div>
                )}
            </div>
        </div>
    );
}

// ---- MAIN PAGE ----
export default function KanbanPage() {
    const [demands, setDemands] = useState<Demand[]>([]);
    const [activeCard, setActiveCard] = useState<Demand | null>(null);
    const [loading, setLoading] = useState(true);
    const [approvalModal, setApprovalModal] = useState<{ demandId: string; title: string } | null>(null);
    const [pendingApproval, setPendingApproval] = useState<{ demandId: string; oldStatus: DemandStatus } | null>(null);

    const supabase = createClient();
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => {
        async function fetchDemands() {
            const { data } = await supabase
                .from('demands')
                .select(`
                    *,
                    assignee:assigned_to(full_name, avatar_url),
                    creator:created_by(full_name, avatar_url)
                `)
                .eq('sector', 'administracao') // << ADMIN SECTOR ONLY
                .order('created_at', { ascending: false });

            if (data) setDemands(data);
            setLoading(false);
        }
        fetchDemands();
    }, []);

    const handleDragStart = (e: DragStartEvent) => setActiveCard(e.active.data.current as Demand);

    const handleDragEnd = async (e: DragEndEvent) => {
        const { active, over } = e;
        if (over && active.id !== over.id) {
            const demandId = active.id as string;
            const newStatus = over.id as DemandStatus;
            const demand = active.data.current as Demand;

            // Intercept: if dropping on 'aprovacao', open submission modal
            if (newStatus === 'aprovacao') {
                setDemands(prev => prev.map(d => d.id === demandId ? { ...d, status: newStatus } : d));
                setPendingApproval({ demandId, oldStatus: demand.status });
                setApprovalModal({ demandId, title: demand.title });
                setActiveCard(null);
                return;
            }

            // Normal flow for other statuses
            setDemands(prev => prev.map(d => d.id === demandId ? { ...d, status: newStatus } : d));

            const { error } = await supabase
                .from('demands')
                .update({ status: newStatus })
                .eq('id', demandId);

            if (error) {
                console.error('Failed to update demand status:', error);
                setDemands(prev => prev.map(d => d.id === demandId ? { ...d, status: demand.status } : d));
            }
        }
        setActiveCard(null);
    };

    const handleApprovalSubmit = async () => {
        if (!pendingApproval) return;
        // Now persist the status change to 'aprovacao'
        const { error } = await supabase
            .from('demands')
            .update({ status: 'aprovacao' })
            .eq('id', pendingApproval.demandId);

        if (error) {
            console.error('Failed to update demand status:', error);
            setDemands(prev => prev.map(d => d.id === pendingApproval.demandId ? { ...d, status: pendingApproval.oldStatus } : d));
        }
        setApprovalModal(null);
        setPendingApproval(null);
    };

    const handleApprovalCancel = () => {
        if (pendingApproval) {
            // Revert the optimistic update
            setDemands(prev => prev.map(d => d.id === pendingApproval.demandId ? { ...d, status: pendingApproval.oldStatus } : d));
        }
        setApprovalModal(null);
        setPendingApproval(null);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center p-8 bg-slate-50 min-h-[500px]">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 w-full h-full min-h-0 bg-slate-50 p-4 md:p-6 overflow-hidden flex flex-col">
            <div className="shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="material-icons text-primary dark:text-blue-400">view_kanban</span>
                        Kanban da Administração
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Acompanhe e mova as demandas administrativas.
                    </p>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 min-h-0">
                <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="h-full flex gap-5 overflow-x-auto custom-scrollbar pb-2 items-stretch">
                        {COLUMNS.map(col => (
                            <KanbanColumn key={col.id} col={col} demands={demands.filter(d => d.status === col.id)} />
                        ))}
                    </div>

                    <DragOverlay>
                        {activeCard ? (
                            <div className="w-[300px] opacity-80 rotate-2 cursor-grabbing">
                                <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-xl">
                                    <h4 className="font-bold text-sm">{activeCard.title}</h4>
                                </div>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Approval Submission Modal */}
            <ApprovalSubmissionModal
                isOpen={!!approvalModal}
                onClose={handleApprovalCancel}
                onSubmit={handleApprovalSubmit}
                demandId={approvalModal?.demandId}
                title={approvalModal?.title || ''}
            />
        </div>
    );
}
