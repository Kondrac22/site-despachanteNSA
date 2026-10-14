-- =========================================================
-- Mais de uma unidade por usuário
-- Rode isto no SQL Editor do Supabase ANTES de publicar o código novo.
-- =========================================================

-- As unidades habilitadas de cada usuário ficam em profile_units.
-- profiles.unit_id continua existindo como a unidade "principal" (é a
-- que já vem selecionada ao solicitar um serviço).
create table if not exists public.profile_units (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, unit_id)
);

alter table public.profile_units enable row level security;

-- Todo usuário que já tinha unidade passa a tê-la habilitada aqui.
insert into public.profile_units (profile_id, unit_id)
select id, unit_id from public.profiles where unit_id is not null
on conflict do nothing;

-- Cada um vê as próprias unidades; só o admin altera.
drop policy if exists "profile_units_select" on public.profile_units;
create policy "profile_units_select" on public.profile_units
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "profile_units_insert_admin" on public.profile_units;
create policy "profile_units_insert_admin" on public.profile_units
  for insert with check (public.is_admin());

drop policy if exists "profile_units_delete_admin" on public.profile_units;
create policy "profile_units_delete_admin" on public.profile_units
  for delete using (public.is_admin());

-- "O usuário logado trabalha nessa unidade?" — substitui a comparação
-- com profiles.unit_id nas regras de acesso.
create or replace function public.user_has_unit(p_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profile_units
    where profile_id = auth.uid() and unit_id = p_unit_id
  );
$$;

grant execute on function public.user_has_unit(uuid) to authenticated;

-- Regras de seguranca-correcoes.sql, agora olhando todas as unidades
-- do usuário.
drop policy if exists "service_documents_select" on storage.objects;
create policy "service_documents_select" on storage.objects
  for select using (
    bucket_id = 'service-documents'
    and auth.uid() is not null
    and exists (
      select 1 from public.service_requests sr
      where sr.id::text = split_part(storage.objects.name, '/', 1)
        and (
          public.is_admin()
          or sr.created_by = auth.uid()
          or public.user_has_unit(sr.unit_id)
        )
    )
  );

drop policy if exists "service_documents_insert" on storage.objects;
create policy "service_documents_insert" on storage.objects
  for insert with check (
    bucket_id = 'service-documents'
    and auth.uid() is not null
    and exists (
      select 1 from public.service_requests sr
      where sr.id::text = split_part(storage.objects.name, '/', 1)
        and (
          public.is_admin()
          or sr.created_by = auth.uid()
          or public.user_has_unit(sr.unit_id)
        )
    )
  );

drop policy if exists "vehicle_movements_insert_authenticated" on public.vehicle_movements;
create policy "vehicle_movements_insert_authenticated" on public.vehicle_movements
  for insert with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and (
      service_request_id is null
      or exists (
        select 1 from public.service_requests sr
        where sr.id = vehicle_movements.service_request_id
          and (
            public.is_admin()
            or sr.created_by = auth.uid()
            or public.user_has_unit(sr.unit_id)
          )
      )
    )
  );

-- ---------------------------------------------------------
-- CONFERIR: outras regras que ainda comparam com profiles.unit_id
-- (ex.: as de service_requests, que não estão neste repositório).
-- Cada uma listada aqui precisa trocar
--   unit_id = (select unit_id from public.profiles where id = auth.uid())
-- por
--   public.user_has_unit(unit_id)
-- senão o usuário não enxerga/cria serviços das unidades extras.
-- ---------------------------------------------------------
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where (qual ilike '%profiles%unit_id%' or with_check ilike '%profiles%unit_id%')
order by schemaname, tablename, policyname;
