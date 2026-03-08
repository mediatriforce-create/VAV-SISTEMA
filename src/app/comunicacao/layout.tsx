import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/permissions'
import { ComunicacaoClientLayout } from './ComunicacaoClientLayout'

export default async function ComunicacaoServerLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !hasPermission(profile.role as any, 'comunicacao')) {
        redirect('/dashboard') // Route guard: kick out unauthorized users
    }

    return <ComunicacaoClientLayout>{children}</ComunicacaoClientLayout>
}
