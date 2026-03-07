'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createMeetingAction } from '@/actions/meetings';
import { Meeting } from '@/types/meeting';

interface CreateMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (meeting: Meeting) => void;
}

export default function CreateMeetingModal({ isOpen, onClose, onSuccess }: CreateMeetingModalProps) {
    const [isPending, startTransition] = useTransition();
    const [errorMsg, setErrorMsg] = useState('');

    // Estados do Form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        startTransition(async () => {
            const res = await createMeetingAction({
                title,
                description,
                date,
                start_time: startTime,
                end_time: endTime,
            });

            if (res.success && res.data) {
                onSuccess(res.data as Meeting);
                setTitle('');
                setDescription('');
                setDate('');
                setStartTime('');
                setEndTime('');
                onClose();
            } else {
                setErrorMsg(res.message || 'Ocorreu um erro ao agendar.');
            }
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay Escuro com leve desfoque */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 py-10 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-surface-base dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-white/10 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-secondary-dark flex items-center justify-center text-white shadow-md">
                                        <span className="material-symbols-outlined text-xl">event_upcoming</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Nova Reunião</h2>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Gera um link do Google Meet automaticamente</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-2xl">close</span>
                                </button>
                            </div>

                            {/* Formulário - Ãrea Scrollável */}
                            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-hidden p-6 custom-scrollbar">
                                <form id="meeting-form" onSubmit={handleSubmit} className="space-y-5">

                                    {errorMsg && (
                                        <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">error</span>
                                            {errorMsg}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                            Título da Reunião
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Ex: Alinhamento Estratégico"
                                            className="input-modern bg-zinc-100 dark:bg-black/50 border border-zinc-200 dark:border-white/5"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                            Descrição <span className="text-zinc-400 font-normal">(Opcional)</span>
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Pauta da reunião..."
                                            className="input-modern bg-zinc-100 dark:bg-black/50 border border-zinc-200 dark:border-white/5 resize-none w-full"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                                Data
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="input-modern bg-zinc-100 dark:bg-black/50 border border-zinc-200 dark:border-white/5 text-zinc-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                                    Início
                                                </label>
                                                <input
                                                    type="time"
                                                    required
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                    className="input-modern bg-zinc-100 dark:bg-black/50 border border-zinc-200 dark:border-white/5 px-3 text-zinc-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                                    Término
                                                </label>
                                                <input
                                                    type="time"
                                                    required
                                                    value={endTime}
                                                    onChange={(e) => setEndTime(e.target.value)}
                                                    className="input-modern bg-zinc-100 dark:bg-black/50 border border-zinc-200 dark:border-white/5 px-3 text-zinc-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                </form>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/20 flex gap-3 justify-end shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isPending}
                                    className="px-6 py-3 rounded-lg font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    form="meeting-form"
                                    disabled={isPending}
                                    className="px-8 py-3 rounded-lg font-bold bg-secondary dark:bg-amber-500 hover:bg-secondary-dark text-white dark:text-zinc-900 shadow-lg shadow-secondary/30 transition-all flex items-center justify-center min-w-[140px]"
                                >
                                    {isPending ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        'Agendar'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

