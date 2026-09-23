"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidPlate, normalizePlate } from "@/lib/validation/plate";

// Os documentos não passam por aqui: depois de criar o serviço, o
// navegador envia os arquivos direto pro Storage (a server action tem
// limite de 1 MB por requisição) e registra com registerServiceFiles.
export type CreateServiceRequestResult =
  | { success: true; serviceRequestId: string }
  | { success: false; error: string };

export async function createServiceRequest(
  formData: FormData
): Promise<CreateServiceRequestResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Sessão expirada. Faça login novamente.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, unit_id, active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.active) {
    return { success: false, error: "Usuário inativo ou não encontrado." };
  }
  if (!profile.unit_id) {
    return {
      success: false,
      error:
        "Seu usuário não está vinculado a nenhuma unidade. Fale com o administrador.",
    };
  }

  const rawPlate = String(formData.get("plate") ?? "");
  const plate = normalizePlate(rawPlate);
  if (!isValidPlate(plate)) {
    return {
      success: false,
      error: "Placa inválida. Use o formato ABC1234 ou ABC1D23.",
    };
  }

  const serviceTypeId = String(formData.get("serviceTypeId") ?? "");
  if (!serviceTypeId) {
    return { success: false, error: "Selecione o tipo de serviço." };
  }

  const { data: serviceType } = await supabase
    .from("service_types")
    .select("id, document_checklist")
    .eq("id", serviceTypeId)
    .eq("active", true)
    .single();

  if (!serviceType) {
    return { success: false, error: "Tipo de serviço inválido." };
  }

  // Confirmação manual do usuário (não verifica os arquivos anexados).
  const checklist: string[] = serviceType.document_checklist ?? [];
  const confirmedItems = formData.getAll("checklist").map(String);
  if (!checklist.every((item) => confirmedItems.includes(item))) {
    return {
      success: false,
      error: "Confirme todos os documentos do checklist antes de enviar.",
    };
  }

  // Busca o código da unidade pra gerar o protocolo (ex: MTZ-0001).
  const { data: unit } = await supabase
    .from("units")
    .select("code")
    .eq("id", profile.unit_id)
    .single();

  if (!unit?.code) {
    return {
      success: false,
      error:
        "Sua unidade ainda não tem um código de protocolo configurado. Peça para o administrador configurar em Unidades.",
    };
  }

  const { data: nextNumber, error: protocolError } = await supabase.rpc(
    "increment_unit_protocol",
    { p_unit_id: profile.unit_id }
  );

  if (protocolError || nextNumber == null) {
    console.error("increment_unit_protocol error:", protocolError?.message);
    return {
      success: false,
      error: "Não foi possível gerar o número de protocolo. Tente novamente.",
    };
  }

  const protocol = `${unit.code}-${String(nextNumber).padStart(4, "0")}`;

  const isAdmin = profile.role === "admin";
  const submittedDate = String(formData.get("requestedAt") ?? "");
  const requestedAt =
    isAdmin && submittedDate
      ? new Date(submittedDate).toISOString()
      : new Date().toISOString();

  const notes = String(formData.get("notes") ?? "").slice(0, 2000);
  const isUrgent = formData.get("isUrgent") === "1";

  const { data: serviceRequest, error: insertError } = await supabase
    .from("service_requests")
    .insert({
      plate,
      protocol,
      service_type_id: serviceTypeId,
      requested_at: requestedAt,
      created_by: profile.id,
      unit_id: profile.unit_id,
      status: "A_FAZER",
      notes: notes || null,
      is_urgent: isUrgent,
    })
    .select("id")
    .single();

  if (insertError || !serviceRequest) {
    console.error("createServiceRequest insert error:", insertError?.message);
    return {
      success: false,
      error: "Não foi possível criar o serviço. Tente novamente.",
    };
  }

  await supabase.from("service_history").insert({
    service_request_id: serviceRequest.id,
    user_id: profile.id,
    action: "CRIADO",
    description: [
      `Protocolo ${protocol}`,
      isUrgent ? "Marcado como urgente" : null,
      checklist.length > 0
        ? `Checklist de documentos confirmado (${checklist.length} itens)`
        : null,
    ]
      .filter(Boolean)
      .join(" · "),
    new_value: "A_FAZER",
  });

  revalidatePath("/flow");
  return { success: true, serviceRequestId: serviceRequest.id };
}
