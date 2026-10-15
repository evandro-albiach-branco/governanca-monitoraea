-- =====================================================================
-- Governança MonitoraEA · INPE + ANPPEA
-- Esquema do banco (Supabase / PostgreSQL)
--
-- Como usar: no painel do Supabase, abra "SQL Editor", cole este arquivo
-- inteiro e clique em "Run". Ele remove qualquer instalação anterior antes
-- de criar tudo de novo, então pode ser rodado mais de uma vez, mas APAGA
-- os dados existentes. Depois, rode primeiro-convite.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Instalação limpa: remove qualquer versão anterior destes objetos.
-- ATENÇÃO: rodar este arquivo APAGA os dados da plataforma. Use só para
-- instalar ou reinstalar.
-- ---------------------------------------------------------------------
drop trigger if exists ao_criar_usuario on auth.users;
drop table if exists public.anexos, public.notificacoes, public.eventos, public.decisoes, public.comentarios,
  public.atribuicoes, public.itens, public.convites, public.membros, public.instituicoes cascade;
do $limpa$
declare r record;
begin
  for r in
    select p.oid::regprocedure as f
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname in (
       'ao_criar_usuario','itens_antes','itens_depois','atribuicoes_antes','atribuicoes_depois',
       'comentarios_depois','responder_atribuicao','pactuar_decisao','atualizar_membro','notificar',
       'membros_de','sigla','rotulo_fase','sou_coordenacao_de','posso_editar','sou_membro',
       'meu_perfil','minha_instituicao','anexos_depois')
  loop
    execute 'drop function if exists ' || r.f::text || ' cascade';
  end loop;
  for r in
    select t.typname
      from pg_type t join pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'public' and t.typname in (
       'perfil_acesso','tipo_item','fase_item','frente_item','prioridade_item',
       'situacao_atrib','situacao_decisao')
  loop
    execute format('drop type if exists public.%I cascade', r.typname);
  end loop;
end $limpa$;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type perfil_acesso    as enum ('leitor','colaborador','coordenacao','administracao');
create type tipo_item        as enum ('atividade','demanda','processo');
create type fase_item        as enum ('triagem','priorizado','andamento','validacao','decisao','publicado','arquivado');
create type frente_item      as enum ('desenvolvimento','operacao','dados','comunidades','formacao','infraestrutura','gestao');
create type prioridade_item  as enum ('baixa','media','alta');
create type situacao_atrib   as enum ('aguardando','aceita','contraproposta','devolvida');
create type situacao_decisao as enum ('em_pauta','pactuada','rejeitada');

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------
create table instituicoes (
  id        text primary key,
  sigla     text not null,
  nome      text not null,
  parceira  boolean not null default false,   -- INPE e ANPPEA = true; convidadas externas = false
  ordem     int not null default 0
);

insert into instituicoes (id, sigla, nome, parceira, ordem) values
  ('INPE',    'INPE',    'Instituto Nacional de Pesquisas Espaciais', true, 1),
  ('ANPPEA',  'ANPPEA',  'Articulação Nacional de Políticas Públicas de Educação Ambiental', true, 2),
  ('DEA_MMA', 'DEA/MMA', 'Diretoria de Educação Ambiental do Ministério do Meio Ambiente', false, 3),
  ('CNPQ',    'CNPq',    'Conselho Nacional de Desenvolvimento Científico e Tecnológico', false, 4);

create table membros (
  id              uuid primary key references auth.users(id) on delete cascade,
  nome            text not null,
  email           text not null,
  instituicao_id  text not null references instituicoes(id),
  perfil          perfil_acesso not null default 'colaborador',
  papel           text,
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now()
);

create table convites (
  id              uuid primary key default gen_random_uuid(),
  codigo          text not null unique default
                    upper(substr(md5(gen_random_uuid()::text), 1, 4) || '-' || substr(md5(gen_random_uuid()::text), 1, 4)),
  email           text not null,
  instituicao_id  text not null references instituicoes(id),
  perfil          perfil_acesso not null default 'colaborador',
  papel           text,
  criado_por      uuid references membros(id) on delete set null default auth.uid(),
  criado_em       timestamptz not null default now(),
  expira_em       timestamptz not null default now() + interval '30 days',
  aceito_em       timestamptz,
  membro_id       uuid references membros(id) on delete set null
);

