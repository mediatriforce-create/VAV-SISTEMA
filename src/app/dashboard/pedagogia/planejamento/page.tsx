'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getMyClasses } from '@/actions/pedagogia';
import { getLessonPlans } from '@/actions/pedagogia_fase2';
import type { Class, LessonPlan } from '@/types/pedagogia';

export default function PlanejamentoPage() {
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [plans, setPlans] = useState<LessonPlan[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const resClasses = await getMyClasses();
        if (resClasses.success && resClasses.data && resClasses.data.length > 0) {
            setClasses(resClasses.data);
            setSelectedClassId(resClasses.data[0].id);
        } else {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedClassId) return;
        const fetchPlans = async () => {
            setLoading(true);
            const res = await getLessonPlans(selectedClassId);
            if (res.success && res.data) setPlans(res.data);
            setLoading(false);
        };
        fetchPlans();
    }, [selectedClassId]);

    return (
        <div className="h-full flex flex-col min-h-0 px-4 sm:px-8 py-6">
            <div className="shrink-0 flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Central de Planejamento</h2>
                    <p className="text-sm text-zinc-500 mt-0.5">Elabore e consulte seus planos de aula semanais</p>
                </div>
                <Link href="/dashboard/pedagogia/planejamento/novo">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">add_notes</span>
                        Novo Plano de Aula
                    </motion.button>
                </Link>
            </div>

            {/* Turma Tabs */}
            {classes.length > 0 && (
                <div className="shrink-0 flex items-center gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide border-b border-zinc-100 dark:border-zinc-800">
                    {classes.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedClassId(c.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${selectedClassId === c.id
                                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md'
                                : 'bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex-1 overflow-y-auto pt-2">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse"></div>
                        ))}
                    </div>
                ) : plans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center col-span-full h-full">
                        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-emerald-500">calendar_month</span>
                        </div>
                        <h3 className="font-bold text-zinc-700 dark:text-zinc-300 text-lg mb-1">Nenhum plano para esta turma</h3>
                        <p className="text-sm text-zinc-500 max-w-sm mb-6">Você pode associar habilidades da BNCC e anexar arquivos do Banco de Atividades.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                        {plans.map(plan => (
                            <Link key={plan.id} href={`/dashboard/pedagogia/planejamento/${plan.id}`}>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="h-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${plan.status === 'Publicado'
                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                                }`}>
                                                {plan.status}
                                            </span>
                                            <span className="text-xs font-bold text-zinc-400">
                                                {new Date(plan.target_date + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-lg leading-tight mb-2 line-clamp-2" title={plan.theme}>{plan.theme}</h3>
                                        {plan.methodology && (
                                            <p className="text-xs text-zinc-500 line-clamp-3 mb-4">{plan.methodology}</p>
                                        )}
                                    </div>
                                    <div className="mt-auto border-t border-zinc-100 dark:border-zinc-800 pt-3 flex items-center justify-between text-xs text-zinc-400 font-medium">
                                        <div className="flex items-center gap-1" title="Habilidades BNCC">
                                            <span className="material-symbols-outlined text-sm">menu_book</span>
                                            {plan.bncc_skills?.length || 0}
                                        </div>
                                        <div className="flex items-center gap-1" title="Atividades Anexadas">
                                            <span className="material-symbols-outlined text-sm">source</span>
                                            {plan.activities?.length || 0}
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
