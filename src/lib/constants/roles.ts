// Perfis de usuário. O vendedor só consulta: pode abrir solicitações,
// mas não altera serviços existentes nem acessa Financeiro/Configurações.
export type Role = "admin" | "user" | "vendedor";

export const ROLE_LABEL: Record<Role, string> = {
  user: "Usuário",
  vendedor: "Vendedor",
  admin: "Administrador",
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABEL).map(([id, name]) => ({
  id: id as Role,
  name,
}));

export function isRole(value: string): value is Role {
  return value in ROLE_LABEL;
}

export const VENDEDOR_READ_ONLY_ERROR =
  "Vendedor só pode visualizar os serviços, não alterá-los.";

// Janela em que o vendedor ainda pode anexar os documentos da própria
// solicitação (o envio acontece logo depois de criar o serviço). Igual
// à de supabase/perfil-vendedor.sql.
export const VENDEDOR_UPLOAD_WINDOW_MINUTES = 15;