create table itens (
  id               bigint generated always as identity primary key,
  tipo             tipo_item not null default 'atividade',
  titulo           text not null check (length(trim(titulo)) >= 3),
  descricao        text,
  frente           frente_item not null default 'desenvolvimento',
  modulo           text,
  origem           text not null check (origem in ('INPE','ANPPEA','CONJUNTA')),
  envolvidas       text[] not null default '{}',
  fase             fase_item not null default 'priorizado',
  prioridade       prioridade_item not null default 'media',
  responsavel_id   uuid references membros(id),
  vez_instituicao  text references instituicoes(id),
  vez_membro_id    uuid references membros(id),
  vez_nota         text,
  prazo            date,
  instrumento      text,
  criado_por       uuid not null default auth.uid() references membros(id),
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  concluido_em     timestamptz
);

create table atribuicoes (
  id                    bigint generated always as identity primary key,
  item_id               bigint not null references itens(id) on delete cascade,
  de_instituicao        text not null references instituicoes(id),
  para_instituicao      text not null references instituicoes(id),
  sugerido_membro_id    uuid references membros(id),
  justificativa         text,
  prazo_sugerido        date,
  situacao              situacao_atrib not null default 'aguardando',
  prazo_contraproposto  date,
  resposta              text,
  respondido_por        uuid references membros(id),
  respondido_em         timestamptz,
  criado_por            uuid not null default auth.uid() references membros(id),
  criado_em             timestamptz not null default now(),
  check (de_instituicao <> para_instituicao)
);

create table comentarios (
  id                bigint generated always as identity primary key,
  item_id           bigint not null references itens(id) on delete cascade,
  autor_id          uuid not null default auth.uid() references membros(id),
  texto             text not null default '',
  proposta_decisao  boolean not null default false,
  criado_em         timestamptz not null default now()
);

create table decisoes (
  id           bigint generated always as identity primary key,
  titulo       text not null check (length(trim(titulo)) >= 3),
  descricao    text,
  forum        text not null default 'Comitê de governança',
  item_id      bigint references itens(id) on delete set null,
  data_pauta   date,
  situacao     situacao_decisao not null default 'em_pauta',
  ok_inpe      boolean not null default false,
  ok_anppea    boolean not null default false,
  pactuada_em  timestamptz,
  criado_por   uuid not null default auth.uid() references membros(id),
  criado_em    timestamptz not null default now()
);

create table eventos (
  id         bigint generated always as identity primary key,
  item_id    bigint references itens(id) on delete cascade,
  autor_id   uuid references membros(id),
  tipo       text not null,
  detalhe    text not null,
  criado_em  timestamptz not null default now()
);

create table notificacoes (
  id         bigint generated always as identity primary key,
  membro_id  uuid not null references membros(id) on delete cascade,
  item_id    bigint references itens(id) on delete cascade,
  tipo       text not null,
  texto      text not null,
  lida       boolean not null default false,
  criado_em  timestamptz not null default now()
);

create index on itens (fase);
create index on itens (vez_instituicao);
create index on atribuicoes (item_id);
create index on atribuicoes (para_instituicao, situacao);
create index on comentarios (item_id);
create index on eventos (item_id);
create index on eventos (criado_em desc);
create index on notificacoes (membro_id, lida);

-- ---------------------------------------------------------------------
-- Funções auxiliares (quem sou eu)
-- ---------------------------------------------------------------------
create or replace function minha_instituicao() returns text
language sql stable security definer set search_path = public as $$
  select instituicao_id from membros where id = auth.uid() and ativo
$$;

create or replace function meu_perfil() returns perfil_acesso
language sql stable security definer set search_path = public as $$
  select perfil from membros where id = auth.uid() and ativo
$$;

create or replace function sou_membro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from membros where id = auth.uid() and ativo)
$$;

create or replace function posso_editar() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(meu_perfil() in ('colaborador','coordenacao','administracao'), false)
$$;

create or replace function sou_coordenacao_de(p_inst text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    meu_perfil() = 'administracao'
    or (meu_perfil() = 'coordenacao' and minha_instituicao() = p_inst), false)
$$;

create or replace function membros_de(p_inst text, p_so_coordenacao boolean default false) returns uuid[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(id), '{}') from membros
  where instituicao_id = p_inst and ativo
    and (not p_so_coordenacao or perfil in ('coordenacao','administracao'))
$$;

create or replace function rotulo_fase(f fase_item) returns text
language sql immutable as $$
  select case f
    when 'triagem' then 'Entrada e triagem' when 'priorizado' then 'Priorizado'
    when 'andamento' then 'Em andamento' when 'validacao' then 'Em validação'
    when 'decisao' then 'Aguardando decisão' when 'publicado' then 'Publicado'
    else 'Arquivado' end
