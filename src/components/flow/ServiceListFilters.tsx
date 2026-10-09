"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_OPTIONS } from "@/lib/constants/service-status";

type Option = { id: string; name: string };

type ServiceListFiltersProps = {
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
    label,
    options,
  }: {
    paramKey: string;
    label: string;
    options: Option[];
  }) {
    const currentValue = searchParams.get(paramKey) ?? ALL;
    const id = `service-filter-${paramKey}`;
    return (
      <div className="w-full space-y-1.5 sm:w-[180px]">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {label}
        </Label>
        <Select
          value={currentValue}
          onValueChange={(v) => updateParam(paramKey, v)}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {options.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
    </div>
  );
}
