"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type ServiceType = { id: string; name: string; active: boolean };

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
  const [editingName, setEditingName] = useState("");

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

  function startEdit(type: ServiceType) {
    setEditingId(type.id);
    setEditingName(type.name);
  }

  async function saveEdit(id: string) {
    const name = editingName.trim();
    if (!name) return;
    const previous = types.find((t) => t.id === id)?.name;
    applyLocal(id, { name });
    setEditingId(null);
    const result = await updateServiceType(id, { name });
    if (!result.success) {
      toast.error(result.error);
      if (previous) applyLocal(id, { name: previous });
    } else {
      toast.success("Nome atualizado.");
    }
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
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" name="name" required />
              </div>
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

      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3">Nome</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="p-3 font-medium">
                  {editingId === t.id ? (
                    <div className="flex flex-wrap gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8 w-64"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => saveEdit(t.id)}>
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    t.name
                  )}
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
                  {editingId !== t.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => startEdit(t)}
                    >
                      Editar nome
                    </Button>
                  )}
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
