'use server';

import { createClient } from '@/lib/supabase/server';
import { ChatListItem, Room, Profile, Message } from '@/types/chat';

export async function getUserChatRooms(): Promise<{ success: boolean; data?: ChatListItem[]; message?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return { success: false, message: 'Não autorizado.' };
        }

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

        // 1. Buscar os canais globais (O RLS Postgres cuidará do bloqueio e permissão automaticamente)
        const { data: channels, error: channelsError } = await supabase
            .from('rooms')
            .select('*')
            .eq('type', 'channel')
            .order('name');

        // 2. Buscar as DMs que eu sou membro (via room_participants)
        const { data: dms, error: dmsError } = await supabase
            .from('room_participants')
            .select(`
                room_id,
                rooms (*),
                profiles:profile_id (*)
            `)
            .eq('profile_id', user.id);

        if (channelsError || dmsError) {
            throw new Error('Erro ao buscar as conversas. Verifique sua conexão.');
        }

        // Consolida a lista de Rooms
        const chatList: ChatListItem[] = [];

        for (const channel of (channels || [])) {
            chatList.push({
                room_id: channel.id,
                type: 'channel',
                name: channel.name,
            });
        }

        // Para DMs precisamos do detalhe de QUEM é a outra pessoa
        for (const rp of (dms || [])) {
            // Se fosse uma lista com vários, precisaríamos cruzar quem é a ponta de lá, mas como é só a minha entrada, busco a outra ponta
            const { data: otherParticipant } = await supabase
                .from('room_participants')
                .select(`
                    profiles (id, full_name, avatar_url)
                `)
                .eq('room_id', rp.room_id)
                .neq('profile_id', user.id)
                .single();

            const otherUser = otherParticipant?.profiles as unknown as Profile;

            chatList.push({
                room_id: rp.room_id,
                type: 'dm',
                name: otherUser?.full_name || 'Desconhecido',
                other_person_avatar: otherUser?.avatar_url,
            });
        }

        return { success: true, data: chatList };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// ----------------------------------------------------
// Buscar Histórico de Mensagens de uma Sala Específica
// ----------------------------------------------------
export async function getRoomMessages(roomId: string): Promise<{ success: boolean; data?: Message[]; message?: string }> {
    try {
        const supabase = await createClient();

        // RLS garante que isso só retorna resultados se o auth() for permitido na room_id
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id (
                    id,
                    full_name,
                    avatar_url
                )
            `)
            .eq('room_id', roomId)
            .order('created_at', { ascending: true }); // do Mais antigo ao mais novo

        if (error) throw error;

        return { success: true, data: messages as Message[] };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// ----------------------------------------------------
// Enviar uma nova Mensagem (Insert) com Optimistic ID
// ----------------------------------------------------
export async function sendMessage(
    roomId: string,
    content: string,
    optimisticId?: string,
    file_metadata?: Record<string, any> | null
): Promise<{ success: boolean; message?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Acesso negado.');

        const insertData: any = {
            ...(optimisticId ? { id: optimisticId } : {}),
            room_id: roomId,
            sender_id: user.id,
            content: content.trim(),
        };

        if (file_metadata) {
            insertData.file_metadata = file_metadata;
        }

        const { error } = await supabase
            .from('messages')
            .insert(insertData);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// ----------------------------------------------------
// Buscar usuários disponíveis para iniciar DM
// ----------------------------------------------------
export async function getAvailableUsers(): Promise<{ success: boolean; data?: Profile[]; message?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: 'Não autorizado.' };

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, avatar_url')
            .neq('id', user.id)
            .order('full_name');

        if (error) throw error;
        return { success: true, data: data as Profile[] };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// ----------------------------------------------------
// Iniciar ou recuperar uma DM existente entre dois usuários
// ----------------------------------------------------
export async function startOrGetDM(otherUserId: string): Promise<{ success: boolean; roomId?: string; message?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: 'Não autorizado.' };

        // 1. Procura uma DM existente entre os dois usuários
        const { data: myRooms } = await supabase
            .from('room_participants')
            .select('room_id')
            .eq('profile_id', user.id);

        const myRoomIds = (myRooms || []).map((r: any) => r.room_id);

        if (myRoomIds.length > 0) {
            // Verifica se o outro usuário participa de alguma dessas rooms que seja DM
            const { data: sharedRooms } = await supabase
                .from('room_participants')
                .select('room_id, rooms!inner(type)')
                .eq('profile_id', otherUserId)
                .in('room_id', myRoomIds);

            const dmRoom = sharedRooms?.find((r: any) => r.rooms?.type === 'dm');
            if (dmRoom) {
                return { success: true, roomId: dmRoom.room_id };
            }
        }

        // 2. Não existe — cria nova DM room
        const { data: newRoom, error: roomError } = await supabase
            .from('rooms')
            .insert({ type: 'dm' as any, name: null })
            .select('id')
            .single();

        if (roomError || !newRoom) throw roomError || new Error('Erro ao criar sala.');

        // 3. Insere os dois participantes
        const { error: partError } = await supabase
            .from('room_participants')
            .insert([
                { room_id: newRoom.id, profile_id: user.id },
                { room_id: newRoom.id, profile_id: otherUserId },
            ]);

        if (partError) throw partError;

        return { success: true, roomId: newRoom.id };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
