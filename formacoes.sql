-- =====================================================================
-- Governança MonitoraEA · Formações (processos formativos)
--
-- Migração aditiva: NÃO apaga dados. Pode ser rodada mais de uma vez.
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo e "Run".
--
-- Quem atualiza: qualquer pessoa da plataforma que não seja só leitora.
--
-- Como funciona: a equipe envia a planilha de formações pela plataforma.
-- O navegador lê a planilha, confere e mostra o que muda; ao publicar, os
-- dados entram aqui como uma nova VERSÃO. A página Formações mostra sempre
-- a versão mais recente, e as anteriores ficam guardadas para restaurar.
--
-- Privacidade: as versões guardam só códigos e atributos agregáveis (UF,
-- município, região, gênero, setor, instituição, CIEA, situação, turma,
-- carga). Nomes, e-mails e telefones ficam à parte, na tabela
-- formacao_contatos, que só perfis de edição enxergam (leitores, não).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Versões publicadas dos dados
-- ---------------------------------------------------------------------
create table if not exists public.formacao_versoes (
  id              bigint generated always as identity primary key,
  criado_em       timestamptz not null default now(),
  criado_por      uuid references public.membros(id) on delete set null,
  arquivo         text,
  nota            text,
  dados           jsonb not null,
  resumo          jsonb not null default '{}'::jsonb,
  restaurada_de   bigint references public.formacao_versoes(id) on delete set null
);
alter table public.formacao_versoes enable row level security;
drop policy if exists ver on public.formacao_versoes;
create policy ver on public.formacao_versoes for select to authenticated using (public.sou_membro());
revoke all on public.formacao_versoes from anon;
grant select on public.formacao_versoes to authenticated;

-- Informações de cada processo que vivem na plataforma, não na planilha:
-- quem realiza e a que item do Quadro o processo está ligado
create table if not exists public.formacao_processos (
  cod             text primary key,
  realizacao      text check (realizacao in ('INPE','ANPPEA','CONJUNTA')),
  item_id         bigint references public.itens(id) on delete set null,
  atualizado_por  uuid references public.membros(id) on delete set null,
  atualizado_em   timestamptz not null default now()
);
alter table public.formacao_processos enable row level security;
drop policy if exists ver on public.formacao_processos;
create policy ver on public.formacao_processos for select to authenticated using (public.sou_membro());
revoke all on public.formacao_processos from anon;
grant select on public.formacao_processos to authenticated;

-- Nomes e contatos das pessoas que passaram pelas formações.
-- Separados das versões para que só perfis de edição os vejam.
create table if not exists public.formacao_contatos (
  cod_pessoa      text primary key,
  nome            text,
  email           text,
  telefone        text,
  atualizado_por  uuid references public.membros(id) on delete set null,
  atualizado_em   timestamptz not null default now()
);
alter table public.formacao_contatos enable row level security;
drop policy if exists ver on public.formacao_contatos;
create policy ver on public.formacao_contatos for select to authenticated using (public.posso_editar());
revoke all on public.formacao_contatos from anon;
grant select on public.formacao_contatos to authenticated;

-- Quem pode atualizar e corrigir os dados de formação: qualquer pessoa
-- da plataforma que não tenha perfil só de leitura
create or replace function public.posso_formacao() returns boolean
language sql stable security definer set search_path = public as $$
  select public.posso_editar()
$$;
revoke execute on function public.posso_formacao() from public, anon;
grant execute on function public.posso_formacao() to authenticated;

-- Só os campos permitidos de cada participação
create or replace function public.formacao_limpar(p jsonb) returns jsonb
language sql immutable set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
    'cod_pessoa',   left(nullif(x->>'cod_pessoa', ''), 40),
    'cod_processo', left(nullif(x->>'cod_processo', ''), 40),
    'papel',        case when x->>'papel' in ('formador','formando') then x->>'papel' end,
    'uf',           case when upper(x->>'uf') ~ '^[A-Z]{2}$' then upper(x->>'uf') end,
    'cod_mun',      case when x->>'cod_mun' ~ '^[0-9]{7}$' then x->>'cod_mun' end,
    'regiao',       left(nullif(x->>'regiao', ''), 40),
    'genero',       case when upper(x->>'genero') in ('F','M') then upper(x->>'genero') end,
    'setor',        left(nullif(x->>'setor', ''), 60),
    'instituicao',  left(nullif(x->>'instituicao', ''), 160),
    'ciea',         case when jsonb_typeof(x->'ciea') = 'boolean' then x->'ciea' end,
    'situacao',     case when x->>'situacao' in ('concluiu','nao_concluiu','cursando') then x->>'situacao' end,
    'turma',        left(nullif(x->>'turma', ''), 20),
    'carga',        case when jsonb_typeof(x->'carga') = 'number' and (x->>'carga')::numeric between 0 and 10000 then x->'carga' end
  ))), '[]'::jsonb)
  from jsonb_array_elements(coalesce(p, '[]'::jsonb)) x
