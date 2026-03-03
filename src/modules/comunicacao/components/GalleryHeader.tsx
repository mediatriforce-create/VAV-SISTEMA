'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import AssetUploadModal from './AssetUploadModal';

export default function GalleryHeader() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-800">Galeria de Artes</h2>
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
                <Plus size={20} />
                Nova Arte
            </button>

            <AssetUploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
