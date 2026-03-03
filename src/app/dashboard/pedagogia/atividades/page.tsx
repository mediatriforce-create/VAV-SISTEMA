'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getEducationalActivities, uploadEducationalActivity } from '@/actions/pedagogia_fase2';
import type { EducationalActivity } from '@/types/pedagogia';

export default function AtividadesPage() {
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<EducationalActivity[]>([]);

    // Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    // Form Refs
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        loadActivities();
    }, []);

    const loadActivities = async () => {
        setLoading(true);
        const res = await getEducationalActivities();
        if (res.success && res.data) {
            setActivities(res.data);
        }
        setLoading(false);
    };

    const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setUploading(true);

        const formData = new FormData(e.currentTarget);
        const file = formData.get('file') as File;

        if (!file || file.size === 0) {
            setError('Por favor, selecione um arquivo válido.');
            setUploading(false);
            return;
        }

        const res = await uploadEducationalActivity(formData);

        if (res.success) {
            setIsUploadModalOpen(false);
            formRef.current?.reset();
            loadActivities(); // Recarregar lista
        } else {
            setError(res.message || 'Falha ao realizar upload.');
        }

        setUploading(false);
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'PDF': return 'picture_as_pdf';
            case 'Imagem': return 'image';
            case 'Texto': return 'description';
            default: return 'insert_drive_file';
        }
    };

    const getColorForType = (type: string) => {
        switch (type) {
            case 'PDF': return 'text-red-500 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-900/50';
            case 'Imagem': return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-900/50';
            default: return 'text-zinc-500 bg-zinc-50 dark:bg-zinc-500/10 border-zinc-200 dark:border-zinc-800';
        }
    };

    return (
        <div className="h-full flex flex-col min-h-0 bg-zinc-50/50 dark:bg-zinc-900/20 relative">
            {/* Header / Barra de Busca */}
            <div className="shrink-0 p-4 sm:p-6 border-b border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500">source</span>
                        Banco de Atividades
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">Repositório central de arquivos, links e materiais.</p>
                </div>

                <div className="flex w-full sm:w-auto gap-3">
                    <div className="relative flex-1 sm:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar atividades..."
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-emerald-500 rounded-xl outline-none text-sm transition-all"
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">upload</span>
                        <span className="hidden sm:block">Upload</span>
                    </motion.button>
                </div>
            </div>

            {/* Content Area / Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="aspect-square rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-20 h-20 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-zinc-400">cloud_off</span>
                        </div>
                        <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">Repositório Vazio</h3>
                        <p className="text-sm text-zinc-500 max-w-sm mb-6">Nenhum material encontrado. Faça o upload do seu primeiro PDF ou documento para usá-lo em seus planos de aula.</p>
                        <button onClick={() => setIsUploadModalOpen(true)} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all">Enviar Arquivo</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-10">
                        {activities.map(act => {
                            const mainAsset = act.assets?.[0];
                            const style = getColorForType(act.activity_type);

                            return (
                                <motion.div
                                    key={act.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 flex flex-col hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer group"
                                    onClick={() => mainAsset?.file_url ? window.open(mainAsset.file_url, '_blank') : null}
                                >
                                    {/* Ícone Grande */}
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 border ${style}`}>
                                        <span className="material-symbols-outlined text-3xl">
                                            {getIconForType(act.activity_type)}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-zinc-900 dark:text-white text-sm line-clamp-2 leading-tight mb-1" title={act.title}>
                                        {act.title}
                                    </h3>

                                    <p className="text-xs text-zinc-500 mb-4 line-clamp-1 flex-1">
                                        {mainAsset?.file_name || 'Link Externo'}
                                    </p>

                                    <div className="mt-auto border-t border-zinc-100 dark:border-zinc-700/50 pt-2 flex items-center justify-between text-[10px] font-bold text-zinc-400">
                                        <span>{act.activity_type}</span>
                                        <span className="truncate max-w-[80px]" title={act.teacher?.full_name}>{act.teacher?.full_name?.split(' ')[0] || 'Desconhecido'}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal de Upload */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                        >
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Enviar Atividade</h3>
                                <button onClick={() => setIsUploadModalOpen(false)} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500" disabled={uploading}>
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>

                            <form ref={formRef} onSubmit={handleUploadSubmit} className="p-6 flex flex-col gap-4">
                                {error && (
                                    <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Título da Atividade *</label>
                                    <input
                                        type="text" name="title" required placeholder="Ex: Lista de Frações"
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 text-sm"
                                        readOnly={uploading}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Descrição (Opcional)</label>
                                    <textarea
                                        name="description" rows={2} placeholder="Detalhes sobre a atividade..."
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 text-sm resize-none"
                                        readOnly={uploading}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Arquivo *</label>
                                    <div className="relative">
                                        <input
                                            type="file" name="file" required accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                            className="w-full text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-500/10 dark:file:text-emerald-400 dark:hover:file:bg-emerald-500/20 cursor-pointer"
                                            disabled={uploading}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit" disabled={uploading}
                                    className="w-full mt-4 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <><div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div> Enviando...</>
                                    ) : (
                                        <><span className="material-symbols-outlined text-lg">cloud_upload</span> Salvar Atividade</>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
