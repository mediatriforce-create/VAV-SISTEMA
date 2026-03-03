'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getMyClasses, getPedagogiaStats } from '@/actions/pedagogia';
import type { Class } from '@/types/pedagogia';

export default function PedagogiaHome() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [stats, setStats] = useState({ totalClasses: 0, totalStudents: 0, todaySessions: 0, pendingDiaries: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [classesRes, statsRes] = await Promise.all([
                getMyClasses(),
                getPedagogiaStats(),
            ]);
            if (classesRes.success) setClasses(classesRes.data || []);
            if (statsRes.success && statsRes.data) setStats(statsRes.data);
            setLoading(false);
        }
        load();
    }, []);

    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    const statCards = [
        { label: 'Minhas Turmas', value: stats.totalClasses, icon: 'groups', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
        { label: 'Total de Alunos', value: stats.totalStudents, icon: 'school', color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
        { label: 'Aulas de Hoje', value: stats.todaySessions, icon: 'today', color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
        { label: 'Diários Pendentes', value: stats.pendingDiaries, icon: 'pending_actions', color: stats.pendingDiaries > 0 ? 'from-red-500 to-pink-600' : 'from-zinc-400 to-zinc-500', shadow: stats.pendingDiaries > 0 ? 'shadow-red-500/20' : 'shadow-zinc-400/10' },
    ];

    const quickActions = [
        { label: 'Abrir Diário', icon: 'edit_note', href: '/dashboard/pedagogia/turmas', desc: 'Registrar presença e conteúdo' },
        { label: 'Nova Turma', icon: 'group_add', href: '/dashboard/pedagogia/turmas?new=1', desc: 'Criar turma e matricular alunos' },
        { label: 'Ver Turmas', icon: 'list', href: '/dashboard/pedagogia/turmas', desc: 'Visualizar todas as turmas' },
    ];

    return (
        <div className="h-full overflow-y-auto px-4 sm:px-8 py-6">
            {/* Saudação */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    Painel Pedagógico
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 capitalize">{today}</p>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                {statCards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 p-4 shadow-sm"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{card.label}</p>
                                <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">
                                    {loading ? '—' : card.value}
                                </p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} ${card.shadow} shadow-lg flex items-center justify-center`}>
                                <span className="material-symbols-outlined text-white text-xl">{card.icon}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ações Rápidas */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-1"
                >
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">bolt</span>
                        Ações Rápidas
                    </h3>
                    <div className="flex flex-col gap-2">
                        {quickActions.map((action) => (
                            <Link key={action.label} href={action.href}>
                                <motion.div
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:shadow-md transition-all group cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 group-hover:text-white text-xl">{action.icon}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{action.label}</h4>
                                        <p className="text-[11px] text-zinc-400">{action.desc}</p>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Minhas Turmas */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2"
                >
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">groups</span>
                        Minhas Turmas
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse"></div>
                            ))
                        ) : classes.length === 0 ? (
                            <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                                <span className="material-symbols-outlined text-5xl text-zinc-300 dark:text-zinc-600 mb-3">school</span>
                                <p className="text-sm text-zinc-500">Nenhuma turma encontrada</p>
                                <p className="text-xs text-zinc-400 mt-1">Crie uma turma em "Nova Turma"</p>
                            </div>
                        ) : (
                            classes.map((cls) => (
                                <Link key={cls.id} href={`/dashboard/pedagogia/turmas/${cls.id}`}>
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 p-4 hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:shadow-lg transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{cls.name}</h4>
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">{cls.shift}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">person</span>
                                                {(cls.teacher as any)?.full_name || 'Sem professor'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">group</span>
                                                {cls.student_count} aluno{cls.student_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
