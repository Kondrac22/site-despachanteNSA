import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UnitsManager from "@/components/flow/UnitsManager";

export default async function UnidadesPage() {
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

  const { data: units } = await supabase
    .from("units")
    .select("id, name, code, active")
    .order("active", { ascending: false })
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Unidades</h2>
        <p className="text-sm text-muted-foreground">
          Cada unidade tem um código curto usado no número de protocolo dos
          serviços (ex: MTZ-0001).
        </p>
      </div>
      <UnitsManager initialUnits={units ?? []} />
    </div>
  );
}
