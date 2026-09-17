import Link from "next/link";
import { Button } from "@/components/ui/button";
import HistoryFilters from "@/components/flow/HistoryFilters";
import { getFilterOptions } from "@/lib/queries/dashboard";
import { getGlobalHistory } from "@/lib/queries/history";
import { ACTION_OPTIONS } from "@/lib/constants/history-actions";

const ACTION_LABEL: Record<string, string> = Object.fromEntries(
  ACTION_OPTIONS.map((a) => [a.id, a.name])
);

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

const PAGE_SIZE = 30;

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{
    userId?: string;
    action?: string;
    period?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [filterOptions, { rows, total }] = await Promise.all([
    getFilterOptions(),
    getGlobalHistory(
      { userId: params.userId, action: params.action, period: params.period },
      page,
      PAGE_SIZE
    ),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const query = new URLSearchParams();
    if (params.userId) query.set("userId", params.userId);
    if (params.action) query.set("action", params.action);
    if (params.period) query.set("period", params.period);
    query.set("page", String(targetPage));
    return `/flow/historico?${query.toString()}`;
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Histórico</h1>
        <p className="text-sm text-muted-foreground">
          {total} evento{total === 1 ? "" : "s"} encontrado
          {total === 1 ? "" : "s"}. Usuários que não são admin veem apenas
          o histórico dos serviços que criaram ou da própria unidade.
        </p>
      </div>

      <HistoryFilters requesters={filterOptions.requesters} />

      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum evento encontrado para os filtros selecionados.
          </p>
        ) : (
          rows.map((entry: any) => (
            <div
              key={entry.id}
              className="rounded-lg border bg-background p-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {ACTION_LABEL[entry.action] ?? entry.action}
                  {entry.old_value && entry.new_value
                    ? ` — ${entry.old_value} → ${entry.new_value}`
                    : ""}
                </p>
                {entry.service_requests && (
                  <Link
                    href={`/flow/servicos/${entry.service_requests.id}`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {entry.service_requests.plate} →
                  </Link>
                )}
              </div>
              {entry.description && (
                <p className="text-muted-foreground">{entry.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatDateTime(entry.created_at)} ·{" "}
                {entry.profiles?.name ?? "—"}
              </p>
            </div>
          ))
        )}
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
