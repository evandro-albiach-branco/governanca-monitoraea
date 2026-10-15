-- =====================================================================
-- Governança MonitoraEA · integração com as issues do GitHub
--
-- Migração aditiva: NÃO apaga dados. Pode ser rodada mais de uma vez.
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e
-- clique em "Run". Depois rode, uma vez, a configuração descrita no
-- README (github_configurar).
--
-- Como funciona: uma automação (GitHub Action) no repositório das issues
-- envia cada issue nova ou alterada para a "caixa de entrada" da
-- plataforma (tabela github_issues). Nada entra no Quadro sozinho: alguém
-- da equipe escolhe, na página GitHub, quais issues viram itens (ou a que
-- item existente cada uma se vincula). A partir daí, o item acompanha a
-- issue: atribuição, fechamento, reabertura e comentários.
-- A automação se identifica com um segredo que só ela e o banco conhecem;
-- o banco guarda apenas o "hash" desse segredo.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Colunas novas
-- ---------------------------------------------------------------------
alter table public.membros add column if not exists github text;
create unique index if not exists membros_github_idx on public.membros (lower(github)) where github is not null;

alter table public.itens
  add column if not exists github_repo       text,
  add column if not exists github_numero     int,
  add column if not exists github_url        text,
  add column if not exists github_estado     text,
  add column if not exists github_etiquetas  text[] not null default '{}',
  add column if not exists github_atribuidos text[] not null default '{}',
  add column if not exists github_criado     boolean not null default false,
  add column if not exists github_sinc       timestamptz;
alter table public.itens drop constraint if exists itens_github_estado_check;
alter table public.itens add constraint itens_github_estado_check
  check (github_estado is null or github_estado in ('aberta','fechada','descartada'));
create unique index if not exists itens_github_idx on public.itens (lower(github_repo), github_numero)
  where github_numero is not null;

-- ---------------------------------------------------------------------
-- Configuração (uma linha só; ninguém lê pelo site)
-- ---------------------------------------------------------------------
create table if not exists public.github_config (
  id            int primary key default 1 check (id = 1),
  repo          text not null,
  segredo_hash  text not null,
  origem        text not null default 'INPE' check (origem in ('INPE','ANPPEA','CONJUNTA')),
  criador       uuid not null references public.membros(id),
  etiquetas     jsonb not null default '{}'::jsonb
);
alter table public.github_config enable row level security;
revoke all on public.github_config from anon, authenticated;

-- ---------------------------------------------------------------------
-- Caixa de entrada: espelho das issues do repositório
-- ---------------------------------------------------------------------
create table if not exists public.github_issues (
  repo             text not null,
  numero           int not null,
  titulo           text not null,
  corpo            text,
  estado           text not null check (estado in ('aberta','fechada','descartada')),
  etiquetas        text[] not null default '{}',
  atribuidos       text[] not null default '{}',
  autor            text,
  url              text,
  frente_sugerida  frente_item,
  criada_em        timestamptz,
  atualizada_em    timestamptz,
  sinc             timestamptz not null default now(),
  ignorada         boolean not null default false,
  ignorada_por     uuid references public.membros(id) on delete set null,
  primary key (repo, numero)
);
alter table public.github_issues enable row level security;
drop policy if exists ver on public.github_issues;
create policy ver on public.github_issues for select to authenticated using (public.sou_membro());
revoke all on public.github_issues from anon;
grant select on public.github_issues to authenticated;

-- Versões anteriores deste arquivo tinham outra assinatura
drop function if exists public.github_configurar(text, text, text, text, boolean, jsonb);

