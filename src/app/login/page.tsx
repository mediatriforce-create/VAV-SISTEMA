'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <div className="font-display bg-background-light dark:bg-background-dark min-h-screen w-full relative overflow-y-auto flex items-center justify-center py-8">
            {/* Simple Background for Performance */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-orange-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-md px-4"
            >
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/30">
                    <div className="pt-10 pb-6 px-8 text-center relative">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg mb-4 text-white"
                        >
                            <span className="material-icons text-3xl">volunteer_activism</span>
                        </motion.div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Bem-vindo de volta
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                            Acesse a Central Viva a Vida
                        </p>
                    </div>

                    <div className="px-8 pb-10">
                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-red-50 text-red-500 text-sm p-3 rounded-lg border border-red-100"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div className="space-y-4">
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
                                            placeholder="E-mail corporativo"
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
                                            placeholder="Senha"
                                            className="block w-full pl-12 pr-4 py-3.5 border-0 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 ring-1 ring-inset ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary transition-all sm:text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 space-y-4">
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70"
                                >
                                    {loading ? 'Entrando...' : 'Entrar'}
                                </motion.button>

                                <div className="text-center pt-2">
                                    <span className="text-sm text-gray-500">Não tem uma conta? </span>
                                    <Link href="/signup" className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
                                        Criar agora
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
