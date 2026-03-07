'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createFinancialEntry } from '../actions'
import { createClient } from '@/lib/supabase'

interface NewEntryModalProps {
    isOpen: boolean
    onClose: () => void
    bankId: string
    currentUserId?: string
    currentUserRole?: string
    currentUserName?: string
}

export function NewEntryModal({ isOpen, onClose, bankId, currentUserName }: NewEntryModalProps) {
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Form State
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
    const [type, setType] = useState<'entrada' | 'saida'>('saida')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [amount, setAmount] = useState('')
    const [file, setFile] = useState<File | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!isOpen || !mounted) return null

    async function handleSave() {
        // Validation
        if (!description || !category || !amount || !entryDate) {
            alert('Por favor, preencha todos os campos obrigatórios.')
            return
        }

        setLoading(true)
        const supabase = createClient()
        const formData = new FormData()

        try {
            console.log('Starting manual save...')

            // 1. Upload File (Optional)
            let attachmentUrl = ''
            if (file) {
                console.log('Uploading file:', file.name)
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const filePath = `receipts/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('financial_docs')
                    .upload(filePath, file)

                if (uploadError) {
                    console.error('Upload error:', uploadError)
                    alert('Erro no upload: ' + uploadError.message)
                    setLoading(false)
                    return
                }

                attachmentUrl = filePath
            }

            // 2. Build Form Data
            formData.append('bank_id', bankId)
            formData.append('type', type)
            formData.append('description', description)
            formData.append('category', category)
            formData.append('amount', amount)
            formData.append('entry_date', entryDate)
            formData.append('attachment_url', attachmentUrl)

            console.log('Calling server action...')
            const result = await createFinancialEntry(formData)

            if (result.error) {
                console.error('Server error:', result.error)
                alert('Erro ao salvar: ' + result.error)
            } else {
                console.log('Success!')
                alert('Lançamento salvo com sucesso!')
                onClose()

                // Reset form
                setDescription('')
                setAmount('')
                setFile(null)
                // Force reload
                window.location.reload()
            }
        } catch (error) {
            console.error('Crash error:', error)
            alert('Erro inesperado: ' + JSON.stringify(error))
        } finally {
            setLoading(false)
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-zinc-900 rounded-t-xl shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-500">add_circle</span>
                        Novo Lançamento
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 min-h-0 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">

                        {/* Row 1: Date & Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data</label>
                                <input
                                    type="date"
                                    value={entryDate}
                                    onChange={(e) => setEntryDate(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 h-10 px-3 shadow-sm focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                    <button
                                        type="button"
                                        onClick={() => setType('saida')}
                                        className={`flex-1 py-1.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${type === 'saida'
                                            ? 'bg-white shadow text-red-600'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">trending_down</span>
                                        Saída
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('entrada')}
                                        className={`flex-1 py-1.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${type === 'entrada'
                                            ? 'bg-white shadow text-green-600'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">trending_up</span>
                                        Entrada
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ex: Pagamento Fornecedor"
                                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 h-10 px-3 shadow-sm focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Row 2: Category & Amount */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 h-10 px-3 shadow-sm focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Servicos Terceiros">Serviços Terceiros</option>
                                    <option value="Recursos Humanos">Recursos Humanos</option>
                                    <option value="Material de Escritorio">Material de Escritório</option>
                                    <option value="Infraestrutura">Infraestrutura</option>
                                    <option value="Alimentacao">Alimentação</option>
                                    <option value="Transporte">Transporte</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0,00"
                                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 h-10 px-3 shadow-sm focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Responsible */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Responsável</label>
                            <div className="flex items-center px-3 h-10 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400">
                                <span className="material-icons text-lg mr-2">person</span>
                                {currentUserName || 'Usuário Atual'}
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Comprovante (Opcional)</label>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*,.pdf"
                                />
                                <span className="material-icons text-3xl text-gray-400 mb-2">cloud_upload</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    {file ? file.name : 'Clique para selecionar arquivo'}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-900 border-t border-gray-100 dark:border-white/10 rounded-b-xl flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 font-medium disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-primary dark:bg-amber-500 text-white dark:text-zinc-900 rounded-lg hover:bg-blue-900 dark:hover:bg-amber-400 font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>}
                        Salvar Lançamento
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
