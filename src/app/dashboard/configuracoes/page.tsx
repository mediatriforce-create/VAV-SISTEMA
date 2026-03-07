import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TeamManagement from '@/modules/settings/components/TeamManagement';
import { getUsers } from '@/actions/users';

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
    const isAllowedTeamManagement = ['Coord. Geral', 'Presidente', 'Dir. Financeiro', 'Administrador'].includes(profile.role);

    // Busca os usuarios so se tiver permissao
    const usersResult = isAllowedTeamManagement ? await getUsers() : { success: false, data: [] };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-200 dark:border-white/10 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Configurações</h1>
                    <p className="text-zinc-500">Ajustes do sistema e preferências do seu perfil.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

                {/* Lateral Menu / Profile summary */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-zinc-200/60 dark:border-white/10 p-5 shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-md">
                            {profile.full_name.charAt(0)}
                        </div>
                        <h3 className="text-center font-bold text-zinc-900 dark:text-white">{profile.full_name}</h3>
                        <p className="text-center text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mt-1 bg-indigo-50 dark:bg-indigo-500/10 py-1 rounded-full mx-auto w-fit px-3">
                            {profile.role}
                        </p>
                    </div>

                    <nav className="flex flex-col gap-1">
                        <button className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold transition-colors">
                            <span className="material-symbols-outlined text-lg">group</span>
                            Gestão de Equipe
                        </button>
                        <button className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-not-allowed opacity-50">
                            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                            Preferências <span className="text-[10px] ml-auto uppercase bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">Em breve</span>
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    {isAllowedTeamManagement ? (
                        <TeamManagement initialUsers={usersResult.data || []} />
                    ) : (
                        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-zinc-200/60 dark:border-white/10 p-8 text-center flex flex-col items-center justify-center shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
                                <span className="material-symbols-outlined text-3xl">lock</span>
                            </div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Acesso Restrito</h2>
                            <p className="text-zinc-500 max-w-sm">
                                Apenas Coordenadores e a Diretoria possuem acesso à aba de gestão de pessoas e mudança de cargos. Em breve, suas preferências visuais estarão disponíveis por aqui.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
