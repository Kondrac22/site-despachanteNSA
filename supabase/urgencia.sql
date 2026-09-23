-- =========================================================
-- Sinal de urgência nos serviços
-- Rode isto no SQL Editor do Supabase ANTES de publicar o código novo.
-- =========================================================

alter table public.service_requests
  add column if not exists is_urgent boolean not null default false;

-- Deixa rápida a contagem de urgentes em aberto do Dashboard.
create index if not exists service_requests_urgent_open_idx
  on public.service_requests (is_urgent)
  where is_urgent and status <> 'FINALIZADO';
