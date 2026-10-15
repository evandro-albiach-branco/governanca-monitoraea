-- =====================================================================
-- Governança MonitoraEA · Anexos (arquivos, imagens, vídeos, áudios, links)
--
-- ATUALIZAÇÃO SEGURA: não apaga nada. Use este arquivo para acrescentar os
-- anexos a uma plataforma que já está funcionando (com dados e contas).
-- Pode ser rodado mais de uma vez. O schema.sql já inclui este conteúdo
-- para instalações novas.
--
-- Cria:
--   - a tabela public.anexos, ligada a itens e (opcionalmente) a comentários;
--   - o bucket privado "anexos" no Supabase Storage (limite de 50 MB por
--     arquivo, que é o máximo do plano gratuito);
--   - as regras de acesso: todos os membros veem; colaboradores anexam nos
--     itens; qualquer membro anexa nos próprios comentários; cada pessoa
--     remove o que enviou (a administração remove qualquer anexo).
-- =====================================================================

-- Comentários podem ter só um anexo (por exemplo, uma mensagem de voz)
alter table public.comentarios drop constraint if exists comentarios_texto_check;
alter table public.comentarios alter column texto set default '';

create table if not exists public.anexos (
  id             bigint generated always as identity primary key,
  item_id        bigint not null references public.itens(id) on delete cascade,
  comentario_id  bigint references public.comentarios(id) on delete cascade,
  tipo           text not null check (tipo in ('arquivo','imagem','video','audio','link')),
  nome           text not null check (length(trim(nome)) > 0),
  caminho        text unique,
  url            text check (url is null or url ~* '^https?://'),
  mime           text,
  tamanho        bigint,
  duracao_s      int,
  criado_por     uuid not null default auth.uid() references public.membros(id),
  criado_em      timestamptz not null default now(),
  check ((tipo = 'link' and url is not null and caminho is null)
      or (tipo <> 'link' and caminho is not null and url is null))
);
create index if not exists anexos_item_idx on public.anexos (item_id);
create index if not exists anexos_comentario_idx on public.anexos (comentario_id);

alter table public.anexos enable row level security;

drop policy if exists ver on public.anexos;
create policy ver on public.anexos for select to authenticated using (public.sou_membro());

drop policy if exists anexar on public.anexos;
create policy anexar on public.anexos for insert to authenticated with check (
  public.sou_membro()
  and criado_por = auth.uid()
  and (caminho is null or split_part(caminho, '/', 1) = auth.uid()::text)
  and (
    (comentario_id is null and public.posso_editar())
    or exists (select 1 from public.comentarios c
               where c.id = comentario_id and c.autor_id = auth.uid() and c.item_id = anexos.item_id)
  ));

drop policy if exists remover on public.anexos;
create policy remover on public.anexos for delete to authenticated
  using (criado_por = auth.uid() or public.meu_perfil() = 'administracao');

grant select, insert, delete on public.anexos to authenticated;
grant usage on all sequences in schema public to authenticated;

-- Histórico e aviso quando alguém anexa algo diretamente no item
create or replace function public.anexos_depois() returns trigger
language plpgsql security definer set search_path = public as $$
declare it itens; autor text;
begin
  if new.comentario_id is not null then return new; end if;
  select * into it from itens where id = new.item_id;
  select nome into autor from membros where id = new.criado_por;
  insert into eventos (item_id, autor_id, tipo, detalhe)
  values (new.item_id, new.criado_por, 'anexo', 'Anexou ' || new.nome);
  perform notificar(array[it.responsavel_id, it.criado_por, it.vez_membro_id], new.item_id, 'anexo',
                    coalesce(autor, 'Alguém') || ' anexou ' || new.nome || ' em ' || it.titulo);
  return new;
end $$;
revoke execute on function public.anexos_depois() from public, anon;

drop trigger if exists anexos_depois on public.anexos;
create trigger anexos_depois after insert on public.anexos
for each row execute function public.anexos_depois();

-- ---------------------------------------------------------------------
-- Supabase Storage: bucket privado e regras de acesso aos arquivos.
-- Os arquivos ficam em "<id da pessoa>/<id do item>/<nome>"; só se lê
-- com login de membro, por links temporários gerados pela plataforma.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('anexos', 'anexos', false, 52428800)
on conflict (id) do update set public = false;

drop policy if exists "gov_anexos_ler" on storage.objects;
create policy "gov_anexos_ler" on storage.objects for select to authenticated
  using (bucket_id = 'anexos' and public.sou_membro());

drop policy if exists "gov_anexos_enviar" on storage.objects;
create policy "gov_anexos_enviar" on storage.objects for insert to authenticated
  with check (bucket_id = 'anexos' and public.sou_membro()
              and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "gov_anexos_apagar" on storage.objects;
create policy "gov_anexos_apagar" on storage.objects for delete to authenticated
  using (bucket_id = 'anexos'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.meu_perfil() = 'administracao'));
