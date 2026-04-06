'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalEvent, getGlobalEvents, createGlobalEvent, deleteGlobalEvent } from '@/actions/globalCalendar';
import toast from 'react-hot-toast';

export function GlobalCalendar({ userRole, userId }: { userRole?: string; userId?: string }) {
    const [events, setEvents] = useState<GlobalEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    const isLeadership = ['Coordenadora ADM', 'Coordenação de Pedagogia', 'Direção', 'Presidência'].includes(userRole || '');

    // Modals state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedDateStr, setSelectedDateStr] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<GlobalEvent | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Fechar modais com Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsCreateModalOpen(false);
                setIsViewModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    useEffect(() => {
        const fetchMonthEvents = async () => {
            setIsLoading(true);
            const res = await getGlobalEvents(year, month + 1);
            if (res.success && res.data) {
                setEvents(res.data);
            }
            setIsLoading(false);
        };
        fetchMonthEvents();
    }, [year, month]);

    // Calendar Builder Logic
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();

    const calendarGrid = [];
    let dayCount = 1;

    for (let i = 0; i < 42; i++) {
        if (i < firstDayOfMonth) {
            calendarGrid.push({
                type: 'prev',
                day: lastDayOfPrevMonth - firstDayOfMonth + i + 1,
                date: new Date(year, month - 1, lastDayOfPrevMonth - firstDayOfMonth + i + 1)
            });
        } else if (dayCount <= daysInMonth) {
            calendarGrid.push({
                type: 'current',
                day: dayCount,
                date: new Date(year, month, dayCount)
            });
            dayCount++;
        } else {
            calendarGrid.push({
                type: 'next',
                day: dayCount - daysInMonth,
                date: new Date(year, month + 1, dayCount - daysInMonth)
            });
            dayCount++;
        }
    }

    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const handleEmptyDayClick = (dateObj: Date) => {
        const localDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        setSelectedDateStr(localDate);
        setIsCreateModalOpen(true);
    };

    const handleEventClick = (e: React.MouseEvent, ev: GlobalEvent) => {
        e.stopPropagation();
        setSelectedEvent(ev);
        setIsViewModalOpen(true);
    };

    const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading('Publicando evento no mural...');

        const formData = new FormData(e.currentTarget);
        formData.append('event_date', selectedDateStr);

        const res = await createGlobalEvent(formData);

        if (res.success && res.data) {
            // Fake immediate insertion for optimistic UI or just refetch. We'll add manually:
            setEvents(prev => [...prev, {
                ...res.data!,
                coordinator_name: 'Você (Recarregue para atualizar nome)'
            }].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));
            toast.success('Evento publicado!', { id: toastId });
            setIsCreateModalOpen(false);
        } else {
            toast.error(res.message || 'Erro ao publicar.', { id: toastId });
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente apagar este evento do mural de todos?')) return;

        setIsSaving(true);
        const toastId = toast.loading('Apagando evento...');
        const res = await deleteGlobalEvent(id);

        if (res.success) {
            setEvents(prev => prev.filter(ev => ev.id !== id));
            toast.success('Evento apagado.', { id: toastId });
            setIsViewModalOpen(false);
        } else {
            toast.error(res.message || 'Erro ao apagar.', { id: toastId });
        }
        setIsSaving(false);
    };

    return (
        <div className="w-full flex-1 flex flex-col min-h-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl rounded-3xl border border-zinc-200/60 dark:border-white/10 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-5 sm:px-8 flex items-center justify-between border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={goToToday} className="h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-wider bg-white dark:bg-black/50 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors text-zinc-700 dark:text-zinc-300 shadow-sm">
                        Hoje
                    </button>
                    <h3 className="text-2xl sm:text-3xl font-black text-indigo-900 dark:text-indigo-200 capitalize tracking-tight flex items-center gap-2">
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h3>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-black/50 p-1 rounded-full border border-zinc-200 dark:border-white/10 shadow-sm">
                    <button onClick={prevMonth} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 transition-colors">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button onClick={nextMonth} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 transition-colors">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-white/10 shrink-0 bg-white/50 dark:bg-black/20">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="py-4 text-center text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid Body */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar grid grid-cols-7 auto-rows-fr gap-px bg-zinc-200/60 dark:bg-white/5">
                {isLoading ? (
                    <div className="col-span-7 flex justify-center py-32 bg-white dark:bg-zinc-950">
                        <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    calendarGrid.map((cell, idx) => {
                        const localDateString = new Date(cell.date.getTime() - (cell.date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                        const dayEvents = events.filter(e => e.event_date === localDateString);
                        const isCurrentTs = isToday(cell.date);

                        return (
                            <div
                                key={idx}
                                onClick={() => cell.type === 'current' && handleEmptyDayClick(cell.date)}
                                className={`bg-white dark:bg-zinc-950/80 p-2 min-h-[120px] flex flex-col gap-2 transition-colors relative group
                                    ${cell.type !== 'current' ? 'opacity-40 bg-zinc-50/50 dark:bg-black/50 pointer-events-none'
                                        : 'cursor-pointer hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'}
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    {cell.type === 'current' && (
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 material-symbols-outlined text-[16px]">add_circle</span>
                                    )}
                                    <span className={`text-sm ml-auto font-black w-7 h-7 flex items-center justify-center rounded-full ${isCurrentTs ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                        {cell.day}
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar no-scrollbar flex flex-col gap-1.5 mt-1">
                                    {dayEvents.map(ev => (
                                        <div
                                            key={ev.id}
                                            onClick={(e) => handleEventClick(e, ev)}
                                            className={`w-full text-left bg-gradient-to-r ${ev.is_meeting ? 'from-purple-50 to-fuchsia-50 dark:from-purple-900/40 dark:to-fuchsia-900/20 border-purple-100 dark:border-purple-800/50 hover:border-purple-300 dark:hover:border-purple-500/50' : 'from-indigo-50 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/20 border-indigo-100 dark:border-indigo-800/50 hover:border-indigo-300 dark:hover:border-indigo-500/50'} border p-2 rounded-lg cursor-pointer transition-all hover:shadow-md hover:-translate-y-px group/card`}
                                        >
                                            <h4 className={`text-[11px] font-bold ${ev.is_meeting ? 'text-purple-900 dark:text-purple-100' : 'text-indigo-900 dark:text-indigo-100'} truncate flex items-center gap-1.5`}>
                                                {ev.is_meeting ? <span className="material-symbols-outlined text-[12px] text-purple-500">groups</span> : (ev.image_url ? <span className="material-symbols-outlined text-[12px] text-indigo-500">image</span> : <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>)}
                                                <span className="truncate">{ev.title}</span>
                                            </h4>
                                            {ev.is_meeting && (
                                                <div className="text-[9px] font-bold text-purple-500 dark:text-purple-400 mt-1 uppercase tracking-wider flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[10px]">videocam</span> Reunião {ev.start_time ? `às ${ev.start_time.substring(0, 5)}` : ''}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Event Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div
                        className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm"
                        onClick={(e) => { if (e.target === e.currentTarget) setIsCreateModalOpen(false); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2rem] p-8 shadow-2xl border border-zinc-200 dark:border-white/10 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors bg-zinc-100 dark:bg-zinc-800 w-8 h-8 flex items-center justify-center rounded-full">
                                <span className="material-symbols-outlined text-sm font-bold">close</span>
                            </button>

                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Publicar no Mural</h3>
                            <p className="text-indigo-600 dark:text-indigo-400 text-sm font-bold mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">event</span>
                                {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                            </p>

                            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1">Título do Evento *</label>
                                    <input required name="title" type="text" placeholder="Ex: Reunião Geral de Planejamento" className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-zinc-900 dark:text-white" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1">Descrição</label>
                                    <textarea name="description" rows={3} placeholder="Detalhes do evento, horários alternativos, pauta..." className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-zinc-800 dark:text-zinc-200 resize-none"></textarea>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1">Imagem Principal (Opcional)</label>
                                        <input name="image_file" type="file" accept="image/*" className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-zinc-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-300" />
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <button type="submit" disabled={isSaving} className="flex-1 font-black uppercase tracking-wider text-xs py-3.5 rounded-xl bg-indigo-600 dark:bg-amber-500 text-white dark:text-zinc-900 shadow-lg shadow-indigo-600/30 dark:shadow-amber-500/20 disabled:opacity-50 transition-all hover:bg-indigo-500 dark:hover:bg-amber-400">
                                        {isSaving ? 'Publicando...' : 'Publicar no Mural'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View Event Modal */}
            <AnimatePresence>
                {isViewModalOpen && selectedEvent && (
                    <div
                        className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-md"
                        onClick={(e) => { if (e.target === e.currentTarget) setIsViewModalOpen(false); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-white/10 relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Banner Image */}
                            {selectedEvent.image_url ? (
                                <div className="w-full h-48 bg-zinc-100 dark:bg-zinc-800 relative shrink-0">
                                    <img src={selectedEvent.image_url} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                    <button onClick={() => setIsViewModalOpen(false)} className="absolute top-4 right-4 text-white hover:text-red-400 transition-colors bg-white/20 backdrop-blur-md w-8 h-8 flex items-center justify-center rounded-full">
                                        <span className="material-symbols-outlined text-sm font-bold">close</span>
                                    </button>
                                    <h3 className="absolute bottom-4 left-6 pr-6 text-2xl font-black text-white drop-shadow-lg leading-tight">
                                        {selectedEvent.title}
                                    </h3>
                                </div>
                            ) : (
                                <div className={`w-full bg-gradient-to-br ${selectedEvent.is_meeting ? 'from-purple-500 to-fuchsia-600' : 'from-indigo-500 to-purple-600'} p-8 relative shrink-0`}>
                                    <button onClick={() => setIsViewModalOpen(false)} className="absolute top-4 right-4 text-white hover:text-red-300 transition-colors bg-white/20 backdrop-blur-md w-8 h-8 flex items-center justify-center rounded-full">
                                        <span className="material-symbols-outlined text-sm font-bold">close</span>
                                    </button>
                                    <h3 className="text-2xl font-black text-white mt-4 drop-shadow-md leading-tight">
                                        {selectedEvent.title}
                                    </h3>
                                </div>
                            )}

                            {/* Details Body */}
                            <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-xl flex items-center gap-2 border border-indigo-100 dark:border-indigo-500/20">
                                        <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-[18px]">calendar_month</span>
                                        <span className="text-indigo-800 dark:text-indigo-300 font-bold text-sm">
                                            {new Date(selectedEvent.event_date + 'T12:00:00').toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                                        </span>
                                    </div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                        Por {selectedEvent.coordinator_name}
                                    </div>
                                </div>

                                {selectedEvent.description ? (
                                    <div className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-medium bg-zinc-50 dark:bg-black/20 p-5 rounded-2xl border border-zinc-100 dark:border-white/5">
                                        {selectedEvent.description}
                                    </div>
                                ) : (
                                    <p className="text-zinc-400 dark:text-zinc-500 text-sm italic">Sem descrição adicional.</p>
                                )}
                            </div>

                            {/* Actions Footer */}
                            <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-white/5 flex gap-3 shrink-0">
                                {selectedEvent.is_meeting && (
                                    <button
                                        onClick={() => {
                                            setIsViewModalOpen(false);
                                            window.location.href = '/dashboard/reunioes';
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 font-black uppercase tracking-wider text-xs py-3.5 rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-500"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">videocam</span>
                                        Ir para Reuniões
                                    </button>
                                )}

                                {(isLeadership || selectedEvent.created_by === userId) && !selectedEvent.is_meeting && (
                                    <button
                                        onClick={() => handleDelete(selectedEvent.id)}
                                        disabled={isSaving}
                                        className="flex-1 flex items-center justify-center gap-2 font-black uppercase tracking-wider text-xs py-3.5 rounded-xl bg-white dark:bg-zinc-800 text-red-500 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                        title="Apagar Evento"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                        Apagar do Mural
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
