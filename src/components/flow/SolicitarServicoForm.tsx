"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
import DocumentTile from "@/components/flow/DocumentTile";
import { splitChecklist } from "@/lib/constants/documents";

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
  // Arquivos escolhidos em cada linha (item do checklist ou OTHER_FILES).
  const [filesByItem, setFilesByItem] = useState<Record<string, File[]>>({});
  const [showMissingDialog, setShowMissingDialog] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const checklist =
    serviceTypes.find((t) => t.id === serviceTypeId)?.document_checklist ?? [];
  // Todo documento precisa de anexo. Os opcionais (contrato social,
  // procuração, CNH/RG) não geram pendência se ficarem sem arquivo.
  const { required, optional } = splitChecklist(checklist);
  const hasFile = (item: string) => (filesByItem[item]?.length ?? 0) > 0;
  const missingItems = required.filter((item) => !hasFile(item));

  function handleServiceTypeChange(value: string) {
    setServiceTypeId(value);
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
    // Cada documento do checklist tem um arquivo só (escolher de novo
    // troca); "Outros" acumula quantos forem.
    setFilesByItem((prev) => ({
      ...prev,
      [item]:
        item === OTHER_FILES ? [...(prev[item] ?? []), ...picked] : [picked[0]],
    }));
  }

  function removeFile(item: string, index: number) {
    setFilesByItem((prev) => ({
      ...prev,
      [item]: (prev[item] ?? []).filter((_, i) => i !== index),
    }));
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

  function renderChecklistTile(item: string, isOptional: boolean) {
    return (
      <DocumentTile
        key={item}
        id={`doc-${checklist.indexOf(item)}`}
        label={item}
        optional={isOptional}
        file={filesByItem[item]?.[0] ?? null}
        onSelect={(list) => addFiles(item, list)}
        onRemove={() => removeFile(item, 0)}
      />
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Nova Solicitação</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          {/* Placa, urgência e data numa linha só (quebra no celular). */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="plate">Placa *</Label>
              <Input
                id="plate"
                name="plate"
                required
                placeholder="ABC1D23"
                maxLength={8}
                className="w-28 font-mono uppercase"
              />
            </div>

            <label
              htmlFor="isUrgent"
              className="flex h-9 items-center gap-2 whitespace-nowrap rounded-md border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-700"
            >
              <input
                id="isUrgent"
                type="checkbox"
                name="isUrgent"
                value="1"
                className="h-4 w-4 accent-red-600"
              />
              🚨 Urgente
            </label>

            <div className="space-y-2">
              <Label htmlFor="requestedAt">Data</Label>
              <Input
                id="requestedAt"
                name="requestedAt"
                type="date"
                defaultValue={todayIso}
                disabled={!isAdmin}
                className="w-auto"
              />
            </div>
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
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Documentos</legend>
              <p className="text-xs text-muted-foreground">
                Clique no quadrado para anexar cada documento (PDF, JPG, PNG,
                DOC ou DOCX — até 10 MB). Se faltar algum, o serviço será
                criado com pendência de documento.
              </p>

              {/* O servidor recebe a lista de documentos entregues (com
                  arquivo ou marcados como "em papel"). */}
              {checklist
                .filter((item) => hasFile(item))
                .map((item) => (
                  <input key={item} type="hidden" name="checklist" value={item} />
                ))}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Obrigatórios (ATPV, Laudo, NF...), depois Outros e, em
                    seguida, os opcionais. */}
                {required.map((item) => renderChecklistTile(item, false))}
                {(filesByItem[OTHER_FILES] ?? []).map((file, index) => (
                  <DocumentTile
                    key={`outros-${index}-${file.name}`}
                    id={`doc-outros-${index}`}
                    label="Outros"
                    file={file}
                    onSelect={() => {}}
                    onRemove={() => removeFile(OTHER_FILES, index)}
                  />
                ))}
                <DocumentTile
                  id="doc-outros-novo"
                  label="Outros"
                  file={null}
                  multiple
                  onSelect={(list) => addFiles(OTHER_FILES, list)}
                  onRemove={() => {}}
                />
                {optional.map((item) => renderChecklistTile(item, true))}
                <div className="relative aspect-square overflow-hidden rounded-md border bg-muted/30">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    fill
                    sizes="160px"
                    className="object-contain p-4"
                  />
                </div>
              </div>
            </fieldset>
          )}

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
