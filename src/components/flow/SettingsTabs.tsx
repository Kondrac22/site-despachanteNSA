"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/flow/configuracoes/usuarios", label: "Usuários" },
  { href: "/flow/configuracoes/tipos-servico", label: "Tipos de Serviço" },
  { href: "/flow/configuracoes/unidades", label: "Unidades" },
];

export default function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            pathname.startsWith(tab.href)
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-primary"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
