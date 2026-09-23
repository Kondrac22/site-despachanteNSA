import { createClient } from "@/lib/supabase/client";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  fileExtension,
} from "@/lib/constants/files";
import {
  registerServiceFiles,
  type FileCategory,
  type UploadedFileInfo,
} from "@/lib/actions/register-service-files";

type Result = { success: true } | { success: false; error: string };

// Confere tipo e tamanho antes de enviar qualquer coisa.
export function validateFiles(files: File[]): Result {
  for (const file of files) {
    if (!ALLOWED_EXTENSIONS.includes(fileExtension(file.name))) {
      return {
        success: false,
        error: `${file.name}: use PDF, JPG, PNG, DOC ou DOCX.`,
      };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { success: false, error: `${file.name}: máximo de 10 MB.` };
    }
  }
  return { success: true };
}

// Só pode ser usado no navegador: envia os arquivos direto pro Storage
// (com a sessão do usuário, então as regras de acesso do bucket valem)
// e depois registra no banco pela server action.
export async function uploadServiceFiles(
  serviceRequestId: string,
  category: FileCategory,
  files: File[]
): Promise<Result> {
  const validation = validateFiles(files);
  if (!validation.success) return validation;

  const supabase = createClient();
  const uploaded: UploadedFileInfo[] = [];

  async function removeUploaded() {
    if (uploaded.length === 0) return;
    await supabase.storage
      .from("service-documents")
      .remove(uploaded.map((f) => f.storagePath));
  }

  for (const file of files) {
    const safeName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExtension(file.name)}`;
    const storagePath = `${serviceRequestId}/${safeName}`;

    const { error } = await supabase.storage
      .from("service-documents")
      .upload(storagePath, file, { contentType: file.type });

    if (error) {
      console.error("upload error:", error.message);
      await removeUploaded();
      return { success: false, error: `Não foi possível enviar ${file.name}.` };
    }

    uploaded.push({
      originalName: file.name,
      storagePath,
      mimeType: file.type,
      sizeBytes: file.size,
    });
  }

  const result = await registerServiceFiles(serviceRequestId, category, uploaded);
  if (!result.success) await removeUploaded();
  return result;
}
