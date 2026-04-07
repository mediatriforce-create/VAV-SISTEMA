import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getMuralPosts } from '@/actions/mural';
import MuralClient from '@/modules/mural/components/MuralClient';

const COORD_ROLES = ['Presidência', 'Direção', 'Coordenadora ADM', 'Coordenação de Pedagogia'];
const LEADERSHIP_ROLES = ['Presidência', 'Direção'];

export default async function MuralPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const role = profile?.role ?? '';
    const canPost = COORD_ROLES.includes(role);
    const isLeadership = LEADERSHIP_ROLES.includes(role);

    const posts = await getMuralPosts();

    return (
        <MuralClient
            initialPosts={posts}
            canPost={canPost}
            currentUserId={user.id}
            isLeadership={isLeadership}
        />
    );
}
