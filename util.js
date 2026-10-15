// Utilitários de apresentação compartilhados por todas as páginas.

export const FASES = [
  ['triagem', 'Entrada e triagem'],
  ['priorizado', 'Priorizado'],
  ['andamento', 'Em andamento'],
  ['validacao', 'Em validação'],
  ['decisao', 'Aguardando decisão'],
  ['publicado', 'Publicado'],
];
export const FASE = Object.fromEntries([...FASES, ['arquivado', 'Arquivado']]);

export const FRENTES = [
  ['desenvolvimento', 'Desenvolvimento'],
  ['operacao', 'Operação e suporte'],
  ['dados', 'Dados e indicadores'],
  ['comunidades', 'Comunidades e redes'],
  ['formacao', 'Formação'],
  ['infraestrutura', 'Infraestrutura'],
  ['gestao', 'Gestão e instrumentos'],
];
export const FRENTE = Object.fromEntries(FRENTES);

export const TIPO = { atividade: 'Atividade', demanda: 'Demanda', processo: 'Processo' };
export const PRIORIDADE = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
export const PERFIL = {
  leitor: 'Leitor', colaborador: 'Colaborador', coordenacao: 'Coordenação', administracao: 'Administração',
};
export const SIT_ATRIB = {
  aguardando: 'Aguardando triagem', aceita: 'Aceita', contraproposta: 'Contraproposta', devolvida: 'Devolvida',
};
export const PARCEIRAS = ['INPE', 'ANPPEA'];
export const LOGO = {
  INPE: 'assets/img/logo-inpe.png',
  ANPPEA: 'assets/img/logo-anppea.png',
  MONITORAEA: 'assets/img/logo-monitoraea.png',
};

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const e = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export function hojeISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
export function somarDias(iso, n) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
export function dataCurta(iso) {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? iso + 'T12:00:00' : iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}
export function dataLonga(iso) {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? iso + 'T12:00:00' : iso);
  return d.toLocaleDateString('pt-BR');
}
export function quando(iso) {
  if (!iso) return '';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.round(h / 24);
  if (dias === 1) return 'ontem';
  if (dias < 30) return `há ${dias} dias`;
  return dataLonga(iso);
}
export function diasAte(iso) {
  if (!iso) return null;
  const a = new Date(hojeISO() + 'T12:00:00');
  const b = new Date(iso.slice(0, 10) + 'T12:00:00');
  return Math.round((b - a) / 86400000);
}
export function diasUteisDesde(iso) {
  let d = new Date(iso);
  const fim = new Date();
  let n = 0;
  while (d < fim) {
    d = new Date(d.getTime() + 86400000);
    if (d > fim) break;
    const w = d.getDay();
    if (w !== 0 && w !== 6) n++;
  }
  return n;
}

export const aberto = (it) => !['publicado', 'arquivado'].includes(it.fase);

export function situacaoPrazo(it) {
  if (!it.prazo || !aberto(it)) return null;
  const d = diasAte(it.prazo);
  if (d < 0) return { cls: 'late', txt: `Atrasado ${-d} ${-d === 1 ? 'dia' : 'dias'}` };
  if (d <= 3) return { cls: 'warn', txt: d === 0 ? 'Vence hoje' : `Vence em ${d} ${d === 1 ? 'dia' : 'dias'}` };
  return null;
}

export function iniciais(nome) {
  const p = String(nome || '?').replace(/[()]/g, '').split(/\s+/).filter((x) => x.length > 2 || /^[A-Z]/.test(x));
  return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

export function chipInst(inst, txt) {
  const cls = inst === 'INPE' ? 'inpe' : inst === 'ANPPEA' ? 'anppea' : inst === 'CONJUNTA' ? 'conj' : 'ext';
  return `<span class="chip ${cls}">${e(txt ?? siglaDe(inst))}</span>`;
}
export function siglaDe(inst) {
  return { INPE: 'INPE', ANPPEA: 'ANPPEA', CONJUNTA: 'Conjunta', DEA_MMA: 'DEA/MMA', CNPQ: 'CNPq' }[inst] || inst || '—';
}
export function avatar(m, extra = '') {
  if (!m) return `<span class="av x ${extra}" aria-hidden="true">?</span>`;
  const cls = m.instituicao_id === 'INPE' ? 'i' : m.instituicao_id === 'ANPPEA' ? 'a' : 'x';
  return `<span class="av ${cls} ${extra}" title="${e(m.nome)}" aria-hidden="true">${e(iniciais(m.nome))}</span>`;
}
export function logoInst(inst, h = 18) {
  if (inst === 'INPE') return `<img src="${LOGO.INPE}" alt="INPE" style="height:${Math.round(h * 1.3)}px">`;
  if (inst === 'ANPPEA') return `<img src="${LOGO.ANPPEA}" alt="ANPPEA" style="height:${h}px">`;
  return `<b>${e(siglaDe(inst))}</b>`;
}

// ---- permissões (espelham as regras do banco, só para esconder botões) ----
export const podeEditar = (m) => !!m && m.perfil !== 'leitor';
export const ehAdmin = (m) => m?.perfil === 'administracao';
export const coordenaDe = (m, inst) => ehAdmin(m) || (m?.perfil === 'coordenacao' && m.instituicao_id === inst);
export function podeEditarItem(m, it) {
  if (!podeEditar(m)) return false;
  return ehAdmin(m) || it.origem === m.instituicao_id || it.origem === 'CONJUNTA'
    || it.vez_instituicao === m.instituicao_id || (it.envolvidas || []).includes(m.instituicao_id);
}
export const outraParceira = (inst) => (inst === 'INPE' ? 'ANPPEA' : 'INPE');
