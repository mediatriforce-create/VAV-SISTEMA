import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasPermission, type Module } from '@/lib/permissions'

// Mapeia prefixos de rota -> Module do permissions.ts.
// Rotas nao listadas aqui ficam liberadas para qualquer usuario autenticado
// (ex: /dashboard, /dashboard/area-pessoal).
// IMPORTANTE: prefixos mais especificos primeiro.
const ROUTE_GUARDS: { prefix: string; module: Module }[] = [
    { prefix: '/dashboard/admin', module: 'administracao' },
    { prefix: '/dashboard/aprovacoes', module: 'coordenacao' },
    { prefix: '/dashboard/calendario', module: 'calendario' },
    { prefix: '/dashboard/chat', module: 'chat' },
    { prefix: '/dashboard/configuracoes', module: 'configuracoes' },
    { prefix: '/dashboard/mural', module: 'comunicacao' },
    { prefix: '/dashboard/pedagogia', module: 'pedagogia' },
    { prefix: '/dashboard/reunioes', module: 'reunioes' },
    { prefix: '/comunicacao', module: 'comunicacao' },
    { prefix: '/coord', module: 'coordenacao' },
]

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: { name: string; value: string; options: Parameters<typeof supabaseResponse.cookies.set>[2] }[]) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    const isProtectedArea =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/comunicacao') ||
        pathname.startsWith('/coord')

    // Bloqueia anonimos em qualquer area autenticada
    if (isProtectedArea && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Logado: aplica guard de role baseado no Module da rota
    if (user && isProtectedArea) {
        const guard = ROUTE_GUARDS.find(g => pathname.startsWith(g.prefix))
        if (guard) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            const role = profile?.role
            if (!role || !hasPermission(role, guard.module)) {
                // Sem permissao: manda pro dashboard com flag para UI mostrar toast
                const url = request.nextUrl.clone()
                url.pathname = '/dashboard'
                url.searchParams.set('forbidden', guard.module)
                return NextResponse.redirect(url)
            }
        }
    }

    // Logado em /login ou /signup: redireciona pro dashboard
    if ((pathname.startsWith('/login') || pathname.startsWith('/signup')) && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
