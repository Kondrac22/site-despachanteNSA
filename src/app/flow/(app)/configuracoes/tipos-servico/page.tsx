import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ServiceTypesManager from "@/components/flow/ServiceTypesManager";

export default async function TiposServicoPage() {
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

  if (profile?.role !== "admin") {
    redirect("/flow");
  }

  const { data: types } = await supabase
    .from("service_types")
    .select("id, name, active, price, document_checklist")
    .order("active", { ascending: false })
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Tipos de Serviço</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie as opções que aparecem no formulário de Solicitar
          Serviço.
        </p>
      </div>
      <ServiceTypesManager
        initialTypes={(types ?? []).map((t) => ({
          ...t,
          price: Number(t.price ?? 0),
          document_checklist: t.document_checklist ?? [],
        }))}
      />
    </div>
  );
}
