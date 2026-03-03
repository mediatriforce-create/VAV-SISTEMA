'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getMyClasses, createClass, createStudent, enrollStudent, getAllStudents, getTeachers } from '@/actions/pedagogia';
import type { Class, Student } from '@/types/pedagogia';

export default function TurmasPage() {
    const searchParams = useSearchParams();
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(searchParams.get('new') === '1');
    const [teachers, setTeachers] = useState<any[]>([]);

    // Form state para nova turma
    const [newClass, setNewClass] = useState({
        name: '', year_group: '1º Ano', school_year: 2026, shift: 'Manhã', teacher_id: '' as string | null
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadClasses();
        getTeachers().then(r => { if (r.success) setTeachers(r.data || []); });
    }, []);

    const loadClasses = async () => {
        setLoading(true);
        const res = await getMyClasses();
        if (res.success) setClasses(res.data || []);
        setLoading(false);
    };

    const handleCreateClass = async () => {
        if (!newClass.name.trim()) return;
        setCreating(true);
        const res = await createClass({
            ...newClass,
            teacher_id: newClass.teacher_id || null,
        });
        if (res.success) {
            setShowCreateModal(false);
            setNewClass({ name: '', year_group: '1º Ano', school_year: 2026, shift: 'Manhã', teacher_id: null });
            loadClasses();
        } else {
            console.error(res.message);
            alert(`Erro ao criar turma: ${res.message || 'Verifique se você tem permissão ou se rodou o SQL.'}`);
        }
        setCreating(false);
    };

    const yearGroups = ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'];
    const shifts = ['Manhã', 'Tarde', 'Integral'];

    return (
        <div className="h-full overflow-y-auto px-4 sm:px-8 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Turmas</h2>
                    <p className="text-sm text-zinc-500 mt-0.5">Gerencie turmas e alunos matriculados</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Nova Turma
                </motion.button>
            </div>

            {/* Grid de Turmas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-36 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse"></div>
                    ))
                ) : classes.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-zinc-300">school</span>
                        </div>
                        <h3 className="font-bold text-zinc-700 dark:text-zinc-300 text-lg mb-1">Nenhuma turma cadastrada</h3>
                        <p className="text-sm text-zinc-500 max-w-sm">Crie sua primeira turma clicando no botão acima para começar a gerenciar seus alunos.</p>
                    </div>
                ) : (
                    classes.map((cls, i) => (
                        <motion.div
                            key={cls.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <Link href={`/dashboard/pedagogia/turmas/${cls.id}`}>
                                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 p-5 hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:shadow-lg transition-all cursor-pointer group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <span className="material-symbols-outlined text-white text-2xl">groups</span>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full">{cls.shift}</span>
                                    </div>

                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-1">{cls.name}</h3>
                                    <p className="text-xs text-zinc-500 mb-3">{cls.year_group} • {cls.school_year}</p>

                                    <div className="flex items-center justify-between text-xs text-zinc-400">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">person</span>
                                            {(cls.teacher as any)?.full_name || 'Sem professor'}
                                        </span>
                                        <span className="flex items-center gap-1 font-bold">
                                            <span className="material-symbols-outlined text-sm">group</span>
                                            {cls.student_count}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal de Criar Turma */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden"
                        >
                            <form onSubmit={(e) => { e.preventDefault(); handleCreateClass(); }}>
                                <div className="p-6 border-b border-zinc-200 dark:border-white/10">
                                    <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">Nova Turma</h3>
                                    <p className="text-sm text-zinc-500 mt-1">Preencha os dados da turma</p>
                                </div>

                                <div className="p-6 flex flex-col gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Nome da Turma</label>
                                        <input
                                            type="text"
                                            required
                                            value={newClass.name}
                                            onChange={(e) => setNewClass(p => ({ ...p, name: e.target.value }))}
                                            placeholder="Ex: 1º Ano A"
                                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Ano/Série</label>
                                            <select
                                                value={newClass.year_group}
                                                onChange={(e) => setNewClass(p => ({ ...p, year_group: e.target.value }))}
                                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                                            >
                                                {yearGroups.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Turno</label>
                                            <select
                                                value={newClass.shift}
                                                onChange={(e) => setNewClass(p => ({ ...p, shift: e.target.value }))}
                                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                                            >
                                                {shifts.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Professor(a)</label>
                                        <select
                                            value={newClass.teacher_id || ''}
                                            onChange={(e) => setNewClass(p => ({ ...p, teacher_id: e.target.value || null }))}
                                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                                        >
                                            <option value="">Selecionar professor...</option>
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.role})</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="p-6 pt-0 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={creating || !newClass.name.trim()}
                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all"
                                    >
                                        {creating ? 'Criando...' : 'Criar Turma'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
