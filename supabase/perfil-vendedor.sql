-- =========================================================
-- Perfil "Vendedor" (somente leitura)
-- Rode isto no SQL Editor do Supabase ANTES de publicar o código novo.
-- =========================================================

-- 1) Aceita o novo perfil na coluna role (troca a regra antiga, que só
-- aceitava admin e user, seja qual for o nome que ela recebeu).
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', c.conname);
  end loop;
end;
$$;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'user', 'vendedor'));

-- 2) "O usuário logado é vendedor?"
create or replace function public.is_vendedor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'vendedor'
  );
$$;

grant execute on function public.is_vendedor() to authenticated;

-- 3) Bloqueios no próprio banco (valem mesmo para quem tentar mexer
-- pela API, fora do site). São regras "restrictive": somam-se às que
-- já existem, só tirando permissão do vendedor.

-- Não altera nem exclui serviços (status, urgência etc.).
drop policy if exists "service_requests_update_not_vendedor" on public.service_requests;
create policy "service_requests_update_not_vendedor" on public.service_requests
  as restrictive for update using (not public.is_vendedor());

drop policy if exists "service_requests_delete_not_vendedor" on public.service_requests;
create policy "service_requests_delete_not_vendedor" on public.service_requests
  as restrictive for delete using (not public.is_vendedor());

-- Não registra entrada/saída de veículos no estoque.
drop policy if exists "vehicle_movements_insert_not_vendedor" on public.vehicle_movements;
create policy "vehicle_movements_insert_not_vendedor" on public.vehicle_movements
  as restrictive for insert with check (not public.is_vendedor());

-- Anexos: só os da própria solicitação, logo depois de criá-la
-- (15 minutos, o tempo do envio feito pelo formulário).
drop policy if exists "service_files_insert_not_vendedor" on public.service_files;
create policy "service_files_insert_not_vendedor" on public.service_files
  as restrictive for insert with check (
    not public.is_vendedor()
    or exists (
      select 1 from public.service_requests sr
      where sr.id = service_files.service_request_id
        and sr.created_by = auth.uid()
        and sr.created_at > now() - interval '15 minutes'
    )
  );

drop policy if exists "service_documents_insert_not_vendedor" on storage.objects;
create policy "service_documents_insert_not_vendedor" on storage.objects
  as restrictive for insert with check (
    bucket_id <> 'service-documents'
    or not public.is_vendedor()
    or exists (
      select 1 from public.service_requests sr
      where sr.id::text = split_part(storage.objects.name, '/', 1)
        and sr.created_by = auth.uid()
        and sr.created_at > now() - interval '15 minutes'
    )
  );
