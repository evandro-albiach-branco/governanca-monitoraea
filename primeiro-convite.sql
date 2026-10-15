-- =====================================================================
-- Primeiro acesso: cria o convite da primeira pessoa administradora.
-- Troque o e-mail e o nome do papel, rode no SQL Editor do Supabase e
-- depois use o código abaixo na aba "Primeiro acesso" da plataforma.
-- Os demais convites são feitos pela própria plataforma (página Equipe).
-- =====================================================================
insert into convites (codigo, email, instituicao_id, perfil, papel, criado_por)
values ('INPE-0001', 'seu.email@inpe.br', 'INPE', 'administracao', 'Coordenação do programa', null);
