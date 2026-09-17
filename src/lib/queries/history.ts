import { createClient } from "@/lib/supabase/server";

export type GlobalHistoryFilters = {
  userId?: string;
  action?: string;
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

export async function getGlobalHistory(
  filters: GlobalHistoryFilters,
  page: number,
  pageSize = 30
) {
  const supabase = await createClient();

  // Não precisa filtrar por unidade aqui: a RLS de service_history já
  // limita automaticamente o que cada usuário pode ver (admin vê tudo;
  // usuário comum só vê o que é da própria unidade ou que ele criou).
  let query = supabase
    .from("service_history")
    .select(
      `id, action, description, old_value, new_value, created_at,
       profiles ( name ),
       service_requests ( id, plate )`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.action) query = query.eq("action", filters.action);

  const startDate = periodStartDate(filters.period);
  if (startDate) query = query.gte("created_at", startDate);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) {
    console.error("getGlobalHistory error:", error.message);
    return { rows: [], total: 0 };
  }

  return { rows: data ?? [], total: count ?? 0 };
}
