import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  MONTHS,
  getFinancialReport,
  resolvePeriod,
} from "@/lib/queries/financial";
import { buildCsv, csvDateTime, csvNumber, csvResponse } from "@/lib/csv";

// Exporta exatamente o período filtrado na tela do Financeiro.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const searchParams = new URL(request.url).searchParams;
  const { month, year } = resolvePeriod({
    month: searchParams.get("month"),
    year: searchParams.get("year"),
  });

  const { rows, unitTotals, total } = await getFinancialReport(year, month);
  const periodLabel = `${MONTHS[month - 1]} de ${year}`;

  const csv = buildCsv([
    [`Relatório financeiro — ${periodLabel}`],
    [],
    ["Protocolo", "Placa", "Serviço", "Unidade", "Finalizado em", "Valor (R$)"],
    ...rows.map((row) => [
      row.protocol ?? "",
      row.plate,
      row.serviceTypeName ?? "",
      row.unitName ?? "",
      csvDateTime(row.finishedAt),
      row.chargedAmount == null ? "" : csvNumber(row.chargedAmount),
    ]),
    [],
    ["Total por unidade", "Serviços", "Valor (R$)"],
    ...unitTotals.map((unit) => [
      unit.unitName,
      String(unit.count),
      csvNumber(unit.total),
    ]),
    ["Total geral", String(rows.length), csvNumber(total)],
  ]);

  const mm = String(month).padStart(2, "0");
  return csvResponse(csv, `financeiro-${year}-${mm}.csv`);
}
