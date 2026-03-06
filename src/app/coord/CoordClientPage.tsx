'use client';

import { useState, useMemo } from 'react';
import { Demand, ApprovalSubmission } from '@/types/demands';
import DemandList from '../../modules/coord/components/DemandList';
import TeamMemberCard from '../../modules/coord/components/TeamMemberCard';
import CreateDemandForm from '../../modules/coord/components/CreateDemandForm';
import { LayoutDashboard, Users, PlusCircle, Clock, CheckCircle2, ChevronDown, ChevronUp, Paperclip, FileText, ImageIcon, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface PendingPedCard {
    id: string;
    title: string;
    description: string | null;
    card_type: string | null;
    due_date: string | null;
    demand_id: string | null;
    column_status: string;
    creator?: { full_name: string } | null;
}

interface CoordClientPageProps {
    currentUser: any;
    initialDemands: any[];
    teamMembers: any[];
    pendingPedCards?: PendingPedCard[];
    approvalSubmissions?: ApprovalSubmission[];
}

export default function CoordClientPage({ currentUser, initialDemands, teamMembers, pendingPedCards = [], approvalSubmissions = [] }: CoordClientPageProps) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showApproval, setShowApproval] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    const canCreate = currentUser.role === 'Coord. Geral';

    // Demandas da tabela demands com status 'aprovacao'
    const pendingDemands = useMemo(() =>
        initialDemands.filter((d: Demand) => d.status === 'aprovacao'),
        [initialDemands]
    );

    const totalPending = pendingDemands.length + pendingPedCards.length;

    const handleRefresh = () => {
        setShowCreateForm(false);
        router.refresh();
    };

    const handleApproveDemand = async (demandId: string) => {
        // 1. Find and cleanup submission files
        const submission = approvalSubmissions.find(s => s.demand_id === demandId);
        if (submission) {
            await cleanupSubmission(submission);
        }

        // 2. Update demand status
        const { error } = await supabase
            .from('demands')
            .update({ status: 'finalizado' })
            .eq('id', demandId);

        if (error) {
            alert('Erro ao aprovar demanda.');
            return;
        }
        router.refresh();
    };

    const handleRejectDemand = async (demandId: string) => {
        const submission = approvalSubmissions.find(s => s.demand_id === demandId);
        if (submission) {
            await cleanupSubmission(submission);
        }

        const { error } = await supabase
            .from('demands')
            .update({ status: 'em_andamento' })
            .eq('id', demandId);

        if (error) {
            alert('Erro ao rejeitar demanda.');
            return;
        }
        router.refresh();
    };

    const handleApprovePedCard = async (cardId: string) => {
        const submission = approvalSubmissions.find(s => s.ped_card_id === cardId);
        if (submission) {
            await cleanupSubmission(submission);
        }

        const { error } = await supabase
            .from('ped_kanban_cards')
            .update({ column_status: 'concluido' })
            .eq('id', cardId);

        if (error) {
            alert('Erro ao aprovar card.');
            return;
        }
        router.refresh();
    };

    const handleRejectPedCard = async (cardId: string) => {
        const submission = approvalSubmissions.find(s => s.ped_card_id === cardId);
        if (submission) {
            await cleanupSubmission(submission);
        }

        const { error } = await supabase
            .from('ped_kanban_cards')
            .update({ column_status: 'andamento' })
            .eq('id', cardId);

        if (error) {
            alert('Erro ao rejeitar card.');
            return;
        }
        router.refresh();
    };

    // Cleanup: delete files from bucket + delete submission record
    const cleanupSubmission = async (submission: ApprovalSubmission) => {
        try {
            // Delete files from storage
            if (submission.file_urls.length > 0) {
                const filePaths = submission.file_urls.map(url => {
                    // Extract path from URL: .../temp_approvals/path/to/file
                    const parts = url.split('/temp_approvals/');
                    return parts[1] || '';
                }).filter(Boolean);

                if (filePaths.length > 0) {
                    await supabase.storage.from('temp_approvals').remove(filePaths);
                }
            }

            // Delete submission record
            await supabase.from('approval_submissions').delete().eq('id', submission.id);
        } catch (err) {
            console.error('Cleanup error:', err);
        }
    };

    // Helper to get submission for a demand/card
    const getSubmission = (demandId?: string, pedCardId?: string) => {
        if (demandId) return approvalSubmissions.find(s => s.demand_id === demandId);
        if (pedCardId) return approvalSubmissions.find(s => s.ped_card_id === pedCardId);
        return undefined;
    };

    return (
        <div className="flex-1 w-full h-full min-h-0 bg-slate-50 p-4 md:p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">

                {/* Header */}
                <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <LayoutDashboard className="text-primary" />
                            Coordenação & Demandas
                        </h1>
                        <p className="text-slate-500 mt-1">Gerencie tarefas e distribua demandas para a equipe.</p>
                    </div>

                    {canCreate && (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all"
                        >
                            <PlusCircle size={18} />
                            Nova Demanda
                        </button>
                    )}
                </div>

                {/* === SEÇÃO: ESPERANDO APROVAÇÃO === */}
                {totalPending > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-violet-200 overflow-hidden">
                        <button
                            onClick={() => setShowApproval(!showApproval)}
                            className="w-full flex items-center justify-between p-4 hover:bg-violet-50/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/30">
                                    <Clock size={20} className="text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-extrabold text-zinc-900">Esperando Aprovação</h3>
                                    <p className="text-xs text-zinc-500">{totalPending} {totalPending === 1 ? 'item aguardando' : 'itens aguardando'} seu aval</p>
                                </div>
                                <span className="ml-2 bg-violet-500 text-white text-xs font-black px-2.5 py-1 rounded-full">
                                    {totalPending}
                                </span>
                            </div>
                            {showApproval ? <ChevronUp size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}
                        </button>

                        <AnimatePresence>
                            {showApproval && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {/* Demandas (Comunicação) aguardando aprovação */}
                                        {pendingDemands.map((demand: Demand) => {
                                            const sub = getSubmission(demand.id);
                                            return (
                                                <div key={demand.id} className="bg-violet-50/60 border border-violet-200/80 rounded-xl p-4 flex flex-col gap-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                                📢 {demand.sector === 'administracao' ? 'Administração' : 'Comunicação'}
                                                            </span>
                                                            <h4 className="font-bold text-sm text-zinc-900 mt-1.5 truncate">{demand.title}</h4>
                                                            {demand.description && (
                                                                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{demand.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                        {demand.assignee?.full_name && (
                                                            <span className="font-medium">{demand.assignee.full_name}</span>
                                                        )}
                                                        {demand.due_date && (
                                                            <span>• {new Date(demand.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                                        )}
                                                    </div>

                                                    {/* Submission Data */}
                                                    {sub && (
                                                        <div className="bg-white/60 rounded-lg p-3 border border-violet-100 flex flex-col gap-2">
                                                            {sub.justification_text && (
                                                                <div>
                                                                    <span className="text-[10px] font-bold text-violet-500 uppercase flex items-center gap-1 mb-1">
                                                                        <FileText size={10} /> Justificativa
                                                                    </span>
                                                                    <p className="text-xs text-zinc-700 leading-relaxed bg-zinc-50/50 p-2 rounded-md border border-zinc-100">
                                                                        {sub.justification_text}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {sub.file_urls && sub.file_urls.length > 0 && (
                                                                <div>
                                                                    <span className="text-[10px] font-bold text-violet-500 uppercase flex items-center gap-1 mb-1 mt-2">
                                                                        <Paperclip size={10} /> Anexos ({sub.file_urls.length})
                                                                    </span>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {sub.file_urls.map((url, i) => (
                                                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                                                className="flex items-center gap-1.5 px-2 py-1 bg-white border border-zinc-200 rounded text-[10px] font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                                                            >
                                                                                <ImageIcon size={12} />
                                                                                {/* Extract filename */}
                                                                                <span className="truncate max-w-[100px]" title={url.split('/').pop()?.split('_').slice(1).join('_') || `Anexo ${i + 1}`}>
                                                                                    {url.split('/').pop()?.split('_').slice(1).join('_') || `Anexo ${i + 1}`}
                                                                                </span>
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 mt-auto">
                                                        <button
                                                            onClick={() => handleRejectDemand(demand.id)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                        >
                                                            <XCircle size={14} /> Rejeitar
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveDemand(demand.id)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                        >
                                                            <CheckCircle2 size={14} /> Aprovar
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Cards Pedagogia aguardando aprovação */}
                                        {pendingPedCards.map(card => {
                                            const sub = getSubmission(undefined, card.id);
                                            return (
                                                <div key={card.id} className="bg-violet-50/60 border border-violet-200/80 rounded-xl p-4 flex flex-col gap-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                                🎓 Pedagogia
                                                            </span>
                                                            <h4 className="font-bold text-sm text-zinc-900 mt-1.5 truncate">{card.title}</h4>
                                                            {card.description && (
                                                                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{card.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                        {card.card_type && <span className="font-medium">{card.card_type}</span>}
                                                        {card.due_date && (
                                                            <span>• {new Date(card.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                                        )}
                                                        {card.demand_id && <span className="text-amber-500 font-bold">👑 Demanda</span>}
                                                    </div>

                                                    {/* Submission Data */}
                                                    {sub && (
                                                        <div className="bg-white/60 rounded-lg p-3 border border-violet-100 flex flex-col gap-2">
                                                            {sub.justification_text && (
                                                                <div>
                                                                    <span className="text-[10px] font-bold text-violet-500 uppercase flex items-center gap-1 mb-1">
                                                                        <FileText size={10} /> Justificativa
                                                                    </span>
                                                                    <p className="text-xs text-zinc-700 leading-relaxed bg-zinc-50/50 p-2 rounded-md border border-zinc-100">
                                                                        {sub.justification_text}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {sub.file_urls && sub.file_urls.length > 0 && (
                                                                <div>
                                                                    <span className="text-[10px] font-bold text-violet-500 uppercase flex items-center gap-1 mb-1 mt-2">
                                                                        <Paperclip size={10} /> Anexos ({sub.file_urls.length})
                                                                    </span>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {sub.file_urls.map((url, i) => (
                                                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                                                className="flex items-center gap-1.5 px-2 py-1 bg-white border border-zinc-200 rounded text-[10px] font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                                                            >
                                                                                <ImageIcon size={12} />
                                                                                {/* Extract filename */}
                                                                                <span className="truncate max-w-[100px]" title={url.split('/').pop()?.split('_').slice(1).join('_') || `Anexo ${i + 1}`}>
                                                                                    {url.split('/').pop()?.split('_').slice(1).join('_') || `Anexo ${i + 1}`}
                                                                                </span>
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 mt-auto">
                                                        <button
                                                            onClick={() => handleRejectPedCard(card.id)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                        >
                                                            <XCircle size={14} /> Rejeitar
                                                        </button>
                                                        <button
                                                            onClick={() => handleApprovePedCard(card.id)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                        >
                                                            <CheckCircle2 size={14} /> Aprovar
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Team */}
                    <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
                        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                            <h3 className="shrink-0 font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <Users size={18} />
                                Equipe
                            </h3>
                            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                {teamMembers.map(member => (
                                    <TeamMemberCard key={member.id} member={member} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Demands List */}
                    <div className="lg:col-span-9 flex flex-col min-h-0">
                        <DemandList
                            demands={initialDemands}
                            onDemandClick={(d) => console.log('Clicked', d)}
                        />
                    </div>
                </div>

            </div>

            {/* Modal de Nova Demanda */}
            <CreateDemandForm
                isOpen={showCreateForm}
                onClose={() => setShowCreateForm(false)}
                onSuccess={handleRefresh}
                teamMembers={teamMembers}
            />
        </div>
    );
}
