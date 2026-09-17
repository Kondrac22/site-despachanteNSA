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
import { createUnit, updateUnit } from "@/lib/actions/manage-units";

type Unit = { id: string; name: string; code: string | null; active: boolean };

export default function UnitsManager({
  initialUnits,
}: {
  initialUnits: Unit[];
}) {
  const [units, setUnits] = useState(initialUnits);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingCode, setEditingCode] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  function applyLocal(id: string, changes: Partial<Unit>) {
    setUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...changes } : u))
    );
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    const formData = new FormData(e.currentTarget);
    const result = await createUnit(formData);
    setCreating(false);
    if (!result.success) {
      setCreateError(result.error);
      return;
    }
    toast.success("Unidade criada.");
    setShowCreate(false);
    window.location.reload();
  }

  async function handleToggleActive(id: string, current: boolean) {
    applyLocal(id, { active: !current });
    const result = await updateUnit(id, { active: !current });
    if (!result.success) {
      toast.error(result.error);
      applyLocal(id, { active: current });
    } else {
      toast.success(!current ? "Ativada." : "Desativada.");
    }
  }

  function startEdit(unit: Unit) {
    setEditingId(unit.id);
    setEditingName(unit.name);
    setEditingCode(unit.code ?? "");
    setEditError(null);
  }

  async function saveEdit(id: string) {
    const name = editingName.trim();
    const code = editingCode.trim();
    if (!name || !code) {
      setEditError("Preencha nome e código.");
      return;
    }
    const previous = units.find((u) => u.id === id);
    applyLocal(id, { name, code: code.toUpperCase() });
    const result = await updateUnit(id, { name, code });
    if (!result.success) {
      setEditError(result.error);
      if (previous)
        applyLocal(id, { name: previous.name, code: previous.code });
      return;
    }
    toast.success("Unidade atualizada.");
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>+ Nova Unidade</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar unidade</DialogTitle>
              <DialogDescription>
                O código é usado no número de protocolo dos serviços dessa
                unidade (ex: código "LIM" gera protocolos LIM-0001,
                LIM-0002...).
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" name="name" required placeholder="Ex: Limeira" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  name="code"
                  required
                  maxLength={6}
                  className="uppercase"
                  placeholder="Ex: LIM"
                />
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
              <th className="p-3">Código</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                {editingId === u.id ? (
                  <>
                    <td className="p-3">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8 w-48"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        value={editingCode}
                        onChange={(e) => setEditingCode(e.target.value)}
                        className="h-8 w-24 uppercase"
                        maxLength={6}
                      />
                    </td>
                    <td className="p-3" colSpan={2}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" onClick={() => saveEdit(u.id)}>
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Cancelar
                        </Button>
                        {editError && (
                          <span className="text-xs text-destructive">
                            {editError}
                          </span>
                        )}
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3">
                      {u.code ? (
                        <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                          {u.code}
                        </span>
                      ) : (
                        <span className="text-xs text-destructive">
                          sem código
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {u.active ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Ativa
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Inativa
                        </span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => startEdit(u)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(u.id, u.active)}
                      >
                        {u.active ? "Desativar" : "Ativar"}
                      </Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Mudar o código de uma unidade não altera os protocolos já gerados
        — eles ficam gravados do jeito que foram criados. Só protocolos
        novos usam o código atualizado.
      </p>
    </div>
  );
}
