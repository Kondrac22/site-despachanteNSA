-- =========================================================
-- Checklist de documentos + Valor cobrado + Painel financeiro
-- Rode isto no SQL Editor do Supabase ANTES de publicar o código novo.
-- =========================================================

-- 1) Valor cobrado padrão de cada tipo de serviço (editável em
-- Tipos de Serviço).
alter table public.service_types
  add column if not exists price numeric(10, 2) not null default 0
  check (price >= 0);

-- 2) Lista de documentos esperados de cada tipo (um item por posição).
-- É só uma confirmação manual no formulário, não uma verificação dos
-- arquivos anexados.
alter table public.service_types
  add column if not exists document_checklist text[] not null default '{}';

-- 3) Valor cobrado gravado no próprio serviço no momento em que ele é
-- finalizado. Fica fixo: se o preço do tipo mudar depois, os serviços
-- já finalizados não mudam.
alter table public.service_requests
  add column if not exists charged_amount numeric(10, 2);

-- 4) Quem grava esse valor é o próprio banco, não o código do site.
-- Assim ninguém consegue alterar o valor cobrado mandando um update
-- direto pela API (a RLS não consegue restringir colunas, só linhas).
create or replace function public.set_service_request_charged_amount()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'FINALIZADO'
     and (tg_op = 'INSERT' or old.status is distinct from 'FINALIZADO') then
    select price into new.charged_amount
    from public.service_types
    where id = new.service_type_id;
  elsif tg_op = 'UPDATE' then
    new.charged_amount := old.charged_amount;
  else
    new.charged_amount := null;
  end if;
  return new;
end;
$$;

drop trigger if exists service_requests_charged_amount on public.service_requests;
create trigger service_requests_charged_amount
  before insert or update on public.service_requests
  for each row execute function public.set_service_request_charged_amount();

-- 5) Checklist sugerido para os tipos de transferência (só preenche se
-- ainda estiver vazio — pode editar depois em Tipos de Serviço).
update public.service_types
set document_checklist = array[
  'ATPV/DUT',
  'Contrato social (se PJ)',
  'CNH ou RG do(s) representante(s)',
  'Procuração (se houver)',
  'Laudo',
  'NF'
]
where name ilike '%transfer%'
  and document_checklist = '{}';
