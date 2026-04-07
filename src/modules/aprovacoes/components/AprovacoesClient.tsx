'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApprovalSubmission } from '@/types/demands';
import { reviewSubmission } from '@/actions/approvals';

const STATUS_CONFIG = {
    pending:  { label: 'Aguardando',  color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
    approved: { label: 'Aprovado',    color: 'bg-green-500/15 text-green-400 border-green-500/25' },
    rejected: { label: 'Recusado',    color: 'bg-red-500/15 text-red-400 border-red-500/25' },
};

const SECTOR_LABELS: Record<string, string> = {
    comunicacao: 'Comunicação',
    pedagogia: 'Pedagogia',
    administracao: 'Administração',
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'agora';
    if (m < 60) return `${m}min atrás`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h atrás`;
    const d = Math.floor(h / 24);
    return d < 7 ? `${d}d atrás` : new Date(dateStr).toLocaleDateString('pt-BR');
}

interface ReviewModalProps {
    submission: ApprovalSubmission;
    onClose: () => void;
    onReviewed: (id: string, status: 'approved' | 'rejected') => void;
}

function ReviewModal({ submission, onClose, onReviewed }: ReviewModalProps) {
    const [notes, setNotes] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleReview = (status: 'approved' | 'rejected') => {
        startTransition(async () => {
            await reviewSubmission(submission.id, status, notes);
            onReviewed(submission.id, status);
            onClose();
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="p-5 border-b border-zinc-100 dark:border-white/10 flex items-start justify-between gap-3">
                    <div>
                        <h3 className="font-extrabold text-zinc-900 dark:text-white flex items-center gap-2 text-base">
                            <span className="material-symbols-outlined text-primary text-lg">task_alt</span>
                            Revisar entrega
                        </h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{submission.demand?.title ?? 'Demanda sem título'}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors shrink-0">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
                    {/* Submitter */}
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-white/8">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 flex items-center justify-center text-sm font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
                            {submission.submitter?.full_name?.charAt(0) ?? '?'}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{submission.submitter?.full_name ?? 'Desconhecido'}</p>
                            <p className="text-xs text-zinc-400">{timeAgo(submission.created_at)}</p>
                        </div>
                    </div>

                    {/* Justification */}
                    {submission.justification_text && (
                        <div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Justificativa</p>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 rounded-xl p-3 border border-zinc-200 dark:border-white/8">
                                {submission.justification_text}
                            </p>
                        </div>
                    )}

                    {/* Files */}
                    {submission.file_urls && submission.file_urls.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Anexos ({submission.file_urls.length})</p>
                            <div className="flex flex-wrap gap-2">
                                {submission.file_urls.map((url, i) => {
                                    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
                                    return (
                                        <a
                                            key={i}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-primary/40 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm text-zinc-400">{isImage ? 'image' : 'description'}</span>
                                            Arquivo {i + 1}
                                            <span className="material-symbols-outlined text-xs text-zinc-400">open_in_new</span>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Review notes */}
                    <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Observações (opcional)</p>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Feedback para quem enviou..."
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 rounded-xl outline-none focus:border-primary text-sm resize-none transition-colors"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-zinc-100 dark:border-white/10 flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => handleReview('rejected')}
                        disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/25 px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-red-100 dark:hover:bg-red-500/15 transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">cancel</span>
                        Recusar
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => handleReview('approved')}
                        disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-green-500/25 disabled:opacity-50 transition-colors"
                    >
                        {isPending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <span className="material-symbols-outlined text-base">check_circle</span>
                        )}
                        Aprovar
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}

interface Props {
    initialSubmissions: ApprovalSubmission[];
    canReview: boolean;
}

export default function AprovacoesClient({ initialSubmissions, canReview }: Props) {
    const [submissions, setSubmissions] = useState(initialSubmissions);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [selected, setSelected] = useState<ApprovalSubmission | null>(null);

    const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter);
    const pendingCount = submissions.filter(s => s.status === 'pending').length;

    const handleReviewed = (id: string, status: 'approved' | 'rejected') => {
        setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    };

    return (
        <div className="max-w-3xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                        Aprovações
                        {pendingCount > 0 && (
                            <span className="text-sm font-bold bg-yellow-500/15 text-yellow-500 border border-yellow-500/25 px-2 py-0.5 rounded-full">{pendingCount}</span>
                        )}
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Entregas enviadas para revisão</p>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl mb-6 w-fit">
                {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        {f === 'all' ? 'Todos' : f === 'pending' ? 'Aguardando' : f === 'approved' ? 'Aprovados' : 'Recusados'}
                    </button>
                ))}
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-zinc-300 dark:text-zinc-700 mb-3">task_alt</span>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                        {filter === 'pending' ? 'Nenhuma entrega aguardando revisão.' : 'Nenhum resultado.'}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <AnimatePresence initial={false}>
                        {filtered.map(sub => {
                            const cfg = STATUS_CONFIG[sub.status];
                            return (
                                <motion.div
                                    key={sub.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.97 }}
                                    layout
                                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/8 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                                                {sub.demand?.sector && (
                                                    <span className="text-[10px] font-semibold text-zinc-400">{SECTOR_LABELS[sub.demand.sector] ?? sub.demand.sector}</span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-zinc-900 dark:text-white text-sm truncate">{sub.demand?.title ?? 'Demanda'}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-zinc-500">{sub.submitter?.full_name ?? 'Usuário'}</span>
                                                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                                <span className="text-xs text-zinc-400">{timeAgo(sub.created_at)}</span>
                                            </div>
                                            {sub.justification_text && (
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">{sub.justification_text}</p>
                                            )}
                                            {sub.file_urls && sub.file_urls.length > 0 && (
                                                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">attach_file</span>
                                                    {sub.file_urls.length} anexo(s)
                                                </p>
                                            )}
                                            {sub.review_notes && (
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 italic">Feedback: "{sub.review_notes}"</p>
                                            )}
                                        </div>
                                        {canReview && sub.status === 'pending' && (
                                            <motion.button
                                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                onClick={() => setSelected(sub)}
                                                className="shrink-0 flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">rate_review</span>
                                                Revisar
                                            </motion.button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Review Modal */}
            <AnimatePresence>
                {selected && (
                    <ReviewModal
                        submission={selected}
                        onClose={() => setSelected(null)}
                        onReviewed={handleReviewed}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
