"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidPlate, normalizePlate } from "@/lib/validation/plate";

const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "doc", "docx"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export type CreateServiceRequestResult = {
  success: false;
  error: string;
};

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
    .select("id")
    .eq("id", serviceTypeId)
    .eq("active", true)
    .single();

  if (!serviceType) {
    return { success: false, error: "Tipo de serviço inválido." };
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
    description: `Protocolo ${protocol}`,
    new_value: "A_FAZER",
  });

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  for (const file of files) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      continue;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      continue;
    }

    const safeName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;
    const storagePath = `${serviceRequest.id}/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("service-documents")
      .upload(storagePath, file, { contentType: file.type });

    if (uploadError) {
      console.error("upload error:", uploadError.message);
      continue;
    }

    await supabase.from("service_files").insert({
      service_request_id: serviceRequest.id,
      original_name: file.name,
      storage_path: storagePath,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      uploaded_by: profile.id,
    });

    await supabase.from("service_history").insert({
      service_request_id: serviceRequest.id,
      user_id: profile.id,
      action: "DOCUMENTO_ANEXADO",
      description: file.name,
    });
  }

  revalidatePath("/flow");
  redirect("/flow?created=1");
}
