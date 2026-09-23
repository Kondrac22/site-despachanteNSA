import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFilterOptions } from "@/lib/queries/dashboard";
import {
  getCurrentStockList,
  type CurrentStockRow,
} from "@/lib/queries/vehicles";

const ALL = "TODOS";
const NO_UNIT = "Sem unidade";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

function groupByUnit(rows: CurrentStockRow[]) {
  const groups = new Map<string, CurrentStockRow[]>();
  for (const row of rows) {
    const unitName = row.unit_name ?? NO_UNIT;
    groups.set(unitName, [...(groups.get(unitName) ?? []), row]);
  }
  // Ordem alfabética, com "Sem unidade" sempre por último.
  return [...groups.entries()].sort(([a], [b]) =>
    a === NO_UNIT ? 1 : b === NO_UNIT ? -1 : a.localeCompare(b, "pt-BR")
  );
}

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ plate?: string; unit?: string }>;
}) {
  const params = await searchParams;
  const unitFilter = params.unit && params.unit !== ALL ? params.unit : "";
  const [rows, filterOptions] = await Promise.all([
    getCurrentStockList(params.plate, unitFilter || undefined),
    getFilterOptions(),
  ]);
  const normalizedFilter = params.plate?.trim().toUpperCase();
  const groups = groupByUnit(rows);

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Estoque de Veículos</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} veículo{rows.length === 1 ? "" : "s"} atualmente em
            estoque.
          </p>
        </div>
        {/* <a> em vez de <Link>: é um download, não uma navegação. O
            arquivo sempre traz o estoque inteiro, ignorando o filtro. */}
        <Button asChild variant="outline">
          <a href="/flow/estoque/exportar" download>
            Exportar para Excel
          </a>
        </Button>
      </div>

      <form className="flex flex-wrap gap-2" action="/flow/estoque">
        <Input
          name="plate"
          placeholder="Filtrar por placa..."
          defaultValue={params.plate ?? ""}
          className="max-w-xs uppercase"
        />
        <Select name="unit" defaultValue={unitFilter || ALL}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Unidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as unidades</SelectItem>
            {filterOptions.units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                {unit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      {rows.length === 0 && (
        <div className="rounded-lg border bg-background p-6 text-center text-sm text-muted-foreground">
          {normalizedFilter ? (
            <>
              Nenhum veículo ativo encontrado para &quot;{normalizedFilter}
              &quot;.{" "}
              <Link
                href={`/flow/estoque/${normalizedFilter}`}
                className="font-medium text-primary hover:underline"
              >
                Ver histórico dessa placa
              </Link>
            </>
          ) : unitFilter ? (
            "Nenhum veículo em estoque nesta unidade no momento."
          ) : (
            "Nenhum veículo em estoque no momento."
          )}
        </div>
      )}

      {groups.map(([unitName, unitRows]) => (
        <section key={unitName} className="space-y-2">
          <h2 className="font-semibold">
            {unitName}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              — {unitRows.length} veículo{unitRows.length === 1 ? "" : "s"}
            </span>
          </h2>
          <div className="overflow-x-auto rounded-lg border bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3">Placa</th>
                  <th className="p-3">Entrada</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Responsável</th>
                  <th className="p-3">Situação</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {unitRows.map((row) => (
                  <tr key={row.vehicle_id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{row.plate}</td>
                    <td className="p-3">{formatDate(row.entry_at)}</td>
                    <td className="p-3">{row.service_type_name ?? "—"}</td>
                    <td className="p-3">{row.responsible_name ?? "—"}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Em estoque
                      </span>
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/flow/estoque/${row.plate}`}
                        className="font-medium text-primary hover:underline"
                      >
                        Ver histórico
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        Quer consultar uma placa específica, mesmo que ela já tenha saído do
        estoque? Digite a placa no filtro acima — se ela não estiver mais
        ativa, vai aparecer um link direto pro histórico completo dela. A
        unidade de cada veículo é a do serviço que deu entrada nele.
      </div>
    </div>
  );
}
