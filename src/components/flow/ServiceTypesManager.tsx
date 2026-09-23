"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createServiceType,
  updateServiceType,
} from "@/lib/actions/manage-service-types";

type ServiceType = {
  id: string;
  name: string;
  active: boolean;
  price: number;
  document_checklist: string[];
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPriceInput(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function ServiceTypeFields({ type }: { type?: ServiceType }) {
  const prefix = type ? `edit-${type.id}` : "create";
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-name`}>Nome *</Label>
        <Input
          id={`${prefix}-name`}
          name="name"
          required
          defaultValue={type?.name}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-price`}>Valor cobrado (R$)</Label>
        <Input
          id={`${prefix}-price`}
          name="price"
          inputMode="decimal"
          placeholder="0,00"
          defaultValue={type ? formatPriceInput(type.price) : ""}
        />
        <p className="text-xs text-muted-foreground">
          Gravado no serviço no momento em que ele é finalizado. Mudar o valor
          aqui não altera serviços já finalizados.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-checklist`}>
          Checklist de documentos
        </Label>
        <Textarea
          id={`${prefix}-checklist`}
          name="documentChecklist"
          rows={6}
          placeholder={"ATPV/DUT\nCNH ou RG\n..."}
          defaultValue={type?.document_checklist.join("\n")}
        />
        <p className="text-xs text-muted-foreground">
          Um documento por linha. Ao solicitar este serviço, o usuário precisa
          marcar todos os itens antes de enviar.
        </p>
      </div>
    </>
  );
}

export default function ServiceTypesManager({
  initialTypes,
}: {
  initialTypes: ServiceType[];
}) {
  const [types, setTypes] = useState(initialTypes);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editingType = types.find((t) => t.id === editingId);

  function applyLocal(id: string, changes: Partial<ServiceType>) {
    setTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...changes } : t))
    );
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    const formData = new FormData(e.currentTarget);
    const result = await createServiceType(formData);
    setCreating(false);
    if (!result.success) {
      setCreateError(result.error);
      return;
    }
    toast.success("Tipo de serviço criado.");
    setShowCreate(false);
    window.location.reload();
  }

  async function handleToggleActive(id: string, current: boolean) {
    applyLocal(id, { active: !current });
    const result = await updateServiceType(id, { active: !current });
    if (!result.success) {
      toast.error(result.error);
      applyLocal(id, { active: current });
    } else {
      toast.success(!current ? "Ativado." : "Desativado.");
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId) return;
    setEditError(null);
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateServiceType(editingId, {
      name: String(formData.get("name") ?? ""),
      price: String(formData.get("price") ?? ""),
      documentChecklist: String(formData.get("documentChecklist") ?? ""),
    });
    setSaving(false);
    if (!result.success) {
      setEditError(result.error);
      return;
    }
    toast.success("Tipo de serviço atualizado.");
    setEditingId(null);
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>+ Novo Tipo de Serviço</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar tipo de serviço</DialogTitle>
              <DialogDescription>
                Ele aparece imediatamente no formulário de "Solicitar
                Serviço". Se o nome tiver "Entrada" ou "Saída", ele entra
                automaticamente na integração com o estoque.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <ServiceTypeFields />
              {createError && (
                <p className="text-sm text-destructive" role="alert">
                  {createError}
                </p>
              )}
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? "Criando..." : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog
        open={editingType !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null);
            setEditError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar tipo de serviço</DialogTitle>
            <DialogDescription>
              Os nomes com "Entrada" ou "Saída" controlam a integração
              automática com o estoque, então edite esses com cuidado.
            </DialogDescription>
          </DialogHeader>
          {editingType && (
            <form onSubmit={handleEdit} className="space-y-4">
              <ServiceTypeFields type={editingType} />
              {editError && (
                <p className="text-sm text-destructive" role="alert">
                  {editError}
                </p>
              )}
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3">Nome</th>
              <th className="p-3">Valor</th>
              <th className="p-3">Checklist</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{t.name}</td>
                <td className="p-3 whitespace-nowrap">
                  {formatCurrency(t.price)}
                </td>
                <td className="p-3 text-muted-foreground">
                  {t.document_checklist.length === 0
                    ? "—"
                    : `${t.document_checklist.length} documento${
                        t.document_checklist.length === 1 ? "" : "s"
                      }`}
                </td>
                <td className="p-3">
                  {t.active ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Ativo
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Inativo
                    </span>
                  )}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    onClick={() => setEditingId(t.id)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(t.id, t.active)}
                  >
                    {t.active ? "Desativar" : "Ativar"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Desativar um tipo não afeta serviços já criados com ele — só some
        das opções para novos serviços. Os nomes com "Entrada" ou "Saída"
        controlam a integração automática com o estoque, então edite esses
        com cuidado.
      </p>
    </div>
  );
}
