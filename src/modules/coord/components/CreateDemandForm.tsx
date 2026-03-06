'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateDemandFormProps {
    onSuccess: () => void;
    onClose: () => void;
    teamMembers: { id: string; full_name: string }[];
    isOpen: boolean;
}

export default function CreateDemandForm({ onSuccess, onClose, teamMembers, isOpen }: CreateDemandFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        sector: 'comunicacao',
        assigned_to: '',
        priority: 'media',
        due_date: '',
        description: ''
    });

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from('demands').insert({
                title: formData.title,
                sector: formData.sector,
                assigned_to: formData.assigned_to || null,
                priority: formData.priority,
                due_date: formData.due_date || null,
                description: formData.description,
                status: 'a_fazer'
            });

            if (error) throw error;

            setFormData({
                title: '',
                sector: 'comunicacao',
                assigned_to: '',
                priority: 'media',
                due_date: '',
                description: ''
            });

            onSuccess();
        } catch (error) {
            console.error('Error creating demand:', error);
            alert('Erro ao criar demanda. Verifique suas permissões.');
        } finally {
            setLoading(false);
        }
    };

    const priorityConfig: Record<string, { label: string; color: string }> = {
        baixa: { label: 'Baixa', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        media: { label: 'Média', color: 'bg-amber-100 text-amber-700 border-amber-200' },
        alta: { label: 'Alta', color: 'bg-red-100 text-red-700 border-red-200' },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="shrink-0 flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                            <div>
                                <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-lg">assignment_add</span>
                                    </div>
                                    Nova Demanda
                                </h3>
                                <p className="text-xs text-zinc-500 mt-1">Crie e distribua uma tarefa para a equipe</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                                <X size={18} className="text-zinc-400" />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-5">
                            {/* Título */}
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Título *</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ex: Criar post para Instagram"
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm font-medium transition-all"
                                />
                            </div>

                            {/* Setor + Prioridade */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Setor *</label>
                                    <select
                                        value={formData.sector}
                                        onChange={e => setFormData({ ...formData, sector: e.target.value })}
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-blue-500 text-sm font-medium"
                                    >
                                        <option value="comunicacao">📢 Comunicação</option>
                                        <option value="pedagogia">🎓 Pedagogia</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Prioridade</label>
                                    <div className="flex gap-2">
                                        {Object.entries(priorityConfig).map(([key, config]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, priority: key })}
                                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${formData.priority === key
                                                        ? config.color + ' ring-2 ring-offset-1 ring-current/20'
                                                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
                                                    }`}
                                            >
                                                {config.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Responsável + Prazo */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Responsável</label>
                                    <select
                                        value={formData.assigned_to}
                                        onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-blue-500 text-sm font-medium"
                                    >
                                        <option value="">-- Selecione --</option>
                                        {teamMembers.map(member => (
                                            <option key={member.id} value={member.id}>{member.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Prazo</label>
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-blue-500 text-sm font-medium"
                                    />
                                </div>
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Descrição</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detalhes da tarefa, instruções, links de referência..."
                                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm resize-none transition-all"
                                />
                            </div>

                            {/* Info do trigger */}
                            {formData.sector === 'pedagogia' && (
                                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                                    <span className="text-sm mt-0.5">👑</span>
                                    <p className="text-xs text-amber-700 dark:text-amber-400">
                                        Esta demanda aparecerá automaticamente no <strong>Kanban de Pedagogia</strong> como card oficial da Coordenação.
                                    </p>
                                </div>
                            )}
                        </form>

                        {/* Footer */}
                        <div className="shrink-0 p-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                disabled={loading || !formData.title.trim()}
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <span className="material-symbols-outlined text-lg">send</span>}
                                {loading ? 'Criando...' : 'Criar Demanda'}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
