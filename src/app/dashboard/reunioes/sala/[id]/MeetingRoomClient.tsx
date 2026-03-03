'use client';

import { JitsiMeeting } from '@jitsi/react-sdk';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MeetingRoomClientProps {
    meetingTitle: string;
    meetLink: string | null;
    userName: string;
}

export default function MeetingRoomClient({ meetingTitle, meetLink, userName }: MeetingRoomClientProps) {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    if (!meetLink) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-surface-elevated/50 dark:bg-white/5 rounded-3xl border border-dashed border-zinc-200 dark:border-white/10 m-6">
                <span className="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-600 mb-4 opacity-50">link_off</span>
                <p className="text-zinc-500 font-medium text-lg">Esta reunião não possui um link de videoconferência.</p>
                <button onClick={() => router.back()} className="mt-6 text-secondary font-bold hover:underline">
                    ← Voltar
                </button>
            </div>
        );
    }

    // Jitsi URL: https://meet.ffmuc.net/vav-reuniao-492711 -> Extract path: vav-reuniao-492711
    const isJitsi = meetLink.includes('meet.jit.si') || meetLink.includes('meet.ffmuc.net');
    const roomName = isJitsi ? meetLink.split('/').pop() || 'SalaGeral' : '';

    if (!isJitsi) {
        // Se for Google Meet antigo ou Zoom, não podemos embutir diretamente por políticas de CORS (X-Frame-Options)
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-surface-elevated/50 dark:bg-white/5 rounded-3xl border border-dashed border-zinc-200 dark:border-white/10 p-8 text-center mt-6 shadow-sm">
                <span className="material-symbols-outlined text-6xl text-secondary dark:text-primary mb-4">g_translate</span>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{meetingTitle}</h2>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-8 max-w-lg">
                    Esta reunião foi gerada em uma plataforma externa (como o Google Meet) que não suporta exibição integrada.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => router.back()}
                        className="py-4 px-6 rounded-xl border border-zinc-300 dark:border-white/20 text-zinc-700 dark:text-zinc-300 font-bold hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                    >
                        Voltar
                    </button>
                    <a
                        href={meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary py-4 px-8 text-lg"
                    >
                        <span className="material-symbols-outlined">exit_to_app</span>
                        Abrir Externamente
                    </a>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 w-full bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 flex relative max-h-[calc(100vh-10rem)]"
            style={{ minHeight: '600px' }}
        >
            {/* Loading Cover */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10 transition-opacity duration-500">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin mb-4"></div>
                        <p className="text-white font-medium text-lg">Conectando à videochamada...</p>
                        <p className="text-zinc-400 text-sm mt-2">Construindo sala segura {roomName}</p>
                    </div>
                </div>
            )}

            {/* Jitsi Embedded IFrame */}
            <JitsiMeeting
                domain="meet.ffmuc.net"
                roomName={roomName}
                configOverwrite={{
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    prejoinPageEnabled: true, // Importante para o usuário escolher câmera/mic antes de entrar
                }}
                interfaceConfigOverwrite={{
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                    DEFAULT_BACKGROUND: '#18181b', // zinc-900
                    DEFAULT_LOCAL_DISPLAY_NAME: userName,
                }}
                userInfo={{
                    displayName: userName,
                    email: `user-${Date.now()}@vivaavida.org`,
                }}
                onApiReady={(externalApi) => {
                    // Eventos do SDK do Jitsi
                    externalApi.addListener('videoConferenceJoined', () => {
                        setIsLoading(false);
                    });

                    // Se o usuário clicar em "Sair da Chamada" no controle inferior do vídeo
                    externalApi.addListener('videoConferenceLeft', () => {
                        router.push('/dashboard/reunioes');
                    });
                }}
                getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '100%';
                    iframeRef.style.width = '100%';
                    iframeRef.style.border = 'none';
                    iframeRef.style.background = '#18181b';

                    // Tirar o loading por timeout de segurança (caso o evento jitsi falhe por rede lenta)
                    setTimeout(() => setIsLoading(false), 5000);
                }}
            />
        </motion.div>
    );
}
