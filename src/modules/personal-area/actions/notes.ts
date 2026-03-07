'use server';

import { createClient } from '@/lib/supabase/server';
import { CoordinationNote, StandardResponse } from '../types/v2';

export async function getUserNotes(): Promise<StandardResponse<CoordinationNote[]>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Acesso negado.');

        // O RLS cuidará para barrar a visualização de notas de outros
        const { data, error } = await supabase
            .from('coordination_notes')
            .select(`
                *,
                author:profiles!author_id(full_name, avatar_url)
            `)
            .eq('target_user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Limpeza do retorno para o modelo da Interface
        const formattedData: CoordinationNote[] = data.map((note: any) => ({
            id: note.id,
            target_user_id: note.target_user_id,
            author_id: note.author_id,
            content: note.content,
            created_at: note.created_at,
            author: note.author ? {
                full_name: note.author.full_name,
                avatar_url: note.author.avatar_url
            } : undefined
        }));

        return { success: true, data: formattedData };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function createCoordinationNote({
    targetUserId,
    content
}: {
    targetUserId: string;
    content: string;
}): Promise<StandardResponse<CoordinationNote>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Acesso negado.');

        const { data, error } = await supabase
            .from('coordination_notes')
            .insert({
                target_user_id: targetUserId,
                author_id: user.id,
                content
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
