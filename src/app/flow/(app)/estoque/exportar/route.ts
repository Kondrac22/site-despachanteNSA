import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStockList } from "@/lib/queries/vehicles";

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

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const rows = await getCurrentStockList();

  const header = [
    "Placa",
    "Protocolo",
    "Data de Entrada",
    "Tipo de Serviço",
    "Responsável",
    "Situação",
  ];
  const lines = rows.map((row) =>
    [
      row.plate,
      row.protocol ?? "",
      formatDate(row.entry_at),
      row.service_type_name ?? "",
      row.responsible_name ?? "",
      "Em estoque",
    ]
      .map(csvCell)
      .join(SEPARATOR)
  );

  const csv = BOM + [header.join(SEPARATOR), ...lines].join("\r\n");
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Sao_Paulo",
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="estoque-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