$$;

create or replace function sigla(p_inst text) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select sigla from instituicoes where id = p_inst), p_inst)
$$;

create or replace function notificar(p_membros uuid[], p_item bigint, p_tipo text, p_texto text) returns void
language sql security definer set search_path = public as $$
  insert into notificacoes (membro_id, item_id, tipo, texto)
  select distinct m, p_item, p_tipo, p_texto
  from unnest(p_membros) as m
  where m is not null and m is distinct from auth.uid()
    and exists (select 1 from membros where id = m and ativo)
$$;

-- ---------------------------------------------------------------------
-- Cadastro só por convite: ao criar a conta, o código do convite
-- (enviado nos metadados do cadastro) define instituição e perfil.
-- Sem convite válido, o cadastro é recusado.
-- ---------------------------------------------------------------------
create or replace function ao_criar_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare c convites;
begin
  select * into c from convites
   where codigo = upper(trim(coalesce(new.raw_user_meta_data->>'convite','')))
     and lower(email) = lower(new.email)
     and aceito_em is null and expira_em > now()
   limit 1;
  if c.id is null then
    raise exception 'CONVITE_INVALIDO: código de convite inválido, expirado ou de outro e-mail';
  end if;
  insert into membros (id, nome, email, instituicao_id, perfil, papel)
  values (new.id,
          coalesce(nullif(trim(new.raw_user_meta_data->>'nome'),''), split_part(new.email,'@',1)),
          new.email, c.instituicao_id, c.perfil, c.papel);
  update convites set aceito_em = now(), membro_id = new.id where id = c.id;
  return new;
end $$;

create trigger ao_criar_usuario after insert on auth.users
for each row execute function ao_criar_usuario();

-- ---------------------------------------------------------------------
-- Itens: carimbos de data, proteção de campos e histórico/notificações
-- ---------------------------------------------------------------------
create or replace function itens_antes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if coalesce(meu_perfil()::text,'') <> 'administracao' then
      new.origem := old.origem;
      new.criado_por := old.criado_por;
      new.criado_em := old.criado_em;
    end if;
    new.atualizado_em := now();
  end if;
  if new.fase = 'publicado' and (tg_op = 'INSERT' or old.fase is distinct from 'publicado') then
    new.concluido_em := now();
  elsif new.fase not in ('publicado','arquivado') then
    new.concluido_em := null;
  end if;
  return new;
end $$;

create trigger itens_antes before insert or update on itens
for each row execute function itens_antes();

create or replace function itens_depois() returns trigger
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
    values (new.id, auth.uid(), 'vez', 'A vez passou para ' || coalesce(sigla(new.vez_instituicao), '—')
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

create trigger itens_depois after insert or update on itens
for each row execute function itens_depois();

-- ---------------------------------------------------------------------
-- Atribuição de uma instituição à outra
-- ---------------------------------------------------------------------
create or replace function atribuicoes_antes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from atribuicoes
             where item_id = new.item_id and situacao in ('aguardando','contraproposta')) then
    raise exception 'ATRIBUICAO_ABERTA: este item já tem uma atribuição aguardando resposta';
  end if;
  if not (select parceira from instituicoes where id = new.para_instituicao) then
    raise exception 'DESTINO_INVALIDO: só é possível atribuir ao INPE ou à ANPPEA';
  end if;
  return new;
end $$;

create trigger atribuicoes_antes before insert on atribuicoes
for each row execute function atribuicoes_antes();

create or replace function atribuicoes_depois() returns trigger
language plpgsql security definer set search_path = public as $$
declare t text;
begin
  select titulo into t from itens where id = new.item_id;
  perform set_config('gov.silencio', '1', true);
  update itens set fase = 'triagem', vez_instituicao = new.para_instituicao, vez_membro_id = null,
         vez_nota = 'Aguardando triagem', prazo = coalesce(new.prazo_sugerido, prazo)
   where id = new.item_id;
  perform set_config('gov.silencio', '', true);
  insert into eventos (item_id, autor_id, tipo, detalhe)
  values (new.item_id, auth.uid(), 'atribuicao', 'Atribuído por ' || sigla(new.de_instituicao) || ' a ' || sigla(new.para_instituicao));
  perform notificar(membros_de(new.para_instituicao, true) || array[new.sugerido_membro_id], new.item_id, 'atribuicao',
                    sigla(new.de_instituicao) || ' atribuiu uma demanda: ' || t);
  return new;
