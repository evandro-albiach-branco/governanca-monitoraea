// Modo demonstração: mesmos fluxos e regras do banco real, com dados de
// exemplo guardados apenas neste navegador (localStorage).
import { hojeISO, somarDias, FASE, PARCEIRAS, siglaDe, podeGithub } from './util.js?v=20261015f';

const CHAVE = 'gov-monitoraea-demo-v3';
const REPO_DEMO = 'ladis-inpe/monitoraea';
const CHAVE_EU = 'gov-monitoraea-demo-eu';

function agoraMenos(dias, horas = 0) {
  return new Date(Date.now() - dias * 86400000 - horas * 3600000).toISOString();
}

// Mesma regra do banco: etiqueta com o nome de uma frente define a frente
function frenteDe(etiquetas) {
  for (const t of etiquetas || []) {
    const n = t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/^frente\s*[:/-]\s*/, '').trim();
    if (['desenvolvimento', 'operacao', 'dados', 'comunidades', 'formacao', 'infraestrutura', 'gestao'].includes(n)) return n;
  }
  return null;
}

function semente() {
  const H = hojeISO();
  const d = (n) => somarDias(H, n);
  const membros = [
    ['m1', 'Evandro A. Branco', 'INPE', 'administracao', 'Coordenação do programa'],
    ['m2', 'Gustavo F. B. Arcoverde', 'INPE', 'coordenacao', 'Co-coordenação do LADIS'],
    ['m3', 'Maria Henriqueta A. Raymundo', 'INPE', 'colaborador', 'Coordenação do Projeto CIEAs'],
    ['m4', 'Celly Kelly N. dos Santos', 'INPE', 'colaborador', 'Articulação com estados'],
    ['m5', 'Equipe de desenvolvimento', 'INPE', 'colaborador', 'Desenvolvimento e infraestrutura'],
    ['m6', 'Coordenação ANPPEA', 'ANPPEA', 'coordenacao', 'Coordenação da articulação'],
    ['m7', 'Secretaria executiva', 'ANPPEA', 'colaborador', 'Gestão de demandas da rede'],
    ['m8', 'Articulação das redes', 'ANPPEA', 'colaborador', 'Redes estaduais e CIEAs'],
    ['m9', 'Comunicação ANPPEA', 'ANPPEA', 'colaborador', 'Chamadas e divulgação'],
    ['m10', 'DEA/MMA', 'DEA_MMA', 'leitor', 'Órgão Gestor da PNEA'],
    ['m11', 'CNPq', 'CNPQ', 'leitor', 'Projeto de encomenda'],
  ].map(([id, nome, inst, perfil, papel]) => ({
    id, nome, instituicao_id: inst, perfil, papel, ativo: true,
    email: `${id}@demo.local`, criado_em: agoraMenos(90),
    github: ({ m1: 'evandro-albiach-branco', m5: 'equipe-dev-monitoraea' })[id] || null,
  }));

  const I = (o) => ({
    descricao: '', modulo: '', envolvidas: [], prioridade: 'media', vez_nota: null, instrumento: null,
    concluido_em: null, github_repo: null, github_numero: null, github_url: null, github_estado: null,
    github_etiquetas: [], github_atribuidos: [], github_criado: false, github_sinc: null,
    ...o, criado_em: agoraMenos(o.idade ?? 10), atualizado_em: agoraMenos(o.mexido ?? 1),
  });
  const itens = [
    I({ id: 1, tipo: 'demanda', titulo: 'Filtro por bioma na perspectiva Iniciativas', descricao: 'Permitir filtrar as iniciativas por bioma nos mapas e gráficos da perspectiva Iniciativas.', frente: 'desenvolvimento', modulo: 'Portal · Sínteses', origem: 'ANPPEA', fase: 'triagem', responsavel_id: null, vez_instituicao: 'INPE', vez_membro_id: null, vez_nota: 'Aguardando triagem', prazo: d(21), criado_por: 'm7', idade: 1, mexido: 0.5 }),
    I({ id: 2, tipo: 'demanda', titulo: 'Regras de moderação para novas comunidades de prática', frente: 'comunidades', modulo: 'Comunidades', origem: 'ANPPEA', fase: 'triagem', responsavel_id: null, vez_instituicao: 'INPE', vez_membro_id: null, vez_nota: 'Aguardando triagem', prazo: d(28), criado_por: 'm6', idade: 2 }),
    I({ id: 3, tipo: 'demanda', titulo: 'Validação dos dados de enraizamento pelas redes estaduais', descricao: 'Os dados de relacionamento DEA↔SEMAs e INPE↔CIEAs precisam ser conferidos pelas redes antes de entrar na Síntese Enraizamento.', frente: 'dados', modulo: 'Enraizamento', origem: 'INPE', fase: 'triagem', responsavel_id: null, vez_instituicao: 'ANPPEA', vez_membro_id: null, vez_nota: 'Aguardando triagem', prazo: d(26), criado_por: 'm4', idade: 1 }),
    I({ id: 4, tipo: 'atividade', titulo: 'Recalcular o IITEA com os cadastros de 2026', frente: 'dados', modulo: 'IITEA', origem: 'INPE', fase: 'priorizado', responsavel_id: 'm1', vez_instituicao: 'INPE', vez_membro_id: 'm1', prazo: d(45), criado_por: 'm1', idade: 12 }),
    I({ id: 5, tipo: 'atividade', titulo: 'Tutorial de autoavaliação para iniciativas', frente: 'formacao', modulo: 'Autoavaliação', origem: 'CONJUNTA', envolvidas: ['INPE', 'ANPPEA'], fase: 'priorizado', responsavel_id: 'm4', vez_instituicao: 'ANPPEA', vez_membro_id: 'm8', vez_nota: 'Roteiro do tutorial', prazo: d(30), criado_por: 'm4', idade: 9 }),
    I({ id: 6, tipo: 'atividade', titulo: 'Síntese Enraizamento no Portal', descricao: 'Camadas nacional, painel de controle e dossiê do estado.', frente: 'desenvolvimento', modulo: 'Portal · Sínteses', origem: 'INPE', fase: 'andamento', prioridade: 'alta', responsavel_id: 'm5', vez_instituicao: 'INPE', vez_membro_id: 'm5', prazo: d(2), criado_por: 'm1', idade: 30, github_repo: REPO_DEMO, github_numero: 87, github_url: `https://github.com/${REPO_DEMO}/issues/87`, github_estado: 'aberta', github_etiquetas: ['desenvolvimento', 'sínteses'], github_atribuidos: ['equipe-dev-monitoraea'], github_criado: false, github_sinc: agoraMenos(0.2) }),
    I({ id: 7, tipo: 'atividade', titulo: 'Atualização do servidor de mapas', frente: 'infraestrutura', modulo: 'Infraestrutura', origem: 'INPE', fase: 'andamento', responsavel_id: 'm5', vez_instituicao: 'INPE', vez_membro_id: 'm5', prazo: d(23), criado_por: 'm5', idade: 8, github_repo: REPO_DEMO, github_numero: 91, github_url: `https://github.com/${REPO_DEMO}/issues/91`, github_estado: 'aberta', github_etiquetas: ['infraestrutura'], github_atribuidos: ['equipe-dev-monitoraea'], github_criado: true, github_sinc: agoraMenos(0.1) }),
    I({ id: 8, tipo: 'atividade', titulo: 'Mobilização das redes para o cadastro de iniciativas', frente: 'comunidades', modulo: 'Cadastro', origem: 'ANPPEA', fase: 'andamento', responsavel_id: 'm8', vez_instituicao: 'ANPPEA', vez_membro_id: 'm8', prazo: d(40), criado_por: 'm6', idade: 20 }),
    I({ id: 9, tipo: 'atividade', titulo: 'Formulário de mapeamento de iniciativas, versão 2', frente: 'desenvolvimento', modulo: 'Cadastro', origem: 'INPE', envolvidas: ['ANPPEA'], fase: 'validacao', responsavel_id: 'm5', vez_instituicao: 'ANPPEA', vez_membro_id: 'm8', vez_nota: 'Homologar com as redes', prazo: d(16), criado_por: 'm1', idade: 40 }),
    I({ id: 10, tipo: 'atividade', titulo: 'Painel de conjuntura das CIEAs', frente: 'desenvolvimento', modulo: 'CIEAs', origem: 'CONJUNTA', envolvidas: ['INPE', 'ANPPEA'], fase: 'validacao', responsavel_id: 'm3', vez_instituicao: 'ANPPEA', vez_membro_id: 'm6', prazo: d(21), criado_por: 'm3', idade: 25 }),
    I({ id: 11, tipo: 'processo', titulo: 'Política de dados abertos do portal', descricao: 'Definir quais dados do MonitoraEA ficam abertos para download e em que nível de agregação.', frente: 'operacao', modulo: 'Portal', origem: 'CONJUNTA', envolvidas: ['INPE', 'ANPPEA'], fase: 'decisao', responsavel_id: 'm1', vez_instituicao: 'INPE', vez_membro_id: 'm1', vez_nota: 'Levar ao Comitê', prazo: d(-3), criado_por: 'm1', idade: 35, mexido: 12 }),
    I({ id: 12, tipo: 'atividade', titulo: 'Distribuição de iniciativas por perspectiva no portal', frente: 'desenvolvimento', modulo: 'Portal · Sínteses', origem: 'INPE', fase: 'publicado', responsavel_id: 'm5', vez_instituicao: 'INPE', vez_membro_id: 'm5', prazo: d(-8), criado_por: 'm1', idade: 40, concluido_em: agoraMenos(6), github_repo: REPO_DEMO, github_numero: 74, github_url: `https://github.com/${REPO_DEMO}/issues/74`, github_estado: 'fechada', github_etiquetas: ['desenvolvimento'], github_atribuidos: ['equipe-dev-monitoraea'], github_criado: true, github_sinc: agoraMenos(6) }),
    I({ id: 13, tipo: 'atividade', titulo: 'Chamada nacional para cadastro de iniciativas', frente: 'comunidades', modulo: 'Cadastro', origem: 'ANPPEA', fase: 'publicado', responsavel_id: 'm9', vez_instituicao: 'ANPPEA', vez_membro_id: 'm9', prazo: d(-14), criado_por: 'm6', idade: 30, concluido_em: agoraMenos(13) }),
    I({ id: 14, tipo: 'processo', titulo: '3º Termo Aditivo ao TED nº 967812/2024', descricao: 'Acomodar o projeto de desenvolvimento institucional das CIEAs no OE1.', frente: 'gestao', modulo: 'Financiamento', origem: 'INPE', envolvidas: ['DEA_MMA', 'ANPPEA'], fase: 'andamento', responsavel_id: 'm1', vez_instituicao: 'INPE', vez_membro_id: 'm1', vez_nota: 'Revisar o plano de trabalho', prazo: d(9), instrumento: 'Processo MMA 02000.008293/2024-84', criado_por: 'm1', idade: 43 }),
    I({ id: 15, tipo: 'processo', titulo: 'Plano de trabalho conjunto 2027', frente: 'gestao', modulo: 'Planejamento', origem: 'ANPPEA', envolvidas: ['INPE'], fase: 'andamento', responsavel_id: 'm6', vez_instituicao: 'INPE', vez_membro_id: 'm1', vez_nota: 'Validar a proposta', prazo: d(16), criado_por: 'm6', idade: 15 }),
    I({ id: 16, tipo: 'demanda', titulo: 'Ajuste no formulário de mapeamento de iniciativas', frente: 'desenvolvimento', modulo: 'Cadastro', origem: 'ANPPEA', fase: 'triagem', responsavel_id: null, vez_instituicao: 'ANPPEA', vez_membro_id: null, vez_nota: 'Avaliar contraproposta de INPE', prazo: d(28), criado_por: 'm7', idade: 6 }),
    I({ id: 18, tipo: 'atividade', titulo: 'Erro ao exportar CSV do painel de iniciativas', descricao: 'Arquivo exportado vem com acentos quebrados quando aberto no Excel.', frente: 'operacao', modulo: 'Portal', origem: 'INPE', envolvidas: ['INPE'], fase: 'priorizado', responsavel_id: null, vez_instituicao: 'INPE', vez_membro_id: null, criado_por: 'm1', idade: 0.3, mexido: 0.3, github_repo: REPO_DEMO, github_numero: 95, github_url: `https://github.com/${REPO_DEMO}/issues/95`, github_estado: 'aberta', github_etiquetas: ['bug', 'operação'], github_atribuidos: [], github_criado: true, github_sinc: agoraMenos(0.3) }),
    I({ id: 17, tipo: 'demanda', titulo: 'Contatos atualizados das 27 CIEAs', frente: 'comunidades', modulo: 'CIEAs', origem: 'INPE', fase: 'priorizado', responsavel_id: null, vez_instituicao: 'INPE', vez_membro_id: 'm4', vez_nota: 'Devolvida por ANPPEA', prazo: d(26), criado_por: 'm4', idade: 7 }),
  ];

  const A = (o) => ({ prazo_contraproposto: null, resposta: null, respondido_por: null, respondido_em: null, sugerido_membro_id: null, ...o });
  const atribuicoes = [
    A({ id: 1, item_id: 1, de_instituicao: 'ANPPEA', para_instituicao: 'INPE', justificativa: 'Pedido recorrente das redes do Cerrado e da Caatinga.', prazo_sugerido: d(21), situacao: 'aguardando', criado_por: 'm7', criado_em: agoraMenos(1) }),
    A({ id: 2, item_id: 2, de_instituicao: 'ANPPEA', para_instituicao: 'INPE', justificativa: 'Novas comunidades estão sendo criadas sem critério comum.', prazo_sugerido: d(28), situacao: 'aguardando', criado_por: 'm6', criado_em: agoraMenos(2) }),
    A({ id: 3, item_id: 3, de_instituicao: 'INPE', para_instituicao: 'ANPPEA', justificativa: 'Conferência necessária antes da publicação da Síntese Enraizamento.', prazo_sugerido: d(26), situacao: 'aguardando', criado_por: 'm4', criado_em: agoraMenos(1) }),
    A({ id: 4, item_id: 16, de_instituicao: 'ANPPEA', para_instituicao: 'INPE', justificativa: 'Campos de público-alvo confusos para as iniciativas.', prazo_sugerido: d(14), situacao: 'contraproposta', prazo_contraproposto: d(28), resposta: 'Podemos incluir na versão 2 do formulário, com prazo maior.', respondido_por: 'm2', respondido_em: agoraMenos(3), criado_por: 'm7', criado_em: agoraMenos(6) }),
    A({ id: 5, item_id: 17, de_instituicao: 'INPE', para_instituicao: 'ANPPEA', situacao: 'devolvida', resposta: 'A lista já está no painel das CIEAs, atualizada em setembro.', respondido_por: 'm6', respondido_em: agoraMenos(4), criado_por: 'm4', criado_em: agoraMenos(7) }),
    A({ id: 6, item_id: 9, de_instituicao: 'INPE', para_instituicao: 'ANPPEA', justificativa: 'Homologação do formulário v2 com as redes.', prazo_sugerido: d(16), situacao: 'aceita', respondido_por: 'm6', respondido_em: agoraMenos(5), criado_por: 'm1', criado_em: agoraMenos(8) }),
  ];

  const comentarios = [
    { id: 1, item_id: 6, autor_id: 'm3', texto: 'Subi a versão do painel de controle com o semáforo de relacionamento.', proposta_decisao: false, criado_em: agoraMenos(3) },
    { id: 2, item_id: 6, autor_id: 'm6', texto: '@INPE podemos testar com duas redes estaduais antes de publicar?', proposta_decisao: false, criado_em: agoraMenos(2) },
    { id: 3, item_id: 11, autor_id: 'm6', texto: 'Sugerimos abrir os dados agregados por UF e manter os dados por iniciativa sob login.', proposta_decisao: true, criado_em: agoraMenos(12) },
    { id: 4, item_id: 9, autor_id: 'm8', texto: 'Já marcamos a homologação com três redes estaduais.', proposta_decisao: false, criado_em: agoraMenos(1, 3) },
  ];

  const decisoes = [
    { id: 1, titulo: 'Adotar esta plataforma como registro único de demandas entre INPE e ANPPEA', descricao: '', forum: 'Comitê de governança', item_id: null, data_pauta: d(-21), situacao: 'pactuada', ok_inpe: true, ok_anppea: true, pactuada_em: agoraMenos(21), criado_por: 'm1', criado_em: agoraMenos(25) },
    { id: 2, titulo: 'Toda demanda entre instituições é respondida em até 5 dias úteis', descricao: '', forum: 'Comitê de governança', item_id: null, data_pauta: d(-21), situacao: 'pactuada', ok_inpe: true, ok_anppea: true, pactuada_em: agoraMenos(21), criado_por: 'm6', criado_em: agoraMenos(25) },
    { id: 3, titulo: 'Política de dados abertos do portal', descricao: 'Dados agregados por UF abertos; dados por iniciativa sob login.', forum: 'Comitê de governança', item_id: 11, data_pauta: d(7), situacao: 'em_pauta', ok_inpe: true, ok_anppea: false, pactuada_em: null, criado_por: 'm6', criado_em: agoraMenos(12) },
  ];

  const eventos = [];
  let eid = 1;
  for (const it of itens) {
    eventos.push({ id: eid++, item_id: it.id, autor_id: it.criado_por, tipo: 'criado', detalhe: 'Registrou o item', criado_em: it.criado_em });
  }
  eventos.push({ id: eid++, item_id: 9, autor_id: 'm5', tipo: 'fase', detalhe: 'Em andamento → Em validação', criado_em: agoraMenos(2) });
  eventos.push({ id: eid++, item_id: 6, autor_id: 'm5', tipo: 'fase', detalhe: 'Priorizado → Em andamento', criado_em: agoraMenos(6) });
  eventos.push({ id: eid++, item_id: 17, autor_id: 'm6', tipo: 'triagem', detalhe: 'ANPPEA devolveu: A lista já está no painel das CIEAs', criado_em: agoraMenos(4) });
  eventos.push({ id: eid++, item_id: 18, autor_id: null, tipo: 'github', detalhe: 'Criado a partir da issue #95 do GitHub (aberta por @evandro-albiach-branco)', criado_em: agoraMenos(0.3) });
  eventos.push({ id: eid++, item_id: 7, autor_id: null, tipo: 'github', detalhe: 'Criado a partir da issue #91 do GitHub', criado_em: agoraMenos(8) });
  eventos.push({ id: eid++, item_id: 6, autor_id: 'm5', tipo: 'github', detalhe: '@equipe-dev-monitoraea comentou no GitHub: Camada nacional pronta; falta o dossiê do estado.', criado_em: agoraMenos(0.5) });
  eventos.push({ id: eid++, item_id: 12, autor_id: 'm5', tipo: 'github', detalhe: 'Issue #74 fechada no GitHub por @equipe-dev-monitoraea', criado_em: agoraMenos(6) });
  eventos.push({ id: eid++, item_id: 16, autor_id: 'm2', tipo: 'triagem', detalhe: 'INPE fez uma contraproposta', criado_em: agoraMenos(3) });

  const notificacoes = [
    { id: 1, membro_id: 'm1', item_id: 1, tipo: 'atribuicao', texto: 'ANPPEA atribuiu uma demanda: Filtro por bioma na perspectiva Iniciativas', lida: false, criado_em: agoraMenos(1) },
    { id: 2, membro_id: 'm1', item_id: 15, tipo: 'vez', texto: 'A próxima ação está com você: Plano de trabalho conjunto 2027', lida: false, criado_em: agoraMenos(0, 3) },
    { id: 3, membro_id: 'm6', item_id: 3, tipo: 'atribuicao', texto: 'INPE atribuiu uma demanda: Validação dos dados de enraizamento pelas redes estaduais', lida: false, criado_em: agoraMenos(1) },
    { id: 4, membro_id: 'm7', item_id: 16, tipo: 'triagem', texto: 'INPE fez uma contraproposta: Ajuste no formulário de mapeamento de iniciativas', lida: false, criado_em: agoraMenos(3) },
    { id: 5, membro_id: 'm5', item_id: 6, tipo: 'comentario', texto: 'Coordenação ANPPEA comentou em Síntese Enraizamento no Portal', lida: false, criado_em: agoraMenos(2) },
  ];

  const instituicoes = [
    { id: 'INPE', sigla: 'INPE', nome: 'Instituto Nacional de Pesquisas Espaciais', parceira: true, ordem: 1 },
    { id: 'ANPPEA', sigla: 'ANPPEA', nome: 'Articulação Nacional de Políticas Públicas de Educação Ambiental', parceira: true, ordem: 2 },
    { id: 'DEA_MMA', sigla: 'DEA/MMA', nome: 'Diretoria de Educação Ambiental do Ministério do Meio Ambiente', parceira: false, ordem: 3 },
    { id: 'CNPQ', sigla: 'CNPq', nome: 'Conselho Nacional de Desenvolvimento Científico e Tecnológico', parceira: false, ordem: 4 },
  ];

  const anexos = [
    { id: 1, item_id: 10, comentario_id: null, tipo: 'link', nome: 'Painel de conjuntura das CIEAs (versão publicada)', url: 'https://evandro-albiach-branco.github.io/conjuntura-ciea/', caminho: null, mime: null, tamanho: null, duracao_s: null, criado_por: 'm3', criado_em: agoraMenos(5) },
  ];
  const G = (numero, titulo, estado, etiquetas, atribuidos, autor, dias, corpo = '', extra = {}) => ({
    repo: REPO_DEMO, numero, titulo, corpo, estado, etiquetas, atribuidos, autor,
    url: `https://github.com/${REPO_DEMO}/issues/${numero}`, frente_sugerida: frenteDe(etiquetas),
    criada_em: agoraMenos(dias + 3), atualizada_em: agoraMenos(dias), sinc: agoraMenos(dias), ignorada: false, ignorada_por: null, ...extra,
  });
  const github_issues = [
    G(98, 'Lentidão ao abrir o mapa de iniciativas no celular', 'aberta', ['bug', 'operação'], [], 'celly-ks', 0.1, 'No celular, o mapa leva mais de 20 segundos para carregar com todas as camadas ligadas.'),
    G(97, 'Exportar a Síntese Enraizamento em PDF', 'aberta', ['desenvolvimento', 'sínteses'], ['equipe-dev-monitoraea'], 'evandro-albiach-branco', 0.4, 'Gerar um PDF do dossiê do estado para levar às reuniões das CIEAs.'),
    G(96, 'Atualizar dependências do front-end', 'aberta', ['infraestrutura'], ['equipe-dev-monitoraea'], 'equipe-dev-monitoraea', 1, 'Rotina trimestral de atualização de bibliotecas.'),
    G(95, 'Erro ao exportar CSV do painel de iniciativas', 'aberta', ['bug', 'operação'], [], 'evandro-albiach-branco', 0.3, 'Arquivo exportado vem com acentos quebrados quando aberto no Excel.'),
    G(94, 'Teste de deploy', 'aberta', [], [], 'equipe-dev-monitoraea', 2, '', { ignorada: true, ignorada_por: 'm5' }),
    G(91, 'Atualização do servidor de mapas', 'aberta', ['infraestrutura'], ['equipe-dev-monitoraea'], 'equipe-dev-monitoraea', 0.1),
    G(87, 'Síntese Enraizamento: camadas e dossiê', 'aberta', ['desenvolvimento', 'sínteses'], ['equipe-dev-monitoraea'], 'evandro-albiach-branco', 0.2),
    G(80, 'Ajustar cores do semáforo', 'fechada', ['desenvolvimento'], ['equipe-dev-monitoraea'], 'equipe-dev-monitoraea', 9),
    G(74, 'Distribuição de iniciativas por perspectiva no portal', 'fechada', ['desenvolvimento'], ['equipe-dev-monitoraea'], 'evandro-albiach-branco', 6),
  ];
  return { instituicoes, membros, itens, atribuicoes, comentarios, decisoes, eventos, notificacoes, anexos, github_issues, convites: [], seq: 100 };
}

