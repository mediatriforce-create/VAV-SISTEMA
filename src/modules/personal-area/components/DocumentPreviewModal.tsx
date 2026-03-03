'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PersonalDocument } from '../types';
import { getDocumentSignedUrl } from '../actions';

interface DocumentPreviewModalProps {
    document: PersonalDocument | null;
    onClose: () => void;
}

export function DocumentPreviewModal({ document, onClose }: DocumentPreviewModalProps) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        if (!document) {
            // Avoid synchronous setState during render phase by wrapping in microtask
            Promise.resolve().then(() => {
                if (isMounted) {
                    setSignedUrl(null);
                    setError(null);
                }
            });
            return;
        }

        async function fetchUrl() {
            setIsLoading(true);
            setError(null);
            const res = await getDocumentSignedUrl(document!.storage_path);
            if (isMounted) {
                if (res.success && res.signedUrl) {
                    setSignedUrl(res.signedUrl);
                } else {
                    setError('Falha de Segurança: Acesso Não Autorizado ou Expirado.');
                }
                setIsLoading(false);
            }
        }

        fetchUrl();

        return () => { isMounted = false; };
    }, [document]);

    const isImage = document?.storage_path.match(/\.(jpg|jpeg|png)$/i);

    return (
        <AnimatePresence>
            {document && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 sm:py-8 lg:p-12">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm shadow-black"
                    />

                    {/* Modal Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        transition={{ duration: 0.25, type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-5xl h-[90vh] bg-white dark:bg-zinc-900 shadow-2xl rounded-3xl overflow-hidden flex flex-col border border-zinc-200 dark:border-white/10 ring-1 ring-black/5"
                    >
                        {/* Interactive Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/10 shrink-0 bg-zinc-50/50 dark:bg-black/20 backdrop-blur-md z-10">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-12 h-12 rounded-xl bg-secondary/15 dark:bg-primary/10 flex items-center justify-center text-secondary dark:text-primary shrink-0 border border-secondary/20">
                                    <span className="material-symbols-outlined text-2xl">{isImage ? 'image' : 'picture_as_pdf'}</span>
                                </div>
                                <div className="flex flex-col truncate">
                                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 truncate pr-4" title={document.title}>
                                        {document.title}
                                    </h3>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                        Criptografado - Assinatura 60s
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {signedUrl && (
                                    <a
                                        href={signedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 hover:text-white dark:hover:text-zinc-900 hover:bg-secondary dark:hover:bg-primary transition-colors shadow-sm"
                                        title="Baixar Cópia Oiginal"
                                    >
                                        <span className="material-symbols-outlined text-sm">download</span>
                                    </a>
                                )}
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 bg-zinc-200/50 dark:bg-white/5 hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Content Viewer (Object URL Isolation) */}
                        <div className="flex-1 min-h-0 w-full bg-zinc-100/50 dark:bg-black/40 relative flex items-center justify-center overflow-auto custom-scrollbar p-4 md:p-8">
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-secondary dark:border-t-primary animate-spin"></div>
                                    <p className="text-sm text-zinc-500 font-semibold tracking-wide">Decodificando do Cofre Seguro...</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center gap-3 text-red-500 max-w-sm text-center p-8 bg-red-500/10 rounded-3xl border border-red-500/20">
                                    <span className="material-symbols-outlined text-6xl">lock_clock</span>
                                    <h4 className="font-bold text-xl mt-2">Acesso Expirado</h4>
                                    <p className="text-sm font-medium opacity-80">{error}</p>
                                </div>
                            ) : signedUrl ? (
                                isImage ? (
                                    <img src={signedUrl} alt={document.title} className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-zinc-200 dark:border-white/5 bg-white dark:bg-black/50" />
                                ) : (
                                    <iframe src={`${signedUrl}#toolbar=0&navpanes=0`} className="w-full h-full rounded-xl shadow-lg bg-white dark:bg-zinc-800 border-0" title={document.title} />
                                )
                            ) : null}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
