import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Trash2 } from 'lucide-react';
import { ContextMenuState } from './types';

interface Props {
    contextMenu: ContextMenuState;
    selectedCount: number;
    isSelectionMode: boolean;
    onClose: () => void;
    onEnterSelectionMode: () => void;
    onDelete: () => void;
}

export function DriveContextMenu({
    contextMenu,
    selectedCount,
    isSelectionMode,
    onClose,
    onEnterSelectionMode,
    onDelete,
}: Props) {
    return (
        <AnimatePresence>
            {contextMenu.visible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    className="fixed z-50 min-w-[160px] bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-slate-200 dark:border-white/10 py-1 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-2 text-sm text-slate-700"
                        onClick={() => {
                            onClose();
                            if (!isSelectionMode) onEnterSelectionMode();
                        }}
                    >
                        <CheckSquare size={16} className="text-slate-400" />
                        Selecionar Vários
                    </button>

                    <div className="h-px bg-slate-100 my-1 w-full" />

                    <button
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 text-sm font-medium"
                        onClick={() => {
                            onClose();
                            onDelete();
                        }}
                    >
                        <Trash2 size={16} />
                        Excluir ({selectedCount})
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
