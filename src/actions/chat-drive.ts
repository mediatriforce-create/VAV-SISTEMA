'use server';

import { getGoogleDriveClient } from '@/lib/google/drive';
import { createClient } from '@/lib/supabase/server';
import { FileMetadata } from '@/types/chat';
import { validateUploadedFile } from '@/lib/upload-validation';

const ROOT_FOLDER_NAME = 'VAV SISTEMA';
const CHATS_FOLDER_NAME = 'CHATS';

/**
 * Garante que uma pasta exista no Drive, criando se necessário.
 */
async function ensureFolder(drive: any, folderName: string, parentId?: string): Promise<string> {
    const queryParts = [
        `mimeType='application/vnd.google-apps.folder'`,
        `name='${folderName}'`,
        `trashed=false`
    ];

    if (parentId) {
        queryParts.push(`'${parentId}' in parents`);
    }

    const res = await drive.files.list({
        q: queryParts.join(' and '),
        spaces: 'drive',
        fields: 'files(id, name)',
    });

    const files = res.data.files;
    if (files && files.length > 0) {
        return files[0].id!;
    }

    const fileMetadata: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentId) {
        fileMetadata.parents = [parentId];
    }

    const created = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
    });

    return created.data.id!;
}

/**
 * Gera o nome da pasta para canais: "# Geral", "# Administração"
 */
function getChannelFolderName(roomName: string): string {
    return `# ${roomName}`;
}

/**
 * Para DMs: busca os dois participantes, extrai primeiro nome, ordena e junta com hífen.
 * Ex: "ANA-EVELIN"
 */
async function getDMFolderName(supabase: any, roomId: string): Promise<string> {
    const { data: participants } = await supabase
        .from('room_participants')
        .select('profile_id, profiles:profile_id (full_name)')
        .eq('room_id', roomId);

    if (!participants || participants.length < 2) {
        return 'DM';
    }

    const names = participants
        .map((p: any) => {
            const fullName = p.profiles?.full_name || 'Desconhecido';
            return fullName.split(' ')[0].toUpperCase(); // Pega só o primeiro nome
        })
        .sort(); // Ordem alfabética

    return names.join('-');
}

/**
 * Faz upload de um arquivo para o Google Drive na pasta do chat.
 * Estrutura: VAV SISTEMA / CHATS / [nome da conversa] / arquivo
 * - Canais: "# Geral", "# Administração"
 * - DMs: "ANA-EVELIN" (primeiro nome de cada participante, em ordem alfabética)
 */
export async function uploadChatFile(
    formData: FormData,
    roomId: string,
    roomName: string,
    roomType: 'channel' | 'dm'
): Promise<{ success: boolean; fileMetadata?: FileMetadata; message?: string }> {
    try {
        // Verificar autenticação
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: 'Não autorizado.' };

        const file = formData.get('file') as File;
        if (!file) return { success: false, message: 'Nenhum arquivo selecionado.' };

        const validation = validateUploadedFile(file);
        if (!validation.ok) return { success: false, message: validation.error };

        const drive = await getGoogleDriveClient();

        // Navegar/Criar a estrutura de pastas
        const rootId = await ensureFolder(drive, ROOT_FOLDER_NAME);
        const chatsId = await ensureFolder(drive, CHATS_FOLDER_NAME, rootId);

        // Nome da pasta depende do tipo
        const chatFolderName = roomType === 'channel'
            ? getChannelFolderName(roomName)
            : await getDMFolderName(supabase, roomId);

        const chatFolderId = await ensureFolder(drive, chatFolderName, chatsId);

        // Converter File para stream
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stream = require('stream');
        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);

        // Upload para o Google Drive
        const response = await drive.files.create({
            requestBody: {
                name: file.name,
                parents: [chatFolderId],
            },
            media: {
                mimeType: file.type,
                body: bufferStream,
            },
            fields: 'id, name, webViewLink, thumbnailLink, size, mimeType',
        });

        const driveFile = response.data;

        // Tornar o arquivo acessível via link (anyone with link can view)
        await drive.permissions.create({
            fileId: driveFile.id!,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        const fileMetadata: FileMetadata = {
            drive_file_id: driveFile.id!,
            file_name: driveFile.name || file.name,
            mime_type: driveFile.mimeType || file.type,
            size: parseInt(driveFile.size || String(file.size), 10),
            web_view_link: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
            thumbnail_link: driveFile.thumbnailLink || undefined,
        };

        return { success: true, fileMetadata };
    } catch (error: any) {
        console.error('[Chat Drive Upload Error]', error);
        return { success: false, message: 'Erro ao fazer upload do arquivo.' };
    }
}
