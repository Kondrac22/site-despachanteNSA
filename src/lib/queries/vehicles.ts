import { createClient } from "@/lib/supabase/server";
import { getUserScope } from "@/lib/queries/user-scope";

export type CurrentStockRow = {
  vehicle_id: string;
  plate: string;
  entry_at: string;
  service_request_id: string | null;
  protocol: string | null;
  unit_id: string | null;
  unit_name: string | null;
  service_type_name: string | null;
  responsible_name: string | null;
};

// A unidade de um veículo em estoque é a unidade do serviço que deu a
// entrada nele (o veículo em si não pertence a nenhuma unidade).
export async function getCurrentStockList(
  plateFilter?: string,
  unitFilter?: string,
  limit?: number
): Promise<CurrentStockRow[]> {
  const scope = await getUserScope();
  if (!scope.isAdmin) {
    if (!scope.unitId) return [];
    unitFilter = scope.unitId;
  }

  const supabase = await createClient();

  // A view current_vehicle_stock (supabase/estoque-atual.sql) já calcula
  // no banco o último movimento de cada veículo e devolve só os em estoque.
  let query = supabase
    .from("current_vehicle_stock")
    .select("*")
    .order("entry_at", { ascending: false });

  if (plateFilter) {
    query = query.ilike("plate", `%${plateFilter.trim().toUpperCase()}%`);
  }
  if (unitFilter) query = query.eq("unit_id", unitFilter);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error("getCurrentStockList error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...row,
    plate: row.plate ?? "—",
  })) as CurrentStockRow[];
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
