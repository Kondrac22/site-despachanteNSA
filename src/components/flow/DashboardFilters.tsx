"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { id: string; name: string };

type DashboardFiltersProps = {
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

export default function DashboardFilters({
  units,
  serviceTypes,
  requesters,
}: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/flow?${params.toString()}`);
  }

  function FilterSelect({
    paramKey,
    placeholder,
    options,
  }: {
    paramKey: string;
    placeholder: string;
    options: Option[];
  }) {
    const currentValue = searchParams.get(paramKey) ?? ALL;
    return (
      <Select
        value={currentValue}
        onValueChange={(value) => updateFilter(paramKey, value)}
      >
        <SelectTrigger className="w-full sm:w-[190px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
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
    </div>
  );
}
