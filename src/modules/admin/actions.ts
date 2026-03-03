'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type FinancialEntry = {
    id: string
    bank_id: string
    type: 'entrada' | 'saida'
    description: string
    category: string
    amount: number
    entry_date: string
    responsible_id: string | null
    attachment_url: string | null
    created_at: string
    profiles?: {
        full_name: string
    }
    responsible_name?: string
}

export type Bank = {
    id: string
    name: string
}

// Check if user has permission
async function checkPermission() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile) return false

    const allowedRoles = ['Coord. Geral', 'Presidente', 'Dir. Financeiro', 'Estágio ADM']
    return allowedRoles.includes(profile.role)
}

export async function getBanks() {
    const authorized = await checkPermission()
    if (!authorized) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('banks')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching banks:', error)
        return []
    }

    return data as Bank[]
}

export async function getFinancialEntries(bankId: string) {
    const authorized = await checkPermission()
    if (!authorized) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('financial_entries')
        .select(`
      *,
      profiles:responsible_id (full_name)
    `)
        .eq('bank_id', bankId)
        .order('entry_date', { ascending: false })

    if (error) {
        console.error('Error fetching entries:', error)
        return []
    }

    // Transform data to match type
    return data.map(item => ({
        ...item,
        responsible_name: item.profiles?.full_name || 'N/A'
    }))
}

export async function createFinancialEntry(formData: FormData) {
    const authorized = await checkPermission()
    if (!authorized) {
        return { error: 'Permissão negada.' }
    }

    const supabase = await createClient()

    const bank_id = formData.get('bank_id') as string
    const type = formData.get('type') as 'entrada' | 'saida'
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const amount = parseFloat(formData.get('amount') as string)
    const entry_date = formData.get('entry_date') as string
    const responsible_id = formData.get('responsible_id') as string
    const attachment_url = formData.get('attachment_url') as string

    if (!bank_id || !type || !description || !amount || !entry_date) {
        console.error('Validation failed. Missing fields:', { bank_id, type, description, amount, entry_date })
        return { error: 'Campos obrigatórios faltando.' }
    }

    const { error } = await supabase
        .from('financial_entries')
        .insert({
            bank_id,
            type,
            description,
            category,
            amount,
            entry_date,
            responsible_id: responsible_id || null,
            attachment_url: attachment_url || null
        })

    if (error) {
        console.error('Error creating entry:', error)
        return { error: 'Erro ao criar lançamento.' }
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
}

export async function deleteFinancialEntry(id: string) {
    const authorized = await checkPermission()
    if (!authorized) {
        return { error: 'Permissão negada.' }
    }

    const supabase = await createClient()
    const { error } = await supabase
        .from('financial_entries')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: 'Erro ao excluir lançamentos.' }
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
}

export async function getTeamMembers() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name')

    return data || []
}
