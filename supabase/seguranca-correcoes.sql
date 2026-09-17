-- =========================================================
-- Correções de segurança (revisão pós-fase 30)
-- Rode isto no SQL Editor do Supabase.
-- =========================================================

-- PROBLEMA 1: qualquer usuário autenticado conseguia ler ou enviar
-- QUALQUER arquivo do bucket "service-documents", mesmo de um serviço
-- de outra unidade — a política só checava "está logado?", não "esse
-- documento é de um serviço que essa pessoa pode ver?".
--
-- CORREÇÃO: a política agora olha o começo do caminho do arquivo
-- (que é sempre o ID do serviço, ex: "algum-uuid/nome-do-arquivo.pdf")
-- e só libera se esse serviço for visível pra quem está pedindo —
-- exatamente a mesma regra já usada em service_requests.

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
          or sr.unit_id = (select unit_id from public.profiles where id = auth.uid())
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
          or sr.unit_id = (select unit_id from public.profiles where id = auth.uid())
        )
    )
  );

-- PROBLEMA 2: qualquer usuário autenticado conseguia registrar uma
-- movimentação de estoque (entrada/saída) ligada a QUALQUER serviço,
-- mesmo um serviço de outra unidade que ele nem deveria enxergar —
-- alguém com acesso técnico ao navegador (F12/console) poderia forjar
-- entradas ou saídas falsas de veículos de outras unidades.
--
-- CORREÇÃO: só permite a inserção se o serviço relacionado for visível
-- pra quem está fazendo a movimentação (mesma regra de sempre).

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
            or sr.unit_id = (select unit_id from public.profiles where id = auth.uid())
          )
      )
    )
  );
