'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { PERMISSIONS } from '@/lib/permissions'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { useUnreadChat } from '@/hooks/useUnreadChat'

interface Profile {
    full_name: string
    role: string
    avatar_url?: string
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const { hasUnread: hasUnreadChat } = useUnreadChat()

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('full_name, role, avatar_url')
                    .eq('id', user.id)
                    .single()

                if (data) {
                    setProfile(data)
                }
            } else {
                router.push('/login')
            }
        }
        getUser()
    }, [router, supabase])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-base">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary shadow-lg shadow-primary/50"></div>
            </div>
        )
    }

    const navItems = [
        { name: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
        { name: 'Adm', icon: 'admin_panel_settings', href: '/dashboard/admin' },
        { name: 'CoordenaÃ§Ã£o', icon: 'assignment_ind', href: '/coord' },
        { name: 'ComunicaÃ§Ã£o', icon: 'campaign', href: '/comunicacao' },
        { name: 'Pedagogia', icon: 'school', href: '/dashboard/pedagogia' },
    ]

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    }

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    }

    return (
        <div className="flex h-[100dvh] w-screen overflow-hidden bg-background-base font-display text-foreground selection:bg-primary/30">
            {/* Ambient Base Glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
                <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
            </div>

            {/* Main Content Area */}
            <div className="w-full flex-1 flex flex-col h-[100dvh] min-w-0 overflow-hidden relative z-10">

                {/* Barra Lateral Vertical â€” oculta no dashboard principal */}
                <div className={`fixed left-0 top-0 h-full z-50 flex ${pathname === '/dashboard' ? 'hidden' : ''}`}>
                    {/* Rail fino com Ã­cones */}
                    <div className={`h-full flex flex-col bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-200/50 dark:border-white/10 shadow-lg transition-all duration-300 ${isMenuOpen ? 'w-56' : 'w-14'}`}>

                        {/* BotÃ£o de Expandir/Recolher */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="w-full flex items-center justify-center h-14 border-b border-zinc-100 dark:border-white/5 text-zinc-500 hover:text-secondary dark:hover:text-primary transition-colors shrink-0"
                        >
                            <span className={`material-symbols-outlined text-xl transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`}>
                                chevron_right
                            </span>
                        </button>

                        {/* Ãcones dos MÃ³dulos */}
                        <nav className="flex-1 flex flex-col gap-1 py-3 px-2 overflow-y-auto custom-scrollbar no-scrollbar">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard')
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        title={!isMenuOpen ? item.name : undefined}
                                        className={`flex items-center gap-3 rounded-xl transition-all duration-200 group/nav shrink-0 ${isMenuOpen ? 'px-3 py-2.5' : 'justify-center py-2.5'} ${isActive
                                            ? 'bg-blue-50 dark:bg-primary/10 text-blue-600 dark:text-primary font-bold'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <span className={`material-symbols-outlined text-xl shrink-0 ${isActive ? 'scale-110' : 'group-hover/nav:scale-110'} transition-transform`}>
                                            {item.icon}
                                        </span>
                                        {isMenuOpen && (
                                            <span className="text-sm font-medium whitespace-nowrap overflow-hidden">{item.name}</span>
                                        )}
                                    </Link>
                                )
                            })}

                            {/* Separador */}
                            <div className="h-px bg-zinc-200 dark:bg-white/10 my-2 mx-1"></div>

                            {/* Links rÃ¡pidos */}
                            <Link
                                href="/dashboard/reunioes"
                                title={!isMenuOpen ? 'ReuniÃµes' : undefined}
                                className={`flex items-center gap-3 rounded-xl transition-all duration-200 group/nav shrink-0 ${isMenuOpen ? 'px-3 py-2.5' : 'justify-center py-2.5'} ${pathname.startsWith('/dashboard/reunioes')
                                    ? 'bg-blue-50 dark:bg-primary/10 text-blue-600 dark:text-primary font-bold'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl shrink-0 group-hover/nav:scale-110 transition-transform">videocam</span>
                                {isMenuOpen && <span className="text-sm font-medium whitespace-nowrap">ReuniÃµes</span>}
                            </Link>

                            <Link
                                href="/dashboard/chat"
                                title={!isMenuOpen ? 'Chat' : undefined}
                                className={`relative flex items-center gap-3 rounded-xl transition-all duration-200 group/nav shrink-0 ${isMenuOpen ? 'px-3 py-2.5' : 'justify-center py-2.5'} ${pathname.startsWith('/dashboard/chat')
                                    ? 'bg-blue-50 dark:bg-primary/10 text-blue-600 dark:text-primary font-bold'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl shrink-0 group-hover/nav:scale-110 transition-transform relative">
                                    forum
                                    {hasUnreadChat && !pathname.startsWith('/dashboard/chat') && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-white dark:border-zinc-900 shadow-sm"></span>
                                    )}
                                </span>
                                {isMenuOpen && (
                                    <span className="text-sm font-medium whitespace-nowrap flex items-center gap-2">
                                        Chat
                                        {hasUnreadChat && !pathname.startsWith('/dashboard/chat') && (
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                        )}
                                    </span>
                                )}
                            </Link>
                        </nav>

                        {/* SeÃ§Ã£o de Perfil no Fundo */}
                        <div className="border-t border-zinc-100 dark:border-white/5 py-2 px-2 flex flex-col gap-1 shrink-0">
                            <Link
                                href="/dashboard/area-pessoal"
                                title={!isMenuOpen ? 'Meu Perfil' : undefined}
                                className={`flex items-center gap-3 rounded-xl transition-all duration-200 ${isMenuOpen ? 'px-3 py-2' : 'justify-center py-2'} text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5`}
                            >
                                <span className="material-symbols-outlined text-xl shrink-0">person</span>
                                {isMenuOpen && <span className="text-sm font-medium whitespace-nowrap">Meu Perfil</span>}
                            </Link>
                            <Link
                                href="/dashboard/configuracoes"
                                title={!isMenuOpen ? 'ConfiguraÃ§Ãµes' : undefined}
                                className={`flex items-center gap-3 rounded-xl transition-all duration-200 ${isMenuOpen ? 'px-3 py-2' : 'justify-center py-2'} text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5`}
                            >
                                <span className="material-symbols-outlined text-xl shrink-0">settings</span>
                                {isMenuOpen && <span className="text-sm font-medium whitespace-nowrap">ConfiguraÃ§Ãµes</span>}
                            </Link>
                            <button
                                onClick={handleSignOut}
                                title={!isMenuOpen ? 'Sair' : undefined}
                                className={`flex items-center gap-3 rounded-xl transition-all duration-200 w-full ${isMenuOpen ? 'px-3 py-2' : 'justify-center py-2'} text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10`}
                            >
                                <span className="material-symbols-outlined text-xl shrink-0">logout</span>
                                {isMenuOpen && <span className="text-sm font-medium whitespace-nowrap">Sair</span>}
                            </button>
                        </div>
                    </div>
                </div>

                <main className={`flex-1 flex flex-col min-h-0 min-w-0 relative z-10 w-full ${pathname === '/dashboard' ? 'p-0 overflow-hidden'
                    : pathname.startsWith('/dashboard/chat') ? 'pl-16 pt-2 pb-2 pr-2 overflow-hidden'
                        : 'pl-16 pt-6 pb-6 pr-4 sm:pr-6 lg:pr-8 overflow-y-auto custom-scrollbar'
                    }`}>
                    <div className={`mx-auto w-full flex-1 flex flex-col min-h-0 ${(pathname === '/dashboard' || pathname.startsWith('/dashboard/chat')) ? 'max-w-none' : 'max-w-7xl'}`}>
                        <div className="w-full flex-1 flex flex-col min-h-0">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

