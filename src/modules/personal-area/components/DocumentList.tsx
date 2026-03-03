'use client';

import { motion } from 'framer-motion';
import { PersonalDocument, DocumentCategory } from '../types';

interface DocumentListProps {
    documents: PersonalDocument[];
    onPreview: (doc: PersonalDocument) => void;
}

const categoryConfig: Record<DocumentCategory, { icon: string, colorClass: string, label: string }> = {
    payslip: { icon: 'request_quote', colorClass: 'text-emerald-500 bg-emerald-500/10', label: 'Holerite' },
    contract: { icon: 'history_edu', colorClass: 'text-amber-500 bg-amber-500/10', label: 'Contrato' },
    id_card: { icon: 'badge', colorClass: 'text-indigo-500 bg-indigo-500/10', label: 'Documento Civil' },
    other: { icon: 'description', colorClass: 'text-zinc-500 bg-zinc-500/10', label: 'Outros' }
};

export function DocumentList({ documents, onPreview }: DocumentListProps) {
    if (documents.length === 0) {
        return (
            <div className="w-full py-16 flex flex-col items-center justify-center bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-3xl border border-zinc-200 dark:border-white/5">
                <span className="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-700 mb-4">folder_open</span>
                <p className="text-zinc-500 font-medium">Seu cofre está vazio.</p>
                <p className="text-sm text-zinc-400 mt-1">Faça o upload do seu primeiro documento confidencial.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map((doc, idx) => {
                const config = categoryConfig[doc.category] || categoryConfig.other;
                const ext = doc.storage_path.split('.').pop()?.toUpperCase() || 'FILE';

                return (
                    <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => onPreview(doc)}
                        className="group cursor-pointer flex flex-col p-5 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.04)] transition-all hover:-translate-y-1 relative overflow-hidden"
                    >
                        {/* Ext. Badge */}
                        <div className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 transition-colors group-hover:bg-zinc-200 dark:group-hover:bg-white/20">
                            {ext}
                        </div>

                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${config.colorClass} transition-transform group-hover:scale-110`}>
                            <span className="material-symbols-outlined text-3xl">{config.icon}</span>
                        </div>

                        <h4 className="font-bold text-zinc-800 dark:text-zinc-100 truncate w-full pr-8" title={doc.title}>
                            {doc.title}
                        </h4>

                        <div className="flex items-center justify-between mt-auto pt-3">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{config.label}</span>
                            <span className="text-xs text-zinc-400">
                                {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
