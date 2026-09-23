import { createClient } from "@/lib/supabase/server";
import SolicitarServicoForm from "@/components/flow/SolicitarServicoForm";

export default async function SolicitarServicoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: serviceTypes }, { data: profile }] = await Promise.all([
    supabase
      .from("service_types")
      .select("id, name, document_checklist")
      .eq("active", true)
      .order("name"),
    user
      ? supabase.from("profiles").select("role").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <SolicitarServicoForm
        serviceTypes={(serviceTypes ?? []).map((t) => ({
          ...t,
          document_checklist: t.document_checklist ?? [],
        }))}
        isAdmin={profile?.role === "admin"}
        todayIso={today}
      />
    </div>
  );
}