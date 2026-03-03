import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        // Return a mock object to prevent build failures during prerendering
        console.warn('Supabase env vars missing. Returning mock client for build.');
        return {
            from: () => ({ select: () => ({ order: () => ({ data: [], error: null }) }) }),
            auth: { getSession: async () => ({ data: { session: null }, error: null }) }
        } as any;
    }

    return createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value },
                set(name: string, value: string, options: CookieOptions) {
                    try { cookieStore.set({ name, value, ...options }) } catch (error) {}
                },
                remove(name: string, options: CookieOptions) {
                    try { cookieStore.set({ name, value: '', ...options }) } catch (error) {}
                },
            },
        }
    )
}
