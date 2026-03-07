'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Role } from '@/lib/permissions'

export interface UserProfile {
    id: string
    full_name: string
    email: string | null
    role: Role
    avatar_url: string | null
    updated_at: string
}

export async function getUsers(): Promise<{ success: boolean; data?: UserProfile[]; error?: string }> {
    try {
        const supabase = await createClient()

        // Verifica a sessão logada e a role
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error('Não autorizado.')

        const { data: callerProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const allowedRoles = ['Coordenadora ADM', 'Presidência', 'Direção']
        if (!callerProfile || !allowedRoles.includes(callerProfile.role)) {
            throw new Error('Permissão negada para gerenciar equipe.')
        }

        // Busca os usuários. O email real não fica em auth.users por padrao,
        // se voce tiver criado uma trigger copiando email pra profile pega de la, ou pega normal auth.users
        // Como 'profiles' tem full_name e role, usamos ele.
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true })

        if (error) throw error

        return { success: true, data: data as UserProfile[] }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateUserRole(userId: string, newRole: Role): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        // Verificações de segurança
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error('Não autorizado.')

        const { data: callerProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const allowedRoles = ['Coordenadora ADM', 'Presidência', 'Direção']
        if (!callerProfile || !allowedRoles.includes(callerProfile.role)) {
            throw new Error('Permissão negada para alterar cargos.')
        }

        // Não permite que alguém mude o próprio cargo para se abaixar/elevar maliciosamente
        if (userId === user.id) {
            throw new Error('Você não pode alterar o seu próprio cargo.')
        }

        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId)

        if (error) throw error

        revalidatePath('/dashboard/configuracoes')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
