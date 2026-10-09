-- =========================================================
-- Cada arquivo anexado guarda qual documento ele é (ex: "CNH")
-- Rode isto no SQL Editor do Supabase ANTES de publicar o código novo.
-- =========================================================

-- Na Nova Solicitação, cada documento do checklist tem a sua linha com
-- botão de anexar. Esta coluna guarda o nome do documento daquela linha.
-- Fica vazia (null) para "Outros documentos" e para os arquivos antigos.
alter table public.service_files
  add column if not exists document_label text;
