"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTION_OPTIONS } from "@/lib/constants/history-actions";

type Option = { id: string; name: string };

const ALL = "TODOS";

const PERIOD_OPTIONS = [
  { id: "7", name: "Últimos 7 dias" },
  { id: "30", name: "Últimos 30 dias" },
];

export default function HistoryFilters({
  requesters,
}: {
  requesters: Option[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    router.push(`/prestacao-servicos/historico?${params.toString()}`);
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
        onValueChange={(v) => updateParam(paramKey, v)}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder={placeholder} />
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
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <FilterSelect
        paramKey="userId"
        placeholder="Usuário"
        options={requesters}
      />
      <FilterSelect paramKey="action" placeholder="Ação" options={ACTION_OPTIONS} />
      <FilterSelect
        paramKey="period"
        placeholder="Período"
        options={PERIOD_OPTIONS}
      />
    </div>
  );
}
