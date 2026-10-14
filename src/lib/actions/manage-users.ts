"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.active || profile.role !== "admin") return null;
  return profile;
}

export type ActionResult = { success: true } | { success: false; error: string };

export async function createUserAccount(
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return {
      success: false,
      error: "Apenas administradores podem criar usuários.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "user");
  const unitIds = [
    ...new Set(formData.getAll("unitIds").map(String).filter(Boolean)),
  ];

  if (!name || !email || !password || unitIds.length === 0) {
    return {
      success: false,
      error: "Preencha todos os campos obrigatórios.",
    };
  }
  if (password.length < 6) {
    return {
      success: false,
      error: "A senha precisa ter pelo menos 6 caracteres.",
    };
  }
  if (role !== "admin" && role !== "user") {
    return { success: false, error: "Perfil inválido." };
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (e: any) {
    return { success: false, error: e.message };
  }

  const { data: created, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError || !created.user) {
    return {
      success: false,
      error: createError?.message ?? "Não foi possível criar o usuário.",
    };
  }

  const supabase = await createClient();
  const { error: profileError } = await supabase.from("profiles").insert({
    id: created.user.id,
    name,
    email,
    role,
    // A primeira unidade marcada vira a principal.
    unit_id: unitIds[0],
    active: true,
  });

  const { error: unitsError } = profileError
    ? { error: null }
    : await supabase.from("profile_units").insert(
        unitIds.map((unitId) => ({
          profile_id: created.user.id,
          unit_id: unitId,
        }))
      );

  if (profileError || unitsError) {
    // Se o perfil não foi criado, desfaz a criação do usuário no Auth
    // pra não deixar um login "fantasma" sem perfil vinculado.
    await adminClient.auth.admin.deleteUser(created.user.id);
    return {
      success: false,
      error: "Não foi possível salvar o perfil do usuário.",
    };
  }

  revalidatePath("/flow/configuracoes/usuarios");
  return { success: true };
}

export async function updateUserProfile(
  userId: string,
  changes: { role?: "admin" | "user"; unitIds?: string[]; active?: boolean }
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return {
      success: false,
      error: "Apenas administradores podem alterar usuários.",
    };
  }

  if (userId === admin.id) {
    return {
      success: false,
      error: "Você não pode alterar sua própria conta por aqui.",
    };
  }

  const supabase = await createClient();
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (changes.role) update.role = changes.role;
  if (changes.unitIds) {
    if (changes.unitIds.length === 0) {
      return { success: false, error: "Selecione pelo menos uma unidade." };
    }
    // A unidade principal continua a mesma se ainda estiver habilitada.
    const { data: current } = await supabase
      .from("profiles")
      .select("unit_id")
      .eq("id", userId)
      .single();
    update.unit_id =
      current?.unit_id && changes.unitIds.includes(current.unit_id)
        ? current.unit_id
        : changes.unitIds[0];
  }
  if (typeof changes.active === "boolean") update.active = changes.active;

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId);

  if (error) {
    return { success: false, error: "Não foi possível atualizar o usuário." };
  }

  if (changes.unitIds) {
    const unitIds = changes.unitIds;
    const [{ error: deleteError }, { error: insertError }] = await Promise.all([
      supabase
        .from("profile_units")
        .delete()
        .eq("profile_id", userId)
        .not("unit_id", "in", `(${unitIds.join(",")})`),
      supabase.from("profile_units").upsert(
        unitIds.map((unitId) => ({ profile_id: userId, unit_id: unitId })),
        { onConflict: "profile_id,unit_id", ignoreDuplicates: true }
      ),
    ]);
    if (deleteError || insertError) {
      return {
        success: false,
        error: "Não foi possível atualizar as unidades do usuário.",
      };
    }
  }

  revalidatePath("/flow/configuracoes/usuarios");
  return { success: true };
}
