import { createClient } from "@/lib/supabase/server";

export type FinancialServiceRow = {
  id: string;
  protocol: string | null;
  plate: string;
  finishedAt: string;
  serviceTypeName: string | null;
  unitName: string | null;
  chargedAmount: number | null;
};

export type FinancialUnitTotal = {
  unitName: string;
  count: number;
  total: number;
};

export const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function currentYearMonth() {
  // Mês atual no horário de Brasília (o servidor roda em UTC).
  const [year, month] = new Date()
    .toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" })
    .split("-")
    .map(Number);
  return { year, month };
}

// Lê o mês/ano do filtro (?month=&year=); valor ausente ou inválido vira
// o mês atual. Usado pela página e pela exportação, pra baterem sempre.
export function resolvePeriod(params: {
  month?: string | null;
  year?: string | null;
}) {
  const now = currentYearMonth();
  const month = Number(params.month);
  const year = Number(params.year);
  return {
    currentYear: now.year,
    month:
      Number.isInteger(month) && month >= 1 && month <= 12 ? month : now.month,
    year:
      Number.isInteger(year) && year >= 2000 && year <= now.year + 1
        ? year
        : now.year,
  };
}

// O Brasil não tem mais horário de verão, então o fuso é sempre -03:00.
function monthRange(year: number, month: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return {
    start: `${year}-${pad(month)}-01T00:00:00-03:00`,
    end: `${nextYear}-${pad(nextMonth)}-01T00:00:00-03:00`,
  };
}

export async function getFinancialReport(year: number, month: number) {
  const supabase = await createClient();
  const { start, end } = monthRange(year, month);

  const { data, error } = await supabase
    .from("service_requests")
    .select(
      `id, protocol, plate, finished_at, charged_amount,
       service_types ( name ),
       units ( name )`
    )
    .eq("status", "FINALIZADO")
    .gte("finished_at", start)
    .lt("finished_at", end)
    .order("finished_at", { ascending: false });

  if (error) {
    console.error("getFinancialReport error:", error.message);
    return { rows: [], unitTotals: [], total: 0, missingPriceCount: 0 };
  }

  const rows: FinancialServiceRow[] = (data ?? []).map((r: any) => ({
    id: r.id,
    protocol: r.protocol,
    plate: r.plate,
    finishedAt: r.finished_at,
    serviceTypeName: r.service_types?.name ?? null,
    unitName: r.units?.name ?? null,
    chargedAmount: r.charged_amount == null ? null : Number(r.charged_amount),
  }));

  const byUnit = new Map<string, FinancialUnitTotal>();
  let total = 0;
  let missingPriceCount = 0;

  for (const row of rows) {
    const amount = row.chargedAmount ?? 0;
    if (row.chargedAmount == null) missingPriceCount++;
    total += amount;

    const unitName = row.unitName ?? "Sem unidade";
    const unit = byUnit.get(unitName) ?? { unitName, count: 0, total: 0 };
    unit.count++;
    unit.total += amount;
    byUnit.set(unitName, unit);
  }

  const unitTotals = [...byUnit.values()].sort((a, b) => b.total - a.total);

  return { rows, unitTotals, total, missingPriceCount };
}
