import { createClient } from "@/lib/supabase/server";

export type ServiceListFilters = {
  plate?: string;
  requester?: string;
  unit?: string;
  status?: string;
  serviceType?: string;
  period?: string;
  urgent?: string;
};

export type ServiceListSort =
  | "recent"
  | "oldest"
  | "plate_asc"
  | "plate_desc"
  | "status";

function periodStartDate(period?: string): string | null {
  if (!period) return null;
  const days = Number(period);
  if (!Number.isFinite(days) || days <= 0) return null;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export async function getServiceRequestsList(
  filters: ServiceListFilters,
  sort: ServiceListSort,
  page: number,
  pageSize = 20
) {
  const supabase = await createClient();

  let query = supabase
    .from("service_requests")
    .select(
      `id, plate, protocol, status, requested_at, finished_at, stopped_reason,
       is_urgent,
       service_types ( name ),
       profiles!service_requests_created_by_fkey ( name ),
       units ( name )`,
      { count: "exact" }
    );

  if (filters.plate) query = query.ilike("plate", `%${filters.plate}%`);
  if (filters.requester) query = query.eq("created_by", filters.requester);
  if (filters.unit) query = query.eq("unit_id", filters.unit);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.serviceType)
    query = query.eq("service_type_id", filters.serviceType);
  // "Urgentes" = urgentes ainda em aberto (finalizado não precisa mais de
  // atenção).
  if (filters.urgent === "1")
    query = query.eq("is_urgent", true).neq("status", "FINALIZADO");

  const startDate = periodStartDate(filters.period);
  if (startDate) query = query.gte("requested_at", startDate);

  switch (sort) {
    case "oldest":
      query = query.order("requested_at", { ascending: true });
      break;
    case "plate_asc":
      query = query.order("plate", { ascending: true });
      break;
    case "plate_desc":
      query = query.order("plate", { ascending: false });
      break;
    case "status":
      query = query.order("status", { ascending: true });
      break;
    case "recent":
    default:
      query = query.order("requested_at", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) {
    console.error("getServiceRequestsList error:", error.message);
    return { rows: [], total: 0 };
  }

  return { rows: data ?? [], total: count ?? 0 };
}

export async function getServiceRequestDetail(id: string) {
  const supabase = await createClient();

  const { data: serviceRequest, error } = await supabase
    .from("service_requests")
    .select(
      `id, plate, protocol, status, notes, requested_at, finished_at, created_at,
       stopped_reason, charged_amount, is_urgent,
       service_types ( id, name ),
       profiles!service_requests_created_by_fkey ( id, name ),
       units ( id, name )`
    )
    .eq("id", id)
    .single();

  if (error || !serviceRequest) return null;

  const [{ data: files }, { data: history }] = await Promise.all([
    supabase
      .from("service_files")
      .select(
        "id, original_name, storage_path, mime_type, size_bytes, created_at"
      )
      .eq("service_request_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("service_history")
      .select(
        `id, action, description, old_value, new_value, created_at,
         profiles ( name )`
      )
      .eq("service_request_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const filesWithUrls = await Promise.all(
    (files ?? []).map(async (file) => {
      const { data: signed } = await supabase.storage
        .from("service-documents")
        .createSignedUrl(file.storage_path, 60 * 5);
      return { ...file, url: signed?.signedUrl ?? null };
    })
  );

  return { serviceRequest, files: filesWithUrls, history: history ?? [] };
}
