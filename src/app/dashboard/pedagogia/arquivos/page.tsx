'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFolders, createFolder, getFilesInFolder, uploadPedFile } from '@/actions/pedagogia';
import type { PedFolder, PedFile } from '@/types/pedagogia';

const YEAR_OPTIONS = [
    { value: '1', label: '1º Ano' },
    { value: '2', label: '2º Ano' },
    { value: '3', label: '3º Ano' },
    { value: '4', label: '4º Ano' },
    { value: '5', label: '5º Ano' },
    { value: 'multi', label: 'Multi-ano' },
];

const FILE_ICONS: Record<string, { icon: string; color: string }> = {
    pdf: { icon: 'picture_as_pdf', color: 'text-red-500' },
    image: { icon: 'image', color: 'text-blue-500' },
    doc: { icon: 'description', color: 'text-zinc-500' },
    link: { icon: 'link', color: 'text-purple-500' },
};

export default function ArquivosPage() {
    const [folders, setFolders] = useState<PedFolder[]>([]);
    const [activeFolder, setActiveFolder] = useState<PedFolder | null>(null);
    const [files, setFiles] = useState<PedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filesLoading, setFilesLoading] = useState(false);

    // Modals
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [folderYear, setFolderYear] = useState('multi');
    const [folderType, setFolderType] = useState('materiais');
    const [creatingFolder, setCreatingFolder] = useState(false);

    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadFolders();
    }, []);

    const loadFolders = async () => {
        setLoading(true);
        const res = await getFolders();
        if (res.success && res.data) setFolders(res.data);
        setLoading(false);
    };

    const openFolder = async (folder: PedFolder) => {
        setActiveFolder(folder);
        setFilesLoading(true);
        const res = await getFilesInFolder(folder.id);
        if (res.success && res.data) setFiles(res.data);
        else setFiles([]);
        setFilesLoading(false);
    };

    const handleCreateFolder = async () => {
        if (!folderName.trim()) return;
        setCreatingFolder(true);
        const res = await createFolder({ name: folderName, school_year: folderYear, folder_type: folderType });
        if (res.success && res.data) setFolders(prev => [...prev, res.data!]);
        setFolderName(''); setFolderYear('multi'); setFolderType('materiais');
        setCreatingFolder(false);
        setShowFolderModal(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeFolder) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadPedFile(formData, activeFolder.id);
        if (res.success && res.data) setFiles(prev => [res.data!, ...prev]);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="h-full flex flex-col min-h-0 p-4 sm:p-6">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    {activeFolder ? (
                        <>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => { setActiveFolder(null); setFiles([]); }}
                                className="w-9 h-9 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                <span className="material-symbols-outlined text-lg text-zinc-600 dark:text-zinc-300">arrow_back</span>
                            </motion.button>
                            <div>
                                <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">{activeFolder.name}</h2>
                                <p className="text-xs text-zinc-500">
                                    {YEAR_OPTIONS.find(y => y.value === activeFolder.school_year)?.label} · {activeFolder.folder_type}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div>
                            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Arquivos de Aula</h2>
                            <p className="text-xs text-zinc-500">Organize fotos, PDFs e materiais por pasta</p>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {activeFolder && (
                        <>
                            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
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
                    ) : files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <span className="material-symbols-outlined text-5xl text-zinc-200 dark:text-zinc-700 mb-3">folder_off</span>
                            <h3 className="text-lg font-bold text-zinc-400">Pasta vazia</h3>
                            <p className="text-xs text-zinc-400 mt-1">Clique em "Upload" para adicionar arquivos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {files.map(f => {
                                const icon = FILE_ICONS[f.file_type] || FILE_ICONS.doc;
                                return (
                                    <motion.a
                                        key={f.id}
                                        href={f.file_url} target="_blank" rel="noopener noreferrer"
                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.03, y: -2 }}
                                        className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer"
                                    >
                                        <span className={`material-symbols-outlined text-3xl mb-2 ${icon.color}`}>{icon.icon}</span>
                                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate w-full">{f.name}</p>
                                        <p className="text-[10px] text-zinc-400 mt-1">{f.file_type.toUpperCase()}</p>
                                    </motion.a>
                                );
                            })}
                        </div>
                    )
                ) : (
                    /* === LISTA DE PASTAS === */
                    folders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <span className="material-symbols-outlined text-5xl text-zinc-200 dark:text-zinc-700 mb-3">folder_open</span>
                            <h3 className="text-lg font-bold text-zinc-400">Nenhuma pasta criada</h3>
                            <p className="text-xs text-zinc-400 mt-1">Clique em "Nova Pasta" para começar a organizar.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {folders.map(folder => (
                                <motion.button
                                    key={folder.id}
                                    onClick={() => openFolder(folder)}
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.03, y: -3 }}
                                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 flex flex-col items-center text-center hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group"
                                >
                                    <span className="material-symbols-outlined text-4xl text-amber-400 group-hover:text-amber-500 mb-3 transition-colors">folder</span>
                                    <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 mb-1">{folder.name}</h4>
                                    <p className="text-[10px] text-zinc-400">
                                        {YEAR_OPTIONS.find(y => y.value === folder.school_year)?.label}
                                    </p>
                                </motion.button>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Modal Nova Pasta */}
            <AnimatePresence>
                {showFolderModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setShowFolderModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md"
                        >
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white">Nova Pasta</h3>
                            </div>
                            <div className="p-6 flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Nome *</label>
                                    <input value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Ex: 1º Ano – Materiais gerais"
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 text-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Ano</label>
                                        <select value={folderYear} onChange={e => setFolderYear(e.target.value)}
                                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-sm">
                                            {YEAR_OPTIONS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Tipo</label>
                                        <select value={folderType} onChange={e => setFolderType(e.target.value)}
                                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-sm">
                                            <option value="materiais">Materiais</option>
                                            <option value="fotos">Fotos</option>
                                            <option value="jogos">Jogos</option>
                                            <option value="outros">Outros</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                                <button onClick={() => setShowFolderModal(false)} className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">Cancelar</button>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCreateFolder} disabled={creatingFolder || !folderName.trim()}
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
