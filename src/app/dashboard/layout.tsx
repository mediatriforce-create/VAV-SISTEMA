'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { hasPermission } from '@/lib/permissions'
import { motion, AnimatePresence } from 'framer-motion'
import { useUnreadChat } from '@/hooks/useUnreadChat'
import GlobalSearch from '@/components/ui/GlobalSearch'

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

    const navItemsRaw = [
        { name: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
        { name: 'Adm', icon: 'admin_panel_settings', href: '/dashboard/admin', module: 'administracao' },
        { name: 'Coordenação', icon: 'assignment_ind', href: '/coord', module: 'coordenacao' },
        { name: 'Comunicação', icon: 'campaign', href: '/comunicacao', module: 'comunicacao' },
        { name: 'Pedagogia', icon: 'school', href: '/dashboard/pedagogia', module: 'pedagogia' },
    ]

    const navItems = navItemsRaw.filter(item => {
        if (!item.module) return true;
        return hasPermission(profile.role as any, item.module as any);
    });

    // Mobile bottom nav: principais módulos + chat + mural
    const mobileNavItems = [
        ...navItems.slice(0, 3),
        { name: 'Mural', icon: 'campaign', href: '/dashboard/mural' },
        ...(hasPermission(profile.role as any, 'chat' as any) ? [{ name: 'Chat', icon: 'forum', href: '/dashboard/chat' }] : []),
    ]

    const isHidden = pathname === '/dashboard'

    return (
        <div className="flex h-[100dvh] w-full overflow-x-hidden bg-background-base font-display text-foreground selection:bg-primary/30">
            {/* Ambient Base Glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
                <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
            </div>

            {/* Main Content Area */}
            <div className="w-full flex-1 flex flex-col h-[100dvh] min-w-0 overflow-x-hidden relative z-10">

                {/* Barra Lateral Vertical — apenas desktop, oculta no dashboard principal */}
                <div className={`fixed left-0 top-0 h-full z-50 ${isHidden ? 'hidden' : 'hidden md:flex'}`}>
                    {/* Rail fino com ícones */}
                    <div className={`h-full flex flex-col bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-200/50 dark:border-white/10 shadow-lg transition-all duration-300 ${isMenuOpen ? 'w-56' : 'w-14'}`}>

                        {/* Botão de Expandir/Recolher */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="w-full flex items-center justify-center h-14 border-b border-zinc-100 dark:border-white/5 text-zinc-500 hover:text-secondary dark:hover:text-primary transition-colors shrink-0"
                        >
                            <span className={`material-symbols-outlined text-xl transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`}>
                                chevron_right
                            </span>
                        </button>

                        {/* Ícones dos Módulos */}
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

                            {/* Links rápidos */}
                            {hasPermission(profile.role as any, 'reunioes' as any) && (
                                <Link
                                    href="/dashboard/reunioes"
                                    title={!isMenuOpen ? 'Reuniões' : undefined}
                                    className={`flex items-center gap-3 rounded-xl transition-all duration-200 group/nav shrink-0 ${isMenuOpen ? 'px-3 py-2.5' : 'justify-center py-2.5'} ${pathname.startsWith('/dashboard/reunioes')
                                        ? 'bg-blue-50 dark:bg-primary/10 text-blue-600 dark:text-primary font-bold'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-xl shrink-0 group-hover/nav:scale-110 transition-transform">videocam</span>
                                    {isMenuOpen && <span className="text-sm font-medium whitespace-nowrap">Reuniões</span>}
                                </Link>
                            )}

                            {hasPermission(profile.role as any, 'chat' as any) && (
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
                            )}

                            {hasPermission(profile.role as any, 'calendario' as any) && (
                                <Link
                                    href="/dashboard/calendario"
                                    title={!isMenuOpen ? 'Calendário Geral' : undefined}
                                    className={`relative flex items-center gap-3 rounded-xl transition-all duration-200 group/nav shrink-0 ${isMenuOpen ? 'px-3 py-2.5' : 'justify-center py-2.5'} ${pathname.startsWith('/dashboard/calendario')
                                        ? 'bg-blue-50 dark:bg-primary/10 text-blue-600 dark:text-primary font-bold'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-xl shrink-0 group-hover/nav:scale-110 transition-transform">
                                        event_note
                                    </span>
                                    {isMenuOpen && (
                                        <span className="text-sm font-medium whitespace-nowrap">Calendário</span>
                                    )}
                                </Link>
                            )}

                            <Link
                                href="/dashboard/mural"
                                title={!isMenuOpen ? 'Mural' : undefined}
                                className={`flex items-center gap-3 rounded-xl transition-all duration-200 group/nav shrink-0 ${isMenuOpen ? 'px-3 py-2.5' : 'justify-center py-2.5'} ${pathname.startsWith('/dashboard/mural')
                                    ? 'bg-blue-50 dark:bg-primary/10 text-blue-600 dark:text-primary font-bold'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl shrink-0 group-hover/nav:scale-110 transition-transform">campaign</span>
                                {isMenuOpen && <span className="text-sm font-medium whitespace-nowrap">Mural</span>}
                            </Link>

                            <Link
                                href="/dashboard/aprovacoes"
                                title={!isMenuOpen ? 'Aprovações' : undefined}
                                className={`flex items-center gap-3 rounded-xl transition-all duration-200 group/nav shrink-0 ${isMenuOpen ? 'px-3 py-2.5' : 'justify-center py-2.5'} ${pathname.startsWith('/dashboard/aprovacoes')
                                    ? 'bg-blue-50 dark:bg-primary/10 text-blue-600 dark:text-primary font-bold'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl shrink-0 group-hover/nav:scale-110 transition-transform">task_alt</span>
                                {isMenuOpen && <span className="text-sm font-medium whitespace-nowrap">Aprovações</span>}
                            </Link>
                        </nav>

                        {/* Busca Global */}
                        <div className="border-t border-zinc-100 dark:border-white/5 py-2 px-2 shrink-0">
                            <GlobalSearch />
                        </div>

                        {/* Seção de Perfil no Fundo */}
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
                                title={!isMenuOpen ? 'Configurações' : undefined}
                                className={`flex items-center gap-3 rounded-xl transition-all duration-200 w-full ${isMenuOpen ? 'px-3 py-2' : 'justify-center py-2'} text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5`}
                            >
                                <span className="material-symbols-outlined text-xl shrink-0">settings</span>
                                {isMenuOpen && <span className="text-sm font-medium whitespace-nowrap">Configurações</span>}
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

                <main className={`flex-1 flex flex-col min-h-0 min-w-0 relative z-10 w-full ${pathname === '/dashboard'
                    ? 'p-0 overflow-hidden'
                    : pathname.startsWith('/dashboard/chat')
                        ? 'md:pl-[76px] pt-3 md:pt-4 overflow-hidden pb-16 md:pb-0'
                        : 'md:pl-[76px] pt-5 md:pt-7 pb-20 md:pb-8 px-5 md:pr-8 lg:pr-10 overflow-y-auto custom-scrollbar'
                    }`}>
                    <div className={`mx-auto w-full flex-1 flex flex-col min-h-0 ${(pathname === '/dashboard' || pathname.startsWith('/dashboard/chat')) ? 'max-w-none' : 'max-w-7xl'}`}>
                        <div className="w-full flex-1 flex flex-col min-h-0">
                            {children}
                        </div>
                    </div>
                </main>

                {/* Mobile Bottom Navigation — oculta no desktop e na tela inicial */}
                {!isHidden && (
                    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-200/50 dark:border-white/10 shadow-2xl"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        <div className="flex items-center justify-around px-2 pt-2 pb-1">
                            {mobileNavItems.map((item) => {
                                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard')
                                const isChatItem = item.href === '/dashboard/chat'
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="flex flex-col items-center gap-0.5 min-w-[56px] py-1 px-2 rounded-xl transition-all duration-200 active:scale-95"
                                    >
                                        <span className={`relative material-symbols-outlined text-2xl transition-all duration-200 ${isActive ? 'text-blue-600 dark:text-primary scale-110' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                            {item.icon}
                                            {isChatItem && hasUnreadChat && !isActive && (
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-zinc-900 animate-pulse" />
                                            )}
                                        </span>
                                        <span className={`text-[9px] font-semibold uppercase tracking-wide transition-colors duration-200 ${isActive ? 'text-blue-600 dark:text-primary' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                            {item.name}
                                        </span>
                                    </Link>
                                )
                            })}
                            <Link
                                href="/dashboard/configuracoes"
                                className="flex flex-col items-center gap-0.5 min-w-[56px] py-1 px-2 rounded-xl transition-all duration-200 active:scale-95"
                            >
                                <span className={`material-symbols-outlined text-2xl transition-colors duration-200 ${pathname.startsWith('/dashboard/configuracoes') ? 'text-blue-600 dark:text-primary' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                    settings
                                </span>
                                <span className={`text-[9px] font-semibold uppercase tracking-wide ${pathname.startsWith('/dashboard/configuracoes') ? 'text-blue-600 dark:text-primary' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                    Config
                                </span>
                            </Link>
                        </div>
                    </nav>
                )}
            </div>
        </div>
    )
}
