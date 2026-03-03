import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase env vars missing. Returning mock client for build.');
        return {
            from: () => ({ select: () => ({ order: () => ({ data: [], error: null }) }) }),
            auth: { getSession: async () => ({ data: { session: null }, error: null }) }
        } as any;
    }

    return createBrowserClient(supabaseUrl, supabaseKey)
}
