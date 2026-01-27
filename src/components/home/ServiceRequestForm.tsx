"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function ServiceRequestForm() {
  const [formData, setFormData] = useState({
    placa: "",
    renavam: "",
    contato: "",
    descricao: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requests = JSON.parse(
        localStorage.getItem("serviceRequests") || "[]",
      );
      const newRequest = {
        ...formData,
        id: Date.now(),
        data: new Date().toISOString(),
      };
      requests.push(newRequest);
      localStorage.setItem("serviceRequests", JSON.stringify(requests));

      toast.success(
        "Solicitação enviada com sucesso! Entraremos em contato em breve.",
      );
      setFormData({ placa: "", renavam: "", contato: "", descricao: "" });
    } catch (error) {
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="formulario" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl text-center">
              Solicite Nossos Serviços
            </CardTitle>
            <CardDescription className="text-center text-base">
              Preencha o formulário abaixo e entraremos em contato rapidamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="placa">Placa do Veículo *</Label>
                  <Input
                    id="placa"
                    placeholder="ABC-1234"
                    value={formData.placa}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        placa: e.target.value.toUpperCase(),
                      })
                    }
                    required
                    maxLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="renavam">RENAVAM *</Label>
                  <Input
                    id="renavam"
                    placeholder="00000000000"
                    value={formData.renavam}
                    onChange={(e) =>
                      setFormData({ ...formData, renavam: e.target.value })
                    }
                    required
                    maxLength={11}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contato">E-mail ou Telefone *</Label>
                <Input
                  id="contato"
                  placeholder="seu@email.com ou (11) 99999-9999"
                  value={formData.contato}
                  onChange={(e) =>
                    setFormData({ ...formData, contato: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição da Solicitação *</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o serviço que você precisa..."
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  required
                  rows={5}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-[var(--orange-foreground)]"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Solicitar Serviço"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
