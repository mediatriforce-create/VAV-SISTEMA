'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { DemandComment } from '@/types/demands';

export async function getDemandComments(demandId: string): Promise<DemandComment[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('demand_comments')
        .select('*, author:profiles!author_id(full_name, avatar_url)')
        .eq('demand_id', demandId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as DemandComment[];
}

export async function createDemandComment(demandId: string, comment: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado.');

    const { error } = await supabase
        .from('demand_comments')
        .insert({ demand_id: demandId, author_id: user.id, comment: comment.trim() });

    if (error) throw error;
    revalidatePath('/comunicacao/kanban');
}

export async function deleteDemandComment(commentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado.');

    // Only author or leadership can delete
    const { data: commentData } = await supabase
        .from('demand_comments')
        .select('author_id')
        .eq('id', commentId)
        .single();

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isLeadership = ['Presidência', 'Direção'].includes(profile?.role ?? '');
    if (commentData?.author_id !== user.id && !isLeadership) {
        throw new Error('Sem permissão para excluir este comentário.');
    }

    const { error } = await supabase
        .from('demand_comments')
        .delete()
        .eq('id', commentId);

    if (error) throw error;
    revalidatePath('/comunicacao/kanban');
}
