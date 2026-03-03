'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
    { label: 'Kanban', href: '/dashboard/pedagogia/kanban', icon: 'view_kanban' },
    { label: 'Atividades', href: '/dashboard/pedagogia/atividades', icon: 'edit_note' },
    { label: 'Arquivos', href: '/dashboard/pedagogia/arquivos', icon: 'folder_open' },
];

export default function PedagogiaLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="w-full h-full flex flex-col min-h-0">
            {/* Top HUD */}
            <div className="shrink-0 px-4 sm:px-8 pt-4 pb-0">
                <div className="flex items-center gap-6 pb-3 border-b border-zinc-200 dark:border-white/10">
                    <div className="flex items-center gap-3 mr-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <span className="material-symbols-outlined text-white text-xl">school</span>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-extrabold text-zinc-900 dark:text-white tracking-tight leading-none">Pedagogia</h1>
                            <p className="text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">Módulo Educacional</p>
                        </div>
                    </div>

                    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                            return (
                                <Link key={item.href} href={item.href}>
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                                            ${isActive
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm'
                                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">{item.icon}</span>
                                        <span className="hidden md:block">{item.label}</span>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Content Area — fit-to-screen */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
