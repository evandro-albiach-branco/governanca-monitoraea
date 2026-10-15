// Páginas da plataforma. Cada página devolve HTML; as ações ficam em
// `acoes` (cliques em [data-acao]) e `formularios` (envios de form[data-form]).
import {
  e, FASES, FASE, FRENTES, FRENTE, TIPO, PRIORIDADE, PERFIL, SIT_ATRIB, PARCEIRAS, LOGO,
  hojeISO, somarDias, dataCurta, dataLonga, quando, diasAte, diasUteisDesde, aberto, situacaoPrazo,
  chipInst, siglaDe, avatar, podeEditar, ehAdmin, coordenaDe, podeEditarItem, outraParceira,
} from './util.js';

// ------------------------------------------------------------------ apoio
const membro = (S, id) => S.d.membros.find((m) => m.id === id);
const item = (S, id) => S.d.itens.find((i) => i.id === Number(id));
const nomeDe = (S, id) => membro(S, id)?.nome || '—';
const ativos = (S, inst) => S.d.membros.filter((m) => m.ativo && (!inst || m.instituicao_id === inst));
const souParceira = (S) => PARCEIRAS.includes(S.eu.instituicao_id);
const atribAberta = (S, itemId) => S.d.atribuicoes.find((a) => a.item_id === itemId && ['aguardando', 'contraproposta'].includes(a.situacao));

function podeAtribuir(S, it) {
  return souParceira(S) && podeEditar(S.eu) && aberto(it) && !atribAberta(S, it.id)
    && (it.origem === S.eu.instituicao_id || it.origem === 'CONJUNTA' || it.vez_instituicao === S.eu.instituicao_id);
}

