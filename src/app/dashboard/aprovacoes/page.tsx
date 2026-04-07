import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getApprovalSubmissions } from '@/actions/approvals';
import AprovacoesClient from '@/modules/aprovacoes/components/AprovacoesClient';

const COORD_ROLES = ['Presidência', 'Direção', 'Coordenadora ADM', 'Coordenação de Pedagogia'];

export default async function AprovacoesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const canReview = COORD_ROLES.includes(profile?.role ?? '');
    const submissions = await getApprovalSubmissions();

    return (
        <AprovacoesClient
            initialSubmissions={submissions}
            canReview={canReview}
        />
    );
}
