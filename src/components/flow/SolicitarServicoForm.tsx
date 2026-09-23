"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { createServiceRequest } from "@/lib/actions/create-service-request";
import { uploadServiceFiles, validateFiles } from "@/lib/upload-service-files";
import { ACCEPT_ATTRIBUTE } from "@/lib/constants/files";

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

  const checklist =
    serviceTypes.find((t) => t.id === serviceTypeId)?.document_checklist ?? [];
  const checklistComplete = checklist.every((item) => checkedItems.has(item));

  function handleServiceTypeChange(value: string) {
    setServiceTypeId(value);
    setCheckedItems(new Set());
  }

  function toggleItem(item: string, checked: boolean) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (checked) next.add(item);
      else next.delete(item);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!checklistComplete) {
      setError("Confirme todos os documentos do checklist antes de enviar.");
      return;
    }

    const formData = new FormData(e.currentTarget);

    // Os arquivos não vão junto com o formulário (a server action tem
    // limite de 1 MB): o serviço é criado primeiro e depois os arquivos
    // vão direto pro Storage. Um campo de arquivo vazio vem como um
    // arquivo de tamanho 0, por isso o filtro.
    const files = formData
      .getAll("files")
      .filter(
        (f): f is File =>
          typeof f === "object" && "arrayBuffer" in f && f.size > 0
      );
    formData.delete("files");

    const validation = validateFiles(files);
    if (!validation.success) {
      setError(validation.error);
      return;
    }

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
        files
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

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Solicitar Serviço</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
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

          {checklist.length > 0 && (
            <fieldset className="space-y-2 rounded-md border p-4">
              <legend className="px-1 text-sm font-medium">
                Checklist de documentos *
              </legend>
              <p className="text-xs text-muted-foreground">
                Confirme que você tem em mãos cada documento abaixo.
              </p>
              {checklist.map((item, index) => (
                <label
                  key={item}
                  htmlFor={`checklist-${index}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    id={`checklist-${index}`}
                    type="checkbox"
                    name="checklist"
                    value={item}
                    checked={checkedItems.has(item)}
                    onChange={(e) => toggleItem(item, e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  {item}
                </label>
              ))}
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

          <div className="space-y-2">
            <Label htmlFor="files">Documentos</Label>
            <Input
              id="files"
              name="files"
              type="file"
              multiple
              accept={ACCEPT_ATTRIBUTE}
            />
            <p className="text-xs text-muted-foreground">
              PDF, JPG, PNG, DOC ou DOCX — até 10 MB por arquivo.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !checklistComplete}
          >
            {submitting ? "Enviando..." : "Solicitar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
