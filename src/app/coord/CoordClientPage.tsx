'use client';

import { useState, useMemo } from 'react';
import { Demand, ApprovalSubmission } from '@/types/demands';
import DemandList from '../../modules/coord/components/DemandList';
import TeamMemberCard from '../../modules/coord/components/TeamMemberCard';
import CreateDemandForm from '../../modules/coord/components/CreateDemandForm';
import ReviewModal from '../../modules/coord/components/ReviewModal';
import { ObservationModal } from '../../modules/coord/components/ObservationModal';
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
    const [memberForNote, setMemberForNote] = useState<any>(null);

    // Review Modal State
    const [reviewModal, setReviewModal] = useState<{
        isOpen: boolean;
        action: 'approve' | 'reject';
        type: 'demand' | 'pedcard';
        id: string;
        itemName: string;
    } | null>(null);

    const router = useRouter();
    const supabase = createClient();

    const canCreate = ['Coordenadora ADM', 'Coordenação de Pedagogia', 'Presidência', 'Direção'].includes(currentUser.role);

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

    // Open Modal Handlers
    const openReviewModal = (action: 'approve' | 'reject', type: 'demand' | 'pedcard', id: string, itemName: string) => {
        setReviewModal({ isOpen: true, action, type, id, itemName });
    };

    const confirmReview = async (note: string) => {
        if (!reviewModal) return;
        const { action, type, id } = reviewModal;

        let error;

        if (type === 'demand') {
            const submission = approvalSubmissions.find(s => s.demand_id === id);
            if (submission) await cleanupSubmission(submission);

            if (action === 'approve') {
                const { error: err } = await supabase.from('demands').update({
                    status: 'finalizado',
                    coordination_note: note || null,
                    is_rejected: false
                }).eq('id', id);
                error = err;
            } else {
                const { error: err } = await supabase.from('demands').update({
                    status: 'em_andamento',
                    coordination_note: note || null,
                    is_rejected: true
                }).eq('id', id);
                error = err;
            }
        } else {
            const submission = approvalSubmissions.find(s => s.ped_card_id === id);
            if (submission) await cleanupSubmission(submission);

            if (action === 'approve') {
                const { error: err } = await supabase.from('ped_kanban_cards').update({
                    column_status: 'concluido',
                    coordination_note: note || null,
                    is_rejected: false
                }).eq('id', id);
                error = err;
            } else {
                const { error: err } = await supabase.from('ped_kanban_cards').update({
                    column_status: 'andamento',
                    coordination_note: note || null,
                    is_rejected: true
                }).eq('id', id);
                error = err;
            }
        }

        if (error) {
            console.error('Review Error:', error);
            alert('Erro ao processar a requisição.');
        } else {
            setReviewModal(null);
            router.refresh();
        }
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
        <div className="flex-1 w-full h-full min-h-0 bg-slate-50 dark:bg-zinc-950 p-4 md:p-6 overflow-hidden flex flex-col">
            <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 flex-1 min-h-0">

                {/* Header */}
                <div className="shrink-0 flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <LayoutDashboard className="text-primary dark:text-blue-400" />
                            Coordenação & Demandas
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Gerencie tarefas e distribua demandas para a equipe.
                        </p>
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
                    <div className="shrink-0 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-violet-200 dark:border-white/10 min-h-0 max-h-[45vh]">
                        <button
                            onClick={() => setShowApproval(!showApproval)}
                            className="w-full shrink-0 flex items-center justify-between p-4 hover:bg-violet-50/50 dark:hover:bg-zinc-800 transition-colors rounded-t-2xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/30">
                                    <Clock size={20} className="text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">Esperando Aprovação</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{totalPending} {totalPending === 1 ? 'item aguardando' : 'itens aguardando'} seu aval</p>
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
                                    className="overflow-y-auto custom-scrollbar min-h-0"
                                >
                                    <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {/* Demandas (Comunicação) aguardando aprovação */}
                                        {pendingDemands.map((demand: Demand) => {
                                            const sub = getSubmission(demand.id);
                                            return (
                                                <div key={demand.id} className="bg-violet-50/60 dark:bg-zinc-800/50 border border-violet-200/80 dark:border-zinc-700 rounded-xl p-4 flex flex-col gap-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                                                📢 {demand.sector === 'administracao' ? 'Administração' : 'Comunicação'}
                                                            </span>
                                                            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-1.5 truncate">{demand.title}</h4>
                                                            {demand.description && (
                                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{demand.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                                                        {demand.assignee?.full_name && (
                                                            <span className="font-medium">{demand.assignee.full_name}</span>
                                                        )}
                                                        {demand.due_date && (
                                                            <span>• {new Date(demand.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                                        )}
                                                    </div>

                                                    {/* Submission Data */}
                                                    {sub && (
                                                        <div className="bg-white/60 dark:bg-zinc-900/50 rounded-lg p-3 border border-violet-100 dark:border-white/5 flex flex-col gap-2">
                                                            {sub.justification_text && (
                                                                <div>
                                                                    <span className="text-[10px] font-bold text-violet-500 uppercase flex items-center gap-1 mb-1">
                                                                        <FileText size={10} /> Justificativa
                                                                    </span>
                                                                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50/50 dark:bg-zinc-800/50 p-2 rounded-md border border-zinc-100 dark:border-zinc-700">
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
                                                                        {sub.file_urls.map((url, i) => {
                                                                            const isImg = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
                                                                            const fileName = url.split('/').pop()?.split('_').slice(1).join('_') || `Anexo ${i + 1}`;

                                                                            if (isImg) {
                                                                                return (
                                                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-full mb-1 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                                                                        <img src={url} alt={fileName} className="w-full h-auto object-cover max-h-32 hover:opacity-90 transition-opacity" />
                                                                                    </a>
                                                                                );
                                                                            }

                                                                            return (
                                                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                                                    className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
                                                                                >
                                                                                    <ImageIcon size={12} />
                                                                                    <span className="truncate max-w-[100px]" title={fileName}>
                                                                                        {fileName}
                                                                                    </span>
                                                                                </a>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openReviewModal('reject', 'demand', demand.id, demand.title)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-500/20 text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                        >
                                                            <XCircle size={14} /> Rejeitar
                                                        </button>
                                                        <button
                                                            onClick={() => openReviewModal('approve', 'demand', demand.id, demand.title)}
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
                                                <div key={card.id} className="bg-violet-50/60 dark:bg-zinc-800/50 border border-violet-200/80 dark:border-zinc-700 rounded-xl p-4 flex flex-col gap-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                                                🎓 Pedagogia
                                                            </span>
                                                            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-1.5 truncate">{card.title}</h4>
                                                            {card.description && (
                                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{card.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                                                        {card.card_type && <span className="font-medium">{card.card_type}</span>}
                                                        {card.due_date && (
                                                            <span>• {new Date(card.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                                        )}
                                                        {card.demand_id && <span className="text-amber-500 font-bold">👑 Demanda</span>}
                                                    </div>

                                                    {/* Submission Data */}
                                                    {sub && (
                                                        <div className="bg-white/60 dark:bg-zinc-900/50 rounded-lg p-3 border border-violet-100 dark:border-white/5 flex flex-col gap-2">
                                                            {sub.justification_text && (
                                                                <div>
                                                                    <span className="text-[10px] font-bold text-violet-500 uppercase flex items-center gap-1 mb-1">
                                                                        <FileText size={10} /> Justificativa
                                                                    </span>
                                                                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50/50 dark:bg-zinc-800/50 p-2 rounded-md border border-zinc-100 dark:border-zinc-700">
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
                                                                        {sub.file_urls.map((url, i) => {
                                                                            const isImg = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
                                                                            const fileName = url.split('/').pop()?.split('_').slice(1).join('_') || `Anexo ${i + 1}`;

                                                                            if (isImg) {
                                                                                return (
                                                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-full mb-1 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                                                                        <img src={url} alt={fileName} className="w-full h-auto object-cover max-h-32 hover:opacity-90 transition-opacity" />
                                                                                    </a>
                                                                                );
                                                                            }

                                                                            return (
                                                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                                                    className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
                                                                                >
                                                                                    <ImageIcon size={12} />
                                                                                    <span className="truncate max-w-[100px]" title={fileName}>
                                                                                        {fileName}
                                                                                    </span>
                                                                                </a>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openReviewModal('reject', 'pedcard', card.id, card.title)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-500/20 text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                        >
                                                            <XCircle size={14} /> Rejeitar
                                                        </button>
                                                        <button
                                                            onClick={() => openReviewModal('approve', 'pedcard', card.id, card.title)}
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
                        <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 p-4">
                            <h3 className="shrink-0 font-semibold text-slate-700 dark:text-zinc-100 mb-4 flex items-center gap-2">
                                <Users size={18} />
                                Equipe
                            </h3>
                            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                {teamMembers.map(member => (
                                    <TeamMemberCard key={member.id} member={member} onClick={() => setMemberForNote(member)} />
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

            {/* Modal de Revisão (Aprovar/Rejeitar) */}
            {reviewModal && (
                <ReviewModal
                    isOpen={reviewModal.isOpen}
                    onClose={() => setReviewModal(null)}
                    onSubmit={confirmReview}
                    action={reviewModal.action}
                    itemName={reviewModal.itemName}
                />
            )}

            {/* Modal de Observação */}
            <ObservationModal
                isOpen={!!memberForNote}
                onClose={() => setMemberForNote(null)}
                member={memberForNote}
            />
        </div>
    );
}
