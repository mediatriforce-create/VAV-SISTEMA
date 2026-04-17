export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
    iconLink?: string;
    thumbnailLink?: string;
    createdTime?: string;
    size?: string;
}

export interface Breadcrumb {
    id: string;
    name: string;
}

export interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    fileId: string | null;
}

export const FOLDER_MIME = 'application/vnd.google-apps.folder';

export function isFolder(file: DriveFile): boolean {
    return file.mimeType === FOLDER_MIME;
}
