"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createServiceRequest } from "@/lib/actions/create-service-request";
import { uploadServiceFiles, validateFiles } from "@/lib/upload-service-files";
import { ACCEPT_ATTRIBUTE, formatBytes } from "@/lib/constants/files";
import { cn } from "@/lib/utils";

// Chave dos arquivos que não são de nenhum item do checklist.
const OTHER_FILES = "__outros__";

type ServiceType = { id: string; name: string; document_checklist: string[] };

type SolicitarServicoFormProps = {
  serviceTypes: ServiceType[];
  isAdmin: boolean;
  todayIso: string;
};

export default function SolicitarServicoForm({
  serviceTypes,
  isAdmin,
  todayIso,
}: SolicitarServicoFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  // Arquivos escolhidos em cada linha (item do checklist ou OTHER_FILES).
  const [filesByItem, setFilesByItem] = useState<Record<string, File[]>>({});
  const [showMissingDialog, setShowMissingDialog] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const checklist =
    serviceTypes.find((t) => t.id === serviceTypeId)?.document_checklist ?? [];
  // Documento com arquivo anexado conta como entregue; a caixinha serve
  // para o que a pessoa tem só em papel.
  const hasFile = (item: string) => (filesByItem[item]?.length ?? 0) > 0;
  const isItemChecked = (item: string) =>
    checkedItems.has(item) || hasFile(item);
  const missingItems = checklist.filter((item) => !isItemChecked(item));

  function handleServiceTypeChange(value: string) {
    setServiceTypeId(value);
    setCheckedItems(new Set());
    // Mantém só os "Outros documentos": os itens mudam com o tipo.
    setFilesByItem((prev): Record<string, File[]> =>
      prev[OTHER_FILES] ? { [OTHER_FILES]: prev[OTHER_FILES] } : {}
    );
  }

  function addFiles(item: string, list: FileList | null) {
    const picked = Array.from(list ?? []);
    if (picked.length === 0) return;
    const validation = validateFiles(picked);
    if (!validation.success) {
      setError(validation.error);
      return;
    }
    setError(null);
    setFilesByItem((prev) => ({
      ...prev,
      [item]: [...(prev[item] ?? []), ...picked],
    }));
  }

  function removeFile(item: string, index: number) {
    setFilesByItem((prev) => ({
      ...prev,
      [item]: (prev[item] ?? []).filter((_, i) => i !== index),
    }));
  }

  function toggleItem(item: string, checked: boolean) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (checked) next.add(item);
      else next.delete(item);
      return next;
    });
  }

  // Documento faltando não bloqueia: pede confirmação num popup e o
  // serviço é criado com status "Pendência de documento".
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (missingItems.length > 0) {
      setShowMissingDialog(true);
      return;
    }
    submitForm();
  }

  async function submitForm() {
    if (!formRef.current) return;
    setShowMissingDialog(false);

    const formData = new FormData(formRef.current);

    // Os arquivos não vão junto com o formulário (a server action tem
    // limite de 1 MB): o serviço é criado primeiro e depois os arquivos
    // vão direto pro Storage, cada um marcado com o documento da linha.
    // Só entram as linhas do tipo de serviço atual + "Outros documentos".
    const rows = [...checklist, OTHER_FILES];
    const files = rows.flatMap((item) => filesByItem[item] ?? []);
    const labels = rows.flatMap((item) =>
      (filesByItem[item] ?? []).map(() => (item === OTHER_FILES ? null : item))
    );

    setSubmitting(true);
    const result = await createServiceRequest(formData);

    if (!result.success) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    if (files.length > 0) {
      const upload = await uploadServiceFiles(
        result.serviceRequestId,
        "SOLICITACAO",
        files,
        labels
      );
      if (!upload.success) {
        // O serviço já existe: leva pra página dele, onde dá pra anexar
        // de novo em "Documentos da solicitação".
        toast.error(
          `Serviço criado, mas o envio dos documentos falhou: ${upload.error} Anexe novamente na página do serviço.`
        );
        router.push(`/flow/servicos/${result.serviceRequestId}`);
        return;
      }
    }

    router.push("/flow?created=1");
  }

  // Uma linha por documento: caixinha (do checklist), botão de anexar e
  // os arquivos já escolhidos, que dá para remover antes de enviar.
  function renderDocumentRow(item: string, id: string, isChecklist: boolean) {
    const rowFiles = filesByItem[item] ?? [];
    const checked = isChecklist && isItemChecked(item);
    return (
      <div
        key={item}
        className={cn(
          "space-y-2 rounded-md border p-3",
          checked && "border-green-300 bg-green-50/50"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          {isChecklist ? (
            <label
              htmlFor={`${id}-check`}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <input
                id={`${id}-check`}
                type="checkbox"
                name="checklist"
                value={item}
                checked={checked}
                // Com arquivo anexado o item fica marcado; para desmarcar,
                // remova o arquivo.
                onChange={(e) => {
                  if (hasFile(item)) return;
                  toggleItem(item, e.target.checked);
                }}
                className="h-4 w-4 accent-primary"
              />
              {item}
            </label>
          ) : (
            <span className="text-sm font-medium">Outros documentos</span>
          )}

          <label
            htmlFor={`${id}-file`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "cursor-pointer"
            )}
          >
            📎 {rowFiles.length > 0 ? "Anexar mais" : "Anexar"}
          </label>
          <input
            id={`${id}-file`}
            type="file"
            multiple
            accept={ACCEPT_ATTRIBUTE}
            className="sr-only"
            onChange={(e) => {
              addFiles(item, e.target.files);
              // Permite escolher o mesmo arquivo de novo depois de remover.
              e.target.value = "";
            }}
          />
        </div>

        {rowFiles.length > 0 && (
          <ul className="space-y-1">
            {rowFiles.map((file, fileIndex) => (
              <li
                key={`${file.name}-${fileIndex}`}
                className="flex items-center justify-between gap-2 rounded bg-muted/60 px-2 py-1 text-xs"
              >
                <span className="truncate">
                  {file.name}{" "}
                  <span className="text-muted-foreground">
                    ({formatBytes(file.size)})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(item, fileIndex)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remover ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Nova Solicitação</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="plate">Placa *</Label>
            <Input
              id="plate"
              name="plate"
              required
              placeholder="ABC1234 ou ABC1D23"
              maxLength={8}
              className="uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceTypeId">Tipo de Serviço *</Label>
            <Select
              name="serviceTypeId"
              required
              value={serviceTypeId}
              onValueChange={handleServiceTypeChange}
            >
              <SelectTrigger id="serviceTypeId" className="w-full">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {serviceTypeId && (
            <fieldset className="space-y-2 rounded-md border p-4">
              <legend className="px-1 text-sm font-medium">Documentos</legend>
              <p className="text-xs text-muted-foreground">
                Anexe o arquivo de cada documento ou marque a caixinha se você
                tem o documento em papel. Se faltar algum, o serviço será
                criado com pendência de documento. PDF, JPG, PNG, DOC ou DOCX —
                até 10 MB por arquivo.
              </p>
              {checklist.map((item, index) =>
                renderDocumentRow(item, `doc-${index}`, true)
              )}
              {renderDocumentRow(OTHER_FILES, "doc-outros", false)}
            </fieldset>
          )}

          <div className="space-y-2">
            <Label htmlFor="requestedAt">Data</Label>
            <Input
              id="requestedAt"
              name="requestedAt"
              type="date"
              defaultValue={todayIso}
              disabled={!isAdmin}
            />
            {!isAdmin && (
              <p className="text-xs text-muted-foreground">
                A data é preenchida automaticamente. Somente administradores
                podem alterá-la.
              </p>
            )}
          </div>

          <label
            htmlFor="isUrgent"
            className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
          >
            <input
              id="isUrgent"
              type="checkbox"
              name="isUrgent"
              value="1"
              className="h-4 w-4 accent-red-600"
            />
            🚨 Marcar como urgente
          </label>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" rows={4} />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "Enviando..." : "Solicitar"}
          </Button>
        </form>

        {/* Popup: confirma os documentos que faltam */}
        <Dialog open={showMissingDialog} onOpenChange={setShowMissingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Documentos faltando</DialogTitle>
              <DialogDescription>
                O serviço será criado com status 🔵 Pendência de documento.
                Confirme os documentos que estão faltando:
              </DialogDescription>
            </DialogHeader>

            <ul className="list-disc space-y-1 pl-5 text-sm font-medium text-blue-700">
              {missingItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowMissingDialog(false)}
              >
                Voltar e revisar
              </Button>
              <Button onClick={submitForm}>Criar com pendência</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
