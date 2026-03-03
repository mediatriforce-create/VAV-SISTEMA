export type RoomType = 'channel' | 'dm';

export interface Room {
    id: string;
    type: RoomType;
    name: string | null; // Nomes fixos para canais ('Comunicação', 'Diretoria'). Null para DMs
    created_at: string;
}

export interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: string;
    avatar_url: string | null;
}

export interface RoomParticipant {
    room_id: string;
    profile_id: string;
    joined_at: string;
    profile?: Profile; // Para queries com join implícito
}

export interface Message {
    id: string;
    room_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    sender?: Profile;
    file_metadata?: FileMetadata | null;
}

export interface FileMetadata {
    drive_file_id: string;
    file_name: string;
    mime_type: string;
    size: number;
    web_view_link: string;
    thumbnail_link?: string;
}

// Representa a visualização condensada que o Sidebar usa para listar os Chats
export interface ChatListItem {
    room_id: string;
    type: RoomType;
    name: string | null; // Nome do canal (ex: Geral) ou nome da pessoa na DM (ex: João Silva)
    other_person_avatar?: string | null; // Se for DM, trazemos o avatar da outra ponta
    last_message?: string;
    last_message_time?: string;
}
