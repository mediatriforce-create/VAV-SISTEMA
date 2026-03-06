import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PERMISSIONS } from '@/lib/permissions';
import CoordClientPage from './CoordClientPage'; // We'll move the client logic here

export default async function CoordPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Fetch user profile to check permissions
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, id, avatar_url')
        .eq('id', user.id)
        .single();

    if (!profile) {
        redirect('/login');
    }

    // Check generic 'coordenacao' module permission
    const allowedModules = PERMISSIONS[profile.role as keyof typeof PERMISSIONS];
    if (!allowedModules?.includes('coordenacao')) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Acesso Negado</h2>
                    <p className="text-slate-500">
                        Você não tem permissão para acessar o módulo de Coordenação.
                        Contate a Coordenação Geral se achar que isso é um erro.
                    </p>
                </div>
            </div>
        );
    }

    // --- Data Fetching ---

    // 1. Fetch Team Members (for creating demands and filters)
    // We want profiles that are 'active' (implied) and generic list
    const { data: teamMembers } = await supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url')
        .order('full_name');

    // 2. Fetch Demands
    // RLS will automatically filter what this user can see.
    // We join with assignee and creator for display names.
    const { data: demands } = await supabase
        .from('demands')
        .select(`
      *,
      assignee:assigned_to(full_name, avatar_url),
      creator:created_by(full_name, avatar_url)
    `)
        .order('created_at', { ascending: false });

    // 3. Fetch Pedagogia Kanban cards waiting for approval
    const { data: pendingPedCards } = await supabase
        .from('ped_kanban_cards')
        .select(`
            id, title, description, card_type, due_date, demand_id, column_status,
            creator:created_by(full_name)
        `)
        .eq('column_status', 'aprovacao')
        .order('created_at', { ascending: false });

    // 4. Fetch approval submissions for pending items
    const { data: approvalSubmissions } = await supabase
        .from('approval_submissions')
        .select('*')
        .order('created_at', { ascending: false });

    // 4. Simple aggregation for "Active Demands" count per member
    const memberStats = teamMembers?.map((member: any) => {
        const activeCount = demands?.filter((d: any) =>
            d.assigned_to === member.id && d.status !== 'finalizado'
        ).length || 0;

        return {
            ...member,
            active_demands_count: activeCount
        };
    }) || [];

    return (
        <CoordClientPage
            currentUser={profile}
            initialDemands={demands || []}
            teamMembers={memberStats}
            pendingPedCards={pendingPedCards || []}
            approvalSubmissions={approvalSubmissions || []}
        />
    );
}
