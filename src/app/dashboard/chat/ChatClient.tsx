'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChatListItem, Profile } from '@/types/chat';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { useUnreadChat, UnreadRoom } from '@/hooks/useUnreadChat';

interface ChatClientProps {
    initialRooms: ChatListItem[];
}

export default function ChatClient({ initialRooms }: ChatClientProps) {
    const [rooms, setRooms] = useState<ChatListItem[]>(initialRooms);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const { unreadRooms } = useUnreadChat();

    const selectedRoom = rooms.find(r => r.room_id === selectedRoomId);

    const handleDMCreated = useCallback((roomId: string, otherUser: Profile) => {
        const exists = rooms.some(r => r.room_id === roomId);
        if (!exists) {
            setRooms(prev => [...prev, {
                room_id: roomId,
                type: 'dm',
                name: otherUser.full_name,
                other_person_avatar: otherUser.avatar_url,
            }]);
        }
    }, [rooms]);

    const getRoomName = (roomId: string) => {
        const room = rooms.find(r => r.room_id === roomId);
        if (!room) return 'Chat';
        return room.type === 'channel' ? `# ${room.name}` : room.name || 'Chat';
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'agora';
        if (minutes < 60) return `${minutes}min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="w-full h-full flex-1 min-h-0 flex gap-4 md:gap-6">

            {/* Sidebar */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`w-full md:w-80 lg:w-96 shrink-0 flex flex-col bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] overflow-hidden
                    ${selectedRoomId ? 'hidden md:flex' : 'flex'}`
                }
            >
                <Sidebar
                    rooms={rooms}
                    selectedRoomId={selectedRoomId}
                    onSelectRoom={setSelectedRoomId}
                    onDMCreated={handleDMCreated}
                    unreadRoomIds={unreadRooms.map(r => r.room_id)}
                />
            </motion.div>

            {/* Main Chat Area */}
            <div
                className={`flex-1 min-w-0 flex flex-col bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] overflow-hidden relative
                    ${!selectedRoomId ? 'hidden md:flex' : 'flex'}`
                }
            >
                {selectedRoom ? (
                    <ChatWindow
                        key={selectedRoom.room_id}
                        room={selectedRoom}
                        onBack={() => setSelectedRoomId(null)}
                    />
                ) : unreadRooms.length > 0 ? (
                    /* Estado com mensagens não lidas */
                    <div className="w-full h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-200 dark:border-red-500/20">
                                <span className="material-symbols-outlined text-red-500 text-xl">mark_email_unread</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Mensagens não lidas</h3>
                                <p className="text-xs text-zinc-500">{unreadRooms.length} conversa{unreadRooms.length > 1 ? 's' : ''} com novas mensagens</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            {unreadRooms.map((ur) => (
                                <button
                                    key={ur.room_id}
                                    onClick={() => setSelectedRoomId(ur.room_id)}
                                    className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all text-left group"
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-zinc-500 dark:text-zinc-400 text-lg">
                                                {rooms.find(r => r.room_id === ur.room_id)?.type === 'channel' ? 'tag' : 'person'}
                                            </span>
                                        </div>
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse"></span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {getRoomName(ur.room_id)}
                                            </h4>
                                            <span className="text-[10px] text-zinc-400 shrink-0">{formatTime(ur.created_at)}</span>
                                        </div>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                                            <strong className="text-zinc-700 dark:text-zinc-300">{ur.sender_name}:</strong> {ur.last_message}
                                        </p>
                                    </div>
                                    <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600 text-sm self-center group-hover:text-blue-500 transition-colors shrink-0">
                                        chevron_right
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Estado vazio â€” todas lidas */
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-6 border border-zinc-200 dark:border-white/10 shadow-inner">
                            <span className="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-600">forum</span>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Plataforma de Comunicação VAV</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 max-w-sm">
                            Selecione um canal lateral ou inicie uma conversa privada para começar a interagir em tempo real com sua equipe.
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
}

