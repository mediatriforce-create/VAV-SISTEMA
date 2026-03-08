import DashboardLayout from '../dashboard/layout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';

export default async function CoordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !hasPermission(profile.role as any, 'coordenacao')) {
        redirect('/dashboard');
    }

    return <DashboardLayout>{children}</DashboardLayout>;
}
