'use client'

import React from 'react'
import { FinancialEntry, deleteFinancialEntry } from '../actions'
import { motion } from 'framer-motion'

interface TransactionTableProps {
    entries: FinancialEntry[]
}

function formatDate(dateStr: string) {
    if (!dateStr) return 'N/A'
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)
}

export function TransactionTable({ entries }: TransactionTableProps) {

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja excluir este lançamento?')) return
        const result = await deleteFinancialEntry(id)
        if (result.error) alert(result.error)
    }

    if (entries.length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <span className="material-icons text-gray-300 dark:text-gray-600 text-5xl mb-3">receipt_long</span>
                <p className="text-gray-500 dark:text-gray-400">Nenhum lançamento encontrado neste banco.</p>
            </div>
        )
    }

    return (
        <>
            {/* ── MOBILE: lista de cards ── */}
            <div className="md:hidden flex flex-col gap-2">
                {entries.map((entry, i) => (
                    <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-sm px-4 py-3"
                    >
                        <div className="flex items-center gap-3">
                            {/* Ícone tipo */}
                            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${entry.type === 'entrada' ? 'bg-gradient-to-br from-green-100 to-green-50 text-green-600' : 'bg-gradient-to-br from-red-100 to-red-50 text-red-600'}`}>
                                <span className="material-icons text-base">{entry.type === 'entrada' ? 'arrow_upward' : 'arrow_downward'}</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{entry.description}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-zinc-700 dark:text-zinc-300">
                                        {entry.category}
                                    </span>
                                    <span className="text-[10px] text-zinc-400">{formatDate(entry.entry_date)}</span>
                                    {(entry as any).profiles?.full_name && (
                                        <span className="text-[10px] text-zinc-400 truncate">{(entry as any).profiles.full_name}</span>
                                    )}
                                </div>
                            </div>

                            {/* Valor + ações */}
                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                                <span className={`text-sm font-bold ${entry.type === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {entry.type === 'saida' ? '-' : '+'}{formatCurrency(entry.amount)}
                                </span>
                                <div className="flex items-center gap-1">
                                    {entry.attachment_url && (
                                        <a href={entry.attachment_url} target="_blank" rel="noreferrer"
                                            className="p-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                            <span className="material-icons text-[16px]">attachment</span>
                                        </a>
                                    )}
                                    <button onClick={() => handleDelete(entry.id)}
                                        className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                                        <span className="material-icons text-[16px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── DESKTOP: tabela original ── */}
            <div className="hidden md:flex flex-1 min-h-0 flex-col bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                        <thead className="bg-slate-50/50 dark:bg-gray-800/50 backdrop-blur-md">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Responsável</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Anexo</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <motion.tbody
                            initial="hidden"
                            animate="visible"
                            variants={{
                                visible: { transition: { staggerChildren: 0.05 } },
                                hidden: {}
                            }}
                            className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-100 dark:divide-gray-700/50"
                        >
                            {entries.map((entry) => (
                                <motion.tr
                                    variants={{
                                        hidden: { opacity: 0, y: 10 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                    key={entry.id}
                                    className="group hover:bg-slate-50/80 dark:hover:bg-gray-700/80 transition-colors"
                                >
                                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(entry.entry_date)}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center mr-4 shadow-sm ${entry.type === 'entrada' ? 'bg-gradient-to-br from-green-100 to-green-50 text-green-600' : 'bg-gradient-to-br from-red-100 to-red-50 text-red-600'}`}>
                                                <span className="material-icons text-base">{entry.type === 'entrada' ? 'arrow_upward' : 'arrow_downward'}</span>
                                            </div>
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{entry.description}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-md bg-slate-100 text-slate-800 dark:bg-gray-700 dark:text-gray-300 shadow-sm border border-slate-200/50 dark:border-gray-600/50">
                                            {entry.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {(entry as any).profiles?.full_name || 'N/A'}
                                    </td>
                                    <td className={`px-6 py-5 whitespace-nowrap text-sm text-right font-bold tracking-tight ${entry.type === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {entry.type === 'saida' ? '-' : '+'}{formatCurrency(entry.amount)}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-center text-sm font-medium">
                                        {entry.attachment_url ? (
                                            <a href={entry.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors" title="Ver Comprovante">
                                                <span className="material-icons text-[20px]">attachment</span>
                                            </a>
                                        ) : (
                                            <span className="text-gray-300 dark:text-gray-600">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleDelete(entry.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                                            <span className="material-icons text-[20px]">delete</span>
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </table>
                </div>
            </div>
        </>
    )
}
