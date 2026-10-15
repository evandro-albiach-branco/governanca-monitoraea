-- Remove todos os objetos da plataforma (APAGA os dados).
-- O schema.sql já faz esta limpeza no início; este arquivo serve para
-- remover a plataforma sem reinstalar.
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

