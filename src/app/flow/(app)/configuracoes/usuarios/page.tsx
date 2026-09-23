import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UsersManager from "@/components/flow/UsersManager";

export default async function UsuariosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/flow/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Defesa extra: mesmo que alguém digite a URL direto, só admin passa.
  if (profile?.role !== "admin") {
    redirect("/flow");
  }

  const [{ data: users }, { data: units }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, role, active, unit_id, units ( name )")
      // Ativos primeiro; dentro de cada grupo, ordem alfabética pelo nome.
      .order("active", { ascending: false })
      .order("name", { ascending: true }),
    supabase
      .from("units")
      .select("id, name")
      .eq("active", true)
      .order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Usuários</h2>
        <p className="text-sm text-muted-foreground">
          Criar, ativar/desativar e definir unidade e perfil dos usuários.
        </p>
      </div>

      <UsersManager
        initialUsers={(users ?? []) as any}
        units={units ?? []}
        currentUserId={user.id}
      />
    </div>
  );
}
