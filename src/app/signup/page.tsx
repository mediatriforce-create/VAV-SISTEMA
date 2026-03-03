'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface WhitelistItem {
    id: string
    full_name: string
    role: string
    is_claimed: boolean
}

export default function SignupPage() {
    const [availableUsers, setAvailableUsers] = useState<WhitelistItem[]>([])
    const [selectedUser, setSelectedUser] = useState<string>('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function fetchWhitelist() {
            const { data, error } = await supabase
                .from('whitelist')
                .select('*')
                .eq('is_claimed', false)

            if (data) {
                setAvailableUsers(data)
            }
        }
        fetchWhitelist()
    }, [])

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (!selectedUser) {
            setError('Por favor, selecione seu nome na lista.')
            setLoading(false)
            return
        }

        const userItem = availableUsers.find(u => u.id === selectedUser)
        if (!userItem) {
            setError('Usuário inválido.')
            setLoading(false)
            return
        }

        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: userItem.full_name,
                    role: userItem.role,
                },
            },
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        if (authData.user) {
            // 2. Insert into profiles (id matches auth.uid)
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    email: email,
                    full_name: userItem.full_name,
                    role: userItem.role,
                })

            if (profileError) {
                console.error('Profile creation error:', profileError)
                setError('Erro ao criar perfil. Contate o suporte.')
                setLoading(false)
                return
            }

            // 3. Mark whitelist item as claimed and link user_id
            const { error: whitelistError } = await supabase
                .from('whitelist')
                .update({ is_claimed: true, user_id: authData.user.id })
                .eq('id', selectedUser)

            if (whitelistError) {
                console.error('Whitelist update error:', whitelistError)
                // Non-critical error for the user, but bad for system consistency
            }

            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <div className="font-display bg-background-light dark:bg-background-dark min-h-screen w-full relative overflow-x-hidden flex items-center justify-center py-10">
            {/* Simple Background for Performance */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-orange-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-lg px-4"
            >
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/30">
                    <div className="pt-10 pb-6 px-8 text-center relative">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-orange-500 shadow-lg mb-4 text-white"
                        >
                            <span className="material-icons text-3xl">person_add</span>
                        </motion.div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Criar Nova Conta
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                            Junte-se à Central Viva a Vida
                        </p>
                    </div>

                    <div className="px-8 pb-10">
                        <form onSubmit={handleSignup} className="space-y-5">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-red-50 text-red-500 text-sm p-3 rounded-lg border border-red-100"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-icons text-gray-400 group-focus-within:text-primary transition-colors">badge</span>
                                    </div>
                                    <select
                                        id="name"
                                        required
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        className="block w-full pl-12 pr-10 py-3.5 border-0 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary transition-all appearance-none sm:text-sm"
                                    >
                                        <option value="" disabled>Selecione seu nome na lista...</option>
                                        {availableUsers.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.full_name} ({user.role})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <span className="material-icons text-gray-400">expand_more</span>
                                    </div>
                                </div>
                            </div>

                            <motion.div
                                animate={selectedUser ? { opacity: 1, height: 'auto' } : { opacity: 0.5, height: 'auto' }}
                                className="space-y-4"
                            >
                                <div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="material-icons text-gray-400">work</span>
                                        </div>
                                        <input
                                            type="text"
                                            disabled
                                            value={availableUsers.find(u => u.id === selectedUser)?.role || ''}
                                            placeholder="Cargo (Automático)"
                                            className="block w-full pl-12 pr-4 py-3.5 border-0 rounded-xl bg-gray-100/50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed ring-1 ring-inset ring-gray-200 dark:ring-gray-700 sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="material-icons text-gray-400 group-focus-within:text-primary transition-colors">mail</span>
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="E-mail corporativo (seu@vivaavida.org)"
                                            className="block w-full pl-12 pr-4 py-3.5 border-0 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 ring-1 ring-inset ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary transition-all sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="material-icons text-gray-400 group-focus-within:text-primary transition-colors">lock</span>
                                        </div>
                                        <input
                                            id="password"
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Defina uma senha"
                                            className="block w-full pl-12 pr-4 py-3.5 border-0 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 ring-1 ring-inset ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary transition-all sm:text-sm"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 ml-2">Mínimo de 8 caracteres</p>
                                </div>
                            </motion.div>

                            <div className="pt-4 space-y-4">
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading || !selectedUser}
                                    className="w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Criando Conta...' : 'Finalizar Cadastro'}
                                </motion.button>

                                <div className="text-center pt-2">
                                    <span className="text-sm text-gray-500">Já possui uma conta? </span>
                                    <Link href="/login" className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
                                        Fazer login
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
