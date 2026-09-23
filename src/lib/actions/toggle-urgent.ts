"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { success: true } | { success: false; error: string };

export async function setServiceUrgency(
  serviceRequestId: string,
  isUrgent: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Sessão inválida." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, active")
    .eq("id", user.id)
    .single();
  if (!profile || !profile.active) {
    return { success: false, error: "Sessão inválida." };
  }

  const { data: serviceRequest } = await supabase
    .from("service_requests")
    .select("id, status, created_by, is_urgent")
    .eq("id", serviceRequestId)
    .single();

  if (!serviceRequest) {
    return { success: false, error: "Serviço não encontrado." };
  }

  // Mesma regra da mudança de status: admin ou quem criou o serviço.
  if (profile.role !== "admin" && serviceRequest.created_by !== profile.id) {
    return {
      success: false,
      error: "Você não tem permissão para alterar este serviço.",
    };
  }

  if (serviceRequest.status === "FINALIZADO") {
    return {
      success: false,
      error: "Não é possível alterar a urgência de um serviço finalizado.",
    };
  }

  if (serviceRequest.is_urgent === isUrgent) return { success: true };

  const { error } = await supabase
    .from("service_requests")
    .update({ is_urgent: isUrgent, updated_at: new Date().toISOString() })
    .eq("id", serviceRequestId);

  if (error) {
    console.error("setServiceUrgency error:", error.message);
    return { success: false, error: "Não foi possível alterar a urgência." };
  }

  await supabase.from("service_history").insert({
    service_request_id: serviceRequestId,
    user_id: profile.id,
    action: "URGENCIA",
    description: isUrgent ? "Marcado como urgente" : "Urgência removida",
  });

  revalidatePath(`/flow/servicos/${serviceRequestId}`);
  revalidatePath("/flow/servicos");
  revalidatePath("/flow");
  return { success: true };
}
