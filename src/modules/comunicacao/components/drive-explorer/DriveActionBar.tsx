import {
    UploadCloud,
    FolderPlus,
    Loader2,
    Trash2,
    MousePointerSquareDashed,
} from 'lucide-react';

interface Props {
    isSelectionMode: boolean;
    selectedCount: number;
    isUploading: boolean;
    isCreatingFolder: boolean;
    isDeleting: boolean;
    onEnterSelectionMode: () => void;
    onCancelSelection: () => void;
    onCreateFolder: () => void;
    onOpenUpload: () => void;
    onDeleteSelected: () => void;
}

export function DriveActionBar({
    isSelectionMode,
    selectedCount,
    isUploading,
    isCreatingFolder,
    isDeleting,
    onEnterSelectionMode,
    onCancelSelection,
    onCreateFolder,
    onOpenUpload,
    onDeleteSelected,
}: Props) {
    return (
        <div className="flex items-center gap-3">
            {isSelectionMode ? (
                <>
                    <span className="text-sm font-medium text-slate-500 mr-2">
                        {selectedCount} selecionado(s)
                    </span>
                    <button
                        onClick={onDeleteSelected}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-lg hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Excluir
                    </button>
                    <button
                        onClick={onCancelSelection}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors shadow-sm"
                    >
                        Cancelar
                    </button>
                </>
            ) : (
                <>
                    <button
                        onClick={onEnterSelectionMode}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 border border-transparent rounded-lg hover:bg-slate-200 transition-colors shadow-sm"
                        title="Selecionar Vários"
                    >
                        <MousePointerSquareDashed size={16} />
                    </button>
                    <button
                        onClick={onCreateFolder}
                        disabled={isCreatingFolder || isUploading}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-white/10 rounded-lg hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isCreatingFolder ? <Loader2 size={16} className="animate-spin" /> : <FolderPlus size={16} />}
                        Nova Pasta
                    </button>

                    <button
                        onClick={onOpenUpload}
                        disabled={isUploading || isCreatingFolder}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <UploadCloud size={16} />
                        Fazer Upload
                    </button>
                </>
            )}
        </div>
    );
}
