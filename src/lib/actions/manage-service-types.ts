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

const MAX_CHECKLIST_ITEMS = 30;

// Aceita "150", "150,00", "1.234", "1.234,56" ou "R$ 1.234,56".
function parsePrice(raw: string): number | null {
  let value = raw.replace(/R\$|\s/g, "");
  if (!value) return 0;
  if (value.includes(",") || /^\d{1,3}(\.\d{3})+$/.test(value)) {
    value = value.replace(/\./g, "").replace(",", ".");
  }
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) return null;
  return Math.round(price * 100) / 100;
}

// Um documento por linha; linhas vazias são ignoradas.
function parseChecklist(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_CHECKLIST_ITEMS);
}

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

  const price = parsePrice(String(formData.get("price") ?? ""));
  if (price === null) {
    return { success: false, error: "Valor cobrado inválido." };
  }

  const documentChecklist = parseChecklist(
    String(formData.get("documentChecklist") ?? "")
  );

  const supabase = await createClient();
  const { error } = await supabase
    .from("service_types")
    .insert({ name, price, document_checklist: documentChecklist });

  if (error) {
    return {
      success: false,
      error: "Não foi possível criar o tipo de serviço.",
    };
  }

  revalidatePath("/flow/configuracoes/tipos-servico");
  return { success: true };
}

export async function updateServiceType(
  id: string,
  changes: {
    name?: string;
    active?: boolean;
    price?: string;
    documentChecklist?: string;
  }
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
  if (changes.name !== undefined) {
    const name = changes.name.trim();
    if (!name) {
      return { success: false, error: "Informe o nome do tipo de serviço." };
    }
    update.name = name;
  }
  if (changes.active !== undefined) update.active = changes.active;
  if (changes.price !== undefined) {
    const price = parsePrice(changes.price);
    if (price === null) {
      return { success: false, error: "Valor cobrado inválido." };
    }
    update.price = price;
  }
  if (changes.documentChecklist !== undefined) {
    update.document_checklist = parseChecklist(changes.documentChecklist);
  }

  const { error } = await supabase
    .from("service_types")
    .update(update)
    .eq("id", id);

  if (error) {
    return { success: false, error: "Não foi possível atualizar." };
  }

  revalidatePath("/flow/configuracoes/tipos-servico");
  return { success: true };
}
