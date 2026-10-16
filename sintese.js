// Síntese: o MonitoraEA em um olhar (dashboard calculado a partir dos itens).
import { e, FRENTES, FASE, hojeISO, dataCurta, aberto } from './util.js?v=20261016e';

// Cores dos gráficos (validadas para daltonismo; o amarelo da ANPPEA ganha um tom mais escuro para marcas finas)
const COR = { INPE: '#0077B8', ANPPEA: '#D8920C', CONJUNTA: '#7A5FB8', OUTRA: '#8A97A8' };
const NOME = { INPE: 'INPE', ANPPEA: 'ANPPEA', CONJUNTA: 'Conjunta', OUTRA: 'Outras' };
const ST = { ok: '#1E7A43', warn: '#9A5F00', late: '#B42323' };
const RAMPA = ['#D6E4F5', '#9DBBE3', '#5E8FD0', '#2C63AE', '#0B3570'];
const FASES_ABERTAS = [['triagem', 'Triagem'], ['priorizado', 'Priorizado'], ['andamento', 'Em andamento'], ['validacao', 'Em validação'], ['decisao', 'Decisão']];
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIA = 86400000;

const t = (iso) => (iso ? new Date(iso.length <= 10 ? iso + 'T12:00:00' : iso).getTime() : null);
const origemDe = (x) => (['INPE', 'ANPPEA', 'CONJUNTA'].includes(x.origem) ? x.origem : 'OUTRA');
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const diaMes = (ms) => { const d = new Date(ms); return `${d.getDate()}/${d.getMonth() + 1}`; };

function icone(k, c, tam = 13) {
  if (k === 'ok') return `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg>`;
  if (k === 'warn') return `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 3 2.5 20h19z"></path><path d="M12 10v4.5"></path><path d="M12 17.5v.2"></path></svg>`;
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7.5v5.5"></path><path d="M12 16.5v.2"></path></svg>`;
}
const SELO = { ok: 'No ritmo', warn: 'Atenção', late: 'Crítico' };
const selo = (k, txt = SELO[k]) => `<span class="sx-badge" style="color:${ST[k]}">${icone(k, ST[k])}${e(txt)}</span>`;

// ------------------------------------------------------------------ cálculos
// Estado de cada item num instante (aproximação a partir das datas guardadas)
function abertoEm(x, ms) {
  if (t(x.criado_em) > ms) return false;
  const fim = x.concluido_em ? t(x.concluido_em) : (x.fase === 'arquivado' ? t(x.atualizado_em) : null);
  return fim === null || fim > ms;
}
const entregue = (x) => x.fase === 'publicado' && x.concluido_em;

function calcular(S, dias) {
  const agora = Date.now();
  const hoje = t(hojeISO());
  const itens = S.d.itens;
  const abertos = itens.filter(aberto);
  const atrasado = (x) => aberto(x) && x.prazo && t(x.prazo) < hoje;
  const ini = agora - dias * DIA;
  const entregues = itens.filter((x) => entregue(x) && t(x.concluido_em) > ini);
  const entreguesAntes = itens.filter((x) => entregue(x) && t(x.concluido_em) > ini - dias * DIA && t(x.concluido_em) <= ini);
  const abertosAntes = itens.filter((x) => abertoEm(x, ini)).length;

  // série de 8 pontos ao longo do período, para as minilinhas
  const pontos = Array.from({ length: 8 }, (_, i) => agora - (7 - i) * (dias / 7) * DIA);
  const serie = {
    abertos: pontos.map((ms) => itens.filter((x) => abertoEm(x, ms)).length),
    entregues: pontos.map((ms) => itens.filter((x) => entregue(x) && t(x.concluido_em) <= ms && t(x.concluido_em) > ms - dias * DIA).length),
    atrasados: pontos.map((ms) => itens.filter((x) => abertoEm(x, ms) && x.prazo && t(x.prazo) < ms).length),
    triagem: pontos.map((ms) => S.d.atribuicoes.filter((a) => t(a.criado_em) <= ms && (!a.respondido_em || t(a.respondido_em) > ms)).length),
  };

  // triagem: pendentes e tempo médio de resposta (dias úteis)
  const pendentes = S.d.atribuicoes.filter((a) => ['aguardando', 'contraproposta'].includes(a.situacao));
  const respondidas = S.d.atribuicoes.filter((a) => a.respondido_em && t(a.respondido_em) > agora - Math.max(dias, 30) * DIA);
  const uteis = (a, b) => { let n = 0; for (let d = a + DIA; d <= b; d += DIA) { const w = new Date(d).getDay(); if (w && w !== 6) n++; } return n; };
  const mediaResp = respondidas.length ? respondidas.reduce((s, a) => s + uteis(t(a.criado_em), t(a.respondido_em)), 0) / respondidas.length : null;

  return { agora, hoje, abertos, atrasado, entregues, entreguesAntes, abertosAntes, serie, pendentes, mediaResp, dias };
}

