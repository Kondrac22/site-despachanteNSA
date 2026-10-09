// Fica num arquivo à parte porque o formulário (client) e as ações
// (server) precisam das mesmas regras.
export const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "doc", "docx"];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPT_ATTRIBUTE = ".pdf,.jpg,.jpeg,.png,.doc,.docx";

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}
