'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent } from '../types/v2';
import { createPersonalEvent, getUserEvents, deletePersonalEvent } from '../actions/calendar';
import { BorealSkeleton } from '@/components/ui/BorealSkeleton';

export function LocalCalendar() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Modal de Novo Evento UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDateStr, setSelectedDateStr] = useState('');
    const [newEventTitle, setNewEventTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    useEffect(() => {
        const fetchMonthEvents = async () => {
            setIsLoading(true);
            const res = await getUserEvents(year, month + 1);
            if (res.success && res.data) {
                setEvents(res.data);
            }
            setIsLoading(false);
        };
        fetchMonthEvents();
    }, [year, month]);

    // LÃ³gica do Builder de CalendÃ¡rio (Semanas/Dias)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();

    // Grid 6 semanas
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

    // Actions VisÃ£o
    const handleDayClick = (dateObj: Date) => {
        // Normalizado pra string YYYY-MM-DD local sem Timezone Shifts bizarros
        const localDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        setSelectedDateStr(localDate);
        setNewEventTitle('');
        setIsModalOpen(true);
    };

    const handleSaveEvent = async () => {
        if (!newEventTitle.trim()) return;
        setIsSaving(true);
        const res = await createPersonalEvent(newEventTitle, selectedDateStr);
        if (res.success && res.data) {
            setEvents(prev => [...prev, res.data!].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));
            setIsModalOpen(false);
        }
        setIsSaving(false);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await deletePersonalEvent(id);
        setEvents(prev => prev.filter(ev => ev.id !== id));
    };

    return (
        <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5">
            {/* Header Control */}
            <div className="p-5 sm:px-6 flex items-center justify-between border-b border-zinc-200 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={goToToday} className="h-10 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-transparent hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors text-zinc-600 dark:text-zinc-300">
                        Hoje
                    </button>
                    <h3 className="text-xl sm:text-2xl font-black text-zinc-800 dark:text-zinc-100 capitalize">
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h3>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 transition-colors">
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>
                    <button onClick={nextMonth} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 transition-colors">
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                </div>
            </div>

            {/* Calendar Grid Header (Mon-Sun) */}
            <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-white/10 shrink-0 bg-zinc-50/50 dark:bg-black/20">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'SÃ¡b'].map(day => (
                    <div key={day} className="py-3 text-center text-[10px] sm:text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Body */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar grid grid-cols-7 auto-rows-fr bg-zinc-100 dark:bg-black/40 gap-[1px] custom-scrollbar">
                {isLoading ? (
                    // Loading State
                    <div className="col-span-7 row-span-6 bg-white dark:bg-zinc-900 flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-zinc-200 dark:border-zinc-800 border-t-secondary dark:border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : (
                    calendarGrid.map((cell, idx) => {
                        const localDateString = new Date(cell.date.getTime() - (cell.date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                        const dayEvents = events.filter(e => e.event_date === localDateString);
                        const isCurrentTs = isToday(cell.date);

                        return (
                            <div
                                key={idx}
                                onClick={() => cell.type === 'current' && handleDayClick(cell.date)}
                                className={`bg-white dark:bg-zinc-900 p-1 sm:p-2 min-h-[80px] sm:min-h-[100px] flex flex-col gap-1 transition-colors
                                    ${cell.type !== 'current' ? 'opacity-40 pointer-events-none' : 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/80'}
                                `}
                            >
                                {/* Marker Dia */}
                                <span className={`text-xs ml-auto font-bold w-6 h-6 flex items-center justify-center rounded-full ${isCurrentTs ? 'bg-secondary text-white shadow-md shadow-secondary/50' : 'text-zinc-500'}`}>
                                    {cell.day}
                                </span>

                                {/* Eventos no dia */}
                                <div className="flex-1 min-h-0 flex flex-col gap-1 overflow-y-auto custom-scrollbar no-scrollbar">
                                    {dayEvents.map(ev => (
                                        <div
                                            key={ev.id}
                                            className="group relative bg-secondary/10 dark:bg-primary/10 border border-secondary/20 dark:border-primary/20 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-md text-secondary-dark dark:text-primary-light truncate"
                                            title={ev.title}
                                        >
                                            <span className="truncate block pr-4">{ev.title}</span>
                                            {/* Delete X invisible until hover */}
                                            <button
                                                onClick={(e) => handleDelete(e, ev.id)}
                                                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all font-black text-xs"
                                            >
                                                âœ•
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Quick Add Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10"
                        >
                            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1">Novo Lembrete</h3>
                            <p className="text-secondary dark:text-primary text-sm font-semibold mb-5">
                                {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                            </p>

                            <input
                                type="text"
                                autoFocus
                                value={newEventTitle}
                                onChange={e => setNewEventTitle(e.target.value)}
                                placeholder="Pagar Conta, ReuniÃ£o Externa, Folga..."
                                className="w-full bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 font-medium text-zinc-900 dark:text-white"
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEvent()}
                            />

                            <div className="flex items-center gap-3 mt-6">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 font-bold py-2.5 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEvent}
                                    disabled={isSaving || !newEventTitle.trim()}
                                    className="flex-1 font-bold py-2.5 rounded-xl bg-secondary text-white shadow-md shadow-secondary/30 disabled:opacity-50 transition-all hover:bg-[rgba(59,130,246,0.9)]"
                                >
                                    {isSaving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

