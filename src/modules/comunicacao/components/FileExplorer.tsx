'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { CommunicationFile, CommunicationFolder } from '@/types/communication';
import { Folder, FileText, ChevronRight, Upload, FolderPlus, Trash2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FolderModal from './FolderModal';
import FileUploadModal from './FileUploadModal';

export default function FileExplorer() {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null, name: string }[]>([{ id: null, name: 'Drive' }]);

    const [folders, setFolders] = useState<CommunicationFolder[]>([]);
    const [files, setFiles] = useState<CommunicationFile[]>([]);
    const [loading, setLoading] = useState(true);

    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isFileModalOpen, setIsFileModalOpen] = useState(false);

    const supabase = createClient();

    // Fetch content when folder changes
    useEffect(() => {
        fetchContent();
    }, [currentFolderId]);

    const fetchContent = async () => {
        setLoading(true);

        // Fetch Folders
        let folderQuery = supabase
            .from('communication_folders')
            .select('*')
            .order('name');

        if (currentFolderId) {
            folderQuery = folderQuery.eq('parent_id', currentFolderId);
        } else {
            folderQuery = folderQuery.is('parent_id', null);
        }

        const { data: folderData } = await folderQuery;

        // Fetch Files
        let fileQuery = supabase
            .from('communication_files')
            .select('*')
            .order('name');

        if (currentFolderId) {
            fileQuery = fileQuery.eq('folder_id', currentFolderId);
        } else {
            // Files can also be at root? Usually yes.
            fileQuery = fileQuery.is('folder_id', null);
        }

        const { data: fileData } = await fileQuery;

        setFolders(folderData || []);
        setFiles(fileData || []);
        setLoading(false);
    };

    const handleNavigate = async (folder: CommunicationFolder) => {
        setCurrentFolderId(folder.id);
        setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
    };

    const handleBreadcrumbClick = (index: number) => {
        const target = breadcrumbs[index];
        setCurrentFolderId(target.id);
        setBreadcrumbs(prev => prev.slice(0, index + 1));
    };

    const handleDeleteFile = async (id: string, path: string) => {
        if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;

        // Delete from storage
        // We stored it as just the filename or path? 
        // In FileUploadModal (next step), we'll see. Assuming we store "path" in file_url or derived.
        // Let's assume file_url is the public URL, but we need the path for storage delete.
        // Usually passing the full path is better.
        // For now, let's just delete from DB to hide it, or try to delete from storage if we can parse path.

        await supabase.from('communication_files').delete().eq('id', id);
        fetchContent();
    };

    const handleDeleteFolder = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta pasta e TUDO dentro dela?')) return;
        await supabase.from('communication_folders').delete().eq('id', id);
        fetchContent();
    };

    return (
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 min-h-[500px] flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-50/50 dark:bg-slate-800/50">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 overflow-x-auto no-scrollbar w-full sm:w-auto pb-2 sm:pb-0">
                    <AnimatePresence>
                        {breadcrumbs.map((crumb, index) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                key={crumb.id || 'root'}
                                className="flex items-center gap-1 shrink-0"
                            >
                                {index > 0 && <ChevronRight size={16} className="text-slate-300 dark:text-gray-600" />}
                                <button
                                    onClick={() => handleBreadcrumbClick(index)}
                                    className={`px-2 py-1 rounded-md transition-colors ${index === breadcrumbs.length - 1 ? 'font-bold text-slate-800 dark:text-white bg-white/50 dark:bg-gray-700/50 shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-gray-700/50 hover:text-primary dark:hover:text-blue-400'}`}
                                >
                                    {crumb.name}
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsFolderModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-slate-200/60 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-gray-500 transition-all"
                    >
                        <FolderPlus size={18} className="text-amber-500" />
                        Nova Pasta
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsFileModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-md hover:shadow-lg transition-all"
                    >
                        <Upload size={18} />
                        Upload
                    </motion.button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 relative">
                {loading ? (
                    <div className="flex justify-center items-center h-full min-h-[300px]">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        {folders.length === 0 && files.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-gray-500"
                            >
                                <span className="material-icons text-6xl mb-4 opacity-50">folder_open</span>
                                <p className="font-medium text-lg">Esta pasta está vazia.</p>
                                <p className="text-sm opacity-70 mt-1">Crie uma nova pasta ou faça upload de arquivos.</p>
                            </motion.div>
                        )}

                        <motion.div
                            variants={{
                                visible: { transition: { staggerChildren: 0.05 } },
                                hidden: {}
                            }}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
                        >
                            {/* Folders */}
                            {folders.map(folder => (
                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.95 },
                                        visible: { opacity: 1, scale: 1 }
                                    }}
                                    key={folder.id}
                                    className="group flex flex-col items-center p-5 bg-white border dark:bg-gray-800 dark:border-gray-700/50 rounded-2xl hover:bg-slate-50/80 hover:scale-[1.03] hover:shadow-lg dark:hover:bg-gray-700 cursor-pointer border-slate-100 transition-all relative"
                                    onClick={() => handleNavigate(folder)}
                                >
                                    <Folder size={56} className="text-amber-400 mb-3 fill-amber-400/20 drop-shadow-sm group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                                    <span className="text-sm font-semibold text-center text-slate-700 dark:text-slate-300 truncate w-full group-hover:text-primary transition-colors">{folder.name}</span>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                                        className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                        title="Excluir pasta"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </motion.div>
                            ))}

                            {/* Files */}
                            {files.map(file => (
                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.95 },
                                        visible: { opacity: 1, scale: 1 }
                                    }}
                                    key={file.id}
                                    className="group flex flex-col items-center justify-between p-5 bg-white border dark:bg-gray-800 dark:border-gray-700/50 rounded-2xl hover:bg-slate-50/80 hover:shadow-lg dark:hover:bg-gray-700 border-slate-100 transition-all relative"
                                >
                                    <div className="relative mb-3 flex-1 flex items-center justify-center w-full">
                                        <FileText size={48} className="text-slate-400/80 dark:text-gray-500" strokeWidth={1} />
                                        {/* Extension badge logic could go here */}
                                        <div className="absolute -bottom-2 -right-2 bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded text-slate-500 uppercase">
                                            {file.name.split('.').pop() || 'FILE'}
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-center text-slate-600 dark:text-slate-400 truncate w-full mt-2" title={file.name}>{file.name}</span>

                                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a
                                            href={file.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full text-slate-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 shadow-sm transition-colors"
                                            title="Download/Abrir"
                                        >
                                            <Download size={14} />
                                        </a>
                                        <button
                                            onClick={() => handleDeleteFile(file.id, file.file_url)}
                                            className="p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 shadow-sm transition-colors"
                                            title="Excluir arquivo"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </>
                )}
            </div>

            <FolderModal
                isOpen={isFolderModalOpen}
                onClose={() => setIsFolderModalOpen(false)}
                parentId={currentFolderId}
                onSuccess={fetchContent}
            />

            <FileUploadModal
                isOpen={isFileModalOpen}
                onClose={() => setIsFileModalOpen(false)}
                folderId={currentFolderId}
                onSuccess={fetchContent}
            />
        </div>
    );
}
