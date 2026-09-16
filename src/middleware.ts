import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Protege /prestacao-servicos no nível do servidor (não só no frontend).
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isModuleRoute = pathname.startsWith("/prestacao-servicos");
  const isLoginRoute = pathname === "/prestacao-servicos/login";

  if (isModuleRoute && !isLoginRoute && !user) {
    const loginUrl = new URL("/prestacao-servicos/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && user) {
    const dashboardUrl = new URL("/prestacao-servicos", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ["/prestacao-servicos/:path*"],
};