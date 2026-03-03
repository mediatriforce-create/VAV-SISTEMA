'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { hasPermission, Module, Role } from '@/lib/permissions'
import Link from 'next/link'
import ParticleCanvas from '@/components/ui/ParticleCanvas'
import { useUnreadChat } from '@/hooks/useUnreadChat'

interface Profile {
    full_name: string
    role: Role
    avatar_url?: string
}

const MODULES_UI = [
    {
        id: 'administracao' as Module,
        title: 'Administração',
        description: 'Gestão financeira e recursos humanos.',
        icon: 'admin_panel_settings',
        href: '/dashboard/admin',
        gradient: 'from-blue-500 to-blue-600',
        shadow: 'shadow-blue-500/20',
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    },
    {
        id: 'coordenacao' as Module,
        title: 'Coordenação',
        description: 'Planejamento e supervisão de projetos.',
        icon: 'assignment_ind',
        href: '/coord',
        gradient: 'from-indigo-500 to-indigo-600',
        shadow: 'shadow-indigo-500/20',
        bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    },
    {
        id: 'comunicacao' as Module,
        title: 'Comunicação',
        description: 'Marketing, avisos e redes sociais.',
        icon: 'campaign',
        href: '/comunicacao',
        gradient: 'from-violet-500 to-violet-600',
        shadow: 'shadow-violet-500/20',
        bg: 'bg-violet-500/10 dark:bg-violet-500/20',
    },
    {
        id: 'pedagogia' as Module,
        title: 'Pedagogia',
        description: 'Material didático e acompanhamento.',
        icon: 'school',
        href: '/dashboard/pedagogia',
        gradient: 'from-cyan-500 to-cyan-600',
        shadow: 'shadow-cyan-500/20',
        bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    },
]

const QUICK_ACTIONS = [
    { id: 'chat', title: 'Chat', subtitle: 'Mensagens diretas', icon: 'forum', href: '/dashboard/chat' },
    { id: 'calendario', title: 'Calendário', subtitle: 'Agenda de eventos', icon: 'calendar_today', href: '/dashboard/calendario' },
    { id: 'reunioes', title: 'Reuniões', subtitle: 'Novos compromissos', icon: 'videocam', href: '/dashboard/reunioes' },
    { id: 'pessoal', title: 'Perfil', subtitle: 'Minha conta', icon: 'person', href: '/dashboard/area-pessoal' },
    { id: 'configuracoes', title: 'Sistema', subtitle: 'Configurações', icon: 'settings', href: '/dashboard/configuracoes' },
]