export function criarBackendDemo() {
  let db;
  try { db = JSON.parse(localStorage.getItem(CHAVE)); } catch { db = null; }
  if (!db || !db.itens) db = semente();
  if (!db.anexos) db.anexos = [];
  if (!db.github_issues) db.github_issues = [];
  // Arquivos do modo demonstração ficam só na memória desta aba.
  const blobs = new Map();
  const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(db)); } catch { /* navegador sem armazenamento */ } };
  salvar();

  let euId = null;
  try { euId = localStorage.getItem(CHAVE_EU); } catch { euId = null; }

  const agora = () => new Date().toISOString();
  const novoId = () => ++db.seq;
  const eu = () => db.membros.find((m) => m.id === euId && m.ativo) || null;
  const membro = (id) => db.membros.find((m) => m.id === id);
  const perfil = () => eu()?.perfil;
  const inst = () => eu()?.instituicao_id;
  const podeEditar = () => ['colaborador', 'coordenacao', 'administracao'].includes(perfil());
  const coordDe = (i) => perfil() === 'administracao' || (perfil() === 'coordenacao' && inst() === i);
  const membrosDe = (i, soCoord = false) => db.membros
    .filter((m) => m.instituicao_id === i && m.ativo && (!soCoord || ['coordenacao', 'administracao'].includes(m.perfil)))
    .map((m) => m.id);
  const falha = (t) => { throw new Error(t); };
  const copia = (x) => JSON.parse(JSON.stringify(x));

  function evento(itemId, tipo, detalhe) {
    db.eventos.push({ id: novoId(), item_id: itemId, autor_id: euId, tipo, detalhe, criado_em: agora() });
  }
  function notificar(ids, itemId, tipo, texto) {
    for (const id of new Set(ids.filter(Boolean))) {
      if (id === euId || !membro(id)?.ativo) continue;
      db.notificacoes.push({ id: novoId(), membro_id: id, item_id: itemId, tipo, texto, lida: false, criado_em: agora() });
    }
  }
  function aplicarItem(it, patch, silencio = false) {
    const antes = { ...it };
    if (perfil() !== 'administracao') { delete patch.origem; delete patch.criado_por; }
    if ('github_numero' in patch && (patch.github_numero || null) !== (it.github_numero || null)) {
      if (!podeGithub(eu())) falha('O vínculo com issues do GitHub é feito pela equipe do INPE.');
      const n = patch.github_numero || null;
      if (n !== null && (!Number.isInteger(n) || n <= 0)) falha('Número de issue inválido.');
      if (n !== null && db.itens.some((x) => x !== it && x.github_numero === n)) falha('Esta issue já está vinculada a outro item.');
      Object.assign(patch, n === null
        ? { github_repo: null, github_url: null }
        : { github_repo: REPO_DEMO, github_url: `https://github.com/${REPO_DEMO}/issues/${n}` },
      { github_numero: n, github_estado: null, github_etiquetas: [], github_atribuidos: [], github_criado: false, github_sinc: null });
      const gi = n === null ? null : db.github_issues.find((g) => g.numero === n);
      if (gi) {
        Object.assign(patch, { github_url: gi.url, github_estado: gi.estado, github_etiquetas: [...gi.etiquetas], github_atribuidos: [...gi.atribuidos], github_sinc: gi.sinc });
        gi.ignorada = false; gi.ignorada_por = null;
      }
      evento(it.id, 'github', n === null ? `Desfez o vínculo com a issue #${antes.github_numero}` : `Vinculou à issue #${n} do GitHub`);
    } else {
      delete patch.github_numero;
    }
    Object.assign(it, patch, { atualizado_em: agora() });
    if (it.fase === 'publicado' && antes.fase !== 'publicado') it.concluido_em = agora();
    if (!['publicado', 'arquivado'].includes(it.fase)) it.concluido_em = null;
    if (it.fase !== antes.fase) {
      evento(it.id, 'fase', `${FASE[antes.fase]} → ${FASE[it.fase]}`);
      if (!silencio && it.fase === 'validacao') {
        notificar([it.criado_por, ...membrosDe(it.origem === 'CONJUNTA' ? 'INPE' : it.origem, true)], it.id, 'validacao', 'Pronto para validação: ' + it.titulo);
      }
    }
    if (it.vez_instituicao !== antes.vez_instituicao || it.vez_membro_id !== antes.vez_membro_id) {
      const quem = it.vez_membro_id ? ` (${membro(it.vez_membro_id)?.nome})` : '';
      evento(it.id, 'vez', `A vez passou para ${siglaDe(it.vez_instituicao)}${quem}${it.vez_nota ? ': ' + it.vez_nota : ''}`);
      if (!silencio) {
        notificar(it.vez_membro_id ? [it.vez_membro_id] : membrosDe(it.vez_instituicao, true), it.id, 'vez', 'A próxima ação está com você: ' + it.titulo);
      }
    }
    if (it.responsavel_id !== antes.responsavel_id) {
      evento(it.id, 'responsavel', 'Responsável: ' + (membro(it.responsavel_id)?.nome || 'ninguém'));
      if (!silencio) notificar([it.responsavel_id], it.id, 'responsavel', 'Você é responsável por: ' + it.titulo);
    }
    if (it.prazo !== antes.prazo) {
      evento(it.id, 'prazo', 'Prazo: ' + (it.prazo ? it.prazo.split('-').reverse().join('/') : 'sem prazo'));
    }
  }
  function podeEditarItem(it) {
    if (!podeEditar()) return false;
    return perfil() === 'administracao' || it.origem === inst() || it.origem === 'CONJUNTA'
      || it.vez_instituicao === inst() || (it.envolvidas || []).includes(inst());
  }
  function inserirAtribuicao(itemId, a) {
    const it = db.itens.find((x) => x.id === itemId);
    if (!it) falha('Item não encontrado.');
    if (!podeEditar() || !(it.origem === inst() || it.origem === 'CONJUNTA' || it.vez_instituicao === inst())) {
      falha('Seu perfil não permite esta ação.');
    }
    if (db.atribuicoes.some((x) => x.item_id === itemId && ['aguardando', 'contraproposta'].includes(x.situacao))) {
      falha('Este item já tem uma atribuição aguardando resposta.');
    }
    if (!PARCEIRAS.includes(a.para_instituicao) || a.para_instituicao === inst()) {
      falha('Só é possível atribuir à outra instituição parceira.');
    }
    const at = {
      id: novoId(), item_id: itemId, de_instituicao: inst(), para_instituicao: a.para_instituicao,
      sugerido_membro_id: a.sugerido_membro_id || null, justificativa: a.justificativa || null,
      prazo_sugerido: a.prazo_sugerido || null, situacao: 'aguardando', prazo_contraproposto: null,
      resposta: null, respondido_por: null, respondido_em: null, criado_por: euId, criado_em: agora(),
    };
    db.atribuicoes.push(at);
    aplicarItem(it, {
      fase: 'triagem', vez_instituicao: at.para_instituicao, vez_membro_id: null,
      vez_nota: 'Aguardando triagem', prazo: at.prazo_sugerido || it.prazo,
    }, true);
    evento(itemId, 'atribuicao', `Atribuído por ${siglaDe(at.de_instituicao)} a ${siglaDe(at.para_instituicao)}`);
    notificar([...membrosDe(at.para_instituicao, true), at.sugerido_membro_id], itemId, 'atribuicao',
      `${siglaDe(at.de_instituicao)} atribuiu uma demanda: ${it.titulo}`);
  }

  return {
    modo: 'demo',

    async sessao() { return eu() ? copia(eu()) : null; },
    async entrar() { falha('No modo demonstração, escolha uma pessoa na lista.'); },
    async cadastrar() { falha('No modo demonstração não há cadastro: escolha uma pessoa na lista.'); },
    async sair() { euId = null; try { localStorage.removeItem(CHAVE_EU); } catch { /* */ } },
    demoMembros() { return copia(db.membros.filter((m) => m.ativo)); },
    async entrarComo(id) {
      euId = id;
      try { localStorage.setItem(CHAVE_EU, id); } catch { /* */ }
      return copia(eu());
    },
    reiniciarDemo() { db = semente(); salvar(); },

    async carregar() {
      return copia({
        instituicoes: db.instituicoes, membros: db.membros,
        itens: [...db.itens].sort((a, b) => b.atualizado_em.localeCompare(a.atualizado_em)),
        atribuicoes: [...db.atribuicoes].sort((a, b) => b.criado_em.localeCompare(a.criado_em)),
        decisoes: [...db.decisoes].sort((a, b) => b.criado_em.localeCompare(a.criado_em)),
        eventosRecentes: [...db.eventos].sort((a, b) => b.criado_em.localeCompare(a.criado_em)).slice(0, 15),
        anexosPorItem: db.anexos.reduce((m, a) => { m[a.item_id] = (m[a.item_id] || 0) + 1; return m; }, {}),
        anexosAtivos: true, githubAtivo: true,
        githubIssues: [...db.github_issues].sort((a, b) => b.atualizada_em.localeCompare(a.atualizada_em)),
      });
    },
    async comentarios(itemId) { return copia(db.comentarios.filter((c) => c.item_id === itemId)); },
    async eventos(itemId) {
      return copia(db.eventos.filter((x) => x.item_id === itemId).sort((a, b) => b.criado_em.localeCompare(a.criado_em)));
    },

    async criarItem(dados, atribuicao) {
      if (!podeEditar()) falha('Seu perfil não permite criar registros.');
      if (!(dados.origem === inst() || dados.origem === 'CONJUNTA' || perfil() === 'administracao')) {
        falha('A origem precisa ser a sua instituição ou conjunta.');
      }
      if (!dados.titulo || dados.titulo.trim().length < 3) falha('Dê um título com pelo menos 3 letras.');
      const it = {
        id: novoId(), tipo: 'atividade', descricao: '', frente: 'desenvolvimento', modulo: '', envolvidas: [],
        fase: 'priorizado', prioridade: 'media', responsavel_id: null, vez_instituicao: inst(), vez_membro_id: null,
        vez_nota: null, prazo: null, instrumento: null, concluido_em: null,
        ...dados, criado_por: euId, criado_em: agora(), atualizado_em: agora(),
      };
      db.itens.push(it);
      evento(it.id, 'criado', 'Registrou o item');
      if (it.vez_membro_id) notificar([it.vez_membro_id], it.id, 'vez', 'A próxima ação é sua: ' + it.titulo);
      if (atribuicao) inserirAtribuicao(it.id, atribuicao);
      salvar();
      return copia(it);
    },
    async atualizarItem(id, patch) {
      const it = db.itens.find((x) => x.id === id);
      if (!it || !podeEditarItem(it)) falha('Seu perfil não permite alterar este item.');
      aplicarItem(it, { ...patch });
      salvar();
      return copia(it);
    },
    async atribuir(itemId, a) { inserirAtribuicao(itemId, a); salvar(); },
    async responder(id, acao, { responsavel = null, prazo = null, texto = null } = {}) {
      const a = db.atribuicoes.find((x) => x.id === id);
      if (!a) falha('Atribuição inexistente.');
      const it = db.itens.find((x) => x.id === a.item_id);
      const txt = (texto || '').trim();
      if (['aceitar', 'contrapropor', 'devolver'].includes(acao)) {
        if (!coordDe(a.para_instituicao)) falha(`Só a coordenação de ${siglaDe(a.para_instituicao)} pode responder.`);
        if (a.situacao !== 'aguardando') falha('Esta atribuição não está aguardando triagem.');
      }
      if (acao === 'aceitar') {
        const r = membro(responsavel);
        if (!r || r.instituicao_id !== a.para_instituicao) falha(`Escolha um responsável de ${siglaDe(a.para_instituicao)}.`);
        Object.assign(a, { situacao: 'aceita', respondido_por: euId, respondido_em: agora(), resposta: txt || null });
        aplicarItem(it, {
          fase: 'priorizado', responsavel_id: responsavel, vez_instituicao: a.para_instituicao, vez_membro_id: responsavel,
          vez_nota: null, prazo: prazo || a.prazo_sugerido || it.prazo,
          envolvidas: [...new Set([...(it.envolvidas || []), a.para_instituicao, a.de_instituicao])],
        }, true);
        evento(it.id, 'triagem', `${siglaDe(a.para_instituicao)} aceitou a demanda`);
        notificar([a.criado_por, responsavel, ...membrosDe(a.de_instituicao, true)], it.id, 'triagem', `${siglaDe(a.para_instituicao)} aceitou: ${it.titulo}`);
      } else if (acao === 'contrapropor') {
        if (!prazo && !txt) falha('Informe um novo prazo ou o que muda no escopo.');
        Object.assign(a, { situacao: 'contraproposta', prazo_contraproposto: prazo || null, resposta: txt || null, respondido_por: euId, respondido_em: agora() });
        aplicarItem(it, { vez_instituicao: a.de_instituicao, vez_membro_id: null, vez_nota: `Avaliar contraproposta de ${siglaDe(a.para_instituicao)}` }, true);
        evento(it.id, 'triagem', `${siglaDe(a.para_instituicao)} fez uma contraproposta${prazo ? ' (prazo ' + prazo.split('-').reverse().join('/') + ')' : ''}`);
        notificar([a.criado_por, ...membrosDe(a.de_instituicao, true)], it.id, 'triagem', `${siglaDe(a.para_instituicao)} fez uma contraproposta: ${it.titulo}`);
      } else if (acao === 'devolver') {
        if (!txt) falha('Explique por que a demanda está sendo devolvida.');
        Object.assign(a, { situacao: 'devolvida', resposta: txt, respondido_por: euId, respondido_em: agora() });
        aplicarItem(it, { fase: 'priorizado', vez_instituicao: a.de_instituicao, vez_membro_id: a.criado_por, vez_nota: `Devolvida por ${siglaDe(a.para_instituicao)}` }, true);
        evento(it.id, 'triagem', `${siglaDe(a.para_instituicao)} devolveu: ${txt}`);
        notificar([a.criado_por, ...membrosDe(a.de_instituicao, true)], it.id, 'triagem', `${siglaDe(a.para_instituicao)} devolveu: ${it.titulo}`);
      } else if (acao === 'aceitar_contraproposta') {
        if (!(podeEditar() && (inst() === a.de_instituicao || perfil() === 'administracao'))) falha('Só a instituição de origem avalia a contraproposta.');
        if (a.situacao !== 'contraproposta') falha('Não há contraproposta a avaliar.');
        Object.assign(a, { situacao: 'aguardando', prazo_sugerido: a.prazo_contraproposto || a.prazo_sugerido });
        aplicarItem(it, { vez_instituicao: a.para_instituicao, vez_membro_id: null, vez_nota: 'Contraproposta aceita', prazo: a.prazo_contraproposto || it.prazo }, true);
        evento(it.id, 'triagem', `${siglaDe(a.de_instituicao)} aceitou a contraproposta`);
        notificar(membrosDe(a.para_instituicao, true), it.id, 'triagem', `${siglaDe(a.de_instituicao)} aceitou a contraproposta: ${it.titulo}`);
      } else {
        falha('Ação desconhecida.');
      }
      salvar();
    },
    async comentar(itemId, texto, proposta) {
      if (!eu()) falha('Entre para comentar.');
      const it = db.itens.find((x) => x.id === itemId);
      const c = { id: novoId(), item_id: itemId, autor_id: euId, texto, proposta_decisao: !!proposta, criado_em: agora() };
      db.comentarios.push(c);
      let alvo = [it.responsavel_id, it.criado_por, it.vez_membro_id];
      if (/@INPE\b/i.test(texto)) alvo = alvo.concat(membrosDe('INPE'));
      if (/@ANPPEA\b/i.test(texto)) alvo = alvo.concat(membrosDe('ANPPEA'));
      notificar(alvo, itemId, proposta ? 'proposta' : 'comentario', `${eu().nome} comentou em ${it.titulo}`);
      salvar();
      return copia(c);
    },
    async anexos(itemId) {
      return copia(db.anexos.filter((a) => a.item_id === itemId))
        .map((a) => ({ ...a, endereco: a.tipo === 'link' ? a.url : (blobs.get(a.id) || null) }));
    },
    async anexar(itemId, { arquivo = null, nome, tipo, mime = null, duracao = null, url = null, comentarioId = null }) {
      const it = db.itens.find((x) => x.id === itemId);
      if (!it) falha('Item não encontrado.');
      if (comentarioId) {
        const c = db.comentarios.find((x) => x.id === comentarioId);
        if (!c || c.autor_id !== euId) falha('Só é possível anexar ao seu próprio comentário.');
      } else if (!podeEditar()) {
        falha('Seu perfil não permite anexar arquivos ao item.');
      }
      if (tipo === 'link' && !/^https?:\/\//i.test(url || '')) falha('Use um endereço que comece com http:// ou https://.');
      const a = {
        id: novoId(), item_id: itemId, comentario_id: comentarioId, tipo, nome, url: tipo === 'link' ? url : null,
        caminho: tipo === 'link' ? null : `demo/${itemId}/${nome}`, mime, tamanho: arquivo ? arquivo.size : null,
        duracao_s: duracao, criado_por: euId, criado_em: agora(),
      };
      db.anexos.push(a);
      if (arquivo) blobs.set(a.id, URL.createObjectURL(arquivo));
      if (!comentarioId) {
        evento(itemId, 'anexo', 'Anexou ' + nome);
        notificar([it.responsavel_id, it.criado_por, it.vez_membro_id], itemId, 'anexo', `${eu().nome} anexou ${nome} em ${it.titulo}`);
      }
      salvar();
    },
    async removerAnexo(a) {
      const i = db.anexos.findIndex((x) => x.id === a.id);
      if (i < 0) return;
      if (db.anexos[i].criado_por !== euId && perfil() !== 'administracao') falha('Só quem enviou pode remover este anexo.');
      db.anexos.splice(i, 1);
      const u = blobs.get(a.id);
      if (u) { URL.revokeObjectURL(u); blobs.delete(a.id); }
      salvar();
    },
    async proporDecisao(d) {
      if (!podeEditar()) falha('Seu perfil não permite propor decisões.');
      db.decisoes.push({
        id: novoId(), titulo: d.titulo, descricao: d.descricao || '', forum: d.forum || 'Comitê de governança',
        item_id: d.item_id || null, data_pauta: d.data_pauta || null, situacao: 'em_pauta',
        ok_inpe: false, ok_anppea: false, pactuada_em: null, criado_por: euId, criado_em: agora(),
      });
      salvar();
    },
    async pactuar(id, deAcordo = true) {
      if (!['coordenacao', 'administracao'].includes(perfil()) || !PARCEIRAS.includes(inst())) {
        falha('Só a coordenação do INPE ou da ANPPEA pactua decisões.');
      }
      const d = db.decisoes.find((x) => x.id === id);
      if (!d || d.situacao !== 'em_pauta') falha('Esta decisão não está em pauta.');
      if (!deAcordo) { d.situacao = 'rejeitada'; salvar(); return; }
      if (inst() === 'INPE') d.ok_inpe = true; else d.ok_anppea = true;
      if (d.ok_inpe && d.ok_anppea) { d.situacao = 'pactuada'; d.pactuada_em = agora(); }
      salvar();
    },
    async convidar(c) {
      const ok = perfil() === 'administracao'
        || (perfil() === 'coordenacao' && c.instituicao_id === inst() && c.perfil !== 'administracao')
        || (perfil() === 'coordenacao' && c.perfil === 'leitor' && !PARCEIRAS.includes(c.instituicao_id));
      if (!ok) falha('Seu perfil não permite este convite.');
      const r = () => Math.random().toString(16).slice(2, 6).toUpperCase();
      const conv = {
        id: 'c' + novoId(), codigo: `${r()}-${r()}`, email: c.email, instituicao_id: c.instituicao_id,
        perfil: c.perfil, papel: c.papel || null, criado_por: euId, criado_em: agora(),
        expira_em: new Date(Date.now() + 30 * 86400000).toISOString(), aceito_em: null,
      };
      db.convites.push(conv);
      salvar();
      return copia(conv);
    },
    async convites() {
      return copia(db.convites.filter((c) => coordDe(c.instituicao_id) || c.criado_por === euId)
        .sort((a, b) => b.criado_em.localeCompare(a.criado_em)));
    },
    async atualizarMembro(id, { perfil: p = null, papel = null, ativo = null }) {
      const m = membro(id);
      if (!m) falha('Membro inexistente.');
      if (!coordDe(m.instituicao_id)) falha('Só a coordenação da instituição altera seus membros.');
      if (p === 'administracao' && perfil() !== 'administracao') falha('Só a administração concede esse perfil.');
      if (p) m.perfil = p;
      if (papel) m.papel = papel;
      if (ativo !== null) m.ativo = ativo;
      salvar();
    },
    async githubAdicionar(numero, origem, frente) {
      if (!podeGithub(eu())) falha('A seleção de issues do GitHub é feita pela equipe do INPE.');
      if (!(origem === inst() || origem === 'CONJUNTA' || perfil() === 'administracao')) falha('A origem precisa ser a sua instituição ou conjunta.');
      const gi = db.github_issues.find((g) => g.numero === numero);
      if (!gi) falha(`A issue #${numero} ainda não chegou à plataforma.`);
      if (db.itens.some((x) => x.github_numero === numero)) falha('Esta issue já está no Quadro.');
      const resp = gi.atribuidos.map((l) => db.membros.find((m) => m.ativo && m.perfil !== 'leitor' && (m.github || '').toLowerCase() === l.toLowerCase())).find(Boolean);
      const vezInst = origem === 'CONJUNTA' ? (PARCEIRAS.includes(inst()) ? inst() : 'INPE') : origem;
      const it = {
        id: novoId(), tipo: 'atividade', titulo: gi.titulo, descricao: gi.corpo || '', frente: frente || gi.frente_sugerida || 'desenvolvimento',
        modulo: '', origem, envolvidas: origem === 'CONJUNTA' ? ['INPE', 'ANPPEA'] : [origem],
        fase: gi.estado === 'aberta' ? (resp ? 'andamento' : 'priorizado') : gi.estado === 'fechada' ? 'publicado' : 'arquivado',
        prioridade: 'media', responsavel_id: resp?.id || null, vez_instituicao: resp?.instituicao_id || vezInst, vez_membro_id: resp?.id || null,
        vez_nota: null, prazo: null, instrumento: null, criado_por: euId, criado_em: agora(), atualizado_em: agora(),
        concluido_em: gi.estado === 'fechada' ? agora() : null,
        github_repo: gi.repo, github_numero: gi.numero, github_url: gi.url, github_estado: gi.estado,
        github_etiquetas: [...gi.etiquetas], github_atribuidos: [...gi.atribuidos], github_criado: true, github_sinc: gi.sinc,
      };
      db.itens.push(it);
      evento(it.id, 'criado', 'Registrou o item');
      evento(it.id, 'github', `Trouxe a issue #${gi.numero} do GitHub${gi.autor ? ` (aberta por @${gi.autor})` : ''}`);
      if (resp) notificar([resp.id], it.id, 'vez', 'A próxima ação é sua: ' + it.titulo);
      gi.ignorada = false; gi.ignorada_por = null;
      salvar();
      return it.id;
    },
    async githubIgnorar(numero, ignorar) {
      if (!podeGithub(eu())) falha('A seleção de issues do GitHub é feita pela equipe do INPE.');
      const gi = db.github_issues.find((g) => g.numero === numero);
      if (!gi) falha('Issue inexistente.');
      gi.ignorada = !!ignorar; gi.ignorada_por = ignorar ? euId : null;
      salvar();
    },
    async definirGithub(id, login) {
      const m = membro(id);
      if (!m) falha('Membro inexistente.');
      if (!(id === euId || coordDe(m.instituicao_id))) falha('Só a própria pessoa ou a coordenação altera este dado.');
      let v = String(login || '').trim().replace(/^https?:\/\/github\.com\//i, '').replace(/^@/, '').replace(/\/+$/, '');
      if (v && !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(v)) falha('Usuário do GitHub inválido.');
      if (v && db.membros.some((x) => x.id !== id && (x.github || '').toLowerCase() === v.toLowerCase())) {
        falha('Este usuário do GitHub já está ligado a outra pessoa.');
      }
      m.github = v || null;
      salvar();
    },
    async notificacoes() {
      return copia(db.notificacoes.filter((n) => n.membro_id === euId).sort((a, b) => b.criado_em.localeCompare(a.criado_em)));
    },
    async marcarLida(id) {
      const n = db.notificacoes.find((x) => x.id === id && x.membro_id === euId);
      if (n) n.lida = true;
      salvar();
    },
    async marcarTodas() {
      db.notificacoes.filter((n) => n.membro_id === euId).forEach((n) => { n.lida = true; });
      salvar();
    },
    assinar() { return () => {}; },
  };
}
