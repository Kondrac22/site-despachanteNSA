import { createClient } from "@supabase/supabase-js";

// Cliente com privilégios de administrador — só pode ser usado dentro de
// Server Actions ou Route Handlers, NUNCA em um arquivo "use client".
// A SUPABASE_SERVICE_ROLE_KEY ignora todas as regras de RLS, então ela
// nunca deve ter o prefixo NEXT_PUBLIC_ nem aparecer no navegador.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada. Veja o guia de integração desta fase."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
