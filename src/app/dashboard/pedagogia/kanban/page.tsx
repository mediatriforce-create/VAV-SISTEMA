'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext, DragEndEvent, DragOverlay, DragStartEvent,
    PointerSensor, useSensor, useSensors, useDroppable, useDraggable
} from '@dnd-kit/core';
import { getKanbanCards, createKanbanCard, updateKanbanCardStatus, deleteKanbanCard, getMyClasses } from '@/actions/pedagogia';
import type { PedKanbanCard, Class, KanbanColumnStatus } from '@/types/pedagogia';

const COLUMNS: { id: KanbanColumnStatus; title: string; color: string; icon: string }[] = [
    { id: 'backlog', title: 'Backlog', color: 'from-slate-400 to-slate-500', icon: 'inbox' },
    { id: 'planejado', title: 'Planejado', color: 'from-blue-400 to-blue-600', icon: 'event' },
    { id: 'andamento', title: 'Em Andamento', color: 'from-amber-400 to-orange-500', icon: 'pending' },
    { id: 'concluido', title: 'Concluído', color: 'from-emerald-400 to-green-600', icon: 'check_circle' },
];

const CARD_TYPES = ['Atividade de aula', 'Organização', 'Evento especial', 'Outro'];

// ---- CARD COMPONENT (draggable) ----
function KanbanCardItem({ card, onDelete }: { card: PedKanbanCard; onDelete: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: card.id,
        data: card,
    });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 999 : 1,
        position: 'relative' as const,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <motion.div
                layout
                className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
            >
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white leading-snug">{card.title}</h4>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all shrink-0"
                    >
                        <span className="material-symbols-outlined text-base">close</span>
                    </button>
                </div>
                {card.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">{card.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                    {card.card_type && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
                            {card.card_type}
                        </span>
                    )}
                    {card.due_date && (
                        <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">calendar_today</span>
                            {new Date(card.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                    )}
                    {(card.classes || []).map(c => (
                        <span key={c.id} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {c.name}
                        </span>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

// ---- COLUMN COMPONENT (droppable) ----
function KanbanColumn({ col, cards, onDelete }: { col: typeof COLUMNS[0]; cards: PedKanbanCard[]; onDelete: (id: string) => void }) {
    const { setNodeRef, isOver } = useDroppable({ id: col.id });

    return (
        <div className="flex flex-col h-full min-w-[300px] w-full max-w-[340px] shrink-0">
            {/* Header */}
            <div className={`bg-gradient-to-r ${col.color} rounded-t-2xl px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-white/90 text-lg">{col.icon}</span>
                    <h3 className="font-bold text-white text-sm">{col.title}</h3>
                </div>
                <span className="text-xs font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full">{cards.length}</span>
            </div>

            {/* Body */}
            <div
                ref={setNodeRef}
                className={`flex-1 bg-zinc-50 dark:bg-zinc-900/50 rounded-b-2xl border border-t-0 border-zinc-200 dark:border-zinc-800 p-3 space-y-3 overflow-y-auto transition-all ${isOver ? 'ring-2 ring-inset ring-emerald-400/30 bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}
            >
                {cards.map(card => (
                    <KanbanCardItem key={card.id} card={card} onDelete={onDelete} />
                ))}
                {cards.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-300 dark:text-zinc-600 text-xs">
                        Arraste cards aqui
                    </div>
                )}
            </div>
        </div>
    );
}

// ---- MAIN PAGE ----
export default function PedagogiaKanbanPage() {
    const [cards, setCards] = useState<PedKanbanCard[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [activeCard, setActiveCard] = useState<PedKanbanCard | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formType, setFormType] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formDate, setFormDate] = useState('');
    const [formClassIds, setFormClassIds] = useState<string[]>([]);
    const [formColumn, setFormColumn] = useState<KanbanColumnStatus>('backlog');
    const [submitting, setSubmitting] = useState(false);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => {
        Promise.all([getKanbanCards(), getMyClasses()]).then(([k, c]) => {
            if (k.success && k.data) setCards(k.data);
            if (c.success && c.data) setClasses(c.data);
            setLoading(false);
        });
    }, []);

    const handleDragStart = (e: DragStartEvent) => setActiveCard(e.active.data.current as PedKanbanCard);

    const handleDragEnd = async (e: DragEndEvent) => {
        const { active, over } = e;
        if (over && active.id !== over.id) {
            const cardId = active.id as string;
            const newStatus = over.id as KanbanColumnStatus;
            setCards(prev => prev.map(c => c.id === cardId ? { ...c, column_status: newStatus } : c));
            await updateKanbanCardStatus(cardId, newStatus);
        }
        setActiveCard(null);
    };

    const handleCreate = async () => {
        if (!formTitle.trim()) return;
        setSubmitting(true);
        const res = await createKanbanCard({
            title: formTitle,
            card_type: formType || undefined,
            description: formDesc || undefined,
            due_date: formDate || undefined,
            column_status: formColumn,
            class_ids: formClassIds.length > 0 ? formClassIds : undefined,
        });
        if (res.success && res.data) {
            setCards(prev => [...prev, { ...res.data!, classes: classes.filter(c => formClassIds.includes(c.id)) }]);
        }
        resetForm();
        setSubmitting(false);
        setShowModal(false);
    };

    const handleDelete = async (id: string) => {
        setCards(prev => prev.filter(c => c.id !== id));
        await deleteKanbanCard(id);
    };

    const resetForm = () => {
        setFormTitle(''); setFormType(''); setFormDesc(''); setFormDate(''); setFormClassIds([]); setFormColumn('backlog');
    };

    const toggleClass = (id: string) => {
        setFormClassIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col min-h-0 p-4 sm:p-6">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Quadro de Tarefas</h2>
                    <p className="text-xs text-zinc-500">Organize as tarefas pedagógicas da equipe</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setShowModal(true)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Novo Card
                </motion.button>
            </div>

            {/* Kanban Board */}
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex-1 min-h-0 flex gap-5 overflow-x-auto pb-2 items-stretch">
                    {COLUMNS.map(col => (
                        <KanbanColumn key={col.id} col={col} cards={cards.filter(c => c.column_status === col.id)} onDelete={handleDelete} />
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

            {/* Modal Criar Card */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg max-h-[90vh] flex flex-col"
                        >
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white">Novo Card</h3>
                            </div>
                            <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Título *</label>
                                    <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: Atividade de leitura 1º ano"
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 text-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Coluna</label>
                                        <select value={formColumn} onChange={e => setFormColumn(e.target.value as KanbanColumnStatus)}
                                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-sm">
                                            {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Tipo</label>
                                        <select value={formType} onChange={e => setFormType(e.target.value)}
                                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-sm">
                                            <option value="">Nenhum</option>
                                            {CARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Data alvo</label>
                                    <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Descrição</label>
                                    <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={3} placeholder="Breve descrição..."
                                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-sm resize-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Turma(s)</label>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                        {classes.map(c => (
                                            <button key={c.id} type="button" onClick={() => toggleClass(c.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${formClassIds.includes(c.id)
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                                                    : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-emerald-300'
                                                    }`}
                                            >
                                                {c.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">Cancelar</button>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCreate} disabled={submitting || !formTitle.trim()}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-50">
                                    {submitting ? 'Criando...' : 'Criar Card'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
