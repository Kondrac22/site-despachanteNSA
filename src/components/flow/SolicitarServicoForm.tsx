"use client";

import { useState } from "react";
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

type ServiceType = { id: string; name: string };

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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createServiceRequest(formData);

    // Se a função chegou a redirecionar (sucesso), o navegador já saiu
    // desta página antes de o código abaixo rodar. Se voltou aqui, é erro.
    if (result && result.success === false) {
      setError(result.error);
      setSubmitting(false);
    }
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
            <Select name="serviceTypeId" required>
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
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
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

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Enviando..." : "Solicitar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
