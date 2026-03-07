'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { UserProfile, updateUserRole } from '@/actions/users';
import { Role } from '@/lib/permissions';

// Array of all available roles for the dropdown
const ALL_ROLES: Role[] = [
    'Coord. Geral',
    'Presidente',
    'Dir. Financeiro',
    'Coord. Pedagógica',
    'Educadora',
    'Estágio Pedagógico',
    'Comunicação',
    'Estágio ADM'
];

export default function TeamManagement({ initialUsers }: { initialUsers: UserProfile[] }) {
    const [users, setUsers] = useState<UserProfile[]>(initialUsers);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const handleRoleChange = async (userId: string, newRole: Role) => {
        setUpdatingId(userId);
        const toastId = toast.loading('Atualizando cargo...');

        try {
            const res = await updateUserRole(userId, newRole);

            if (res.success) {
                toast.success(`Cargo atualizado com sucesso!`, { id: toastId });
                // Atualiza localmente o state para nao depender so do revalidate
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            } else {
                toast.error(`Erro: ${res.error}`, { id: toastId });
            }
        } catch (e: any) {
            toast.error(`Erro inesperado: ${e.message}`, { id: toastId });
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-zinc-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="p-5 border-b border-zinc-200/60 dark:border-white/10 shrink-0 bg-white/50 dark:bg-zinc-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500">manage_accounts</span>
                        Gestão de Equipe
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Altere os níveis de acesso de cada membro da organização.
                    </p>
                </div>
                <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-lg border border-indigo-100 dark:border-indigo-500/20 shadow-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">groups</span>
                    {users.length} membros
                </div>
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className="border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/50 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            <th className="px-6 py-4">Usuário</th>
                            <th className="px-6 py-4">Nível de Acesso (Cargo)</th>
                            <th className="px-6 py-4 text-right">Ação Rápida</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                        {users.map((user) => (
                            <motion.tr
                                key={user.id}
                                layout
                                className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover border-2 border-zinc-100 dark:border-zinc-800 shadow-sm" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold shadow-sm">
                                                {user.full_name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {user.full_name}
                                            </div>
                                            <div className="text-xs text-zinc-400">
                                                {user.id.substring(0, 8)}...
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4 text-sm max-w-[200px]">
                                    <div className="relative group/dropdown">
                                        <select
                                            disabled={updatingId === user.id}
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                                            className="appearance-none w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs py-2 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            {ALL_ROLES.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                                            <span className="material-symbols-outlined text-[18px]">expand_more</span>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4 text-right">
                                    <button
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors ml-auto tooltip-trigger relative group/btn"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">info</span>
                                        {/* Simple CSS Tooltip */}
                                        <div className="absolute right-0 bottom-full mb-1 w-48 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] p-2 rounded-lg opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all shadow-xl z-10 text-center font-medium pointer-events-none">
                                            Alterações de cargo tem efeito imediato no acesso do usuário.
                                        </div>
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                                    Nenhum usuário encontrado na base de dados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
