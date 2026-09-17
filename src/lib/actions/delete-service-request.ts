"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { success: true } | { success: false; error: string };

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

export async function deleteServiceRequest(
  serviceRequestId: string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return {
      success: false,
      error: "Apenas administradores podem excluir serviços.",
    };
  }

  const supabase = await createClient();

  const { data: serviceRequest } = await supabase
    .from("service_requests")
    .select("id, plate, status, protocol")
    .eq("id", serviceRequestId)
    .single();

  if (!serviceRequest) {
    return { success: false, error: "Serviço não encontrado." };
  }

  if (serviceRequest.status === "FINALIZADO") {
    return {
      success: false,
      error:
        "Não é possível excluir um serviço já finalizado (ele pode ter afetado o estoque de veículos).",
    };
  }

  // Segurança extra: se por algum motivo já existir movimentação de
  // estoque ligada a esse serviço, não deixa excluir.
  const { count: movementCount } = await supabase
    .from("vehicle_movements")
    .select("id", { count: "exact", head: true })
    .eq("service_request_id", serviceRequestId);

  if (movementCount && movementCount > 0) {
    return {
      success: false,
      error:
        "Este serviço já tem movimentação de estoque vinculada e não pode ser excluído.",
    };
  }

  // Apaga os documentos do Storage antes de apagar os metadados.
  const { data: files } = await supabase
    .from("service_files")
    .select("storage_path")
    .eq("service_request_id", serviceRequestId);

  if (files && files.length > 0) {
    await supabase.storage
      .from("service-documents")
      .remove(files.map((f) => f.storage_path));
  }

  await supabase
    .from("service_files")
    .delete()
    .eq("service_request_id", serviceRequestId);
  await supabase
    .from("service_history")
    .delete()
    .eq("service_request_id", serviceRequestId);

  // Guarda um rastro permanente de que isso foi excluído, por quem e
  // quando — mesmo apagando o serviço em si.
  await supabase.from("service_request_deletions").insert({
    original_service_request_id: serviceRequest.id,
    plate: serviceRequest.plate,
    protocol: serviceRequest.protocol,
    deleted_by: admin.id,
  });

  const { error: deleteError } = await supabase
    .from("service_requests")
    .delete()
    .eq("id", serviceRequestId);

  if (deleteError) {
    console.error("deleteServiceRequest error:", deleteError.message);
    return { success: false, error: "Não foi possível excluir o serviço." };
  }

  revalidatePath("/flow/servicos");
  revalidatePath("/flow");
  return { success: true };
}
