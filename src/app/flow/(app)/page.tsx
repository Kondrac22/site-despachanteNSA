import Link from "next/link";
import DashboardFilters from "@/components/flow/DashboardFilters";
import CreatedToast from "@/components/flow/CreatedToast";
import UrgentBadge from "@/components/flow/UrgentBadge";
import {
  getFilterOptions,
  getDashboardIndicators,
  getRecentServiceRequests,
  getCurrentStock,
  type DashboardFilters as Filters,
} from "@/lib/queries/dashboard";

const STATUS_LABEL: Record<string, string> = {
  PARADO: "🔴 Parado",
  A_FAZER: "🟢 A Fazer",
  FINALIZADO: "⚪ Finalizado",
};

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
  };

  const [filterOptions, indicators, recentRequests, currentStock] =
    await Promise.all([
      getFilterOptions(),
      getDashboardIndicators(filters),
      getRecentServiceRequests(filters),
      getCurrentStock(5),
    ]);

  const cards: {
    label: string;
    value: number;
    accent: string;
    href?: string;
  }[] = [
    {
      label: "Urgentes em aberto",
      value: indicators.urgentes,
      accent: "text-red-600",
      href: "/flow/servicos?urgent=1",
    },
    { label: "Parados", value: indicators.parado, accent: "text-red-600" },
    { label: "A Fazer", value: indicators.aFazer, accent: "text-green-600" },
    {
      label: "Finalizados",
      value: indicators.finalizado,
      accent: "text-muted-foreground",
    },
    { label: "Total", value: indicators.total, accent: "text-primary" },
    {
      label: "Veículos em Estoque",
      value: indicators.vehiclesInStock,
      accent: "text-primary",
    },
  ];

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-6">
      <CreatedToast />

      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral dos serviços e do estoque de veículos.
        </p>
      </div>

      <DashboardFilters
        units={filterOptions.units}
        serviceTypes={filterOptions.serviceTypes}
        requesters={filterOptions.requesters}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => {
          const content = (
            <>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className={`mt-1 text-3xl font-bold ${card.accent}`}>
                {card.value}
              </p>
            </>
          );
          return card.href ? (
            <Link
              key={card.label}
              href={card.href}
              className={`rounded-lg border bg-background p-4 shadow-sm transition-colors hover:border-red-400 ${
                card.value > 0 ? "border-red-300" : ""
              }`}
            >
              {content}
              <p className="mt-1 text-xs font-medium text-primary">
                Ver lista →
              </p>
            </Link>
          ) : (
            <div
              key={card.label}
              className="rounded-lg border bg-background p-4 shadow-sm"
            >
              {content}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-background p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Serviços recentes</h2>
            <Link
              href="/flow/servicos"
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver todos
            </Link>
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
                    <th className="py-2"></th>
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
                            {request.protocol ?? "—"}
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
                          {request.status === "PARADO" &&
                          request.stopped_reason ? (
                            <span
                              className="line-clamp-2 text-red-700"
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
                        <td className="py-2">
                          <Link
                            href={`/flow/servicos/${request.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            Ver
                          </Link>
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
                  {currentStock.map((movement: any) => (
                    <tr
                      key={movement.vehicle_id}
                      className="border-b last:border-0"
                    >
                      <td className="py-2 pr-2 font-medium">
                        {movement.vehicles?.plate ?? "—"}
                      </td>
                      <td className="py-2 pr-2">
                        {formatDate(movement.created_at)}
                      </td>
                      <td className="py-2">
                        {movement.profiles?.name ?? "—"}
                      </td>
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
