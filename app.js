// Inicialização, rotas e despacho de ações.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { criarBackendDemo } from './dados-demo.js';
import * as P from './paginas.js';
import { e, tipoDeMime, duracaoFmt } from './util.js';

const raiz = document.getElementById('app');
const S = {
  api: null, eu: null, d: null, notif: [],
  rota: '', params: {}, filtros: { frente: 'todas', origem: 'todas', q: '', triagem: 'recebidas', equipe: 'todas', notif: 'todas' },
  abaAcesso: 'entrar', ultimoConvite: null,
  pend: {},          // anexos aguardando envio, por alvo ('cm:12', 'novo')
  rec: null,         // gravação de áudio em andamento
  linkAberto: null,  // alvo com a caixa de link aberta
};

function aviso(texto, erro = false) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const t = document.createElement('div');
  t.className = 'toast' + (erro ? ' erro' : '');
  t.setAttribute('role', erro ? 'alert' : 'status');
  t.textContent = texto;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), erro ? 8000 : 4000);
}

async function recarregar() {
  if (!S.eu) { S.d = null; S.notif = []; return; }
  [S.d, S.notif] = await Promise.all([S.api.carregar(), S.api.notificacoes()]);
}

function lerRota() {
  const partes = (location.hash || '#/painel').replace(/^#\/?/, '').split('/');
  const rota = partes[0] || 'painel';
  const params = {};
  if (rota === 'item') { params.id = partes[1]; params.atribuir = partes[2] === 'atribuir'; }
  return { rota, params };
}

// Chave estável de um campo: id; ou formulário + nome (+ valor, em opções)
function chaveCampo(el) {
  if (el.id) return '#' + el.id;
  if (!el.name) return null;
  const f = el.closest('form')?.dataset.form || '';
  const extra = (el.type === 'checkbox' || el.type === 'radio') ? `=${el.value}` : '';
  return `${f}|${el.name}${extra}`;
}
// Guarda o que a pessoa já digitou para não perder ao redesenhar a tela
function lerCampos() {
  const v = {};
  raiz.querySelectorAll('textarea, input, select').forEach((el) => {
    if (el.type === 'file' || el.type === 'password') return;
    const k = chaveCampo(el);
    if (k) v[k] = (el.type === 'checkbox' || el.type === 'radio') ? { c: el.checked } : { v: el.value };
  });
  const abertos = [...raiz.querySelectorAll('details')].map((d) => d.open);
  return { v, abertos };
}
function devolverCampos(g) {
  if (!g) return;
  raiz.querySelectorAll('textarea, input, select').forEach((el) => {
    const x = g.v[chaveCampo(el)];
    if (!x || el.type === 'file' || el.type === 'password') return;
    if ('c' in x) el.checked = x.c; else el.value = x.v;
  });
  raiz.querySelectorAll('details').forEach((d, i) => { if (g.abertos[i]) d.open = true; });
}

let renderizando = false;
let pendente = false;
async function render(opcoes = {}) {
  if (renderizando) { pendente = true; return; }
  renderizando = true;
  try {
    const { rota, params } = lerRota();
    if (!S.eu) {
      if (rota !== 'acesso') location.replace('#/acesso');
      document.title = 'Acesso · Governança MonitoraEA';
      raiz.innerHTML = P.pagAcesso(S);
      window.__appIniciou = true;
      return;
    }
    if (rota === 'acesso') { location.replace('#/painel'); return; }
    if (!S.d) await recarregar();
    const mudouRota = rota !== S.rota || params.id !== S.params.id;
    if (mudouRota) S.linkAberto = null;
    S.rota = rota; S.params = params;
    const paginas = {
      painel: () => P.pagPainel(S),
      quadro: () => P.pagQuadro(S),
      triagem: () => P.pagTriagem(S),
      item: () => P.pagItem(S, params.id),
      novo: () => P.pagNovo(S),
      decisoes: () => P.pagDecisoes(S),
      equipe: () => P.pagEquipe(S),
      notificacoes: () => P.pagNotificacoes(S),
    };
    const titulos = { painel: 'Painel', quadro: 'Quadro', triagem: 'Triagem', item: 'Item', novo: 'Novo registro', decisoes: 'Decisões', equipe: 'Equipe', notificacoes: 'Avisos' };
    const guardados = opcoes.preservar && !mudouRota ? lerCampos() : null;
    const conteudo = await (paginas[rota] || paginas.painel)();
    const y = window.scrollY;
    raiz.innerHTML = P.moldura(S, rota, conteudo);
    window.__appIniciou = true;
    devolverCampos(guardados);
    document.title = `${titulos[rota] || 'Painel'} · Governança MonitoraEA`;
    if (mudouRota) window.scrollTo(0, 0); else window.scrollTo(0, y);
    if (opcoes.foco) document.getElementById(opcoes.foco)?.focus();
    atualizarRelogio();
  } catch (err) {
    console.error(err);
    window.__appIniciou = true;
    raiz.innerHTML = `<div class="carregando">Não foi possível carregar: ${e(err.message)}<br><br><button class="btn" type="button" onclick="location.reload()">Tentar de novo</button></div>`;
  } finally {
    renderizando = false;
    if (pendente) { pendente = false; render({ preservar: true }); }
  }
}

async function executar(fn, preservar) {
  try {
    const r = (await fn()) || {};
    if (r.recarregar) await recarregar();
    await render({ preservar: preservar && !r.recarregar, foco: r.foco });
    if (r.aviso) aviso(r.aviso);
    return r;
  } catch (err) {
    console.error(err);
    aviso(err.message || 'Algo deu errado.', true);
    return null;
  }
}

// ---------------------------------------------------------------- gravação de áudio
function atualizarRelogio() {
  if (!S.rec) return;
  const s = Math.round((Date.now() - S.rec.inicio) / 1000);
  document.querySelectorAll('[data-rec-tempo]').forEach((el) => { el.textContent = duracaoFmt(s); });
}
async function alternarGravacao(alvo) {
  if (S.rec) {
    const mesmo = S.rec.alvo === alvo;
    S.rec.mr.stop();
    if (!mesmo) aviso('Havia outra gravação em andamento; ela foi encerrada.');
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    throw new Error('Este navegador não permite gravar áudio. Grave no celular e anexe o arquivo.');
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    throw new Error('Não foi possível usar o microfone. Verifique a permissão do navegador para este site.');
  }
  const tipo = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
  const mr = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
  const pedacos = [];
  mr.ondataavailable = (ev) => { if (ev.data.size) pedacos.push(ev.data); };
  mr.onstop = () => {
    stream.getTracks().forEach((t) => t.stop());
    clearInterval(S.rec.relogio);
    const duracao = Math.round((Date.now() - S.rec.inicio) / 1000);
    const blob = new Blob(pedacos, { type: mr.mimeType || tipo || 'audio/webm' });
    S.rec = null;
    executar(() => P.receberGravacao(S, alvo, blob, duracao), true);
  };
  S.rec = { alvo, mr, inicio: Date.now(), relogio: setInterval(atualizarRelogio, 500) };
  mr.start();
  // limite de segurança: 10 minutos
  setTimeout(() => { if (S.rec?.mr === mr) mr.stop(); }, 10 * 60 * 1000);
}

// ---------------------------------------------------------------- eventos
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-acao]');
  if (!el) return;
  const acao = el.dataset.acao;
  if (acao === 'gravar') {
    ev.preventDefault();
    alternarGravacao(el.dataset.alvo).then(() => render({ preservar: true })).catch((err) => aviso(err.message, true));
    return;
  }
  if (!P.acoes[acao]) return;
  ev.preventDefault();
  el.disabled = true;
  executar(() => P.acoes[acao](S, el), true).finally(() => { el.disabled = false; });
});