$$;
revoke execute on function public.formacao_limpar(jsonb) from public, anon;

create or replace function public.formacao_limpar_processos(p jsonb) returns jsonb
language sql immutable set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
    'cod',          left(nullif(x->>'cod', ''), 40),
    'sigla',        left(nullif(x->>'sigla', ''), 80),
    'nome',         left(nullif(x->>'nome', ''), 300),
    'inicio',       case when x->>'inicio' ~ '^[0-9]{4}-[0-9]{2}$' then x->>'inicio' end,
    'fim',          case when x->>'fim' ~ '^[0-9]{4}-[0-9]{2}$' then x->>'fim' end,
    'turmas',       case when jsonb_typeof(x->'turmas') = 'number' then x->'turmas' end,
    'carga_turma',  case when jsonb_typeof(x->'carga_turma') = 'number' then x->'carga_turma' end,
    'carga_total',  case when jsonb_typeof(x->'carga_total') = 'number' then x->'carga_total' end,
    'modalidade',   left(nullif(x->>'modalidade', ''), 40)
  ))), '[]'::jsonb)
  from jsonb_array_elements(coalesce(p, '[]'::jsonb)) x
$$;
revoke execute on function public.formacao_limpar_processos(jsonb) from public, anon;

-- ---------------------------------------------------------------------
-- Publicar uma nova versão
--   p_dados:   {"processos":[...], "participacoes":[...]}
--   p_resumo:  contagens e pendências calculadas na conferência
-- ---------------------------------------------------------------------
drop function if exists public.formacao_publicar(jsonb, text, text, jsonb);
create or replace function public.formacao_publicar(p_dados jsonb, p_arquivo text, p_nota text, p_resumo jsonb default '{}'::jsonb, p_contatos jsonb default null)
returns bigint
language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_proc jsonb; v_part jsonb; r record;
begin
  if not posso_formacao() then
    raise exception 'SEM_PERMISSAO: seu perfil é só de leitura e não atualiza as formações';
  end if;
  if jsonb_typeof(p_dados->'participacoes') <> 'array' or jsonb_typeof(p_dados->'processos') <> 'array' then
    raise exception 'FORMACAO_DADOS: dados incompletos (faltam processos ou participações)';
  end if;
  if jsonb_array_length(p_dados->'participacoes') > 50000 or jsonb_array_length(p_dados->'processos') > 1000 then
    raise exception 'FORMACAO_DADOS: planilha grande demais para uma atualização';
  end if;
  v_proc := formacao_limpar_processos(p_dados->'processos');
  v_part := formacao_limpar(p_dados->'participacoes');
  if jsonb_array_length(v_part) = 0 then
    raise exception 'FORMACAO_DADOS: nenhuma participação reconhecida na planilha';
  end if;
  insert into formacao_versoes (criado_por, arquivo, nota, dados, resumo)
  values (auth.uid(), left(p_arquivo, 200), left(nullif(trim(p_nota), ''), 500),
          jsonb_build_object('processos', v_proc, 'participacoes', v_part),
          coalesce(p_resumo, '{}'::jsonb))
  returning id into v_id;
  -- nomes e contatos: atualiza quem veio na planilha, sem apagar o que não veio
  if jsonb_typeof(p_contatos) = 'array' then
    insert into formacao_contatos (cod_pessoa, nome, email, telefone, atualizado_por, atualizado_em)
    select distinct on (left(c->>'cod_pessoa', 40)) left(c->>'cod_pessoa', 40), left(nullif(trim(c->>'nome'), ''), 200),
           lower(left(nullif(trim(c->>'email'), ''), 200)), left(nullif(trim(c->>'telefone'), ''), 60), auth.uid(), now()
      from jsonb_array_elements(p_contatos) c
     where nullif(c->>'cod_pessoa', '') is not null
    on conflict (cod_pessoa) do update set
      nome = coalesce(excluded.nome, formacao_contatos.nome),
      email = coalesce(excluded.email, formacao_contatos.email),
      telefone = coalesce(excluded.telefone, formacao_contatos.telefone),
      atualizado_por = excluded.atualizado_por, atualizado_em = now();
  end if;
  -- registra no histórico dos itens do Quadro ligados a cada processo
  for r in
    select fp.item_id, fp.cod, count(*) as n
      from formacao_processos fp
      join jsonb_array_elements(v_part) x on x->>'cod_processo' = fp.cod
     where fp.item_id is not null
     group by fp.item_id, fp.cod
  loop
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (r.item_id, auth.uid(), 'formacao',
            'Dados de formação atualizados: ' || r.n || ' participações no processo ' || r.cod
            || coalesce(' (' || left(nullif(trim(p_nota), ''), 120) || ')', ''));
  end loop;
  return v_id;
