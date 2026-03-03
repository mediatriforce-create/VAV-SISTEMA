import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PERMISSIONS } from '@/lib/permissions';

export default async function SettingsPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile) redirect('/login');

    // Check if role is allowed to configure (communication, coord, admin)
    const isAllowed = ['Comunicação', 'Coord. Geral', 'Presidente', 'Dir. Financeiro', 'Administrador'].includes(profile.role);

    if (!isAllowed) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-slate-800">Acesso Restrito</h2>
                <p className="text-slate-500">Você não tem permissão para acessar as configurações.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Configurações do Sistema</h1>

            {/* User Profile / Other Settings could go here */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <span className="material-icons text-slate-500">person</span>
                            Perfil e Preferências
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-xl">
                            Gerencie suas informações de conta e preferências visuais (Em breve).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
