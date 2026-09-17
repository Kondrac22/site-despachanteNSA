import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// FASE 13: protege /flow no nível do servidor (não só no frontend).
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
  const isModuleRoute = pathname.startsWith("/flow");
  const isLoginRoute = pathname === "/flow/login";

  if (isModuleRoute && !isLoginRoute && !user) {
    const loginUrl = new URL("/flow/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Usuário está logado, mas pode ter sido desativado depois do login —
  // checa a cada navegação e derruba a sessão se for o caso.
  if (isModuleRoute && !isLoginRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("active")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.active) {
      await supabase.auth.signOut();
      const loginUrl = new URL("/flow/login", request.url);
      loginUrl.searchParams.set("inactive", "1");
      const redirectResponse = NextResponse.redirect(loginUrl);
      // Copia pra resposta de redirect os cookies que o signOut() acabou
      // de limpar (senão a sessão "morta" continuaria valendo).
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });
      return redirectResponse;
    }
  }

  if (isLoginRoute && user) {
    const dashboardUrl = new URL("/flow", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ["/flow/:path*"],
};
