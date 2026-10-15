// Inicialização, rotas e despacho de ações.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { criarBackendDemo } from './dados-demo.js';
import * as P from './paginas.js';
import { e } from './util.js';

const raiz = document.getElementById('app');
const S = {
  api: null, eu: null, d: null, notif: [],
  rota: '', params: {}, filtros: { frente: 'todas', origem: 'todas' },
  abaAcesso: 'entrar', ultimoConvite: null,
};

function aviso(texto, erro = false) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const t = document.createElement('div');
  t.className = 'toast' + (erro ? ' erro' : '');
  t.setAttribute('role', erro ? 'alert' : 'status');
  t.textContent = texto;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), erro ? 7000 : 4000);
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

let renderizando = false;
let pendente = false;
async function render() {
  if (renderizando) { pendente = true; return; }
  renderizando = true;
  try {
    const { rota, params } = lerRota();
    if (!S.eu) {
      if (rota !== 'acesso') { location.replace('#/acesso'); }
      document.title = 'Acesso · Governança MonitoraEA';
      raiz.innerHTML = P.pagAcesso(S);
      return;
    }
    if (rota === 'acesso') { location.replace('#/painel'); return; }
    if (!S.d) await recarregar();
    const mudouRota = rota !== S.rota || params.id !== S.params.id;
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
    const titulos = { painel: 'Painel', quadro: 'Quadro', triagem: 'Triagem', item: 'Item', novo: 'Novo registro', decisoes: 'Decisões', equipe: 'Equipe', notificacoes: 'Notificações' };
    const conteudo = await (paginas[rota] || paginas.painel)();
    const y = window.scrollY;
    raiz.innerHTML = P.moldura(S, rota, conteudo);
    document.title = `${titulos[rota] || 'Painel'} · Governança MonitoraEA`;
    if (mudouRota) window.scrollTo(0, 0); else window.scrollTo(0, y);
  } catch (err) {
    console.error(err);
    raiz.innerHTML = `<div class="carregando">Não foi possível carregar: ${e(err.message)}<br><br><button class="btn" type="button" onclick="location.reload()">Tentar de novo</button></div>`;
  } finally {
    renderizando = false;
    if (pendente) { pendente = false; render(); }
  }
}

async function executar(fn) {
  try {
    const r = (await fn()) || {};
    if (r.recarregar) await recarregar();
    await render();
    if (r.aviso) aviso(r.aviso);
    return r;
  } catch (err) {
    console.error(err);
    aviso(err.message || 'Algo deu errado.', true);
    return null;
  }
}

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-acao]');
  if (!el || !P.acoes[el.dataset.acao]) return;
  ev.preventDefault();
  el.disabled = true;
  executar(() => P.acoes[el.dataset.acao](S, el)).finally(() => { el.disabled = false; });
});

document.addEventListener('submit', (ev) => {
  const form = ev.target.closest('form[data-form]');
  if (!form || !P.formularios[form.dataset.form]) return;
  ev.preventDefault();
  const fd = new FormData(form);
  const botoes = form.querySelectorAll('button[type=submit]');
  botoes.forEach((b) => { b.disabled = true; });
  executar(() => P.formularios[form.dataset.form](S, fd, form, ev.submitter))
    .then((r) => { if (r?.limpar && form.isConnected) form.reset(); })
    .finally(() => botoes.forEach((b) => { b.disabled = false; }));
});

window.addEventListener('hashchange', render);

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
      S.api.assinar(async () => { S.notif = await S.api.notificacoes(); render(); });
    }
  } catch (err) {
    console.error(err);
    raiz.innerHTML = `<div class="carregando">Não foi possível iniciar a plataforma: ${e(err.message)}</div>`;
    return;
  }
  render();
}

iniciar();
