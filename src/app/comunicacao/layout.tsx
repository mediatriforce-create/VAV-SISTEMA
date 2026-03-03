'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DashboardLayout from '../dashboard/layout';
import { Kanban, Image, FolderOpen } from 'lucide-react';

const TABS = [
    { name: 'Kanban', href: '/comunicacao/kanban', icon: Kanban },
    { name: 'Galeria', href: '/comunicacao/galeria', icon: Image },
    { name: 'Drive / Arquivos', href: '/comunicacao/drive', icon: FolderOpen },
];

export default function ComunicacaoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <DashboardLayout>
            <div className="w-full h-full flex-1 min-h-0 flex flex-col max-w-7xl mx-auto gap-6 sm:px-0">
                {/* Header Module */}
                <div className="shrink-0 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Comunicação</h1>
                        <p className="text-slate-500">Gestão de demandas, artes e arquivos.</p>
                    </div>

                    {/* Navigation Tabs and Drive Action */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                            {TABS.map(tab => {
                                const isActive = pathname === tab.href;
                                const Icon = tab.icon;
                                return (
                                    <Link
                                        key={tab.name}
                                        href={tab.href}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${isActive
                                            ? 'bg-white text-primary shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                            }`}
                                    >
                                        <Icon size={16} />
                                        {tab.name}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-y-auto pb-6">
                    {children}
                </div>
            </div>
        </DashboardLayout>
    );
}
