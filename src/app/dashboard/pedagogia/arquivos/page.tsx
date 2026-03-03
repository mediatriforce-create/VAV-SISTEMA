'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Tipos do Google Drive
interface DriveItem {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
    webContentLink?: string;
    iconLink?: string;
    thumbnailLink?: string;
    createdTime?: string;
    size?: string;
}

const FILE_ICONS: Record<string, { icon: string; color: string }> = {
    'application/pdf': { icon: 'picture_as_pdf', color: 'text-red-500' },
    'image/jpeg': { icon: 'image', color: 'text-blue-500' },
    'image/png': { icon: 'image', color: 'text-blue-500' },
    'image/webp': { icon: 'image', color: 'text-blue-500' },
    'application/vnd.google-apps.folder': { icon: 'folder', color: 'text-amber-400' },
};

function getFileIcon(mimeType: string) {
    return FILE_ICONS[mimeType] || { icon: 'description', color: 'text-zinc-500' };
}

export default function ArquivosPage() {
    // Seções: pastas do Drive separadas
    const [commFolders, setCommFolders] = useState<DriveItem[]>([]);
    const [pedFolders, setPedFolders] = useState<DriveItem[]>([]);
    const [activeFolder, setActiveFolder] = useState<DriveItem | null>(null);
    const [activeFolderSource, setActiveFolderSource] = useState<'comm' | 'ped' | null>(null);
    const [folderFiles, setFolderFiles] = useState<DriveItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filesLoading, setFilesLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Modal nova pasta
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [creatingFolder, setCreatingFolder] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadDriveFolders();
    }, []);

    const loadDriveFolders = async () => {
        setLoading(true);
        try {
            // Importar a action de comunicação para pegar a estrutura do Drive
            const { syncGoogleDriveStructure, listGoogleDriveFiles } = await import('@/modules/comunicacao/actions');

            // 1. Sync para garantir que as pastas existem e pegar os IDs
            const syncRes = await syncGoogleDriveStructure();
            if (!syncRes.success || !syncRes.data) throw new Error('Falha ao sincronizar Drive');

            const { rootId, commId, folders: commFolderIds } = syncRes.data;

            // 2. Listar sub-pastas de Comunicação (1 ANO - 5 ANO)
            const yearFolders = ['1 ANO', '2 ANO', '3 ANO', '4 ANO', '5 ANO'];
            const commItems: DriveItem[] = yearFolders
                .filter(name => commFolderIds[name])
                .map(name => ({
                    id: commFolderIds[name],
                    name,
                    mimeType: 'application/vnd.google-apps.folder',
                }));
            setCommFolders(commItems);

            // 3. Garantir pasta PEDAGOGIA dentro de VAV SISTEMA e listar sub-pastas
            const { createGoogleDriveFolder } = await import('@/modules/comunicacao/actions');
            const pedRes = await createGoogleDriveFolder('PEDAGOGIA', rootId);
            if (pedRes.success && pedRes.folderId) {
                const pedListRes = await listGoogleDriveFiles(pedRes.folderId);
                if (pedListRes.success && pedListRes.files) {
                    setPedFolders(pedListRes.files.filter(
                        (f: any) => f.mimeType === 'application/vnd.google-apps.folder'
                    ) as DriveItem[]);
                }
            }
        } catch (err) {
            console.error('loadDriveFolders Error:', err);
        }
        setLoading(false);
    };

    const openFolder = async (folder: DriveItem, source: 'comm' | 'ped') => {
        setActiveFolder(folder);
        setActiveFolderSource(source);
        setFilesLoading(true);
        try {
            const { listGoogleDriveFiles } = await import('@/modules/comunicacao/actions');
            const res = await listGoogleDriveFiles(folder.id);
            if (res.success && res.files) {
                setFolderFiles(res.files as DriveItem[]);
            }
        } catch (err) {
            console.error('openFolder Error:', err);
        }
        setFilesLoading(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeFolder) return;
        setUploading(true);
        try {
            const { uploadGoogleDriveFile } = await import('@/modules/comunicacao/actions');
            const formData = new FormData();
            formData.append('file', file);
            const res = await uploadGoogleDriveFile(formData, activeFolder.id);
            if (res.success && res.file) {
                setFolderFiles(prev => [res.file as DriveItem, ...prev]);
            }
        } catch (err) {
            console.error('Upload Error:', err);
        }
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        setCreatingFolder(true);
        try {
            // Criar a pasta dentro de PEDAGOGIA no Drive
            const { syncGoogleDriveStructure, createGoogleDriveFolder } = await import('@/modules/comunicacao/actions');
            const syncRes = await syncGoogleDriveStructure();
            if (syncRes.success && syncRes.data) {
                const pedRes = await createGoogleDriveFolder('PEDAGOGIA', syncRes.data.rootId);
                if (pedRes.success && pedRes.folderId) {
                    const newRes = await createGoogleDriveFolder(newFolderName, pedRes.folderId);
                    if (newRes.success && newRes.folderId) {
                        setPedFolders(prev => [...prev, {
                            id: newRes.folderId!,
                            name: newFolderName,
                            mimeType: 'application/vnd.google-apps.folder',
                        }]);
                    }
                }
            }
        } catch (err) {
            console.error('Create Folder Error:', err);
        }
        setNewFolderName('');
        setCreatingFolder(false);
        setShowFolderModal(false);
    };

    return (
        <div className="h-full flex flex-col min-h-0 p-4 sm:p-6">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    {activeFolder ? (
                        <>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => { setActiveFolder(null); setFolderFiles([]); setActiveFolderSource(null); }}
                                className="w-9 h-9 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                <span className="material-symbols-outlined text-lg text-zinc-600 dark:text-zinc-300">arrow_back</span>
                            </motion.button>
                            <div>
                                <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">{activeFolder.name}</h2>
                                <p className="text-xs text-zinc-500">
                                    {activeFolderSource === 'comm' ? 'Comunicação' : 'Pedagogia'} · Google Drive
                                </p>
                            </div>
                        </>
                    ) : (
                        <div>
                            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Arquivos de Aula</h2>
                            <p className="text-xs text-zinc-500">Pastas do Google Drive por ano e pedagogia</p>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {activeFolder && (
                        <>
                            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} accept="image/*,.pdf,.doc,.docx" />
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => fileInputRef.current?.click()} disabled={uploading}
                                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:border-emerald-400 transition-colors disabled:opacity-50">
                                <span className="material-symbols-outlined text-lg">{uploading ? 'hourglass_empty' : 'upload_file'}</span>
                                {uploading ? 'Enviando...' : 'Upload'}
                            </motion.button>
                        </>
                    )}
                    {!activeFolder && (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => setShowFolderModal(true)}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">create_new_folder</span>
                            Nova Pasta
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : activeFolder ? (
                    /* === ARQUIVOS DENTRO DA PASTA === */
                    filesLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : folderFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <span className="material-symbols-outlined text-5xl text-zinc-200 dark:text-zinc-700 mb-3">folder_off</span>
                            <h3 className="text-lg font-bold text-zinc-400">Pasta vazia</h3>
                            <p className="text-xs text-zinc-400 mt-1">Clique em "Upload" para adicionar fotos ou documentos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {folderFiles.map(f => {
                                const icon = getFileIcon(f.mimeType);
                                const isImage = f.mimeType.startsWith('image/');
                                return (
                                    <motion.a
                                        key={f.id}
                                        href={f.webViewLink || '#'} target="_blank" rel="noopener noreferrer"
                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.03, y: -2 }}
                                        className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer"
                                    >
                                        {isImage && f.thumbnailLink ? (
                                            <div className="w-full h-24 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                                                <img src={f.thumbnailLink} alt={f.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-24 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                                                <span className={`material-symbols-outlined text-3xl ${icon.color}`}>{icon.icon}</span>
                                            </div>
                                        )}
                                        <div className="p-3">
                                            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{f.name}</p>
                                        </div>
                                    </motion.a>
                                );
                            })}
                        </div>
                    )
                ) : (
                    /* === LISTA DE PASTAS DO DRIVE === */
                    <div className="space-y-8">
                        {/* Seção: Pastas por Ano (de Comunicação) */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-blue-500 text-lg">campaign</span>
                                <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Pastas por Ano (Comunicação)</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {commFolders.map(folder => (
                                    <motion.button key={folder.id} onClick={() => openFolder(folder, 'comm')}
                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.03, y: -3 }}
                                        className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 flex flex-col items-center text-center hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group">
                                        <span className="material-symbols-outlined text-4xl text-blue-400 group-hover:text-blue-500 mb-3 transition-colors">folder</span>
                                        <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{folder.name}</h4>
                                        <p className="text-[10px] text-zinc-400 mt-1">Comunicação</p>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Seção: Pastas de Pedagogia */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-emerald-500 text-lg">school</span>
                                <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Pastas de Pedagogia</h3>
                            </div>
                            {pedFolders.length === 0 ? (
                                <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl p-8 text-center">
                                    <span className="material-symbols-outlined text-3xl text-zinc-300 dark:text-zinc-600 mb-2">create_new_folder</span>
                                    <p className="text-xs text-zinc-400">Nenhuma pasta pedagógica. Clique em "Nova Pasta" para criar.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                    {pedFolders.map(folder => (
                                        <motion.button key={folder.id} onClick={() => openFolder(folder, 'ped')}
                                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.03, y: -3 }}
                                            className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 flex flex-col items-center text-center hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group">
                                            <span className="material-symbols-outlined text-4xl text-amber-400 group-hover:text-amber-500 mb-3 transition-colors">folder</span>
                                            <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{folder.name}</h4>
                                            <p className="text-[10px] text-zinc-400 mt-1">Pedagogia</p>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Nova Pasta */}
            <AnimatePresence>
                {showFolderModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setShowFolderModal(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md">
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white">Nova Pasta</h3>
                                <p className="text-xs text-zinc-500 mt-1">Será criada em: VAV SISTEMA → PEDAGOGIA</p>
                            </div>
                            <div className="p-6">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Nome da pasta *</label>
                                <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                                    placeholder="Ex: Jogos Matemáticos, Fotos Sábado 12/04..."
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 text-sm" />
                            </div>
                            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                                <button onClick={() => setShowFolderModal(false)} className="px-4 py-2 text-sm font-bold text-zinc-500">Cancelar</button>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCreateFolder} disabled={creatingFolder || !newFolderName.trim()}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-50">
                                    {creatingFolder ? 'Criando...' : 'Criar Pasta'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
