// O Excel em português usa ";" como separador de colunas, e precisa do
// BOM no começo do arquivo pra reconhecer os acentos (UTF-8).
const SEPARATOR = ";";
const BOM = "﻿";

function csvCell(value: string) {
  // Evita que o Excel interprete um texto começando com =, +, - ou @
  // como fórmula.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function buildCsv(rows: string[][]) {
  return BOM + rows.map((row) => row.map(csvCell).join(SEPARATOR)).join("\r\n");
}

export function csvResponse(csv: string, filename: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

// Número no formato que o Excel em português lê como número (ex: 1234,50).
export function csvNumber(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  });
}

export function csvDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

export function todayInBrazil() {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Sao_Paulo",
  });
}
