"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateServiceRequest } from "@/lib/actions/update-service-request";

type ServiceType = { id: string; name: string };

export default function EditServiceDialog({
  serviceRequestId,
  plate,
  serviceTypeId,
  notes,
  serviceTypes,
}: {
  serviceRequestId: string;
  plate: string;
  serviceTypeId: string;
  notes: string | null;
  serviceTypes: ServiceType[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateServiceRequest(serviceRequestId, {
      plate: String(formData.get("plate") ?? ""),
      serviceTypeId: String(formData.get("serviceTypeId") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });
    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    toast.success("Serviço atualizado.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Editar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar serviço</DialogTitle>
          <DialogDescription>
            As alterações ficam registradas no histórico do serviço.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-plate">Placa *</Label>
            <Input
              id="edit-plate"
              name="plate"
              required
              defaultValue={plate}
              maxLength={8}
              className="uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-serviceTypeId">Tipo de Serviço *</Label>
            <Select name="serviceTypeId" defaultValue={serviceTypeId} required>
              <SelectTrigger id="edit-serviceTypeId" className="w-full">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Observações</Label>
            <Textarea
              id="edit-notes"
              name="notes"
              rows={4}
              defaultValue={notes ?? ""}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