// ------------------------------------------------------------------ peças
function minilinha(vals, cor = '#0B3570') {
  const w = 96, h = 30, mx = Math.max(...vals, 1), n = vals.length;
  const pts = vals.map((v, i) => [2 + (i * (w - 4)) / (n - 1), h - 3 - (v / mx) * (h - 8)]);
  const [x, y] = pts[n - 1];
  return `<svg class="sx-spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="M${pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L')}" fill="none" stroke="${cor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${cor}" stroke="#fff" stroke-width="2"></circle></svg>`;
}
const legenda = (chaves) => `<div class="sx-lg">${chaves.map((k) => `<span><i style="background:${COR[k]}"></i>${NOME[k]}</span>`).join('')}</div>`;
const vazio = (txt) => `<p class="vazio" style="padding:24px 0">${e(txt)}</p>`;

function blocoKpis(c) {
  const dEnt = c.entregues.length - c.entreguesAntes.length;
  const dAb = c.abertos.length - c.abertosAntes;
  const per = c.dias === 7 ? '7 dias' : c.dias === 30 ? '30 dias' : 'no trimestre';
  const nAtr = c.abertos.filter(c.atrasado).length;
  return `<div class="sx-kpis">
    <div class="card sx-tile"><span class="k">Em aberto</span><span class="v">${c.abertos.length}</span><span class="d">${dAb === 0 ? 'estável' : `${dAb > 0 ? '+' : ''}${dAb} em ${per}`}</span>${minilinha(c.serie.abertos)}</div>
    <div class="card sx-tile"><span class="k">Entregues em ${per}</span><span class="v">${c.entregues.length}</span><span class="d"${dEnt > 0 ? ` style="color:${ST.ok}"` : ''}>${dEnt === 0 ? 'igual ao período anterior' : `${Math.abs(dEnt)} ${dEnt > 0 ? 'a mais' : 'a menos'} que o período anterior`}</span>${minilinha(c.serie.entregues)}</div>
    <div class="card sx-tile"><span class="k">Atrasados</span><span class="v"${nAtr ? ` style="color:${ST.late}"` : ''}>${nAtr}</span><span class="d">${nAtr ? selo('late', 'com prazo vencido') : selo('ok', 'nenhum prazo vencido')}</span>${minilinha(c.serie.atrasados, nAtr ? ST.late : '#0B3570')}</div>
    <div class="card sx-tile"><span class="k">Triagem entre instituições</span><span class="v">${c.pendentes.length}</span><span class="d">${c.mediaResp === null ? 'sem respostas recentes' : `resposta média ${c.mediaResp.toFixed(1).replace('.', ',')} dias úteis`}<br>meta: 5 dias</span>${minilinha(c.serie.triagem)}</div>
  </div>`;
}

