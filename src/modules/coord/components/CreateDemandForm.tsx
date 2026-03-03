'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Loader2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreateDemandFormProps {
    onSuccess: () => void;
    teamMembers: { id: string; full_name: string }[];
}

export default function CreateDemandForm({ onSuccess, teamMembers }: CreateDemandFormProps) {
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

            // Reset form
            setFormData({
                title: '',
                sector: 'comunicacao',
                assigned_to: '',
                priority: 'media',
                due_date: '',
                description: ''
            });

            onSuccess();
            alert('Demanda criada com sucesso!');

        } catch (error) {
            console.error('Error creating demand:', error);
            alert('Erro ao criar demanda. Verifique suas permissões.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-200/60 dark:border-gray-700/60 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none"></div>

            <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-6 flex items-center gap-3">
                <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-xl">
                    <Plus size={20} className="text-primary dark:text-blue-400" strokeWidth={2.5} />
                </div>
                Nova Demanda
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div>
                    <label className="block text-sm font-bold tracking-wide text-slate-700 dark:text-gray-300 mb-1.5">Título</label>
                    <input
                        required
                        type="text"
                        className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-slate-200/60 dark:border-gray-700/60 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none text-sm font-medium transition-all shadow-inner text-slate-800 dark:text-gray-100 placeholder-slate-400"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Criar post para Instagram"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-bold tracking-wide text-slate-700 dark:text-gray-300 mb-1.5">Setor</label>
                        <select
                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-slate-200/60 dark:border-gray-700/60 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none text-sm font-medium transition-all shadow-inner text-slate-800 dark:text-gray-100 cursor-pointer"
                            value={formData.sector}
                            onChange={e => setFormData({ ...formData, sector: e.target.value })}
                        >
                            <option value="comunicacao">Comunicação</option>
                            <option value="pedagogia">Pedagogia</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold tracking-wide text-slate-700 dark:text-gray-300 mb-1.5">Prioridade</label>
                        <select
                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-slate-200/60 dark:border-gray-700/60 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none text-sm font-medium transition-all shadow-inner text-slate-800 dark:text-gray-100 cursor-pointer"
                            value={formData.priority}
                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <option value="baixa">Baixa</option>
                            <option value="media">Média</option>
                            <option value="alta">Alta</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-bold tracking-wide text-slate-700 dark:text-gray-300 mb-1.5">Responsável</label>
                        <select
                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-slate-200/60 dark:border-gray-700/60 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none text-sm font-medium transition-all shadow-inner text-slate-800 dark:text-gray-100 cursor-pointer"
                            value={formData.assigned_to}
                            onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
                        >
                            <option value="">-- Selecione --</option>
                            {teamMembers.map(member => (
                                <option key={member.id} value={member.id}>{member.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold tracking-wide text-slate-700 dark:text-gray-300 mb-1.5">Prazo</label>
                        <input
                            type="date"
                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-slate-200/60 dark:border-gray-700/60 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none text-sm font-medium transition-all shadow-inner text-slate-800 dark:text-gray-100 cursor-pointer"
                            value={formData.due_date}
                            onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold tracking-wide text-slate-700 dark:text-gray-300 mb-1.5">Descrição</label>
                    <textarea
                        rows={3}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-slate-200/60 dark:border-gray-700/60 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none text-sm font-medium transition-all shadow-inner text-slate-800 dark:text-gray-100 placeholder-slate-400 resize-none"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detalhes da tarefa..."
                    />
                </div>

                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg text-white font-bold tracking-wide py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:pointer-events-none"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Criar Demanda'}
                </motion.button>
            </form>
        </div>
    );
}
