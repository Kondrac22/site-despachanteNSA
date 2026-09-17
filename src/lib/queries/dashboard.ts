import { createClient } from "@/lib/supabase/server";

export type DashboardFilters = {
  requester?: string;
  unit?: string;
  status?: string;
  serviceType?: string;
  period?: string;
};

function periodStartDate(period?: string): string | null {
  if (!period) return null;
  const days = Number(period);
  if (!Number.isFinite(days) || days <= 0) return null;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function applyBaseFilters(query: any, filters: DashboardFilters) {
  if (filters.requester) query = query.eq("created_by", filters.requester);
  if (filters.unit) query = query.eq("unit_id", filters.unit);
  if (filters.serviceType)
    query = query.eq("service_type_id", filters.serviceType);

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

export async function getDashboardIndicators(filters: DashboardFilters) {
  const supabase = await createClient();

  async function countByStatus(status?: string) {
    let query = supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true });
    query = applyBaseFilters(query, filters);
    if (status) query = query.eq("status", status);
    const { count } = await query;
    return count ?? 0;
  }

  const [parado, aFazer, finalizado, total] = await Promise.all([
    countByStatus("PARADO"),
    countByStatus("A_FAZER"),
    countByStatus("FINALIZADO"),
    countByStatus(),
  ]);

  const { data: movements } = await supabase
    .from("vehicle_movements")
    .select("vehicle_id, movement_type, created_at")
    .order("created_at", { ascending: false });

  const lastMovementByVehicle = new Map<string, string>();
  for (const m of movements ?? []) {
    if (!lastMovementByVehicle.has(m.vehicle_id)) {
      lastMovementByVehicle.set(m.vehicle_id, m.movement_type);
    }
  }
  const vehiclesInStock = [...lastMovementByVehicle.values()].filter(
    (type) => type === "ENTRY"
  ).length;

  return { parado, aFazer, finalizado, total, vehiclesInStock };
}

export async function getRecentServiceRequests(filters: DashboardFilters) {
  const supabase = await createClient();

  let query = supabase
    .from("service_requests")
    .select(
      `id, plate, protocol, status, requested_at, finished_at, stopped_reason,
       service_types ( name ),
       profiles!service_requests_created_by_fkey ( name ),
       units ( name )`
    )
    .order("requested_at", { ascending: false })
    .limit(10);

  query = applyBaseFilters(query, filters);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) {
    console.error("getRecentServiceRequests error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getCurrentStock(limit = 10) {
  const supabase = await createClient();

  const { data: movements, error } = await supabase
    .from("vehicle_movements")
    .select(
      `vehicle_id, movement_type, created_at,
       vehicles ( plate ),
       profiles!vehicle_movements_user_id_fkey ( name )`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getCurrentStock error:", error.message);
    return [];
  }

  const lastByVehicle = new Map<string, (typeof movements)[number]>();
  for (const m of movements ?? []) {
    if (!lastByVehicle.has(m.vehicle_id)) lastByVehicle.set(m.vehicle_id, m);
  }

  return [...lastByVehicle.values()]
    .filter((m) => m.movement_type === "ENTRY")
    .slice(0, limit);
}
