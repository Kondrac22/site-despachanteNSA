"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { VENDEDOR_READ_ONLY_ERROR } from "@/lib/constants/roles";

export type ActionResult = { success: true } | { success: false; error: string };

// Mesma regra de quem pode anexar: admin ou quem criou o serviço (o
// banco confere igual, ver supabase/excluir-anexos-criador.sql). Só em
// serviço não finalizado: depois disso, os anexos ficam como registro.
export async function deleteServiceFile(fileId: string): Promise<ActionResult> {
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
  if (profile.role === "vendedor") {
    return { success: false, error: VENDEDOR_READ_ONLY_ERROR };
  }

  const { data: file } = await supabase
    .from("service_files")
    .select(
      "id, original_name, storage_path, document_label, service_request_id, service_requests ( status, created_by )"
    )
    .eq("id", fileId)
    .single();

  if (!file) {
    return { success: false, error: "Anexo não encontrado." };
  }

  const serviceRequest = (file as any).service_requests as {
    status: string;
    created_by: string;
  } | null;

  if (profile.role !== "admin" && serviceRequest?.created_by !== profile.id) {
    return {
      success: false,
      error: "Você não tem permissão para excluir anexos deste serviço.",
    };
  }

  if (serviceRequest?.status === "FINALIZADO") {
    return {
      success: false,
      error: "Não é possível excluir anexos de um serviço já finalizado.",
    };
  }

  // Apaga primeiro o registro: se der erro, o arquivo continua lá e nada
  // some da tela sem querer.
  const { data: deleted, error } = await supabase
    .from("service_files")
    .delete()
    .eq("id", fileId)
    .select("id");

  // Sem erro mas sem linha apagada = o banco recusou (regra de acesso).
  if (error || !deleted || deleted.length === 0) {
    console.error("deleteServiceFile error:", error?.message ?? "nenhuma linha apagada");
    return { success: false, error: "Não foi possível excluir o anexo." };
  }

  await supabase.storage.from("service-documents").remove([file.storage_path]);

  await supabase.from("service_history").insert({
    service_request_id: file.service_request_id,
    user_id: profile.id,
    action: "DOCUMENTO_EXCLUIDO",
    description: file.document_label
      ? `${file.document_label}: ${file.original_name}`
      : file.original_name,
  });

  revalidatePath(`/flow/servicos/${file.service_request_id}`);
  return { success: true };
}
