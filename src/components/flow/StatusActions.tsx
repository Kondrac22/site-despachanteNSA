"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

  async function handleChange(newStatus: "PARADO" | "A_FAZER" | "FINALIZADO") {
    setLoading(true);
    const result = await changeServiceStatus(serviceRequestId, newStatus);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Status atualizado.");
    if (result.duplicateConfirmNeeded) {
      setShowDuplicateDialog(true);
    }
    router.refresh();
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
            onClick={() => handleChange("PARADO")}
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
            <AlertDialogAction disabled={loading} onClick={handleConfirmDuplicate}>
              Duplicar Entrada
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
