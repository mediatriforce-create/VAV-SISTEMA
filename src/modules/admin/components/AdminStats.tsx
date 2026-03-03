import React from 'react'
import { motion } from 'framer-motion'
interface AdminStatsProps {
    totalInput: number
    totalOutput: number
    balance: number
}

export function AdminStats({ totalInput, totalOutput, balance }: AdminStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Entries */}
            <motion.div
                whileHover={{ y: -5, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-slate-200/50 dark:border-gray-700/50 flex flex-col justify-between h-32 relative overflow-hidden group"
            >
                <div className="relative z-10">
                    <p className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-1 tracking-wide">TOTAL ENTRADAS</p>
                    <h3 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInput)}
                    </h3>
                </div>
                <div className="absolute right-4 top-4 p-3 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20 rounded-xl shadow-inner">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">trending_up</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-green-500/5 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </motion.div>

            {/* Total Outputs */}
            <motion.div
                whileHover={{ y: -5, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-slate-200/50 dark:border-gray-700/50 flex flex-col justify-between h-32 relative overflow-hidden group"
            >
                <div className="relative z-10">
                    <p className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-1 tracking-wide">TOTAL SAÍDAS</p>
                    <h3 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOutput)}
                    </h3>
                </div>
                <div className="absolute right-4 top-4 p-3 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-800/20 rounded-xl shadow-inner">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400">trending_down</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-red-500/5 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </motion.div>

            {/* Balance */}
            <motion.div
                whileHover={{ y: -5, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-slate-200/50 dark:border-gray-700/50 flex flex-col justify-between h-32 relative overflow-hidden group"
            >
                <div className="relative z-10">
                    <p className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-1 tracking-wide">SALDO ATUAL</p>
                    <h3 className={`text-3xl font-bold tracking-tight ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                    </h3>
                </div>
                <div className="absolute right-4 top-4 p-3 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 rounded-xl shadow-inner">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">account_balance_wallet</span>
                </div>
                <div className={`absolute inset-0 bg-gradient-to-tr ${balance >= 0 ? 'from-blue-500/5' : 'from-red-500/5'} to-transparent pointer-events-none`} />
                <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${balance >= 0 ? 'from-blue-400 to-blue-600' : 'from-red-400 to-red-600'} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
            </motion.div>
        </div>
    )
}
