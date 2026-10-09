-- =========================================================
-- Urgentes em aberto sempre no topo da lista de Serviços
-- Rode isto no SQL Editor do Supabase ANTES de publicar o código novo.
-- =========================================================

-- Coluna calculada pelo próprio banco (ninguém grava nela): verdadeira
-- quando o serviço é urgente e ainda não foi finalizado. Existe só pra
-- lista conseguir ordenar por isso — a API não ordena por expressão.
alter table public.service_requests
  add column if not exists is_urgent_open boolean
  generated always as (is_urgent and status <> 'FINALIZADO') stored;
