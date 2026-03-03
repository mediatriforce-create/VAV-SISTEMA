'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Loader2, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AssetUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AssetUploadModal({ isOpen, onClose }: AssetUploadModalProps) {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    if (!isOpen) return null;

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload file to Storage
            const { error: uploadError } = await supabase.storage
                .from('communication_media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('communication_media')
                .getPublicUrl(filePath);

            // 3. Insert metadata into DB
            const { error: dbError } = await supabase
                .from('communication_assets')
                .insert({
                    title,
                    image_url: publicUrl,
                    description: 'Uploaded via Gallery', // Optional
                });

            if (dbError) throw dbError;

            router.refresh();
            onClose();
            setTitle('');
            setFile(null);
        } catch (error) {
            console.error('Error uploading:', error);
            alert('Erro ao fazer upload. Verifique o console.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
                <div className="shrink-0 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Nova Arte</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleUpload} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            placeholder="Ex: Post Instagram Dia das Mães"
                            required
                        />
                    </div>

                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                            <Upload size={32} />
                            <span className="text-sm font-medium">
                                {file ? file.name : 'Clique para selecionar a imagem'}
                            </span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={uploading || !file || !title}
                        className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Fazer Upload'}
                    </button>
                </form>
            </div>
        </div>
    );
}
