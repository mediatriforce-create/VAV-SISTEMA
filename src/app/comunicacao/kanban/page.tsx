import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import KanbanBoard from '@/modules/comunicacao/components/KanbanBoard';
import { PERMISSIONS } from '@/lib/permissions';

export default async function KanbanPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Check permissions
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile) redirect('/login');

    const allowedModules = PERMISSIONS[profile.role as keyof typeof PERMISSIONS];
    if (!allowedModules?.includes('comunicacao')) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-slate-800">Acesso Negado</h2>
                <p className="text-slate-500">Você não tem permissão para acessar este módulo.</p>
            </div>
        );
    }

    // Fetch demands for "comunicacao" sector
    const { data: demands } = await supabase
        .from('demands')
        .select(`
      *,
      assignee:assigned_to(full_name, avatar_url),
      creator:created_by(full_name, avatar_url)
    `)
        .eq('sector', 'comunicacao')
        .order('created_at', { ascending: false });

    return (
        <div className="h-full">
            <KanbanBoard initialDemands={demands || []} />
        </div>
    );
}
