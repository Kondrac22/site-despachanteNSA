import { createClient } from "@/lib/supabase/server";
import SolicitarServicoForm from "@/components/flow/SolicitarServicoForm";

export default async function SolicitarServicoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: serviceTypes }, { data: profile }, { data: userUnits }] =
    await Promise.all([
    supabase
      .from("service_types")
      .select("id, name, document_checklist")
      .eq("active", true)
      .order("name"),
    user
      ? supabase
          .from("profiles")
          .select("role, unit_id")
          .eq("id", user.id)
          .single()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("profile_units")
          .select("units ( id, name )")
          .eq("profile_id", user.id)
      : Promise.resolve({ data: null }),
  ]);

  const units = (userUnits ?? [])
    .map((row: any) => row.units as { id: string; name: string } | null)
    .filter((u): u is { id: string; name: string } => u !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

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
        units={units}
        defaultUnitId={profile?.unit_id ?? undefined}
      />
    </div>
  );
}