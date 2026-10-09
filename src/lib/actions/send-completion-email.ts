"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  escapeHtml,
  sendEmail,
  type EmailAttachment,
} from "@/lib/email/send-email";

export type SendCompletionEmailResult =
  | { success: true; to: string; attachmentCount: number; skipped: string[] }
  | { success: false; error: string };

// O Resend aceita até 40 MB por e-mail, já contando o base64 (que aumenta
// o arquivo em ~33%). Os documentos que passarem disso não vão anexados,
// mas continuam disponíveis na página do serviço.
const MAX_ATTACHMENTS_BYTES = 28 * 1024 * 1024;

// Avisa o solicitante que o serviço foi concluído, com os documentos de
// conclusão anexados. É chamado pelo navegador depois de finalizar e de
// enviar os anexos (os arquivos vão direto pro Storage, então só dá para
// mandar o e-mail quando o upload termina).
export async function sendCompletionEmail(
  serviceRequestId: string
): Promise<SendCompletionEmailResult> {
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
    .select(
      `id, plate, protocol, status, finished_at, created_by,
       service_types ( name ),
       profiles!service_requests_created_by_fkey ( name, email )`
    )
    .eq("id", serviceRequestId)
    .single();

  if (!serviceRequest) {
    return { success: false, error: "Serviço não encontrado." };
  }

  // Mesma regra da mudança de status: admin ou quem criou o serviço.
  if (profile.role !== "admin" && serviceRequest.created_by !== profile.id) {
    return {
      success: false,
      error: "Você não tem permissão para enviar e-mail deste serviço.",
    };
  }
  if (serviceRequest.status !== "FINALIZADO") {
    return { success: false, error: "O serviço ainda não foi finalizado." };
  }

  const requester = (serviceRequest as any).profiles as {
    name: string;
    email: string;
  } | null;
  if (!requester?.email) {
    return { success: false, error: "O solicitante não tem e-mail cadastrado." };
  }

  const serviceName: string =
    (serviceRequest as any).service_types?.name ?? "Serviço";

  const { data: files } = await supabase
    .from("service_files")
    .select("original_name, storage_path, size_bytes")
    .eq("service_request_id", serviceRequestId)
    .eq("category", "CONCLUSAO")
    .order("created_at", { ascending: true });

  const attachments: EmailAttachment[] = [];
  const skipped: string[] = [];
  let totalBytes = 0;

  for (const file of files ?? []) {
    if (totalBytes + file.size_bytes > MAX_ATTACHMENTS_BYTES) {
      skipped.push(file.original_name);
      continue;
    }
    const { data: blob, error } = await supabase.storage
      .from("service-documents")
      .download(file.storage_path);
    if (error || !blob) {
      console.error("sendCompletionEmail download error:", error?.message);
      skipped.push(file.original_name);
      continue;
    }
    attachments.push({
      filename: file.original_name,
      content: Buffer.from(await blob.arrayBuffer()).toString("base64"),
    });
    totalBytes += file.size_bytes;
  }

  const finishedAt = serviceRequest.finished_at
    ? new Date(serviceRequest.finished_at).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      })
    : null;

  const protocolText = serviceRequest.protocol
    ? ` (protocolo ${escapeHtml(serviceRequest.protocol)})`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 15px; color: #222; line-height: 1.5;">
      <p>Olá, ${escapeHtml(requester.name)}!</p>
      <p>
        O serviço <strong>${escapeHtml(serviceName)}</strong> da placa
        <strong>${escapeHtml(serviceRequest.plate)}</strong>${protocolText}
        foi concluído${finishedAt ? ` em ${finishedAt}` : ""}.
      </p>
      ${
        attachments.length > 0
          ? `<p>Os documentos do serviço seguem em anexo.</p>`
          : ""
      }
      ${
        skipped.length > 0
          ? `<p>Alguns documentos não puderam ser anexados e estão disponíveis na página do serviço no sistema: ${skipped
              .map(escapeHtml)
              .join(", ")}.</p>`
          : ""
      }
      <p style="color: #777; font-size: 13px;">
        Esta é uma mensagem automática.
      </p>
    </div>
  `;

  const subject = `Serviço concluído: ${serviceName} — placa ${serviceRequest.plate}`;

  const result = await sendEmail({
    to: requester.email,
    subject,
    html,
    attachments,
  });

  await supabase.from("service_history").insert({
    service_request_id: serviceRequestId,
    user_id: profile.id,
    action: result.success ? "EMAIL_ENVIADO" : "EMAIL_FALHOU",
    description: result.success
      ? `Aviso de conclusão para ${requester.email}` +
        (attachments.length > 0 ? ` · ${attachments.length} anexo(s)` : "")
      : `Aviso de conclusão para ${requester.email}: ${result.error}`,
  });
  revalidatePath(`/flow/servicos/${serviceRequestId}`);

  if (!result.success) return result;
  return {
    success: true,
    to: requester.email,
    attachmentCount: attachments.length,
    skipped,
  };
}
