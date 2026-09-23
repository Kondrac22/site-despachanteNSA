// Fica num arquivo à parte porque o formulário (client) e as ações
// (server) precisam das mesmas regras.
export const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "doc", "docx"];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPT_ATTRIBUTE = ".pdf,.jpg,.jpeg,.png,.doc,.docx";

export function fileExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}
