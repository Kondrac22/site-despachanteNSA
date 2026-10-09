-- =========================================================
-- ZERAR DADOS DE TESTE (antes de entrar em produção)
-- Rode no SQL Editor do Supabase. NÃO TEM COMO DESFAZER.
--
-- APAGA: serviços, histórico, registro de anexos, registro de
--        exclusões, veículos e movimentações de estoque.
-- MANTÉM: usuários, unidades e tipos de serviço (valores e checklists).
-- ZERA: o protocolo de cada unidade volta a começar do 0001.
--
-- Os ARQUIVOS anexados ficam no Storage e precisam ser apagados pelo
-- painel do Supabase (veja o passo 3 no final).
-- =========================================================


-- ---------------------------------------------------------
-- PASSO 1 — CONFERIR (só mostra os números, não apaga nada)
-- Selecione só este bloco e clique em Run.
-- ---------------------------------------------------------
select 'service_requests (serviços)' as tabela, count(*) from public.service_requests
union all select 'service_history (histórico)', count(*) from public.service_history
union all select 'service_files (anexos)', count(*) from public.service_files
union all select 'service_request_deletions (exclusões)', count(*) from public.service_request_deletions
union all select 'vehicle_movements (estoque)', count(*) from public.vehicle_movements
union all select 'vehicles (veículos)', count(*) from public.vehicles
union all select 'profiles (usuários — MANTÉM)', count(*) from public.profiles
union all select 'units (unidades — MANTÉM)', count(*) from public.units
union all select 'service_types (tipos — MANTÉM)', count(*) from public.service_types;


-- ---------------------------------------------------------
-- PASSO 2 — APAGAR
-- Selecione daqui até o "commit;" e clique em Run.
-- Se der qualquer erro no meio, nada é apagado (tudo ou nada).
-- ---------------------------------------------------------
begin;

delete from public.service_history;
delete from public.service_files;
delete from public.vehicle_movements;
delete from public.vehicles;
delete from public.service_request_deletions;
delete from public.service_requests;

update public.units set next_protocol_number = 1;

commit;


-- ---------------------------------------------------------
-- PASSO 3 — APAGAR OS ARQUIVOS (pelo painel, não por SQL)
-- No Supabase: menu Storage → bucket "service-documents" →
-- botão "..." (ou clique com o botão direito no bucket) → "Empty bucket".
-- NÃO use "Delete bucket": o bucket precisa continuar existindo.
-- ---------------------------------------------------------
