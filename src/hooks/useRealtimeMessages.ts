'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Message } from '@/types/chat';

export function useRealtimeMessages(roomId: string, initialMessages: Message[]) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [supabase] = useState(() => createClient()); // Instância fixada (Evita re-renders dropando WebSocket)

    // Sincroniza a store local caso o componente pai mande um array inicial novo (ao trocar de aba/sala)
    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    const handleNewMessageRef = React.useRef(async (payload: any) => {
        const newMessageRow = payload.new;

        if (newMessageRow.room_id !== roomId) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', newMessageRow.sender_id)
            .single();

        const fullMessage: Message = {
            ...newMessageRow,
            sender: profile || { id: newMessageRow.sender_id, full_name: 'Desconhecido', avatar_url: null }
        };

        setMessages((prev) => {
            if (prev.some(m => m.id === fullMessage.id)) {
                return prev.map(m => m.id === fullMessage.id ? { ...m, ...fullMessage } : m);
            }
            return [...prev, fullMessage];
        });
    });

    // Mantém a ref sempre atualizada com as re-renderizações mais recentes do roomId
    useEffect(() => {
        handleNewMessageRef.current = async (payload: any) => {
            const newMessageRow = payload.new;
            if (newMessageRow.room_id !== roomId) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('id', newMessageRow.sender_id)
                .single();

            const fullMessage: Message = {
                ...newMessageRow,
                sender: profile || { id: newMessageRow.sender_id, full_name: 'Desconhecido', avatar_url: null }
            };

            setMessages((prev) => {
                if (prev.some(m => m.id === fullMessage.id)) {
                    return prev.map(m => m.id === fullMessage.id ? { ...m, ...fullMessage } : m);
                }
                return [...prev, fullMessage];
            });
        };
    }, [roomId, supabase]);

    useEffect(() => {
        if (!roomId) return;

        console.log(`[WebSocket] Tentando conectar na sala: room_${roomId}...`);

        // Inscreve no canal específico de Realtime para essa tabela E room específica
        const channel = supabase
            .channel(`room_${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    console.log(`[WebSocket] NOVO PAYLOAD RECEBIDO NA SALA ${roomId}:`, payload);
                    if (handleNewMessageRef.current) {
                        handleNewMessageRef.current(payload);
                    }
                }
            )
            .subscribe((status) => {
                console.log(`[WebSocket] Status da inscrição na sala ${roomId}:`, status);
            });

        return () => {
            console.log(`[WebSocket] Desconectando da sala: room_${roomId}...`);
            supabase.removeChannel(channel);
        };
    }, [roomId, supabase]);

    return { messages, setMessages };
}
