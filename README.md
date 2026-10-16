# Governança MonitoraEA · INPE + ANPPEA

Plataforma de governança compartilhada do desenvolvimento e da operação do sistema MonitoraEA. Nela, as equipes do INPE e da ANPPEA registram atividades, demandas e processos em negociação, atribuem demandas uma à outra, comentam, pactuam decisões e acompanham a carga de cada colaborador.

- **Interface:** HTML, CSS e JavaScript puros, sem etapa de compilação. É hospedada no **GitHub Pages**.
- **Dados e login:** ficam no **Supabase** (PostgreSQL). As regras de acesso estão no próprio banco.
- **Sem configuração:** a plataforma abre em **modo demonstração**, com dados de exemplo guardados só no navegador. Serve para validar com as equipes antes de ligar o banco.

---

## 0. Atualizar uma instalação que já está funcionando

Se a plataforma já está no ar, com contas e dados, **não rode o `schema.sql` de novo** (ele apaga tudo). Para esta versão:

1. No SQL Editor do Supabase, rode **`anexos.sql`**. Ele só acrescenta a tabela de anexos, o espaço de arquivos (bucket `anexos`) e as regras de acesso; não apaga nada e pode ser rodado mais de uma vez.
   Para a integração com o GitHub, rode também **`github.sql`** (também só acrescenta) e siga a seção 7.
   Para editar e excluir itens, rode **`editar-excluir.sql`**; para os destaques da Síntese, rode **`sintese.sql`**. Os dois só acrescentam.
2. No GitHub, envie os arquivos novos por cima dos antigos (*Add file → Upload files*, selecionando todos de uma vez). **Não substitua o `config.js`**, que já tem as suas chaves.
3. Recarregue o site com Ctrl + Shift + R.


## 1. Publicar no GitHub Pages (5 minutos)

1. Crie um repositório no GitHub (por exemplo `governanca-monitoraea`) e envie todos os arquivos desta pasta para a raiz do repositório (em *Add file → Upload files*, selecione todos de uma vez).
2. No repositório, abra **Settings → Pages**.
3. Em *Build and deployment*, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)` e salve.
4. Em um ou dois minutos, o site estará em `https://SEU-USUARIO.github.io/governanca-monitoraea/`.

Nesse ponto ele já funciona em **modo demonstração**. Na tela de acesso, escolha uma pessoa (INPE, ANPPEA ou convidado externo) para ver a plataforma com o perfil dela.

> O site publicado é público, mas os dados não são: sem login nada aparece. Nunca coloque dados de demandas no repositório.
> No plano gratuito do GitHub, o Pages só funciona com repositório público. Isso não é problema, porque o código não contém dados nem senhas.

## 2. Ligar o banco de dados (10 minutos)

