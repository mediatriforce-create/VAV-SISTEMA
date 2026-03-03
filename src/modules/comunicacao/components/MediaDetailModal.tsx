'use client';

import { CommunicationPost } from '@/types/communication';
import { X, Download, ExternalLink, Calendar, User, FileVideo, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { deleteGoogleDriveFiles } from '../actions';

interface MediaDetailModalProps {
    post: CommunicationPost | null;
    onClose: () => void;
    onDelete?: (id: string) => void;
    isDriveOrigin?: boolean;
}

export default function MediaDetailModal({ post, onClose, onDelete, isDriveOrigin }: MediaDetailModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (post) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [post]);

    if (!post) return null;

    const isVideo = post.type === 'reel';

    const handleDownload = async () => {
        try {
            const response = await fetch(post.media_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${post.title}.${isVideo ? 'mp4' : 'jpg'}`; // Simple extension guess
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error('Download failed', e);
            window.open(post.media_url, '_blank');
        }
    };

    const handleDelete = async () => {
        if (!post) return;

        const confirmDelete = window.confirm(
            isDriveOrigin
                ? "Tem certeza que deseja excluir este arquivo do Google Drive permanentemente?"
                : "Tem certeza que deseja excluir esta mídia da Galeria? (Isso também exclui o backup do Google Drive)"
        );
        if (!confirmDelete) return;

        setIsDeleting(true);
        const toastId = toast.loading(isDriveOrigin ? "Excluindo arquivo..." : "Excluindo post...");

        try {
            if (isDriveOrigin) {
                if (post.drive_file_id) {
                    // Delete from Drive
                    await deleteGoogleDriveFiles([post.drive_file_id]);
                    // Clean up tracking in DB without throwing error if it doesn't exist
                    await supabase.from('communication_posts').delete().eq('drive_file_id', post.drive_file_id);
                }
            } else {
                // Extract the storage path if it was hosted on Supabase Storage
                if (post.media_url.includes('/communication_media/')) {
                    const pathParts = post.media_url.split('/communication_media/');
                    if (pathParts.length > 1) {
                        const storagePath = pathParts[1].split('?')[0]; // Remove any query params
                        await supabase.storage.from('communication_media').remove([storagePath]);
                    }
                }

                // Remove from Database
                const { error: dbError } = await supabase.from('communication_posts').delete().eq('id', post.id);
                if (dbError) throw dbError;

                // Remove from Google Drive if linked
                if (post.drive_file_id) {
                    try {
                        await deleteGoogleDriveFiles([post.drive_file_id]);
                    } catch (driveErr) {
                        console.error('Non-critical: Failed to delete from Google Drive:', driveErr);
                    }
                }
            }

            toast.success(isDriveOrigin ? "Arquivo excluído com sucesso!" : "Post excluído com sucesso!", { id: toastId });

            if (onDelete) {
                onDelete(post.id);
            }
            onClose();
        } catch (err) {
            console.error('Failed to delete post:', err);
            toast.error("Erro ao excluir. Verifique suas permissões.", { id: toastId });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-6xl h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-300">

                {/* Close Button (Mobile) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full md:hidden"
                >
                    <X size={20} />
                </button>

                {/* Media Section */}
                <div className="w-full md:w-2/3 h-1/2 md:h-full bg-black flex items-center justify-center relative group">
                    {isVideo ? (
                        <video
                            src={post.media_url}
                            controls
                            autoPlay
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : (
                        <div className="relative w-full h-full">
                            <img
                                src={post.media_url}
                                alt={post.title}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className="w-full md:w-1/3 h-1/2 md:h-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col min-h-0">

                    {/* Header */}
                    <div className="shrink-0 p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                {isVideo ? <FileVideo size={20} /> : <ImageIcon size={20} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{post.title}</h3>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-0.5">{post.type}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="hidden md:block text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-6">

                        {/* Description */}
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Sobre este arquivo</h4>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                {post.description || "Sem descrição disponível para este item."}
                            </p>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                    <Calendar size={12} /> Data
                                </div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {new Date(post.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                    <User size={12} /> Autor
                                </div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {post.creator?.full_name || 'Sistema'}
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Footer / Actions */}
                    <div className="shrink-0 p-6 border-t border-slate-100 dark:border-slate-700 space-y-3 bg-slate-50/50 dark:bg-slate-800/50">
                        <button
                            onClick={handleDownload}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
                        >
                            <Download size={18} />
                            Baixar Mídia
                        </button>

                        <div className="flex gap-3">
                            <a
                                href={post.media_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                <ExternalLink size={18} />
                                Abrir
                            </a>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 py-3 rounded-xl font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
