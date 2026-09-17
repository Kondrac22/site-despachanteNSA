-- =========================================================
-- Protocolo por unidade + Exclusão de serviço
-- =========================================================

-- 1) Código curto de cada unidade (usado no protocolo, ex: MTZ, LIM, SMT)
alter table public.units
  add column if not exists code text;

create unique index if not exists units_code_unique_idx
  on public.units (code) where code is not null;

-- 2) Contador de protocolo, um por unidade
alter table public.units
  add column if not exists next_protocol_number integer not null default 1;

-- Preenche o código da Matriz que já existe
update public.units set code = 'MTZ' where name = 'Matriz' and code is null;

-- 3) Protocolo gravado no próprio serviço (fica fixo pra sempre, mesmo
-- que o código da unidade mude depois)
alter table public.service_requests
  add column if not exists protocol text;

create unique index if not exists service_requests_protocol_unique_idx
  on public.service_requests (protocol) where protocol is not null;

-- 4) Função que gera o próximo número de protocolo de uma unidade, de
-- forma segura mesmo com dois pedidos acontecendo ao mesmo tempo.
create or replace function public.increment_unit_protocol(p_unit_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_value integer;
begin
  update public.units
  set next_protocol_number = next_protocol_number + 1
  where id = p_unit_id
  returning next_protocol_number - 1 into next_value;

  return next_value;
end;
$$;

grant execute on function public.increment_unit_protocol(uuid) to authenticated;

-- 5) Registro permanente de exclusões — mesmo apagando o serviço, fica
-- o rastro de que algo foi excluído, por quem e quando.
create table if not exists public.service_request_deletions (
  id uuid primary key default gen_random_uuid(),
  original_service_request_id uuid not null,
  plate text not null,
  protocol text,
  deleted_by uuid not null references public.profiles(id),
  deleted_at timestamptz not null default now()
);

alter table public.service_request_deletions enable row level security;

create policy "service_request_deletions_select_admin" on public.service_request_deletions
  for select using (public.is_admin());
create policy "service_request_deletions_insert_admin" on public.service_request_deletions
  for insert with check (public.is_admin());

-- 6) Políticas de DELETE — elas nunca tinham sido criadas, então hoje
-- NENHUM delete funcionaria mesmo com o código pronto (RLS bloqueia
-- por padrão quando não existe política pra aquele comando).
create policy "service_requests_delete_admin_non_finalized" on public.service_requests
  for delete using (
    public.is_admin() and status <> 'FINALIZADO'
  );

create policy "service_files_delete_admin" on public.service_files
  for delete using (public.is_admin());

create policy "service_history_delete_admin" on public.service_history
  for delete using (public.is_admin());

create policy "service_documents_delete_admin" on storage.objects
  for delete using (
    bucket_id = 'service-documents' and public.is_admin()
  );
