'use client';

import { CommunicationAsset } from '@/types/communication';
import { Download, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface AssetGridProps {
    assets: CommunicationAsset[];
}

export default function AssetGrid({ assets }: AssetGridProps) {
    if (assets.length === 0) {
        return (
            <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">Nenhuma arte encontrada.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map(asset => (
                <div key={asset.id} className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <img
                        src={asset.image_url}
                        alt={asset.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        <h4 className="text-white font-bold text-sm truncate">{asset.title}</h4>
                        <p className="text-white/70 text-xs truncate">{new Date(asset.created_at).toLocaleDateString()}</p>

                        <div className="flex gap-2 mt-2">
                            <a
                                href={asset.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                                title="Abrir original"
                            >
                                <ExternalLink size={16} />
                            </a>
                            {/* Add download logic if needed (requires blob handling or force-download attr) */}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
