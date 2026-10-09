"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  changeServiceStatus,
  confirmDuplicateVehicleEntry,
} from "@/lib/actions/service-request-status";
import { uploadServiceFiles } from "@/lib/upload-service-files";
import { sendCompletionEmail } from "@/lib/actions/send-completion-email";
import { ACCEPT_ATTRIBUTE } from "@/lib/constants/files";
import type { ServiceStatus } from "@/lib/constants/service-status";

// Os dois status que pedem um texto explicando o porquê.
type ReasonStatus = "PARADO" | "PENDENTE_DOCUMENTO";

const REASON_DIALOG: Record<
  ReasonStatus,
  {
    title: string;
    description: (plate: string) => string;
    label: string;
    placeholder: string;
  }
> = {
  PARADO: {
    title: "Motivo da parada",
    description: (plate) =>
      `Explique por que o serviço da placa ${plate} está sendo marcado como parado. Esse motivo fica visível no histórico e no Painel.`,
    label: "Motivo *",
    placeholder: "Ex: Falta documento X, aguardando retorno do cliente...",
  },
  PENDENTE_DOCUMENTO: {
    title: "Pendência de documento",
    description: (plate) =>
      `Informe qual documento está faltando para o serviço da placa ${plate}. Essa informação fica visível no histórico e no Painel.`,
    label: "Documento pendente *",
    placeholder: "Ex: Comprovante de residência, procuração assinada...",
  },
};

type StatusActionsProps = {
  serviceRequestId: string;
  status: ServiceStatus;
  plate: string;
  isAdmin: boolean;
};

