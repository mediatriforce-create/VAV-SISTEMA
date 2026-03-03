'use client';

import { useState } from 'react';
import { Demand, DemandSector, DemandStatus } from '@/types/demands';
import DemandCard from './DemandCard';
import { Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DemandListProps {
    demands: Demand[];
    onDemandClick: (demand: Demand) => void;
}

export default function DemandList({ demands, onDemandClick }: DemandListProps) {
    const [filterSector, setFilterSector] = useState<DemandSector | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<DemandStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDemands = demands.filter(d => {
        const matchesSector = filterSector === 'all' || d.sector === filterSector;
        const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
        const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSector && matchesStatus && matchesSearch;
    });

    return (
        <div className="flex flex-col gap-6 w-full h-full min-h-0">
            {/* Filters Bar */}
            <div className="shrink-0 flex flex-col md:flex-row gap-4 justify-between bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-slate-200/50 dark:border-gray-700/50">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar demandas..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/80 dark:bg-gray-900/50 border border-slate-200/60 dark:border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm text-slate-700 dark:text-gray-200 shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-3">
                    <select
                        value={filterSector}
                        onChange={(e) => setFilterSector(e.target.value as any)}
                        className="px-4 py-2.5 bg-white/80 dark:bg-gray-900/50 border border-slate-200/60 dark:border-gray-600/50 rounded-xl text-sm font-medium text-slate-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner cursor-pointer"
                    >
                        <option value="all">Todos Setores</option>
                        <option value="comunicacao">Comunicação</option>
                        <option value="pedagogia">Pedagogia</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-4 py-2.5 bg-white/80 dark:bg-gray-900/50 border border-slate-200/60 dark:border-gray-600/50 rounded-xl text-sm font-medium text-slate-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner cursor-pointer"
                    >
                        <option value="all">Todos Status</option>
                        <option value="a_fazer">A Fazer</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="revisao">Revisão</option>
                        <option value="finalizado">Finalizado</option>
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-1 pb-6">
                <AnimatePresence mode="popLayout">
                    {filteredDemands.length > 0 ? (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={{
                                visible: { transition: { staggerChildren: 0.05 } },
                                hidden: {}
                            }}
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                        >
                            {filteredDemands.map(demand => (
                                <motion.div
                                    key={demand.id}
                                    layout
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.95, y: 10 },
                                        visible: { opacity: 1, scale: 1, y: 0 }
                                    }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                >
                                    <DemandCard demand={demand} onClick={onDemandClick} />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-gray-500 bg-white/40 dark:bg-gray-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-gray-700"
                        >
                            <Filter size={56} className="mb-4 opacity-30 text-slate-300 dark:text-gray-600" />
                            <p className="text-xl font-bold text-slate-600 dark:text-gray-400">Nenhuma demanda encontrada</p>
                            <p className="text-sm mt-2 font-medium opacity-80">Tente ajustar os filtros ou criar uma nova demanda.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
}
