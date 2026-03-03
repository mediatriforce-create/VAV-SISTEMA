'use client';

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getClassById, createStudent, enrollStudent, removeStudentFromClass, getAllStudents } from '@/actions/pedagogia';
import type { Student } from '@/types/pedagogia';

export default function TurmaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classId } = use(params);
    const [classData, setClassData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [showNewStudent, setShowNewStudent] = useState(false);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [searchStudent, setSearchStudent] = useState('');
    const [newStudent, setNewStudent] = useState({ full_name: '', guardian_name: '', guardian_phone: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadClass();
    }, [classId]);

    const loadClass = async () => {
        setLoading(true);
        const res = await getClassById(classId);
        if (res.success) setClassData(res.data);
        setLoading(false);
    };

    const handleEnroll = async (studentId: string) => {
        setSaving(true);
        const res = await enrollStudent(classId, studentId);
        if (res.success) {
            loadClass();
            setShowAddStudent(false);
        }
        setSaving(false);
    };

    const handleCreateAndEnroll = async () => {
        if (!newStudent.full_name.trim()) return;
        setSaving(true);
        const res = await createStudent(newStudent);
        if (res.success && res.data) {
            await enrollStudent(classId, res.data.id);
            setNewStudent({ full_name: '', guardian_name: '', guardian_phone: '' });
            setShowNewStudent(false);
            loadClass();
        }
        setSaving(false);
    };

    const handleRemoveStudent = async (studentId: string) => {
        const res = await removeStudentFromClass(classId, studentId);
        if (res.success) loadClass();
    };

    const openAddExisting = async () => {
        setShowAddStudent(true);
        const res = await getAllStudents();
        if (res.success) setAllStudents(res.data || []);
    };

    const enrolledIds = new Set((classData?.memberships || []).map((m: any) => m.student?.id));
    const filteredStudents = allStudents
        .filter(s => !enrolledIds.has(s.id))
        .filter(s => s.full_name.toLowerCase().includes(searchStudent.toLowerCase()));

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!classData) {
        return (
            <div className="h-full flex items-center justify-center text-zinc-500">Turma não encontrada</div>
        );
    }

    const students = (classData.memberships || []).map((m: any) => m.student).filter(Boolean);

    return (
        <div className="h-full overflow-y-auto px-4 sm:px-8 py-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link href="/dashboard/pedagogia/turmas" className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-zinc-600 dark:text-zinc-400">arrow_back</span>
                </Link>
                <div className="flex-1">
                    <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">{classData.name}</h2>
                    <p className="text-sm text-zinc-500">{classData.year_group} • {classData.shift} • {classData.school_year}</p>
                </div>
                <Link href={`/dashboard/pedagogia/turmas/${classId}/diario`}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25"
                    >
                        <span className="material-symbols-outlined text-lg">edit_note</span>
                        Abrir Diário
                    </motion.button>
                </Link>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Professor(a)</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white mt-1">{classData.teacher?.full_name || 'Não definido'}</p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Alunos</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white mt-1">{students.length} matriculados</p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Ano Letivo</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white mt-1">{classData.school_year}</p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Turno</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white mt-1">{classData.shift}</p>
                </div>
            </div>

            {/* Lista de Alunos */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">school</span>
                    Alunos Matriculados
                </h3>
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={openAddExisting}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">person_add</span>
                        Adicionar Existente
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowNewStudent(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">person_add</span>
                        Novo Aluno
                    </motion.button>
                </div>
            </div>

            {/* Formulário Novo Aluno inline */}
            <AnimatePresence>
                {showNewStudent && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 overflow-hidden"
                    >
                        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 p-4">
                            <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3">Cadastrar Novo Aluno</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                <input
                                    type="text" placeholder="Nome completo do aluno"
                                    value={newStudent.full_name}
                                    onChange={e => setNewStudent(p => ({ ...p, full_name: e.target.value }))}
                                    className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-sm outline-none focus:border-emerald-500"
                                />
                                <input
                                    type="text" placeholder="Nome do responsável"
                                    value={newStudent.guardian_name}
                                    onChange={e => setNewStudent(p => ({ ...p, guardian_name: e.target.value }))}
                                    className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-sm outline-none focus:border-emerald-500"
                                />
                                <input
                                    type="text" placeholder="Telefone do responsável"
                                    value={newStudent.guardian_phone}
                                    onChange={e => setNewStudent(p => ({ ...p, guardian_phone: e.target.value }))}
                                    className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-sm outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setShowNewStudent(false)} className="text-xs text-zinc-500 hover:text-zinc-700 px-3 py-2">Cancelar</button>
                                <button
                                    onClick={handleCreateAndEnroll}
                                    disabled={saving || !newStudent.full_name.trim()}
                                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold disabled:opacity-50"
                                >
                                    {saving ? 'Salvando...' : 'Cadastrar e Matricular'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Picker de aluno existente */}
            <AnimatePresence>
                {showAddStudent && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 overflow-hidden"
                    >
                        <div className="rounded-2xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 p-4">
                            <input
                                type="text" placeholder="Buscar aluno por nome..."
                                value={searchStudent}
                                onChange={e => setSearchStudent(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-sm outline-none focus:border-blue-500 mb-3"
                            />
                            <div className="max-h-40 overflow-y-auto flex flex-col gap-1">
                                {filteredStudents.length === 0 ? (
                                    <p className="text-xs text-zinc-500 text-center py-4">Nenhum aluno disponível</p>
                                ) : filteredStudents.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => handleEnroll(s.id)}
                                        className="flex items-center gap-2 p-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/10 text-left transition-colors text-sm"
                                    >
                                        <span className="material-symbols-outlined text-blue-500 text-sm">person_add</span>
                                        <span className="text-zinc-900 dark:text-white font-medium">{s.full_name}</span>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setShowAddStudent(false)} className="text-xs text-zinc-500 hover:text-zinc-700 mt-2">Fechar</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabela de alunos */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 overflow-hidden">
                {students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <span className="material-symbols-outlined text-4xl text-zinc-300 mb-3">school</span>
                        <p className="text-sm text-zinc-500">Nenhum aluno matriculado nesta turma</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-200 dark:border-white/10">
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-5 py-3">#</th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-5 py-3">Aluno</th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-5 py-3 hidden sm:table-cell">Responsável</th>
                                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-5 py-3 hidden sm:table-cell">Telefone</th>
                                <th className="text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-5 py-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student: Student, i: number) => (
                                <tr key={student.id} className="border-b border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-5 py-3 text-xs text-zinc-400">{i + 1}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                                {student.full_name?.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium text-zinc-900 dark:text-white">{student.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-sm text-zinc-500 hidden sm:table-cell">{student.guardian_name || '—'}</td>
                                    <td className="px-5 py-3 text-sm text-zinc-500 hidden sm:table-cell">{student.guardian_phone || '—'}</td>
                                    <td className="px-5 py-3 text-right">
                                        <button
                                            onClick={() => handleRemoveStudent(student.id)}
                                            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 px-2 py-1 rounded-lg transition-colors"
                                            title="Remover da turma"
                                        >
                                            <span className="material-symbols-outlined text-sm">person_remove</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
