import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StatusActions from "@/components/flow/StatusActions";
import { getServiceRequestDetail } from "@/lib/queries/service-requests";

const STATUS_LABEL: Record<string, string> = {
  PARADO: "🔴 Parado",
  A_FAZER: "🟢 A Fazer",
  FINALIZADO: "⚪ Finalizado",
};

const ACTION_LABEL: Record<string, string> = {
  CRIADO: "Serviço criado",
  STATUS_ALTERADO: "Status alterado",
  DOCUMENTO_ANEXADO: "Documento anexado",
  ENTRADA_ESTOQUE: "Entrada no estoque",
  ENTRADA_DUPLICADA: "Entrada duplicada autorizada",
  SAIDA_ESTOQUE: "Saída do estoque",
};

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getServiceRequestDetail(id);

  if (!detail) notFound();

  const { serviceRequest, files, history } = detail;

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <Link
          href="/flow/servicos"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Voltar para Serviços
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">
          Serviço — {serviceRequest.plate}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Placa</p>
            <p className="font-medium">{serviceRequest.plate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Serviço</p>
            <p className="font-medium">
              {(serviceRequest as any).service_types?.name ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Solicitante</p>
            <p className="font-medium">
              {(serviceRequest as any).profiles?.name ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Unidade</p>
            <p className="font-medium">
              {(serviceRequest as any).units?.name ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Data da solicitação
            </p>
            <p className="font-medium">
              {formatDateTime(serviceRequest.requested_at)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="font-medium">
              {STATUS_LABEL[serviceRequest.status] ?? serviceRequest.status}
            </p>
          </div>
          {serviceRequest.finished_at && (
            <div>
              <p className="text-xs text-muted-foreground">Finalizado em</p>
              <p className="font-medium">
                {formatDateTime(serviceRequest.finished_at)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusActions
            serviceRequestId={serviceRequest.id}
            status={serviceRequest.status as "PARADO" | "A_FAZER" | "FINALIZADO"}
            plate={serviceRequest.plate}
          />
        </CardContent>
      </Card>

      {serviceRequest.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {serviceRequest.notes}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum documento anexado.
            </p>
          ) : (
            <ul className="space-y-2">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between rounded-md border p-2 text-sm"
                >
                  <span>
                    {file.original_name}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({formatBytes(file.size_bytes)})
                    </span>
                  </span>
                  {file.url ? (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      Baixar
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Link indisponível
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem histórico.</p>
          ) : (
            <ul className="space-y-3">
              {history.map((entry: any) => (
                <li key={entry.id} className="border-l-2 pl-3 text-sm">
                  <p className="font-medium">
                    {ACTION_LABEL[entry.action] ?? entry.action}
                    {entry.old_value && entry.new_value
                      ? ` — ${entry.old_value} → ${entry.new_value}`
                      : ""}
                  </p>
                  {entry.description && (
                    <p className="text-muted-foreground">
                      {entry.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(entry.created_at)} ·{" "}
                    {entry.profiles?.name ?? "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
