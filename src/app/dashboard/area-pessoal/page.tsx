'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocalCalendar } from '@/modules/personal-area/components/LocalCalendar';
import { AccountSettings } from '@/modules/personal-area/components/AccountSettings';
import { CoordinationNotes } from '@/modules/personal-area/components/CoordinationNotes';
// Guardando o Vault pro futuro. Retirado temporariamente conforme escopo V2.

export default function PersonalAreaPageV2() {
    const [activeTab, setActiveTab] = useState<'perfil' | 'calendario'>('calendario');

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 md:gap-6 p-4 md:p-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Header Profiling & Navigation V2 */}
            <div className="flex shrink-0 flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-[32px] md:text-[40px] text-secondary dark:text-primary">person_check</span>
                        Área Pessoal
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-xl font-medium">
                        Seu pilar de produtividade local. Gerencie sua conta, acompanhe feedbacks da liderança e assalte lembretes exclusivos no seu Calendário Pessoal.
                    </p>
                </div>

                {/* Tab Navigation Style Apple */}
                <div className="flex bg-zinc-200/50 dark:bg-black/40 p-1.5 rounded-2xl w-full md:w-auto relative border border-zinc-200 dark:border-white/10 shrink-0">
                    <button
                        onClick={() => setActiveTab('calendario')}
                        className={`relative flex-1 md:w-40 py-2.5 text-sm font-bold z-10 transition-colors ${activeTab === 'calendario' ? 'text-zinc-900 dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        {activeTab === 'calendario' && (
                            <motion.div layoutId="activeTabPill" className="absolute inset-0 bg-white dark:bg-white rounded-xl shadow-sm -z-10" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                        )}
                        Minha Agenda
                    </button>
                    <button
                        onClick={() => setActiveTab('perfil')}
                        className={`relative flex-1 md:w-40 py-2.5 text-sm font-bold z-10 transition-colors ${activeTab === 'perfil' ? 'text-zinc-900 dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        {activeTab === 'perfil' && (
                            <motion.div layoutId="activeTabPill" className="absolute inset-0 bg-white dark:bg-white rounded-xl shadow-sm -z-10" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                        )}
                        Conta & Segurança
                    </button>
                </div>
            </div>

            {/* Smart Content Router */}
            <div className="w-full flex flex-col min-h-0 pb-10">
                <AnimatePresence mode="wait">
                    {activeTab === 'calendario' ? (
                        <motion.div
                            key="tab-calendario"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.2 }}
                            className="w-full grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8"
                        >
                            {/* Main Actor: Central Calendar Local */}
                            <div className="xl:col-span-2 flex flex-col">
                                <LocalCalendar />
                            </div>

                            {/* Secondary Actor: Feedbacks Pessoais (ReadOnly) */}
                            <div className="xl:col-span-1 flex flex-col">
                                <CoordinationNotes />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tab-perfil"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.2 }}
                            className="w-full flex justify-center py-6"
                        >
                            <div className="w-full max-w-xl flex flex-col">
                                <AccountSettings />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </div>
    );
}
