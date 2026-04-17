'use server';

import { getGoogleDriveClient } from '@/lib/google/drive';
import { validateUploadedFile } from '@/lib/upload-validation';

// Root folder names
const ROOT_FOLDER_NAME = 'VAV SISTEMA';
const COMM_FOLDER_NAME = 'COMUNICAÇÃO';
const PREDEFINED_SUBFOLDERS = ['1 ANO', '2 ANO', '3 ANO', '4 ANO', '5 ANO', 'PNAB', 'GALERIA'];

/**
 * Ensures a folder exists inside a specific parent, or creates it.
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

    const query = queryParts.join(' and ');

    const res = await drive.files.list({
        q: query,
        spaces: 'drive',
        fields: 'files(id, name)',
    });

    const files = res.data.files;
    if (files && files.length > 0) {
        return files[0].id!; // Return existing folder ID
    }

    // Folder doesn't exist, create it
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
 * Server Action: Validates and creates the Google Drive base tree for standard ONG communication.
 */
export async function syncGoogleDriveStructure() {
    try {
        const drive = await getGoogleDriveClient();

        // 1. Root: "VAV SISTEMA"
        const rootId = await ensureFolder(drive, ROOT_FOLDER_NAME);

        // 2. Main Module Folder: "COMUNICAÇÃO"
        const commId = await ensureFolder(drive, COMM_FOLDER_NAME, rootId);

        // 3. Ensure subfolders inside "COMUNICAÇÃO"
        const folderIds: Record<string, string> = {};
        for (const sub of PREDEFINED_SUBFOLDERS) {
            const id = await ensureFolder(drive, sub, commId);
            folderIds[sub] = id;
        }

        return {
            success: true,
            data: {
                rootId,
                commId,
                folders: folderIds,
                url: `https://drive.google.com/drive/folders/${commId}`
            }
        };
    } catch (error: any) {
        console.error('[Google Drive Sync Error]', error);
        return { success: false, error: 'Falha ao sincronizar estrutura do Google Drive ou token revogado.' };
    }
}

/**
 * Lists files and folders inside a specific Google Drive folder.
 */
export async function listGoogleDriveFiles(folderId: string) {
    try {
        const drive = await getGoogleDriveClient();
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name, mimeType, webViewLink, webContentLink, iconLink, thumbnailLink, createdTime, size)',
            orderBy: 'folder, name'
        });

        return { success: true, files: res.data.files || [] };
    } catch (error: any) {
        console.error('[Drive List Error]', error);
        return { success: false, error: 'Erro ao listar arquivos do Google Drive.' };
    }
}

/**
 * Creates a new subfolder in a given Google Drive parent folder.
 */
export async function createGoogleDriveFolder(folderName: string, parentId: string) {
    try {
        const drive = await getGoogleDriveClient();
        const id = await ensureFolder(drive, folderName, parentId);
        return { success: true, folderId: id };
    } catch (error: any) {
        console.error('[Drive Create Folder Error]', error);
        return { success: false, error: 'Erro ao criar pasta no Google Drive.' };
    }
}

/**
 * Uploads a file to a specific Google Drive folder using FormData.
 */
export async function uploadGoogleDriveFile(formData: FormData, parentId: string) {
    try {
        const file = formData.get('file') as File;
        if (!file) throw new Error('No file provided');

        const validation = validateUploadedFile(file);
        if (!validation.ok) {
            return { success: false, error: validation.error };
        }

        const drive = await getGoogleDriveClient();

        // Convert File to an ArrayBuffer, then to a Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convert Buffer to a ReadableStream setup compatible with googleapis
        const stream = require('stream');
        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);

        const response = await drive.files.create({
            requestBody: {
                name: file.name,
                parents: [parentId],
            },
            media: {
                mimeType: file.type,
                body: bufferStream,
            },
            fields: 'id, name, webViewLink'
        });

        return { success: true, file: response.data };
    } catch (error: any) {
        console.error('[Drive Upload Error]', error);
        return { success: false, error: 'Erro ao fazer upload para o Google Drive.' };
    }
}

/**
 * Automates the specific task of uploading a Gallery Post media to the correct
 * Google Drive subfolder (GALERIA/POSTS, GALERIA/REELS, GALERIA/STORIES) as a backup.
 */
export async function backupGaleriaMediaToDrive(formData: FormData, mediaType: string) {
    try {
        const drive = await getGoogleDriveClient();

        // 1. Navigate to GALERIA folder
        const rootId = await ensureFolder(drive, ROOT_FOLDER_NAME);
        const commId = await ensureFolder(drive, COMM_FOLDER_NAME, rootId);
        const galeriaId = await ensureFolder(drive, 'GALERIA', commId);

        // 2. Select specific subfolder based on media type
        const typeMap: Record<string, string> = {
            post: 'POSTS',
            reel: 'REELS',
            story: 'STORIES'
        };
        const targetFolderName = typeMap[mediaType] || 'OUTROS';

        const targetFolderId = await ensureFolder(drive, targetFolderName, galeriaId);

        // 3. Perform upload directly into the target folder
        const uploadRes = await uploadGoogleDriveFile(formData, targetFolderId);

        return uploadRes;
    } catch (error: any) {
        console.error('[Galeria Drive Backup Error]', error);
        return { success: false, error: 'Erro ao fazer backup para o Google Drive.' };
    }
}

/**
 * Deletes one or more files/folders from Google Drive.
 */
export async function deleteGoogleDriveFiles(fileIds: string[]) {
    try {
        const drive = await getGoogleDriveClient();

        // Google Drive API doesn't have a single bulk delete endpoint natively in the v3 standard client without batching,
        // so we'll delete them sequentially or in parallel using Promise.all.
        const deletePromises = fileIds.map(id =>
            drive.files.delete({ fileId: id })
        );

        await Promise.all(deletePromises);

        return { success: true };
    } catch (error: any) {
        console.error('[Drive Delete Error]', error);
        return { success: false, error: 'Erro ao excluir arquivos/pastas. A permissão pode ter sido negada.' };
    }
}
