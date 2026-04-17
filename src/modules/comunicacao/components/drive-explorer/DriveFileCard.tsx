import { motion } from 'framer-motion';
import { CheckSquare, Square, ExternalLink } from 'lucide-react';
import { DriveFile, isFolder } from './types';
import { FileIconForDrive } from './file-icon';

interface Props {
    file: DriveFile;
    isSelected: boolean;
    isSelectionMode: boolean;
    onClick: (file: DriveFile, e: React.MouseEvent) => void;
    onContextMenu: (e: React.MouseEvent, file: DriveFile) => void;
    onToggleSelection: (id: string) => void;
}

export function DriveFileCard({
    file,
    isSelected,
    isSelectionMode,
    onClick,
    onContextMenu,
    onToggleSelection,
}: Props) {
    const folder = isFolder(file);

    return (
        <motion.div
            layoutId={file.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4, boxShadow: '0px 10px 20px rgba(0,0,0,0.05)' }}
            onClick={(e) => onClick(file, e as unknown as React.MouseEvent)}
            onContextMenu={(e) => onContextMenu(e as unknown as React.MouseEvent, file)}
            className={`group relative flex flex-col items-center p-4 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-lg shadow-black/5 rounded-2xl border ${isSelected ? 'border-primary dark:border-amber-500 bg-primary/10 dark:bg-amber-500/20 ring-2 ring-primary/30 dark:ring-amber-500/30' : 'border-white/20 dark:border-white/10 hover:border-primary/50 dark:hover:border-amber-500/50'} cursor-pointer transition-all duration-200`}
        >
            {(isSelectionMode || isSelected) && (
                <div
                    className="absolute top-2 left-2 z-10 text-primary"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelection(file.id);
                    }}
                >
                    {isSelected ? (
                        <CheckSquare size={20} className="fill-primary text-white bg-primary rounded" />
                    ) : (
                        <Square size={20} className="text-slate-300 hover:text-primary bg-white rounded" />
                    )}
                </div>
            )}

            <div className="w-16 h-16 flex items-center justify-center mb-3">
                <FileIconForDrive file={file} />
            </div>

            <div className="w-full text-center">
                <p
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate px-1"
                    title={file.name}
                >
                    {file.name}
                </p>
            </div>

            {!folder && file.webViewLink && !isSelectionMode && (
                <button
                    className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 hover:text-primary"
                    onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.webViewLink, '_blank');
                    }}
                    title="Abrir no Google Drive"
                >
                    <ExternalLink size={14} />
                </button>
            )}
        </motion.div>
    );
}
