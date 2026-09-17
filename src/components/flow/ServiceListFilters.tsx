"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { id: string; name: string };

type ServiceListFiltersProps = {
  units: Option[];
  serviceTypes: Option[];
  requesters: Option[];
};

const ALL = "TODOS";

const STATUS_OPTIONS = [
  { id: "PARADO", name: "🔴 Parado" },
  { id: "A_FAZER", name: "🟢 A Fazer" },
  { id: "FINALIZADO", name: "⚪ Finalizado" },
];

const PERIOD_OPTIONS = [
  { id: "7", name: "Últimos 7 dias" },
  { id: "30", name: "Últimos 30 dias" },
];

const SORT_OPTIONS = [
  { id: "recent", name: "Mais recente" },
  { id: "oldest", name: "Mais antigo" },
  { id: "plate_asc", name: "Placa A-Z" },
  { id: "plate_desc", name: "Placa Z-A" },
  { id: "status", name: "Status" },
];

export default function ServiceListFilters({
  units,
  serviceTypes,
  requesters,
}: ServiceListFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plateInput, setPlateInput] = useState(
    searchParams.get("plate") ?? ""
  );

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page"); // qualquer mudança de filtro volta pra página 1
    router.push(`/flow/servicos?${params.toString()}`);
  }

  function FilterSelect({
    paramKey,
    placeholder,
    options,
    includeAll = true,
  }: {
    paramKey: string;
    placeholder: string;
    options: Option[];
    includeAll?: boolean;
  }) {
    const currentValue = searchParams.get(paramKey) ?? ALL;
    return (
      <Select
        value={currentValue}
        onValueChange={(v) => updateParam(paramKey, v)}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {includeAll && <SelectItem value={ALL}>Todos</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParam("plate", plateInput);
        }}
        className="flex gap-2"
      >
        <Input
          placeholder="Buscar por placa..."
          value={plateInput}
          onChange={(e) => setPlateInput(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      <div className="flex flex-wrap gap-3">
        <FilterSelect
          paramKey="requester"
          placeholder="Solicitante"
          options={requesters}
        />
        <FilterSelect paramKey="unit" placeholder="Unidade" options={units} />
        <FilterSelect
          paramKey="status"
          placeholder="Status"
          options={STATUS_OPTIONS}
        />
        <FilterSelect
          paramKey="period"
          placeholder="Período"
          options={PERIOD_OPTIONS}
        />
        <FilterSelect
          paramKey="serviceType"
          placeholder="Tipo de Serviço"
          options={serviceTypes}
        />
        <FilterSelect
          paramKey="sort"
          placeholder="Ordenar por"
          options={SORT_OPTIONS}
          includeAll={false}
        />
      </div>
    </div>
  );
}
