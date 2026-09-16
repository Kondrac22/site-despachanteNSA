import Link from "next/link";
import { Button } from "@/components/ui/button";
import ServiceListFilters from "@/components/prestacao-servicos/ServiceListFilters";
import { getFilterOptions } from "@/lib/queries/dashboard";
import {
  getServiceRequestsList,
  type ServiceListSort,
} from "@/lib/queries/service-requests";

const STATUS_LABEL: Record<string, string> = {
  PARADO: "🔴 Parado",
  A_FAZER: "🟢 A Fazer",
  FINALIZADO: "⚪ Finalizado",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

const PAGE_SIZE = 20;

export default async function ServicosPage({
  searchParams,
}: {
  searchParams: Promise<{
    plate?: string;
    requester?: string;
    unit?: string;
    status?: string;
    serviceType?: string;
    period?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const sort = (params.sort as ServiceListSort) || "recent";

  const [filterOptions, { rows, total }] = await Promise.all([
    getFilterOptions(),
    getServiceRequestsList(
      {
        plate: params.plate,
        requester: params.requester,
        unit: params.unit,
        status: params.status,
        serviceType: params.serviceType,
        period: params.period,
      },
      sort,
      page,
      PAGE_SIZE
    ),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const query = new URLSearchParams();
    if (params.plate) query.set("plate", params.plate);
    if (params.requester) query.set("requester", params.requester);
    if (params.unit) query.set("unit", params.unit);
    if (params.status) query.set("status", params.status);
    if (params.serviceType) query.set("serviceType", params.serviceType);
    if (params.period) query.set("period", params.period);
    if (params.sort) query.set("sort", params.sort);
    query.set("page", String(targetPage));
    return `/prestacao-servicos/servicos?${query.toString()}`;
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Serviços</h1>
          <p className="text-sm text-muted-foreground">
            {total} serviço{total === 1 ? "" : "s"} encontrado
            {total === 1 ? "" : "s"}.
          </p>
        </div>
        <Button asChild>
          <Link href="/prestacao-servicos/solicitar">+ Solicitar Serviço</Link>
        </Button>
      </div>

      <ServiceListFilters
        units={filterOptions.units}
        serviceTypes={filterOptions.serviceTypes}
        requesters={filterOptions.requesters}
      />

      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3">Status</th>
              <th className="p-3">Placa</th>
              <th className="p-3">Serviço</th>
              <th className="p-3">Data</th>
              <th className="p-3">Solicitante</th>
              <th className="p-3">Finalização</th>
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
                  Nenhum serviço encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
            {rows.map((row: any) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="p-3">
                  {STATUS_LABEL[row.status] ?? row.status}
                </td>
                <td className="p-3 font-medium">{row.plate}</td>
                <td className="p-3">{row.service_types?.name ?? "—"}</td>
                <td className="p-3">{formatDate(row.requested_at)}</td>
                <td className="p-3">{row.profiles?.name ?? "—"}</td>
                <td className="p-3">{formatDate(row.finished_at)}</td>
                <td className="p-3">
                  <Link
                    href={`/prestacao-servicos/servicos/${row.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          {page > 1 ? (
            <Button asChild variant="outline">
              <Link href={pageHref(page - 1)}>Anterior</Link>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Anterior
            </Button>
          )}
          {page < totalPages ? (
            <Button asChild variant="outline">
              <Link href={pageHref(page + 1)}>Próxima</Link>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Próxima
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