function blocoFluxo(c) {
  const col = FASES_ABERTAS.map(([f, nome]) => {
    const d = {};
    c.abertos.filter((x) => x.fase === f).forEach((x) => { const o = origemDe(x); d[o] = (d[o] || 0) + 1; });
    return [nome, d];
  });
  const ent = {};
  c.entregues.forEach((x) => { const o = origemDe(x); ent[o] = (ent[o] || 0) + 1; });
  col.push([`Entregues (${c.dias === 90 ? 'trimestre' : `${c.dias} d`})`, ent]);
  const ordem = ['INPE', 'ANPPEA', 'CONJUNTA', 'OUTRA'];
  const total = (d) => Object.values(d).reduce((a, b) => a + b, 0);
  const mx = Math.max(2, ...col.map(([, d]) => total(d)));
  const passo = mx <= 6 ? 1 : mx <= 12 ? 2 : mx <= 30 ? 5 : 10;
  const topo = Math.ceil(mx / passo) * passo;
  const W = 640, base = 205, cima = 34, bw = 58, st = (W - 40) / col.length;
  const g = [`<svg viewBox="0 0 ${W} 250" width="100%" role="img" aria-label="Itens abertos por fase e origem">`];
  for (let v = 0; v <= topo; v += passo) {
    const y = base - (v / topo) * (base - cima);
    g.push(`<line x1="30" x2="${W}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#EEF2F6"></line><text x="22" y="${(y + 4).toFixed(1)}" font-size="11" fill="#8792A2" text-anchor="end">${v}</text>`);
  }
  col.forEach(([nome, d], i) => {
    const x = 40 + i * st + (st - bw) / 2;
    let y = base;
    if (i === col.length - 1) g.push(`<line x1="${(40 + i * st - 2).toFixed(1)}" x2="${(40 + i * st - 2).toFixed(1)}" y1="${cima - 10}" y2="${base + 4}" stroke="#C9D2DD" stroke-dasharray="3 4"></line>`);
    const segs = ordem.filter((o) => d[o]);
    segs.forEach((o, j) => {
      const h = (d[o] / topo) * (base - cima);
      y -= h;
      const ultimo = j === segs.length - 1;
      const hh = ultimo ? h : h - 2;
      const tip = `<title>${e(nome)}: ${d[o]} ${NOME[o]}</title>`;
      if (ultimo && h > 5) {
        g.push(`<path class="sx-hov" d="M${x.toFixed(1)} ${(y + hh).toFixed(1)} V${(y + 4).toFixed(1)} Q${x.toFixed(1)} ${y.toFixed(1)} ${(x + 4).toFixed(1)} ${y.toFixed(1)} H${(x + bw - 4).toFixed(1)} Q${(x + bw).toFixed(1)} ${y.toFixed(1)} ${(x + bw).toFixed(1)} ${(y + 4).toFixed(1)} V${(y + hh).toFixed(1)} Z" fill="${COR[o]}">${tip}</path>`);
      } else {
        g.push(`<rect class="sx-hov" x="${x.toFixed(1)}" y="${(j ? y + 2 : y).toFixed(1)}" width="${bw}" height="${Math.max(hh, 1).toFixed(1)}" fill="${COR[o]}">${tip}</rect>`);
      }
    });
    g.push(`<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 8).toFixed(1)}" font-size="14" font-weight="600" fill="#10213A" text-anchor="middle">${total(d)}</text>`);
    g.push(`<text x="${(x + bw / 2).toFixed(1)}" y="${base + 20}" font-size="12" fill="#5B6678" text-anchor="middle">${e(nome)}</text>`);
  });
  g.push(`<line x1="30" x2="${W}" y1="${base}" y2="${base}" stroke="#C9D2DD"></line></svg>`);
  const usadas = ordem.filter((o) => col.some(([, d]) => d[o]));
  return `<section class="card sx-box sx-fluxo"><div class="sx-cab"><div><h2>Onde está o trabalho</h2><p class="s">Itens abertos por fase, e entregas do período</p></div>${legenda(usadas.length ? usadas : ['INPE', 'ANPPEA', 'CONJUNTA'])}</div>
    <a href="#/quadro" class="sx-link" aria-label="Abrir o quadro">${g.join('')}</a></section>`;
}

