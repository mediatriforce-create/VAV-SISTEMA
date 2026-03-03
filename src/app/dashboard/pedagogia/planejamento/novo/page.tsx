'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createLessonPlan, getBnccSkills, getEducationalActivities } from '@/actions/pedagogia_fase2';
import { getMyClasses } from '@/actions/pedagogia';
import type { Class, BnccSkill, EducationalActivity } from '@/types/pedagogia';

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

    // BNCC State
    const [selectedSkills, setSelectedSkills] = useState<BnccSkill[]>([]);
    const [bnccResults, setBnccResults] = useState<BnccSkill[]>([]);
    const [bnccSearch, setBnccSearch] = useState('');
    const [bnccLoading, setBnccLoading] = useState(false);

    // Atividades State
    const [selectedActivities, setSelectedActivities] = useState<EducationalActivity[]>([]);
    const [activityResults, setActivityResults] = useState<EducationalActivity[]>([]);
    const [actLoading, setActLoading] = useState(false);

    // Abas laterais: 'bncc' ou 'atividades'
    const [activeSidebar, setActiveSidebar] = useState<'bncc' | 'atividades' | null>(null);

    useEffect(() => {
        getMyClasses().then(res => {
            if (res.success && res.data) setClasses(res.data);
        });
    }, []);

    // Carregar BNCC quando sidebar abre
    useEffect(() => {
        if (activeSidebar === 'bncc' && bnccResults.length === 0) {
            loadBnccSkills();
        }
        if (activeSidebar === 'atividades' && activityResults.length === 0) {
            loadActivities();
        }
    }, [activeSidebar]);

    const loadBnccSkills = async (search?: string) => {
        setBnccLoading(true);
        const res = await getBnccSkills();
        if (res.success && res.data) {
            setBnccResults(res.data);
        }
        setBnccLoading(false);
    };

    const loadActivities = async () => {
        setActLoading(true);
        const res = await getEducationalActivities();
        if (res.success && res.data) setActivityResults(res.data);
        setActLoading(false);
    };

    const toggleSkill = (skill: BnccSkill) => {
        setSelectedSkills(prev =>
            prev.find(s => s.id === skill.id)
                ? prev.filter(s => s.id !== skill.id)
                : [...prev, skill]
        );
    };

    const toggleActivity = (act: EducationalActivity) => {
        setSelectedActivities(prev =>
            prev.find(a => a.id === act.id)
                ? prev.filter(a => a.id !== act.id)
                : [...prev, act]
        );
    };

    const filteredBncc = bnccSearch.trim()
        ? bnccResults.filter(s => s.code.toLowerCase().includes(bnccSearch.toLowerCase()) || s.description.toLowerCase().includes(bnccSearch.toLowerCase()))
        : bnccResults;

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
            skill_ids: selectedSkills.map(s => s.id),
            activity_ids: selectedActivities.map(a => a.id),
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

                        {/* Chips dos itens selecionados (BNCC + Atividades) */}
                        {(selectedSkills.length > 0 || selectedActivities.length > 0) && (
                            <div className="bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                {selectedSkills.length > 0 && (
                                    <div className="mb-3">
                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block mb-2">Habilidades BNCC Vinculadas ({selectedSkills.length})</span>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedSkills.map(s => (
                                                <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-800">
                                                    {s.code}
                                                    <button type="button" onClick={() => toggleSkill(s)} className="hover:text-red-500 transition-colors">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedActivities.length > 0 && (
                                    <div>
                                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block mb-2">Atividades Anexadas ({selectedActivities.length})</span>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedActivities.map(a => (
                                                <span key={a.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-100 dark:border-amber-800">
                                                    {a.title}
                                                    <button type="button" onClick={() => toggleActivity(a)} className="hover:text-red-500 transition-colors">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

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
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedSkills.length > 0 ? 'bg-blue-500 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'}`}>
                            {selectedSkills.length}
                        </span>
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
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedActivities.length > 0 ? 'bg-amber-500 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'}`}>
                            {selectedActivities.length}
                        </span>
                    </button>

                </div>

                {/* Sub-painel Dinâmico */}
                <AnimatePresence mode="popLayout">
                    {activeSidebar && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col min-h-0"
                        >
                            {activeSidebar === 'bncc' ? (
                                <div className="flex flex-col gap-3 flex-1 min-h-0">
                                    {/* Busca BNCC */}
                                    <div className="relative shrink-0">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">search</span>
                                        <input
                                            type="text"
                                            placeholder="Buscar código ou descrição..."
                                            value={bnccSearch} onChange={e => setBnccSearch(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Lista de Resultados */}
                                    <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 max-h-[400px]">
                                        {bnccLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        ) : filteredBncc.length === 0 ? (
                                            <p className="text-xs text-zinc-500 text-center py-8">Nenhuma habilidade encontrada.</p>
                                        ) : (
                                            filteredBncc.map(skill => {
                                                const isSelected = selectedSkills.some(s => s.id === skill.id);
                                                return (
                                                    <button
                                                        key={skill.id}
                                                        type="button"
                                                        onClick={() => toggleSkill(skill)}
                                                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${isSelected
                                                            ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-700'
                                                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <span className={`material-symbols-outlined text-sm mt-0.5 shrink-0 ${isSelected ? 'text-blue-500' : 'text-zinc-400'}`}>
                                                                {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className="font-bold text-blue-600 dark:text-blue-400">{skill.code}</span>
                                                                    <span className="text-[10px] text-zinc-400 font-medium">{skill.year_group}</span>
                                                                </div>
                                                                <p className="text-zinc-600 dark:text-zinc-400 leading-snug line-clamp-2">{skill.description}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 flex-1 min-h-0">
                                    <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 max-h-[400px]">
                                        {actLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        ) : activityResults.length === 0 ? (
                                            <div className="text-center py-8">
                                                <p className="text-xs text-zinc-500 mb-2">Nenhuma atividade no banco.</p>
                                                <Link href="/dashboard/pedagogia/atividades">
                                                    <span className="text-xs text-amber-500 font-bold hover:underline">Ir para o Banco de Atividades →</span>
                                                </Link>
                                            </div>
                                        ) : (
                                            activityResults.map(act => {
                                                const isSelected = selectedActivities.some(a => a.id === act.id);
                                                return (
                                                    <button
                                                        key={act.id}
                                                        type="button"
                                                        onClick={() => toggleActivity(act)}
                                                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${isSelected
                                                            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-700'
                                                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-600'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className={`material-symbols-outlined text-sm shrink-0 ${isSelected ? 'text-amber-500' : 'text-zinc-400'}`}>
                                                                {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{act.title}</p>
                                                                <p className="text-zinc-400 text-[10px]">{act.activity_type}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

        </div>
    );
}
