'use client';

import { User } from 'lucide-react';

interface TeamMember {
    id: string;
    full_name: string;
    role: string;
    avatar_url: string | null;
    active_demands_count: number;
}

interface TeamMemberCardProps {
    member: TeamMember;
    onClick?: (member: TeamMember) => void;
    isSelected?: boolean;
}

export default function TeamMemberCard({ member, onClick, isSelected }: TeamMemberCardProps) {
    return (
        <div
            onClick={() => onClick?.(member)}
            className={`
        bg-white p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3
        ${isSelected
                    ? 'border-primary ring-1 ring-primary shadow-md'
                    : 'border-slate-200 hover:border-primary/50 hover:shadow-sm'
                }
      `}
        >
            {member.avatar_url ? (
                <img
                    src={member.avatar_url}
                    alt={member.full_name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-100"
                />
            ) : (
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <User size={20} />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-800 text-sm truncate">{member.full_name}</h4>
                <p className="text-xs text-slate-500 truncate">{member.role}</p>
            </div>

            <div className={`
        text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center
        ${member.active_demands_count > 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-slate-100 text-slate-400'
                }
      `}>
                {member.active_demands_count}
            </div>
        </div>
    );
}
