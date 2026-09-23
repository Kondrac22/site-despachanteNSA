import { createClient } from "@/lib/supabase/server";

export type CurrentStockRow = {
  vehicle_id: string;
  plate: string;
  entry_at: string;
  service_request_id: string | null;
  protocol: string | null;
  service_type_name: string | null;
  responsible_name: string | null;
};

export async function getCurrentStockList(
  plateFilter?: string
): Promise<CurrentStockRow[]> {
  const supabase = await createClient();

  const { data: movements, error } = await supabase
    .from("vehicle_movements")
    .select(
      `vehicle_id, movement_type, created_at, service_request_id,
       vehicles ( plate ),
       profiles!vehicle_movements_user_id_fkey ( name ),
       service_requests ( protocol, service_types ( name ) )`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getCurrentStockList error:", error.message);
    return [];
  }

  // Fica só com o movimento mais recente de cada veículo.
  const lastByVehicle = new Map<string, any>();
  for (const m of movements ?? []) {
    if (!lastByVehicle.has(m.vehicle_id)) lastByVehicle.set(m.vehicle_id, m);
  }

  let rows: CurrentStockRow[] = [...lastByVehicle.values()]
    .filter((m) => m.movement_type === "ENTRY")
    .map((m) => ({
      vehicle_id: m.vehicle_id,
      plate: m.vehicles?.plate ?? "—",
      entry_at: m.created_at,
      service_request_id: m.service_request_id,
      protocol: m.service_requests?.protocol ?? null,
      service_type_name: m.service_requests?.service_types?.name ?? null,
      responsible_name: m.profiles?.name ?? null,
    }));

  if (plateFilter) {
    const normalized = plateFilter.trim().toUpperCase();
    rows = rows.filter((r) => r.plate.includes(normalized));
  }

  rows.sort(
    (a, b) => new Date(b.entry_at).getTime() - new Date(a.entry_at).getTime()
  );

  return rows;
}

export type VehicleMovementEntry = {
  id: string;
  movementType: "ENTRY" | "EXIT";
  createdAt: string;
  serviceRequestId: string | null;
  serviceTypeName: string | null;
  responsibleName: string | null;
  isDuplicateEntry: boolean;
};

export type VehicleStay = {
  entry: VehicleMovementEntry;
  exit: VehicleMovementEntry | null;
  durationDays: number | null;
};

export async function getVehicleHistoryByPlate(rawPlate: string) {
  const supabase = await createClient();
  const plate = rawPlate.trim().toUpperCase();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, plate")
    .eq("plate", plate)
    .maybeSingle();

  if (!vehicle) return null;

  const { data: movements, error } = await supabase
    .from("vehicle_movements")
    .select(
      `id, movement_type, created_at, service_request_id, is_duplicate_entry,
       profiles!vehicle_movements_user_id_fkey ( name ),
       service_requests ( id, service_types ( name ) )`
    )
    .eq("vehicle_id", vehicle.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getVehicleHistoryByPlate error:", error.message);
    return { vehicle, stays: [] };
  }

  const list: VehicleMovementEntry[] = (movements ?? []).map((m: any) => ({
    id: m.id,
    movementType: m.movement_type,
    createdAt: m.created_at,
    serviceRequestId: m.service_request_id,
    serviceTypeName: m.service_requests?.service_types?.name ?? null,
    responsibleName: m.profiles?.name ?? null,
    isDuplicateEntry: m.is_duplicate_entry,
  }));

  // Pareia cada ENTRY com o EXIT seguinte, formando "permanências".
  const stays: VehicleStay[] = [];
  let openEntry: VehicleMovementEntry | null = null;

  for (const movement of list) {
    if (movement.movementType === "ENTRY") {
      if (openEntry) {
        stays.push({ entry: openEntry, exit: null, durationDays: null });
      }
      openEntry = movement;
    } else {
      if (openEntry) {
        const ms =
          new Date(movement.createdAt).getTime() -
          new Date(openEntry.createdAt).getTime();
        stays.push({
          entry: openEntry,
          exit: movement,
          durationDays: Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24))),
        });
        openEntry = null;
      } else {
        stays.push({ entry: movement, exit: null, durationDays: null });
      }
    }
  }
  if (openEntry) {
    stays.push({ entry: openEntry, exit: null, durationDays: null });
  }

  stays.reverse();

  return { vehicle, stays };
}
