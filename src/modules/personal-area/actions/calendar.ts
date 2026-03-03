'use server';

import { createClient } from '@/lib/supabase/server';
import { CalendarEvent, StandardResponse } from '../types/v2';

export async function createPersonalEvent(
    title: string,
    eventDate: string,
    description?: string
): Promise<StandardResponse<CalendarEvent>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Acesso negado.');

        if (!title.trim() || !eventDate) {
            throw new Error('Título e Data são obrigatórios.');
        }

        const { data, error } = await supabase
            .from('personal_calendar_events')
            .insert({
                user_id: user.id,
                title: title.trim(),
                description: description?.trim() || null,
                event_date: eventDate
            })
            .select()
            .single();

        if (error) throw new Error(`Falha ao registrar evento: ${error.message}`);

        return { success: true, data };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function getUserEvents(year: number, month: number): Promise<StandardResponse<CalendarEvent[]>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Acesso negado.');

        // Construindo Range de Filtro de Datas para não pedir o ano inteiro de uma vez
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

        const { data, error } = await supabase
            .from('personal_calendar_events')
            .select('*')
            .gte('event_date', startDate)
            .lte('event_date', endDate)
            .order('event_date', { ascending: true });

        if (error) throw error;

        return { success: true, data: data as CalendarEvent[] };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function deletePersonalEvent(id: string): Promise<StandardResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Acesso negado.');

        // RLS impede matematicamente que apague evento alheio
        const { error } = await supabase
            .from('personal_calendar_events')
            .delete()
            .match({ id, user_id: user.id });

        if (error) throw new Error(`Falha ao remover evento: ${error.message}`);

        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
