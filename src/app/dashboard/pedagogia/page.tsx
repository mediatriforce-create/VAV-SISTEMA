'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const CARDS = [
    {
        href: '/dashboard/pedagogia/kanban',
        icon: 'view_kanban',
        title: 'Kanban',
        description: 'Planejamento visual de tarefas e aprovações',
        gradient: 'from-emerald-500 to-teal-500',
        border: 'border-emerald-200 dark:border-emerald-500/20',
        bg: 'bg-emerald-50/80 dark:bg-emerald-500/5',
        iconBg: 'bg-emerald-100 dark:bg-emerald-500/15',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        href: '/dashboard/pedagogia/turmas',
        icon: 'groups',
        title: 'Turmas',
        description: 'Gestão de turmas, alunos e professores',
        gradient: 'from-teal-500 to-cyan-500',
        border: 'border-teal-200 dark:border-teal-500/20',
        bg: 'bg-teal-50/80 dark:bg-teal-500/5',
        iconBg: 'bg-teal-100 dark:bg-teal-500/15',
        iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
        href: '/dashboard/pedagogia/atividades',
        icon: 'edit_note',
        title: 'Atividades',
        description: 'Registro e acompanhamento do dia a dia',
        gradient: 'from-cyan-500 to-sky-500',
        border: 'border-cyan-200 dark:border-cyan-500/20',
        bg: 'bg-cyan-50/80 dark:bg-cyan-500/5',
        iconBg: 'bg-cyan-100 dark:bg-cyan-500/15',
        iconColor: 'text-cyan-600 dark:text-cyan-400',
    },
    {
        href: '/dashboard/pedagogia/arquivos',
        icon: 'folder_open',
        title: 'Arquivos',
        description: 'Materiais didáticos e documentos',
        gradient: 'from-sky-500 to-blue-500',
        border: 'border-sky-200 dark:border-sky-500/20',
        bg: 'bg-sky-50/80 dark:bg-sky-500/5',
        iconBg: 'bg-sky-100 dark:bg-sky-500/15',
        iconColor: 'text-sky-600 dark:text-sky-400',
    },
]

const QUOTES = [
    'Educar é semear com sabedoria e colher com paciência.',
    'A educação é a arma mais poderosa para mudar o mundo.',
    'Ensinar é aprender duas vezes.',
    'O conhecimento é a única riqueza que ninguém pode tirar de você.',
]

const ACTIVE_STATUSES = ['planejado', 'andamento', 'aprovacao']

const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)]

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const cardVariant = {
    hidden: { opacity: 0, y: 24, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 280, damping: 22 } },
}

const heroVariant = {
    hidden: { opacity: 0, y: -16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

export default function PedagogiaPage() {
    const [data, setData] = useState<{
        firstName: string
        classes: number
        activities: number
        kanban: number
    }>({ firstName: '', classes: 0, activities: 0, kanban: 0 })

    useEffect(() => {
        const supabase = createClient()

        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const today = new Date().toISOString().split('T')[0]

            const [profileRes, classesRes, activitiesRes, kanbanRes] = await Promise.all([
                supabase.from('profiles').select('full_name').eq('id', user.id).single(),
                supabase.from('classes').select('id', { count: 'exact', head: true }),
                supabase.from('ped_activities').select('id', { count: 'exact', head: true }).gte('activity_date', today),
                supabase.from('ped_kanban_cards').select('id', { count: 'exact', head: true }).in('column_status', ACTIVE_STATUSES),
            ])

            setData({
                firstName: profileRes.data?.full_name?.split(' ')[0] || '',
                classes: classesRes.count || 0,
                activities: activitiesRes.count || 0,
                kanban: kanbanRes.count || 0,
            })
        }

        load()
    }, [])

    return (
        <div className="w-full h-full overflow-y-auto flex flex-col">
            <div className="flex-1 px-4 sm:px-8 py-6 flex flex-col gap-6 max-w-5xl mx-auto w-full">

                <motion.div
                    variants={heroVariant}
                    initial="hidden"
                    animate="show"
                    className="relative rounded-2xl overflow-hidden border border-emerald-200/60 dark:border-emerald-500/15 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/20 px-6 py-8 sm:px-10"
                >
                    <div className="absolute -top-10 -right-10 w-52 h-52 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-teal-400/15 dark:bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/20 mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Módulo Pedagógico</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white leading-tight">
                                {data.firstName ? <>Olá, <span className="text-emerald-600 dark:text-emerald-400">{data.firstName}</span> 👋</> : 'Bem-vindo 👋'}
                            </h2>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm italic">
                                "{quote}"
                            </p>
                        </div>

                        <div className="flex gap-3 shrink-0">
                            {[
                                { label: 'Turmas', value: data.classes, icon: 'groups' },
                                { label: 'Hoje', value: data.activities, icon: 'today' },
                                { label: 'Em curso', value: data.kanban, icon: 'pending_actions' },
                            ].map((s) => (
                                <div key={s.label} className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-white/60 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 backdrop-blur-sm shadow-sm">
                                    <span className="material-symbols-outlined text-lg text-emerald-500 mb-0.5">{s.icon}</span>
                                    <span className="text-xl font-black text-zinc-900 dark:text-white leading-none">{s.value}</span>
                                    <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold mt-0.5">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <div>
                    <p className="text-[11px] uppercase tracking-widest font-bold text-zinc-400 mb-3 px-1">Selecione uma área</p>
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                        {CARDS.map((card) => (
                            <motion.div key={card.href} variants={cardVariant}>
                                <Link href={card.href} className="group block h-full">
                                    <div className={`relative h-full rounded-2xl border ${card.border} ${card.bg} backdrop-blur-sm p-5 flex items-center gap-4 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer`}>
                                        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                        <div className={`shrink-0 w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                            <span className={`material-symbols-outlined text-3xl ${card.iconColor}`}>{card.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-base text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                {card.title}
                                            </h3>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                                {card.description}
                                            </p>
                                        </div>
                                        <span className="material-symbols-outlined text-lg text-zinc-300 dark:text-zinc-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-200 shrink-0">
                                            arrow_forward
                                        </span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
