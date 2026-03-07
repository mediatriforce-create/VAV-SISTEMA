'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Loader2, Upload, X, Check, FileVideo, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PostType, YearCategory } from '@/types/communication';
import { backupGaleriaMediaToDrive } from '../actions';

interface SmartUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess?: (newPost: any) => void;
}

const POST_TYPES: { id: PostType; label: string; icon: any }[] = [
    { id: 'post', label: 'Feed', icon: ImageIcon },
    { id: 'story', label: 'Stories', icon: ImageIcon },
    { id: 'reel', label: 'Reels', icon: FileVideo },
];

const YEAR_CATEGORIES: { id: YearCategory; label: string }[] = [
    { id: '1_ANO', label: '1º Ano' },
    { id: '2_ANO', label: '2º Ano' },
    { id: '3_ANO', label: '3º Ano' },
    { id: 'PNAB', label: 'PNAB' },
];

export default function SmartUploadModal({ isOpen, onClose, onUploadSuccess }: SmartUploadModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedType, setSelectedType] = useState<PostType>('post');
    const [selectedYear, setSelectedYear] = useState<YearCategory | null>(null);
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
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

            // Determine path based on type/year for organization (optional, but good practice)
            // Determine path based on type
            const pathPrefix = `${selectedType}s/`; // posts/, reels/, stories/

            const filePath = `${pathPrefix}${fileName}`;

            // 1. Upload file to Storage (using 'communication_media' bucket for now)
            // In future with Google Drive, this step would call the API route
            const { error: uploadError } = await supabase.storage
                .from('communication_media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('communication_media')
                .getPublicUrl(filePath);

            // 3. Insert metadata into DB
            const { data: insertedPost, error: dbError } = await supabase
                .from('communication_posts')
                .insert({
                    title,
                    description,
                    type: selectedType,
                    year_category: null,
                    is_pnab: false,
                    media_url: publicUrl,
                })
                .select()
                .single();

            if (dbError) throw dbError;

            if (onUploadSuccess && insertedPost) {
                onUploadSuccess(insertedPost);
            }

            // 4. (NEW) Backup automatically to Google Drive
            try {
                const driveData = new FormData();
                driveData.append('file', file);
                const driveRes = await backupGaleriaMediaToDrive(driveData, selectedType);
                if (driveRes.success && driveRes.file?.id) {
                    await supabase.from('communication_posts').update({ drive_file_id: driveRes.file.id }).eq('id', insertedPost.id);
                }
            } catch (driveErr) {
                console.error('Backup to Drive silently failed:', driveErr);
                // We don't throw here to ensure the Gallery UI still works perfectly 
                // even if Google Drive fails or token revokes.
            }

            router.refresh();
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setFile(null);
            setSelectedType('post');
            setSelectedYear(null);

        } catch (error) {
            console.error('Error uploading:', error);
            alert('Erro ao fazer upload. Verifique o console.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
                <div className="shrink-0 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Upload Inteligente</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleUpload} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {/* TYPE SELECTION */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {POST_TYPES.map(type => {
                            const Icon = type.icon;
                            const isSelected = selectedType === type.id;
                            return (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setSelectedType(type.id)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${isSelected
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                        }`}
                                >
                                    <Icon size={24} className="mb-2" />
                                    <span className="text-xs font-semibold">{type.label}</span>
                                </button>
                            )
                        })}
                    </div>



                    {/* FILE UPLOAD */}
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept={selectedType === 'reel' ? "video/*" : "image/*,video/*"}
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center gap-2 text-slate-500">
                                {file ? (
                                    <div className="flex flex-col items-center text-primary">
                                        <Check size={32} />
                                        <span className="text-sm font-bold text-slate-800 mt-2">{file.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={32} />
                                        <span className="text-sm font-medium">
                                            {selectedType === 'reel' ? 'Selecione o vídeo do Reel' : 'Clique para selecionar a mídia'}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* METADATA */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Título / Legenda</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="Escreva um título..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (Opcional)</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="Detalhes adicionais..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={uploading || !file || !title}
                        className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Publicar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
