'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { updateProfileNameAction } from '@/actions/profile';
import toast from 'react-hot-toast';

type Theme = 'light' | 'dark' | 'system';

export default function UserPreferences({ initialName = '' }: { initialName?: string }) {
    const [theme, setTheme] = useState<Theme>('system');
    const [name, setName] = useState(initialName);
    const [isSavingName, setIsSavingName] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('theme') as Theme;
        if (stored === 'light' || stored === 'dark') {
            setTheme(stored);
        } else {
            setTheme('system');
        }
    }, []);

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);

        if (newTheme === 'system') {
            localStorage.removeItem('theme');
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } else {
            localStorage.setItem('theme', newTheme);
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    };

    const handleNameUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim().length < 2) {
            toast.error('O nome precisa ter pelo menos 2 caracteres.');
            return;
        }
        setIsSavingName(true);
        const toastId = toast.loading('Atualizando seu perfil...');
        const res = await updateProfileNameAction(name);
        if (res.success) {
            toast.success(res.message, { id: toastId });
        } else {
            toast.error(res.message, { id: toastId });
        }
        setIsSavingName(false);
    };

    const handleLogout = async () => {
        if (!confirm('Deseja realmente sair da sua conta?')) return;
        setIsLoggingOut(true);
        const toastId = toast.loading('Encerrando sessão...');
        const supabase = createClient();
        await supabase.auth.signOut();
        toast.success('Até logo!', { id: toastId });
        window.location.href = '/login';
    };

    return (
        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-zinc-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col p-6 min-h-[500px] gap-8">

            {/* Seção de Perfil */}
            <section>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200/60 dark:border-white/10 pb-4 mb-6">
                    <span className="material-symbols-outlined text-indigo-500">badge</span>
                    Identidade
                </h2>
                <div className="space-y-4">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        Como você deseja ser chamado pela equipe no sistema.
                    </p>
                    <form onSubmit={handleNameUpdate} className="flex gap-4 items-end mt-4">
                        <div className="flex-1 max-w-sm">
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1">Seu Nome Completo</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-zinc-900 dark:text-white"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSavingName || name === initialName}
                            className="h-[46px] px-6 rounded-xl font-bold text-sm bg-indigo-600 dark:bg-amber-500 text-white dark:text-zinc-900 shadow-md shadow-indigo-600/30 dark:shadow-amber-500/20 hover:bg-indigo-500 dark:hover:bg-amber-400 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            {isSavingName ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <span className="material-symbols-outlined text-[18px]">save</span>
                            )}
                            Salvar Alteração
                        </button>
                    </form>
                </div>
            </section>

            {/* Seção de Aparência */}
            <section>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200/60 dark:border-white/10 pb-4 mb-6">
                    <span className="material-symbols-outlined text-amber-500">palette</span>
                    Aparência Visual
                </h2>

                <div className="space-y-4">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        Escolha como o VAV Central é exibido para você. A opção selecionada tentará ser lembrada em todos os seus acessos.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {/* Light Mode */}
                        <div
                            onClick={() => handleThemeChange('light')}
                            className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1 ${theme === 'light' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-amber-300'}`}
                        >
                            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 shadow-sm text-amber-500 mx-auto">
                                <span className="material-symbols-outlined text-2xl">light_mode</span>
                            </div>
                            <div className="text-center font-bold text-zinc-800 dark:text-zinc-200">
                                Modo Claro
                            </div>
                        </div>

                        {/* Dark Mode */}
                        <div
                            onClick={() => handleThemeChange('dark')}
                            className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1 ${theme === 'dark' ? 'border-primary dark:border-primary-dark bg-indigo-50 dark:bg-indigo-900/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-indigo-300'}`}
                        >
                            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 dark:bg-black shadow-sm text-indigo-400 mx-auto">
                                <span className="material-symbols-outlined text-2xl">dark_mode</span>
                            </div>
                            <div className="text-center font-bold text-zinc-800 dark:text-zinc-200">
                                Modo Escuro
                            </div>
                        </div>

                        {/* System Mode */}
                        <div
                            onClick={() => handleThemeChange('system')}
                            className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1 ${theme === 'system' ? 'border-zinc-500 bg-zinc-100 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'}`}
                        >
                            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-zinc-300 to-zinc-500 dark:from-zinc-700 dark:to-zinc-900 shadow-sm text-white mx-auto">
                                <span className="material-symbols-outlined text-2xl">desktop_windows</span>
                            </div>
                            <div className="text-center font-bold text-zinc-800 dark:text-zinc-200">
                                Padrão do Sistema
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Zona Perigosa - Logout */}
            <section className="mt-8 pt-8 border-t border-zinc-200/60 dark:border-white/10">
                <h2 className="text-lg font-bold text-red-500 flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined">power_settings_new</span>
                    Sessão
                </h2>
                <div className="flex items-center justify-between p-5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl">
                    <p className="text-red-800 dark:text-red-300 text-sm font-medium">
                        Encerrar sua sessão neste dispositivo e voltar para a tela de login.
                    </p>
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="px-6 py-2.5 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/30 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        {isLoggingOut ? 'Saindo...' : 'Sair da Conta'}
                    </button>
                </div>
            </section>

        </div>
    );
}
