'use client';

import { useState } from 'react';
import TeamManagement from './TeamManagement';
import UserPreferences from './UserPreferences';

type Tab = 'team' | 'preferences';

interface Profile {
    full_name: string;
    role: string;
}

interface SettingsClientProps {
    profile: Profile;
    isAllowedTeamManagement: boolean;
    initialUsers: any[];
}

export default function SettingsClient({ profile, isAllowedTeamManagement, initialUsers }: SettingsClientProps) {
    const [activeTab, setActiveTab] = useState<Tab>('preferences');

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-200 dark:border-white/10 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Configurações</h1>
                    <p className="text-zinc-500">Ajustes do sistema e preferências do seu perfil.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

                {/* Lateral Menu / Profile summary */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-zinc-200/60 dark:border-white/10 p-5 shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-md">
                            {profile.full_name.charAt(0)}
                        </div>
                        <h3 className="text-center font-bold text-zinc-900 dark:text-white">{profile.full_name}</h3>
                        <p className="text-center text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mt-1 bg-indigo-50 dark:bg-indigo-500/10 py-1 rounded-full mx-auto w-fit px-3">
                            {profile.role}
                        </p>
                    </div>

                    <nav className="flex flex-col gap-1">
                        <button
                            onClick={() => setActiveTab('preferences')}
                            className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl font-bold transition-colors ${activeTab === 'preferences' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                            Preferências
                        </button>

                        {isAllowedTeamManagement && (
                            <button
                                onClick={() => setActiveTab('team')}
                                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl font-bold transition-colors ${activeTab === 'team' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                            >
                                <span className="material-symbols-outlined text-lg">group</span>
                                Gestão de Equipe
                            </button>
                        )}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    {activeTab === 'preferences' && <UserPreferences initialName={profile.full_name} />}

                    {activeTab === 'team' && isAllowedTeamManagement && (
                        <TeamManagement initialUsers={initialUsers} />
                    )}
                </div>

            </div>
        </div>
    );
}