function parceiras() {
  return `<div class="parceiras">
    <div class="p-inpe"><img src="${LOGO.INPE}" alt="INPE"></div>
    <div class="p-anppea"><img src="${LOGO.ANPPEA}" alt="ANPPEA"></div>
  </div>`;
}
function hero({ kick = '', titulo, sub = '', extra = '', migalha = '', lado = parceiras() }) {
  return `<section class="hero"><div class="wrap">
    <div class="txt">
      ${migalha ? `<div class="migalha">${migalha}</div>` : ''}
      ${kick ? `<span class="kick">${e(kick)}</span>` : ''}
      <h1>${titulo}</h1>
      ${sub ? `<p>${sub}</p>` : ''}
      ${extra ? `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px">${extra}</div>` : ''}
    </div>
    ${lado}
  </div></section>`;
}
const secao = (t, extra = '') => `<div class="sh"><h2>${e(t)}</h2>${extra ? `<div class="extra">${extra}</div>` : ''}</div>`;
const opcoes = (pares, sel) => pares.map(([v, t]) => `<option value="${e(v)}"${v === sel ? ' selected' : ''}>${e(t)}</option>`).join('');

function chipPrazo(it) {
  const s = situacaoPrazo(it);
  return s ? `<span class="chip ${s.cls}">${e(s.txt)}</span>` : '';
}
function logosOrigem(origem) {
  const l = (inst) => `<span class="lg${inst === 'INPE' ? ' inpe' : ''}"><img src="${LOGO[inst]}" alt="${inst}"></span>`;
  return origem === 'CONJUNTA' ? l('INPE') + l('ANPPEA') : l(origem);
}
function proximaAcao(S, it) {
  const quem = it.vez_membro_id ? ` ${e(nomeDe(S, it.vez_membro_id))}` : '';
  return `${chipInst(it.vez_instituicao)}${quem}${it.vez_nota ? ` <span class="muted">· ${e(it.vez_nota)}</span>` : ''}`;
}

// ------------------------------------------------------------------ moldura
export function moldura(S, rota, conteudo) {
  const inst = S.eu.instituicao_id;
  const nTriagem = S.d.atribuicoes.filter((a) =>
    (a.para_instituicao === inst && a.situacao === 'aguardando') || (a.de_instituicao === inst && a.situacao === 'contraproposta')).length;
  const nPauta = S.d.decisoes.filter((d) => d.situacao === 'em_pauta').length;
  const nNotif = S.notif.filter((n) => !n.lida).length;
  const nv = (r, t, n = 0) => `<a class="nv${rota === r ? ' on' : ''}" href="#/${r}"${rota === r ? ' aria-current="page"' : ''}>${t}${n ? ` <span class="bdg">${n}</span>` : ''}</a>`;
  return `
  ${S.api.modo === 'demo' ? `<div class="demo-faixa">Modo demonstração: dados de exemplo guardados só neste navegador. <button type="button" data-acao="trocar-pessoa">Trocar de pessoa</button> <button type="button" data-acao="reiniciar-demo">Restaurar exemplos</button></div>` : ''}
  <header class="top"><div class="wrap">
    <a class="marca" href="#/painel"><img src="${LOGO.MONITORAEA}" alt="MonitoraEA, página inicial"></a>
    <nav aria-label="Navegação principal">
      ${nv('painel', 'Painel')}${nv('quadro', 'Quadro')}${nv('triagem', 'Triagem', nTriagem)}${nv('decisoes', 'Decisões', nPauta)}${nv('equipe', 'Equipe')}
    </nav>
    <div class="eu">
      <a class="sino" href="#/notificacoes" aria-label="Notificações${nNotif ? `, ${nNotif} novas` : ''}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 003.4 0"></path></svg>
        ${nNotif ? `<span class="bdg">${nNotif}</span>` : ''}
      </a>
      ${avatar(S.eu)}
      <span class="quem">${e(S.eu.nome)}<small>${e(siglaDe(inst))} · ${e(PERFIL[S.eu.perfil])}</small></span>
      <button type="button" class="sair" data-acao="sair">Sair</button>
    </div>
  </div></header>
  ${conteudo}`;
}

// ------------------------------------------------------------------ acesso
export function pagAcesso(S) {
  const demo = S.api.modo === 'demo';
  const aba = S.abaAcesso || 'entrar';
  let corpo;
  if (demo) {
    const grupo = (inst, t) => {
      const ms = S.api.demoMembros().filter((m) => (inst ? m.instituicao_id === inst : !PARCEIRAS.includes(m.instituicao_id)));
      return `<div class="small" style="font-weight:600;color:var(--navy);margin-top:6px">${t}</div>` + ms.map((m) =>
        `<button type="button" data-acao="entrar-como" data-id="${e(m.id)}">${avatar(m)}<span><b>${e(m.nome)}</b><br><span class="hint">${e(PERFIL[m.perfil])} · ${e(m.papel || '')}</span></span></button>`).join('');
    };
    corpo = `<div><b style="color:var(--navy);font-size:17px">Modo demonstração</b><p class="small muted">Escolha uma pessoa para ver a plataforma com o perfil dela. Os dados são exemplos e ficam só neste navegador.</p></div>
      <div class="lista-demo">${grupo('INPE', 'INPE')}${grupo('ANPPEA', 'ANPPEA')}${grupo(null, 'Convidados externos')}</div>`;
  } else {
    corpo = `<div class="abas" role="tablist" aria-label="Tipo de acesso">
        <button type="button" role="tab" aria-selected="${aba === 'entrar'}" class="${aba === 'entrar' ? 'on' : ''}" data-acao="aba-acesso" data-aba="entrar">Entrar</button>
        <button type="button" role="tab" aria-selected="${aba === 'convite'}" class="${aba === 'convite' ? 'on' : ''}" data-acao="aba-acesso" data-aba="convite">Primeiro acesso</button>
      </div>
      ${aba === 'entrar' ? `
      <form class="form" data-form="entrar">
        <div class="f"><label for="ac-email">E-mail</label><input id="ac-email" name="email" type="email" autocomplete="username" required></div>
        <div class="f"><label for="ac-senha">Senha</label><input id="ac-senha" name="senha" type="password" autocomplete="current-password" required></div>
        <button class="btn pri" type="submit">Entrar</button>
      </form>` : `
      <form class="form" data-form="cadastrar">
        <div class="f"><label for="cv-cod">Código do convite</label><input id="cv-cod" name="codigo" type="text" required autocomplete="off" placeholder="XXXX-XXXX"><span class="hint">Enviado pela coordenação da sua instituição</span></div>
        <div class="f"><label for="cv-email">E-mail do convite</label><input id="cv-email" name="email" type="email" required autocomplete="username"></div>
        <div class="f"><label for="cv-nome">Nome</label><input id="cv-nome" name="nome" type="text" required placeholder="Como você quer aparecer para as equipes"></div>
        <div class="f"><label for="cv-senha">Crie uma senha</label><input id="cv-senha" name="senha" type="password" minlength="10" required autocomplete="new-password"><span class="hint">Mínimo de 10 caracteres</span></div>
        <label class="small" style="display:flex;gap:10px;align-items:flex-start"><input type="checkbox" name="termo" required style="margin-top:4px">Li e aceito o termo de uso e o compromisso de registrar nesta plataforma as demandas entre as instituições</label>
        <button class="btn pri" type="submit">Ativar acesso</button>
      </form>`}`;
  }
  return `<div class="hero acesso"><div class="wrap">
    <div class="intro">
      <img src="${LOGO.MONITORAEA}" alt="MonitoraEA">
      <div style="display:flex;flex-direction:column;gap:12px">
        <h1 style="font-size:38px;font-weight:400;line-height:1.2">Governança <b style="font-weight:600">compartilhada</b></h1>
        <p style="color:#D3E6F7;max-width:480px">Ambiente de trabalho conjunto das equipes do INPE e da ANPPEA para o desenvolvimento e a operação do MonitoraEA.</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;max-width:460px">
        <div class="pt"><span>1</span><p>O acesso é por convite. A coordenação de cada instituição convida os seus colaboradores.</p></div>
        <div class="pt"><span>2</span><p>Instituição e perfil vêm definidos no convite.</p></div>
        <div class="pt"><span>3</span><p>Todos veem tudo. O perfil define quem cria, aceita, prioriza e decide.</p></div>
      </div>
      ${parceiras()}
    </div>
    <div class="card">${corpo}</div>
  </div></div>`;
}

// ------------------------------------------------------------------ painel
export function pagPainel(S) {
  const it = S.d.itens;
  const ab = it.filter(aberto);
  const inst = S.eu.instituicao_id;
  const porOrig = (o) => ab.filter((x) => x.origem === o).length;
  const triagem = S.d.atribuicoes.filter((a) => a.situacao === 'aguardando');
  const comMinha = ab.filter((x) => x.vez_instituicao === inst);
  const prazos = ab.filter((x) => x.prazo && diasAte(x.prazo) <= 15);
  const atrasados = prazos.filter((x) => diasAte(x.prazo) < 0);
  const pauta = S.d.decisoes.filter((d) => d.situacao === 'em_pauta');
  const comigo = ab.filter((x) => x.vez_membro_id === S.eu.id
    || (!x.vez_membro_id && x.vez_instituicao === inst && coordenaDe(S.eu, inst)));

  const frentes = FRENTES.map(([k, t]) => {
    const xs = ab.filter((x) => x.frente === k);
    if (!xs.length) return '';
    const n = xs.length;
    const p = (o) => (100 * xs.filter((x) => x.origem === o).length) / n;
    return `<div style="display:flex;flex-direction:column;gap:6px">
      <div style="display:flex;justify-content:space-between"><span style="font-weight:500">${e(t)}</span><b style="color:var(--navy)">${n}</b></div>
      <div class="bar" role="img" aria-label="${e(t)}: ${xs.filter((x) => x.origem === 'INPE').length} INPE, ${xs.filter((x) => x.origem === 'ANPPEA').length} ANPPEA, ${xs.filter((x) => x.origem === 'CONJUNTA').length} conjuntas">
        <span style="width:${p('INPE')}%;background:var(--inpe)"></span><span style="width:${p('ANPPEA')}%;background:var(--anppea)"></span><span style="width:${p('CONJUNTA')}%;background:#B7E5FE"></span>
      </div></div>`;
  }).join('');

  const vezes = {};
  ab.forEach((x) => { vezes[x.vez_instituicao || '—'] = (vezes[x.vez_instituicao || '—'] || 0) + 1; });
  const maxV = Math.max(1, ...Object.values(vezes));
  const corV = (k) => (k === 'INPE' ? 'var(--inpe)' : k === 'ANPPEA' ? 'var(--anppea)' : '#3D6594');
  const vezHtml = Object.entries(vezes).sort((a, b) => b[1] - a[1]).map(([k, n]) =>
    `<span style="font-weight:500">${e(siglaDe(k))}</span><div class="bar"><span style="width:${(100 * n) / maxV}%;background:${corV(k)}"></span></div><b style="text-align:right;color:var(--navy)">${n}</b>`).join('');

  const processos = ab.filter((x) => x.tipo === 'processo');
  const fasesN = FASES.map((f) => f[0]);
  const ph = (f) => `<div class="ph" aria-hidden="true">${fasesN.map((x, i) => `<span class="${i <= fasesN.indexOf(f) ? 'f' : ''}"></span>`).join('')}</div>`;

  const agenda = [
    ...ab.filter((x) => x.prazo && diasAte(x.prazo) >= -7 && diasAte(x.prazo) <= 21).map((x) => ({ data: x.prazo, tipo: diasAte(x.prazo) < 0 ? 'late' : 'warn', rot: diasAte(x.prazo) < 0 ? 'Atrasado' : 'Prazo', t: x.titulo, href: `#/item/${x.id}` })),
    ...pauta.filter((d) => d.data_pauta).map((d) => ({ data: d.data_pauta, tipo: 'conj', rot: 'Comitê', t: d.titulo, href: '#/decisoes' })),
  ].sort((a, b) => a.data.localeCompare(b.data)).slice(0, 6);

  return hero({
    kick: 'Programa MonitoraEA · ProNAMEA',
    titulo: 'Painel de <b>governança compartilhada</b>',
    sub: 'Desenvolvimento, operação e articulação do sistema MonitoraEA conduzidos por INPE e ANPPEA, com tudo visível para as duas equipes.',
    extra: podeEditar(S.eu) ? `<a class="btn sky" href="#/novo">+ Novo registro</a><a class="btn ghost" href="#/quadro">Abrir o quadro</a>` : `<a class="btn ghost" href="#/quadro">Abrir o quadro</a>`,
  }) + `<main class="wrap">
    ${secao('Visão geral')}
    <section class="grade g-kpi" aria-label="Indicadores">
      <div class="box kpi"><b>${ab.length}</b><span class="t">Itens abertos</span><span class="muted small">${porOrig('INPE')} INPE · ${porOrig('ANPPEA')} ANPPEA · ${porOrig('CONJUNTA')} conjuntos</span></div>
      <a class="box kpi" href="#/triagem" style="text-decoration:none"><b>${triagem.length}</b><span class="t">Aguardando triagem</span><span class="muted small">atribuições sem resposta</span></a>
      <div class="box kpi"><b>${comMinha.length}</b><span class="t">Com a vez do ${e(siglaDe(inst))}</span><span class="muted small">a próxima ação é da sua instituição</span></div>
      <div class="box kpi"><b>${prazos.length}</b><span class="t">Prazos em 15 dias</span><span class="small" style="color:var(--verm);font-weight:500">${atrasados.length} ${atrasados.length === 1 ? 'atrasado' : 'atrasados'}</span></div>
      <a class="box kpi" href="#/decisoes" style="text-decoration:none"><b>${pauta.length}</b><span class="t">Decisões em pauta</span><span class="muted small">aguardando pactuação</span></a>
    </section>

    <section class="panel">
      <h3 class="ph3" style="margin-bottom:4px">Com você agora</h3>
      ${comigo.length ? comigo.map((x) => `<div class="row"><div style="flex:1;min-width:0"><a href="#/item/${x.id}" style="font-weight:600">${e(x.titulo)}</a><div class="small muted">${e(x.vez_nota || FASE[x.fase])}${x.prazo ? ` · prazo ${dataCurta(x.prazo)}` : ''}</div></div>${chipPrazo(x)}</div>`).join('')
        : '<p class="muted small" style="padding-top:8px">Nada esperando por você.</p>'}
    </section>

    <div class="grade g-2">
      <section class="panel" style="display:flex;flex-direction:column;gap:18px">
        <h3 class="ph3">Carteira por frente e origem</h3>
        <div style="display:flex;flex-direction:column;gap:14px">${frentes || '<p class="muted small">Sem itens abertos.</p>'}</div>
        <div class="legenda"><span><i style="background:var(--inpe)"></i>INPE</span><span><i style="background:var(--anppea)"></i>ANPPEA</span><span><i style="background:#B7E5FE"></i>Conjunta</span></div>
      </section>
      <section class="panel" style="display:flex;flex-direction:column;gap:18px">
        <h3 class="ph3">Com quem está a próxima ação</h3>
        <div style="display:grid;grid-template-columns:96px minmax(0,1fr) 28px;gap:14px;align-items:center">${vezHtml}</div>
      </section>
    </div>

    ${secao('Processos em negociação')}
    ${processos.length ? `<div class="tbl"><table>
      <thead><tr><th>Processo</th><th>Origem</th><th>Instrumento</th><th>Fase</th><th>Próxima ação</th><th>Prazo</th></tr></thead>
      <tbody>${processos.map((x) => `<tr>
        <td><a href="#/item/${x.id}" style="font-weight:600">${e(x.titulo)}</a>${x.modulo ? `<div class="muted small">${e(x.modulo)}</div>` : ''}</td>
        <td>${chipInst(x.origem)}</td>
        <td class="${x.instrumento ? 'mono' : 'muted'}">${e(x.instrumento || '—')}</td>
        <td>${ph(x.fase)}<div class="small" style="margin-top:4px">${e(FASE[x.fase])}</div></td>
        <td>${proximaAcao(S, x)}</td>
        <td>${x.prazo ? dataCurta(x.prazo) : '—'} ${chipPrazo(x)}</td></tr>`).join('')}</tbody></table></div>`
      : '<div class="vazio">Nenhum processo em negociação.</div>'}

    ${secao('Acompanhamento')}
    <div class="grade g-3">
      <section class="panel"><h3 class="ph3" style="margin-bottom:6px">Atividade recente</h3>
        ${S.d.eventosRecentes.slice(0, 6).map((ev) => {
          const x = item(S, ev.item_id);
          return `<div class="row">${avatar(membro(S, ev.autor_id))}<div style="min-width:0"><div><b>${e(nomeDe(S, ev.autor_id))}</b> · ${e(ev.detalhe)}</div><div class="muted small">${x ? `<a href="#/item/${x.id}">${e(x.titulo)}</a> · ` : ''}${quando(ev.criado_em)}</div></div></div>`;
        }).join('') || '<p class="muted small">Sem atividade ainda.</p>'}
      </section>
      <section class="panel"><h3 class="ph3" style="margin-bottom:6px">Agenda</h3>
        ${agenda.map((a) => `<div class="row"><div class="dt">${a.data.slice(8, 10)}<small>${dataCurta(a.data).split(' ').pop()}</small></div><div><span class="chip ${a.tipo}">${a.rot}</span><div style="margin-top:4px"><a href="${a.href}">${e(a.t)}</a></div></div></div>`).join('') || '<p class="muted small">Nada nas próximas semanas.</p>'}
      </section>
      <section class="panel"><h3 class="ph3" style="margin-bottom:6px">Atrasos e bloqueios</h3>
        ${[...atrasados, ...ab.filter((x) => x.fase === 'decisao' && !atrasados.includes(x))].slice(0, 5).map((x) => `<div class="row" style="flex-direction:column;gap:6px"><div style="display:flex;gap:6px;flex-wrap:wrap">${chipPrazo(x) || '<span class="chip warn">Aguardando decisão</span>'}${chipInst(x.origem)}</div><a href="#/item/${x.id}" style="font-weight:500">${e(x.titulo)}</a><div class="muted small">Próxima ação: ${e(siglaDe(x.vez_instituicao))}${x.vez_nota ? ' · ' + e(x.vez_nota) : ''}</div></div>`).join('') || '<p class="muted small">Nenhum atraso.</p>'}
      </section>
    </div>
  </main>`;
}

