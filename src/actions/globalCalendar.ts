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
    is_meeting?: boolean;
    start_time?: string;
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

        // 1. Busca eventos globais criados manualmente
        const { data: globalData, error: globalError } = await supabase
            .from('global_calendar_events')
            .select(`*`)
            .gte('event_date', startDate.split('T')[0])
            .lte('event_date', endDate.split('T')[0]);

        if (globalError) {
            console.error("Global events query error: ", globalError);
        }

        // 2. Busca reuniões da aba de Reuniões
        const { data: meetingsData, error: meetingsError } = await supabase
            .from('meetings')
            .select(`
                id,
                title,
                description,
                date,
                start_time,
                meet_link,
                created_by,
                created_at
            `)
            .gte('date', startDate.split('T')[0])
            .lte('date', endDate.split('T')[0]);

        if (meetingsError) {
            console.error("Meetings query error: ", meetingsError);
        }

        // Formata os dados
        const formattedGlobal: GlobalEvent[] = (globalData || []).map((ev: any) => ({
            ...ev,
            coordinator_name: 'Líder VAV'
        }));

        const formattedMeetings: GlobalEvent[] = (meetingsData || []).map((m: any) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            event_date: m.date,
            image_url: null,
            link_url: m.meet_link, // mantido para info modal mas UI lidará via aba
            created_by: m.created_by,
            created_at: m.created_at,
            coordinator_name: 'Equipe VAV', // Fixed fallback
            is_meeting: true,
            start_time: m.start_time
        }));

        const allEvents = [...formattedGlobal, ...formattedMeetings].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

        return { success: true, data: allEvents };
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
        const imageFile = formData.get('image_file') as File | null;

        if (!title?.trim() || !event_date) {
            throw new Error('Título e Data são obrigatórios.');
        }

        let finalImageUrl: string | null = null;

        if (imageFile && imageFile.size > 0) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `global_calendar/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('communication_media')
                .upload(filePath, imageFile);

            if (uploadError) {
                console.error('Upload falhou', uploadError);
                throw new Error('Falha ao subir a imagem para o storage.');
            }

            const { data: { publicUrl } } = supabase.storage
                .from('communication_media')
                .getPublicUrl(filePath);

            finalImageUrl = publicUrl;
        }

        const { data, error } = await supabase
            .from('global_calendar_events')
            .insert({
                title: title.trim(),
                description: description?.trim() || null,
                event_date,
                image_url: finalImageUrl,
                link_url: null, // removido conforme request
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
