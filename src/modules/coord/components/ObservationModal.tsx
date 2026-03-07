'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine, X, Loader2 } from 'lucide-react';
import { createCoordinationNote } from '@/modules/personal-area/actions/notes';
import toast from 'react-hot-toast';

interface TeamMember {
    id: string;
    full_name: string;
    role: string;
    avatar_url: string | null;
}

interface ObservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: TeamMember | null;
}

export function ObservationModal({ isOpen, onClose, member }: ObservationModalProps) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!member) return null;

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast.error('A observação não pode estar vazia.');
            return;
        }

        setIsSubmitting(true);
        const res = await createCoordinationNote({
            targetUserId: member.id,
            content: content.trim()
        });
        setIsSubmitting(false);

        if (res.success) {
            toast.success('Observação enviada com sucesso!');
            setContent('');
            onClose();
        } else {
            toast.error(res.message || 'Erro ao enviar observação.');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-white/50 dark:border-zinc-800"
                        >
                            {/* Header */}
                            <div className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <PenLine size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Nova Observação</h2>
                                        <p className="text-xs font-medium text-zinc-500 line-clamp-1">Para: {member.full_name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                    Mensagem
                                </label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={`Escreva um feedback, diretriz ou aviso para ${member.full_name.split(' ')[0]}...`}
                                    className="w-full h-32 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 custom-scrollbar"
                                />
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2 font-medium">
                                    Esta mensagem aparecerá no Mural da Coordenação dentro da Área Pessoal deste membro.
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="p-6 pt-4 bg-zinc-50 dark:bg-zinc-900 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !content.trim()}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <PenLine size={18} />}
                                    Enviar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