export default function StatusActions({
  serviceRequestId,
  status,
  plate,
  isAdmin,
}: StatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [reasonStatus, setReasonStatus] = useState<ReasonStatus | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [finishFiles, setFinishFiles] = useState<File[]>([]);

  async function handleChange(
    newStatus: ServiceStatus,
    reason?: string
  ) {
    setLoading(true);
    const result = await changeServiceStatus(serviceRequestId, newStatus, {
      reason,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return false;
    }

    toast.success("Status atualizado.");
    if (result.duplicateConfirmNeeded) {
      setShowDuplicateDialog(true);
    }
    router.refresh();
    return true;
  }

  async function handleConfirmReason() {
    if (!reasonStatus) return;
    if (reason.trim().length < 3) {
      setReasonError("Descreva o motivo (mínimo 3 caracteres).");
      return;
    }
    setReasonError(null);
    const ok = await handleChange(reasonStatus, reason.trim());
    if (ok) {
      setReasonStatus(null);
      setReason("");
    }
  }

  const reasonDialog = reasonStatus ? REASON_DIALOG[reasonStatus] : null;

  // Finaliza primeiro e só depois anexa: se a finalização for recusada
  // (ex: saída de veículo que não está no estoque), nenhum arquivo é
  // enviado à toa. Se o anexo falhar, o serviço continua finalizado e o
  // documento pode ser anexado depois, pelo card de Documentos.
  // O e-mail ao solicitante só sai depois do anexo, para ir com ele. Se o
  // anexo falhar, o e-mail sai quando o documento for anexado de novo.
  async function handleConfirmFinish() {
    const ok = await handleChange("FINALIZADO");
    if (!ok) return;
    setShowFinishDialog(false);
    setLoading(true);

    if (finishFiles.length > 0) {
      const result = await uploadServiceFiles(
        serviceRequestId,
        "CONCLUSAO",
        finishFiles
      );
      if (!result.success) {
        setLoading(false);
        toast.error(
          `Serviço finalizado, mas o anexo falhou: ${result.error} Anexe de novo em Documentos — o e-mail ao solicitante será enviado junto.`
        );
        setFinishFiles([]);
        router.refresh();
        return;
      }
      toast.success("Documento de conclusão anexado.");
    }

    await notifyRequester();
    setLoading(false);
    setFinishFiles([]);
    router.refresh();
  }

  async function notifyRequester() {
    const result = await sendCompletionEmail(serviceRequestId);
    if (!result.success) {
      toast.error(`O e-mail ao solicitante não foi enviado: ${result.error}`);
      return;
    }
    toast.success(`E-mail de conclusão enviado para ${result.to}.`);
    if (result.skipped.length > 0) {
      toast.warning(
        `Não couberam no e-mail: ${result.skipped.join(", ")}. Eles continuam na página do serviço.`
      );
    }
  }

  async function handleConfirmDuplicate() {
    setLoading(true);
    const result = await confirmDuplicateVehicleEntry(serviceRequestId);
    setLoading(false);
    setShowDuplicateDialog(false);

    if (!result.success) {
      toast.error(result.error ?? "Não foi possível registrar a entrada.");
      return;
    }
    toast.success("Entrada duplicada registrada.");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "A_FAZER" && (
        <>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => setReasonStatus("PARADO")}
          >
            Marcar como Parado
          </Button>
          <Button
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            disabled={loading}
            onClick={() => setReasonStatus("PENDENTE_DOCUMENTO")}
          >
            Pendência de documento
          </Button>
          {isAdmin && (
            <Button
              disabled={loading}
              onClick={() => setShowFinishDialog(true)}
            >
              Finalizar Serviço
            </Button>
          )}
        </>
      )}

      {status === "PARADO" && (
        <Button disabled={loading} onClick={() => handleChange("A_FAZER")}>
          Voltar para A Fazer
        </Button>
      )}

      {status === "PENDENTE_DOCUMENTO" && (
        <>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => handleChange("A_FAZER")}
          >
            Documento recebido — voltar para A Fazer
          </Button>
          {isAdmin && (
            <Button
              disabled={loading}
              onClick={() => setShowFinishDialog(true)}
            >
              Finalizar Serviço
            </Button>
          )}
        </>
      )}

      {status === "FINALIZADO" && (
        <p className="text-sm text-muted-foreground">
          Este serviço já foi finalizado.
        </p>
      )}

      {/* Popup: motivo da parada / documento pendente */}
      <Dialog
        open={reasonStatus !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReasonStatus(null);
            setReason("");
            setReasonError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reasonDialog?.title}</DialogTitle>
            <DialogDescription>
              {reasonDialog?.description(plate)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="status-reason">{reasonDialog?.label}</Label>
            <Textarea
              id="status-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonDialog?.placeholder}
            />
            {reasonError && (
              <p className="text-sm text-destructive" role="alert">
                {reasonError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setReasonStatus(null)}
            >
              Cancelar
            </Button>
            <Button disabled={loading} onClick={handleConfirmReason}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup: finalizar, com anexo opcional do documento emitido */}
      <Dialog
        open={showFinishDialog}
        onOpenChange={(open) => {
          if (loading) return;
          setShowFinishDialog(open);
          if (!open) setFinishFiles([]);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar serviço</DialogTitle>
            <DialogDescription>
              Se o serviço gerou algum documento (ex: CRLV emitido), anexe
              aqui para que o solicitante tenha acesso a ele na página do
              serviço.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="finish-files">Documentos entregues (opcional)</Label>
            <Input
              id="finish-files"
              type="file"
              multiple
              accept={ACCEPT_ATTRIBUTE}
              onChange={(e) => setFinishFiles(Array.from(e.target.files ?? []))}
            />
            <p className="text-xs text-muted-foreground">
              PDF, JPG, PNG, DOC ou DOCX — até 10 MB por arquivo.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setShowFinishDialog(false)}
            >
              Cancelar
            </Button>
            <Button disabled={loading} onClick={handleConfirmFinish}>
              {loading ? "Finalizando..." : "Finalizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup: alerta de duplicidade (fase 11) */}
      <AlertDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Placa já em estoque</AlertDialogTitle>
            <AlertDialogDescription>
              A placa {plate} já possui um registro ativo no estoque. Deseja
              realmente adicionar uma nova entrada para esta placa?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              onClick={handleConfirmDuplicate}
            >
              Duplicar Entrada
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}