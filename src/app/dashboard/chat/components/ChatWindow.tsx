import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChatListItem, Message, FileMetadata } from '@/types/chat';
import { getRoomMessages, sendMessage } from '@/actions/chat';
import { uploadChatFile } from '@/actions/chat-drive';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { BorealSkeleton } from '@/components/ui/BorealSkeleton';
import { createClient } from '@/lib/supabase';
import { markRoomAsRead } from '@/hooks/useUnreadChat';

interface ChatWindowProps {
    room: ChatListItem;
    onBack: () => void;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

function isImageMime(mime: string): boolean {
    return mime.startsWith('image/');
}

function getFileIcon(mime: string): string {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'movie';
    if (mime.startsWith('audio/')) return 'audio_file';
    if (mime.includes('pdf')) return 'picture_as_pdf';
    if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) return 'table_chart';
    if (mime.includes('document') || mime.includes('word') || mime.includes('text')) return 'description';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'slideshow';
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar') || mime.includes('7z')) return 'folder_zip';
    return 'attach_file';
}

export default function ChatWindow({ room, onBack }: ChatWindowProps) {
    const [initialMessages, setInitialMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [myProfile, setMyProfile] = useState<{ id: string, full_name: string, avatar_url: string | null } | null>(null);
    const [myId, setMyId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial load
    useEffect(() => {
        let isMounted = true;
        const loadMessages = async () => {
            setIsLoading(true);
            const res = await getRoomMessages(room.room_id);
            if (isMounted && res.success) {
                setInitialMessages(res.data || []);
            }
            if (isMounted) setIsLoading(false);
        };
        const loadMe = async () => {
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();
            if (isMounted && data?.user) {
                setMyId(data.user.id);
                const { data: profile } = await supabase.from('profiles').select('id, full_name, avatar_url, email, role').eq('id', data.user.id).single();
                if (isMounted && profile) {
                    setMyProfile(profile as any);
                }
            }
        };

        loadMessages();
        loadMe();
        markRoomAsRead(room.room_id);
        return () => { isMounted = false; };
    }, [room.room_id]);

    const { messages, setMessages } = useRealtimeMessages(room.room_id, initialMessages);

    useEffect(() => {
        const el = messagesContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
        if (messages.length > 0) markRoomAsRead(room.room_id);
    }, [messages, room.room_id]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const content = newMessage.trim();
        if (!content || !myId) return;

        setNewMessage('');
        const optimisticId = crypto.randomUUID();
        const optimisticMessage: Message = {
            id: optimisticId,
            room_id: room.room_id,
            sender_id: myId,
            content: content,
            created_at: new Date().toISOString(),
            sender: (myProfile || { id: myId, full_name: 'Eu', avatar_url: null, email: '', role: '' }) as any
        };

        setMessages(prev => [...prev, optimisticMessage]);
        const res = await sendMessage(room.room_id, content, optimisticId);
        if (!res.success) {
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !myId) return;

        // Reset input
        e.target.value = '';

        setIsUploading(true);
        setUploadProgress(`Enviando ${file.name}...`);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await uploadChatFile(
                formData,
                room.room_id,
                room.name || 'Chat',
                room.type as 'channel' | 'dm'
            );

            if (!uploadRes.success || !uploadRes.fileMetadata) {
                throw new Error(uploadRes.message || 'Erro no upload');
            }

            // Envia uma mensagem com o arquivo anexado
            const msgContent = `ðŸ“Ž ${file.name}`;
            const optimisticId = crypto.randomUUID();
            const optimisticMessage: Message = {
                id: optimisticId,
                room_id: room.room_id,
                sender_id: myId,
                content: msgContent,
                created_at: new Date().toISOString(),
                sender: (myProfile || { id: myId, full_name: 'Eu', avatar_url: null, email: '', role: '' }) as any,
                file_metadata: uploadRes.fileMetadata,
            };

            setMessages(prev => [...prev, optimisticMessage]);
            const sendRes = await sendMessage(room.room_id, msgContent, optimisticId, uploadRes.fileMetadata as any);
            if (!sendRes.success) {
                setMessages(prev => prev.filter(m => m.id !== optimisticId));
            }
        } catch (err: any) {
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);
            setUploadProgress('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const headerTitle = room.type === 'channel' ? `# ${room.name}` : room.name;

    const renderFileAttachment = (fileMeta: FileMetadata, isMe: boolean) => {
        const isImage = isImageMime(fileMeta.mime_type);

        if (isImage) {
            // Preview via API proxy local que busca do Drive com credenciais
            const imgSrc = `/api/drive-image/${fileMeta.drive_file_id}`;
            return (
                <a href={fileMeta.web_view_link} target="_blank" rel="noopener noreferrer" className="block mt-2 group/img">
                    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 max-w-xs relative">
                        <img
                            src={imgSrc}
                            alt={fileMeta.file_name}
                            className="w-full h-auto max-h-60 object-cover bg-zinc-100 dark:bg-zinc-800"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-3xl opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-lg">open_in_new</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 truncate">{fileMeta.file_name} â€¢ {formatFileSize(fileMeta.size)}</p>
                </a>
            );
        }

        // Card de arquivo genérico
        return (
            <a
                href={fileMeta.web_view_link}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-2 flex items-center gap-3 p-3 rounded-xl border transition-all group/file
                    ${isMe
                        ? 'bg-secondary/10 dark:bg-primary/10 border-secondary/20 dark:border-primary/20 hover:bg-secondary/20 dark:hover:bg-primary/20'
                        : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/10'
                    }`}
            >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                    ${isMe ? 'bg-secondary/20 dark:bg-primary/20' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                    <span className={`material-symbols-outlined text-xl
                        ${isMe ? 'text-secondary dark:text-primary' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {getFileIcon(fileMeta.mime_type)}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isMe ? 'text-zinc-800 dark:text-white' : 'text-zinc-700 dark:text-zinc-200'}`}>
                        {fileMeta.file_name}
                    </p>
                    <p className="text-[10px] text-zinc-400">{formatFileSize(fileMeta.size)}</p>
                </div>
                <span className="material-symbols-outlined text-zinc-400 group-hover/file:text-blue-500 transition-colors text-lg shrink-0">
                    download
                </span>
            </a>
        );
    };

    return (
        <div className="flex-1 min-h-0 flex flex-col bg-transparent isolate">
            {/* Header Area */}
            <div className="h-20 shrink-0 px-6 sm:px-8 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="md:hidden w-10 h-10 -ml-2 rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors text-zinc-600 dark:text-zinc-400"
                    >
                        <span className="material-symbols-outlined">arrow_back_ios_new</span>
                    </button>

                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-black/30 border border-zinc-300 dark:border-white/10 flex items-center justify-center p-0.5 overflow-hidden">
                        {room.type === 'channel' ? (
                            <span className="material-symbols-outlined text-[24px] text-zinc-600 dark:text-zinc-400">
                                {room.name === 'Geral' ? 'public' : 'domain'}
                            </span>
                        ) : (
                            room.other_person_avatar ? (
                                <Image src={room.other_person_avatar} alt="Avatar" width={48} height={48} className="w-full h-full object-cover rounded-[14px]" />
                            ) : (
                                <span className="material-symbols-outlined text-[24px] text-zinc-500">person</span>
                            )
                        )}
                    </div>

                    <div className="flex flex-col max-w-xs sm:max-w-md">
                        <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white truncate" title={headerTitle || ''}>
                            {headerTitle}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
                            <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-500">Ao Vivo</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="w-10 h-10 rounded-full text-zinc-500 hover:text-secondary dark:hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center transition-all group">
                        <span className="material-symbols-outlined group-hover:scale-110">search</span>
                    </button>
                    <button className="w-10 h-10 rounded-full text-zinc-500 hover:text-secondary dark:hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center transition-all group">
                        <span className="material-symbols-outlined group-hover:scale-110">info</span>
                    </button>
                </div>
            </div>

            {/* Message Feed */}
            <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 sm:px-8 py-6 flex flex-col gap-6 custom-scrollbar scroll-smooth">
                {isLoading ? (
                    <div className="flex flex-col gap-4 w-full h-full justify-end pb-8">
                        <div className="flex gap-3 items-end self-start w-full max-w-sm opacity-60">
                            <BorealSkeleton className="w-8 h-8 rounded-full shrink-0" />
                            <BorealSkeleton className="h-16 w-full rounded-2xl rounded-bl-sm" />
                        </div>
                        <div className="flex gap-3 items-end self-end flex-row-reverse w-full max-w-xs opacity-80 mt-2">
                            <BorealSkeleton className="h-12 w-full rounded-2xl rounded-br-sm" />
                        </div>
                        <div className="flex gap-3 items-end self-start w-full max-w-md opacity-40 mt-2">
                            <BorealSkeleton className="w-8 h-8 rounded-full shrink-0" />
                            <BorealSkeleton className="h-20 w-full rounded-2xl rounded-bl-sm" />
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="m-auto flex flex-col items-center justify-center text-center opacity-60">
                        <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-5xl text-zinc-400">forum</span>
                        </div>
                        <h4 className="font-bold text-zinc-700 dark:text-zinc-300">Sala Vazia</h4>
                        <p className="text-sm text-zinc-500 max-w-xs mt-1">Ninguém enviou mensagens aqui ainda. Seja o primeiro a quebrar o gelo!</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((msg, index) => {
                            const isMe = myId ? msg.sender_id === myId : false;
                            const senderName = msg.sender?.full_name?.split(' ')[0] || 'Desconhecido';
                            const formattedTime = new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            const fileMeta = msg.file_metadata;

                            return (
                                <motion.div
                                    key={msg.id || index}
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
                                    className={`flex items-end gap-3 w-full max-w-[85%] sm:max-w-2xl 
                                        ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-black/50 shrink-0 border border-zinc-300 dark:border-white/10 overflow-hidden hidden sm:block">
                                        {msg.sender?.avatar_url ? (
                                            <Image src={msg.sender.avatar_url} alt={senderName} width={32} height={32} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">
                                                {senderName.charAt(0)}
                                            </span>
                                        )}
                                    </div>

                                    <div className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">{senderName}</span>
                                            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">{formattedTime}</span>
                                        </div>
                                        <div
                                            className={`px-5 py-3.5 rounded-2xl shadow-sm text-[15px] max-w-full break-words leading-relaxed backdrop-blur-md
                                            ${isMe
                                                    ? 'bg-secondary/20 dark:bg-primary/20 text-zinc-900 border border-secondary/30 dark:border-primary/30 rounded-br-sm'
                                                    : 'bg-white dark:bg-white/10 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-transparent rounded-bl-sm'}`}
                                        >
                                            {/* Texto da mensagem (oculta emoji se tem arquivo) */}
                                            {fileMeta ? (
                                                <span className="text-sm text-zinc-500 dark:text-zinc-400">{msg.content}</span>
                                            ) : (
                                                msg.content
                                            )}

                                            {/* Renderização do arquivo */}
                                            {fileMeta && renderFileAttachment(fileMeta, isMe)}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}

            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-500/10 border-t border-blue-200 dark:border-blue-500/20 flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium truncate">{uploadProgress}</span>
                </div>
            )}

            {/* Input Composer Area */}
            <div className="flex-shrink-0 px-3 pt-2 pb-2 md:pb-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-t border-zinc-200 dark:border-white/10"
                style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
            >
                <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2 bg-white dark:bg-black/40 rounded-2xl px-2 py-1.5 border border-zinc-200 dark:border-white/10 shadow-inner focus-within:border-secondary/50 dark:focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-secondary/20 dark:focus-within:ring-primary/20 transition-all"
                >
                    {/* Botão de Anexar Arquivo */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-8 h-8 flex-shrink-0 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors disabled:opacity-50"
                        title="Anexar arquivo"
                    >
                        <span className="material-symbols-outlined text-lg">{isUploading ? 'hourglass_top' : 'attach_file'}</span>
                    </button>

                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Enviar mensagem em ${headerTitle}...`}
                        className="flex-1 bg-transparent border-none resize-none py-2 px-1 text-sm outline-none text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 scrollbar-hide max-h-24"
                        rows={1}
                        style={{ height: '36px' }}
                    />

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="w-8 h-8 flex-shrink-0 rounded-full bg-secondary dark:bg-primary text-white dark:text-zinc-900 flex items-center justify-center shadow-md shadow-secondary/30 dark:shadow-primary/30 disabled:opacity-50 disabled:grayscale transition-all hover:brightness-110"
                    >
                        <span className="material-symbols-outlined text-lg -ml-0.5">send</span>
                    </motion.button>
                </form>
            </div>
        </div>
    );
}

