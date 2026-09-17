"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ModuleNavProps = {
  isAdmin: boolean;
  userName: string;
};

export default function ModuleNav({ isAdmin, userName }: ModuleNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { href: "/flow", label: "Dashboard" },
    { href: "/flow/solicitar", label: "Solicitar Serviço" },
    { href: "/flow/servicos", label: "Serviços" },
    { href: "/flow/estoque", label: "Estoque de Veículos" },
    { href: "/flow/historico", label: "Histórico" },
    ...(isAdmin
      ? [
          { href: "/flow/usuarios", label: "Usuários" },
          {
            href: "/flow/tipos-servico",
            label: "Tipos de Serviço",
          },
          { href: "/flow/unidades", label: "Unidades" },
        ]
      : []),
  ];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/flow/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/flow"
          className="text-sm font-bold text-primary"
        >
          Prestação de Serviços
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

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
    </header>
  );
}
