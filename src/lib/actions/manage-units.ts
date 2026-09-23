"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

function normalizeCode(raw: string) {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function createUnit(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return {
      success: false,
      error: "Apenas administradores podem gerenciar unidades.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  const code = normalizeCode(String(formData.get("code") ?? ""));

  if (!name) return { success: false, error: "Informe o nome da unidade." };
  if (!code || code.length < 2 || code.length > 6) {
    return {
      success: false,
      error: "O código deve ter entre 2 e 6 letras/números (ex: MTZ, LIM, SMT).",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("units").insert({ name, code });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Já existe uma unidade com esse código." };
    }
    return { success: false, error: "Não foi possível criar a unidade." };
  }

  revalidatePath("/flow/configuracoes/unidades");
  return { success: true };
}

export async function updateUnit(
  id: string,
  changes: { name?: string; code?: string; active?: boolean }
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return {
      success: false,
      error: "Apenas administradores podem gerenciar unidades.",
    };
  }

  const supabase = await createClient();
  const update: Record<string, unknown> = {};
  if (changes.name !== undefined) update.name = changes.name.trim();
  if (changes.code !== undefined) {
    const code = normalizeCode(changes.code);
    if (!code || code.length < 2 || code.length > 6) {
      return {
        success: false,
        error: "O código deve ter entre 2 e 6 letras/números.",
      };
    }
    update.code = code;
  }
  if (changes.active !== undefined) update.active = changes.active;

  const { error } = await supabase.from("units").update(update).eq("id", id);
  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Já existe uma unidade com esse código." };
    }
    return { success: false, error: "Não foi possível atualizar." };
  }

  revalidatePath("/flow/configuracoes/unidades");
  return { success: true };
}
