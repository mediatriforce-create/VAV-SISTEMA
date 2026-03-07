'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isBefore, isAfter, subMinutes, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Meeting } from '@/types/meeting';
import CreateMeetingModal from './CreateMeetingModal';
import { deleteMeetingAction } from '@/actions/meetings';
import toast from 'react-hot-toast';

interface MeetingsListProps {
    initialMeetings: Meeting[];
    userRole?: string;
}

export default function MeetingsList({ initialMeetings, userRole }: MeetingsListProps) {
    const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, meeting: Meeting } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isRestricted = ['Estagiário(a) de ADM', 'Estagiário(a) de Comunicação', 'Estagiário(a) de Pedagogia', 'Educador'].includes(userRole || '');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => {
            clearInterval(timer);
            document.removeEventListener('click', handleClick);
        };
    }, []);

    const getMeetingStatus = (date: string, startTime: string, endTime: string) => {
        try {
            const startDateTime = parse(`${date} ${startTime.slice(0, 5)}`, 'yyyy-MM-dd HH:mm', new Date());
            const endDateTime = parse(`${date} ${endTime.slice(0, 5)}`, 'yyyy-MM-dd HH:mm', new Date());
            if (endTime < startTime) endDateTime.setDate(endDateTime.getDate() + 1);
            const openWindowTime = subMinutes(startDateTime, 10);
            if (isBefore(currentTime, openWindowTime)) return 'WAITING';
            else if (isAfter(currentTime, endDateTime)) return 'EXPIRED';
            else return 'OPEN';
        } catch { return 'WAITING'; }
    };

    const handleDelete = async () => {
        if (!contextMenu) return;
        setIsDeleting(true);
        const toastId = toast.loading('Excluindo reunião...');
        const res = await deleteMeetingAction(contextMenu.meeting.id);
        if (res.success) {
            toast.success(res.message, { id: toastId });
            setMeetings(meetings.filter(m => m.id !== contextMenu.meeting.id));
        } else {
            toast.error(res.message, { id: toastId });
        }
        setIsDeleting(false);
        setContextMenu(null);
    };

    return (
        <div className="w-full pb-8">
            {/* Header + Botão na mesma linha */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary dark:text-primary text-[28px]">video_camera_front</span>
                        Reuniões
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                        Gerencie agendamentos e acesse salas virtuais pelo painel.
                    </p>
                </div>

                {!isRestricted && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-bold transition-colors text-sm"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Nova Reunião
                    </button>
                )}
            </div>

            {/* Conteúdo */}
            {meetings.length === 0 ? (
                <div className="w-full py-16 flex flex-col items-center justify-center bg-zinc-50 dark:bg-white/5 border border-dashed border-zinc-200 dark:border-white/10 rounded-2xl">
                    <span className="material-symbols-outlined text-5xl text-zinc-300 dark:text-zinc-600 mb-3">event_busy</span>
                    <p className="text-zinc-500 font-medium text-sm">Nenhuma reunião agendada.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {meetings.map((meeting) => {
                        const parsedDate = parseISO(meeting.date);
                        const status = getMeetingStatus(meeting.date, meeting.start_time, meeting.end_time);

                        return (
                            <div
                                key={meeting.id}
                                className="bg-white dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col relative group"
                            >
                                {/* Conteúdo do Card */}
                                <div className="p-5 flex-1 flex flex-col">
                                    {/* Botão 3 pontinhos */}
                                    {!isRestricted && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setContextMenu({
                                                    x: rect.left,
                                                    y: rect.bottom + 4,
                                                    meeting
                                                });
                                            }}
                                            className="absolute top-3 right-3 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Opções"
                                        >
                                            <span className="material-symbols-outlined text-lg">more_vert</span>
                                        </button>
                                    )}

                                    {/* Data + Ícone */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-secondary/10 dark:bg-primary/20 flex items-center justify-center border border-secondary/20 dark:border-primary/20">
                                            <span className="material-symbols-outlined text-secondary dark:text-primary text-lg">videocam</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-secondary dark:text-primary uppercase">{format(parsedDate, 'EEEE', { locale: ptBR })}</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{format(parsedDate, "dd 'de' MMMM", { locale: ptBR })}</p>
                                        </div>
                                    </div>

                                    {/* Título */}
                                    <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-1 leading-snug pr-6">
                                        {meeting.title}
                                    </h3>

                                    {meeting.description && (
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
                                            {meeting.description}
                                        </p>
                                    )}

                                    {/* Horário */}
                                    <div className="mt-auto flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                                        <span className="material-symbols-outlined text-xs">schedule</span>
                                        {meeting.start_time.slice(0, 5)} – {meeting.end_time.slice(0, 5)}
                                    </div>
                                </div>

                                {/* Ação do Card */}
                                <div className="px-4 py-3 bg-zinc-50 dark:bg-black/20 border-t border-zinc-100 dark:border-white/5">
                                    {!meeting.meet_link ? (
                                        <div className="flex items-center justify-center w-full py-2 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-400 text-sm font-medium cursor-not-allowed">
                                            Link indisponível
                                        </div>
                                    ) : status === 'WAITING' ? (
                                        <div className="flex items-center justify-center w-full py-2 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-400 text-sm font-medium cursor-not-allowed">
                                            <span className="material-symbols-outlined mr-1.5 text-sm">lock_clock</span>
                                            Aguardando Horário
                                        </div>
                                    ) : status === 'EXPIRED' ? (
                                        <div className="flex items-center justify-center w-full py-2 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-400 dark:text-red-500 text-sm font-medium cursor-not-allowed border border-red-100 dark:border-red-900/30">
                                            <span className="material-symbols-outlined mr-1.5 text-sm">event_busy</span>
                                            Encerrada
                                        </div>
                                    ) : (
                                        <a
                                            href={`/dashboard/reunioes/sala/${meeting.id}`}
                                            className="flex items-center justify-center w-full py-2 rounded-lg bg-secondary/10 hover:bg-secondary text-secondary-dark hover:text-white font-bold text-sm transition-all border border-secondary/20"
                                        >
                                            <span className="relative flex h-2.5 w-2.5 mr-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                                            </span>
                                            Entrar na Sala
                                            <span className="material-symbols-outlined ml-1.5 text-sm">open_in_new</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Context Menu Popup */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x }}
                        className="z-50 bg-white dark:bg-zinc-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-zinc-200 dark:border-zinc-700 overflow-hidden min-w-[180px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-700/50 bg-zinc-50 dark:bg-zinc-900/50">
                            <p className="text-xs font-bold text-zinc-400 uppercase">Opções</p>
                            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{contextMenu.meeting.title}</p>
                        </div>
                        <div className="p-1">
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="w-full text-left px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                {isDeleting ? 'Excluindo...' : 'Excluir Reunião'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal */}
            <CreateMeetingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={(newMeeting) => setMeetings([newMeeting, ...meetings])}
            />
        </div>
    );
}
