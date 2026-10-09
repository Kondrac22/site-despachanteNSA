"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import GlobalSearch from "@/components/flow/GlobalSearch";

type ModuleNavProps = {
  isAdmin: boolean;
  userName: string;
};

export default function ModuleNav({ isAdmin, userName }: ModuleNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { href: "/flow", label: "Painel" },
    { href: "/flow/solicitar", label: "Nova Solicitação" },
    { href: "/flow/servicos", label: "Acompanhamento" },
    { href: "/flow/estoque", label: "Estoque de Veículos" },
    { href: "/flow/historico", label: "Histórico" },
    ...(isAdmin
      ? [
          { href: "/flow/financeiro", label: "Financeiro" },
          { href: "/flow/configuracoes", label: "Configurações" },
        ]
      : []),
  ];

  // Também marca o item como ativo nas subpáginas (ex: as abas de
  // Configurações). O Painel ("/flow") só quando é exatamente ele.
  function isActive(href: string) {
    if (href === "/flow") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/flow/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex min-h-16 items-center justify-between gap-4 px-4 py-2">
        <Link
          href="/flow"
          className="text-sm font-bold text-primary"
        >
          Prestação de Serviços
        </Link>

        <nav className="hidden md:flex flex-wrap items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                  : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <GlobalSearch />

          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{userName}</span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sair</span>
            </Button>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={handleSignOut}
                  className="text-left text-lg font-medium text-destructive"
                >
                  Sair
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
