'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ChatListItem, Profile } from '@/types/chat';
import { getAvailableUsers, startOrGetDM } from '@/actions/chat';

interface SidebarProps {
    rooms: ChatListItem[];
    selectedRoomId: string | null;
    onSelectRoom: (roomId: string) => void;
    onDMCreated?: (roomId: string, otherUser: Profile) => void;
    unreadRoomIds?: string[];
}

export default function Sidebar({ rooms, selectedRoomId, onSelectRoom, onDMCreated, unreadRoomIds = [] }: SidebarProps) {
    const channels = rooms.filter(r => r.type === 'channel');
    const dms = rooms.filter(r => r.type === 'dm');

    const [showUserPicker, setShowUserPicker] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [creatingDM, setCreatingDM] = useState<string | null>(null);

    const handleOpenUserPicker = async () => {
        if (showUserPicker) {
            setShowUserPicker(false);
            return;
        }
        setLoadingUsers(true);
        setShowUserPicker(true);
        const result = await getAvailableUsers();
        if (result.success && result.data) {
            setAvailableUsers(result.data);
        }
        setLoadingUsers(false);
    };

    const handleStartDM = async (otherUser: Profile) => {
        setCreatingDM(otherUser.id);
        const result = await startOrGetDM(otherUser.id);
        if (result.success && result.roomId) {
            setShowUserPicker(false);
            setSearchTerm('');
            if (onDMCreated) {
                onDMCreated(result.roomId, otherUser);
            }
            onSelectRoom(result.roomId);
        }
        setCreatingDM(null);
    };

    const filteredUsers = availableUsers.filter(u =>
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderRoomButton = (room: ChatListItem) => {
        const isSelected = selectedRoomId === room.room_id;
        const hasUnread = unreadRoomIds.includes(room.room_id) && !isSelected;

        return (
            <motion.button
                key={room.room_id}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectRoom(room.room_id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left border overflow-hidden relative group
                    ${isSelected
                        ? 'bg-zinc-100 dark:bg-white/10 border-zinc-200 dark:border-white/20 shadow-sm'
                        : 'bg-transparent border-transparent hover:border-zinc-200 dark:hover:border-white/10'
                    }`}
            >
                {isSelected && (
                    <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-secondary dark:bg-primary rounded-r-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                    />
                )}

                <div className="w-10 h-10 shrink-0 rounded-xl bg-zinc-200 dark:bg-black/40 flex items-center justify-center overflow-hidden border border-zinc-300 dark:border-white/5 relative">
                    {room.type === 'channel' ? (
                        <span className={`material-symbols-outlined text-[20px] 
                            ${isSelected ? 'text-secondary dark:text-primary animate-pulse' : 'text-zinc-500 dark:text-zinc-400'}`}>
                            {room.name === 'Geral' ? 'public' : 'domain'}
                        </span>
                    ) : (
                        room.other_person_avatar ? (
                            <Image src={room.other_person_avatar} alt="User Avatar" width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                            <span className="material-symbols-outlined text-[20px] text-zinc-500 dark:text-zinc-400">person</span>
                        )
                    )}
                </div>

                <div className="flex-1 truncate">
                    <h4 className={`text-sm tracking-tight truncate 
                        ${isSelected ? 'font-bold text-zinc-900 dark:text-white' : hasUnread ? 'font-bold text-zinc-900 dark:text-white' : 'font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>
                        {room.type === 'channel' ? `# ${room.name}` : room.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-500 truncate mt-0.5">
                        {room.type === 'channel' ? 'Canal Setorial' : 'Mensagem Direta'}
                    </p>
                </div>

                {hasUnread && (
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shrink-0 shadow-sm"></span>
                )}
            </motion.button>
        );
    };

    return (
        <div className="w-full h-full flex flex-col p-4 bg-transparent isolate">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-white/10 shrink-0">
                <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Comunicação</h2>
            </div>

            {/* Listas Scrolláveis */}
            <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden scrollbar-hide flex flex-col gap-4 scroll-smooth pr-1">

                {channels.length > 0 && (
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-2 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px]">tag</span>
                            Departamentos
                        </span>
                        {channels.map(renderRoomButton)}
                    </div>
                )}

                {/* Conversas Privadas */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px]">account_circle</span>
                            Conversas Privadas
                        </span>
                        <button
                            onClick={handleOpenUserPicker}
                            className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-white/10 hover:bg-secondary dark:hover:bg-primary hover:text-white dark:hover:text-zinc-900 text-zinc-500 dark:text-zinc-400 flex items-center justify-center transition-all"
                            title="Nova conversa"
                        >
                            <span className="material-symbols-outlined text-[14px]">{showUserPicker ? 'close' : 'add'}</span>
                        </button>
                    </div>

                    {/* User Picker (Modal inline) */}
                    {showUserPicker && (
                        <div className="mb-3 bg-zinc-50 dark:bg-black/30 rounded-xl border border-zinc-200 dark:border-white/10 p-3 flex flex-col gap-2">
                            <input
                                type="text"
                                placeholder="Buscar pessoa..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                className="w-full px-3 py-2 text-sm bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-secondary/30 dark:focus:ring-primary/30 text-zinc-900 dark:text-white placeholder-zinc-400"
                            />
                            <div className="max-h-40 overflow-y-auto custom-scrollbar flex flex-col gap-1 scrollbar-hide">
                                {loadingUsers ? (
                                    <div className="py-3 text-center">
                                        <span className="text-xs text-zinc-400">Carregando...</span>
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="py-3 text-center">
                                        <span className="text-xs text-zinc-400">Nenhum usuário encontrado.</span>
                                    </div>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <button
                                            key={u.id}
                                            onClick={() => handleStartDM(u)}
                                            disabled={creatingDM === u.id}
                                            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors text-left disabled:opacity-50"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                                                {u.avatar_url ? (
                                                    <Image src={u.avatar_url} alt={u.full_name} width={32} height={32} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{u.full_name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-zinc-800 dark:text-white truncate">{u.full_name}</p>
                                                <p className="text-[10px] text-zinc-400 truncate">{u.role}</p>
                                            </div>
                                            {creatingDM === u.id && (
                                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {dms.length > 0 ? (
                        dms.map(renderRoomButton)
                    ) : !showUserPicker && (
                        <div className="px-4 py-3 border border-dashed border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-black/20 text-center">
                            <p className="text-xs text-zinc-500 font-medium">Nenhuma mensagem direta ainda.</p>
                            <button
                                onClick={handleOpenUserPicker}
                                className="text-xs text-secondary dark:text-primary font-semibold mt-1 hover:underline"
                            >
                                Iniciar conversa
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

