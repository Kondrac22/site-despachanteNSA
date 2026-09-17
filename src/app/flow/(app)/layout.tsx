import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ModuleNav from "@/components/flow/ModuleNav";

export default async function PrestacaoServicosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A tela de login não deve ter essa navegação nem exigir usuário logado
  // (o middleware já cuida do redirect; aqui só evitamos quebrar o layout
  // quando, por algum motivo, a página renderiza sem usuário).
  if (!user) {
    redirect("/flow/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-muted/20">
      <ModuleNav
        isAdmin={profile?.role === "admin"}
        userName={profile?.name ?? user.email ?? ""}
      />
      <main>{children}</main>
    </div>
  );
}
