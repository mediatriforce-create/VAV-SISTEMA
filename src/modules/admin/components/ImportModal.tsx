'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { parseFile, saveImportedTransactions, ParsedTransaction } from '../import-actions'

interface ImportModalProps {
    isOpen: boolean
    onClose: () => void
    bankId: string
    bankName: string
}

export function ImportModal({ isOpen, onClose, bankId, bankName }: ImportModalProps) {
    const [step, setStep] = useState<'upload' | 'preview'>('upload')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [parsedData, setParsedData] = useState<ParsedTransaction[]>([])
    const [error, setError] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!isOpen || !mounted) return null

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setError('')
        }
    }

    const handleParse = async () => {
        if (!file) return
        setLoading(true)
        setError('')

        const formData = new FormData()
        formData.append('file', file)
        formData.append('bankId', bankId)

        const result = await parseFile(formData)

        if (result.success && result.data) {
            setParsedData(result.data)
            setStep('preview')
        } else {
            setError(result.error || 'Erro desconhecido ao ler arquivo.')
        }
        setLoading(false)
    }

    const handleConfirmImport = async () => {
        setLoading(true)
        const result = await saveImportedTransactions(bankId, parsedData)
        if (result.success) {
            alert('Transações importadas com sucesso!')
            onClose()
            setStep('upload')
            setFile(null)
            setParsedData([])
            window.location.reload()
        } else {
            alert('Erro ao salvar: ' + result.error)
        }
        setLoading(false)
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white dark:bg-gray-800 w-full max-w-4xl rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-xl shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="material-icons text-blue-600">upload_file</span>
                        Importar Extrato - {bankName}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6">
                    {step === 'upload' ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-6 py-8">
                            <div className="text-center space-y-2">
                                <div className="mx-auto h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                    <span className="material-icons text-3xl text-blue-600">file_upload</span>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Selecione o arquivo do extrato</h3>
                                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                    Suportamos arquivos <strong>PDF, OFX e CSV</strong>. O sistema tentará identificar automaticamente as transações.
                                </p>
                            </div>

                            <div className="w-full max-w-md">
                                <label className="flex flex-col items-center px-4 py-8 bg-white dark:bg-gray-700 text-blue rounded-lg shadow-sm tracking-wide uppercase border border-blue-200 dark:border-gray-600 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors">
                                    <span className="material-icons text-2xl mb-2 text-blue-600">folder_open</span>
                                    <span className="mt-2 text-base leading-normal text-gray-600 dark:text-gray-300">
                                        {file ? file.name : 'Clique para selecionar'}
                                    </span>
                                    <input type='file' className="hidden" onChange={handleFileChange} accept=".pdf,.csv,.ofx" />
                                </label>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm max-w-md text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleParse}
                                disabled={!file || loading}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full max-w-md flex items-center justify-center gap-2"
                            >
                                {loading ? 'Processando...' : 'Ler Arquivo'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-700 dark:text-white">
                                    {parsedData.length} Transações Encontradas
                                </h3>
                                <button
                                    onClick={() => setStep('upload')}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Trocar Arquivo
                                </button>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descrição</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {parsedData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                                    {(() => {
                                                        if (!row.date) return '-'
                                                        const [y, m, d] = row.date.split('-')
                                                        return `${d}/${m}/${y}`
                                                    })()}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                                    {row.description}
                                                </td>
                                                <td className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${row.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    R$ {row.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                                                    {row.type}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={handleConfirmImport}
                                    disabled={loading}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? 'Salvando...' : 'Confirmar Importação'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}
