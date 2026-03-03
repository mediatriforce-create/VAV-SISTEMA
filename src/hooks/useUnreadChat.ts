'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

const STORAGE_KEY = 'vav_chat_last_seen';

function getLastSeen(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
}

function setLastSeenForRoom(roomId: string) {
    const data = getLastSeen();
    data[roomId] = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function markRoomAsRead(roomId: string) {
    setLastSeenForRoom(roomId);
    window.dispatchEvent(new CustomEvent('vav_chat_read', { detail: { roomId } }));
}

export interface UnreadRoom {
    room_id: string;
    last_message: string;
    sender_name: string;
    created_at: string;
}

export function useUnreadChat() {
    const [hasUnread, setHasUnread] = useState(false);
    const [unreadRooms, setUnreadRooms] = useState<UnreadRoom[]>([]);
    const supabase = createClient();

    const checkUnread = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Busca as mensagens mais recentes com sender info
            const { data: latestMessages } = await supabase
                .from('messages')
                .select(`
                    id,
                    room_id,
                    content,
                    created_at,
                    sender:sender_id (
                        full_name
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (!latestMessages || latestMessages.length === 0) {
                setHasUnread(false);
                setUnreadRooms([]);
                return;
            }

            const lastSeen = getLastSeen();
            const unreadMap = new Map<string, UnreadRoom>();

            for (const msg of latestMessages) {
                const roomLastSeen = lastSeen[msg.room_id];
                const isUnread = !roomLastSeen || new Date(msg.created_at) > new Date(roomLastSeen);

                if (isUnread && !unreadMap.has(msg.room_id)) {
                    const senderData = msg.sender as any;
                    unreadMap.set(msg.room_id, {
                        room_id: msg.room_id,
                        last_message: msg.content.length > 60 ? msg.content.slice(0, 60) + '...' : msg.content,
                        sender_name: senderData?.full_name || 'Desconhecido',
                        created_at: msg.created_at,
                    });
                }
            }

            const unreadList = Array.from(unreadMap.values());
            setUnreadRooms(unreadList);
            setHasUnread(unreadList.length > 0);
        } catch {
            // Silently fail
        }
    }, [supabase]);

    useEffect(() => {
        checkUnread();

        const channel = supabase
            .channel('unread-badge')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            }, (payload: any) => {
                const newMsg = payload.new as any;
                // Nova mensagem — marca como unread imediatamente
                setHasUnread(true);
                // Re-check para pegar os detalhes completos
                checkUnread();
            })
            .subscribe();

        const handleRead = () => checkUnread();
        window.addEventListener('vav_chat_read', handleRead);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('vav_chat_read', handleRead);
        };
    }, [supabase, checkUnread]);

    return { hasUnread, unreadRooms };
}
