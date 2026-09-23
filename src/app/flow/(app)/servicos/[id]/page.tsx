import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StatusActions from "@/components/flow/StatusActions";
import DeleteServiceButton from "@/components/flow/DeleteServiceButton";
import EditServiceDialog from "@/components/flow/EditServiceDialog";
import UrgentBadge from "@/components/flow/UrgentBadge";
import UrgentToggle from "@/components/flow/UrgentToggle";
import AttachServiceFiles from "@/components/flow/AttachServiceFiles";
import { createClient } from "@/lib/supabase/server";
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
  DOCUMENTO_ENTREGUE: "Documento de conclusão anexado",
  ENTRADA_ESTOQUE: "Entrada no estoque",
  ENTRADA_DUPLICADA: "Entrada duplicada autorizada",
  SAIDA_ESTOQUE: "Saída do estoque",
  EDITADO: "Serviço editado",
  URGENCIA: "Urgência alterada",
};

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/flow/login");

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = currentProfile?.role === "admin";

  const detail = await getServiceRequestDetail(id);
  if (!detail) notFound();

  const { serviceRequest, files, history } = detail;
  const canDelete = isAdmin && serviceRequest.status !== "FINALIZADO";
  const canEdit = canDelete;
  const isOpen = serviceRequest.status !== "FINALIZADO";
  const isUrgent = Boolean(serviceRequest.is_urgent) && isOpen;
  // Mesma regra da mudança de status: admin ou quem criou o serviço.
  const canManage =
    isAdmin || (serviceRequest as any).profiles?.id === user.id;
  const canToggleUrgent = isOpen && canManage;
  const canAttachConclusion =
    serviceRequest.status === "FINALIZADO" && canManage;
  const canAttachRequest = isOpen && canManage;
  const conclusionFiles = files.filter((f: any) => f.category === "CONCLUSAO");
  const requestFiles = files.filter((f: any) => f.category !== "CONCLUSAO");
  const currentType = (serviceRequest as any).service_types as {
    id: string;
    name: string;
  } | null;

  let editableTypes: { id: string; name: string }[] = [];
  if (canEdit) {
    const { data: activeTypes } = await supabase
      .from("service_types")
      .select("id, name")
      .eq("active", true)
      .order("name");
    editableTypes = activeTypes ?? [];
    // Mantém o tipo atual como opção mesmo se ele tiver sido desativado.
    if (currentType && !editableTypes.some((t) => t.id === currentType.id)) {
      editableTypes = [currentType, ...editableTypes];
    }
  }

  function renderFiles(list: typeof files) {
    return (
      <ul className="space-y-2">
        {list.map((file) => (
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
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/flow/servicos"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Voltar para Serviços
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">
            {serviceRequest.protocol ? (
              <>
                Serviço {serviceRequest.protocol}{" "}
                <span className="text-muted-foreground">
                  — {serviceRequest.plate}
                </span>
              </>
            ) : (
              <>Serviço — {serviceRequest.plate}</>
            )}
            {isUrgent && (
              <span className="ml-3 align-middle">
                <UrgentBadge />
              </span>
            )}
          </h1>
        </div>
        {canEdit && (
          <EditServiceDialog
            serviceRequestId={serviceRequest.id}
            plate={serviceRequest.plate}
            serviceTypeId={currentType?.id ?? ""}
            notes={serviceRequest.notes}
            serviceTypes={editableTypes}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Protocolo</p>
            <p className="font-mono font-medium">
              {serviceRequest.protocol ?? "—"}
            </p>
          </div>
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
          {isAdmin && serviceRequest.charged_amount != null && (
            <div>
              <p className="text-xs text-muted-foreground">Valor cobrado</p>
              <p className="font-medium">
                {formatCurrency(Number(serviceRequest.charged_amount))}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {serviceRequest.status === "PARADO" &&
        (serviceRequest as any).stopped_reason && (
          <Card className="border-red-300">
            <CardHeader>
              <CardTitle className="text-red-700">
                Motivo da parada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">
                {(serviceRequest as any).stopped_reason}
              </p>
            </CardContent>
          </Card>
        )}

      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusActions
            serviceRequestId={serviceRequest.id}
            status={
              serviceRequest.status as "PARADO" | "A_FAZER" | "FINALIZADO"
            }
            plate={serviceRequest.plate}
          />
          {canToggleUrgent && (
            <div className="border-t pt-4">
              <UrgentToggle
                serviceRequestId={serviceRequest.id}
                isUrgent={isUrgent}
              />
            </div>
          )}
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

      {(conclusionFiles.length > 0 || canAttachConclusion) && (
        <Card className="border-green-300">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-green-700">Documentos entregues</CardTitle>
            {canAttachConclusion && (
              <AttachServiceFiles
                serviceRequestId={serviceRequest.id}
                category="CONCLUSAO"
              />
            )}
          </CardHeader>
          <CardContent>
            {conclusionFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum documento de conclusão anexado.
              </p>
            ) : (
              renderFiles(conclusionFiles)
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>Documentos da solicitação</CardTitle>
          {canAttachRequest && (
            <AttachServiceFiles
              serviceRequestId={serviceRequest.id}
              category="SOLICITACAO"
            />
          )}
        </CardHeader>
        <CardContent>
          {requestFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum documento anexado.
            </p>
          ) : (
            renderFiles(requestFiles)
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

      {canDelete && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de perigo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Excluir remove o serviço, seus documentos e seu histórico
              permanentemente. Só é possível excluir serviços que ainda não
              foram finalizados.
            </p>
            <DeleteServiceButton
              serviceRequestId={serviceRequest.id}
              protocol={serviceRequest.protocol}
              plate={serviceRequest.plate}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
