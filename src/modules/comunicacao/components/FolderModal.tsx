'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Loader2, X } from 'lucide-react';

interface FolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentId: string | null;
    onSuccess: () => void;
}

export default function FolderModal({ isOpen, onClose, parentId, onSuccess }: FolderModalProps) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('communication_folders')
                .insert({
                    name,
                    parent_id: parentId
                });

            if (error) throw error;

            onSuccess();
            onClose();
            setName('');
        } catch (error) {
            console.error('Error creating folder:', error);
            alert('Erro ao criar pasta.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-2xl w-full max-w-sm flex flex-col max-h-[85vh]">
                <div className="shrink-0 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Nova Pasta</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Pasta</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            placeholder="Ex: Projetos 2024"
                            autoFocus
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !name}
                        className="w-full bg-primary dark:bg-amber-500 text-white dark:text-zinc-900 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Criar Pasta'}
                    </button>
                </form>
            </div>
        </div>
    );
}
