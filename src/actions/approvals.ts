'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ApprovalSubmission } from '@/types/demands';

export async function getApprovalSubmissions(status?: 'pending' | 'approved' | 'rejected'): Promise<ApprovalSubmission[]> {
    const supabase = await createClient();
    let query = supabase
        .from('approval_submissions')
        .select(`
            *,
            submitter:profiles!submitted_by(full_name, avatar_url),
            demand:demands!demand_id(title, sector)
        `)
        .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ApprovalSubmission[];
}

export async function reviewSubmission(id: string, status: 'approved' | 'rejected', notes: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado.');

    // Verify coord+ permission
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const allowed = ['Presidência', 'Direção', 'Coordenadora ADM', 'Coordenação de Pedagogia'];
    if (!profile || !allowed.includes(profile.role)) {
        throw new Error('Sem permissão para revisar aprovações.');
    }

    const { error } = await supabase
        .from('approval_submissions')
        .update({
            status,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            review_notes: notes.trim() || null,
        })
        .eq('id', id);

    if (error) throw error;

    // If approved, move demand to finalizado; if rejected, move back to revisao
    const { data: submission } = await supabase
        .from('approval_submissions')
        .select('demand_id')
        .eq('id', id)
        .single();

    if (submission?.demand_id) {
        await supabase
            .from('demands')
            .update({ status: status === 'approved' ? 'finalizado' : 'revisao' })
            .eq('id', submission.demand_id);
    }

    revalidatePath('/dashboard/aprovacoes');
    revalidatePath('/comunicacao');
}
