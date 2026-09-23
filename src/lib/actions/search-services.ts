"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchResult = {
  id: string;
  plate: string;
  protocol: string | null;
  status: string;
  isUrgent: boolean;
  serviceTypeName: string | null;
  requestedAt: string;
};

const MAX_RESULTS = 10;

// Busca por placa ou protocolo. Não filtra por unidade aqui: a RLS de
// service_requests já limita o resultado ao que o usuário pode ver.
export async function searchServices(rawTerm: string): Promise<SearchResult[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Placa é gravada sem hífen ("ABC1234"); protocolo tem hífen ("MTZ-0001").
  // Só letras, números e hífen passam — isso também evita que o termo
  // quebre a sintaxe do filtro "or" do PostgREST.
  const protocolTerm = rawTerm.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const plateTerm = protocolTerm.replace(/-/g, "");
  if (plateTerm.length < 2) return [];

  const { data, error } = await supabase
    .from("service_requests")
    .select(
      `id, plate, protocol, status, is_urgent, requested_at,
       service_types ( name )`
    )
    .or(`plate.ilike.%${plateTerm}%,protocol.ilike.%${protocolTerm}%`)
    .order("requested_at", { ascending: false })
    .limit(MAX_RESULTS);

  if (error) {
    console.error("searchServices error:", error.message);
    return [];
  }

  return (data ?? []).map((r: any) => ({
    id: r.id,
    plate: r.plate,
    protocol: r.protocol,
    status: r.status,
    isUrgent: r.is_urgent,
    serviceTypeName: r.service_types?.name ?? null,
    requestedAt: r.requested_at,
  }));
}