function blocoOrigem(c) {
  const conta = {};
  c.abertos.forEach((x) => { const o = origemDe(x); conta[o] = (conta[o] || 0) + 1; });
  const vals = ['INPE', 'ANPPEA', 'CONJUNTA', 'OUTRA'].filter((o) => conta[o]).map((o) => [o, conta[o]]);
  const tot = c.abertos.length;
  const R = 62, C = 2 * Math.PI * R;
  let off = 0;
  const arcos = vals.map(([o, v]) => {
    const L = Math.max(C * v / tot - (vals.length > 1 ? 3 : 0), 1);
    const s = `<circle class="sx-hov" r="${R}" fill="none" stroke="${COR[o]}" stroke-width="20" stroke-dasharray="${L.toFixed(1)} ${(C - L).toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}"><title>${NOME[o]}: ${v}</title></circle>`;
    off += C * v / tot;
    return s;
  }).join('');
  const rosca = `<svg viewBox="0 0 200 170" width="190" height="162" role="img" aria-label="Origem dos itens em aberto: ${vals.map(([o, v]) => `${NOME[o]} ${v}`).join(', ')}"><g transform="translate(100 85) rotate(-90)">${tot ? arcos : `<circle r="${R}" fill="none" stroke="#EEF2F6" stroke-width="20"></circle>`}</g><text x="100" y="88" font-size="30" font-weight="600" fill="#0B3570" text-anchor="middle">${tot}</text><text x="100" y="108" font-size="11" fill="#5B6678" text-anchor="middle">em aberto</text></svg>`;
  const lista = vals.map(([o, v]) => `<div class="sx-li"><i style="background:${COR[o]}"></i>${NOME[o]}<b>${v}</b></div>`).join('');
  const vez = {};
  c.abertos.forEach((x) => { const k = ['INPE', 'ANPPEA'].includes(x.vez_instituicao) ? x.vez_instituicao : 'OUTRA'; vez[k] = (vez[k] || 0) + 1; });
  const barras = ['INPE', 'ANPPEA', 'OUTRA'].filter((k) => vez[k]).map((k) => `<div style="flex:${vez[k]};background:${COR[k]};${k === 'ANPPEA' ? 'color:#2A1A00;' : ''}" title="${NOME[k]}: ${vez[k]}">${vez[k] / tot > 0.18 ? `${NOME[k]} ${vez[k]}` : vez[k]}</div>`).join('');
  return `<section class="card sx-box"><h2>Quem originou</h2><p class="s">Itens em aberto por instituição</p>
    <div class="sx-rosca">${rosca}<div class="sx-lista">${lista || '<span class="muted sm">Nenhum item em aberto.</span>'}</div></div>
    ${tot ? `<div class="sx-vez"><p class="xs muted">Com quem está a próxima ação</p><div class="sx-vezbar">${barras}</div></div>` : ''}</section>`;
}

