import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/prestacao-servicos/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, unit_id")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">
        Olá, {profile?.name ?? user.email}
      </h1>
      <p className="text-muted-foreground">
        Perfil: {profile?.role ?? "carregando..."}
      </p>

      <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Placeholder do Dashboard — próxima fase a implementar.
      </div>
    </div>
  );
}