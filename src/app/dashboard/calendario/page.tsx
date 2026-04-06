import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GlobalCalendar } from '@/modules/global-calendar/components/GlobalCalendar';
import { hasPermission } from '@/lib/permissions';

export default async function GlobalCalendarPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile) redirect('/login');

    // Security check server-side for the page itself
    if (!hasPermission(profile.role as any, 'calendario')) {
        redirect('/dashboard');
    }

    return (
        <div className="h-full flex flex-col pt-2 animate-in fade-in duration-500">
            <div className="flex flex-col gap-1 mb-6 px-4">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-[32px] sm:text-[40px] text-indigo-500">event_note</span>
                    Calendário Geral
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm sm:text-base">
                    Acompanhe todos os eventos importantes, feriados e reuniões globais da organização.
                </p>
            </div>

            <div className="flex-1 min-h-0 relative z-10 -mx-4 sm:mx-0">
                <GlobalCalendar userRole={profile.role} userId={user.id} />
            </div>
            {/* Background decoration */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] mix-blend-screen pointer-events-none -z-10"></div>
        </div>
    );
}