function blocoFrentes(c) {
  const hoje = c.hoje;
  const linhas = FRENTES.map(([k, nome]) => {
    const its = c.abertos.filter((x) => x.frente === k);
    if (!its.length) return null;
    const atr = its.filter(c.atrasado).length;
    const vence = its.filter((x) => x.prazo && t(x.prazo) >= hoje && t(x.prazo) - hoje <= 7 * DIA).length;
    const semDono = its.filter((x) => x.fase !== 'triagem' && !x.responsavel_id).length;
    const sit = atr ? 'late' : (vence || semDono) ? 'warn' : 'ok';
    const obs = atr ? plural(atr, 'atrasado', 'atrasados') : vence ? `${vence} ${vence === 1 ? 'vence' : 'vencem'} em até 7 dias` : semDono ? plural(semDono, 'sem responsável', 'sem responsável') : '';
    const prox = its.filter((x) => x.prazo && t(x.prazo) >= hoje).sort((a, b) => a.prazo.localeCompare(b.prazo))[0];
    const dist = FASES_ABERTAS.map(([f]) => its.filter((x) => x.fase === f).length);
    return { k, nome, n: its.length, sit, obs, prox, dist, peso: { late: 0, warn: 1, ok: 2 }[sit] };
  }).filter(Boolean).sort((a, b) => a.peso - b.peso || b.n - a.n);
  const tiles = linhas.map((l) => `<a class="card sx-ft" href="#/quadro" data-acao="filtro-frente" data-valor="${l.k}" style="border-top-color:${ST[l.sit]}">
      <span class="t">${e(l.nome)}</span>
      <div class="sx-ftn"><span class="n">${l.n}</span><span class="xs muted">${l.n === 1 ? 'item' : 'itens'}</span><span style="margin-left:auto">${selo(l.sit)}</span></div>
      <div class="sx-dist">${l.dist.map((v, i) => (v ? `<span title="${FASES_ABERTAS[i][1]}: ${v}" style="flex:${v};background:${RAMPA[i]}"></span>` : '')).join('')}</div>
      <span class="xs muted">${l.obs ? `${e(l.obs)} · ` : ''}${l.prox ? `próx. marco ${dataCurta(l.prox.prazo)}` : 'sem prazo marcado'}</span></a>`).join('');
  const leg = `<div class="sx-lg">${FASES_ABERTAS.map(([, n], i) => `<span><i style="background:${RAMPA[i]}"></i>${n}</span>`).join('')}</div>`;
  return `<section class="card sx-box"><div class="sx-cab"><div><h2>Saúde das frentes</h2><p class="s">Situação de cada frente e em que fase estão os seus itens</p></div>${leg}</div>
    ${tiles ? `<div class="sx-fts">${tiles}</div>` : vazio('Nenhum item em aberto.')}</section>`;
}

