import { createClient } from "@/lib/supabase/server";
import { getUserScope } from "@/lib/queries/user-scope";

export type DashboardFilters = {
  requester?: string;
  unit?: string;
  status?: string;
  serviceType?: string;
  period?: string;
  urgent?: string;
  showFinished?: string;
};

function periodStartDate(period?: string): string | null {
  if (!period) return null;
  const days = Number(period);
  if (!Number.isFinite(days) || days <= 0) return null;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

// Usuário comum só vê os serviços da própria unidade, seja qual for o
// filtro de unidade escolhido. Sem unidade, usa um id que não existe
// (não vê nada).
const NO_UNIT_ID = "00000000-0000-0000-0000-000000000000";

async function scopeFilters(
  filters: DashboardFilters
): Promise<DashboardFilters> {
  const scope = await getUserScope();
  if (scope.isAdmin) return filters;
  return { ...filters, unit: scope.unitId ?? NO_UNIT_ID };
}

function applyBaseFilters(query: any, filters: DashboardFilters) {
  if (filters.requester) query = query.eq("created_by", filters.requester);
  if (filters.unit) query = query.eq("unit_id", filters.unit);
  if (filters.serviceType)
    query = query.eq("service_type_id", filters.serviceType);
  if (filters.urgent === "1")
    query = query.eq("is_urgent", true).neq("status", "FINALIZADO");

  const startDate = periodStartDate(filters.period);
  if (startDate) query = query.gte("requested_at", startDate);

  return query;
}

export async function getFilterOptions() {
  const supabase = await createClient();

  const [{ data: units }, { data: serviceTypes }, { data: requesters }] =
    await Promise.all([
      supabase.from("units").select("id, name").eq("active", true).order("name"),
      supabase
        .from("service_types")
        .select("id, name")
        .eq("active", true)
        .order("name"),
      supabase
        .from("profiles")
        .select("id, name")
        .eq("active", true)
        .order("name"),
    ]);

  return {
    units: units ?? [],
    serviceTypes: serviceTypes ?? [],
    requesters: requesters ?? [],
  };
}

export async function getDashboardIndicators(
  requestedFilters: DashboardFilters
) {
  const supabase = await createClient();
  const filters = await scopeFilters(requestedFilters);

  async function countByStatus(status?: string) {
    let query = supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true });
    query = applyBaseFilters(query, filters);
    if (status) query = query.eq("status", status);
    const { count } = await query;
    return count ?? 0;
  }

  async function countUrgentOpen() {
    let query = supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true });
    query = applyBaseFilters(query, filters);
    query = query.eq("is_urgent", true).neq("status", "FINALIZADO");
    const { count } = await query;
    return count ?? 0;
  }

  // A view current_vehicle_stock já devolve só os veículos em estoque.
  // Usuário comum conta só o estoque da própria unidade.
  async function countVehiclesInStock() {
    const scope = await getUserScope();
    if (!scope.isAdmin && !scope.unitId) return 0;
    let query = supabase
      .from("current_vehicle_stock")
      .select("vehicle_id", { count: "exact", head: true });
    if (!scope.isAdmin) query = query.eq("unit_id", scope.unitId);
    const { count } = await query;
    return count ?? 0;
  }

  const [parado, aFazer, pendenteDocumento, urgentes, vehiclesInStock] =
    await Promise.all([
      countByStatus("PARADO"),
      countByStatus("A_FAZER"),
      countByStatus("PENDENTE_DOCUMENTO"),
      countUrgentOpen(),
      countVehiclesInStock(),
    ]);

  return {
    parado,
    aFazer,
    pendenteDocumento,
    urgentes,
    vehiclesInStock,
  };
}

export async function getRecentServiceRequests(
  requestedFilters: DashboardFilters
) {
  const supabase = await createClient();
  const filters = await scopeFilters(requestedFilters);

  let query = supabase
    .from("service_requests")
    .select(
      `id, plate, protocol, status, requested_at, finished_at, stopped_reason,
       is_urgent,
       service_types ( name ),
       profiles!service_requests_created_by_fkey ( name ),
       units ( name )`
    )
    .order("requested_at", { ascending: false })
    .limit(10);

  query = applyBaseFilters(query, filters);
  // Finalizados ficam escondidos, a menos que o usuário peça para vê-los
  // (botão "Mostrar finalizados" ou filtro de status).
  if (filters.status) query = query.eq("status", filters.status);
  else if (filters.showFinished !== "1")
    query = query.neq("status", "FINALIZADO");

  const { data, error } = await query;
  if (error) {
    console.error("getRecentServiceRequests error:", error.message);
    return [];
  }
  return data ?? [];
}
