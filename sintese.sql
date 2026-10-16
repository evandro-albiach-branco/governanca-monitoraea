-- =====================================================================
-- Governança MonitoraEA · Síntese (destaques)
--
-- Migração aditiva: NÃO apaga dados. Pode ser rodada mais de uma vez.
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo e "Run".
-- =====================================================================

-- Itens em destaque aparecem na linha do tempo da Síntese
alter table public.itens add column if not exists destaque boolean not null default false;

-- Só a coordenação (das duas instituições) e a administração marcam destaques
create or replace function public.itens_destaque() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.destaque is distinct from old.destaque and auth.uid() is not null
     and coalesce(public.meu_perfil()::text, '') not in ('coordenacao', 'administracao') then
    raise exception 'SEM_PERMISSAO: só a coordenação ou a administração marcam destaques';
  end if;
  if new.destaque is distinct from old.destaque and auth.uid() is not null then
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (new.id, auth.uid(), 'destaque', case when new.destaque then 'Marcou como destaque' else 'Tirou dos destaques' end);
  end if;
  return new;
end $$;
revoke execute on function public.itens_destaque() from public, anon;

drop trigger if exists itens_destaque on public.itens;
create trigger itens_destaque before update of destaque on public.itens
for each row execute function public.itens_destaque();
