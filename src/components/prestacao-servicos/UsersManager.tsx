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
  unit_id: string | null;
  units: { name: string } | null;
};

type UsersManagerProps = {
  initialUsers: UserRow[];
  units: Unit[];
  currentUserId: string;
};

export default function UsersManager({
  initialUsers,
  units,
  currentUserId,
}: UsersManagerProps) {
  const [users, setUsers] = useState(initialUsers);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function applyLocalChange(userId: string, changes: Partial<UserRow>) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...changes } : u))
    );
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

  async function handleUnitChange(userId: string, unitId: string) {
    const previous = users.find((u) => u.id === userId);
    const unit = units.find((u) => u.id === unitId);
    applyLocalChange(userId, {
      unit_id: unitId,
      units: unit ? { name: unit.name } : null,
    });
    const result = await updateUserProfile(userId, { unitId });
    if (!result.success) {
      toast.error(result.error);
      if (previous)
        applyLocalChange(userId, {
          unit_id: previous.unit_id,
          units: previous.units,
        });
    } else {
      toast.success("Unidade atualizada.");
    }
  }

  async function handleToggleActive(userId: string, current: boolean) {
    applyLocalChange(userId, { active: !current });
    const result = await updateUserProfile(userId, { active: !current });
    if (!result.success) {
      toast.error(result.error);
      applyLocalChange(userId, { active: current });
    } else {
      toast.success(!current ? "Usuário ativado." : "Usuário desativado.");
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    const formData = new FormData(e.currentTarget);
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
              <div className="space-y-2">
                <Label htmlFor="unitId">Unidade *</Label>
                <Select name="unitId" required>
                  <SelectTrigger id="unitId" className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
              <th className="p-3">Unidade</th>
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
                  <Select
                    value={u.unit_id ?? ""}
                    onValueChange={(value) => handleUnitChange(u.id, value)}
                    disabled={u.id === currentUserId}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Sem unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
        Você não pode alterar perfil, unidade ou status da sua própria conta
        por aqui — isso evita se trancar fora do sistema por acidente.
      </p>
    </div>
  );
}
