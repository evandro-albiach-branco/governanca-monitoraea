-- =====================================================================
-- Governança MonitoraEA · quadro: mover cards e registrar mudanças de coluna
--
-- Migração aditiva: NÃO apaga dados. Pode ser rodada mais de uma vez.
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo e "Run".
-- =====================================================================

-- Desde quando o item está na coluna atual, e quem o moveu
alter table public.itens add column if not exists fase_desde timestamptz;
alter table public.itens add column if not exists fase_por uuid references public.membros(id) on delete set null;
update public.itens i set
  fase_desde = coalesce((select max(e.criado_em) from public.eventos e where e.item_id = i.id and e.tipo = 'fase'), i.criado_em),
  fase_por   = coalesce((select e.autor_id from public.eventos e where e.item_id = i.id and e.tipo = 'fase' order by e.criado_em desc limit 1), i.criado_por)
where i.fase_desde is null;
alter table public.itens alter column fase_desde set default now();

create or replace function public.itens_fase_marca() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.fase_desde := coalesce(new.fase_desde, now());
    new.fase_por := coalesce(new.fase_por, auth.uid(), new.criado_por);
  elsif new.fase is distinct from old.fase then
    new.fase_desde := now();
    new.fase_por := auth.uid();
  end if;
  return new;
end $$;
revoke execute on function public.itens_fase_marca() from public, anon;
drop trigger if exists itens_fase_marca on public.itens;
create trigger itens_fase_marca before insert or update of fase on public.itens
for each row execute function public.itens_fase_marca();

-- A última coluna passa a se chamar "Concluído"
create or replace function public.rotulo_fase(f fase_item) returns text
language sql immutable as $$
  select case f
    when 'triagem' then 'Entrada e triagem' when 'priorizado' then 'Priorizado'
    when 'andamento' then 'Em andamento' when 'validacao' then 'Em validação'
    when 'decisao' then 'Aguardando decisão' when 'publicado' then 'Concluído'
    else 'Arquivado' end
$$;

-- Histórico: "passar a vez" vira "encaminhar a próxima ação"
create or replace function public.itens_depois() returns trigger
language plpgsql security definer set search_path = public as $$
declare silencio boolean := coalesce(current_setting('gov.silencio', true), '') = '1';
begin
  if tg_op = 'INSERT' then
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (new.id, auth.uid(), 'criado', 'Registrou o item');
    if not silencio and new.vez_membro_id is not null then
      perform notificar(array[new.vez_membro_id], new.id, 'vez', 'A próxima ação é sua: ' || new.titulo);
    end if;
    return new;
  end if;

  if new.fase is distinct from old.fase then
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (new.id, auth.uid(), 'fase', rotulo_fase(old.fase) || ' → ' || rotulo_fase(new.fase));
    if not silencio and new.fase = 'validacao' then
      perform notificar(array[new.criado_por] || membros_de(case when new.origem = 'CONJUNTA' then 'INPE' else new.origem end, true),
                        new.id, 'validacao', 'Pronto para validação: ' || new.titulo);
    end if;
  end if;

  if new.vez_instituicao is distinct from old.vez_instituicao
     or new.vez_membro_id is distinct from old.vez_membro_id then
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (new.id, auth.uid(), 'vez', 'Próxima ação encaminhada para ' || coalesce(sigla(new.vez_instituicao), '—')
            || coalesce(' (' || (select nome from membros where id = new.vez_membro_id) || ')', '')
            || coalesce(': ' || nullif(new.vez_nota, ''), ''));
    if not silencio then
      perform notificar(
        case when new.vez_membro_id is not null then array[new.vez_membro_id]
             else membros_de(new.vez_instituicao, true) end,
        new.id, 'vez', 'A próxima ação está com você: ' || new.titulo);
    end if;
  end if;

  if new.responsavel_id is distinct from old.responsavel_id then
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (new.id, auth.uid(), 'responsavel',
            'Responsável: ' || coalesce((select nome from membros where id = new.responsavel_id), 'ninguém'));
    if not silencio then
      perform notificar(array[new.responsavel_id], new.id, 'responsavel', 'Você é responsável por: ' || new.titulo);
    end if;
  end if;

  if new.prazo is distinct from old.prazo then
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (new.id, auth.uid(), 'prazo', 'Prazo: ' || coalesce(to_char(new.prazo, 'DD/MM/YYYY'), 'sem prazo'));
  end if;
  return new;
end $$;
