"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  fileExtension,
} from "@/lib/constants/files";

export type FileCategory = "SOLICITACAO" | "CONCLUSAO";

export type UploadedFileInfo = {
  originalName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
};

export type ActionResult = { success: true } | { success: false; error: string };

// O arquivo em si é enviado pelo navegador direto pro Storage (a server
// action tem limite de 1 MB por requisição, e a Vercel de 4,5 MB). Aqui
// só conferimos permissão, que o arquivo existe mesmo no Storage, e
// registramos os metadados + histórico.
export async function registerServiceFiles(
  serviceRequestId: string,
  category: FileCategory,
  files: UploadedFileInfo[]
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
    .select("id, status, created_by")
    .eq("id", serviceRequestId)
    .single();

  if (!serviceRequest) {
    return { success: false, error: "Serviço não encontrado." };
  }

  // Mesma regra da mudança de status: admin ou quem criou o serviço.
  if (profile.role !== "admin" && serviceRequest.created_by !== profile.id) {
    return {
      success: false,
      error: "Você não tem permissão para anexar documentos neste serviço.",
    };
  }

  // Documentos da solicitação: enquanto o serviço está em aberto.
  // Documentos de conclusão (ex: CRLV emitido): só depois de finalizado.
  const isFinalized = serviceRequest.status === "FINALIZADO";
  if (category === "SOLICITACAO" && isFinalized) {
    return {
      success: false,
      error: "Este serviço já foi finalizado. Anexe como documento entregue.",
    };
  }
  if (category === "CONCLUSAO" && !isFinalized) {
    return {
      success: false,
      error:
        "Documentos de conclusão só podem ser anexados a serviços finalizados.",
    };
  }

  const { data: storedObjects } = await supabase.storage
    .from("service-documents")
    .list(serviceRequestId, { limit: 1000 });
  const storedNames = new Set((storedObjects ?? []).map((o) => o.name));

  for (const file of files) {
    const [folder, objectName, ...rest] = file.storagePath.split("/");
    if (
      folder !== serviceRequestId ||
      !objectName ||
      rest.length > 0 ||
      !storedNames.has(objectName) ||
      !ALLOWED_EXTENSIONS.includes(fileExtension(file.originalName)) ||
      file.sizeBytes > MAX_FILE_SIZE_BYTES
    ) {
      return { success: false, error: `Arquivo inválido: ${file.originalName}` };
    }
  }

  for (const file of files) {
    const { error } = await supabase.from("service_files").insert({
      service_request_id: serviceRequestId,
      original_name: file.originalName.slice(0, 255),
      storage_path: file.storagePath,
      mime_type: file.mimeType || "application/octet-stream",
      size_bytes: file.sizeBytes,
      uploaded_by: profile.id,
      category,
    });

    if (error) {
      console.error("registerServiceFiles error:", error.message);
      return {
        success: false,
        error: `Não foi possível registrar ${file.originalName}.`,
      };
    }

    await supabase.from("service_history").insert({
      service_request_id: serviceRequestId,
      user_id: profile.id,
      action:
        category === "CONCLUSAO" ? "DOCUMENTO_ENTREGUE" : "DOCUMENTO_ANEXADO",
      description: file.originalName,
    });
  }

  revalidatePath(`/flow/servicos/${serviceRequestId}`);
  return { success: true };
}
