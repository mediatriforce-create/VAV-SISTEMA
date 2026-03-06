'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';

interface ApprovalSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    /** For demands table */
    demandId?: string;
    /** For ped_kanban_cards table */
    pedCardId?: string;
    title: string;
}

export default function ApprovalSubmissionModal({
    isOpen, onClose, onSubmit, demandId, pedCardId, title
}: ApprovalSubmissionModalProps) {
    const [justification, setJustification] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!justification.trim() && files.length === 0) return;
        setUploading(true);

        try {
            // 1. Upload files to temp_approvals bucket
            const uploadedUrls: string[] = [];

            for (const file of files) {
                const timestamp = Date.now();
                let safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

                // Force image extension if missing
                if (file.type.startsWith('image/') && !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(safeName)) {
                    let ext = file.type.split('/')[1] || 'jpg';
                    if (ext === 'jpeg') ext = 'jpg';
                    safeName += `.${ext}`;
                }

                const filePath = `${demandId || pedCardId}/${timestamp}_${safeName}`;

                const { data, error } = await supabase.storage
                    .from('temp_approvals')
                    .upload(filePath, file, {
                        contentType: file.type || 'application/octet-stream',
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) {
                    console.error('Upload error:', error);
                    continue;
                }

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('temp_approvals')
                    .getPublicUrl(filePath);

                if (urlData?.publicUrl) {
                    uploadedUrls.push(urlData.publicUrl);
                }
            }

            // 2. Insert into approval_submissions
            const { error: insertError } = await supabase
                .from('approval_submissions')
                .insert({
                    demand_id: demandId || null,
                    ped_card_id: pedCardId || null,
                    justification_text: justification.trim() || null,
                    file_urls: uploadedUrls,
                });

            if (insertError) {
                console.error('Insert error:', insertError);
                alert('Erro ao enviar entrega. Tente novamente.');
                setUploading(false);
                return;
            }

            // 3. Success — trigger parent callback
            setJustification('');
            setFiles([]);
            setUploading(false);
            onSubmit();
        } catch (err) {
            console.error('Submission error:', err);
            alert('Erro inesperado. Tente novamente.');
            setUploading(false);
        }
    };

    const handleClose = () => {
        if (!uploading) {
            setJustification('');
            setFiles([]);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg max-h-[90vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-violet-500">upload_file</span>
                                Enviar para Aprovação
                            </h3>
                            <p className="text-xs text-zinc-500 mt-1 truncate">
                                {title}
                            </p>
                        </div>

                        {/* Body */}
                        <div className="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                            {/* Justification */}
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                                    Justificativa / Descrição da entrega
                                </label>
                                <textarea
                                    value={justification}
                                    onChange={e => setJustification(e.target.value)}
                                    rows={4}
                                    placeholder="Descreva o que está sendo entregue, o que foi feito, observações importantes..."
                                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-violet-500 text-sm resize-none"
                                />
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                                    Anexos (imagens, PDFs, etc.)
                                </label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-all"
                                >
                                    <span className="material-symbols-outlined text-3xl text-zinc-300 dark:text-zinc-600 mb-2">cloud_upload</span>
                                    <p className="text-xs text-zinc-400 font-medium">Clique para selecionar arquivos</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {/* File List */}
                            {files.length > 0 && (
                                <div className="space-y-2">
                                    {files.map((file, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-200 dark:border-zinc-700">
                                            <span className="material-symbols-outlined text-sm text-zinc-400">
                                                {file.type.startsWith('image/') ? 'image' : 'description'}
                                            </span>
                                            <span className="text-xs text-zinc-700 dark:text-zinc-300 flex-1 truncate font-medium">{file.name}</span>
                                            <span className="text-[10px] text-zinc-400">{(file.size / 1024).toFixed(0)}KB</span>
                                            <button
                                                onClick={() => removeFile(i)}
                                                className="text-zinc-400 hover:text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-base">close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                            <button
                                onClick={handleClose}
                                disabled={uploading}
                                className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                disabled={uploading || (!justification.trim() && files.length === 0)}
                                className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-violet-500/25 disabled:opacity-50 flex items-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-base">send</span>
                                        Enviar Entrega
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
