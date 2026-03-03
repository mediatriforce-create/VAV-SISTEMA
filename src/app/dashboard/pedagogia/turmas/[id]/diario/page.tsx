'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getClassById, getSessionByClassAndDate, createOrUpdateSession, saveAttendance, getSubjects } from '@/actions/pedagogia';
import type { Student, Subject, AttendanceStatus } from '@/types/pedagogia';

export default function DiarioPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classId } = use(params);
    const [classData, setClassData] = useState<any>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Dados da sessão
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [contentSummary, setContentSummary] = useState('');
    const [bnccSkills, setBnccSkills] = useState('');
    const [observations, setObservations] = useState('');
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});

    useEffect(() => {
        async function load() {
            const [classRes, subjectsRes] = await Promise.all([
                getClassById(classId),
                getSubjects(),
            ]);
            if (classRes.success) {
                setClassData(classRes.data);
                const studs = (classRes.data.memberships || []).map((m: any) => m.student).filter(Boolean);
                setStudents(studs);
                // Inicializar frequência como "present" para todos
                const initial: Record<string, AttendanceStatus> = {};
                studs.forEach((s: Student) => { initial[s.id] = 'present'; });
                setAttendance(initial);
            }
            if (subjectsRes.success) setSubjects(subjectsRes.data || []);
            setLoading(false);
        }
        load();
    }, [classId]);

    // Carregar sessão existente quando muda data/componente
    useEffect(() => {
        if (!classData) return;
        loadSession();
    }, [selectedDate, selectedSubject, classData]);

    const loadSession = async () => {
        const res = await getSessionByClassAndDate(classId, selectedDate);
        if (res.success && res.data) {
            setSessionId(res.data.id);
            setContentSummary(res.data.content_summary || '');
            setBnccSkills(res.data.bncc_skills || '');
            setObservations(res.data.observations || '');
            // Carregar frequência existente
            const att: Record<string, AttendanceStatus> = {};
            students.forEach(s => { att[s.id] = 'present'; });
            (res.data.attendance_records || []).forEach((r: any) => {
                att[r.student_id] = r.status;
            });
            setAttendance(att);
        } else {
            setSessionId(null);
            setContentSummary('');
            setBnccSkills('');
            setObservations('');
            const initial: Record<string, AttendanceStatus> = {};
            students.forEach(s => { initial[s.id] = 'present'; });
            setAttendance(initial);
        }
    };

    const toggleAttendance = (studentId: string) => {
        setAttendance(prev => {
            const current = prev[studentId] || 'present';
            const next: AttendanceStatus = current === 'present' ? 'absent' : current === 'absent' ? 'late' : 'present';
            return { ...prev, [studentId]: next };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);

        // 1. Criar/Atualizar sessão
        const sessionRes = await createOrUpdateSession({
            class_id: classId,
            subject_id: selectedSubject || null,
            date: selectedDate,
            content_summary: contentSummary,
            bncc_skills: bnccSkills,
            observations,
        });

        if (sessionRes.success && sessionRes.data) {
            const sid = sessionRes.data.id;
            setSessionId(sid);

            // 2. Salvar frequência
            const records = students.map(s => ({
                student_id: s.id,
                status: attendance[s.id] || 'present' as AttendanceStatus,
            }));

            await saveAttendance(sid, records);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }

        setSaving(false);
    };

    const statusConfig = {
        present: { label: 'P', color: 'bg-emerald-500 text-white', fullLabel: 'Presente' },
        absent: { label: 'F', color: 'bg-red-500 text-white', fullLabel: 'Ausente' },
        late: { label: 'A', color: 'bg-amber-500 text-white', fullLabel: 'Atraso' },
    };

    const presentCount = Object.values(attendance).filter(s => s === 'present').length;
    const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
    const lateCount = Object.values(attendance).filter(s => s === 'late').length;

    if (loading) {
        return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    const formattedDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Header fixo */}
            <div className="shrink-0 px-4 sm:px-8 py-4 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={`/dashboard/pedagogia/turmas/${classId}`} className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined text-zinc-600 dark:text-zinc-400 text-lg">arrow_back</span>
                        </Link>
                        <div>
                            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">Diário — {classData?.name}</h2>
                            <p className="text-xs text-zinc-500 capitalize">{formattedDate}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Seletor de data */}
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                        />

                        {/* Componente */}
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500 transition-colors hidden sm:block"
                        >
                            <option value="">Componente...</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>

                        {/* Salvar */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all ${saved
                                    ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/25'
                                } disabled:opacity-50`}
                        >
                            <span className="material-symbols-outlined text-lg">{saved ? 'check_circle' : saving ? 'hourglass_top' : 'save'}</span>
                            {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar Diário'}
                        </motion.button>
                    </div>
                </div>

                {/* Resumo de frequência */}
                <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[10px]">P</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{presentCount}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="w-5 h-5 rounded-md bg-red-500 text-white flex items-center justify-center text-[10px]">F</span>
                        <span className="text-red-500">{absentCount}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center text-[10px]">A</span>
                        <span className="text-amber-500">{lateCount}</span>
                    </span>
                    <span className="text-xs text-zinc-400 ml-2">Total: {students.length} alunos</span>
                    {sessionId && (
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                            ✓ Diário registrado
                        </span>
                    )}
                </div>
            </div>

            {/* Área de conteúdo scrollável */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Coluna 1: Frequência */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">how_to_reg</span>
                            Chamada
                        </h3>
                        <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 overflow-hidden">
                            {students.length === 0 ? (
                                <div className="p-8 text-center text-sm text-zinc-500">Nenhum aluno matriculado</div>
                            ) : (
                                <div className="divide-y divide-zinc-100 dark:divide-white/5">
                                    {students.map((student, i) => {
                                        const status = attendance[student.id] || 'present';
                                        const config = statusConfig[status];

                                        return (
                                            <motion.button
                                                key={student.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => toggleAttendance(student.id)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors text-left"
                                            >
                                                <span className="text-xs text-zinc-400 w-5 text-right">{i + 1}</span>
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
                                                    {student.full_name?.charAt(0)}
                                                </div>
                                                <span className="flex-1 text-sm font-medium text-zinc-900 dark:text-white truncate">{student.full_name}</span>
                                                <motion.span
                                                    key={status}
                                                    initial={{ scale: 0.8 }}
                                                    animate={{ scale: 1 }}
                                                    className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center text-xs font-black shadow-sm`}
                                                    title={config.fullLabel}
                                                >
                                                    {config.label}
                                                </motion.span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Coluna 2: Conteúdo e Observações */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">menu_book</span>
                                Conteúdo Ministrado
                            </h3>
                            <textarea
                                value={contentSummary}
                                onChange={(e) => setContentSummary(e.target.value)}
                                placeholder="Descreva o conteúdo trabalhado na aula de hoje..."
                                className="w-full h-28 px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500 resize-none transition-colors"
                            />
                        </div>

                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">psychology</span>
                                Habilidades BNCC
                            </h3>
                            <textarea
                                value={bnccSkills}
                                onChange={(e) => setBnccSkills(e.target.value)}
                                placeholder="Ex: EF01LP01, EF02MA03 — ou descreva as habilidades trabalhadas"
                                className="w-full h-20 px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500 resize-none transition-colors"
                            />
                        </div>

                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">sticky_note_2</span>
                                Observações Pedagógicas
                            </h3>
                            <textarea
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                                placeholder="Dificuldades comuns, destaques, comportamento geral da turma..."
                                className="w-full h-28 px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500 resize-none transition-colors"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
