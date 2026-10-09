import Link from "next/link";
import DashboardFilters from "@/components/flow/DashboardFilters";
import CreatedToast from "@/components/flow/CreatedToast";
import UrgentBadge from "@/components/flow/UrgentBadge";
import {
  getFilterOptions,
  getDashboardIndicators,
  getRecentServiceRequests,
  type DashboardFilters as Filters,
} from "@/lib/queries/dashboard";
import { getCurrentStockList } from "@/lib/queries/vehicles";
import { getUserScope } from "@/lib/queries/user-scope";
import { REASON_TEXT_CLASS, STATUS_LABEL } from "@/lib/constants/service-status";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    requester?: string;
    unit?: string;
    status?: string;
    serviceType?: string;
    period?: string;
    urgent?: string;
    showFinished?: string;
  }>;
}) {
  const params = await searchParams;
  const filters: Filters = {
    requester: params.requester,
    unit: params.unit,
    status: params.status,
    serviceType: params.serviceType,
    period: params.period,
    urgent: params.urgent,
    showFinished: params.showFinished,
  };

  const showFinished = params.showFinished === "1";
  const toggleFinishedParams = new URLSearchParams(
    Object.entries(params).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[0] !== "showFinished"
    )
  );
  if (!showFinished) toggleFinishedParams.set("showFinished", "1");
  const toggleFinishedQuery = toggleFinishedParams.toString();
  const toggleFinishedHref = toggleFinishedQuery
    ? `/flow?${toggleFinishedQuery}`
    : "/flow";

  const [filterOptions, indicators, recentRequests, currentStock, scope] =
    await Promise.all([
      getFilterOptions(),
      getDashboardIndicators(filters),
      getRecentServiceRequests(filters),
      getCurrentStockList(undefined, undefined, 5),
      getUserScope(),
    ]);

  // Cada card tem a sua cor e leva para a lista correspondente.
  const cards: {
    label: string;
    value: number;
    href: string;
    box: string;
    text: string;
  }[] = [
    {
      label: "Urgentes em aberto",
      value: indicators.urgentes,
      href: "/flow/servicos?urgent=1",
      box: "bg-red-100 hover:ring-red-300",
      text: "text-red-700",
    },
    {
      label: "Parados",
      value: indicators.parado,
      href: "/flow/servicos?status=PARADO",
      box: "bg-orange-100 hover:ring-orange-300",
      text: "text-orange-700",
    },
    {
      label: "A fazer",
      value: indicators.aFazer,
      href: "/flow/servicos?status=A_FAZER",
      box: "bg-green-100 hover:ring-green-300",
      text: "text-green-700",
    },
    {
      label: "Pendência de doc.",
      value: indicators.pendenteDocumento,
      href: "/flow/servicos?status=PENDENTE_DOCUMENTO",
      box: "bg-blue-100 hover:ring-blue-300",
      text: "text-blue-700",
    },
    {
      label: "Em estoque",
      value: indicators.vehiclesInStock,
      href: "/flow/estoque",
      box: "bg-yellow-100 hover:ring-yellow-300",
      text: "text-yellow-700",
    },
  ];

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-6">
      <CreatedToast />

      <div>
        <h1 className="text-2xl font-semibold">Painel</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral dos serviços e do estoque de veículos.
        </p>
      </div>

      <DashboardFilters
        units={filterOptions.units}
        serviceTypes={filterOptions.serviceTypes}
        requesters={filterOptions.requesters}
        showUnitFilter={scope.isAdmin}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-xl p-4 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-2 ${card.box}`}
          >
            <p className={`text-sm font-medium ${card.text}`}>{card.label}</p>
            <p className={`mt-1 text-3xl font-bold ${card.text}`}>
              {card.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-background p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Serviços recentes</h2>
            <div className="flex items-center gap-4">
              {!filters.status && (
                <Link
                  href={toggleFinishedHref}
                  scroll={false}
                  className="text-sm font-medium text-muted-foreground hover:text-primary hover:underline"
                >
                  {showFinished ? "Ocultar finalizados" : "Mostrar finalizados"}
                </Link>
              )}
              <Link
                href="/flow/servicos"
                className="text-sm font-medium text-primary hover:underline"
              >
                Ver todos
              </Link>
            </div>
          </div>
          {recentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum serviço encontrado para os filtros selecionados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-2">Protocolo</th>
                    <th className="py-2 pr-2">Placa</th>
                    <th className="py-2 pr-2">Serviço</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2 pr-2">Motivo</th>
                    <th className="py-2 pr-2">Solicitante</th>
                    <th className="py-2 pr-2">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((request: any) => {
                    const urgent =
                      request.is_urgent && request.status !== "FINALIZADO";
                    return (
                      <tr
                        key={request.id}
                        className={`border-b last:border-0 ${urgent ? "bg-red-50" : ""}`}
                      >
                        <td className="py-2 pr-2 font-mono text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/flow/servicos/${request.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {request.protocol ?? "—"}
                            </Link>
                            {urgent && <UrgentBadge />}
                          </div>
                        </td>
                        <td className="py-2 pr-2 font-medium">
                          {request.plate}
                        </td>
                        <td className="py-2 pr-2">
                          {request.service_types?.name ?? "—"}
                        </td>
                        <td className="py-2 pr-2">
                          {STATUS_LABEL[request.status] ?? request.status}
                        </td>
                        <td className="py-2 pr-2 max-w-[220px]">
                          {REASON_TEXT_CLASS[request.status] &&
                          request.stopped_reason ? (
                            <span
                              className={`line-clamp-2 ${REASON_TEXT_CLASS[request.status]}`}
                              title={request.stopped_reason}
                            >
                              {request.stopped_reason}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          {request.profiles?.name ?? "—"}
                        </td>
                        <td className="py-2 pr-2">
                          {formatDate(request.requested_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-background p-4 shadow-sm lg:col-span-2">
          <h2 className="mb-3 font-semibold">Veículos em estoque</h2>
          {currentStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum veículo em estoque no momento.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-2">Placa</th>
                    <th className="py-2 pr-2">Entrada</th>
                    <th className="py-2">Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStock.map((row) => (
                    <tr key={row.vehicle_id} className="border-b last:border-0">
                      <td className="py-2 pr-2 font-medium">{row.plate}</td>
                      <td className="py-2 pr-2">
                        {formatDate(row.entry_at)}
                      </td>
                      <td className="py-2">{row.responsible_name ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
