'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { BankTabs } from '@/modules/admin/components/BankTabs'
import { AdminStats } from '@/modules/admin/components/AdminStats'
import { TransactionTable } from '@/modules/admin/components/TransactionTable'
import { NewEntryModal } from '@/modules/admin/components/NewEntryModal'
import { ImportModal } from '@/modules/admin/components/ImportModal'
import { MonthSelector } from '@/modules/admin/components/MonthSelector'
import { FinancialEntry, Bank } from '@/modules/admin/actions'

interface ClientAdminPageProps {
    banks: Bank[]
    entries: FinancialEntry[]
    selectedBankId: string
    totalInput: number
    totalOutput: number
    balance: number
    userProfile: { full_name: string; role: string }
}

export function ClientAdminPage({
    banks,
    entries,
    selectedBankId,
    // Original totals passed from server (Global totals? Or we ignore them now favoring client calc)
    // We will calculate our own stats based on filtered view
    userProfile
}: ClientAdminPageProps) {
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState(new Date())

    const handleBankSelect = (bankId: string) => {
        router.replace(`/dashboard/admin?bank=${bankId}`, { scroll: false })
    }

    const currentBankName = banks.find(b => b.id === selectedBankId)?.name || 'Banco Selecionado'

    // --- FILTER BY MONTH ---
    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            const entryDate = new Date(entry.entry_date)
            // Adjust for timezone issues if necessary, usually strings are YYYY-MM-DD
            // Let's assume input string is correct local or UTC 0
            // Best to compare Month and Year indices
            const [y, m] = entry.entry_date.split('-').map(Number)
            return y === selectedDate.getFullYear() && (m - 1) === selectedDate.getMonth()
        }).sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
    }, [entries, selectedDate])

    // --- CALCULATE STATS (CHECKPOINT BASED) ---
    const stats = useMemo(() => {
        // 1. Sort all entries by Date Ascending
        const sorted = [...entries].sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime())

        const selectedMonthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        const selectedMonthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)

        let checkpointIndex = -1
        let runningBalance = 0

        // 2. Find the LATEST "Saldo Inicial" that happened on or before the selected month end
        for (let i = sorted.length - 1; i >= 0; i--) {
            const e = sorted[i]
            const eDate = new Date(e.entry_date)

            if (e.category === 'Saldo Inicial' && eDate <= selectedMonthEnd) {
                checkpointIndex = i
                runningBalance = e.type === 'entrada' ? e.amount : -e.amount
                break
            }
        }

        // 3. Sum transactions AFTER the checkpoint, up to the end of selected month
        let monthInput = 0
        let monthOutput = 0

        const startIndex = checkpointIndex === -1 ? 0 : checkpointIndex + 1

        for (let i = startIndex; i < sorted.length; i++) {
            const e = sorted[i]
            const eDate = new Date(e.entry_date)

            // Stop if we go past the selected month
            if (eDate > selectedMonthEnd) break

            // Update Running Balance
            const val = e.type === 'entrada' ? e.amount : -e.amount
            runningBalance += val

            // Update Monthly Stats (Only for the selected month)
            if (
                e.category !== 'Saldo Inicial' &&
                eDate >= selectedMonthStart &&
                eDate <= selectedMonthEnd
            ) {
                if (e.type === 'entrada') monthInput += e.amount
                else monthOutput += e.amount
            }
        }

        return {
            totalInput: monthInput,
            totalOutput: monthOutput,
            balance: runningBalance
        }
    }, [entries, selectedDate])

    // --- EXPORT TO EXCEL ("PROFESSIONAL") ---
    const handleExport = async () => {
        if (filteredEntries.length === 0) return

        // Dynamic check for library (client-side only)
        // We need to import it dynamically or ensure it's loaded
        // Dynamic Import with Interop fallback
        const excelJsModule = await import('exceljs')
        const ExcelJS = excelJsModule.default || excelJsModule
        const { saveAs } = (await import('file-saver')).default

        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Extrato')

        // 1. Columns Setup
        worksheet.columns = [
            { header: 'Data', key: 'date', width: 15 },
            { header: 'Descrição', key: 'desc', width: 40 },
            { header: 'Categoria', key: 'cat', width: 20 },
            { header: 'Valor (R$)', key: 'val', width: 15 },
            { header: 'Tipo', key: 'type', width: 10 },
            { header: 'Responsável', key: 'resp', width: 25 },
        ]

        // 2. Style Header Row
        const headerRow = worksheet.getRow(1)
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' } // Primary Blue
        }
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

        // 3. Add Data
        filteredEntries.forEach(e => {
            const row = worksheet.addRow({
                date: new Date(e.entry_date),
                desc: e.description,
                cat: e.category,
                val: e.amount,
                type: e.type === 'entrada' ? 'Entrada' : 'Saída',
                resp: e.responsible_name || 'N/A'
            })

            // 4. Conditional Formatting (Green/Red)
            const valCell = row.getCell('val')
            valCell.numFmt = '#,##0.00' // Number format

            if (e.type === 'entrada') {
                valCell.font = { color: { argb: 'FF16A34A' }, bold: true } // Green
                row.getCell('type').font = { color: { argb: 'FF16A34A' } }
            } else {
                valCell.font = { color: { argb: 'FFDC2626' }, bold: true } // Red
                row.getCell('type').font = { color: { argb: 'FFDC2626' } }
            }

            // Alignments
            row.getCell('date').alignment = { horizontal: 'center' }
            row.getCell('type').alignment = { horizontal: 'center' }
        })

        // 5. Generate File
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

        // File Name
        const monthName = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        saveAs(blob, `extrato_financeiro_${currentBankName}_${monthName.replace(/ /g, '_')}.xlsx`)
    }

    return (
        <div className="w-full flex flex-col gap-6 max-w-7xl mx-auto pb-4 pt-4">
            <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="material-icons text-primary dark:text-blue-400">account_balance</span>
                        Administração Financeira
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gerencie entradas, saídas e prestação de contas.
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={() => router.push('/dashboard/admin/kanban')}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-violet-500/20"
                    >
                        <span className="material-icons">view_kanban</span>
                        Acessar Kanban
                    </button>

                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                    >
                        <span className="material-icons">upload_file</span>
                        Importar Extrato
                    </button>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-green-600 hover:bg-green-50 transition-colors shadow-sm"
                        title="Baixar planilha Excel (.xlsx)"
                    >
                        <span className="material-icons">download</span>
                        Exportar Excel
                    </button>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-900/20"
                    >
                        <span className="material-icons">add</span>
                        Novo Lançamento
                    </button>
                </div>
            </div>

            <div className="shrink-0">
                <BankTabs
                    banks={banks}
                    selectedBankId={selectedBankId}
                />
            </div>

            {/* MONTH SELECTOR */}
            <div className="shrink-0">
                <MonthSelector
                    currentDate={selectedDate}
                    onDateChange={setSelectedDate}
                />
            </div>

            <div className="shrink-0">
                <AdminStats
                    totalInput={stats.totalInput}
                    totalOutput={stats.totalOutput}
                    balance={stats.balance}
                />
            </div>

            <div className="flex flex-col">
                <div className="shrink-0 flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Movimentações do Mês</h3>
                    <span className="text-sm text-gray-500">{filteredEntries.length} lançamentos</span>
                </div>
                <TransactionTable entries={filteredEntries} />
            </div>

            <NewEntryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                bankId={selectedBankId}
                currentUserName={userProfile.full_name}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                bankId={selectedBankId}
                bankName={currentBankName}
            />
        </div >
    )
}