// ------------------------------------------------------------------ quadro
export function pagQuadro(S) {
  const fil = S.filtros;
  let base = S.d.itens.filter((x) => x.fase !== 'arquivado');
  base = base.filter((x) => x.fase !== 'publicado' || !x.concluido_em || diasAte(x.concluido_em.slice(0, 10)) >= -30);
  const porOrigem = fil.origem === 'todas' ? base : base.filter((x) => x.origem === fil.origem);
  const visiveis = fil.frente === 'todas' ? porOrigem : porOrigem.filter((x) => x.frente === fil.frente);
  const contaFrente = (k) => porOrigem.filter((x) => (k === 'todas' || x.frente === k) && aberto(x)).length;

  const card = (x) => `<a class="kc ${e(x.origem)}${aberto(x) ? '' : ' feito'}" href="#/item/${x.id}">
      <div class="kh">${logosOrigem(x.origem)}<span class="chip fte">${e(FRENTE[x.frente])}</span>${chipPrazo(x)}</div>
      <div class="tt">${e(x.titulo)}</div>
      <div class="kf">${x.responsavel_id ? avatar(membro(S, x.responsavel_id), 'p') : ''}<span>${e(TIPO[x.tipo])}</span>${x.modulo ? `<span>${e(x.modulo)}</span>` : ''}${x.prazo ? `<span>Prazo ${dataCurta(x.prazo)}</span>` : ''}</div>
      ${aberto(x) ? `<div class="who">Próxima ação ${chipInst(x.vez_instituicao)}${x.vez_membro_id ? ' ' + e(nomeDe(S, x.vez_membro_id)) : ''}</div>` : ''}
    </a>`;

  return hero({
    kick: 'Governança do sistema MonitoraEA',
    titulo: 'Desenvolvimento e <b>operação do sistema</b>',
    sub: 'Cada card é uma ação sobre o MonitoraEA. A cor mostra quem originou; o rodapé, com quem está a próxima ação.',
    extra: podeEditar(S.eu) ? '<a class="btn sky" href="#/novo">+ Nova demanda ou atividade</a>' : '',
  }) + `<main class="wide" style="gap:20px">
    <section class="frentes" aria-label="Frentes do sistema">
      ${[['todas', 'Todas as frentes'], ...FRENTES].map(([k, t]) => `<button type="button" class="fr${fil.frente === k ? ' on' : ''}" aria-pressed="${fil.frente === k}" data-acao="filtro" data-chave="frente" data-valor="${k}"><b>${contaFrente(k)}</b><span>${e(t)}</span></button>`).join('')}
    </section>
    <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between">
      <div class="seg" role="group" aria-label="Origem">
        ${[['todas', 'Todas'], ['INPE', 'INPE'], ['ANPPEA', 'ANPPEA'], ['CONJUNTA', 'Conjuntas']].map(([k, t]) => `<button type="button" class="${fil.origem === k ? 'on' : ''}" aria-pressed="${fil.origem === k}" data-acao="filtro" data-chave="origem" data-valor="${k}">${t}</button>`).join('')}
      </div>
      <div class="legenda"><span><i style="background:rgba(0,119,184,.35);border:1px solid var(--inpe)"></i>INPE</span><span><i style="background:rgba(249,178,51,.45);border:1px solid #D68C0A"></i>ANPPEA</span><span><i style="background:#fff;border:1px solid #9AA6B2"></i>Conjunta</span></div>
    </div>
    <div class="board"><div>
      ${FASES.map(([f, t]) => {
        const xs = visiveis.filter((x) => x.fase === f);
        const titulo = f === 'triagem' ? `<a href="#/triagem" style="color:var(--navy)">${t}</a>` : t;
        return `<section class="col" aria-label="${e(t)}"><div class="colh"><span>${titulo}${f === 'publicado' ? ' <span class="hint">30 dias</span>' : ''}</span><span class="n">${xs.length}</span></div>${xs.map(card).join('')}</section>`;
      }).join('')}
    </div></div>
  </main>`;
}

