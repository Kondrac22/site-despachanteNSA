-- =========================================================
-- Estoque atual mais leve
-- Rode isto no SQL Editor do Supabase ANTES de publicar o código novo.
-- =========================================================

-- Antes, o Painel e a página de Estoque baixavam TODAS as movimentações
-- de veículos para descobrir a última de cada um. Esta view faz isso no
-- próprio banco e devolve só os veículos em estoque (último movimento =
-- entrada), já com os dados que as telas mostram.
-- security_invoker: a view respeita as regras de acesso (RLS) de quem
-- consulta, igual às tabelas de origem.
create or replace view public.current_vehicle_stock
with (security_invoker = true) as
select
  lm.vehicle_id,
  v.plate,
  lm.created_at as entry_at,
  lm.service_request_id,
  sr.protocol,
  sr.unit_id,
  u.name as unit_name,
  st.name as service_type_name,
  p.name as responsible_name
from (
  select distinct on (vehicle_id)
    vehicle_id, movement_type, created_at, service_request_id, user_id
  from public.vehicle_movements
  order by vehicle_id, created_at desc
) lm
left join public.vehicles v on v.id = lm.vehicle_id
left join public.profiles p on p.id = lm.user_id
left join public.service_requests sr on sr.id = lm.service_request_id
left join public.units u on u.id = sr.unit_id
left join public.service_types st on st.id = sr.service_type_id
where lm.movement_type = 'ENTRY';

grant select on public.current_vehicle_stock to authenticated;

-- Índice para achar a última movimentação de cada veículo sem varrer
-- a tabela inteira.
create index if not exists vehicle_movements_vehicle_created_idx
  on public.vehicle_movements (vehicle_id, created_at desc);
