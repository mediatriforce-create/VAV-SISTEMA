'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export default function UserPreferences() {
    const [theme, setTheme] = useState<Theme>('system');

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

    return (
        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-zinc-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col p-6 min-h-[500px]">
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

        </div>
    );
}
