'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, AlignLeft, AlertCircle } from 'lucide-react';
import type { Demand } from '@/types/demands';
import type { PedKanbanCard } from '@/types/pedagogia';

interface DemandDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    // We accept partial fields common to Demand and PedKanbanCard, or just pass a generic object
    data: {
        title: string;
        description?: string | null;
        due_date?: string | null;
        assigneeName?: string;
        coordination_note?: string | null;
        is_rejected?: boolean;
    } | null;
}

export default function DemandDetailsModal({ isOpen, onClose, data }: DemandDetailsModalProps) {
    if (!data) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white leading-tight pr-4">
                                {data.title}
                            </h3>
                            <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors shrink-0">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body - scrollable */}
                        <div className="p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

                            {/* Rejection Note */}
                            {data.is_rejected && data.coordination_note && (
                                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex gap-3">
                                    <div className="text-red-500 mt-0.5 shrink-0"><AlertCircle size={20} /></div>
                                    <div>
                                        <h4 className="text-red-800 dark:text-red-400 font-bold text-sm mb-1">Motivo da Rejeição (Coordenação)</h4>
                                        <p className="text-red-700 dark:text-red-300 text-sm whitespace-pre-wrap">{data.coordination_note}</p>
                                    </div>
                                </div>
                            )}

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {data.assigneeName && (
                                    <div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                                            <User size={14} /> Responsável
                                        </div>
                                        <div className="text-sm text-zinc-900 dark:text-zinc-300 font-medium">
                                            {data.assigneeName}
                                        </div>
                                    </div>
                                )}
                                {data.due_date && (
                                    <div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                                            <Calendar size={14} /> Prazo / Data
                                        </div>
                                        <div className="text-sm text-zinc-900 dark:text-zinc-300 font-medium">
                                            {new Date(data.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {data.description && (
                                <div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                                        <AlignLeft size={14} /> Descrição
                                    </div>
                                    <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                        {data.description}
                                    </div>
                                </div>
                            )}

                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