// ------------------------------------------------------------------ triagem
export function pagTriagem(S) {
  const inst = S.eu.instituicao_id;
  const outra = outraParceira(inst);
  const recebidas = S.d.atribuicoes.filter((a) => a.para_instituicao === inst && a.situacao === 'aguardando');
  const contra = S.d.atribuicoes.filter((a) => a.de_instituicao === inst && a.situacao === 'contraproposta');
  const souCoord = coordenaDe(S.eu, inst);

  const relogio = (a) => {
    const rest = 5 - diasUteisDesde(a.criado_em);
    return `<span class="relogio${rest <= 1 ? ' late' : ''}">${rest > 0 ? `${rest} ${rest === 1 ? 'dia útil' : 'dias úteis'} para responder` : 'Prazo de resposta vencido'}</span>`;
  };

  const recebidaHtml = (a) => {
    const x = item(S, a.item_id);
    if (!x) return '';
    return `<div class="rc de-${e(a.de_instituicao)}">
      <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">${logosOrigem(a.de_instituicao)}${relogio(a)}</div>
      <a href="#/item/${x.id}" style="font-weight:600;color:var(--navy)">${e(x.titulo)}</a>
      <p class="small muted">Pedido de ${e(nomeDe(S, a.criado_por))}${a.prazo_sugerido ? ` · prazo sugerido ${dataLonga(a.prazo_sugerido)}` : ''}${a.sugerido_membro_id ? ` · sugere ${e(nomeDe(S, a.sugerido_membro_id))}` : ''}</p>
      ${a.justificativa ? `<p class="small">${e(a.justificativa)}</p>` : ''}
      ${souCoord ? `<details class="resp"><summary class="btn sm pri" style="align-self:flex-start">Responder</summary>
        <form class="form" data-form="responder" data-id="${a.id}" style="margin-top:12px;gap:12px">
          <div class="f"><label for="r-resp-${a.id}">Responsável (se aceitar)</label><select id="r-resp-${a.id}" name="responsavel"><option value="">Escolha</option>${opcoes(ativos(S, inst).filter((m) => m.perfil !== 'leitor').map((m) => [m.id, m.nome]), a.sugerido_membro_id)}</select></div>
          <div class="f"><label for="r-prazo-${a.id}">Prazo</label><input id="r-prazo-${a.id}" name="prazo" type="date" value="${e(a.prazo_sugerido || '')}"></div>
          <div class="f"><label for="r-txt-${a.id}">Comentário ou justificativa</label><textarea id="r-txt-${a.id}" name="texto" rows="2" placeholder="Obrigatório para devolver"></textarea></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn sm pri" type="submit" name="acao" value="aceitar">Aceitar e designar</button>
            <button class="btn sm alerta" type="submit" name="acao" value="contrapropor">Contrapropor</button>
            <button class="btn sm perigo" type="submit" name="acao" value="devolver">Devolver</button>
          </div>
        </form></details>` : `<p class="hint">A coordenação ${inst === 'ANPPEA' ? 'da' : 'do'} ${e(siglaDe(inst))} responde a esta demanda.</p>`}
    </div>`;
  };

  const linhas = S.d.atribuicoes.map((a) => {
    const x = item(S, a.item_id);
    const cls = { aguardando: 'wait', aceita: 'ok', contraproposta: 'warn', devolvida: 'late' }[a.situacao];
    const prazo = a.situacao === 'contraproposta' && a.prazo_contraproposto
      ? `${dataCurta(a.prazo_sugerido)} → ${dataCurta(a.prazo_contraproposto)}` : (a.prazo_sugerido ? dataCurta(a.prazo_sugerido) : '—');
    return `<tr><td>${x ? `<a href="#/item/${x.id}" style="font-weight:600">${e(x.titulo)}</a>` : '—'}</td>
      <td><span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap">${chipInst(a.de_instituicao)}→${chipInst(a.para_instituicao)}</span></td>
      <td><span class="chip ${cls}">${e(SIT_ATRIB[a.situacao])}</span></td>
      <td>${a.situacao === 'aceita' && x?.responsavel_id ? e(nomeDe(S, x.responsavel_id)) : '<span class="muted">—</span>'}</td>
      <td>${prazo}</td>
      <td class="small muted">${a.resposta ? e(a.resposta) : quando(a.criado_em)}</td></tr>`;
  }).join('');

  return hero({
    kick: 'Atribuição entre instituições',
    titulo: 'Triagem e <b>atribuição</b>',
    sub: 'Uma instituição pode atribuir uma demanda à outra, mas ninguém recebe trabalho sem aceitar. A coordenação de destino responde em até 5 dias úteis.',
  }) + `<main class="wrap">
    ${secao('Como funciona')}
    <div class="fluxo">
      <div class="fs"><span class="no">1</span><b>Atribuir</b><p class="small">Quem origina descreve o pedido, justifica e sugere um prazo.</p></div>
      <div class="fs"><span class="no">2</span><b>Triagem</b><p class="small">A demanda chega à coordenação de destino, que tem 5 dias úteis para responder.</p></div>
      <div class="fs"><span class="no">3</span><b>Resposta</b><p class="small">Aceitar e designar um responsável, contrapropor prazo ou escopo, ou devolver com justificativa.</p></div>
      <div class="fs"><span class="no">4</span><b>Execução e aceite</b><p class="small">Aceita, entra na carga do destino. Ao final, a origem valida a entrega.</p></div>
    </div>

    <div class="lado">
      ${souParceira(S) && podeEditar(S.eu) ? `<form class="panel form principal" data-form="atribuir-novo">
        <div><h3 class="ph3">Atribuir uma demanda ${outra === 'ANPPEA' ? 'à' : 'ao'} ${outra}</h3><span class="muted small">Você está no ${e(siglaDe(inst))}. A demanda vai para a coordenação ${outra === 'ANPPEA' ? 'da' : 'do'} ${outra}.</span></div>
        <div class="f"><label for="an-tit">O que se pede</label><input id="an-tit" name="titulo" type="text" required minlength="3"></div>
        <div class="f"><label for="an-jus">Por que é necessário</label><textarea id="an-jus" name="justificativa" rows="3"></textarea></div>
        <div class="g2">
          <div class="f"><label for="an-fr">Frente</label><select id="an-fr" name="frente">${opcoes(FRENTES)}</select></div>
          <div class="f"><label for="an-mod">Módulo ou perspectiva</label><input id="an-mod" name="modulo" type="text" placeholder="Ex.: Portal · Sínteses"></div>
          <div class="f"><label for="an-pz">Prazo sugerido</label><input id="an-pz" name="prazo" type="date" value="${somarDias(hojeISO(), 21)}"></div>
          <div class="f"><label for="an-pr">Prioridade</label><select id="an-pr" name="prioridade">${opcoes(Object.entries(PRIORIDADE), 'media')}</select></div>
        </div>
        <div class="f"><label for="an-sug">Sugerir uma pessoa ${outra === 'ANPPEA' ? 'da' : 'do'} ${outra} (opcional)</label><select id="an-sug" name="sugerido"><option value="">A coordenação decide</option>${opcoes(ativos(S, outra).filter((m) => m.perfil !== 'leitor').map((m) => [m.id, m.nome]))}</select></div>
        <div class="box" style="padding:12px 16px"><p class="small" style="color:var(--navy)">A demanda aparece em <b>Entrada e triagem</b> e só passa a contar na carga ${outra === 'ANPPEA' ? 'da' : 'do'} ${outra} depois de aceita.</p></div>
        <div class="acoes"><button class="btn pri" type="submit">Atribuir ${outra === 'ANPPEA' ? 'à' : 'ao'} ${outra}</button></div>
      </form>` : `<div class="panel principal"><p class="muted">Seu perfil acompanha as atribuições, mas não cria novas.</p></div>`}

      <div class="aside">
        <section class="panel" style="display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline"><h3 class="ph3">Recebidas pelo ${e(siglaDe(inst))}</h3><span class="chip wait">${recebidas.length} aguardando</span></div>
          ${recebidas.map(recebidaHtml).join('') || '<p class="muted small">Nenhuma demanda aguardando triagem.</p>'}
        </section>
        ${contra.length ? `<section class="panel" style="display:flex;flex-direction:column;gap:14px">
          <h3 class="ph3">Contrapropostas para avaliar</h3>
          ${contra.map((a) => {
            const x = item(S, a.item_id);
            return `<div class="rc de-${e(a.para_instituicao)}"><a href="#/item/${x.id}" style="font-weight:600">${e(x.titulo)}</a>
              <p class="small">${e(siglaDe(a.para_instituicao))} propõe ${a.prazo_contraproposto ? `prazo de ${dataLonga(a.prazo_contraproposto)}` : 'ajuste de escopo'}${a.resposta ? `: ${e(a.resposta)}` : ''}</p>
              ${podeEditar(S.eu) ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm pri" data-acao="aceitar-contraproposta" data-id="${a.id}">Aceitar contraproposta</button><a class="btn sm" href="#/item/${x.id}">Abrir item</a></div>` : ''}</div>`;
          }).join('')}
        </section>` : ''}
      </div>
    </div>

    ${secao('Atribuições entre instituições')}
    ${linhas ? `<div class="tbl"><table><thead><tr><th>Demanda</th><th>De → Para</th><th>Situação</th><th>Responsável</th><th>Prazo</th><th>Observação</th></tr></thead><tbody>${linhas}</tbody></table></div>` : '<div class="vazio">Nenhuma atribuição ainda.</div>'}
  </main>`;
}

// ------------------------------------------------------------------ item
export async function pagItem(S, id) {
  const x = item(S, id);
  if (!x) return hero({ titulo: 'Item não encontrado' }) + '<main class="wrap"><a href="#/quadro">Voltar ao quadro</a></main>';
  const [coms, evs] = await Promise.all([S.api.comentarios(x.id), S.api.eventos(x.id)]);
  const editar = podeEditarItem(S.eu, x);
  const atribs = S.d.atribuicoes.filter((a) => a.item_id === x.id);
  const aAberta = atribAberta(S, x.id);
  const outra = outraParceira(S.eu.instituicao_id);
  const idxFase = FASES.findIndex((f) => f[0] === x.fase);
  const destinosVez = [
    ...PARCEIRAS.map((i) => [`inst:${i}`, `Coordenação ${i === 'ANPPEA' ? 'da' : 'do'} ${i}`]),
    ...ativos(S).filter((m) => PARCEIRAS.includes(m.instituicao_id) && m.perfil !== 'leitor').map((m) => [`m:${m.id}`, `${m.nome} (${siglaDe(m.instituicao_id)})`]),
  ];
  const realce = (t) => e(t).replace(/@(INPE|ANPPEA)\b/gi, (m, g) => `<span class="${g.toUpperCase() === 'INPE' ? 'men' : 'mena'}">${m}</span>`);

  return hero({
    migalha: `<a href="#/painel">Painel</a> / <a href="#/quadro">Quadro</a> / ${e(TIPO[x.tipo])}`,
    titulo: `<span style="font-weight:600">${e(x.titulo)}</span>`,
    sub: `${e(TIPO[x.tipo])} · ${e(FRENTE[x.frente])}${x.modulo ? ` · ${e(x.modulo)}` : ''}${x.instrumento ? ` · <span class="mono" style="color:#D3E6F7">${e(x.instrumento)}</span>` : ''}`,
    extra: `${chipInst(x.origem, 'Origem ' + siglaDe(x.origem))} <span class="chip ${x.fase === 'publicado' ? 'ok' : 'wait'}">${e(FASE[x.fase])}</span> ${chipPrazo(x)}`,
    lado: podeAtribuir(S, x) ? `<a class="btn sky" href="#/item/${x.id}/atribuir">Atribuir ${outra === 'ANPPEA' ? 'à' : 'ao'} ${outra}</a>` : '',
  }) + `<main class="wrap"><div class="lado">
    <div class="principal">
      ${S.params.atribuir && podeAtribuir(S, x) ? `<form class="panel form" data-form="atribuir-item" data-id="${x.id}">
        <h3 class="ph3">Atribuir ${outra === 'ANPPEA' ? 'à' : 'ao'} ${outra}</h3>
        <div class="f"><label for="ai-jus">O que se pede e por quê</label><textarea id="ai-jus" name="justificativa" rows="3" required></textarea></div>
        <div class="g2"><div class="f"><label for="ai-pz">Prazo sugerido</label><input id="ai-pz" name="prazo" type="date" value="${e(x.prazo || somarDias(hojeISO(), 21))}"></div>
        <div class="f"><label for="ai-sug">Sugerir pessoa (opcional)</label><select id="ai-sug" name="sugerido"><option value="">A coordenação decide</option>${opcoes(ativos(S, outra).filter((m) => m.perfil !== 'leitor').map((m) => [m.id, m.nome]))}</select></div></div>
        <div class="acoes"><a class="btn txt" href="#/item/${x.id}">Cancelar</a><button class="btn pri" type="submit">Atribuir</button></div>
      </form>` : ''}

      ${aberto(x) ? `<section class="box vez">
        <div style="display:flex;flex-direction:column;gap:6px;flex:1 1 360px;min-width:0">
          <span class="small" style="color:var(--navy);font-weight:600">A próxima ação está com</span>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${x.vez_membro_id ? avatar(membro(S, x.vez_membro_id)) : ''}${proximaAcao(S, x)}</div>
          ${aAberta ? `<p class="small">Atribuição ${e(SIT_ATRIB[aAberta.situacao].toLowerCase())}${aAberta.situacao === 'aguardando' ? ` pela coordenação ${aAberta.para_instituicao === 'ANPPEA' ? 'da' : 'do'} ${e(siglaDe(aAberta.para_instituicao))}` : ''}. <a href="#/triagem">Ver na triagem</a></p>` : ''}
        </div>
        ${editar && !aAberta ? `<details class="resp"><summary class="btn pri">Passar a vez</summary>
          <form class="form" data-form="passar-vez" data-id="${x.id}" style="margin-top:12px;gap:12px;min-width:280px">
            <div class="f"><label for="pv-dest">Para</label><select id="pv-dest" name="destino" required>${opcoes(destinosVez)}</select></div>
            <div class="f"><label for="pv-nota">O que precisa ser feito</label><input id="pv-nota" name="nota" type="text" required></div>
            <button class="btn sm pri" type="submit">Passar a vez</button>
          </form></details>` : ''}
      </section>` : ''}

      <section class="panel" style="display:flex;flex-direction:column;gap:16px">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><h2 class="ph3">Fase</h2>${editar && x.fase !== 'arquivado' && !aAberta ? `<button type="button" class="lnk" data-acao="fase" data-id="${x.id}" data-fase="arquivado">Arquivar</button>` : ''}${x.fase === 'arquivado' && editar ? `<button type="button" class="lnk" data-acao="fase" data-id="${x.id}" data-fase="priorizado">Reabrir</button>` : ''}</div>
        <div class="steps">${FASES.map(([f, t], i) => {
          const cls = i < idxFase ? 'f' : i === idxFase ? 'c' : 'n';
          const clicavel = editar && f !== x.fase && f !== 'triagem' && !aAberta;
          return `<${clicavel ? 'button type="button"' : 'div'} class="st ${cls}"${clicavel ? ` data-acao="fase" data-id="${x.id}" data-fase="${f}" aria-label="Mudar para ${e(t)}"` : ''}><i></i><b>${e(t)}</b></${clicavel ? 'button' : 'div'}>`;
        }).join('')}</div>
        ${editar && !aAberta ? '<p class="hint">Clique numa fase para mover o item.</p>' : ''}
      </section>

      ${x.descricao ? `<section class="panel"><h2 class="ph3" style="margin-bottom:8px">Descrição</h2><p style="white-space:pre-wrap">${e(x.descricao)}</p></section>` : ''}

      <section class="panel">
        <h2 class="ph3" style="margin-bottom:4px">Comentários</h2>
        ${coms.map((c) => `<div class="cm">${avatar(membro(S, c.autor_id))}<div style="display:flex;flex-direction:column;gap:6px;min-width:0">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b>${e(nomeDe(S, c.autor_id))}</b>${chipInst(membro(S, c.autor_id)?.instituicao_id)}<span class="muted small">${quando(c.criado_em)}</span>${c.proposta_decisao ? '<span class="chip warn">Proposta de decisão</span>' : ''}</div>
          <p>${realce(c.texto)}</p></div></div>`).join('') || '<p class="muted small" style="padding:12px 0">Nenhum comentário ainda.</p>'}
        <form class="form" data-form="comentar" data-id="${x.id}" style="gap:12px;background:var(--claro-2);border:1px solid var(--linha);border-radius:16px;padding:16px;margin-top:8px">
          <label for="cm-txt" style="font-weight:600;color:var(--navy)">Comentar</label>
          <textarea id="cm-txt" name="texto" rows="3" required placeholder="Use @INPE ou @ANPPEA para avisar a equipe toda"></textarea>
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:space-between">
            ${podeEditar(S.eu) ? '<label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="proposta">Levar ao Comitê como proposta de decisão</label>' : '<span></span>'}
            <div style="display:flex;gap:12px;align-items:center"><span class="hint">Visível para INPE e ANPPEA</span><button class="btn pri" type="submit">Publicar</button></div>
          </div>
        </form>
      </section>

      <section class="panel"><h2 class="ph3" style="margin-bottom:4px">Histórico</h2>
        ${evs.map((ev) => `<div class="row"><span class="dt" style="width:auto;padding:4px 10px;font-size:12px;font-weight:600">${dataCurta(ev.criado_em)}</span><div><b>${e(nomeDe(S, ev.autor_id))}</b> · ${e(ev.detalhe)}</div></div>`).join('')}
      </section>
    </div>

    <aside class="aside">
      <section class="panel" style="display:flex;flex-direction:column;gap:14px">
        <h2 class="ph3">Detalhes</h2>
        <dl>
          <dt>Origem</dt><dd>${chipInst(x.origem)}</dd>
          <dt>Responsável</dt><dd>${x.responsavel_id ? e(nomeDe(S, x.responsavel_id)) : '<span class="muted">a definir</span>'}</dd>
          <dt>Envolvidas</dt><dd style="display:flex;gap:6px;flex-wrap:wrap">${(x.envolvidas || []).map((i) => chipInst(i)).join('') || '<span class="muted">—</span>'}</dd>
          <dt>Prioridade</dt><dd>${e(PRIORIDADE[x.prioridade])}</dd>
          <dt>Prazo</dt><dd>${x.prazo ? dataLonga(x.prazo) : '—'}</dd>
          <dt>Registrado</dt><dd>${dataLonga(x.criado_em)} por ${e(nomeDe(S, x.criado_por))}</dd>
        </dl>
      </section>
      ${editar ? `<form class="panel form" data-form="ajustar" data-id="${x.id}" style="gap:14px">
        <h2 class="ph3">Ajustar</h2>
        <div class="f"><label for="aj-resp">Responsável</label><select id="aj-resp" name="responsavel"><option value="">A definir</option>${opcoes(ativos(S).filter((m) => PARCEIRAS.includes(m.instituicao_id) && m.perfil !== 'leitor').map((m) => [m.id, `${m.nome} (${siglaDe(m.instituicao_id)})`]), x.responsavel_id)}</select></div>
        <div class="f"><label for="aj-pz">Prazo</label><input id="aj-pz" name="prazo" type="date" value="${e(x.prazo || '')}"></div>
        <div class="f"><label for="aj-pr">Prioridade</label><select id="aj-pr" name="prioridade">${opcoes(Object.entries(PRIORIDADE), x.prioridade)}</select></div>
        <div class="f"><span class="t">Instituições envolvidas</span><div style="display:flex;gap:8px;flex-wrap:wrap">${S.d.instituicoes.map((i) => `<label class="ck"><input type="checkbox" name="envolvidas" value="${e(i.id)}"${(x.envolvidas || []).includes(i.id) ? ' checked' : ''}>${e(i.sigla)}</label>`).join('')}</div></div>
        <button class="btn" type="submit">Salvar ajustes</button>
      </form>` : ''}
      ${atribs.length ? `<section class="box" style="display:flex;flex-direction:column;gap:10px"><h2 class="ph3">Atribuições</h2>
        ${atribs.map((a) => `<div class="small"><span style="display:inline-flex;gap:6px;align-items:center">${chipInst(a.de_instituicao)}→${chipInst(a.para_instituicao)}</span> <b>${e(SIT_ATRIB[a.situacao])}</b><br><span class="muted">${dataLonga(a.criado_em)}${a.resposta ? ' · ' + e(a.resposta) : ''}</span></div>`).join('')}
      </section>` : ''}
    </aside>
  </div></main>`;
}

// ------------------------------------------------------------------ novo registro
export function pagNovo(S) {
  if (!podeEditar(S.eu)) return hero({ titulo: 'Novo <b>registro</b>' }) + '<main class="wrap"><div class="vazio">Seu perfil é de leitura.</div></main>';
  const inst = S.eu.instituicao_id;
  const outra = outraParceira(inst);
  return hero({
    migalha: '<a href="#/quadro">Quadro</a> / Novo registro',
    titulo: 'Novo <b>registro</b>',
    sub: 'O que for registrado aqui fica visível para as equipes do INPE e da ANPPEA.',
    lado: '',
  }) + `<main class="wrap"><div class="lado">
    <form class="panel form principal" data-form="novo" style="gap:22px">
      <fieldset class="form" style="gap:16px"><legend class="passo"><span>1</span><b>O que você está registrando</b></legend>
        <div class="opcoes" style="margin-top:14px">
          <label class="opt"><input type="radio" name="tipo" value="atividade" checked><span><b style="color:var(--navy)">Atividade</b><br><span class="hint">Algo que uma ou ambas as equipes vão fazer</span></span></label>
          <label class="opt"><input type="radio" name="tipo" value="demanda"><span><b style="color:var(--navy)">Demanda</b><br><span class="hint">Um pedido de uma instituição à outra</span></span></label>
          <label class="opt"><input type="radio" name="tipo" value="processo"><span><b style="color:var(--navy)">Processo</b><br><span class="hint">Instrumento, termo ou pactuação com fases</span></span></label>
        </div>
        <div class="f"><label for="nv-tit">Título</label><input id="nv-tit" name="titulo" type="text" required minlength="3"></div>
        <div class="f"><label for="nv-desc">Descrição</label><textarea id="nv-desc" name="descricao" rows="4" placeholder="Contexto, resultado esperado e o que significa estar concluído"></textarea></div>
        <div class="g2">
          <div class="f"><label for="nv-fr">Frente do sistema</label><select id="nv-fr" name="frente">${opcoes(FRENTES)}</select></div>
          <div class="f"><label for="nv-mod">Módulo ou perspectiva</label><input id="nv-mod" name="modulo" type="text" placeholder="Ex.: Portal · Sínteses, Cadastro, IITEA"></div>
        </div>
      </fieldset>

      <fieldset class="sec"><legend class="passo"><span>2</span><b>Quem</b></legend>
        <div class="f"><span class="t">Origem</span><div style="display:flex;gap:8px;flex-wrap:wrap">
          <label class="ck"><input type="radio" name="origem" value="${inst}" checked>${e(siglaDe(inst))}</label>
          <label class="ck"><input type="radio" name="origem" value="CONJUNTA">Conjunta (INPE e ANPPEA)</label>
        </div></div>
        <div class="f"><span class="t">Quem faz</span><div class="opcoes">
          <label class="opt"><input type="radio" name="destino" value="minha" checked><span><b style="color:var(--navy)">Fica ${inst === 'ANPPEA' ? 'na' : 'no'} ${e(siglaDe(inst))}</b><br><span class="hint">Você escolhe o responsável</span></span></label>
          <label class="opt"><input type="radio" name="destino" value="atribuir"><span><b style="color:var(--navy)">Atribuir ${outra === 'ANPPEA' ? 'à' : 'ao'} ${outra}</b><br><span class="hint">Vai para a triagem da coordenação ${outra === 'ANPPEA' ? 'da' : 'do'} ${outra}</span></span></label>
        </div></div>
        <div class="g2">
          <div class="f"><label for="nv-resp">Responsável ${inst === 'ANPPEA' ? 'na' : 'no'} ${e(siglaDe(inst))}</label><select id="nv-resp" name="responsavel"><option value="">A definir</option>${opcoes(ativos(S, inst).filter((m) => m.perfil !== 'leitor').map((m) => [m.id, m.nome]), S.eu.id)}</select><span class="hint">Usado quando o item fica com a sua instituição</span></div>
          <div class="f"><label for="nv-sug">Sugerir pessoa ${outra === 'ANPPEA' ? 'da' : 'do'} ${outra}</label><select id="nv-sug" name="sugerido"><option value="">A coordenação decide</option>${opcoes(ativos(S, outra).filter((m) => m.perfil !== 'leitor').map((m) => [m.id, m.nome]))}</select><span class="hint">Usado quando o item é atribuído</span></div>
        </div>
      </fieldset>

      <fieldset class="sec"><legend class="passo"><span>3</span><b>Quando e onde</b></legend>
        <div class="g2">
          <div class="f"><label for="nv-pz">Prazo</label><input id="nv-pz" name="prazo" type="date"></div>
          <div class="f"><label for="nv-pr">Prioridade</label><select id="nv-pr" name="prioridade">${opcoes(Object.entries(PRIORIDADE), 'media')}</select></div>
          <div class="f"><label for="nv-ins">Instrumento ou processo SEI</label><input id="nv-ins" name="instrumento" type="text" placeholder="Opcional"></div>
        </div>
      </fieldset>

      <div class="acoes"><a class="btn txt" href="#/quadro">Cancelar</a><button class="btn pri" type="submit">Registrar</button></div>
    </form>
    <aside class="aside">
      <section class="box" style="display:flex;flex-direction:column;gap:8px"><b style="color:var(--navy)">Regras de convivência</b>
        <p class="small muted">Todo item tem um responsável e alguém com a próxima ação. Demandas para a outra instituição passam pela triagem da coordenação de destino, que responde em até 5 dias úteis.</p>
      </section>
    </aside>
  </div></main>`;
}

// ------------------------------------------------------------------ decisões
export function pagDecisoes(S) {
  const inst = S.eu.instituicao_id;
  const pactuo = ['coordenacao', 'administracao'].includes(S.eu.perfil) && PARCEIRAS.includes(inst);
  const emPauta = S.d.decisoes.filter((d) => d.situacao === 'em_pauta');
  const outras = S.d.decisoes.filter((d) => d.situacao !== 'em_pauta');
  const ok = (v) => (v ? '✓' : '…');
  const linha = (d) => `<tr>
    <td>${d.data_pauta ? dataCurta(d.data_pauta) : dataCurta(d.criado_em)}</td>
    <td><b>${e(d.titulo)}</b>${d.descricao ? `<div class="small muted">${e(d.descricao)}</div>` : ''}${d.item_id && item(S, d.item_id) ? `<div class="small"><a href="#/item/${d.item_id}">${e(item(S, d.item_id).titulo)}</a></div>` : ''}</td>
    <td>${e(d.forum)}</td>
    <td><div style="display:flex;gap:6px;flex-wrap:wrap">${chipInst('INPE', 'INPE ' + ok(d.ok_inpe))}${chipInst('ANPPEA', 'ANPPEA ' + ok(d.ok_anppea))}</div></td>
    <td>${d.situacao === 'em_pauta'
      ? (pactuo && !(inst === 'INPE' ? d.ok_inpe : d.ok_anppea)
        ? `<div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm pri" data-acao="pactuar" data-id="${d.id}">De acordo</button><button type="button" class="btn sm perigo" data-acao="rejeitar" data-id="${d.id}">Rejeitar</button></div>`
        : '<span class="chip warn">Em pauta</span>')
      : `<span class="chip ${d.situacao === 'pactuada' ? 'ok' : 'late'}">${d.situacao === 'pactuada' ? 'Pactuada' : 'Rejeitada'}</span>`}</td></tr>`;
  const cab = '<thead><tr><th>Data</th><th>Decisão</th><th>Fórum</th><th>De acordo</th><th>Situação</th></tr></thead>';
  return hero({
    kick: 'O que foi pactuado entre as instituições',
    titulo: 'Decisões <b>pactuadas</b>',
    sub: 'Uma decisão só vale quando as coordenações do INPE e da ANPPEA dão o seu de acordo.',
  }) + `<main class="wrap">
    ${secao('Em pauta')}
    ${emPauta.length ? `<div class="tbl"><table>${cab}<tbody>${emPauta.map(linha).join('')}</tbody></table></div>` : '<div class="vazio">Nenhuma decisão em pauta.</div>'}
    ${podeEditar(S.eu) ? `<form class="panel form" data-form="propor">
      <h3 class="ph3">Propor decisão</h3>
      <div class="g2">
        <div class="f"><label for="dc-tit">Decisão proposta</label><input id="dc-tit" name="titulo" type="text" required minlength="3"></div>
        <div class="f"><label for="dc-dt">Data da pauta</label><input id="dc-dt" name="data_pauta" type="date"></div>
        <div class="f"><label for="dc-for">Fórum</label><select id="dc-for" name="forum">${opcoes([['Comitê de governança', 'Comitê de governança'], ['Alinhamento operacional', 'Alinhamento operacional'], ['Revisão do portfólio', 'Revisão do portfólio']])}</select></div>
        <div class="f"><label for="dc-it">Item relacionado</label><select id="dc-it" name="item_id"><option value="">Nenhum</option>${opcoes(S.d.itens.filter(aberto).map((x) => [String(x.id), x.titulo]))}</select></div>
      </div>
      <div class="f"><label for="dc-desc">Detalhes</label><textarea id="dc-desc" name="descricao" rows="2"></textarea></div>
      <div class="acoes"><button class="btn pri" type="submit">Colocar em pauta</button></div>
    </form>` : ''}
    ${secao('Histórico de decisões')}
    ${outras.length ? `<div class="tbl"><table>${cab}<tbody>${outras.map(linha).join('')}</tbody></table></div>` : '<div class="vazio">Nenhuma decisão registrada.</div>'}
  </main>`;
}

// ------------------------------------------------------------------ equipe
export async function pagEquipe(S) {
  const ab = S.d.itens.filter(aberto);
  const conta = (m) => {
    const resp = ab.filter((x) => x.responsavel_id === m.id).length;
    const vez = ab.filter((x) => x.vez_membro_id === m.id).length;
    const atr = ab.filter((x) => x.responsavel_id === m.id && x.prazo && diasAte(x.prazo) < 0).length;
    const fim = S.d.itens.filter((x) => x.responsavel_id === m.id && x.fase === 'publicado' && x.concluido_em && diasAte(x.concluido_em.slice(0, 10)) >= -30).length;
    return { resp, vez, atr, fim };
  };
  const souCoordAlgum = ['coordenacao', 'administracao'].includes(S.eu.perfil);
  const convites = souCoordAlgum ? await S.api.convites() : [];
  const novo = S.ultimoConvite;

  const tabela = (inst, cor) => {
    const ms = S.d.membros.filter((m) => (inst ? m.instituicao_id === inst : !PARCEIRAS.includes(m.instituicao_id)));
    const cs = ms.map((m) => ({ m, c: conta(m) }));
    const max = Math.max(1, ...cs.map(({ c }) => c.resp + c.vez));
    if (!ms.length) return '<div class="vazio">Ninguém cadastrado.</div>';
    return `<div class="tbl" style="border:1px solid var(--linha);border-radius:16px"><table>
      <thead><tr><th>Colaborador</th><th>Perfil</th><th class="num">Responsável</th><th class="num">Com a vez</th><th class="num">Atrasadas</th><th class="num">Concluídas 30 dias</th>${inst ? '<th>Carga</th>' : ''}</tr></thead>
      <tbody>${cs.map(({ m, c }) => {
        const gerir = coordenaDe(S.eu, m.instituicao_id) && m.id !== S.eu.id;
        return `<tr${m.ativo ? '' : ' style="opacity:.5"'}>
        <td><div class="pessoa">${avatar(m)}<div><b>${e(m.nome)}</b><span class="muted small">${e(m.papel || '')}${m.ativo ? '' : ' · inativo'}</span></div></div></td>
        <td>${gerir ? `<form data-form="perfil" data-id="${e(m.id)}" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><label class="oculto" for="pf-${e(m.id)}">Perfil de ${e(m.nome)}</label><select id="pf-${e(m.id)}" name="perfil" style="min-height:36px;width:auto">${opcoes(Object.entries(PERFIL).filter(([k]) => k !== 'administracao' || ehAdmin(S.eu)), m.perfil)}</select><button class="btn sm" type="submit">Salvar</button><button class="btn sm ${m.ativo ? 'perigo' : ''}" type="button" data-acao="ativo" data-id="${e(m.id)}" data-valor="${m.ativo ? '0' : '1'}">${m.ativo ? 'Desativar' : 'Reativar'}</button></form>` : `<span class="chip p-${m.perfil}">${e(PERFIL[m.perfil])}</span>`}</td>
        <td class="num${c.resp ? '' : ' z'}">${c.resp}</td><td class="num${c.vez ? '' : ' z'}">${c.vez}</td><td class="num${c.atr ? ' late' : ' z'}">${c.atr}</td><td class="num${c.fim ? '' : ' z'}">${c.fim}</td>
        ${inst ? `<td><div class="carga" role="img" aria-label="Carga ${c.resp + c.vez}"><span style="width:${(100 * (c.resp + c.vez)) / max}%;background:${cor}"></span></div></td>` : ''}</tr>`;
      }).join('')}</tbody></table></div>`;
  };
  const resumo = (inst, cls) => {
    const ms = S.d.membros.filter((m) => m.instituicao_id === inst && m.ativo);
    const resp = ab.filter((x) => ms.some((m) => m.id === x.responsavel_id)).length;
    const vez = ab.filter((x) => x.vez_instituicao === inst).length;
    const atr = ab.filter((x) => ms.some((m) => m.id === x.responsavel_id) && x.prazo && diasAte(x.prazo) < 0).length;
    const tri = S.d.atribuicoes.filter((a) => a.para_instituicao === inst && a.situacao === 'aguardando').length;
    return `<section class="box ${cls}" style="display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><b style="color:var(--navy);font-size:16px">${inst} · ${ms.length} ${ms.length === 1 ? 'colaborador' : 'colaboradores'}</b><img src="${LOGO[inst]}" alt="" style="height:${inst === 'INPE' ? 30 : 20}px;width:auto"></div>
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px">
        <div class="est"><b>${resp}</b><span>sob responsabilidade</span></div>
        <div class="est"><b>${vez}</b><span>com a vez</span></div>
        <div class="est"><b style="color:var(--verm)">${atr}</b><span>atrasadas</span></div>
        <div class="est"><b>${tri}</b><span>na triagem</span></div>
      </div></section>`;
  };
  const instConvite = ehAdmin(S.eu)
    ? S.d.instituicoes.map((i) => [i.id, i.sigla])
    : [[S.eu.instituicao_id, siglaDe(S.eu.instituicao_id)], ...S.d.instituicoes.filter((i) => !i.parceira).map((i) => [i.id, `${i.sigla} (só leitor)`])];

  return hero({
    kick: 'Quem conduz o sistema',
    titulo: 'Equipe do <b>MonitoraEA</b>',
    sub: 'Colaboradores do INPE e da ANPPEA, o perfil de acesso de cada um e quantas demandas e atividades estão com cada pessoa.',
  }) + `<main class="wrap">
    <div class="grade g-2">${resumo('INPE', 'i')}${resumo('ANPPEA', 'a')}</div>
    ${secao('INPE')}${tabela('INPE', 'var(--inpe)')}
    ${secao('ANPPEA')}${tabela('ANPPEA', 'var(--anppea)')}
    ${secao('Convidados externos')}${tabela(null, '#3D6594')}

    ${souCoordAlgum ? `${secao('Convidar colaborador')}
    <div class="lado">
      <form class="panel form principal" data-form="convidar">
        <div class="g2">
          <div class="f"><label for="cv-mail">E-mail da pessoa</label><input id="cv-mail" name="email" type="email" required></div>
          <div class="f"><label for="cv-inst">Instituição</label><select id="cv-inst" name="instituicao_id">${opcoes(instConvite, S.eu.instituicao_id)}</select></div>
          <div class="f"><label for="cv-perf">Perfil</label><select id="cv-perf" name="perfil">${opcoes(Object.entries(PERFIL).filter(([k]) => k !== 'administracao' || ehAdmin(S.eu)), 'colaborador')}</select></div>
          <div class="f"><label for="cv-pap">Papel na equipe</label><input id="cv-pap" name="papel" type="text" placeholder="Ex.: Desenvolvimento, Articulação das redes"></div>
        </div>
        <div class="acoes"><button class="btn pri" type="submit">Gerar convite</button></div>
      </form>
      <aside class="aside">
        ${novo ? `<section class="box" style="display:flex;flex-direction:column;gap:10px"><b style="color:var(--navy)">Convite criado para ${e(novo.email)}</b><span class="codigo">${e(novo.codigo)}</span><p class="small">Envie à pessoa o código e o endereço desta plataforma. Ela usa a aba <b>Primeiro acesso</b> com este mesmo e-mail. Vale por 30 dias.</p></section>` : ''}
        <section class="panel"><h3 class="ph3" style="margin-bottom:6px">Convites pendentes</h3>
          ${convites.filter((c) => !c.aceito_em).map((c) => `<div class="row"><div><b>${e(c.email)}</b><div class="small muted">${e(siglaDe(c.instituicao_id))} · ${e(PERFIL[c.perfil])} · <span class="mono">${e(c.codigo)}</span></div></div></div>`).join('') || '<p class="muted small">Nenhum convite pendente.</p>'}
        </section>
      </aside>
    </div>` : ''}

    ${secao('Perfis de acesso')}
    <div class="grade g-kpi">
      <div class="box" style="display:flex;flex-direction:column;gap:8px"><span class="chip p-leitor" style="align-self:flex-start">Leitor</span><p class="small">Vê tudo, comenta e segue itens. Convidados externos recebem a vez quando um item depende deles.</p></div>
      <div class="box" style="display:flex;flex-direction:column;gap:8px"><span class="chip p-colaborador" style="align-self:flex-start">Colaborador</span><p class="small">Cria demandas e atividades, atribui à outra instituição, move fases e passa a vez.</p></div>
      <div class="box" style="display:flex;flex-direction:column;gap:8px"><span class="chip p-coordenacao" style="align-self:flex-start">Coordenação</span><p class="small">Faz a triagem do que chega da outra instituição, designa responsáveis, convida pessoas e pactua decisões.</p></div>
      <div class="box" style="display:flex;flex-direction:column;gap:8px"><span class="chip p-administracao" style="align-self:flex-start">Administração</span><p class="small">Tudo o que a coordenação faz, nas duas instituições, e a gestão de perfis.</p></div>
    </div>
  </main>`;
}

// ------------------------------------------------------------------ notificações
export function pagNotificacoes(S) {
  const ns = S.notif;
  return hero({
    kick: 'O que mudou',
    titulo: 'Suas <b>notificações</b>',
    sub: 'Menções, passagens de vez, respostas de triagem e itens prontos para validação.',
    extra: ns.some((n) => !n.lida) ? '<button type="button" class="btn ghost" data-acao="ler-todas">Marcar todas como lidas</button>' : '',
  }) + `<main class="wrap"><section class="panel">
    ${ns.map((n) => {
      const x = n.item_id ? item(S, n.item_id) : null;
      return `<div class="nt${n.lida ? ' lida' : ''}"><span class="ponto"${n.lida ? '' : ' role="img" aria-label="Nova"'}></span>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
          <div>${e(n.texto)}</div><div class="small muted">${quando(n.criado_em)}</div>
          <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">${x ? `<button type="button" class="btn sm pri" data-acao="abrir-notif" data-id="${n.id}" data-item="${x.id}">Abrir</button>` : ''}${n.lida ? '' : `<button type="button" class="btn sm" data-acao="ler" data-id="${n.id}">Marcar como lida</button>`}</div>
        </div></div>`;
    }).join('') || '<div class="vazio">Nenhuma notificação.</div>'}
  </section></main>`;
}

// ------------------------------------------------------------------ ações
export const acoes = {
  async 'entrar-como'(S, el) { S.eu = await S.api.entrarComo(el.dataset.id); location.hash = '#/painel'; return { recarregar: true }; },
  async 'trocar-pessoa'(S) { await S.api.sair(); S.eu = null; location.hash = '#/acesso'; return {}; },
  async 'reiniciar-demo'(S) { S.api.reiniciarDemo(); return { recarregar: true, aviso: 'Exemplos restaurados.' }; },
  async sair(S) { await S.api.sair(); S.eu = null; location.hash = '#/acesso'; return {}; },
  async 'aba-acesso'(S, el) { S.abaAcesso = el.dataset.aba; return {}; },
  async filtro(S, el) { S.filtros[el.dataset.chave] = el.dataset.valor; return {}; },
  async fase(S, el) {
    await S.api.atualizarItem(Number(el.dataset.id), { fase: el.dataset.fase });
    return { recarregar: true, aviso: `Fase alterada para ${FASE[el.dataset.fase]}.` };
  },
  async 'aceitar-contraproposta'(S, el) {
    await S.api.responder(Number(el.dataset.id), 'aceitar_contraproposta');
    return { recarregar: true, aviso: 'Contraproposta aceita. A demanda voltou para a triagem do destino.' };
  },
  async pactuar(S, el) { await S.api.pactuar(Number(el.dataset.id), true); return { recarregar: true, aviso: 'De acordo registrado.' }; },
  async rejeitar(S, el) {
    if (!confirm('Rejeitar esta decisão? Ela sai da pauta.')) return {};
    await S.api.pactuar(Number(el.dataset.id), false);
    return { recarregar: true, aviso: 'Decisão rejeitada.' };
  },
  async ativo(S, el) {
    await S.api.atualizarMembro(el.dataset.id, { ativo: el.dataset.valor === '1' });
    return { recarregar: true, aviso: 'Situação do membro atualizada.' };
  },
  async ler(S, el) { await S.api.marcarLida(Number(el.dataset.id)); return { recarregar: true }; },
  async 'ler-todas'(S) { await S.api.marcarTodas(); return { recarregar: true }; },
  async 'abrir-notif'(S, el) { await S.api.marcarLida(Number(el.dataset.id)); location.hash = `#/item/${el.dataset.item}`; return { recarregar: true }; },
};

// ------------------------------------------------------------------ formulários
const txt = (fd, k) => (fd.get(k) || '').toString().trim();

export const formularios = {
  async entrar(S, fd) { S.eu = await S.api.entrar(txt(fd, 'email'), fd.get('senha')); location.hash = '#/painel'; return { recarregar: true }; },
  async cadastrar(S, fd) {
    const r = await S.api.cadastrar({ codigo: txt(fd, 'codigo'), nome: txt(fd, 'nome'), email: txt(fd, 'email'), senha: fd.get('senha') });
    if (r.confirmar) { S.abaAcesso = 'entrar'; return { aviso: 'Conta criada. Confirme o e-mail pelo link recebido e depois entre.' }; }
    S.eu = r.membro; location.hash = '#/painel';
    return { recarregar: true, aviso: 'Bem-vindo à plataforma.' };
  },
  async novo(S, fd) {
    const inst = S.eu.instituicao_id;
    const atribuir = fd.get('destino') === 'atribuir';
    const resp = txt(fd, 'responsavel') || null;
    const origem = txt(fd, 'origem');
    const dados = {
      tipo: txt(fd, 'tipo'), titulo: txt(fd, 'titulo'), descricao: txt(fd, 'descricao'), frente: txt(fd, 'frente'),
      modulo: txt(fd, 'modulo'), origem, prioridade: txt(fd, 'prioridade'), prazo: txt(fd, 'prazo') || null,
      instrumento: txt(fd, 'instrumento') || null, fase: 'priorizado',
      envolvidas: origem === 'CONJUNTA' ? ['INPE', 'ANPPEA'] : [inst],
      responsavel_id: atribuir ? null : resp, vez_instituicao: inst, vez_membro_id: atribuir ? null : resp,
    };
    const atr = atribuir ? {
      para_instituicao: outraParceira(inst), justificativa: dados.descricao,
      prazo_sugerido: dados.prazo, sugerido_membro_id: txt(fd, 'sugerido') || null,
    } : null;
    const it = await S.api.criarItem(dados, atr);
    location.hash = `#/item/${it.id}`;
    return { recarregar: true, aviso: atribuir ? 'Registrado e enviado para a triagem.' : 'Registrado.' };
  },
  async 'atribuir-novo'(S, fd) {
    const inst = S.eu.instituicao_id;
    const prazo = txt(fd, 'prazo') || null;
    await S.api.criarItem({
      tipo: 'demanda', titulo: txt(fd, 'titulo'), descricao: txt(fd, 'justificativa'), frente: txt(fd, 'frente'),
      modulo: txt(fd, 'modulo'), origem: inst, prioridade: txt(fd, 'prioridade'), prazo, fase: 'priorizado',
      envolvidas: [inst], vez_instituicao: inst,
    }, {
      para_instituicao: outraParceira(inst), justificativa: txt(fd, 'justificativa'),
      prazo_sugerido: prazo, sugerido_membro_id: txt(fd, 'sugerido') || null,
    });
    return { recarregar: true, aviso: `Demanda atribuída. A coordenação ${outraParceira(inst) === 'ANPPEA' ? 'da' : 'do'} ${outraParceira(inst)} foi avisada.`, limpar: true };
  },
  async 'atribuir-item'(S, fd, form) {
    const id = Number(form.dataset.id);
    await S.api.atribuir(id, {
      para_instituicao: outraParceira(S.eu.instituicao_id), justificativa: txt(fd, 'justificativa'),
      prazo_sugerido: txt(fd, 'prazo') || null, sugerido_membro_id: txt(fd, 'sugerido') || null,
    });
    location.hash = `#/item/${id}`;
    return { recarregar: true, aviso: 'Enviado para a triagem.' };
  },
  async responder(S, fd, form, quem) {
    const acao = quem?.value;
    await S.api.responder(Number(form.dataset.id), acao, {
      responsavel: txt(fd, 'responsavel') || null, prazo: txt(fd, 'prazo') || null, texto: txt(fd, 'texto') || null,
    });
    const msg = { aceitar: 'Demanda aceita e responsável designado.', contrapropor: 'Contraproposta enviada à origem.', devolver: 'Demanda devolvida à origem.' };
    return { recarregar: true, aviso: msg[acao] };
  },
  async 'passar-vez'(S, fd, form) {
    const [tipo, val] = txt(fd, 'destino').split(':');
    const patch = tipo === 'inst'
      ? { vez_instituicao: val, vez_membro_id: null, vez_nota: txt(fd, 'nota') }
      : { vez_instituicao: membro(S, val).instituicao_id, vez_membro_id: val, vez_nota: txt(fd, 'nota') };
    await S.api.atualizarItem(Number(form.dataset.id), patch);
    return { recarregar: true, aviso: 'A vez foi passada e a pessoa foi avisada.' };
  },
  async ajustar(S, fd, form) {
    await S.api.atualizarItem(Number(form.dataset.id), {
      responsavel_id: txt(fd, 'responsavel') || null, prazo: txt(fd, 'prazo') || null,
      prioridade: txt(fd, 'prioridade'), envolvidas: fd.getAll('envolvidas'),
    });
    return { recarregar: true, aviso: 'Ajustes salvos.' };
  },
  async comentar(S, fd, form) {
    const id = Number(form.dataset.id);
    const texto = txt(fd, 'texto');
    const proposta = !!fd.get('proposta');
    await S.api.comentar(id, texto, proposta);
    if (proposta) {
      await S.api.proporDecisao({ titulo: item(S, id).titulo, descricao: texto, item_id: id });
    }
    return { recarregar: true, aviso: proposta ? 'Comentário publicado e levado à pauta do Comitê.' : 'Comentário publicado.' };
  },
  async propor(S, fd) {
    await S.api.proporDecisao({
      titulo: txt(fd, 'titulo'), descricao: txt(fd, 'descricao'), forum: txt(fd, 'forum'),
      data_pauta: txt(fd, 'data_pauta') || null, item_id: txt(fd, 'item_id') ? Number(fd.get('item_id')) : null,
    });
    return { recarregar: true, aviso: 'Decisão colocada em pauta.' };
  },
  async convidar(S, fd) {
    S.ultimoConvite = await S.api.convidar({
      email: txt(fd, 'email').toLowerCase(), instituicao_id: txt(fd, 'instituicao_id'),
      perfil: txt(fd, 'perfil'), papel: txt(fd, 'papel') || null,
    });
    return { recarregar: true, aviso: 'Convite gerado.' };
  },
  async perfil(S, fd, form) {
    await S.api.atualizarMembro(form.dataset.id, { perfil: txt(fd, 'perfil') });
    return { recarregar: true, aviso: 'Perfil atualizado.' };
  },
};
