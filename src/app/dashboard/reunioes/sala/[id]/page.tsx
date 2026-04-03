import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import MeetingRoomClient from './MeetingRoomClient';

export default async function MeetingRoomPage({ params }: { params: { id: string } }) {
    // Extraindo id do parametro da rota 
    // Em Next.js 15 Server Components c/ server actions, params pode vir como Promise (ou deve ser desestruturado base se assincrono)
    const { id } = await params;

    // Server-side database client fetching
    const supabase = await createClient();

    // Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) redirect('/login');

    // Buscar os dados da Reunião
    const { data: meeting, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !meeting) {
        return notFound();
    }

    // Buscar o perfil logado para passar o Nome Real do Usuário para o Jitsi
    // Tentamos pela tabela Profiles, senao pegamos o começo do email
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

    const userName = profile?.full_name || user.email?.split('@')[0] || 'Convidado Viva a Vida';

    return (
        <div className="w-full flex-1 flex flex-col pt-6 pb-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary dark:text-primary">meeting_room</span>
                        {meeting.title}
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Conectado na sala segura de videoconferência.</p>
                </div>
            </div>

            {/* Injeção Dinâmica do Jitsi pelo Cliente */}
            <MeetingRoomClient
                meetingTitle={meeting.title}
                meetLink={meeting.meet_link}
                userName={userName}
            />
        </div>
    );
}
