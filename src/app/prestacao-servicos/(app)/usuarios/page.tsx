import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UsersManager from "@/components/prestacao-servicos/UsersManager";

export default async function UsuariosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/prestacao-servicos/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Defesa extra: mesmo que alguém digite a URL direto, só admin passa.
  if (profile?.role !== "admin") {
    redirect("/prestacao-servicos");
  }

  const [{ data: users }, { data: units }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, role, active, unit_id, units ( name )")
      .order("name"),
    supabase
      .from("units")
      .select("id, name")
      .eq("active", true)
      .order("name"),
  ]);

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Usuários</h1>
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
