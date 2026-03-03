import { getUserChatRooms } from '@/actions/chat';
import ChatClient from './ChatClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Mensagens | Central Viva a Vida',
    description: 'Comunicação interna em tempo real',
};

export default async function ChatPage() {
    // Busca no servidor (antes de renderizar a página) as salas que este usuário tem acesso
    const roomsResponse = await getUserChatRooms();
    const initialRooms = roomsResponse.success ? (roomsResponse.data || []) : [];

    return (
        <div className="w-full h-full flex-1 min-h-0 relative overflow-hidden flex flex-col">
            {/* Ambient Background Glows para a vibe Glassmorphism Premium */}
            <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-secondary/10 dark:bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10 translate-x-1/3"></div>
            <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-[120px] pointer-events-none -z-10 -translate-x-1/3"></div>

            <div className="w-full h-full flex-1 min-h-0 flex flex-col max-w-7xl mx-auto">
                <ChatClient initialRooms={initialRooms} />
            </div>
        </div>
    );
}
