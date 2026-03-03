'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AtividadesPage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulando load inicial
        setTimeout(() => setLoading(false), 800);
    }, []);

    return (
        <div className="h-full flex flex-col min-h-0 bg-zinc-50/50 dark:bg-zinc-900/20">
            {/* Header / Barra de Busca */}
            <div className="shrink-0 p-4 sm:p-6 border-b border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div>
                        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500">source</span>
                            Banco de Atividades
                        </h2>
                        <p className="text-sm text-zinc-500 mt-1">Repositório central de arquivos, links e materiais.</p>
                    </div>

                    <div className="flex w-full sm:w-auto gap-3">
                        <div className="relative flex-1 sm:w-64">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                            <input
                                type="text"
                                placeholder="Buscar atividades..."
                                className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-white/5 border border-transparent focus:border-emerald-500 rounded-xl outline-none text-sm transition-all"
                            />
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">upload</span>
                            <span className="hidden sm:block">Upload</span>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Content Area / Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="aspect-square rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-24 h-24 mb-4 opacity-50">
                            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-zinc-400 dark:text-zinc-600" stroke="currentColor" strokeWidth="1">
                                <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M16 2v4h4" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M16 22v-6h6" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M19 19h.01" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">Este repositório está vazio</h3>
                        <p className="text-sm text-zinc-500 max-w-sm">Faça o upload do seu primeiro PDF, documento ou link para manter seus materiais sempre à mão no planejamento de aulas.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
