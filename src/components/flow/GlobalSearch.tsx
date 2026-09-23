"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { searchServices, type SearchResult } from "@/lib/actions/search-services";
import { isValidPlate, normalizePlate } from "@/lib/validation/plate";
import { cn } from "@/lib/utils";
import UrgentBadge from "@/components/flow/UrgentBadge";

const STATUS_LABEL: Record<string, string> = {
  PARADO: "🔴 Parado",
  A_FAZER: "🟢 A Fazer",
  FINALIZADO: "⚪ Finalizado",
};

type Item = { key: string; href: string; result?: SearchResult; label?: string };

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const requestId = useRef(0);

  // Ctrl+K (ou Cmd+K no Mac) abre/fecha a busca de qualquer tela.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Espera o usuário parar de digitar antes de buscar. O requestId
  // descarta respostas antigas que chegarem depois de uma mais nova.
  useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const currentId = ++requestId.current;
    const timeout = setTimeout(async () => {
      const found = await searchServices(trimmed);
      if (currentId !== requestId.current) return;
      setResults(found);
      setActiveIndex(0);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [term]);

  const plate = normalizePlate(term);
  const items: Item[] = [
    ...results.map((r) => ({
      key: r.id,
      href: `/flow/servicos/${r.id}`,
      result: r,
    })),
    ...(isValidPlate(plate)
      ? [
          {
            key: `estoque-${plate}`,
            href: `/flow/estoque/${plate}`,
            label: `Ver histórico de estoque da placa ${plate}`,
          },
        ]
      : []),
  ];

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) {
      setTerm("");
      setResults([]);
      setActiveIndex(0);
    }
  }

  function go(item: Item) {
    handleOpenChange(false);
    router.push(item.href);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(items[Math.min(activeIndex, items.length - 1)]);
    }
  }

  const trimmed = term.trim();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline">Buscar placa ou protocolo</span>
        <kbd className="hidden rounded border bg-muted px-1.5 text-[10px] font-medium lg:inline">
          Ctrl K
        </kbd>
        <span className="sr-only lg:hidden">Buscar</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="top-[20%] translate-y-0 gap-3 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Busca global</DialogTitle>
            <DialogDescription>
              Digite uma placa (ex: ABC1234) ou um protocolo (ex: MTZ-0001).
            </DialogDescription>
          </DialogHeader>

          <Input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Placa ou protocolo..."
            className="uppercase"
            aria-label="Placa ou protocolo"
          />

          <div className="max-h-[50vh] overflow-y-auto">
            {trimmed.length < 2 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Digite pelo menos 2 caracteres.
              </p>
            ) : loading && results.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Buscando...
              </p>
            ) : items.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum serviço encontrado.
              </p>
            ) : (
              <ul className="space-y-1" role="listbox">
                {items.map((item, index) => (
                  <li key={item.key} role="option" aria-selected={index === activeIndex}>
                    <button
                      type="button"
                      onClick={() => go(item)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "w-full rounded-md px-3 py-2 text-left text-sm",
                        index === activeIndex ? "bg-muted" : "hover:bg-muted"
                      )}
                    >
                      {item.result ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs">
                              {item.result.protocol ?? "—"}
                            </span>
                            <span className="font-medium">
                              {item.result.plate}
                            </span>
                            <span className="text-xs">
                              {STATUS_LABEL[item.result.status] ??
                                item.result.status}
                            </span>
                            {item.result.isUrgent &&
                              item.result.status !== "FINALIZADO" && (
                                <UrgentBadge />
                              )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.result.serviceTypeName ?? "—"} ·{" "}
                            {new Date(
                              item.result.requestedAt
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </>
                      ) : (
                        <span className="font-medium text-primary">
                          {item.label} →
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
