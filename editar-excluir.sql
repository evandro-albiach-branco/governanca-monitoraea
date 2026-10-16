-- =====================================================================
-- Governança MonitoraEA · edição completa e exclusão de itens
--
-- Migração aditiva: NÃO apaga dados. Pode ser rodada mais de uma vez.
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo e "Run".
-- =====================================================================

-- Quem pode excluir um item: a administração ou quem o registrou
drop policy if exists excluir on public.itens;
create policy excluir on public.itens for delete to authenticated
  using (public.meu_perfil() = 'administracao' or (criado_por = auth.uid() and public.posso_editar()));
grant delete on public.itens to authenticated;

-- Histórico: registra quando título, descrição ou classificação mudam
create or replace function public.itens_edicao() returns trigger
language plpgsql security definer set search_path = public as $$
declare mud text[] := '{}';
begin
  if auth.uid() is null then return new; end if;   -- mudanças vindas do GitHub já têm registro próprio
  if new.titulo is distinct from old.titulo then mud := array_append(mud, 'título'); end if;
  if new.descricao is distinct from old.descricao then mud := array_append(mud, 'descrição'); end if;
  if new.tipo is distinct from old.tipo then mud := array_append(mud, 'tipo'); end if;
  if new.frente is distinct from old.frente then mud := array_append(mud, 'frente'); end if;
  if new.modulo is distinct from old.modulo then mud := array_append(mud, 'módulo'); end if;
  if new.instrumento is distinct from old.instrumento then mud := array_append(mud, 'instrumento'); end if;
  if cardinality(mud) > 0 then
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (new.id, auth.uid(), 'edicao', 'Editou ' || array_to_string(mud, ', '));
  end if;
  return new;
end $$;
revoke execute on function public.itens_edicao() from public, anon;

drop trigger if exists itens_edicao on public.itens;
create trigger itens_edicao after update on public.itens
for each row execute function public.itens_edicao();
