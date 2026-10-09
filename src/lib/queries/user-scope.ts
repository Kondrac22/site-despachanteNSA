import { createClient } from "@/lib/supabase/server";

// Administrador vê os dados de todas as unidades (Painel e Estoque); os
// demais usuários, só os da unidade em que trabalham (unitId null = sem
// unidade, não vê nada).
export async function getUserScope(): Promise<
  { isAdmin: true } | { isAdmin: false; unitId: string | null }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, unitId: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, unit_id")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") return { isAdmin: true };
  return { isAdmin: false, unitId: profile?.unit_id ?? null };
}