document.addEventListener('change', (ev) => {
  const input = ev.target.closest('input[type=file][data-anexar]');
  if (!input || !input.files.length) return;
  const alvo = input.dataset.anexar;
  const arquivos = [...input.files];
  input.value = '';
  if (alvo.startsWith('item:')) aviso(arquivos.length === 1 ? 'Enviando o arquivo…' : `Enviando ${arquivos.length} arquivos…`);
  executar(() => P.receberArquivos(S, alvo, arquivos, tipoDeMime), true);
});

document.addEventListener('submit', (ev) => {
  const form = ev.target.closest('form[data-form]');
  if (!form || !P.formularios[form.dataset.form]) return;
  ev.preventDefault();
  const fd = new FormData(form);
  const botoes = form.querySelectorAll('button[type=submit]');
  botoes.forEach((b) => { b.disabled = true; });
  const temAnexos = Object.keys(S.pend).some((k) => (S.pend[k] || []).length);
  if (temAnexos && ['comentar', 'novo'].includes(form.dataset.form)) aviso('Enviando…');
  executar(() => P.formularios[form.dataset.form](S, fd, form, ev.submitter), false)
    .finally(() => botoes.forEach((b) => { b.disabled = false; }));
});

window.addEventListener('hashchange', () => render());
window.addEventListener('beforeunload', (ev) => {
  if (S.rec || Object.values(S.pend).some((l) => l && l.length)) { ev.preventDefault(); ev.returnValue = ''; }
});

async function iniciar() {
  try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const { criarBackendSupabase } = await import('./dados-supabase.js');
      S.api = criarBackendSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
      S.api = criarBackendDemo();
    }
    S.eu = await S.api.sessao();
    if (S.eu) {
      await recarregar();
      S.api.assinar(async () => { S.notif = await S.api.notificacoes(); render({ preservar: true }); });
    }
  } catch (err) {
    console.error(err);
    window.__appIniciou = true;
    raiz.innerHTML = `<div class="carregando">Não foi possível iniciar a plataforma: ${e(err.message)}</div>`;
    return;
  }
  render();
}

iniciar();
