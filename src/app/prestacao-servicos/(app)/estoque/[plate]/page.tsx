import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getVehicleHistoryByPlate } from "@/lib/queries/vehicles";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

export default async function VehicleHistoryPage({
  params,
}: {
  params: Promise<{ plate: string }>;
}) {
  const { plate } = await params;
  const result = await getVehicleHistoryByPlate(decodeURIComponent(plate));

  if (!result) notFound();

  const { vehicle, stays } = result;
  const isCurrentlyActive = stays.length > 0 && !stays[0].exit;

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <Link
          href="/prestacao-servicos/estoque"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Voltar para Estoque
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">
          Histórico — {vehicle.plate}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isCurrentlyActive
            ? "Este veículo está atualmente em estoque."
            : "Este veículo não está em estoque no momento."}
        </p>
      </div>

      {stays.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma movimentação encontrada para essa placa.
        </p>
      ) : (
        <div className="space-y-4">
          {stays.map((stay, index) => (
            <Card key={stay.entry.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Permanência {stays.length - index}
                  {!stay.exit && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Em estoque
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Entrada</p>
                    <p className="font-medium">
                      {formatDateTime(stay.entry.createdAt)}
                    </p>
                    <p className="text-muted-foreground">
                      {stay.entry.serviceTypeName ?? "—"} ·{" "}
                      {stay.entry.responsibleName ?? "—"}
                      {stay.entry.isDuplicateEntry && " · entrada duplicada"}
                    </p>
                    {stay.entry.serviceRequestId && (
                      <Link
                        href={`/prestacao-servicos/servicos/${stay.entry.serviceRequestId}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Ver serviço de entrada →
                      </Link>
                    )}
                  </div>

                  {stay.exit && (
                    <div>
                      <p className="text-xs text-muted-foreground">Saída</p>
                      <p className="font-medium">
                        {formatDateTime(stay.exit.createdAt)}
                      </p>
                      <p className="text-muted-foreground">
                        {stay.exit.serviceTypeName ?? "—"} ·{" "}
                        {stay.exit.responsibleName ?? "—"}
                      </p>
                      {stay.exit.serviceRequestId && (
                        <Link
                          href={`/prestacao-servicos/servicos/${stay.exit.serviceRequestId}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Ver serviço de saída →
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {stay.durationDays !== null && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">
                      Tempo em estoque:
                    </span>{" "}
                    <span className="font-medium">
                      {stay.durationDays}{" "}
                      {stay.durationDays === 1 ? "dia" : "dias"}
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
