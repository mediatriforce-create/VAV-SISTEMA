'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (note: string) => Promise<void>;
    action: 'approve' | 'reject';
    itemName: string;
}

export default function ReviewModal({ isOpen, onClose, onSubmit, action, itemName }: ReviewModalProps) {
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const isApprove = action === 'approve';
    const Icon = isApprove ? CheckCircle2 : XCircle;
    const colorClass = isApprove ? 'text-emerald-500' : 'text-red-500';
    const btnClass = isApprove
        ? 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500/50'
        : 'bg-red-500 hover:bg-red-600 focus:ring-red-500/50';

    const handleSubmit = async () => {
        // If rejecting, a note is usually required or at least highly encouraged. 
        // We'll just enforce it loosely or let the caller decide, but we require it if rejecting.
        if (!isApprove && !note.trim()) {
            alert('Por favor, informe o motivo da rejeição.');
            return;
        }

        setLoading(true);
        try {
            await onSubmit(note);
            setNote('');
        } finally {
            setLoading(false);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-opacity-10 dark:bg-opacity-20 ${isApprove ? 'bg-emerald-500 text-emerald-600' : 'bg-red-500 text-red-600'}`}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 dark:text-white">
                                        {isApprove ? 'Aprovar Demanda' : 'Rejeitar Demanda'}
                                    </h3>
                                    <p className="text-xs text-zinc-500 truncate max-w-[250px]">{itemName}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 flex flex-col gap-4">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                {isApprove
                                    ? 'A demanda será marcada como Finalizada.'
                                    : 'A demanda voltará para testes/revisão com a cor vermelha.'}
                                <br />Você pode adicionar uma nota ou feedback para a equipe (opcional para aprovação, obrigatório para rejeição).
                            </p>

                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Escreva sua observação aqui..."
                                className="w-full h-32 p-3 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow resize-none"
                            />
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3 bg-zinc-50 dark:bg-zinc-900/50">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || (!isApprove && !note.trim())}
                                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${btnClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                                {isApprove ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
