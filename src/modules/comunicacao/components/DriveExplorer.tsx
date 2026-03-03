'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Folder,
    File as FileIcon,
    Image as ImageIcon,
    Video as VideoIcon,
    FileText,
    UploadCloud,
    FolderPlus,
    ChevronRight,
    ArrowLeft,
    Loader2,
    ExternalLink,
    MoreVertical,
    FolderOpen,
    Trash2,
    CheckSquare,
    Square,
    MousePointerSquareDashed
} from 'lucide-react';
import { listGoogleDriveFiles, createGoogleDriveFolder, uploadGoogleDriveFile, deleteGoogleDriveFiles } from '../actions';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import MediaDetailModal from './MediaDetailModal';
import DriveUploadModal from './DriveUploadModal';
import { CommunicationPost } from '@/types/communication';

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
    iconLink?: string;
    createdTime?: string;
    size?: string;
}

interface DriveExplorerProps {
    initialFolderId: string;
    initialFolderName?: string;
    predefinedFolders?: Record<string, string>;
}

interface Breadcrumb {
    id: string;
    name: string;
}

interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    fileId: string | null;
}

export default function DriveExplorer({ initialFolderId, initialFolderName = 'COMUNICAÇÃO', predefinedFolders }: DriveExplorerProps) {
    const [currentFolderId, setCurrentFolderId] = useState(initialFolderId);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: initialFolderId, name: initialFolderName }]);

    const [files, setFiles] = useState<DriveFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
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
        setSelectedIds(new Set()); // clear selection on navigate
        setIsSelectionMode(false);
        const res = await listGoogleDriveFiles(folderId);
        if (res.success) {
            // Sort: Folders first, then files by name
            const sorted = (res.files as DriveFile[]).sort((a, b) => {
                const aIsFolder = a.mimeType === 'application/vnd.google-apps.folder';
                const bIsFolder = b.mimeType === 'application/vnd.google-apps.folder';
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

    const handleFileClick = (file: DriveFile, e: React.MouseEvent) => {
        // Handled as selection toggle if in selection mode or Shift/Ctrl is pressed
        if (isSelectionMode || e.ctrlKey || e.metaKey || e.shiftKey) {
            e.stopPropagation();
            e.preventDefault();
            toggleSelection(file.id);
            if (!isSelectionMode) setIsSelectionMode(true);
            return;
        }

        // Default navigation/open behavior
        if (file.mimeType === 'application/vnd.google-apps.folder') {
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

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            if (next.size === 0) setIsSelectionMode(false);
            return next;
        });
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

    const handleUploadSubmit = async (file: File, title: string, description: string, category: string, destFolderId: string) => {
        const formData = new FormData();
        // Rename file explicitly with Title if possible, or just upload as is
        // We'll upload as is because GD handles titles in metadata, 
        // but we're passing it in formData so we rename the file blob
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

        // If file is not selected, select only it for the context menu
        if (!selectedIds.has(file.id)) {
            setSelectedIds(new Set([file.id]));
            setIsSelectionMode(true);
        }

        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            fileId: file.id
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
            // SYNCHRONIZED DELETION: Also delete from Supabase if linked
            try {
                const supabase = createClient();
                const { data: linkedPosts } = await supabase
                    .from('communication_posts')
                    .select('id, media_url')
                    .in('drive_file_id', idsArray);

                if (linkedPosts && linkedPosts.length > 0) {
                    // 1. Delete from Supabase Storage
                    const storagePathsToRemove: string[] = [];
                    linkedPosts.forEach((post: any) => {
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
                    // 2. Delete rows from DB
                    await supabase.from('communication_posts').delete().in('drive_file_id', idsArray);
                }
            } catch (cleanupError) {
                console.error("Cleanup of linked Supabase posts failed:", cleanupError);
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

    const getFileIcon = (file: DriveFile) => {
        if (file.mimeType === 'application/vnd.google-apps.folder') return <Folder className="text-blue-500 fill-blue-100" size={40} />;
        if (file.mimeType.includes('image')) {
            // Use real thumbnail if available from Google Drive API, else use generic icon
            // Replace $=s220 with =s400 for better resolution without going too heavy
            if ((file as any).thumbnailLink) {
                const highResUrl = (file as any).thumbnailLink.replace('=s220', '=s400');
                return <img src={highResUrl} alt={file.name} className="w-full h-full object-cover rounded shadow-sm opacity-90 group-hover:opacity-100 transition-opacity" />;
            }
            return <ImageIcon className="text-pink-500" size={40} />;
        }
        if (file.mimeType.includes('video')) return <VideoIcon className="text-purple-500" size={40} />;
        if (file.mimeType.includes('pdf') || file.mimeType.includes('document')) return <FileText className="text-orange-500" size={40} />;
        return <FileIcon className="text-slate-400" size={40} />;
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative" onContextMenu={(e) => { e.preventDefault(); }}>
            {/* Header & Breadcrumbs */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                <div className="flex items-center gap-2 overflow-x-auto text-sm font-medium text-slate-600 no-scrollbar">
                    {breadcrumbs.length > 1 && (
                        <button
                            onClick={() => navigateUp(breadcrumbs.length - 2)}
                            className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                        >
                            <ArrowLeft size={16} />
                        </button>
                    )}

                    {breadcrumbs.map((crumb, idx) => (
                        <div key={crumb.id} className="flex items-center">
                            <button
                                onClick={() => navigateUp(idx)}
                                className={`hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-slate-100
                                    ${idx === breadcrumbs.length - 1 ? 'text-slate-900 font-semibold' : ''}
                                `}
                            >
                                {crumb.name}
                            </button>
                            {idx < breadcrumbs.length - 1 && (
                                <ChevronRight size={16} className="text-slate-400 mx-1 flex-shrink-0" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {isSelectionMode ? (
                        <>
                            <span className="text-sm font-medium text-slate-500 mr-2">
                                {selectedIds.size} selecionado(s)
                            </span>
                            <button
                                onClick={handleDeleteSelected}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-lg hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                Excluir
                            </button>
                            <button
                                onClick={() => { setSelectedIds(new Set()); setIsSelectionMode(false); }}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors shadow-sm"
                            >
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsSelectionMode(true)}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 border border-transparent rounded-lg hover:bg-slate-200 transition-colors shadow-sm"
                                title="Selecionar Vários"
                            >
                                <MousePointerSquareDashed size={16} />
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                disabled={isCreatingFolder || isUploading}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isCreatingFolder ? <Loader2 size={16} className="animate-spin" /> : <FolderPlus size={16} />}
                                Nova Pasta
                            </button>

                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                disabled={isUploading || isCreatingFolder}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                            >
                                <UploadCloud size={16} />
                                Fazer Upload
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* File List / Grid */}
            <div className="flex-1 overflow-y-auto p-6" onClick={() => { if (isSelectionMode && selectedIds.size === 0) setIsSelectionMode(false) }}>
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
                            {files.map(file => {
                                const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                                const isSelected = selectedIds.has(file.id);
                                return (
                                    <motion.div
                                        key={file.id}
                                        layoutId={file.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ y: -4, boxShadow: "0px 10px 20px rgba(0,0,0,0.05)" }}
                                        onClick={(e) => handleFileClick(file, e as any)}
                                        onContextMenu={(e) => handleContextMenu(e as any, file)}
                                        className={`group relative flex flex-col items-center p-4 bg-white rounded-xl border ${isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-slate-200 hover:border-primary/30'} cursor-pointer transition-all duration-200`}
                                    >
                                        {/* Selection Checkbox */}
                                        {(isSelectionMode || isSelected) && (
                                            <div className="absolute top-2 left-2 z-10 text-primary" onClick={(e) => { e.stopPropagation(); toggleSelection(file.id); }}>
                                                {isSelected ? <CheckSquare size={20} className="fill-primary text-white bg-primary rounded" /> : <Square size={20} className="text-slate-300 hover:text-primary bg-white rounded" />}
                                            </div>
                                        )}

                                        <div className="w-16 h-16 flex items-center justify-center mb-3">
                                            {getFileIcon(file)}
                                        </div>

                                        <div className="w-full text-center">
                                            <p className="text-sm font-medium text-slate-700 truncate px-1" title={file.name}>
                                                {file.name}
                                            </p>
                                        </div>

                                        {!isFolder && file.webViewLink && !isSelectionMode && (
                                            <button
                                                className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 hover:text-primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(file.webViewLink, '_blank');
                                                }}
                                                title="Abrir no Google Drive"
                                            >
                                                <ExternalLink size={14} />
                                            </button>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Context Menu */}
            <AnimatePresence>
                {contextMenu.visible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        className="fixed z-50 min-w-[160px] bg-white rounded-lg shadow-xl border border-slate-200 py-1 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-2 text-sm text-slate-700"
                            onClick={() => {
                                setContextMenu({ ...contextMenu, visible: false });
                                if (!isSelectionMode) setIsSelectionMode(true);
                            }}
                        >
                            <CheckSquare size={16} className="text-slate-400" />
                            Selecionar Vários
                        </button>

                        <div className="h-px bg-slate-100 my-1 w-full" />

                        <button
                            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 text-sm font-medium"
                            onClick={() => {
                                setContextMenu({ ...contextMenu, visible: false });
                                handleDeleteSelected();
                            }}
                        >
                            <Trash2 size={16} />
                            Excluir ({selectedIds.size})
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        media_url: (previewFile as any).thumbnailLink
                            ? (previewFile as any).thumbnailLink.replace('=s220', '=s2000')
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
        </div>
    );
}
