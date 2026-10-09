"use client";

import { useEffect, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { ACCEPT_ATTRIBUTE, fileExtension } from "@/lib/constants/files";
import { cn } from "@/lib/utils";

type DocumentTileProps = {
  id: string;
  label: string;
  file: File | null;
  onSelect: (files: FileList | null) => void;
  onRemove: () => void;
  // Opcional: sem arquivo não gera pendência (mostra "opcional").
  optional?: boolean;
  multiple?: boolean;
};

// Quadrado de um documento na Nova Solicitação: clicar escolhe o arquivo,
// depois mostra a prévia (imagem ou PDF) com um X para remover.
export default function DocumentTile({
  id,
  label,
  file,
  onSelect,
  onRemove,
  optional,
  multiple,
}: DocumentTileProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreviewUrl(null);
    };
  }, [file]);

  const extension = file ? fileExtension(file.name) : "";
  const isImage = ["jpg", "jpeg", "png"].includes(extension);
  const isPdf = extension === "pdf";

  return (
    <div
      className={cn(
        "relative flex aspect-square flex-col overflow-hidden rounded-md border-2 bg-background",
        file ? "border-green-500" : "border-dashed border-muted-foreground/40"
      )}
    >
      {file && previewUrl ? (
        <>
          <div className="relative min-h-0 flex-1 bg-muted/40">
            {isImage && (
              // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob), sem otimização
              <img
                src={previewUrl}
                alt={file.name}
                className="h-full w-full object-cover"
              />
            )}
            {isPdf && (
              <object
                data={`${previewUrl}#toolbar=0&navpanes=0&view=FitH`}
                type="application/pdf"
                className="pointer-events-none h-full w-full"
              >
                <FilePlaceholder name={file.name} />
              </object>
            )}
            {!isImage && !isPdf && <FilePlaceholder name={file.name} />}
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover ${file.name}`}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white shadow hover:bg-red-600"
          >
            <X className="h-4 w-4" />
          </button>
          <p
            className="truncate border-t bg-green-50 px-2 py-1 text-center text-xs font-medium text-green-800"
            title={`${label}: ${file.name}`}
          >
            {label}
          </p>
        </>
      ) : (
        <>
          <label
            htmlFor={id}
            className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-primary"
          >
            <Upload className="h-6 w-6" />
            <span className="text-xs">Clique para anexar</span>
          </label>
          <input
            id={id}
            type="file"
            multiple={multiple}
            accept={ACCEPT_ATTRIBUTE}
            className="sr-only"
            onChange={(e) => {
              onSelect(e.target.files);
              e.target.value = "";
            }}
          />
          <div className="space-y-1 p-2 pt-0">
            <p className="rounded border bg-muted/40 px-2 py-1 text-center text-xs font-medium leading-tight">
              {label}
            </p>
            {optional && (
              <p className="text-center text-[11px] text-muted-foreground">
                opcional
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function FilePlaceholder({ name }: { name: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-muted-foreground">
      <FileText className="h-8 w-8" />
      <span className="line-clamp-2 break-all text-center text-[11px]">
        {name}
      </span>
    </div>
  );
}
