import { Demand } from '@/types/demands';
import { Calendar, AlertCircle, Clock, User } from 'lucide-react';

interface DemandCardProps {
    demand: Demand;
    onClick?: (demand: Demand) => void;
}

const PRIORITY_COLORS = {
    baixa: 'bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50 shadow-inner',
    media: 'bg-yellow-100/80 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50 shadow-inner',
    alta: 'bg-red-100/80 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50 shadow-inner',
};

const SECTOR_LABELS: Record<string, string> = {
    comunicacao: 'Comunicação',
    pedagogia: 'Pedagogia',
    administracao: 'Administração',
};

const STATUS_LABELS = {
    a_fazer: 'A Fazer',
    em_andamento: 'Em Andamento',
    revisao: 'Revisão',
    aprovacao: 'Aguardando Aprovação',
    finalizado: 'Finalizado',
};

export default function DemandCard({ demand, onClick }: DemandCardProps) {
    return (
        <div
            onClick={() => onClick?.(demand)}
            className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-5 rounded-2xl shadow-sm hover:shadow-xl border border-slate-200/60 dark:border-gray-700/60 hover:border-primary/30 dark:hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col gap-4 relative overflow-hidden"
        >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="flex justify-between items-start">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest ${PRIORITY_COLORS[demand.priority]}`}>
                    {demand.priority}
                </span>
                <span className="text-[10px] text-slate-600 dark:text-gray-300 font-bold uppercase tracking-wider bg-slate-100/80 dark:bg-gray-700/80 border border-slate-200/50 dark:border-gray-600/50 px-2.5 py-1 rounded-lg shadow-sm">
                    {STATUS_LABELS[demand.status]}
                </span>
            </div>

            <div className="flex-1">
                <h3 className="font-bold text-slate-800 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">{demand.title}</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-2 flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-gray-500"></span>
                    {SECTOR_LABELS[demand.sector]}
                </p>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100/80 dark:border-gray-700/80 flex items-center justify-between text-xs text-slate-500 dark:text-gray-400 font-medium">
                <div className="flex items-center gap-2">
                    {demand.assignee?.avatar_url ? (
                        <div className="relative">
                            <img
                                src={demand.assignee.avatar_url}
                                alt={demand.assignee.full_name}
                                className="w-7 h-7 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                            />
                            <div className="absolute inset-0 rounded-full border border-black/5 dark:border-white/10"></div>
                        </div>
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm">
                            <User size={14} className="text-slate-400 dark:text-gray-500" />
                        </div>
                    )}
                    <span className="truncate max-w-[110px] group-hover:text-slate-700 dark:group-hover:text-gray-300 transition-colors">{demand.assignee?.full_name || 'Sem responsável'}</span>
                </div>

                {demand.due_date && (
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-gray-800/50 px-2 py-1 rounded-md border border-slate-200/50 dark:border-gray-700/50">
                        <Calendar size={13} className="text-slate-400 dark:text-gray-500" />
                        <span className="text-[10px] font-bold tracking-wide">{new Date(demand.due_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