end $$;
revoke execute on function public.formacao_publicar(jsonb, text, text, jsonb, jsonb) from public, anon;
grant execute on function public.formacao_publicar(jsonb, text, text, jsonb, jsonb) to authenticated;

-- Restaurar uma versão anterior (vira a versão mais recente)
create or replace function public.formacao_restaurar(p_versao bigint) returns bigint
language plpgsql security definer set search_path = public as $$
declare v formacao_versoes; v_id bigint;
begin
  if not posso_formacao() then
    raise exception 'SEM_PERMISSAO: seu perfil é só de leitura e não atualiza as formações';
  end if;
  select * into v from formacao_versoes where id = p_versao;
  if v.id is null then raise exception 'NAO_ENCONTRADO: versão inexistente'; end if;
  insert into formacao_versoes (criado_por, arquivo, nota, dados, resumo, restaurada_de)
  values (auth.uid(), v.arquivo, 'Restauração da versão de ' || to_char(v.criado_em at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'),
          v.dados, v.resumo, v.id)
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.formacao_restaurar(bigint) from public, anon;
grant execute on function public.formacao_restaurar(bigint) to authenticated;

-- Quem realiza o processo e a que item do Quadro ele está ligado
create or replace function public.formacao_processo_definir(p_cod text, p_realizacao text, p_item bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not posso_formacao() then
    raise exception 'SEM_PERMISSAO: seu perfil é só de leitura e não atualiza as formações';
  end if;
  if nullif(trim(p_cod), '') is null then raise exception 'FORMACAO_DADOS: processo sem código'; end if;
  if p_realizacao is not null and p_realizacao not in ('INPE','ANPPEA','CONJUNTA') then
    raise exception 'FORMACAO_DADOS: realização inválida';
  end if;
  if p_item is not null and not exists (select 1 from itens where id = p_item) then
    raise exception 'NAO_ENCONTRADO: item do Quadro inexistente';
  end if;
  insert into formacao_processos (cod, realizacao, item_id, atualizado_por, atualizado_em)
  values (trim(p_cod), p_realizacao, p_item, auth.uid(), now())
  on conflict (cod) do update set realizacao = excluded.realizacao, item_id = excluded.item_id,
    atualizado_por = excluded.atualizado_por, atualizado_em = now();
  if p_item is not null then
    insert into eventos (item_id, autor_id, tipo, detalhe)
    select p_item, auth.uid(), 'formacao', 'Ligado ao processo formativo ' || trim(p_cod)
     where not exists (select 1 from eventos e where e.item_id = p_item and e.tipo = 'formacao'
                         and e.detalhe = 'Ligado ao processo formativo ' || trim(p_cod));
  end if;
end $$;
revoke execute on function public.formacao_processo_definir(text, text, bigint) from public, anon;
grant execute on function public.formacao_processo_definir(text, text, bigint) to authenticated;

-- ---------------------------------------------------------------------
-- Corrigir os dados de um processo (datas, turmas, carga horária...)
-- direto na plataforma. Gera uma nova versão, então dá para desfazer
-- restaurando a anterior.
--   p_campos: {"sigla":..., "inicio":"2023-02", "turmas":5, "carga_total":80, ...}
--             campo com null é apagado
-- ---------------------------------------------------------------------
create or replace function public.formacao_processo_corrigir(p_cod text, p_campos jsonb, p_nota text, p_resumo jsonb default null)
returns bigint
language plpgsql security definer set search_path = public as $$
declare v formacao_versoes; v_procs jsonb; v_novo jsonb; v_achou boolean := false; v_id bigint; r record; v_item bigint;
begin
  if not posso_formacao() then
    raise exception 'SEM_PERMISSAO: seu perfil é só de leitura e não atualiza as formações';
  end if;
  if nullif(trim(p_cod), '') is null then raise exception 'FORMACAO_DADOS: processo sem código'; end if;
  if jsonb_typeof(p_campos) <> 'object' then raise exception 'FORMACAO_DADOS: correção sem campos'; end if;
  select * into v from formacao_versoes order by criado_em desc, id desc limit 1;
  if v.id is null then raise exception 'NAO_ENCONTRADO: ainda não há dados de formação publicados'; end if;
  v_procs := '[]'::jsonb;
  for r in select x from jsonb_array_elements(coalesce(v.dados->'processos', '[]'::jsonb)) x loop
    if r.x->>'cod' = trim(p_cod) then
      v_procs := v_procs || formacao_limpar_processos(jsonb_build_array((r.x || p_campos) || jsonb_build_object('cod', trim(p_cod))));
      v_achou := true;
    else
      v_procs := v_procs || jsonb_build_array(r.x);
    end if;
  end loop;
  if not v_achou then
    v_procs := v_procs || formacao_limpar_processos(jsonb_build_array(p_campos || jsonb_build_object('cod', trim(p_cod))));
  end if;
  insert into formacao_versoes (criado_por, arquivo, nota, dados, resumo)
  values (auth.uid(), v.arquivo,
          left('Correção no processo ' || trim(p_cod) || coalesce(': ' || nullif(trim(p_nota), ''), ''), 500),
          jsonb_set(v.dados, '{processos}', v_procs),
          coalesce(p_resumo, v.resumo))
  returning id into v_id;
  select item_id into v_item from formacao_processos where cod = trim(p_cod);
  if v_item is not null then
    insert into eventos (item_id, autor_id, tipo, detalhe)
    values (v_item, auth.uid(), 'formacao',
            left('Dados do processo formativo ' || trim(p_cod) || ' corrigidos' || coalesce(': ' || nullif(trim(p_nota), ''), ''), 300));
  end if;
  return v_id;
end $$;
revoke execute on function public.formacao_processo_corrigir(text, jsonb, text, jsonb) from public, anon;
grant execute on function public.formacao_processo_corrigir(text, jsonb, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- Corrigir o nome ou os contatos de uma pessoa (tudo vazio apaga o registro)
-- ---------------------------------------------------------------------
create or replace function public.formacao_contato_salvar(p_cod text, p_nome text, p_email text, p_telefone text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not posso_formacao() then
    raise exception 'SEM_PERMISSAO: seu perfil é só de leitura e não atualiza as formações';
  end if;
  if nullif(trim(p_cod), '') is null then raise exception 'FORMACAO_DADOS: pessoa sem código'; end if;
  if nullif(trim(p_nome), '') is null and nullif(trim(p_email), '') is null and nullif(trim(p_telefone), '') is null then
    delete from formacao_contatos where cod_pessoa = trim(p_cod);
    return;
  end if;
  insert into formacao_contatos (cod_pessoa, nome, email, telefone, atualizado_por, atualizado_em)
  values (trim(p_cod), left(nullif(trim(p_nome), ''), 200), lower(left(nullif(trim(p_email), ''), 200)), left(nullif(trim(p_telefone), ''), 60), auth.uid(), now())
  on conflict (cod_pessoa) do update set nome = excluded.nome, email = excluded.email, telefone = excluded.telefone,
    atualizado_por = excluded.atualizado_por, atualizado_em = now();
end $$;
revoke execute on function public.formacao_contato_salvar(text, text, text, text) from public, anon;
grant execute on function public.formacao_contato_salvar(text, text, text, text) to authenticated;
