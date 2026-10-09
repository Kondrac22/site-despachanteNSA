"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { STATUS_OPTIONS } from "@/lib/constants/service-status";

type Option = { id: string; name: string };

type DashboardFiltersProps = {
  units: Option[];
  serviceTypes: Option[];
  requesters: Option[];
};

const ALL = "TODOS";

const PERIOD_OPTIONS = [
  { id: "7", name: "Últimos 7 dias" },
  { id: "30", name: "Últimos 30 dias" },
];

const URGENT_OPTIONS = [{ id: "1", name: "🚨 Só urgentes" }];

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
    label,
    options,
  }: {
    paramKey: string;
    label: string;
    options: Option[];
  }) {
    const currentValue = searchParams.get(paramKey) ?? ALL;
    const id = `dashboard-filter-${paramKey}`;
    return (
      <div className="w-full space-y-1.5 sm:w-[190px]">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {label}
        </Label>
        <Select
          value={currentValue}
          onValueChange={(value) => updateFilter(paramKey, value)}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={label} />
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
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <FilterSelect
        paramKey="requester"
        label="Solicitante"
        options={requesters}
      />
      <FilterSelect paramKey="unit" label="Unidade" options={units} />
      <FilterSelect
        paramKey="status"
        label="Status"
        options={STATUS_OPTIONS}
      />
      <FilterSelect
        paramKey="period"
        label="Período"
        options={PERIOD_OPTIONS}
      />
      <FilterSelect
        paramKey="serviceType"
        label="Tipo de Serviço"
        options={serviceTypes}
      />
      <FilterSelect
        paramKey="urgent"
        label="Urgência"
        options={URGENT_OPTIONS}
      />
    </div>
  );
}
