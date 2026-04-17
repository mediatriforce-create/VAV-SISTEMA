import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Breadcrumb } from './types';

interface Props {
    breadcrumbs: Breadcrumb[];
    onNavigate: (index: number) => void;
}

export function DriveBreadcrumbs({ breadcrumbs, onNavigate }: Props) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar text-sm font-medium text-slate-600 no-scrollbar">
            {breadcrumbs.length > 1 && (
                <button
                    onClick={() => onNavigate(breadcrumbs.length - 2)}
                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                >
                    <ArrowLeft size={16} />
                </button>
            )}

            {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.id} className="flex items-center">
                    <button
                        onClick={() => onNavigate(idx)}
                        className={`hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-slate-100
                            ${idx === breadcrumbs.length - 1 ? 'text-slate-900 font-semibold' : ''}
                        `}
                    >
                        {crumb.name}
                    </button>
                    {idx < breadcrumbs.length - 1 && (
                        <ChevronRight size={16} className="text-slate-400 mx-1 flex-shrink-0" />
                    )}
                </div>
            ))}
        </div>
    );
}
