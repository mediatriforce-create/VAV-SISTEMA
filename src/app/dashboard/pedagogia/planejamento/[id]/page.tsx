'use client';

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getLessonPlanById } from '@/actions/pedagogia_fase2';
import type { LessonPlan } from '@/types/pedagogia';

export default function EditarPlanoPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const planId = resolvedParams.id;

    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<LessonPlan | null>(null);
    const [error, setError] = useState('');

    // Abas laterais: 'bncc' ou 'atividades'
    const [activeSidebar, setActiveSidebar] = useState<'bncc' | 'atividades' | null>(null);

    useEffect(() => {
        loadPlan();
    }, [planId]);

    const loadPlan = async () => {
        setLoading(true);
        const res = await getLessonPlanById(planId);
        if (res.success && res.data) {
            setPlan(res.data);
        } else {
            setError('Plano de aula não encontrado ou você não tem permissão.');
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-white dark:bg-zinc-900">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !plan) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-center p-6">
                <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
                <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">Ops! Algum problema ocorreu.</h2>
                <p className="text-sm text-zinc-500 max-w-sm mb-6">{error}</p>
                <Link href="/dashboard/pedagogia/planejamento">
                    <button className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl text-sm">Voltar</button>
                </Link>
            </div>
        );
    }

    return (
        <div className="h-full flex min-h-0 bg-white dark:bg-zinc-900">
            {/* Área Principal (Formulário) */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">

                {/* Header Compacto + Botão Voltar */}
                <div className="flex items-center justify-between mb-8 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/pedagogia/planejamento">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">arrow_back</span>
                            </motion.button>
                        </Link>
                        <div>
                            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white leading-tight">Plano de Aula</h2>
                            <p className={`text-sm font-bold ${plan.status === 'Publicado' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {plan.status}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">edit</span> Editar
                        </motion.button>
                    </div>
                </div>

                {/* Grid Visualização */}
                <div className="max-w-4xl max-w-full flex flex-col gap-6">

                    {/* Linha 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-zinc-50 dark:bg-zinc-800/30 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                        <div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Turma</span>
                            <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
                                {plan.class_info?.name || 'Não informada'}
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Data Prevista</span>
                            <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
                                {new Date(plan.target_date + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Status</span>
                            <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
                                {plan.status}
                            </p>
                        </div>
                    </div>

                    {/* Tema */}
                    <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Tema Central</span>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{plan.theme}</h3>
                    </div>

                    {/* Blocos de Texto Rico */}
                    {plan.objectives && (
                        <div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Objetivos de Aprendizagem</span>
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/50 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                {plan.objectives}
                            </div>
                        </div>
                    )}

                    {plan.methodology && (
                        <div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Metodologia / Passos da Aula</span>
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/50 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                {plan.methodology}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Painel Lateral Direito Fixo (Ferramentas de Suporte) */}
            <div className="w-80 shrink-0 border-l border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hidden lg:flex flex-col">

                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Anexos Mágicos</h3>
                    <p className="text-xs text-zinc-500 mt-1">Materiais atrelados a este plano.</p>
                </div>

                <div className="p-4 flex flex-col gap-3">

                    {/* Botão BNCC */}
                    <button
                        onClick={() => setActiveSidebar(activeSidebar === 'bncc' ? null : 'bncc')}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${activeSidebar === 'bncc'
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined">menu_book</span>
                            <span className="font-bold text-sm">Catálogo BNCC</span>
                        </div>
                        <span className="bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full text-xs font-bold text-zinc-500">{plan.bncc_skills?.length || 0}</span>
                    </button>

                    {/* Botão Atividades */}
                    <button
                        onClick={() => setActiveSidebar(activeSidebar === 'atividades' ? null : 'atividades')}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${activeSidebar === 'atividades'
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-600'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined">source</span>
                            <span className="font-bold text-sm">Banco de Atividades</span>
                        </div>
                        <span className="bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full text-xs font-bold text-zinc-500">{plan.activities?.length || 0}</span>
                    </button>

                </div>

                {/* Sub-painel Dinâmico que aparece ao clicar no botão acima */}
                <AnimatePresence mode="popLayout">
                    {activeSidebar && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex-1 overflow-y-auto px-4 pb-4"
                        >
                            <div className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 shadow-sm text-sm text-zinc-500 text-center flex flex-col items-center justify-center py-10">
                                <span className={`material-symbols-outlined text-4xl mb-3 ${activeSidebar === 'bncc' ? 'text-blue-400' : 'text-amber-400'}`}>
                                    {activeSidebar === 'bncc' ? 'search' : 'cloud_download'}
                                </span>
                                {activeSidebar === 'bncc' ? (
                                    <>Nenhuma habilidade vinculada.</>
                                ) : (
                                    <>Nenhum anexo selecionado.</>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

        </div>
    );
}