export default function DashboardPage() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [hoveredModule, setHoveredModule] = useState<string | null>(null)
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

                if (data) setProfile(data as Profile)
            }
        }
        getUser()
    }, [supabase])

    const toggleTheme = () => {
        document.documentElement.classList.toggle('dark')
    }

    if (!profile) return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    )

    const greeting = (() => {
        const h = new Date().getHours()
        if (h < 12) return 'Bom dia'
        if (h < 18) return 'Boa tarde'
        return 'Boa noite'
    })()

    return (
        <div className="fixed inset-0 font-sans antialiased text-slate-800 dark:text-slate-100 h-screen w-screen flex flex-col overflow-hidden z-50 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">

            {/* Canvas de Partículas Interativo */}
            <ParticleCanvas />

            {/* Header */}
            <header className="relative z-10 w-full px-6 sm:px-8 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <span className="text-white font-black text-sm">V</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">VAV Central</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{greeting}, {profile.full_name.split(' ')[0]}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-lg dark:hidden">dark_mode</span>
                        <span className="material-symbols-outlined text-lg hidden dark:inline">light_mode</span>
                    </button>
                    {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-xl border-2 border-blue-500/30 object-cover" />
                    ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs border-2 border-blue-500/30">
                            {profile.full_name.charAt(0)}
                        </div>
                    )}
                </div>
            </header>

            {/* Conteúdo Principal */}
            <main className="relative z-10 flex-1 min-h-0 flex flex-col px-6 sm:px-8 pb-4">

                {/* Título central */}
                <div className="text-center mb-6 shrink-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-slate-200/50 dark:border-white/10 mb-3 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase">Central Operacional</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        O que deseja <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">acessar?</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Selecione um módulo para entrar no ambiente de trabalho.
                    </p>
                </div>

                {/* Grid dos 4 módulos */}
                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
                    {MODULES_UI.map((module) => {
                        const canAccess = hasPermission(profile.role, module.id)
                        const isHovered = hoveredModule === module.id

                        return (
                            <Link
                                key={module.id}
                                href={canAccess ? module.href : '#'}
                                prefetch={false}
                                onMouseEnter={() => setHoveredModule(module.id)}
                                onMouseLeave={() => setHoveredModule(null)}
                                className={`group relative flex flex-col items-center justify-center rounded-2xl transition-all duration-300 overflow-hidden ${canAccess
                                    ? 'bg-white/70 dark:bg-white/5 backdrop-blur-md border border-slate-200/60 dark:border-white/10 hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer'
                                    : 'bg-slate-100/30 dark:bg-white/[0.02] border border-transparent opacity-30 cursor-not-allowed grayscale'
                                    }`}
                                onClick={(e) => { if (!canAccess) e.preventDefault() }}
                            >
                                {/* Gradient overlay on hover */}
                                {canAccess && (
                                    <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-[0.06] dark:group-hover:opacity-[0.12] transition-opacity duration-500`}></div>
                                )}

                                {/* Top accent line */}
                                {canAccess && (
                                    <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${module.gradient} transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>
                                )}

                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${canAccess
                                    ? `${module.bg} group-hover:scale-110 group-hover:${module.shadow}`
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    }`}>
                                    <span className={`material-symbols-outlined text-3xl ${canAccess ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                                        {module.icon}
                                    </span>
                                </div>

                                <h3 className={`text-lg font-bold mb-1 ${canAccess ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                    {module.title}
                                </h3>

                                <p className={`text-xs text-center max-w-[180px] leading-relaxed ${canAccess ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400'}`}>
                                    {module.description}
                                </p>

                                {canAccess && (
                                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                        <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r ${module.gradient} text-white text-xs font-semibold shadow-lg ${module.shadow}`}>
                                            Acessar
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </div>
                                    </div>
                                )}

                                {!canAccess && (
                                    <div className="absolute top-3 right-3 bg-slate-200/80 dark:bg-white/10 p-1.5 rounded-lg">
                                        <span className="material-symbols-outlined text-sm text-slate-400">lock</span>
                                    </div>
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* Ações Rápidas */}
                <div className="shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/25">
                            <span className="material-symbols-outlined text-xs text-white">bolt</span>
                        </div>
                        <h2 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ações Rápidas</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                        {QUICK_ACTIONS.map((action) => {
                            const moduleId = action.id as Module | 'pessoal' | 'calendario'
                            const canAccess = moduleId === 'pessoal' || moduleId === 'calendario' || hasPermission(profile.role, moduleId as Module)

                            return (
                                <Link
                                    key={action.id}
                                    href={canAccess ? action.href : '#'}
                                    prefetch={false}
                                    className={`flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-slate-200/50 dark:border-white/10 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-200 group text-left ${!canAccess ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                                    onClick={(e) => { if (!canAccess) e.preventDefault() }}
                                >
                                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-blue-500/25 transition-all duration-200 shrink-0 relative">
                                        <span className="material-symbols-outlined text-lg">{action.icon}</span>
                                        {action.id === 'chat' && hasUnreadChat && (
                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-zinc-900 shadow-sm"></span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-slate-800 dark:text-white text-[13px] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{action.title}</h4>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{action.subtitle}</p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </main>

            <footer className="relative z-10 w-full py-2 text-center shrink-0">
                <p className="text-[10px] text-slate-400/50 dark:text-slate-600/50">
                    System v2.5.0 • Acesso Seguro • © 2024 VAV Central
                </p>
            </footer>
        </div>
    )
}
