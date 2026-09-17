"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

type StatusActionsProps = {
  serviceRequestId: string;
  status: "PARADO" | "A_FAZER" | "FINALIZADO";
  plate: string;
};

export default function StatusActions({
  serviceRequestId,
  status,
  plate,
}: StatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [stopReason, setStopReason] = useState("");
  const [stopError, setStopError] = useState<string | null>(null);

  async function handleChange(
    newStatus: "PARADO" | "A_FAZER" | "FINALIZADO",
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

  async function handleConfirmStop() {
    if (stopReason.trim().length < 3) {
      setStopError("Descreva o motivo (mínimo 3 caracteres).");
      return;
    }
    setStopError(null);
    const ok = await handleChange("PARADO", stopReason.trim());
    if (ok) {
      setShowStopDialog(false);
      setStopReason("");
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
            onClick={() => setShowStopDialog(true)}
          >
            Marcar como Parado
          </Button>
          <Button disabled={loading} onClick={() => handleChange("FINALIZADO")}>
            Finalizar Serviço
          </Button>
        </>
      )}

      {status === "PARADO" && (
        <Button disabled={loading} onClick={() => handleChange("A_FAZER")}>
          Voltar para A Fazer
        </Button>
      )}

      {status === "FINALIZADO" && (
        <p className="text-sm text-muted-foreground">
          Este serviço já foi finalizado.
        </p>
      )}

      {/* Popup: motivo da parada */}
      <Dialog
        open={showStopDialog}
        onOpenChange={(open) => {
          setShowStopDialog(open);
          if (!open) {
            setStopReason("");
            setStopError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo da parada</DialogTitle>
            <DialogDescription>
              Explique por que o serviço da placa {plate} está sendo marcado
              como parado. Esse motivo fica visível no histórico e no
              Dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="stop-reason">Motivo *</Label>
            <Textarea
              id="stop-reason"
              rows={4}
              value={stopReason}
              onChange={(e) => setStopReason(e.target.value)}
              placeholder="Ex: Falta documento X, aguardando retorno do cliente..."
            />
            {stopError && (
              <p className="text-sm text-destructive" role="alert">
                {stopError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setShowStopDialog(false)}
            >
              Cancelar
            </Button>
            <Button disabled={loading} onClick={handleConfirmStop}>
              Confirmar
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