import { createClient } from "@/lib/supabase/server";

// Administrador vê os dados de todas as unidades (Painel e Estoque); os
// demais usuários, só os das unidades em que trabalham (lista vazia =
// sem unidade, não vê nada).
export async function getUserScope(): Promise<
  { isAdmin: true } | { isAdmin: false; unitIds: string[] }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, unitIds: [] };

  const [{ data: profile }, { data: units }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase.from("profile_units").select("unit_id").eq("profile_id", user.id),
  ]);

  if (profile?.role === "admin") return { isAdmin: true };
  return { isAdmin: false, unitIds: (units ?? []).map((u) => u.unit_id) };
}