1. Crie uma conta e um projeto em [supabase.com](https://supabase.com). Escolha a região mais próxima do Brasil e anote a senha do banco.
2. No painel do projeto, abra **SQL Editor → New query**, cole todo o conteúdo de `schema.sql` e clique em **Run**.
   O script começa removendo qualquer instalação anterior, então pode ser rodado de novo se algo der errado. Mas ele **apaga os dados**: use-o só para instalar. Se você já tinha criado contas em *Authentication → Users*, apague-as antes de reinstalar.
3. Em **Authentication → Sign In / Providers → Email**:
   - deixe *Email* habilitado;
   - **desligue "Confirm email"**. O código de convite já comprova que a pessoa recebeu o e-mail. Se preferir manter a confirmação, configure um servidor de e-mail próprio, conforme o item 3 da seção 4.
4. Em **Authentication → URL Configuration**, coloque o endereço do GitHub Pages em *Site URL*.
5. Abra `primeiro-convite.sql`, troque o e-mail pelo seu, cole no SQL Editor e rode. Isso cria o convite da primeira pessoa administradora, com o código `INPE-0001`.
6. Em **Project Settings → API**, copie a *Project URL* e a chave *anon public*. Cole as duas em `config.js`:

   ```js
   export const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```

7. Envie a alteração ao GitHub. Ao recarregar o site, o modo demonstração some e aparece o login.
8. Na aba **Primeiro acesso**, use o código `INPE-0001` e o mesmo e-mail do convite, crie a senha e entre.
9. Na página **Equipe**, gere os convites das demais pessoas. A coordenação da ANPPEA, depois de entrar, convida a própria equipe.

A chave *anon public* foi feita para ficar no navegador. Quem protege os dados são as regras de acesso do banco. **Nunca** coloque no site a chave *service_role*.

## 3. Como a plataforma funciona

**Perfis de acesso**

| Perfil | O que pode fazer |
|---|---|
| Leitor | Vê tudo e comenta. É o perfil dos convidados externos, como DEA/MMA e CNPq. |
| Colaborador | Cria atividades, demandas e processos; atribui à outra instituição; move fases; passa a vez. |
| Coordenação | Tudo o que o colaborador faz. Além disso: responde à triagem, designa responsáveis, convida pessoas da sua instituição e pactua decisões. |
| Administração | Tudo o que a coordenação faz, nas duas instituições, e a concessão de perfis. |

Todos veem tudo. O perfil define o que cada um pode fazer, e essas regras valem no banco, não só na tela.

**Atribuição entre instituições.** Uma instituição atribui uma demanda à outra, mas ninguém recebe trabalho sem aceitar.
1. A demanda entra em *Entrada e triagem* e vai para a coordenação de destino, que tem 5 dias úteis para responder.
2. A coordenação de destino **aceita** (e designa um responsável), **contrapropõe** prazo ou escopo, ou **devolve** com justificativa.
3. Se houver contraproposta, a origem a aceita e a demanda volta para a triagem do destino.
4. Só depois de aceita a demanda entra na carga da instituição de destino.

**A vez.** Todo item tem alguém com a próxima ação, que pode ser uma pessoa ou a coordenação de uma instituição. Quando a vez passa, quem a recebe é avisado.

**Fases do quadro.** Entrada e triagem → Priorizado → Em andamento → Em validação → Aguardando decisão → Publicado. Quando um item chega a *Em validação*, quem o originou é avisado para conferir a entrega.

**Decisões.** Qualquer colaborador pode colocar uma decisão em pauta, inclusive marcando um comentário como proposta. A decisão só fica *pactuada* quando as coordenações do INPE e da ANPPEA dão o seu de acordo.

**Anexos.** Cada item tem uma área de anexos, e cada comentário pode levar anexos também.
- **Arquivos** de qualquer tipo, até 50 MB cada (limite do plano gratuito do Supabase). Imagens aparecem em miniatura; vídeos e áudios tocam na própria página; documentos ficam para baixar.
- **Gravação de áudio** direto no navegador, para mensagens de voz em comentários ou registros no item (até 10 minutos por gravação).
- **Links de vídeo ou página**: YouTube aparece com o vídeo embutido; Drive e outros sites viram um cartão com o link. Para vídeos longos, prefira o link, porque o espaço gratuito é de 1 GB no total.
- Os arquivos ficam num espaço privado: só membros com login conseguem abri-los, por links temporários. Colaboradores anexam nos itens; qualquer membro, inclusive leitor, anexa nos próprios comentários. Cada pessoa remove o que enviou; a administração remove qualquer anexo.

**Notificações.** Ficam no sino do topo e se atualizam em tempo real. São geradas pelo banco quando há atribuição, resposta de triagem, passagem de vez, item pronto para validação, comentário em item seu e menção `@INPE` ou `@ANPPEA`.

**Histórico.** Toda mudança de fase, vez, responsável e prazo fica registrada com autor e data. Nada é apagado: o que perde validade é arquivado.

## 4. Cuidados de operação

1. **Pausa do plano gratuito do Supabase.** Um projeto gratuito é pausado depois de 7 dias de pouca atividade. Ele pode ser retomado pelo painel (*Resume project*) sem perda de dados. Com uso diário isso não acontece. Para uso institucional contínuo, considere o plano pago.
2. **Cópias de segurança.** Exporte o banco periodicamente: *Database → Backups* nos planos pagos, ou `pg_dump` com a string de conexão.
3. **E-mails.** A versão atual avisa dentro da plataforma. Para enviar convites e avisos também por e-mail, configure um servidor de e-mail próprio em *Authentication → Emails → SMTP Settings* (institucional ou de um serviço de envio). O envio de avisos por e-mail é um próximo passo de desenvolvimento.
4. **Espaço de arquivos.** O plano gratuito do Supabase inclui 1 GB de arquivos e 5 GB de transferência por mês. Acompanhe em *Storage* no painel. Com uso intenso de vídeo, considere o plano pago ou use links do YouTube/Drive.
5. **LGPD.** A plataforma guarda nome, e-mail e instituição dos colaboradores. O termo aceito no primeiro acesso deve explicar essa finalidade.

## 5. Estrutura dos arquivos

Todos os arquivos ficam na raiz do repositório, sem pastas:

```
index.html             página única da aplicação
app.css                estilo (padrão visual do MonitoraEA)
config.js              endereço e chave pública do Supabase
app.js                 inicialização, rotas e ações
paginas.js             telas: acesso, painel, quadro, triagem, item, novo registro, decisões, equipe, notificações
dados-supabase.js      conexão com o banco
dados-demo.js          modo demonstração (mesmas regras, dados no navegador)
util.js                rótulos, datas e permissões
logo-*.png             logos do MonitoraEA, INPE e ANPPEA
schema.sql             instalação completa: tabelas, regras, gatilhos, funções e anexos (APAGA os dados)
primeiro-convite.sql   convite da primeira pessoa administradora
anexos.sql             acrescenta anexos a uma instalação existente (não apaga nada)
github.sql             acrescenta a integração com as issues do GitHub (não apaga nada)
editar-excluir.sql     edição completa e exclusão de itens (não apaga nada)
sintese.sql            destaques (★) usados na Síntese (não apaga nada)
sintese.js             página Síntese (dashboard)
governanca-monitoraea.yml  automação que vai no repositório das issues (seção 7)
00-limpar.sql          remove a plataforma do banco (apaga os dados)
```

**Testar no próprio computador:** na pasta do projeto, rode `python3 -m http.server 8000` e abra `http://localhost:8000`. Abrir o `index.html` direto pelo navegador não funciona, porque os módulos JavaScript precisam de um servidor.

**Recomeçar o banco do zero.** Rode no SQL Editor e depois o `schema.sql` de novo:

```sql
drop trigger if exists ao_criar_usuario on auth.users;
drop table if exists notificacoes, eventos, decisoes, comentarios, atribuicoes, itens, convites, membros, instituicoes cascade;
drop type if exists perfil_acesso, tipo_item, fase_item, frente_item, prioridade_item, situacao_atrib, situacao_decisao cascade;
drop function if exists ao_criar_usuario, itens_antes, itens_depois, atribuicoes_antes, atribuicoes_depois, comentarios_depois,
  responder_atribuicao, pactuar_decisao, atualizar_membro, notificar, membros_de, sigla, rotulo_fase,
  sou_coordenacao_de, posso_editar, sou_membro, meu_perfil, minha_instituicao cascade;
```

Isso apaga todos os dados. Depois, se quiser, remova as contas em *Authentication → Users*.

**Saída de colaboradores.** Não exclua a conta de quem já registrou itens ou comentários: o banco impede a exclusão para preservar o histórico. Use **Desativar** na página Equipe. A pessoa perde o acesso e o histórico continua com o nome dela.

## 6. Incorporação futura ao MonitoraEA

O banco é PostgreSQL, como o do MonitoraEA. Para incorporar a plataforma, basta migrar estas tabelas para o banco do sistema e trocar o login pelo do portal. As regras de negócio (triagem, vez, decisões) já estão no banco e podem ser reaproveitadas.


## 7. Integração com as issues do GitHub

As issues de um repositório de desenvolvimento chegam à página **GitHub** da plataforma, que funciona como caixa de entrada. **Nada entra no Quadro sozinho.** Colaboradores e coordenação decidem o que fazer com cada issue:

- **Trazer para o Quadro:** cria um item a partir da issue. A pessoa escolhe a origem (a sua instituição ou conjunta) e a frente. A frente vem sugerida pelas etiquetas.
- **Vincular a um item:** liga a issue a um item que já existe. O vínculo também pode ser feito na ficha do item, em *Editar detalhes*.
- **Ignorar:** tira a issue da lista *Para avaliar*. Ela pode voltar depois, pela aba *Ignoradas*.

Depois que a issue está no Quadro, o item a acompanha:
- quem está **atribuído** na issue e tem o usuário do GitHub cadastrado na Equipe vira responsável, e o item passa para Em andamento;
- **fechar** a issue leva o item para Publicado; fechar como *not planned* leva para Arquivado;
- **reabrir** a issue devolve o item para Em andamento;
- os **comentários** da issue entram no histórico do item.

O GitHub não passa por cima da governança:
- itens em triagem entre instituições não mudam de fase;
- nos itens apenas vinculados, título e descrição continuam os da plataforma.

A página fica num acesso discreto no pé do menu (*Issues · GitHub*). Só a equipe do INPE que edita (colaboradores, coordenação) e a administração podem usá-la: escolher, vincular ou ignorar issues. Para as demais pessoas o acesso aparece bloqueado, e o banco recusa essas ações mesmo que alguém tente por fora do site.

### Passo a passo (uma vez só)

1. **Supabase → SQL Editor:** rode `github.sql`. Ele só acrescenta, não apaga nada, e pode ser rodado de novo a cada atualização (a configuração e as issues já recebidas continuam).
2. **Supabase → SQL Editor:** rode a configuração, trocando o repositório, o segredo e o e-mail:

   ```sql
   select github_configurar(
     'dono/repositorio-das-issues',        -- ex.: ladis-inpe/monitoraea
     'UM-SEGREDO-LONGO-COM-PELO-MENOS-24-CARACTERES',
     'seu-email@inpe.br',                   -- membro responsável pela integração
     'INPE'                                 -- origem padrão: INPE, ANPPEA ou CONJUNTA
   );
   ```

   Para que outras etiquetas sugiram uma frente, acrescente a lista de correspondências:

   ```sql
   select github_configurar('dono/repo', 'SEGREDO...', 'seu-email@inpe.br', 'INPE',
     '{"frontend":"desenvolvimento","bug":"operacao","servidor":"infraestrutura"}');
   ```

3. **GitHub, no repositório das issues → Settings → Secrets and variables → Actions → New repository secret.** Crie três segredos:
   - `GOVERNANCA_URL`: o endereço do projeto no Supabase (o mesmo do `config.js`);
   - `GOVERNANCA_CHAVE`: a chave publishable (a mesma do `config.js`);
   - `GOVERNANCA_SEGREDO`: exatamente o mesmo segredo do passo 2.
4. **GitHub, no repositório das issues → Add file → Create new file.** No nome, escreva `.github/workflows/governanca-monitoraea.yml`, cole o conteúdo do arquivo `governanca-monitoraea.yml` e clique em *Commit changes*.
5. **Aba Actions → Governança MonitoraEA → Run workflow.** Isso envia de uma vez as issues que já existem para a caixa de entrada. Depois disso, cada mudança numa issue chega em segundos, e uma revisão diária corrige o que tiver escapado.
6. Na plataforma, em **Equipe → Usuários do GitHub**, cada pessoa informa o próprio usuário. A coordenação também pode informar o usuário das pessoas da sua instituição.

### Se algo não chegar

- Na aba **Actions** do repositório das issues, abra a execução com X vermelho. A mensagem diz o motivo:
  - `segredo inválido`: o segredo do GitHub e o do passo 2 estão diferentes;
  - `não é o configurado`: o repositório informado no passo 2 está errado.
- O segredo não fica no site. Se precisar trocá-lo, rode o passo 2 de novo com o novo segredo e atualize `GOVERNANCA_SEGREDO` no GitHub.

## 8. Síntese

A aba **Síntese** mostra o MonitoraEA em um olhar, calculado na hora a partir dos itens:

- números de itens em aberto, entregues, atrasados e na triagem, com a tendência do período escolhido (7 dias, 30 dias ou trimestre);
- onde está o trabalho (fases × instituição de origem) e quem originou;
- saúde de cada frente:
  - **Crítico** quando há item atrasado;
  - **Atenção** quando algo vence em até 7 dias ou está sem responsável;
  - **No ritmo** nos demais casos;
- linha do tempo dos destaques;
- ritmo de entregas, itens que pedem atenção e pauta de decisões.

A coordenação e a administração marcam itens com **★ Destacar**, na ficha do item, para que entrem na linha do tempo. Sem nenhum destaque marcado, a linha do tempo mostra os atrasados, os de prioridade alta e os de prazo próximo.

O botão **Imprimir ou salvar PDF** gera uma versão limpa, sem menu, para levar a reuniões.
