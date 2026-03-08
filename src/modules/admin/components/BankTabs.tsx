import Link from 'next/link'
import { Bank } from '@/modules/admin/actions'
import { motion } from 'framer-motion'

interface BankTabsProps {
    banks: Bank[]
    selectedBankId: string
    onSelect?: (id: string) => void // Kept for prop compatibility but Link handles nav
}

export function BankTabs({ banks, selectedBankId }: BankTabsProps) {
    return (
        <div className="flex space-x-3 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl p-1.5 rounded-3xl mb-8 overflow-x-auto custom-scrollbar border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 max-w-full no-scrollbar">
            {banks.map((bank) => (
                <Link
                    key={bank.id}
                    href={`/dashboard/admin?bank=${bank.id}`}
                    scroll={false}
                    className="relative group flex-shrink-0"
                >
                    {selectedBankId === bank.id && (
                        <motion.div
                            layoutId="activeBankTab"
                            className="absolute inset-0 bg-primary rounded-xl shadow-md"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                    <span className={`
            relative px-6 py-3 text-sm font-bold transition-colors duration-200 whitespace-nowrap flex items-center justify-center z-10 rounded-xl
            ${selectedBankId === bank.id
                            ? 'text-white'
                            : 'text-slate-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }
          `}>
                        {bank.name}
                    </span>
                </Link>
            ))}
        </div>
    )
}

