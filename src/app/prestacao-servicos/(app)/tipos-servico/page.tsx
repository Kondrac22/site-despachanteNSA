import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ServiceTypesManager from "@/components/prestacao-servicos/ServiceTypesManager";

export default async function TiposServicoPage() {
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

  if (profile?.role !== "admin") {
    redirect("/prestacao-servicos");
  }

  const { data: types } = await supabase
    .from("service_types")
    .select("id, name, active")
    .order("active", { ascending: false })
    .order("name");

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Tipos de Serviço</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as opções que aparecem no formulário de Solicitar
          Serviço.
        </p>
      </div>
      <ServiceTypesManager initialTypes={types ?? []} />
    </div>
  );
}
