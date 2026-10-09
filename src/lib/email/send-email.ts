// Envio de e-mail pela API do Resend (https://resend.com/docs/api-reference).
// Só roda no servidor: usa a chave secreta RESEND_API_KEY.
export type EmailAttachment = {
  filename: string;
  // Conteúdo do arquivo em base64.
  content: string;
};

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
};

export type SendEmailResult =
  | { success: true }
  | { success: false; error: string };

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.error("sendEmail: RESEND_API_KEY ou EMAIL_FROM não configurado.");
    return { success: false, error: "Envio de e-mail não configurado." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html, attachments }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("sendEmail error:", response.status, body);
      // O Resend devolve { message: "..." } explicando a recusa.
      let reason = body;
      try {
        reason = JSON.parse(body).message ?? body;
      } catch {}
      return {
        success: false,
        error: `O serviço de e-mail recusou o envio. (${reason})`,
      };
    }
    return { success: true };
  } catch (err) {
    console.error("sendEmail error:", err);
    return { success: false, error: "Não foi possível enviar o e-mail." };
  }
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
