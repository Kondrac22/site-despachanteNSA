-- =========================================================
-- Documentos de conclusão (ex: CRLV emitido)
-- Rode isto no SQL Editor do Supabase ANTES de publicar o código novo.
-- =========================================================

-- Separa os documentos enviados na solicitação dos documentos entregues
-- ao finalizar o serviço. Os arquivos que já existem ficam como
-- 'SOLICITACAO'.
alter table public.service_files
  add column if not exists category text not null default 'SOLICITACAO'
  check (category in ('SOLICITACAO', 'CONCLUSAO'));