-- Configura (ou reconfigura) a integração. Só roda pelo SQL Editor.
--   p_repo:   "dono/repositorio", por exemplo 'ladis-inpe/monitoraea'
--   p_segredo: o mesmo texto guardado no segredo GOVERNANCA_SEGREDO do GitHub
--   p_email:  e-mail de um membro ativo (responsável técnico pela integração)
--   p_origem: origem sugerida ao trazer uma issue para o Quadro
--   p_etiquetas: correspondência extra etiqueta → frente,
--             por exemplo '{"frontend":"desenvolvimento","bug":"operacao"}'
create or replace function public.github_configurar(
  p_repo text, p_segredo text, p_email text,
  p_origem text default 'INPE', p_etiquetas jsonb default '{}'::jsonb
) returns text
language plpgsql security definer set search_path = public as $$
declare v_criador uuid; v_repo text := trim(both '/' from trim(p_repo));
begin
  v_repo := regexp_replace(v_repo, '^https?://github\.com/', '', 'i');
  v_repo := trim(both '/' from v_repo);
  if v_repo !~ '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$' then
    raise exception 'GITHUB_REPO: informe o repositório como dono/nome (ex.: minha-org/monitoraea)';
  end if;
  if length(coalesce(p_segredo, '')) < 24 then
    raise exception 'GITHUB_SEGREDO: use um segredo com pelo menos 24 caracteres';
  end if;
  select id into v_criador from membros where lower(email) = lower(trim(p_email)) and ativo;
  if v_criador is null then
    raise exception 'GITHUB_EMAIL: não há membro ativo com o e-mail %', p_email;
  end if;
  insert into github_config (id, repo, segredo_hash, origem, criador, etiquetas)
  values (1, v_repo, encode(sha256(convert_to(p_segredo, 'UTF8')), 'hex'), p_origem, v_criador,
          coalesce(p_etiquetas, '{}'::jsonb))
  on conflict (id) do update set repo = excluded.repo, segredo_hash = excluded.segredo_hash,
    origem = excluded.origem, criador = excluded.criador, etiquetas = excluded.etiquetas;
  return 'Integração configurada para ' || v_repo;
end $$;
revoke execute on function public.github_configurar(text, text, text, text, jsonb) from public, anon, authenticated;

-- Etiqueta do GitHub → frente da plataforma
create or replace function public.github_frente(p_etiquetas text[], p_mapa jsonb) returns frente_item
language plpgsql stable set search_path = public as $$
declare l text; n text;
begin
  foreach l in array coalesce(p_etiquetas, '{}') loop
    n := lower(translate(trim(l), 'ÁÀÃÂÉÊÍÓÔÕÚÇáàãâéêíóôõúç', 'AAAAEEIOOOUCaaaaeeiooouc'));
    n := regexp_replace(n, '^frente\s*[:/-]\s*', '');
    if coalesce(p_mapa, '{}'::jsonb) ? n then
      return (p_mapa->>n)::frente_item;
    end if;
    if n in ('desenvolvimento','operacao','dados','comunidades','formacao','infraestrutura','gestao') then
      return n::frente_item;
    end if;
  end loop;
  return null;
end $$;
revoke execute on function public.github_frente(text[], jsonb) from public, anon, authenticated;

-- Primeira pessoa atribuída na issue que tem o usuário do GitHub cadastrado
create or replace function public.github_membro_atribuido(p_logins text[]) returns membros
language sql stable security definer set search_path = public as $$
  select m.* from unnest(p_logins) with ordinality l(login, o)
    join membros m on lower(m.github) = lower(l.login) and m.ativo and m.perfil <> 'leitor'
   order by l.o limit 1
