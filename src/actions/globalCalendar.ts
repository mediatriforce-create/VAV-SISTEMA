'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type GlobalEvent = {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    image_url: string | null;
    link_url: string | null;
    created_by: string;
    created_at: string;
    coordinator_name?: string; // resolved via join
};

export type GlobalEventResponse<T = any> = {
    success: boolean;
    data?: T;
    message?: string;
};

export async function getGlobalEvents(year: number, month: number): Promise<GlobalEventResponse<GlobalEvent[]>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Autenticação necessária.');

        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

        const { data, error } = await supabase
            .from('global_calendar_events')
            .select(`
                *,
                profiles:created_by (full_name)
            `)
            .gte('event_date', startDate)
            .lte('event_date', endDate)
            .order('event_date', { ascending: true });

        if (error) throw error;

        // Formata os dados
        const formattedData: GlobalEvent[] = data.map((ev: any) => ({
            ...ev,
            coordinator_name: ev.profiles?.full_name || 'Desconhecido'
        }));

        return { success: true, data: formattedData };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function createGlobalEvent(
    formData: FormData
): Promise<GlobalEventResponse<GlobalEvent>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Acesso negado.');

        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const event_date = formData.get('event_date') as string;
        const image_url = formData.get('image_url') as string;
        const link_url = formData.get('link_url') as string;

        if (!title?.trim() || !event_date) {
            throw new Error('Título e Data são obrigatórios.');
        }

        const { data, error } = await supabase
            .from('global_calendar_events')
            .insert({
                title: title.trim(),
                description: description?.trim() || null,
                event_date,
                image_url: image_url?.trim() || null,
                link_url: link_url?.trim() || null,
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw new Error(`Falha ao registrar evento: ${error.message} - Lembre-se, apenas Líderes da organização podem publicar no Mural.`);

        revalidatePath('/dashboard/calendario');
        return { success: true, data };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function deleteGlobalEvent(id: string): Promise<GlobalEventResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Acesso negado.');

        // RLS will fail this if user is not leadership
        const { error } = await supabase
            .from('global_calendar_events')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Falha ao remover evento: ${error.message}`);

        revalidatePath('/dashboard/calendario');
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