end $$;

create trigger atribuicoes_depois after insert on atribuicoes
for each row execute function atribuicoes_depois();

-- Resposta à atribuição. Ações:
--   aceitar                 (coordenação de destino; exige responsável)
--   contrapropor            (coordenação de destino; novo prazo e/ou texto)
--   devolver                (coordenação de destino; exige justificativa)
--   aceitar_contraproposta  (quem pode editar na instituição de origem)
create or replace function responder_atribuicao(
  p_id bigint, p_acao text,
  p_responsavel uuid default null, p_prazo date default null, p_texto text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare a atribuicoes; it itens;
begin
  select * into a from atribuicoes where id = p_id for update;
  if a.id is null then raise exception 'NAO_ENCONTRADO: atribuição inexistente'; end if;
  select * into it from itens where id = a.item_id;

  if p_acao in ('aceitar','contrapropor','devolver') then
    if not sou_coordenacao_de(a.para_instituicao) then
      raise exception 'SEM_PERMISSAO: só a coordenação de % pode responder', sigla(a.para_instituicao);
    end if;
    if a.situacao <> 'aguardando' then
      raise exception 'SITUACAO: esta atribuição não está aguardando triagem';
    end if;
  end if;

  perform set_config('gov.silencio', '1', true);

  if p_acao = 'aceitar' then
    if p_responsavel is null or not exists
       (select 1 from membros where id = p_responsavel and instituicao_id = a.para_instituicao and ativo) then
      raise exception 'RESPONSAVEL: escolha um responsável de %', sigla(a.para_instituicao);
    end if;
    update atribuicoes set situacao = 'aceita', respondido_por = auth.uid(), respondido_em = now(),
           resposta = nullif(trim(coalesce(p_texto,'')), '') where id = a.id;
    update itens set fase = 'priorizado', responsavel_id = p_responsavel,
           vez_instituicao = a.para_instituicao, vez_membro_id = p_responsavel, vez_nota = null,
           prazo = coalesce(p_prazo, a.prazo_sugerido, prazo),
           envolvidas = (select array_agg(distinct x) from unnest(envolvidas || array[a.para_instituicao, a.de_instituicao]) x)
     where id = a.item_id;
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (a.item_id, auth.uid(), 'triagem', sigla(a.para_instituicao) || ' aceitou a demanda');
    perform notificar(array[a.criado_por, p_responsavel] || membros_de(a.de_instituicao, true), a.item_id, 'triagem',
                      sigla(a.para_instituicao) || ' aceitou: ' || it.titulo);

  elsif p_acao = 'contrapropor' then
    if p_prazo is null and nullif(trim(coalesce(p_texto,'')), '') is null then
      raise exception 'CONTRAPROPOSTA: informe um novo prazo ou o que muda no escopo';
    end if;
    update atribuicoes set situacao = 'contraproposta', prazo_contraproposto = p_prazo, resposta = p_texto,
           respondido_por = auth.uid(), respondido_em = now() where id = a.id;
    update itens set vez_instituicao = a.de_instituicao, vez_membro_id = null,
           vez_nota = 'Avaliar contraproposta de ' || sigla(a.para_instituicao) where id = a.item_id;
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (a.item_id, auth.uid(), 'triagem', sigla(a.para_instituicao) || ' fez uma contraproposta'
            || coalesce(' (prazo ' || to_char(p_prazo, 'DD/MM/YYYY') || ')', ''));
    perform notificar(array[a.criado_por] || membros_de(a.de_instituicao, true), a.item_id, 'triagem',
                      sigla(a.para_instituicao) || ' fez uma contraproposta: ' || it.titulo);

  elsif p_acao = 'devolver' then
    if nullif(trim(coalesce(p_texto,'')), '') is null then
      raise exception 'JUSTIFICATIVA: explique por que a demanda está sendo devolvida';
    end if;
    update atribuicoes set situacao = 'devolvida', resposta = p_texto,
           respondido_por = auth.uid(), respondido_em = now() where id = a.id;
    update itens set fase = 'priorizado', vez_instituicao = a.de_instituicao, vez_membro_id = a.criado_por,
           vez_nota = 'Devolvida por ' || sigla(a.para_instituicao) where id = a.item_id;
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (a.item_id, auth.uid(), 'triagem', sigla(a.para_instituicao) || ' devolveu: ' || p_texto);
    perform notificar(array[a.criado_por] || membros_de(a.de_instituicao, true), a.item_id, 'triagem',
                      sigla(a.para_instituicao) || ' devolveu: ' || it.titulo);

  elsif p_acao = 'aceitar_contraproposta' then
    if not (posso_editar() and (minha_instituicao() = a.de_instituicao or meu_perfil() = 'administracao')) then
      raise exception 'SEM_PERMISSAO: só a instituição de origem avalia a contraproposta';
    end if;
    if a.situacao <> 'contraproposta' then
      raise exception 'SITUACAO: não há contraproposta a avaliar';
    end if;
    update atribuicoes set situacao = 'aguardando',
           prazo_sugerido = coalesce(a.prazo_contraproposto, a.prazo_sugerido) where id = a.id;
    update itens set vez_instituicao = a.para_instituicao, vez_membro_id = null, vez_nota = 'Contraproposta aceita',
           prazo = coalesce(a.prazo_contraproposto, prazo) where id = a.item_id;
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (a.item_id, auth.uid(), 'triagem', sigla(a.de_instituicao) || ' aceitou a contraproposta');
    perform notificar(membros_de(a.para_instituicao, true), a.item_id, 'triagem',
                      sigla(a.de_instituicao) || ' aceitou a contraproposta: ' || it.titulo);
  else
    raise exception 'ACAO: ação desconhecida %', p_acao;
  end if;

  perform set_config('gov.silencio', '', true);
end $$;

-- ---------------------------------------------------------------------
-- Comentários: avisa responsável, autor do item e menções @INPE/@ANPPEA
-- ---------------------------------------------------------------------
create or replace function comentarios_depois() returns trigger
language plpgsql security definer set search_path = public as $$
declare it itens; alvo uuid[]; autor text;
begin
  select * into it from itens where id = new.item_id;
  select nome into autor from membros where id = new.autor_id;
  alvo := array[it.responsavel_id, it.criado_por, it.vez_membro_id];
  if new.texto ~* '@INPE\M'   then alvo := alvo || membros_de('INPE');   end if;
  if new.texto ~* '@ANPPEA\M' then alvo := alvo || membros_de('ANPPEA'); end if;
  perform notificar(alvo, new.item_id, case when new.proposta_decisao then 'proposta' else 'comentario' end,
                    coalesce(autor, 'Alguém') || ' comentou em ' || it.titulo);
  return new;
end $$;

create trigger comentarios_depois after insert on comentarios
for each row execute function comentarios_depois();

-- ---------------------------------------------------------------------
-- Decisões: cada coordenação dá o seu "de acordo"
-- ---------------------------------------------------------------------
create or replace function pactuar_decisao(p_id bigint, p_de_acordo boolean default true) returns void
language plpgsql security definer set search_path = public as $$
declare d decisoes; inst text := minha_instituicao();
begin
  if coalesce(meu_perfil()::text, '') not in ('coordenacao','administracao') or inst not in ('INPE','ANPPEA') then
    raise exception 'SEM_PERMISSAO: só a coordenação do INPE ou da ANPPEA pactua decisões';
  end if;
  select * into d from decisoes where id = p_id for update;
  if d.id is null or d.situacao <> 'em_pauta' then
    raise exception 'SITUACAO: esta decisão não está em pauta';
  end if;
  if not p_de_acordo then
    update decisoes set situacao = 'rejeitada' where id = p_id;
    return;
  end if;
  if inst = 'INPE' then update decisoes set ok_inpe = true where id = p_id;
  else update decisoes set ok_anppea = true where id = p_id; end if;
  update decisoes set situacao = 'pactuada', pactuada_em = now()
   where id = p_id and ok_inpe and ok_anppea;
end $$;

-- ---------------------------------------------------------------------
-- Gestão de membros (perfil, papel, ativo)
-- ---------------------------------------------------------------------
create or replace function atualizar_membro(p_id uuid, p_perfil perfil_acesso default null,
                                            p_papel text default null, p_ativo boolean default null) returns void
language plpgsql security definer set search_path = public as $$
declare m membros;
begin
  select * into m from membros where id = p_id;
  if m.id is null then raise exception 'NAO_ENCONTRADO: membro inexistente'; end if;
  if not sou_coordenacao_de(m.instituicao_id) then
    raise exception 'SEM_PERMISSAO: só a coordenação da instituição altera seus membros';
  end if;
  if p_perfil = 'administracao' and meu_perfil() <> 'administracao' then
    raise exception 'SEM_PERMISSAO: só a administração concede o perfil de administração';
  end if;
  update membros set perfil = coalesce(p_perfil, perfil), papel = coalesce(p_papel, papel),
         ativo = coalesce(p_ativo, ativo) where id = p_id;
end $$;

-- ---------------------------------------------------------------------
-- Regras de acesso (Row Level Security)
-- Todos os membros veem tudo; o perfil define o que cada um pode fazer.
-- ---------------------------------------------------------------------
alter table instituicoes enable row level security;
alter table membros      enable row level security;
alter table convites     enable row level security;
alter table itens        enable row level security;
alter table atribuicoes  enable row level security;
alter table comentarios  enable row level security;
alter table decisoes     enable row level security;
alter table eventos      enable row level security;
alter table notificacoes enable row level security;

create policy ver on instituicoes for select to authenticated using (sou_membro());
create policy ver on membros      for select to authenticated using (sou_membro());
create policy ver on itens        for select to authenticated using (sou_membro());
create policy ver on atribuicoes  for select to authenticated using (sou_membro());
create policy ver on comentarios  for select to authenticated using (sou_membro());
create policy ver on decisoes     for select to authenticated using (sou_membro());
create policy ver on eventos      for select to authenticated using (sou_membro());

create policy minhas on notificacoes for select to authenticated using (membro_id = auth.uid());
create policy marcar on notificacoes for update to authenticated
  using (membro_id = auth.uid()) with check (membro_id = auth.uid());

create policy ver on convites for select to authenticated
  using (sou_coordenacao_de(instituicao_id) or (meu_perfil() = 'coordenacao' and criado_por = auth.uid()));
create policy convidar on convites for insert to authenticated with check (
  criado_por = auth.uid() and aceito_em is null and (
    meu_perfil() = 'administracao'
    or (meu_perfil() = 'coordenacao' and instituicao_id = minha_instituicao() and perfil <> 'administracao')
    or (meu_perfil() = 'coordenacao' and perfil = 'leitor'
        and instituicao_id in (select id from instituicoes where not parceira))
  ));

create policy criar on itens for insert to authenticated with check (
  posso_editar() and criado_por = auth.uid()
  and (origem = minha_instituicao() or origem = 'CONJUNTA' or meu_perfil() = 'administracao'));
create policy editar on itens for update to authenticated using (
  posso_editar() and (
    meu_perfil() = 'administracao'
    or origem = minha_instituicao() or origem = 'CONJUNTA'
    or vez_instituicao = minha_instituicao()
    or minha_instituicao() = any (envolvidas)))
  with check (sou_membro());

create policy atribuir on atribuicoes for insert to authenticated with check (
  posso_editar() and criado_por = auth.uid() and de_instituicao = minha_instituicao()
  and exists (select 1 from itens i where i.id = item_id
              and (i.origem in (minha_instituicao(), 'CONJUNTA') or i.vez_instituicao = minha_instituicao())));

create policy comentar on comentarios for insert to authenticated
  with check (sou_membro() and autor_id = auth.uid());

create policy propor on decisoes for insert to authenticated
  with check (posso_editar() and criado_por = auth.uid() and situacao = 'em_pauta'
              and not ok_inpe and not ok_anppea);

-- Permissões de tabela (o Supabase já concede, mas deixamos explícito)
revoke all on all tables in schema public from anon;
grant select on instituicoes, membros, itens, atribuicoes, comentarios, decisoes, eventos to authenticated;
grant select, insert on convites to authenticated;
grant insert, update on itens to authenticated;
grant insert on atribuicoes, comentarios, decisoes to authenticated;
grant select, update on notificacoes to authenticated;
grant usage on all sequences in schema public to authenticated;
revoke execute on all functions in schema public from anon, public;
grant execute on function minha_instituicao(), meu_perfil(), sou_membro(), posso_editar(), sou_coordenacao_de(text),
  membros_de(text, boolean), rotulo_fase(fase_item), sigla(text),
  responder_atribuicao(bigint, text, uuid, date, text), pactuar_decisao(bigint, boolean),
  atualizar_membro(uuid, perfil_acesso, text, boolean) to authenticated;
revoke execute on function notificar(uuid[], bigint, text, text) from authenticated;

-- Atualização em tempo real das notificações (quando disponível)
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table notificacoes;
  end if;
end $$;

-- =====================================================================
-- Anexos (arquivos, imagens, vídeos, áudios e links) e Supabase Storage
-- (mesmo conteúdo de anexos.sql)
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
