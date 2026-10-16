-- =========================================================
-- Exclusão de anexos por quem criou o serviço
-- Rode isto no SQL Editor do Supabase ANTES de publicar o código novo.
-- =========================================================

-- Até aqui só admin podia apagar anexos (protocolo-unidades-exclusao.sql).
-- Agora quem criou o serviço também pode — a mesma regra de quem pode
-- anexar —, desde que o serviço não esteja finalizado. Vendedor continua
-- sem poder apagar nada.

drop policy if exists "service_files_delete_creator_open" on public.service_files;
create policy "service_files_delete_creator_open" on public.service_files
  for delete using (
    not public.is_vendedor()
    and exists (
      select 1 from public.service_requests sr
      where sr.id = service_files.service_request_id
        and sr.created_by = auth.uid()
        and sr.status <> 'FINALIZADO'
    )
  );

drop policy if exists "service_documents_delete_creator_open" on storage.objects;
create policy "service_documents_delete_creator_open" on storage.objects
  for delete using (
    bucket_id = 'service-documents'
    and not public.is_vendedor()
    and exists (
      select 1 from public.service_requests sr
      where sr.id::text = split_part(storage.objects.name, '/', 1)
        and sr.created_by = auth.uid()
        and sr.status <> 'FINALIZADO'
    )
  );
