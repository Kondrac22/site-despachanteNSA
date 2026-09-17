-- =========================================================
-- Histórico sobrevive à exclusão do serviço
-- =========================================================

-- Hoje, se um serviço é excluído, o histórico dele seria apagado junto
-- (ou a exclusão travaria, por causa da referência obrigatória).
-- Com isso aqui, o histórico continua existindo pra sempre — só perde
-- o vínculo com o serviço (que não existe mais), mas o texto de cada
-- evento (incluindo um novo evento "Pedido excluído") continua visível
-- no Histórico Global.

alter table public.service_history
  drop constraint if exists service_history_service_request_id_fkey;

alter table public.service_history
  alter column service_request_id drop not null;

alter table public.service_history
  add constraint service_history_service_request_id_fkey
  foreign key (service_request_id)
  references public.service_requests(id)
  on delete set null;
