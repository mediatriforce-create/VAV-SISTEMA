'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DocumentCategory } from '../types';

interface UploadDropzoneProps {
    onUploadStart: () => void;
    onUploadComplete: (success: boolean, message?: string) => void;
    uploadAction: (formData: FormData, category: DocumentCategory, title: string) => Promise<any>;
}

export function UploadDropzone({ onUploadStart, onUploadComplete, uploadAction }: UploadDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState<DocumentCategory>('other');
    const [title, setTitle] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            if (!title) setTitle(droppedFile.name.split('.')[0]); // Auto-fill
        }
    }, [title]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            if (!title) setTitle(selected.name.split('.')[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !title) return;
        setIsUploading(true);
        onUploadStart();

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await uploadAction(formData, category, title);
            if (res.success) {
                setFile(null);
                setTitle('');
                setCategory('other');
                onUploadComplete(true);
            } else {
                onUploadComplete(false, res.message);
            }
        } catch (err: any) {
            onUploadComplete(false, err.message);
        } finally {
            setIsUploading(false);
        }
    };

    // Remove file
    const clearFile = () => {
        setFile(null);
        setTitle('');
    };

    return (
        <div className="w-full h-full p-6 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 flex flex-col gap-6">
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">Novo Documento</h3>

            {!file ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative w-full h-48 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden
                        ${isDragging
                            ? 'border-secondary/70 bg-secondary/5 dark:border-primary/70 dark:bg-primary/5 shadow-[inset_0_0_20px_rgba(59,130,246,0.15)] glow-ring'
                            : 'border-gray-400/50 hover:border-gray-500/80 bg-zinc-50/50 dark:bg-zinc-800/30'
                        }
                    `}
                >
                    <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploading}
                    />
                    <motion.span
                        animate={{ y: isDragging ? -5 : 0 }}
                        className="material-symbols-outlined text-[48px] text-zinc-400 dark:text-zinc-500 mb-3"
                    >
                        cloud_upload
                    </motion.span>
                    <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                        {isDragging ? 'Solte o arquivo aqui!' : 'Arraste ou clique para enviar'}
                    </p>
                    <p className="text-xs text-zinc-400 mt-2">Apenas PDF, JPG, PNG (Max 5MB)</p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full flex flex-col gap-4 p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10"
                >
                    {/* File Selected Preview */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">description</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-zinc-700 dark:text-zinc-200 truncate">{file.name}</p>
                            <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button onClick={clearFile} disabled={isUploading} className="w-8 h-8 rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 flex items-center justify-center text-zinc-500">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-zinc-500">Apelido do Arquivo</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
                                placeholder="Defina um nome de exibição..."
                                disabled={isUploading}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-zinc-500">Categoria (Cofre)</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                                className="w-full bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
                                disabled={isUploading}
                            >
                                <option value="payslip">Holerites e Recibos</option>
                                <option value="contract">Contratos de Trabalho</option>
                                <option value="id_card">Documentos Civis (RG/CPF)</option>
                                <option value="other">Outros Registros</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={isUploading || !title}
                        className="mt-4 w-full bg-secondary dark:bg-primary text-white dark:text-zinc-900 font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] hover:bg-[rgba(59,130,246,0.9)] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
                                Criptografando e Salvando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">lock</span>
                                Guardar no Cofre Seguro
                            </>
                        )}
                    </button>
                </motion.div>
            )}
        </div>
    );
}
