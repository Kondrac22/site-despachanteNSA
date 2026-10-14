-- =========================================================
-- ZERAR TUDO — SÓ O USUÁRIO MASTER CONTINUA
-- Rode no SQL Editor do Supabase. NÃO TEM COMO DESFAZER.
--
-- APAGA: serviços, histórico, registro de anexos, registro de
--        exclusões, veículos, movimentações de estoque, tipos de
--        serviço, unidades e TODOS os usuários (login + perfil),
--        menos o master.
-- MANTÉM: só o usuário master (continua admin, fica sem unidade).
--
-- Os ARQUIVOS anexados ficam no Storage e precisam ser apagados pelo
-- painel do Supabase (veja o passo 3 no final).
-- =========================================================


-- ---------------------------------------------------------
-- PASSO 1 — CONFERIR (só mostra, não apaga nada)
-- Selecione só este bloco e clique em Run.
-- Confira na lista de usuários qual é o e-mail do master.
-- ---------------------------------------------------------
select 'service_requests (serviços)' as tabela, count(*) from public.service_requests
union all select 'service_history (histórico)', count(*) from public.service_history
union all select 'service_files (anexos)', count(*) from public.service_files
union all select 'service_request_deletions (exclusões)', count(*) from public.service_request_deletions
union all select 'vehicle_movements (estoque)', count(*) from public.vehicle_movements
union all select 'vehicles (veículos)', count(*) from public.vehicles
union all select 'service_types (tipos de serviço)', count(*) from public.service_types
union all select 'units (unidades)', count(*) from public.units
union all select 'profiles (usuários)', count(*) from public.profiles
union all select 'auth.users (logins)', count(*) from auth.users;

select p.email, p.name, p.role from public.profiles p order by p.role, p.email;


-- ---------------------------------------------------------
-- PASSO 2 — APAGAR
-- 1) Troque o e-mail abaixo pelo e-mail do usuário master.
-- 2) Selecione daqui até o "commit;" e clique em Run.
-- Se o e-mail não existir ou não for admin, o script para e
-- nada é apagado (tudo ou nada).
-- ---------------------------------------------------------
begin;

do $$
declare
  master_email text := 'leonardo.yferreira@nsadespa.com.br';  -- <<< TROQUE AQUI
  master_id uuid;
begin
  select u.id into master_id
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = lower(master_email)
    and p.role = 'admin';

  if master_id is null then
    raise exception 'Usuário master "%" não encontrado ou não é admin. Nada foi apagado.', master_email;
  end if;

  delete from public.service_history;
  delete from public.service_files;
  delete from public.vehicle_movements;
  delete from public.vehicles;
  delete from public.service_request_deletions;
  delete from public.service_requests;
  delete from public.service_types;

  -- o master fica sem unidade (unit_id vira null pelo "on delete set null")
  delete from public.units;

  -- apaga os outros usuários; o perfil sai junto pelo "on delete cascade"
  delete from public.profiles where id <> master_id;
  delete from auth.users where id <> master_id;

  raise notice 'Pronto. Só ficou o usuário %.', master_email;
end $$;

commit;


-- ---------------------------------------------------------
-- PASSO 3 — APAGAR OS ARQUIVOS (pelo painel, não por SQL)
-- No Supabase: menu Storage → bucket "service-documents" →
-- botão "..." (ou clique com o botão direito no bucket) → "Empty bucket".
-- NÃO use "Delete bucket": o bucket precisa continuar existindo.
-- ---------------------------------------------------------
