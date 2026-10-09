// Fica num arquivo à parte porque as listas, os filtros, a busca e as
// ações (server) precisam dos mesmos status e rótulos.
export type ServiceStatus =
  | "PARADO"
  | "A_FAZER"
  | "PENDENTE_DOCUMENTO"
  | "FINALIZADO";

export const STATUS_LABEL: Record<string, string> = {
  PARADO: "🔴 Parado",
  A_FAZER: "🟢 A Fazer",
  PENDENTE_DOCUMENTO: "🔵 Pendência de documento",
  FINALIZADO: "⚪ Finalizado",
};

export const STATUS_OPTIONS = Object.entries(STATUS_LABEL).map(
  ([id, name]) => ({ id, name })
);

// Status em que o campo "motivo" (stopped_reason) é obrigatório e
// aparece nas listas: o motivo da parada ou o documento que está faltando.
export const STATUS_WITH_REASON: ServiceStatus[] = [
  "PARADO",
  "PENDENTE_DOCUMENTO",
];

export const REASON_TEXT_CLASS: Record<string, string> = {
  PARADO: "text-red-700",
  PENDENTE_DOCUMENTO: "text-blue-700",
};
