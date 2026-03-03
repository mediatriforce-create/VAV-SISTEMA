'use client';

import { useState } from 'react';
import { Loader2, Upload, X, Check, Image as ImageIcon, FileText, FolderPlus } from 'lucide-react';

interface DriveUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentFolderId: string;
    predefinedFolders?: Record<string, string>;
    onUploadSubmit: (file: File, title: string, description: string, category: string, destinationFolderId: string) => Promise<boolean>;
}

const CATEGORIES = [
    { id: 'MANUAL', label: 'Pasta Atual' },
    { id: '1_ANO', label: '1º Ano' },
    { id: '2_ANO', label: '2º Ano' },
    { id: '3_ANO', label: '3º Ano' },
    { id: '4_ANO', label: '4º Ano' },
    { id: '5_ANO', label: '5º Ano' },
    { id: 'PNAB', label: 'PNAB' },
];

export default function DriveUploadModal({ isOpen, onClose, currentFolderId, predefinedFolders, onUploadSubmit }: DriveUploadModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('MANUAL');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) return;

        setUploading(true);

        // Determine destination folder id
        let destinationFolderId = currentFolderId;
        if (categoryId !== 'MANUAL' && predefinedFolders) {
            // map from 1_ANO to '1 ANO' key for predefined folders
            const folderKey = categoryId.replace('_', ' ');
            if (predefinedFolders[folderKey]) {
                destinationFolderId = predefinedFolders[folderKey];
            }
        }

        const success = await onUploadSubmit(file, title, description, categoryId, destinationFolderId);

        if (success) {
            setTitle('');
            setDescription('');
            setFile(null);
            setCategoryId('MANUAL');
            onClose();
        }

        setUploading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                <div className="shrink-0 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <Upload size={20} className="text-primary" />
                        Upload para o Drive
                    </h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleUpload} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {/* CATEGORY SELECTION */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Destino / Categoria Organizacional</label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map(cat => {
                                const isSelected = categoryId === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategoryId(cat.id)}
                                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${isSelected
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        {cat.id === 'MANUAL' ? <FolderPlus size={14} className="inline mr-1 -mt-0.5" /> : null}
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* FILE SELECTOR */}
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer relative group">
                        <input
                            type="file"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            required
                        />
                        <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-primary transition-colors">
                            {file ? (
                                <>
                                    <Check size={32} className="text-green-500" />
                                    <span className="text-sm font-bold text-slate-800 mt-2 truncate w-full px-4">{file.name}</span>
                                    <span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </>
                            ) : (
                                <>
                                    <Upload size={32} />
                                    <span className="text-sm font-medium mt-1">Clique ou arraste um arquivo</span>
                                    <span className="text-xs text-slate-400">Suporta imagens, vídeos e documentos</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* METADATA */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Título do Arquivo</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                placeholder="Ex: Projeto Integrador..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (Opcional)</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                placeholder="Adicione notas, links ou detalhes extras..."
                                rows={2}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={uploading || !file || !title}
                        className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
                    >
                        {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Fazer Upload e Organizar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
