"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createUserAccount,
  updateUserProfile,
} from "@/lib/actions/manage-users";

type Unit = { id: string; name: string };

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  active: boolean;
  unit_ids: string[];
};

type UsersManagerProps = {
  initialUsers: UserRow[];
  units: Unit[];
  currentUserId: string;
};

// Ativos primeiro; dentro de cada grupo, ordem alfabética pelo nome.
function sortUsers(list: UserRow[]) {
  return [...list].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

export default function UsersManager({
  initialUsers,
  units,
  currentUserId,
}: UsersManagerProps) {
  const [users, setUsers] = useState(() => sortUsers(initialUsers));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function applyLocalChange(
    userId: string,
    changes: Partial<UserRow>,
    resort = false
  ) {
    setUsers((prev) => {
      const updated = prev.map((u) =>
        u.id === userId ? { ...u, ...changes } : u
      );
      return resort ? sortUsers(updated) : updated;
    });
  }

  async function handleRoleChange(userId: string, role: "admin" | "user") {
    const previous = users.find((u) => u.id === userId)?.role;
    applyLocalChange(userId, { role });
    const result = await updateUserProfile(userId, { role });
    if (!result.success) {
      toast.error(result.error);
      if (previous) applyLocalChange(userId, { role: previous });
    } else {
      toast.success("Perfil atualizado.");
    }
  }

  // Marca/desmarca uma unidade; o usuário precisa ficar com pelo menos uma.
  async function handleUnitToggle(userId: string, unitId: string) {
    const previous = users.find((u) => u.id === userId)?.unit_ids ?? [];
    const unitIds = previous.includes(unitId)
      ? previous.filter((id) => id !== unitId)
      : [...previous, unitId];
    if (unitIds.length === 0) {
      toast.error("O usuário precisa ter pelo menos uma unidade.");
      return;
    }
    applyLocalChange(userId, { unit_ids: unitIds });
    const result = await updateUserProfile(userId, { unitIds });
    if (!result.success) {
      toast.error(result.error);
      applyLocalChange(userId, { unit_ids: previous });
    } else {
      toast.success("Unidades atualizadas.");
    }
  }

  function unitsLabel(unitIds: string[]) {
    const names = units
      .filter((unit) => unitIds.includes(unit.id))
      .map((unit) => unit.name);
    return names.length > 0 ? names.join(", ") : "Sem unidade";
  }

  async function handleToggleActive(userId: string, current: boolean) {
    // Reordena junto: ativar/desativar muda de grupo na lista.
    applyLocalChange(userId, { active: !current }, true);
    const result = await updateUserProfile(userId, { active: !current });
    if (!result.success) {
      toast.error(result.error);
      applyLocalChange(userId, { active: current }, true);
    } else {
      toast.success(!current ? "Usuário ativado." : "Usuário desativado.");
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    const formData = new FormData(e.currentTarget);
    if (formData.getAll("unitIds").length === 0) {
      setCreateError("Selecione pelo menos uma unidade.");
      setCreating(false);
      return;
    }
    const result = await createUserAccount(formData);

    setCreating(false);

    if (!result.success) {
      setCreateError(result.error);
      return;
    }

    toast.success("Usuário criado com sucesso.");
    setShowCreateDialog(false);
    // Forma simples de recarregar a lista com o novo usuário incluído.
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>+ Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar usuário</DialogTitle>
              <DialogDescription>
                O usuário poderá fazer login imediatamente com o e-mail e
                senha definidos aqui.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Perfil *</Label>
                <Select name="role" defaultValue="user" required>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Unidades *</legend>
                <div className="grid grid-cols-2 gap-2">
                  {units.map((unit) => (
                    <label
                      key={unit.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="unitIds"
                        value={unit.id}
                        className="h-4 w-4"
                      />
                      {unit.name}
                    </label>
                  ))}
                </div>
              </fieldset>

              {createError && (
                <p className="text-sm text-destructive" role="alert">
                  {createError}
                </p>
              )}

              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? "Criando..." : "Criar usuário"}
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
              <th className="p-3">E-mail</th>
              <th className="p-3">Perfil</th>
              <th className="p-3">Unidades</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-muted-foreground">{u.email}</td>
                <td className="p-3">
                  <Select
                    value={u.role}
                    onValueChange={(value) =>
                      handleRoleChange(u.id, value as "admin" | "user")
                    }
                    disabled={u.id === currentUserId}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      disabled={u.id === currentUserId}
                    >
                      <Button
                        variant="outline"
                        className="w-[200px] justify-between font-normal"
                      >
                        <span className="truncate">
                          {unitsLabel(u.unit_ids)}
                        </span>
                        <span aria-hidden>▾</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {units.map((unit) => (
                        <DropdownMenuItem
                          key={unit.id}
                          // Não fecha o menu: dá pra marcar várias seguidas.
                          onSelect={(e) => {
                            e.preventDefault();
                            handleUnitToggle(u.id, unit.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            readOnly
                            tabIndex={-1}
                            checked={u.unit_ids.includes(unit.id)}
                            className="pointer-events-none h-4 w-4"
                          />
                          {unit.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
                <td className="p-3">
                  {u.active ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Ativo
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Inativo
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={u.id === currentUserId}
                    onClick={() => handleToggleActive(u.id, u.active)}
                  >
                    {u.active ? "Desativar" : "Ativar"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Você não pode alterar perfil, unidades ou status da sua própria conta
        por aqui — isso evita se trancar fora do sistema por acidente.
      </p>
    </div>
  );
}
