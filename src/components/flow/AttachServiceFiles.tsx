"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { uploadServiceFiles } from "@/lib/upload-service-files";
import { ACCEPT_ATTRIBUTE } from "@/lib/constants/files";
import type { FileCategory } from "@/lib/actions/register-service-files";

const TEXTS: Record<
  FileCategory,
  { button: string; title: string; description: string; success: string }
> = {
  SOLICITACAO: {
    button: "+ Anexar documento",
    title: "Anexar documento",
    description: "Documentos necessários para realizar o serviço.",
    success: "Documento anexado.",
  },
  CONCLUSAO: {
    button: "+ Anexar documento entregue",
    title: "Anexar documento entregue",
    description:
      "Ex: CRLV emitido. O solicitante vai ver o arquivo na página do serviço.",
    success: "Documento de conclusão anexado.",
  },
};

export default function AttachServiceFiles({
  serviceRequestId,
  category,
}: {
  serviceRequestId: string;
  category: FileCategory;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const texts = TEXTS[category];

  async function handleSend() {
    if (files.length === 0) {
      setError("Selecione pelo menos um arquivo.");
      return;
    }
    setError(null);
    setSending(true);
    const result = await uploadServiceFiles(serviceRequestId, category, files);
    setSending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    toast.success(texts.success);
    setOpen(false);
    setFiles([]);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (sending) return;
        setOpen(value);
        if (!value) {
          setFiles([]);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {texts.button}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.title}</DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor={`files-${category}`}>Arquivos</Label>
          <Input
            id={`files-${category}`}
            type="file"
            multiple
            accept={ACCEPT_ATTRIBUTE}
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          <p className="text-xs text-muted-foreground">
            PDF, JPG, PNG, DOC ou DOCX — até 10 MB por arquivo.
          </p>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button disabled={sending} onClick={handleSend}>
            {sending ? "Enviando..." : "Anexar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
