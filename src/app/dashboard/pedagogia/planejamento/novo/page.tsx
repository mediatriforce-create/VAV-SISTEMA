'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createLessonPlan } from '@/actions/pedagogia_fase2';
import { getMyClasses } from '@/actions/pedagogia';
import type { Class } from '@/types/pedagogia';

export default function NovoPlanoPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Dados do Formulário
    const [classId, setClassId] = useState('');
    const [theme, setTheme] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [objectives, setObjectives] = useState('');
    const [methodology, setMethodology] = useState('');

    const [classes, setClasses] = useState<Class[]>([]);

    // Abas laterais: 'bncc' ou 'atividades'
    const [activeSidebar, setActiveSidebar] = useState<'bncc' | 'atividades' | null>(null);

    useEffect(() => {
        getMyClasses().then(res => {
            if (res.success && res.data) setClasses(res.data);
        });
    }, []);

    const handleSave = async (status: 'Rascunho' | 'Publicado', e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!classId || !theme || !targetDate) {
            setError('Por favor, preencha Turma, Data e Tema.');
            return;
        }

        setSubmitting(true);
        setError('');

        const res = await createLessonPlan({
            class_id: classId,
            target_date: targetDate,
            theme,
            objectives,
            methodology,
            status,
        });

        if (res.success) {
            router.push('/dashboard/pedagogia/planejamento');
        } else {
            setError(res.message || 'Erro ao criar plano.');
            setSubmitting(false);
        }
    };

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
                            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white leading-tight">Novo Plano de Aula</h2>
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Rascunho não salvo</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/pedagogia/planejamento">
                            <button className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                Cancelar
                            </button>
                        </Link>
                        <motion.button
                            onClick={() => handleSave('Rascunho')}
                            disabled={submitting}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-zinc-900/10 dark:shadow-white/10 disabled:opacity-50"
                        >
                            Salvar Rascunho
                        </motion.button>
                        <motion.button
                            onClick={() => handleSave('Publicado')}
                            disabled={submitting}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                        >
                            {submitting ? 'Salvando...' : 'Publicar Plano'}
                        </motion.button>
                    </div>
                </div>

                {/* Grid do Formulário */}
                <div className="max-w-4xl max-w-full">
                    <form onSubmit={(e) => handleSave('Publicado', e)} className="flex flex-col gap-6">

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined">error</span>
                                {error}
                            </div>
                        )}

                        {/* Infos Básicas */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Turma *</label>
                                <select
                                    value={classId} onChange={e => setClassId(e.target.value)} required
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 text-sm"
                                >
                                    <option value="">Selecionar turma...</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.shift})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Data Prevista *</label>
                                <input
                                    type="date"
                                    value={targetDate} onChange={e => setTargetDate(e.target.value)} required
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Tema Central *</label>
                                <input
                                    type="text" placeholder="Ex: Frações e Decimais"
                                    value={theme} onChange={e => setTheme(e.target.value)} required
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 text-sm"
                                />
                            </div>
                        </div>

                        {/* Blocos de Texto Rico (simulados por textarea) */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Objetivos de Aprendizagem</label>
                            <textarea
                                rows={4} placeholder="O que se espera que o aluno seja capaz de fazer ao final da aula?"
                                value={objectives} onChange={e => setObjectives(e.target.value)}
                                className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 text-sm resize-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Metodologia / Passos da Aula</label>
                            <textarea
                                rows={6} placeholder="1. Introdução (10 min)... 2. Desenvolvimento com o material de apoio (30 min)..."
                                value={methodology} onChange={e => setMethodology(e.target.value)}
                                className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 text-sm resize-none"
                            />
                        </div>

                    </form>
                </div>
            </div>

            {/* Painel Lateral Direito Fixo (Ferramentas de Suporte) */}
            <div className="w-80 shrink-0 border-l border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hidden lg:flex flex-col">

                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Anexos Mágicos</h3>
                    <p className="text-xs text-zinc-500 mt-1">Vincule materiais oficiais ao seu plano.</p>
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
                        <span className="bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full text-xs font-bold text-zinc-500">0</span>
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
                        <span className="bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full text-xs font-bold text-zinc-500">0</span>
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
                                    <>Nenhuma habilidade vinculada.<br /><span className="text-blue-500 font-bold mt-2 cursor-pointer hover:underline">Buscar na Base BNCC</span></>
                                ) : (
                                    <>Nenhum anexo selecionado.<br /><span className="text-amber-500 font-bold mt-2 cursor-pointer hover:underline">Buscar no Banco</span></>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

        </div>
    );
}
