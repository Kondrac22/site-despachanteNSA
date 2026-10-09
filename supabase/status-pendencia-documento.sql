-- =========================================================
-- Libera o status "Pendência de documento" (PENDENTE_DOCUMENTO)
-- Rode isto no SQL Editor do Supabase.
-- =========================================================

-- O banco foi criado aceitando só PARADO, A_FAZER e FINALIZADO na
-- coluna status de service_requests, então ele recusava os serviços
-- novos com pendência de documento ("Não foi possível criar o serviço").
-- Essa regra foi criada direto no Supabase, então este script descobre
-- sozinho como ela está feita (lista fixa de valores ou tipo enum) e
-- troca por uma que aceita os quatro status.
do $$
declare
  col_type text;
  col_udt text;
  r record;
begin
  select data_type, udt_name into col_type, col_udt
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'service_requests'
    and column_name = 'status';

  -- Caso 1: a coluna é de um tipo enum → acrescenta o valor novo.
  if col_type = 'USER-DEFINED' then
    execute format(
      'alter type public.%I add value if not exists %L',
      col_udt,
      'PENDENTE_DOCUMENTO'
    );
  end if;

  -- Caso 2: regra (check) com a lista de status → apaga a antiga...
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.service_requests'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format(
      'alter table public.service_requests drop constraint %I',
      r.conname
    );
  end loop;

  -- ...e cria a nova, com os quatro status (só quando a coluna é texto).
  if col_type <> 'USER-DEFINED' then
    alter table public.service_requests
      add constraint service_requests_status_check
      check (status in ('PARADO', 'A_FAZER', 'PENDENTE_DOCUMENTO', 'FINALIZADO'));
  end if;
end $$;

-- Conferência: deve mostrar a regra nova com os quatro status
-- (ou nada, se a coluna for enum).
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.service_requests'::regclass and contype = 'c';
