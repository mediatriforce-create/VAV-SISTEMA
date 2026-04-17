import {
    Folder,
    File as FileIcon,
    Image as ImageIcon,
    Video as VideoIcon,
    FileText,
} from 'lucide-react';
import { DriveFile, isFolder } from './types';

export function FileIconForDrive({ file }: { file: DriveFile }) {
    if (isFolder(file)) {
        return <Folder className="text-blue-500 fill-blue-100" size={40} />;
    }
    if (file.mimeType.includes('image')) {
        if (file.thumbnailLink) {
            const highResUrl = file.thumbnailLink.replace('=s220', '=s400');
            // eslint-disable-next-line @next/next/no-img-element
            return (
                <img
                    src={highResUrl}
                    alt={file.name}
                    className="w-full h-full object-cover rounded shadow-sm opacity-90 group-hover:opacity-100 transition-opacity"
                />
            );
        }
        return <ImageIcon className="text-pink-500" size={40} />;
    }
    if (file.mimeType.includes('video')) {
        return <VideoIcon className="text-purple-500" size={40} />;
    }
    if (file.mimeType.includes('pdf') || file.mimeType.includes('document')) {
        return <FileText className="text-orange-500" size={40} />;
    }
    return <FileIcon className="text-slate-400" size={40} />;
}