$$;
revoke execute on function public.github_membro_atribuido(text[]) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Sincronização: chamada pela automação do GitHub
--   p_issue:      o objeto "issue" da API do GitHub
--   p_acao:       opened, edited, closed, reopened, assigned, labeled,
--                 commented, importar...
--   p_ator:       usuário do GitHub que fez a ação
--   p_comentario: texto do comentário (quando p_acao = 'commented')
-- Sempre atualiza a caixa de entrada; só mexe num item se a issue já
-- estiver vinculada a ele.
-- ---------------------------------------------------------------------
create or replace function public.github_sincronizar(
  p_segredo text, p_issue jsonb, p_acao text default null,
  p_ator text default null, p_comentario text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  cfg github_config; it itens; resp membros;
  v_num int; v_estado text; v_titulo text; v_corpo text; v_repo text;
  v_logins text[]; v_logins_min text[]; v_etq text[]; v_frente frente_item;
  v_ator uuid; v_triagem boolean; v_resp_ok boolean; v_troca boolean;
begin
  select * into cfg from github_config where id = 1;
  if cfg.id is null then
    raise exception 'GITHUB_NAO_CONFIGURADO: rode github_configurar no SQL Editor do Supabase';
  end if;
  if p_segredo is null or encode(sha256(convert_to(p_segredo, 'UTF8')), 'hex') <> cfg.segredo_hash then
    raise exception 'GITHUB_SEGREDO: segredo inválido';
  end if;
  if p_issue is null or p_issue ? 'pull_request' then
    return jsonb_build_object('ignorado', 'não é uma issue');
  end if;

  v_repo := coalesce(substring(p_issue->>'repository_url' from 'repos/([^/]+/[^/]+)$'), cfg.repo);
  if lower(v_repo) <> lower(cfg.repo) then
    raise exception 'GITHUB_REPO: o repositório % não é o configurado (%)', v_repo, cfg.repo;
  end if;
  v_num := (p_issue->>'number')::int;
  if v_num is null then raise exception 'GITHUB_ISSUE: issue sem número'; end if;

  v_estado := case
    when p_issue->>'state' = 'open' then 'aberta'
    when p_issue->>'state_reason' in ('not_planned', 'duplicate') then 'descartada'
    else 'fechada' end;
  v_titulo := left(coalesce(nullif(trim(p_issue->>'title'), ''), 'Issue #' || v_num), 300);
  if length(v_titulo) < 3 then v_titulo := 'Issue #' || v_num || ': ' || v_titulo; end if;
  v_corpo := left(nullif(trim(coalesce(p_issue->>'body', '')), ''), 4000);
  select coalesce(array_agg(x->>'login' order by o), '{}') into v_logins
    from jsonb_array_elements(coalesce(p_issue->'assignees', '[]'::jsonb)) with ordinality t(x, o);
  select coalesce(array_agg(lower(l)), '{}') into v_logins_min from unnest(v_logins) l;
  select coalesce(array_agg(x->>'name' order by o), '{}') into v_etq
    from jsonb_array_elements(coalesce(p_issue->'labels', '[]'::jsonb)) with ordinality t(x, o);
  v_frente := github_frente(v_etq, cfg.etiquetas);

  -- 1. caixa de entrada
  insert into github_issues (repo, numero, titulo, corpo, estado, etiquetas, atribuidos, autor, url,
                             frente_sugerida, criada_em, atualizada_em, sinc)
  values (cfg.repo, v_num, v_titulo, v_corpo, v_estado, v_etq, v_logins, p_issue#>>'{user,login}',
          coalesce(p_issue->>'html_url', 'https://github.com/' || cfg.repo || '/issues/' || v_num),
          v_frente, (p_issue->>'created_at')::timestamptz, (p_issue->>'updated_at')::timestamptz, now())
  on conflict (repo, numero) do update set
    titulo = excluded.titulo, corpo = excluded.corpo, estado = excluded.estado,
    etiquetas = excluded.etiquetas, atribuidos = excluded.atribuidos,
    autor = coalesce(excluded.autor, github_issues.autor), url = excluded.url,
    frente_sugerida = excluded.frente_sugerida,
    criada_em = coalesce(excluded.criada_em, github_issues.criada_em),
    atualizada_em = coalesce(excluded.atualizada_em, github_issues.atualizada_em), sinc = now();

  -- 2. item vinculado, se houver
  select * into it from itens
   where lower(github_repo) = lower(cfg.repo) and github_numero = v_num for update;
  if it.id is null then
    return jsonb_build_object('caixa', true);
  end if;

  resp := github_membro_atribuido(v_logins);
  select id into v_ator from membros where lower(github) = lower(p_ator) and ativo;
  v_triagem := exists (select 1 from atribuicoes a where a.item_id = it.id
                       and a.situacao in ('aguardando', 'contraproposta'));
  v_resp_ok := it.responsavel_id is not null and exists (
    select 1 from membros m where m.id = it.responsavel_id and lower(m.github) = any (v_logins_min));
  v_troca := resp.id is not null and not v_resp_ok and not v_triagem;

  update itens set
    titulo    = case when it.github_criado then v_titulo else titulo end,
    descricao = case when it.github_criado then v_corpo else descricao end,
    frente    = case when it.github_criado and v_frente is not null then v_frente else frente end,
    github_url = coalesce(p_issue->>'html_url', github_url),
    github_estado = v_estado, github_etiquetas = v_etq, github_atribuidos = v_logins, github_sinc = now(),
    fase = case
      when v_triagem then fase
      when it.github_estado = 'aberta' and v_estado = 'fechada' and fase not in ('publicado','arquivado') then 'publicado'
      when it.github_estado = 'aberta' and v_estado = 'descartada' and fase <> 'arquivado' then 'arquivado'
      when it.github_estado in ('fechada','descartada') and v_estado = 'aberta' and fase in ('publicado','arquivado') then 'andamento'
      when v_estado = 'aberta' and fase = 'priorizado' and resp.id is not null then 'andamento'
      else fase end,
    responsavel_id  = case when v_troca then resp.id else responsavel_id end,
    vez_membro_id   = case when v_troca then resp.id else vez_membro_id end,
    vez_instituicao = case when v_troca then resp.instituicao_id else vez_instituicao end,
    vez_nota        = case when v_troca then null else vez_nota end
  where id = it.id;

  if p_acao = 'closed' then
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (it.id, v_ator, 'github', 'Issue #' || v_num || case when v_estado = 'descartada'
            then ' encerrada sem execução no GitHub' else ' fechada no GitHub' end
            || coalesce(' por @' || p_ator, ''));
  elsif p_acao = 'reopened' then
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (it.id, v_ator, 'github', 'Issue #' || v_num || ' reaberta no GitHub' || coalesce(' por @' || p_ator, ''));
  elsif p_acao = 'commented' and nullif(trim(coalesce(p_comentario, '')), '') is not null then
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (it.id, v_ator, 'github', coalesce('@' || p_ator, 'Alguém') || ' comentou no GitHub: '
            || case when length(p_comentario) > 220 then left(p_comentario, 217) || '…' else p_comentario end);
  end if;
  -- mudanças registradas pelos gatilhos ficam em nome de quem agiu no GitHub
  update eventos set autor_id = v_ator
   where item_id = it.id and autor_id is null and criado_em = now() and tipo <> 'github';
  return jsonb_build_object('item', it.id);
end $$;
revoke execute on function public.github_sincronizar(text, jsonb, text, text, text) from public;
grant execute on function public.github_sincronizar(text, jsonb, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Trazer uma issue da caixa de entrada para o Quadro (pela plataforma)
-- ---------------------------------------------------------------------
create or replace function public.github_adicionar(p_numero int, p_origem text, p_frente frente_item default null)
returns bigint
language plpgsql security definer set search_path = public as $$
declare cfg github_config; gi github_issues; resp membros; v_id bigint; v_fase fase_item; v_inst text;
begin
  if not posso_editar() then
    raise exception 'SEM_PERMISSAO: seu perfil não permite criar itens';
  end if;
  if not (p_origem = minha_instituicao() or p_origem = 'CONJUNTA' or meu_perfil() = 'administracao')
     or p_origem not in ('INPE','ANPPEA','CONJUNTA') then
    raise exception 'ORIGEM: a origem precisa ser a sua instituição ou conjunta';
  end if;
  select * into cfg from github_config where id = 1;
  select * into gi from github_issues where repo = cfg.repo and numero = p_numero;
  if gi.numero is null then
    raise exception 'NAO_ENCONTRADO: a issue #% ainda não chegou à plataforma', p_numero;
  end if;
  if exists (select 1 from itens where lower(github_repo) = lower(gi.repo) and github_numero = gi.numero) then
    raise exception 'GITHUB_VINCULADA: esta issue já está no Quadro';
  end if;
  resp := github_membro_atribuido(gi.atribuidos);
  v_inst := case when p_origem = 'CONJUNTA' then minha_instituicao() else p_origem end;
  if v_inst not in ('INPE','ANPPEA') then v_inst := 'INPE'; end if;
  v_fase := case gi.estado
    when 'aberta' then (case when resp.id is null then 'priorizado' else 'andamento' end)::fase_item
    when 'fechada' then 'publicado'::fase_item else 'arquivado'::fase_item end;
  insert into itens (tipo, titulo, descricao, frente, origem, envolvidas, fase,
                     responsavel_id, vez_instituicao, vez_membro_id, criado_por,
                     github_repo, github_numero, github_url, github_estado,
                     github_etiquetas, github_atribuidos, github_criado, github_sinc)
  values ('atividade', gi.titulo, gi.corpo, coalesce(p_frente, gi.frente_sugerida, 'desenvolvimento'), p_origem,
          case when p_origem = 'CONJUNTA' then array['INPE','ANPPEA'] else array[p_origem] end,
          v_fase, resp.id, coalesce(resp.instituicao_id, v_inst), resp.id, auth.uid(),
          gi.repo, gi.numero, gi.url, gi.estado, gi.etiquetas, gi.atribuidos, true, gi.sinc)
  returning id into v_id;
  insert into eventos (item_id, autor_id, tipo, detalhe)
  values (v_id, auth.uid(), 'github', 'Trouxe a issue #' || gi.numero || ' do GitHub'
          || coalesce(' (aberta por @' || gi.autor || ')', ''));
  update github_issues set ignorada = false, ignorada_por = null where repo = gi.repo and numero = gi.numero;
  return v_id;
end $$;
revoke execute on function public.github_adicionar(int, text, frente_item) from public, anon;
grant execute on function public.github_adicionar(int, text, frente_item) to authenticated;

-- Tirar (ou devolver) uma issue da lista "Para avaliar"
create or replace function public.github_ignorar(p_numero int, p_ignorar boolean default true) returns void
language plpgsql security definer set search_path = public as $$
declare cfg github_config;
begin
  if not posso_editar() then
    raise exception 'SEM_PERMISSAO: seu perfil não permite esta ação';
  end if;
  select * into cfg from github_config where id = 1;
  update github_issues set ignorada = coalesce(p_ignorar, true),
         ignorada_por = case when coalesce(p_ignorar, true) then auth.uid() end
   where repo = cfg.repo and numero = p_numero;
  if not found then raise exception 'NAO_ENCONTRADO: issue inexistente'; end if;
end $$;
revoke execute on function public.github_ignorar(int, boolean) from public, anon;
grant execute on function public.github_ignorar(int, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- Vínculo de um item existente: ao informar o número da issue, completa
-- repositório, endereço e estado (a partir da caixa de entrada). Ao
-- apagar o número, desfaz o vínculo.
-- ---------------------------------------------------------------------
create or replace function public.itens_github_antes() returns trigger
language plpgsql security definer set search_path = public as $$
declare gi github_issues;
begin
  if new.github_numero is not null then
    if new.github_numero <= 0 then
      raise exception 'GITHUB_ISSUE: número de issue inválido';
    end if;
    if new.github_repo is null or (tg_op = 'UPDATE' and new.github_numero is distinct from old.github_numero) then
      select repo into new.github_repo from github_config where id = 1;
      if new.github_repo is null then
        raise exception 'GITHUB_NAO_CONFIGURADO: a integração com o GitHub ainda não foi configurada';
      end if;
      select * into gi from github_issues where repo = new.github_repo and numero = new.github_numero;
      new.github_url := coalesce(gi.url, 'https://github.com/' || new.github_repo || '/issues/' || new.github_numero);
      new.github_estado := gi.estado;
      new.github_etiquetas := coalesce(gi.etiquetas, '{}');
      new.github_atribuidos := coalesce(gi.atribuidos, '{}');
      new.github_criado := false;
      new.github_sinc := gi.sinc;
    end if;
  elsif tg_op = 'UPDATE' and old.github_numero is not null then
    new.github_repo := null; new.github_url := null; new.github_estado := null;
    new.github_etiquetas := '{}'; new.github_atribuidos := '{}'; new.github_criado := false; new.github_sinc := null;
  end if;
  return new;
end $$;
revoke execute on function public.itens_github_antes() from public, anon;

drop trigger if exists itens_github_antes on public.itens;
create trigger itens_github_antes before insert or update of github_numero on public.itens
for each row execute function public.itens_github_antes();

create or replace function public.itens_github_depois() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.github_numero is distinct from old.github_numero then
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (new.id, auth.uid(), 'github', case when new.github_numero is null
            then 'Desfez o vínculo com a issue #' || old.github_numero
            else 'Vinculou à issue #' || new.github_numero || ' do GitHub' end);
    if new.github_numero is not null then
      update github_issues set ignorada = false, ignorada_por = null
       where repo = new.github_repo and numero = new.github_numero;
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.itens_github_depois() from public, anon;

drop trigger if exists itens_github_depois on public.itens;
create trigger itens_github_depois after update of github_numero on public.itens
for each row execute function public.itens_github_depois();

-- ---------------------------------------------------------------------
-- Usuário do GitHub de cada pessoa (a própria pessoa ou a coordenação)
-- ---------------------------------------------------------------------
create or replace function public.definir_github(p_membro uuid, p_login text) returns void
language plpgsql security definer set search_path = public as $$
declare m membros; v text := nullif(trim(leading '@' from trim(coalesce(p_login, ''))), '');
begin
  select * into m from membros where id = p_membro;
  if m.id is null then raise exception 'NAO_ENCONTRADO: membro inexistente'; end if;
  if not (p_membro = auth.uid() or sou_coordenacao_de(m.instituicao_id)) then
    raise exception 'SEM_PERMISSAO: só a própria pessoa ou a coordenação da instituição altera este dado';
  end if;
  v := regexp_replace(coalesce(v, ''), '^https?://github\.com/', '', 'i');
  v := nullif(trim(both '/' from v), '');
  if v is not null and v !~ '^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$' then
    raise exception 'GITHUB_USUARIO: usuário do GitHub inválido';
  end if;
  if v is not null and exists (select 1 from membros where lower(github) = lower(v) and id <> p_membro) then
    raise exception 'GITHUB_USUARIO: este usuário do GitHub já está ligado a outra pessoa';
  end if;
  update membros set github = v where id = p_membro;
end $$;
revoke execute on function public.definir_github(uuid, text) from public, anon;
grant execute on function public.definir_github(uuid, text) to authenticated;
