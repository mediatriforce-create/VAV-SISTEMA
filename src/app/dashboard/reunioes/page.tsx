import { getMeetingsAction } from '@/actions/getMeetings';
import MeetingsList from './MeetingsList';
import type { Metadata } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
    title: 'Reuniões | Central Viva a Vida',
    description: 'Agendamento e acesso às salas do Google Meet',
};

export const dynamic = 'force-dynamic';

export default async function MeetingsPage() {
    const meetings = await getMeetingsAction();
    
    let userRole = '';
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                },
            }
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (profile) userRole = profile.role;
        }
    } catch (e) {
        console.error(e);
    }

    return <MeetingsList initialMeetings={meetings} userRole={userRole} />;
}
