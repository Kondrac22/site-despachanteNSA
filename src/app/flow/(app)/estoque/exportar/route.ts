import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStockList } from "@/lib/queries/vehicles";
import { buildCsv, csvDateTime, csvResponse, todayInBrazil } from "@/lib/csv";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const rows = await getCurrentStockList();

  const csv = buildCsv([
    [
      "Placa",
      "Protocolo",
      "Unidade",
      "Data de Entrada",
      "Tipo de Serviço",
      "Responsável",
      "Situação",
    ],
    ...rows.map((row) => [
      row.plate,
      row.protocol ?? "",
      row.unit_name ?? "",
      csvDateTime(row.entry_at),
      row.service_type_name ?? "",
      row.responsible_name ?? "",
      "Em estoque",
    ]),
  ]);

  return csvResponse(csv, `estoque-${todayInBrazil()}.csv`);
}
