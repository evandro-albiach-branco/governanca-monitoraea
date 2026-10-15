# Governança MonitoraEA · INPE + ANPPEA

Plataforma de governança compartilhada do desenvolvimento e da operação do sistema MonitoraEA. Nela, as equipes do INPE e da ANPPEA registram atividades, demandas e processos em negociação, atribuem demandas uma à outra, comentam, pactuam decisões e acompanham a carga de cada colaborador.

- **Interface:** HTML, CSS e JavaScript puros, sem etapa de compilação. É hospedada no **GitHub Pages**.
- **Dados e login:** ficam no **Supabase** (PostgreSQL). As regras de acesso estão no próprio banco.
- **Sem configuração:** a plataforma abre em **modo demonstração**, com dados de exemplo guardados só no navegador. Serve para validar com as equipes antes de ligar o banco.

---

## 1. Publicar no GitHub Pages (5 minutos)

1. Crie um repositório no GitHub (por exemplo `governanca-monitoraea`) e envie todos os arquivos desta pasta, mantendo a estrutura.
2. No repositório, abra **Settings → Pages**.
3. Em *Build and deployment*, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)` e salve.
4. Em um ou dois minutos, o site estará em `https://SEU-USUARIO.github.io/governanca-monitoraea/`.

Nesse ponto ele já funciona em **modo demonstração**. Na tela de acesso, escolha uma pessoa (INPE, ANPPEA ou convidado externo) para ver a plataforma com o perfil dela.

> O site publicado é público, mas os dados não são: sem login nada aparece. Nunca coloque dados de demandas no repositório.
> No plano gratuito do GitHub, o Pages só funciona com repositório público. Isso não é problema, porque o código não contém dados nem senhas.

## 2. Ligar o banco de dados (10 minutos)

1. Crie uma conta e um projeto em [supabase.com](https://supabase.com). Escolha a região mais próxima do Brasil e anote a senha do banco.
2. No painel do projeto, abra **SQL Editor → New query**, cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**.
3. Em **Authentication → Sign In / Providers → Email**:
   - deixe *Email* habilitado;
   - **desligue "Confirm email"**. O código de convite já comprova que a pessoa recebeu o e-mail. Se preferir manter a confirmação, configure um servidor de e-mail próprio, conforme o item 3 da seção 4.
4. Em **Authentication → URL Configuration**, coloque o endereço do GitHub Pages em *Site URL*.
5. Abra `supabase/primeiro-convite.sql`, troque o e-mail pelo seu, cole no SQL Editor e rode. Isso cria o convite da primeira pessoa administradora, com o código `INPE-0001`.
6. Em **Project Settings → API**, copie a *Project URL* e a chave *anon public*. Cole as duas em `assets/js/config.js`:

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

**Notificações.** Ficam no sino do topo e se atualizam em tempo real. São geradas pelo banco quando há atribuição, resposta de triagem, passagem de vez, item pronto para validação, comentário em item seu e menção `@INPE` ou `@ANPPEA`.

**Histórico.** Toda mudança de fase, vez, responsável e prazo fica registrada com autor e data. Nada é apagado: o que perde validade é arquivado.

## 4. Cuidados de operação

1. **Pausa do plano gratuito do Supabase.** Um projeto gratuito é pausado depois de 7 dias de pouca atividade. Ele pode ser retomado pelo painel (*Resume project*) sem perda de dados. Com uso diário isso não acontece. Para uso institucional contínuo, considere o plano pago.
2. **Cópias de segurança.** Exporte o banco periodicamente: *Database → Backups* nos planos pagos, ou `pg_dump` com a string de conexão.
3. **E-mails.** A versão atual avisa dentro da plataforma. Para enviar convites e avisos também por e-mail, configure um servidor de e-mail próprio em *Authentication → Emails → SMTP Settings* (institucional ou de um serviço de envio). O envio de avisos por e-mail é um próximo passo de desenvolvimento.
4. **LGPD.** A plataforma guarda nome, e-mail e instituição dos colaboradores. O termo aceito no primeiro acesso deve explicar essa finalidade.

## 5. Estrutura dos arquivos

```
index.html                  página única da aplicação
assets/css/app.css          estilo (padrão visual do MonitoraEA)
assets/js/config.js         endereço e chave pública do Supabase
assets/js/app.js            inicialização, rotas e ações
assets/js/paginas.js        telas: acesso, painel, quadro, triagem, item, novo registro, decisões, equipe, notificações
assets/js/dados-supabase.js conexão com o banco
assets/js/dados-demo.js     modo demonstração (mesmas regras, dados no navegador)
assets/js/util.js           rótulos, datas e permissões
assets/img/                 logos do MonitoraEA, INPE e ANPPEA
supabase/schema.sql         tabelas, regras de acesso, gatilhos e funções
supabase/primeiro-convite.sql convite da primeira pessoa administradora
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
