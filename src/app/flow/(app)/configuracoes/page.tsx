import { redirect } from "next/navigation";

// Ao entrar em Configurações, abre direto na primeira aba.
export default function ConfiguracoesPage() {
  redirect("/flow/configuracoes/usuarios");
}
