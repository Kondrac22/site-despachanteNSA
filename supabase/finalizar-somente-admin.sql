-- =========================================================
-- Somente administrador pode finalizar um serviço
-- Rode isto no SQL Editor do Supabase.
-- =========================================================

-- O sistema já esconde o botão e recusa no servidor; esta trava no
-- banco garante a regra mesmo para quem tentar mudar o status direto
-- pelo navegador (F12/console).
-- Quando não há usuário logado (SQL Editor, chave de serviço) a trava
-- não se aplica, para não atrapalhar manutenção.
create or replace function public.only_admin_can_finalize()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'FINALIZADO'
     and (tg_op = 'INSERT' or old.status is distinct from 'FINALIZADO')
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Somente administradores podem finalizar um serviço.';
  end if;
  return new;
end;
$$;

drop trigger if exists only_admin_can_finalize on public.service_requests;
create trigger only_admin_can_finalize
  before insert or update of status on public.service_requests
  for each row execute function public.only_admin_can_finalize();
