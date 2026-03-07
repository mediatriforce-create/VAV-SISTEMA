'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Loader2, X, Upload } from 'lucide-react';

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    folderId: string | null;
    onSuccess: () => void;
}

export default function FileUploadModal({ isOpen, onClose, folderId, onSuccess }: FileUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    if (!isOpen) return null;

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            // Store in a flat bucket structure or folders? Supabase storage supports simulating folders with paths.
            // Let's use id-based prefixes to avoid collisions but keep it simple.
            const filePath = `${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('communication_files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get URL
            const { data: { publicUrl } } = supabase.storage
                .from('communication_files')
                .getPublicUrl(filePath);

            // 3. Insert into DB
            const { error: dbError } = await supabase
                .from('communication_files')
                .insert({
                    name: file.name,
                    folder_id: folderId,
                    file_url: publicUrl,
                    size_bytes: file.size,
                    mime_type: file.type
                });

            if (dbError) throw dbError;

            onSuccess();
            onClose();
            setFile(null);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Erro ao fazer upload.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-2xl w-full max-w-sm flex flex-col max-h-[85vh]">
                <div className="shrink-0 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Upload de Arquivo</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleUpload} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-4">
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                            <Upload size={32} />
                            <span className="text-sm font-medium">
                                {file ? file.name : 'Clique para selecionar'}
                            </span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !file}
                        className="w-full bg-primary dark:bg-amber-500 text-white dark:text-zinc-900 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
