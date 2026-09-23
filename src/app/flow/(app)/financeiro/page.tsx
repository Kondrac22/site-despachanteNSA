import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";
import {
  MONTHS,
  getFinancialReport,
  resolvePeriod,
} from "@/lib/queries/financial";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/flow/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/flow");
  }

  const params = await searchParams;
  const {
    month: selectedMonth,
    year: selectedYear,
    currentYear,
  } = resolvePeriod(params);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const { rows, unitTotals, total, missingPriceCount } =
    await getFinancialReport(selectedYear, selectedMonth);

  const periodLabel = `${MONTHS[selectedMonth - 1]} de ${selectedYear}`;

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Valores dos serviços finalizados no período, por unidade.
          </p>
        </div>
        {/* <a> em vez de <Link>: é um download, não uma navegação. */}
        <Button asChild variant="outline">
          <a
            href={`/flow/financeiro/exportar?month=${selectedMonth}&year=${selectedYear}`}
            download
          >
            Exportar para Excel
          </a>
        </Button>
      </div>

      <form className="flex flex-wrap gap-2" action="/flow/financeiro">
        <Select name="month" defaultValue={String(selectedMonth)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((name, index) => (
              <SelectItem key={name} value={String(index + 1)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="year" defaultValue={String(selectedYear)}>
          <SelectTrigger className="w-full sm:w-[120px]">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div className="rounded-lg border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total — {periodLabel}</p>
          <p className="mt-1 text-3xl font-bold text-primary">
            {formatCurrency(total)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {rows.length} serviço{rows.length === 1 ? "" : "s"} finalizado
            {rows.length === 1 ? "" : "s"}
          </p>
        </div>
        {unitTotals.map((unit) => (
          <div
            key={unit.unitName}
            className="rounded-lg border bg-background p-4 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{unit.unitName}</p>
            <p className="mt-1 text-3xl font-bold">
              {formatCurrency(unit.total)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {unit.count} serviço{unit.count === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>

      {missingPriceCount > 0 && (
        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          {missingPriceCount} serviço{missingPriceCount === 1 ? "" : "s"}{" "}
          deste período não {missingPriceCount === 1 ? "tem" : "têm"} valor
          registrado (foram finalizados antes do cadastro de valores) e
          {missingPriceCount === 1 ? " entra" : " entram"} no total como R$ 0,00.
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3">Protocolo</th>
              <th className="p-3">Placa</th>
              <th className="p-3">Serviço</th>
              <th className="p-3">Unidade</th>
              <th className="p-3">Finalizado em</th>
              <th className="p-3 text-right">Valor</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-6 text-center text-muted-foreground"
                >
                  Nenhum serviço finalizado em {periodLabel}.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="p-3 font-mono text-xs">
                  {row.protocol ?? "—"}
                </td>
                <td className="p-3 font-medium">{row.plate}</td>
                <td className="p-3">{row.serviceTypeName ?? "—"}</td>
                <td className="p-3">{row.unitName ?? "—"}</td>
                <td className="p-3">{formatDate(row.finishedAt)}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  {row.chargedAmount == null
                    ? "—"
                    : formatCurrency(row.chargedAmount)}
                </td>
                <td className="p-3">
                  <Link
                    href={`/flow/servicos/${row.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
