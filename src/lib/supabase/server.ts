import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente para uso em Server Components, Server Actions e Route Handlers.
// Nunca importe isto em um arquivo com "use client".
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado a partir de um Server Component sem permissão de escrita.
            // Tudo bem ignorar aqui: o middleware já cuida de renovar a sessão.
          }
        },
      },
    }
  );
}