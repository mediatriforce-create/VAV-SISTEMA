'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, FolderOpen } from 'lucide-react';
import { listGoogleDriveFiles, createGoogleDriveFolder, uploadGoogleDriveFile, deleteGoogleDriveFiles } from '../actions';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import MediaDetailModal from './MediaDetailModal';
import DriveUploadModal from './DriveUploadModal';
import { DriveBreadcrumbs } from './drive-explorer/DriveBreadcrumbs';
import { DriveActionBar } from './drive-explorer/DriveActionBar';
import { DriveFileCard } from './drive-explorer/DriveFileCard';
import { DriveContextMenu } from './drive-explorer/DriveContextMenu';
import { DriveFile, Breadcrumb, ContextMenuState, isFolder } from './drive-explorer/types';

interface DriveExplorerProps {
    initialFolderId: string;
    initialFolderName?: string;
    predefinedFolders?: Record<string, string>;
}

export default function DriveExplorer({ initialFolderId, initialFolderName = 'COMUNICAÇÃO', predefinedFolders }: DriveExplorerProps) {
    const [currentFolderId, setCurrentFolderId] = useState(initialFolderId);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: initialFolderId, name: initialFolderName }]);

    const [files, setFiles] = useState<DriveFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);

    // Multi-select & Context Menu
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, fileId: null });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Close context menu on outside click
    useEffect(() => {
        const handleGlobalClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);

    const loadFiles = useCallback(async (folderId: string) => {
        setIsLoading(true);
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        const res = await listGoogleDriveFiles(folderId);
        if (res.success) {
            const sorted = (res.files as DriveFile[]).sort((a, b) => {
                const aIsFolder = isFolder(a);
                const bIsFolder = isFolder(b);
                if (aIsFolder && !bIsFolder) return -1;
                if (!aIsFolder && bIsFolder) return 1;
                return a.name.localeCompare(b.name);
            });
            setFiles(sorted);
        } else {
            toast.error(res.error || 'Erro ao carregar arquivos.');
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadFiles(currentFolderId);
    }, [currentFolderId, loadFiles]);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            if (next.size === 0) setIsSelectionMode(false);
            return next;
        });
    };

    const handleFileClick = (file: DriveFile, e: React.MouseEvent) => {
        if (isSelectionMode || e.ctrlKey || e.metaKey || e.shiftKey) {
            e.stopPropagation();
            e.preventDefault();
            toggleSelection(file.id);
            if (!isSelectionMode) setIsSelectionMode(true);
            return;
        }

        if (isFolder(file)) {
            setBreadcrumbs(prev => [...prev, { id: file.id, name: file.name }]);
            setCurrentFolderId(file.id);
            return;
        }

        if (file.mimeType.includes('image') || file.mimeType.includes('video')) {
            setPreviewFile(file);
            return;
        }

        if (file.webViewLink) window.open(file.webViewLink, '_blank');
    };

    const navigateUp = (index: number) => {
        const target = breadcrumbs[index];
        setBreadcrumbs(prev => prev.slice(0, index + 1));
        setCurrentFolderId(target.id);
    };

    const handleCreateFolder = async () => {
        const name = prompt('Nome da nova pasta:');
        if (!name || name.trim() === '') return;

        setIsCreatingFolder(true);
        const toastId = toast.loading('Criando pasta...');

        const res = await createGoogleDriveFolder(name, currentFolderId);

        if (res.success) {
            toast.success('Pasta criada!', { id: toastId });
            loadFiles(currentFolderId);
        } else {
            toast.error('Erro ao criar pasta.', { id: toastId });
        }
        setIsCreatingFolder(false);
    };

    const handleUploadSubmit = async (file: File, title: string, _description: string, _category: string, destFolderId: string) => {
        const formData = new FormData();
        const ext = file.name.split('.').pop() || '';
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const finalName = `${safeTitle}.${ext}`;
        const newFile = new File([file], finalName, { type: file.type });

        formData.append('file', newFile);

        const toastId = toast.loading(`Fazendo upload de ${finalName}...`);
        const res = await uploadGoogleDriveFile(formData, destFolderId);

        if (res.success) {
            toast.success('Upload concluído!', { id: toastId });
            loadFiles(currentFolderId);
            return true;
        } else {
            toast.error('Erro no upload.', { id: toastId });
            return false;
        }
    };

    const handleContextMenu = (e: React.MouseEvent, file: DriveFile) => {
        e.preventDefault();
        e.stopPropagation();

        if (!selectedIds.has(file.id)) {
            setSelectedIds(new Set([file.id]));
            setIsSelectionMode(true);
        }

        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            fileId: file.id,
        });
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;

        const confirmDelete = confirm(`Tem certeza que deseja excluir ${selectedIds.size} item(ns) permanentemente?`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        const toastId = toast.loading(`Excluindo ${selectedIds.size} item(ns)...`);

        const idsArray = Array.from(selectedIds);
        const res = await deleteGoogleDriveFiles(idsArray);

        if (res.success) {
            // Sincronizacao com Supabase: apaga linked posts + storage
            try {
                const supabase = createClient();
                const { data: linkedPosts } = await supabase
                    .from('communication_posts')
                    .select('id, media_url')
                    .in('drive_file_id', idsArray);

                if (linkedPosts && linkedPosts.length > 0) {
                    const storagePathsToRemove: string[] = [];
                    linkedPosts.forEach((post: { media_url: string }) => {
                        if (post.media_url.includes('/communication_media/')) {
                            const pathParts = post.media_url.split('/communication_media/');
                            if (pathParts.length > 1) {
                                storagePathsToRemove.push(pathParts[1].split('?')[0]);
                            }
                        }
                    });
                    if (storagePathsToRemove.length > 0) {
                        await supabase.storage.from('communication_media').remove(storagePathsToRemove);
                    }
                    await supabase.from('communication_posts').delete().in('drive_file_id', idsArray);
                }
            } catch (cleanupError) {
                console.error('Cleanup of linked Supabase posts failed:', cleanupError);
            }

            toast.success('Excluído(s) com sucesso!', { id: toastId });
            setSelectedIds(new Set());
            setIsSelectionMode(false);
            loadFiles(currentFolderId);
        } else {
            toast.error(res.error || 'Erro ao excluir. O usuário pode não ter permissões completas sobre o arquivo pelo Google Drive API.', { id: toastId });
        }
        setIsDeleting(false);
    };

    return (
        <div
            className="flex flex-col h-full bg-transparent relative"
            onContextMenu={(e) => { e.preventDefault(); }}
        >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between mx-6 mt-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <FolderOpen className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Repositório</h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">Gerenciador de arquivos integrado ao Google Drive</p>
                    </div>
                </div>
            </div>

            {/* Breadcrumbs & Actions */}
            <div className="bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl mx-6 mt-4 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <DriveBreadcrumbs breadcrumbs={breadcrumbs} onNavigate={navigateUp} />
                <DriveActionBar
                    isSelectionMode={isSelectionMode}
                    selectedCount={selectedIds.size}
                    isUploading={isUploading}
                    isCreatingFolder={isCreatingFolder}
                    isDeleting={isDeleting}
                    onEnterSelectionMode={() => setIsSelectionMode(true)}
                    onCancelSelection={() => { setSelectedIds(new Set()); setIsSelectionMode(false); }}
                    onCreateFolder={handleCreateFolder}
                    onOpenUpload={() => setIsUploadModalOpen(true)}
                    onDeleteSelected={handleDeleteSelected}
                />
            </div>

            {/* File List / Grid */}
            <div
                className="flex-1 overflow-y-auto custom-scrollbar p-6"
                onClick={() => { if (isSelectionMode && selectedIds.size === 0) setIsSelectionMode(false); }}
            >
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 pt-12"
                        >
                            <Loader2 size={32} className="animate-spin text-primary" />
                            <p>Carregando arquivos do Drive...</p>
                        </motion.div>
                    ) : files.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 pt-12"
                        >
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <FolderOpen className="text-slate-300" size={48} />
                            </div>
                            <p className="text-lg font-medium text-slate-600">Esta pasta está vazia</p>
                            <p className="text-sm">Arraste arquivos para cá ou use o botão de upload.</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                        >
                            {files.map(file => (
                                <DriveFileCard
                                    key={file.id}
                                    file={file}
                                    isSelected={selectedIds.has(file.id)}
                                    isSelectionMode={isSelectionMode}
                                    onClick={handleFileClick}
                                    onContextMenu={handleContextMenu}
                                    onToggleSelection={toggleSelection}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <DriveContextMenu
                contextMenu={contextMenu}
                selectedCount={selectedIds.size}
                isSelectionMode={isSelectionMode}
                onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
                onEnterSelectionMode={() => setIsSelectionMode(true)}
                onDelete={handleDeleteSelected}
            />

            <DriveUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                currentFolderId={currentFolderId}
                predefinedFolders={predefinedFolders}
                onUploadSubmit={handleUploadSubmit}
            />

            {previewFile && (
                <MediaDetailModal
                    isDriveOrigin={true}
                    post={{
                        id: previewFile.id,
                        title: previewFile.name,
                        type: previewFile.mimeType.includes('video') ? 'reel' : 'institutional',
                        media_url: previewFile.thumbnailLink
                            ? previewFile.thumbnailLink.replace('=s220', '=s2000')
                            : (previewFile.webViewLink || ''),
                        drive_file_id: previewFile.id,
                        description: null,
                        year_category: null,
                        is_pnab: false,
                        created_at: previewFile.createdTime || new Date().toISOString(),
                        created_by: 'Sistema',
                        linked_demand_id: null,
                    }}
                    onClose={() => setPreviewFile(null)}
                    onDelete={(id) => {
                        setFiles(prev => prev.filter(f => f.id !== id));
                        setPreviewFile(null);
                    }}
                />
            )}

            {/* Hidden file input (kept for potential future drag-and-drop integration) */}
            <input ref={fileInputRef} type="file" className="hidden" />
        </div>
    );
}