function blocoLinha(S, c) {
  const hoje = c.hoje;
  const d0 = hoje - 11 * DIA, d1 = hoje + 52 * DIA;
  let base = c.abertos.filter((x) => x.destaque);
  const comDestaque = base.length > 0;
  const prioridade = (x) => (c.atrasado(x) ? 0 : x.prioridade === 'alta' ? 1 : 2);
  if (!comDestaque) base = c.abertos.filter((x) => x.prazo && (x.prioridade === 'alta' || c.atrasado(x) || t(x.prazo) <= d1));
  const its = base.filter((x) => x.prazo && t(x.prazo) >= d0 - 30 * DIA && t(x.prazo) <= d1)
    .sort((a, b) => prioridade(a) - prioridade(b) || a.prazo.localeCompare(b.prazo)).slice(0, 10)
    .sort((a, b) => a.prazo.localeCompare(b.prazo));
  const sub = comDestaque ? 'Itens marcados como destaque (★), com prazo nas próximas semanas'
    : 'Atrasados, de prioridade alta e com prazo próximo. Marque itens com ★ na ficha para escolher quais aparecem aqui';
  if (!its.length) return `<section class="card sx-box"><h2>Linha do tempo</h2><p class="s">${e(sub)}</p>${vazio('Nenhum item com prazo nas próximas semanas.')}</section>`;
  const LW = 250, W = 1080, GW = W - LW - 40;
  const X = (ms) => LW + ((ms - d0) / (d1 - d0)) * GW;
  const rh = 34, topo = 46, H = topo + rh * its.length + 12;
  const s = [`<svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:760px" role="img" aria-label="Linha do tempo de ${its.length} itens">`];
  for (let w = d0; w <= d1; w += 7 * DIA) {
    const x = X(w), d = new Date(w);
    s.push(`<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="30" y2="${H - 6}" stroke="#EEF2F6"></line><text x="${(x + 4).toFixed(1)}" y="22" font-size="11" fill="#8792A2">${d.getDate()} ${MES[d.getMonth()]}</text>`);
  }
  its.forEach((x, i) => {
    const y = topo + i * rh;
    const o = origemDe(x);
    const lim = x.destaque ? 31 : 34;
    const nome = x.titulo.length > lim ? x.titulo.slice(0, lim - 1).trimEnd() + '…' : x.titulo;
    s.push(`<a href="#/item/${x.id}"><text x="0" y="${y + 16}" font-size="12.5" fill="#10213A">${x.destaque ? '<tspan fill="#C98A00">★ </tspan>' : ''}${e(nome)}<title>${e(x.titulo)}</title></text></a>`);
    const xa = Math.max(X(t(x.criado_em)), LW), xb = Math.min(Math.max(X(t(x.prazo)), LW + 6), LW + GW);
    s.push(`<a href="#/item/${x.id}"><rect class="sx-hov" x="${xa.toFixed(1)}" y="${y + 4}" width="${Math.max(xb - xa, 6).toFixed(1)}" height="16" rx="4" fill="${COR[o]}"><title>${e(x.titulo)} · ${NOME[o]} · ${FASE[x.fase]} · prazo ${dataCurta(x.prazo)}</title></rect></a>`);
    if (X(t(x.criado_em)) < LW) s.push(`<path d="M${LW - 2} ${y + 12} l7 -6 v12z" fill="#fff" opacity=".9"></path>`);
    if (c.atrasado(x)) {
      const dd = Math.round((hoje - t(x.prazo)) / DIA);
      s.push(`<line x1="${xb.toFixed(1)}" x2="${X(hoje).toFixed(1)}" y1="${y + 12}" y2="${y + 12}" stroke="${ST.late}" stroke-width="2" stroke-dasharray="3 3"></line><text x="${(X(hoje) + 8).toFixed(1)}" y="${y + 16}" font-size="11.5" font-weight="600" fill="${ST.late}">${plural(dd, 'dia', 'dias')} de atraso</text>`);
    } else {
      s.push(`<text x="${(xb + 6).toFixed(1)}" y="${y + 16}" font-size="11" fill="#5B6678">${diaMes(t(x.prazo))}</text>`);
    }
  });
  // reuniões com decisões em pauta
  const reunioes = [...new Set(S.d.decisoes.filter((d) => d.situacao === 'em_pauta' && d.data_pauta && t(d.data_pauta) >= d0 && t(d.data_pauta) <= d1).map((d) => d.data_pauta))];
  reunioes.forEach((dp) => {
    const xc = X(t(dp));
    s.push(`<path d="M${xc.toFixed(1)} 28 l6 6 -6 6 -6 -6z" fill="#0B3570"><title>Reunião com decisões em pauta, ${diaMes(t(dp))}</title></path><text x="${(xc + 10).toFixed(1)}" y="38" font-size="11" font-weight="600" fill="#0B3570">Pauta ${diaMes(t(dp))}</text>`);
  });
  const xh = X(hoje);
  s.push(`<line x1="${xh.toFixed(1)}" x2="${xh.toFixed(1)}" y1="26" y2="${H - 4}" stroke="#0B3570" stroke-width="2"></line><rect x="${(xh - 20).toFixed(1)}" y="${H - 20}" width="40" height="16" rx="8" fill="#0B3570"></rect><text x="${xh.toFixed(1)}" y="${H - 8}" font-size="10.5" font-weight="600" fill="#fff" text-anchor="middle">hoje</text></svg>`);
  const usadas = ['INPE', 'ANPPEA', 'CONJUNTA', 'OUTRA'].filter((o) => its.some((x) => origemDe(x) === o));
  return `<section class="card sx-box"><div class="sx-cab"><div><h2>Linha do tempo${comDestaque ? ' dos destaques' : ''}</h2><p class="s">${e(sub)}</p></div>${legenda(usadas)}</div>
    <div class="sx-rolar">${s.join('')}</div></section>`;
}

