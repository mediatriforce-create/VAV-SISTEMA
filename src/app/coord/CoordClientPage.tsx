'use client';

import { useState } from 'react';
import { Demand } from '@/types/demands';
import DemandList from '../../modules/coord/components/DemandList';
import TeamMemberCard from '../../modules/coord/components/TeamMemberCard';
import CreateDemandForm from '../../modules/coord/components/CreateDemandForm';
import { LayoutDashboard, Users, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CoordClientPageProps {
    currentUser: any;
    initialDemands: any[];
    teamMembers: any[];
}

export default function CoordClientPage({ currentUser, initialDemands, teamMembers }: CoordClientPageProps) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const router = useRouter();

    const canCreate = currentUser.role === 'Coord. Geral';

    const handleRefresh = () => {
        setShowCreateForm(false);
        router.refresh();
    };

    return (
        <div className="flex-1 w-full h-full min-h-0 bg-slate-50 p-4 md:p-6 overflow-hidden">
            <div className="max-w-7xl mx-auto h-full flex flex-col gap-6">

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
