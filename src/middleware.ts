import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Instancia o cliente do Supabase adaptado para o Edge / Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Atualiza a sessão e recupera o usuário logado
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const isAuthRoute = url.pathname.startsWith('/prestacao-servicos/login')
  const isProtectedRoute = url.pathname.startsWith('/prestacao-servicos')

  // Redireciona se não estiver logado
  if (!user && isProtectedRoute && !isAuthRoute) {
    url.pathname = '/prestacao-servicos/login'
    return NextResponse.redirect(url)
  }

  // Redireciona para o dashboard se já estiver logado
  if (user && isAuthRoute) {
    url.pathname = '/prestacao-servicos'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/prestacao-servicos/:path*'],
}