function blocoRitmo(S, c) {
  const semanas = 10;
  const fim = c.agora;
  const vals = Array.from({ length: semanas }, (_, i) => {
    const b = fim - (semanas - 1 - i) * 7 * DIA, a = b - 7 * DIA;
    return S.d.itens.filter((x) => entregue(x) && t(x.concluido_em) > a && t(x.concluido_em) <= b).length;
  });
  const recentes = Math.max(1, Math.round(c.dias / 7));
  const mx = Math.max(3, ...vals);
  const W = 380, base = 135, bw = 22, st = (W - 30) / semanas;
  const g = [`<svg viewBox="0 0 ${W} 170" width="100%" role="img" aria-label="Entregas por semana nas últimas ${semanas} semanas: ${vals.join(', ')}">`];
  (mx <= 5 ? Array.from({ length: mx + 1 }, (_, i) => i) : [0, Math.round(mx / 2), mx]).forEach((v) => {
    const y = base - (v / mx) * (base - 20);
    g.push(`<line x1="22" x2="${W}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#EEF2F6"></line><text x="14" y="${(y + 4).toFixed(1)}" font-size="10.5" fill="#8792A2" text-anchor="end">${v}</text>`);
  });
  vals.forEach((v, i) => {
    if (!v) return;
    const x = 30 + i * st + (st - bw) / 2, h = (v / mx) * (base - 20);
    g.push(`<path class="sx-hov" d="M${x.toFixed(1)} ${base} V${(base - h + 4).toFixed(1)} Q${x.toFixed(1)} ${(base - h).toFixed(1)} ${(x + 4).toFixed(1)} ${(base - h).toFixed(1)} H${(x + bw - 4).toFixed(1)} Q${(x + bw).toFixed(1)} ${(base - h).toFixed(1)} ${(x + bw).toFixed(1)} ${(base - h + 4).toFixed(1)} V${base} Z" fill="${i >= semanas - recentes ? '#0B3570' : '#9DBBE3'}"><title>${semanas - 1 - i === 0 ? 'Esta semana' : `Há ${semanas - 1 - i} ${semanas - 1 - i === 1 ? 'semana' : 'semanas'}`}: ${plural(v, 'entrega', 'entregas')}</title></path>`);
  });
  g.push(`<line x1="22" x2="${W}" y1="${base}" y2="${base}" stroke="#C9D2DD"></line><text x="30" y="${base + 20}" font-size="11" fill="#8792A2">${semanas} semanas atrás</text><text x="${W}" y="${base + 20}" font-size="11" fill="#8792A2" text-anchor="end">esta semana</text></svg>`);
  return `<section class="card sx-box"><h2>Ritmo de entregas</h2><p class="s">Itens publicados por semana · em destaque, o período escolhido</p>${g.join('')}</section>`;
}

