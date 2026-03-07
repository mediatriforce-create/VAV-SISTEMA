import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUsers } from '@/actions/users';
import SettingsClient from '@/modules/settings/components/SettingsClient';

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

    if (!profile) redirect('/login');

    // Verificar se tem permissão de Admin para ver a aba da equipe
    const isAllowedTeamManagement = ['Presidência', 'Direção'].includes(profile.role);

    // Busca os usuarios so se tiver permissao
    const usersResult = isAllowedTeamManagement ? await getUsers() : { success: false, data: [] };

    return (
        <SettingsClient
            profile={profile}
            isAllowedTeamManagement={isAllowedTeamManagement}
            initialUsers={usersResult.data || []}
        />
    );
}
