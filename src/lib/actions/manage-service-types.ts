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

export async function createServiceType(
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return {
      success: false,
      error: "Apenas administradores podem gerenciar tipos de serviço.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { success: false, error: "Informe o nome do tipo de serviço." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("service_types").insert({ name });

  if (error) {
    return {
      success: false,
      error: "Não foi possível criar o tipo de serviço.",
    };
  }

  revalidatePath("/flow/tipos-servico");
  return { success: true };
}

export async function updateServiceType(
  id: string,
  changes: { name?: string; active?: boolean }
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return {
      success: false,
      error: "Apenas administradores podem gerenciar tipos de serviço.",
    };
  }

  const supabase = await createClient();
  const update: Record<string, unknown> = {};
  if (changes.name !== undefined) update.name = changes.name.trim();
  if (changes.active !== undefined) update.active = changes.active;

  const { error } = await supabase
    .from("service_types")
    .update(update)
    .eq("id", id);

  if (error) {
    return { success: false, error: "Não foi possível atualizar." };
  }

  revalidatePath("/flow/tipos-servico");
  return { success: true };
}
