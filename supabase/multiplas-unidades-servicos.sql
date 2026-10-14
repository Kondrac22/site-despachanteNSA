-- =========================================================
-- Mais de uma unidade por usuário — parte 2
-- Rode isto no SQL Editor do Supabase DEPOIS de multiplas-unidades.sql.
-- =========================================================

-- As regras de leitura de service_requests, service_files e
-- service_history foram criadas pelo painel e comparam a unidade do
-- serviço com profiles.unit_id (uma unidade só). Este bloco reescreve
-- cada uma trocando só esse trecho por public.user_has_unit(...), que
-- olha todas as unidades habilitadas do usuário. O resto da regra
-- (admin, quem criou o serviço etc.) fica igual.
-- Se alguma regra não estiver no formato esperado, nada é alterado.
do $$
declare
  pol record;
  new_qual text;
begin
  for pol in
    select tablename, policyname, qual
    from pg_policies
    where schemaname = 'public'
      and policyname in (
        'service_requests_select',
        'service_files_select',
        'service_history_select'
      )
  loop
    new_qual := regexp_replace(
      pol.qual,
      '(\w+\.)?unit_id = \( SELECT profiles\.unit_id\s+FROM (public\.)?profiles\s+WHERE \(profiles\.id = auth\.uid\(\)\)\)',
      'public.user_has_unit(\1unit_id)',
      'g'
    );

    if new_qual = pol.qual then
      raise exception 'Regra % (%) não está no formato esperado: %',
        pol.policyname, pol.tablename, pol.qual;
    end if;

    execute format(
      'alter policy %I on public.%I using (%s)',
      pol.policyname, pol.tablename, new_qual
    );
  end loop;
end;
$$;

-- CONFERIR: tem que voltar vazio (nenhuma regra usa mais a unidade
-- única do perfil).
select schemaname, tablename, policyname, cmd, qual
from pg_policies
where (qual ilike '%profiles%unit_id%' or with_check ilike '%profiles%unit_id%');
