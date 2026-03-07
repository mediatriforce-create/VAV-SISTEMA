import React from 'react'
import { getBanks, getFinancialEntries } from '@/modules/admin/actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BankTabs } from '@/modules/admin/components/BankTabs'
import { AdminStats } from '@/modules/admin/components/AdminStats'
import { TransactionTable } from '@/modules/admin/components/TransactionTable'
import { ClientAdminPage } from './ClientAdminPage' // We'll move client interaction to a separate client component wrapper

// Main Server Component
export default async function AdminPage({
    searchParams,
}: {
    searchParams: Promise<{ bank?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check permissions strictly on server side
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

    const allowedRoles = ['Coordenadora ADM', 'Presidência', 'Direção', 'Estagiário(a) de ADM']
    if (!profile || !allowedRoles.includes(profile.role)) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <span className="material-icons text-6xl text-gray-300 mb-4">gpp_bad</span>
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">Acesso Negado</h2>
                <p className="text-gray-500 mt-2">Você não tem permissão para acessar o módulo financeiro.</p>
            </div>
        )
    }

    const banks = await getBanks()
    const resolvedParams = await searchParams

    // Default to first bank if not selected
    const selectedBankId = resolvedParams.bank || (banks.length > 0 ? banks[0].id : '')

    const entries = selectedBankId ? await getFinancialEntries(selectedBankId) : []

    // Calculate Stats
    const totalInput = entries
        .filter((e: any) => e.type === 'entrada')
        .reduce((acc: number, curr: any) => acc + curr.amount, 0)

    const totalOutput = entries
        .filter((e: any) => e.type === 'saida')
        .reduce((acc: number, curr: any) => acc + curr.amount, 0)

    const balance = totalInput - totalOutput

    return (
        <ClientAdminPage
            banks={banks}
            entries={entries}
            selectedBankId={selectedBankId}
            totalInput={totalInput}
            totalOutput={totalOutput}
            balance={balance}
            userProfile={profile}
        />
    )
}
