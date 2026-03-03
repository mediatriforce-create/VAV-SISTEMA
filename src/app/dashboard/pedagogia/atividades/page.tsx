'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyClasses, getActivities, createActivity, getAllFiles } from '@/actions/pedagogia';
import type { Class, PedActivity, PedFile } from '@/types/pedagogia';

export default function AtividadesPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [activities, setActivities] = useState<PedActivity[]>([]);
    const [allFiles, setAllFiles] = useState<PedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [formFileIds, setFormFileIds] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [showFilePicker, setShowFilePicker] = useState(false);

    useEffect(() => {
        getMyClasses().then(res => {
            if (res.success && res.data) {
                setClasses(res.data);
                if (res.data.length > 0) setSelectedClass(res.data[0].id);
            }
            setLoading(false);
        });
        getAllFiles().then(res => {
            if (res.success && res.data) setAllFiles(res.data);
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

    const handleCreate = async () => {
        if (!formTitle.trim() || !selectedClass) return;
        setSubmitting(true);
        const res = await createActivity({
            class_id: selectedClass,
            activity_date: selectedDate,
            title: formTitle,
            description: formDesc || undefined,
            notes: formNotes || undefined,
            file_ids: formFileIds.length > 0 ? formFileIds : undefined,
        });
        if (res.success && res.data) {
            setActivities(prev => [res.data!, ...prev]);
        }
        setFormTitle(''); setFormDesc(''); setFormNotes(''); setFormFileIds([]);
        setSubmitting(false);
        setShowModal(false);
    };

    const toggleFile = (id: string) => {
        setFormFileIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
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
                    onClick={() => setShowModal(true)}
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
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
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
                            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white">Nova Atividade</h3>
                                <p className="text-xs text-zinc-500 mt-1">{selectedClassName} — {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div className="p-6 flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Título *</label>
                                    <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: Jogo de Matemática com tampinhas"
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Descrição</label>
                                    <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={3} placeholder="O que será feito e como..."
                                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-sm resize-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Observações</label>
                                    <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} placeholder="Ex: Levar cartolina, fulano precisa de apoio..."
                                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-sm resize-none" />
                                </div>

                                {/* Seletor de Arquivos */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Arquivos vinculados</label>
                                        <button type="button" onClick={() => setShowFilePicker(!showFilePicker)}
                                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">attach_file</span>
                                            {showFilePicker ? 'Fechar' : 'Selecionar'}
                                        </button>
                                    </div>
                                    {formFileIds.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {formFileIds.map(fid => {
                                                const f = allFiles.find(x => x.id === fid);
                                                return f ? (
                                                    <span key={fid} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-800">
                                                        {f.name}
                                                        <button onClick={() => toggleFile(fid)} className="hover:text-red-500">×</button>
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                    <AnimatePresence>
                                        {showFilePicker && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden"
                                            >
                                                <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                                                    {allFiles.length === 0 ? (
                                                        <p className="text-xs text-zinc-400 text-center py-4">Nenhum arquivo no banco. Faça upload na aba Arquivos.</p>
                                                    ) : (
                                                        allFiles.map(f => {
                                                            const sel = formFileIds.includes(f.id);
                                                            return (
                                                                <button key={f.id} type="button" onClick={() => toggleFile(f.id)}
                                                                    className={`w-full text-left flex items-center gap-2 p-2 rounded-lg text-xs transition-all ${sel ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                                                                    <span className={`material-symbols-outlined text-sm ${sel ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                                                        {sel ? 'check_circle' : 'radio_button_unchecked'}
                                                                    </span>
                                                                    <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">{f.name}</span>
                                                                    <span className="text-[10px] text-zinc-400 ml-auto shrink-0">{f.file_type}</span>
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">Cancelar</button>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCreate} disabled={submitting || !formTitle.trim()}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-50">
                                    {submitting ? 'Salvando...' : 'Registrar'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
