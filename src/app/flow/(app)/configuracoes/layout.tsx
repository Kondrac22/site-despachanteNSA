import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsTabs from "@/components/flow/SettingsTabs";

export default async function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // Cada página continua checando também — o layout não roda de novo
  // quando se navega entre as abas.
  if (profile?.role !== "admin") {
    redirect("/flow");
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Usuários, tipos de serviço e unidades do sistema.
        </p>
      </div>
      <SettingsTabs />
      {children}
    </div>
  );
}
