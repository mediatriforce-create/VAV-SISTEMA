'use client';

import { useState } from 'react';
import { syncGoogleDriveStructure } from '@/modules/comunicacao/actions';
import { useRouter } from 'next/navigation';

interface DriveResyncWrapperProps {
    errorMessage: string;
}

export default function DriveResyncWrapper({ errorMessage }: DriveResyncWrapperProps) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState(errorMessage);
    const router = useRouter();

    const handleResync = async () => {
        setIsSyncing(true);
        setError('');

        try {
            const result = await syncGoogleDriveStructure();

            if (result?.success) {
                // Sync worked — reload the page to show the DriveExplorer
                router.refresh();
            } else {
                setError(result?.error || 'Falha ao reconectar. Tente novamente ou reconecte o Google Drive nas Configurações.');
            }
        } catch (e: any) {
            setError('Erro inesperado ao tentar sincronizar. Verifique sua conexão.');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm max-w-lg mx-auto mt-10">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-3xl text-red-500 dark:text-red-400">cloud_off</span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                Google Drive Dessincronizado
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 max-w-sm leading-relaxed">
                {error || 'O token de acesso ao Google Drive expirou ou a conexão foi perdida. Clique abaixo para reconectar.'}
            </p>

            <button
                onClick={handleResync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] dark:from-amber-500 dark:to-orange-500 text-white dark:text-zinc-900 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 dark:shadow-amber-500/20 hover:shadow-xl hover:shadow-blue-500/30 dark:hover:shadow-amber-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
            >
                {isSyncing ? (
                    <>
                        <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                        Sincronizando...
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined text-lg">sync</span>
                        Sincronizar Agora
                    </>
                )}
            </button>

            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 text-center">
                Se o problema persistir, reconecte o Google Drive em{' '}
                <a href="/dashboard/configuracoes" className="text-[#3B82F6] dark:text-amber-500 hover:underline font-medium">
                    Configurações
                </a>
            </p>
        </div>
    );
}
