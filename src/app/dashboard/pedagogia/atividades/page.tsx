'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyClasses, getActivities, createActivity } from '@/actions/pedagogia';
import type { Class, PedActivity } from '@/types/pedagogia';

interface DriveFolder {
    id: string;
    name: string;
    source: 'comm' | 'ped';
}

export default function AtividadesPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [activities, setActivities] = useState<PedActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Upload de fotos
    const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [foldersLoading, setFoldersLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getMyClasses().then(res => {
            if (res.success && res.data) {
                setClasses(res.data);
                if (res.data.length > 0) setSelectedClass(res.data[0].id);
            }
            setLoading(false);
        });
    }, []);

    // Recarrega atividades quando turma/data mudam
    useEffect(() => {
        if (!selectedClass) return;
        setLoading(true);
        getActivities(selectedClass, selectedDate).then(res => {
            if (res.success && res.data) setActivities(res.data);
            else setActivities([]);
            setLoading(false);
        });
    }, [selectedClass, selectedDate]);

    // Carrega pastas do Drive quando abre o modal
    const loadDriveFolders = async () => {
        setFoldersLoading(true);
        try {
            const { syncGoogleDriveStructure, createGoogleDriveFolder, listGoogleDriveFiles } = await import('@/modules/comunicacao/actions');

            const syncRes = await syncGoogleDriveStructure();
            if (!syncRes.success || !syncRes.data) return;

            const { rootId, folders: commFolderIds } = syncRes.data;
            const allFolders: DriveFolder[] = [];

            // Pastas de Comunicação (1-5 ANO)
            ['1 ANO', '2 ANO', '3 ANO', '4 ANO', '5 ANO'].forEach(name => {
                if (commFolderIds[name]) {
                    allFolders.push({ id: commFolderIds[name], name, source: 'comm' });
                }
            });

            // Pastas de Pedagogia
            const pedRes = await createGoogleDriveFolder('PEDAGOGIA', rootId);
            if (pedRes.success && pedRes.folderId) {
                const pedList = await listGoogleDriveFiles(pedRes.folderId);
                if (pedList.success && pedList.files) {
                    pedList.files
                        .filter((f: any) => f.mimeType === 'application/vnd.google-apps.folder')
                        .forEach((f: any) => allFolders.push({ id: f.id, name: f.name, source: 'ped' }));
                }
            }

            setDriveFolders(allFolders);
        } catch (err) {
            console.error('loadDriveFolders Error:', err);
        }
        setFoldersLoading(false);
    };

    const openModal = () => {
        setShowModal(true);
        loadDriveFolders();
    };

    const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreate = async () => {
        if (!formTitle.trim() || !selectedClass) return;
        setSubmitting(true);

        // 1. Criar a atividade
        const res = await createActivity({
            class_id: selectedClass,
            activity_date: selectedDate,
            title: formTitle,
            description: formDesc || undefined,
            notes: formNotes || undefined,
        });

        // 2. Enviar fotos para a pasta selecionada do Drive
        if (selectedFiles.length > 0 && selectedFolderId) {
            const { uploadGoogleDriveFile } = await import('@/modules/comunicacao/actions');
            for (let i = 0; i < selectedFiles.length; i++) {
                const formData = new FormData();
                formData.append('file', selectedFiles[i]);
                await uploadGoogleDriveFile(formData, selectedFolderId);
                setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
            }
        }

        if (res.success && res.data) {
            setActivities(prev => [res.data!, ...prev]);
        }

        // Reset
        setFormTitle(''); setFormDesc(''); setFormNotes('');
        setSelectedFiles([]); setSelectedFolderId(''); setUploadProgress(0);
        setSubmitting(false);
        setShowModal(false);
    };

    const selectedClassName = classes.find(c => c.id === selectedClass)?.name || '';

    return (
        <div className="h-full flex flex-col min-h-0 p-4 sm:p-6">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Atividades do Dia</h2>
                    <p className="text-xs text-zinc-500">Registre o que será/foi feito em cada encontro</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={openModal}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Nova Atividade
                </motion.button>
            </div>

            {/* Filtros */}
            <div className="shrink-0 flex items-center gap-4 mb-5">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-zinc-400 text-lg">groups</span>
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                        className="px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium outline-none focus:border-emerald-500">
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.shift})</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-zinc-400 text-lg">calendar_today</span>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                        className="px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium outline-none focus:border-emerald-500" />
                </div>
            </div>

            {/* Lista de Atividades */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <span className="material-symbols-outlined text-5xl text-zinc-200 dark:text-zinc-700 mb-3">event_busy</span>
                        <h3 className="text-lg font-bold text-zinc-400 dark:text-zinc-500">Nenhuma atividade nesta data</h3>
                        <p className="text-xs text-zinc-400 mt-1">Selecione outra data ou clique em "Nova Atividade" para registrar.</p>
                    </div>
                ) : (
                    activities.map(act => (
                        <motion.div
                            key={act.id}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-zinc-900 dark:text-white">{act.title}</h3>
                                <span className="text-[10px] font-medium text-zinc-400">
                                    {new Date(act.activity_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                            {act.description && <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{act.description}</p>}
                            {act.notes && (
                                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-800 rounded-xl p-3 mb-2">
                                    <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">info</span>
                                    <p className="text-xs text-amber-700 dark:text-amber-400">{act.notes}</p>
                                </div>
                            )}
                            {(act.files || []).length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {(act.files || []).map(f => (
                                        <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-600">
                                            <span className="material-symbols-outlined text-xs">
                                                {f.file_type === 'pdf' ? 'picture_as_pdf' : f.file_type === 'image' ? 'image' : 'description'}
                                            </span>
                                            {f.name}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal Nova Atividade */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg max-h-[90vh] flex flex-col"
                        >
                            <div className="shrink-0 p-6 border-b border-zinc-100 dark:border-zinc-800">
                                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white">Nova Atividade</h3>
                                <p className="text-xs text-zinc-500 mt-1">{selectedClassName} — {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Título *</label>
                                    <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: Jogo de Matemática com tampinhas"
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Descrição</label>
                                    <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} placeholder="O que será feito e como..."
                                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-sm resize-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Observações</label>
                                    <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} placeholder="Ex: Levar cartolina, fulano precisa de apoio..."
                                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-sm resize-none" />
                                </div>

                                {/* === UPLOAD DE FOTOS === */}
                                <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-emerald-500 text-lg">photo_camera</span>
                                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Fotos do Dia</label>
                                    </div>
                                    <div className="p-4 flex flex-col gap-3">
                                        {/* Seletor de pasta */}
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Enviar para a pasta:</label>
                                            {foldersLoading ? (
                                                <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
                                                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                                    Carregando pastas do Drive...
                                                </div>
                                            ) : (
                                                <select value={selectedFolderId} onChange={e => setSelectedFolderId(e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-sm focus:border-emerald-500">
                                                    <option value="">Não enviar fotos</option>
                                                    {driveFolders.filter(f => f.source === 'comm').length > 0 && (
                                                        <optgroup label="📢 Comunicação">
                                                            {driveFolders.filter(f => f.source === 'comm').map(f => (
                                                                <option key={f.id} value={f.id}>{f.name}</option>
                                                            ))}
                                                        </optgroup>
                                                    )}
                                                    {driveFolders.filter(f => f.source === 'ped').length > 0 && (
                                                        <optgroup label="🎓 Pedagogia">
                                                            {driveFolders.filter(f => f.source === 'ped').map(f => (
                                                                <option key={f.id} value={f.id}>{f.name}</option>
                                                            ))}
                                                        </optgroup>
                                                    )}
                                                </select>
                                            )}
                                        </div>

                                        {/* Seletor de arquivos */}
                                        {selectedFolderId && (
                                            <>
                                                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFilesSelected} />
                                                <motion.button
                                                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-full border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl py-4 flex flex-col items-center gap-1 text-zinc-400 hover:text-emerald-500 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                                                    <span className="text-xs font-medium">Clique para selecionar fotos</span>
                                                </motion.button>

                                                {/* Lista de fotos selecionadas */}
                                                {selectedFiles.length > 0 && (
                                                    <div className="space-y-1.5">
                                                        <p className="text-[10px] font-bold text-zinc-500 uppercase">{selectedFiles.length} foto(s) selecionada(s)</p>
                                                        {selectedFiles.map((file, i) => (
                                                            <div key={i} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
                                                                <span className="material-symbols-outlined text-blue-500 text-sm">image</span>
                                                                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1">{file.name}</span>
                                                                <span className="text-[10px] text-zinc-400 shrink-0">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                                                <button onClick={() => removeFile(i)} className="text-zinc-300 hover:text-red-500 transition-colors shrink-0">
                                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="shrink-0 p-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                                {submitting && uploadProgress > 0 && (
                                    <div className="flex-1 flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-600">{uploadProgress}%</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 ml-auto">
                                    <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">Cancelar</button>
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCreate} disabled={submitting || !formTitle.trim()}
                                        className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-50">
                                        {submitting ? (selectedFiles.length > 0 ? 'Enviando fotos...' : 'Salvando...') : (selectedFiles.length > 0 ? `Registrar + Enviar ${selectedFiles.length} foto(s)` : 'Registrar')}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