function blocoAtencao(c) {
  const hoje = c.hoje;
  const lst = [];
  c.abertos.filter(c.atrasado).sort((a, b) => a.prazo.localeCompare(b.prazo)).forEach((x) => {
    const d = Math.round((hoje - t(x.prazo)) / DIA);
    lst.push(['late', x, `atrasado há ${plural(d, 'dia', 'dias')}${x.fase === 'decisao' ? ' · aguarda decisão' : ''}`]);
  });
  c.abertos.filter((x) => x.prazo && t(x.prazo) >= hoje && t(x.prazo) - hoje <= 3 * DIA).forEach((x) => {
    const d = Math.round((t(x.prazo) - hoje) / DIA);
    lst.push(['warn', x, d === 0 ? 'vence hoje' : d === 1 ? 'vence amanhã' : `vence em ${d} dias`]);
  });
  c.abertos.filter((x) => x.fase !== 'triagem' && !x.responsavel_id).forEach((x) => lst.push(['warn', x, 'sem responsável']));
  c.abertos.filter((x) => c.agora - t(x.atualizado_em) > 15 * DIA).forEach((x) => lst.push(['warn', x, `sem movimento há ${Math.round((c.agora - t(x.atualizado_em)) / DIA)} dias`]));
  const vistos = new Set();
  const unicos = lst.filter(([, x]) => (vistos.has(x.id) ? false : vistos.add(x.id)));
  const mostra = unicos.slice(0, 6);
  return `<section class="card sx-box"><h2>Pede atenção</h2><p class="s">${unicos.length ? plural(unicos.length, 'item', 'itens') : 'Nada fora do ritmo'}</p>
    ${mostra.map(([k, x, o]) => `<div class="sx-at"><span>${icone(k, ST[k])}</span><div class="sm"><a href="#/item/${x.id}">${e(x.titulo)}</a><div class="xs muted">${e(o)}</div></div></div>`).join('') || `<div class="sx-at"><span>${icone('ok', ST.ok)}</span><div class="sm">Nenhum atraso, prazo apertado ou item parado.</div></div>`}
    ${unicos.length > mostra.length ? `<p class="xs" style="padding-top:8px"><a href="#/quadro">+ ${unicos.length - mostra.length} no quadro</a></p>` : ''}</section>`;
}

function blocoPauta(S) {
  const em = S.d.decisoes.filter((d) => d.situacao === 'em_pauta').sort((a, b) => (a.data_pauta || '9').localeCompare(b.data_pauta || '9'));
  const prox = em[0]?.data_pauta;
  const ok = (sim, i) => selo(sim ? 'ok' : 'warn', `${i} ${sim ? 'de acordo' : 'pendente'}`);
  return `<section class="card sx-box"><h2>Pauta de decisões${prox ? ` · ${diaMes(t(prox))}` : ''}</h2><p class="s">${em.length ? `${plural(em.length, 'decisão aguardando', 'decisões aguardando')} as duas coordenações` : 'Nenhuma decisão em pauta'}</p>
    ${em.slice(0, 4).map((d) => `<div class="sx-pt"><a href="#/decisoes">${e(d.titulo)}</a><div class="sx-oks">${ok(d.ok_inpe, 'INPE')}${ok(d.ok_anppea, 'ANPPEA')}</div></div>`).join('')}
    ${em.length > 4 ? `<p class="xs" style="padding-top:8px"><a href="#/decisoes">+ ${em.length - 4} na pauta</a></p>` : ''}</section>`;
}

// ------------------------------------------------------------------ página
export function pagSintese(S) {
  const dias = Number(S.filtros.sintese || 30);
  const c = calcular(S, dias);
  const agora = new Date();
  return `<main class="page sx">
    <div class="ph"><div class="txt"><h1>Síntese</h1><p class="sub">O MonitoraEA em um olhar · ${agora.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}, ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p></div>
      <div class="acoes-ph sx-noprint">
        <div class="seg" role="group" aria-label="Período">${[[7, '7 dias'], [30, '30 dias'], [90, 'Trimestre']].map(([v, n]) => `<button type="button" class="${dias === v ? 'on' : ''}" aria-pressed="${dias === v}" data-acao="filtro" data-chave="sintese" data-valor="${v}">${n}</button>`).join('')}</div>
        <button type="button" class="btn" data-acao="imprimir">Imprimir ou salvar PDF</button>
      </div></div>
    ${blocoKpis(c)}
    <div class="sx-l2">${blocoFluxo(c)}${blocoOrigem(c)}</div>
    ${blocoFrentes(c)}
    ${blocoLinha(S, c)}
    <div class="sx-l3">${blocoRitmo(S, c)}${blocoAtencao(c)}${blocoPauta(S)}</div>
  </main>`;
}

