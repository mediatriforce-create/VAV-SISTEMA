'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { updateAccountCredentials } from '../actions/account';

export function AccountSettings() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [statusParams, setStatusParams] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatusParams({ type: 'error', msg: 'As senhas digitadas nÃ£o coincidem. Tente novamente.' });
            return;
        }

        if (password.length < 6) {
            setStatusParams({ type: 'error', msg: 'A nova senha precisa ter no mÃ­nimo 6 caracteres.' });
            return;
        }

        setIsSaving(true);
        setStatusParams(null);

        const res = await updateAccountCredentials({ password });

        if (res.success) {
            setStatusParams({ type: 'success', msg: 'Credenciais de seguranÃ§a blindadas e atualizadas com sucesso!' });
            setPassword('');
            setConfirmPassword('');
        } else {
            setStatusParams({ type: 'error', msg: res.message || 'Falha ao criptografar sua nova senha.' });
        }

        setIsSaving(false);
    };

    return (
        <div className="flex-1 w-full bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 flex items-center gap-4 p-6 md:p-8 border-b border-zinc-200 dark:border-white/10">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                    <span className="material-symbols-outlined text-2xl">shield_person</span>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">SeguranÃ§a da Conta</h3>
                    <p className="text-sm font-medium text-zinc-500">
                        Atualize suas chaves de acesso ao sistema VAV.
                    </p>
                </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 md:p-8 flex flex-col gap-5 custom-scrollbar">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider pl-1">Nova Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                            className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-medium text-zinc-900 dark:text-white transition-all"
                            disabled={isSaving}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider pl-1">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                            className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-medium text-zinc-900 dark:text-white transition-all"
                            disabled={isSaving}
                        />
                    </div>

                    {statusParams && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl text-sm font-semibold border ${statusParams.type === 'error' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'}`}
                        >
                            {statusParams.msg}
                        </motion.div>
                    )}
                </div>

                <div className="flex-shrink-0 p-6 bg-zinc-50/50 dark:bg-black/20 border-t border-zinc-200 dark:border-white/10 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving || !password || !confirmPassword}
                        className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-3 px-8 rounded-xl shadow-md disabled:opacity-50 disabled:grayscale transition-all hover:-translate-y-0.5"
                    >
                        {isSaving ? 'Aplicando Criptografia...' : 'Atualizar Credenciais'}
                    </button>
                </div>
            </form>
        </div>
    );
}

