// Telas da plataforma. Cada página devolve HTML; as ações ficam em
// `acoes` (cliques em [data-acao]) e `formularios` (envios de form[data-form]).
import {
  e, FASES, FASE, FRENTES, FRENTE, TIPO, PRIORIDADE, PERFIL, SIT_ATRIB, PARCEIRAS, LOGO,
  hojeISO, somarDias, dataCurta, dataLonga, quando, diasAte, diasUteisDesde, aberto, situacaoPrazo,
  siglaDe, avatar, podeEditar, ehAdmin, coordenaDe, podeEditarItem, outraParceira,
  LIMITE_MB, tamanhoFmt, duracaoFmt, extensao, youtubeId, linkSeguro, podeGithub, podeExcluirItem,
} from './util.js?v=20261016e';

// ------------------------------------------------------------------ apoio
const membro = (S, id) => S.d.membros.find((m) => m.id === id);
const item = (S, id) => S.d.itens.find((i) => i.id === Number(id));
const nomeDe = (S, id) => membro(S, id)?.nome || '—';
// Destaques da Síntese: coordenação e administração
const podeDestacar = (eu) => ['coordenacao', 'administracao'].includes(eu?.perfil);
// Autor de um evento do histórico: eventos sem autor vêm da sincronização com o GitHub
const autorAv = (S, ev, extra = '') => (ev.autor_id ? avatar(membro(S, ev.autor_id), extra)
  : `<span class="av gh ${extra}" title="GitHub" aria-hidden="true">${svg('issue', 15)}</span>`);
const autorNome = (S, ev) => (ev.autor_id ? nomeDe(S, ev.autor_id) : 'GitHub');
const GH_ESTADO = { aberta: ['Aberta', 'wait'], fechada: ['Fechada', 'ok'], descartada: ['Encerrada sem execução', 'cinza'] };
const ativos = (S, inst) => S.d.membros.filter((m) => m.ativo && (!inst || m.instituicao_id === inst));
const executores = (S, inst) => ativos(S, inst).filter((m) => m.perfil !== 'leitor');
const souParceira = (S) => PARCEIRAS.includes(S.eu.instituicao_id);
const atribAberta = (S, itemId) => S.d.atribuicoes.find((a) => a.item_id === itemId && ['aguardando', 'contraproposta'].includes(a.situacao));
const daDo = (inst) => (inst === 'ANPPEA' ? 'da' : 'do');
const aAo = (inst) => (inst === 'ANPPEA' ? 'à' : 'ao');
const corInst = (inst) => (inst === 'INPE' ? 'var(--inpe)' : inst === 'ANPPEA' ? 'var(--anppea)' : '#8792A2');
const FRENTE_CURTA = {
  desenvolvimento: 'Desenvolvimento', operacao: 'Operação', dados: 'Dados', comunidades: 'Comunidades',
  formacao: 'Formação', infraestrutura: 'Infraestrutura', gestao: 'Gestão',
};

function podeAtribuir(S, it) {
  return souParceira(S) && podeEditar(S.eu) && aberto(it) && !atribAberta(S, it.id)
    && (it.origem === S.eu.instituicao_id || it.origem === 'CONJUNTA' || it.vez_instituicao === S.eu.instituicao_id);
}

function tag(inst, txt) {
  const c = inst === 'INPE' ? 'inpe' : inst === 'ANPPEA' ? 'anppea' : inst === 'CONJUNTA' ? 'conj' : 'ext';
  return `<span class="tag ${c}">${e(txt ?? siglaDe(inst))}</span>`;
}
function stPrazo(it, sempre = true) {
  const s = situacaoPrazo(it);
  if (s) return `<span class="st ${s.cls}">${e(s.txt)}</span>`;
  if (sempre && it.prazo) return `<span class="st ok">${dataCurta(it.prazo)}</span>`;
  return '';
}
const opcoes = (pares, sel) => pares.map(([v, t]) => `<option value="${e(v)}"${v === sel ? ' selected' : ''}>${e(t)}</option>`).join('');

const ICONE = {
  sintese: '<path d="M4 20V11"></path><path d="M10 20V5"></path><path d="M16 20v-7"></path><path d="M21 20H3"></path>',
  estrela: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"></path>',
  envelope: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3.5 6.5 8.5 6.5 8.5-6.5"></path>',
  sair: '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"></path><path d="M15 8l4 4-4 4"></path><path d="M19 12H9"></path>',
  cadeado: '<rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>',
  github: '<circle cx="12" cy="12" r="8.5"></circle><circle cx="12" cy="12" r="1.8" fill="currentColor"></circle>',
  issue: '<circle cx="12" cy="12" r="8.5"></circle><circle cx="12" cy="12" r="1.8" fill="currentColor"></circle>',
  painel: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"></path>',
  quadro: '<rect x="3" y="4" width="5" height="16" rx="1.5"></rect><rect x="10" y="4" width="5" height="11" rx="1.5"></rect><rect x="17" y="4" width="4" height="7" rx="1.5"></rect>',
  triagem: '<path d="M3 13h5l2 3h4l2-3h5"></path><path d="M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z"></path>',
  decisoes: '<rect x="3" y="3" width="18" height="18" rx="3"></rect><path d="m8.5 12 2.5 2.5 4.5-5"></path>',
  equipe: '<circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20a6.5 6.5 0 0 1 13 0"></path><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2A6 6 0 0 1 21.5 20"></path>',
  mais: '<path d="M12 5v14M5 12h14"></path>',
  sino: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>',
  busca: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>',
  clipe: '<path d="m21.4 11.6-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l8.5-8.5a3.7 3.7 0 0 1 5.2 5.2l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6l7.8-7.8"></path>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0M12 18v3"></path>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"></path><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"></path>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"></path>',
};
const svg = (k, t = 18) => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONE[k]}</svg>`;

// Cabeçalho de página
function cab({ crumb = '', titulo, sub = '', tags = '', acoes = '' }) {
  return `<div class="ph"><div class="txt">
    ${crumb ? `<div class="crumb">${crumb}</div>` : ''}
    <h1>${titulo}</h1>
    ${sub ? `<p class="sub">${sub}</p>` : ''}
    ${tags ? `<div class="tags">${tags}</div>` : ''}
  </div>${acoes ? `<div class="acoes-ph">${acoes}</div>` : ''}</div>`;
}
const cartao = (titulo, corpo, extra = '', attrs = '') =>
  `<section class="card"${attrs}><div class="ch"><h2>${titulo}</h2>${extra}</div>${corpo}</section>`;

// "Realização: INPE e ANPPEA" — sempre sobre fundo branco
const realizacao = () => `<div class="real" role="img" aria-label="Realização: INPE e ANPPEA">
  <span>Realização</span><img class="r-inpe" src="${LOGO.INPE}" alt=""><img class="r-anppea" src="${LOGO.ANPPEA}" alt=""></div>`;

// ------------------------------------------------------------------ moldura
export function moldura(S, rota, conteudo) {
  const inst = S.eu.instituicao_id;
  const nTriagem = S.d.atribuicoes.filter((a) =>
    (a.para_instituicao === inst && a.situacao === 'aguardando') || (a.de_instituicao === inst && a.situacao === 'contraproposta')).length;
  const nPauta = S.d.decisoes.filter((d) => d.situacao === 'em_pauta').length;
  const nNotif = S.notif.filter((n) => !n.lida).length;
  const ativa = rota === 'item' ? 'quadro' : rota;
  const nGithub = S.d.githubAtivo && podeGithub(S.eu) ? issuesParaAvaliar(S).length : 0;
  const ghLink = !S.d.githubAtivo ? '' : podeGithub(S.eu)
    ? `<a class="nv-gh${ativa === 'github' ? ' on' : ''}" href="#/github"${ativa === 'github' ? ' aria-current="page"' : ''}>${svg('issue', 15)}Issues · GitHub${nGithub ? `<span class="ct">${nGithub}</span>` : ''}</a>`
    : `<span class="nv-gh off" aria-disabled="true" title="Disponível para a equipe do INPE">${svg('cadeado', 15)}Issues · GitHub</span>`;
  const nv = (r, t, n = 0, quente = false) => `<a class="nv${ativa === r ? ' on' : ''}" href="#/${r}"${ativa === r ? ' aria-current="page"' : ''}>${svg(r)}${t}${n ? `<span class="ct${quente ? ' hot' : ''}">${n}</span>` : ''}</a>`;
  return `<div class="app">
  <aside class="side" aria-label="Menu">
    <a class="brand" href="#/painel"><img src="${LOGO.MONITORAEA}" alt="MonitoraEA, página inicial"><span>Governança compartilhada</span></a>
    ${podeEditar(S.eu) ? `<a class="newbtn${rota === 'novo' ? ' on' : ''}" href="#/novo">${svg('mais', 16)}Novo registro</a>` : ''}
    <nav aria-label="Navegação principal">
      ${nv('painel', 'Painel')}${nv('sintese', 'Síntese')}${nv('quadro', 'Quadro', S.d.itens.filter(aberto).length)}${nv('triagem', 'Triagem', nTriagem, true)}${nv('decisoes', 'Decisões', nPauta)}${nv('equipe', 'Equipe')}
    </nav>
    ${ghLink ? `<div class="ext-gh"><span class="ext-t">Desenvolvimento</span>${ghLink}</div>` : ''}
    <div class="foot">
      <div class="me">${avatar(S.eu, 'eu')}<div class="me-t"><span title="${e(S.eu.nome)}">${e(S.eu.nome)}</span><small>${e(siglaDe(inst))}, ${e(PERFIL[S.eu.perfil].toLowerCase())}</small></div>
        <button type="button" class="sair" data-acao="sair" aria-label="Sair da plataforma" title="Sair">${svg('sair', 17)}</button></div>
    </div>
  </aside>
  <div class="main">
    ${S.api.modo === 'demo' ? `<div class="demo-faixa">Modo demonstração: dados de exemplo guardados só neste navegador. <button type="button" data-acao="trocar-pessoa">Trocar de pessoa</button> <button type="button" data-acao="reiniciar-demo">Restaurar exemplos</button></div>` : ''}
    <header class="bar">
      <form class="busca" data-form="buscar" role="search">${svg('busca', 16)}<label class="oculto" for="busca-q">Buscar</label><input id="busca-q" name="q" type="search" placeholder="Buscar itens, processos ou pessoas" value="${e(S.filtros.q || '')}"></form>
      ${realizacao()}
      <a class="sino${rota === 'notificacoes' ? ' on' : ''}" href="#/notificacoes" aria-label="Avisos${nNotif ? `, ${nNotif} novos` : ''}">${svg('sino', 20)}${nNotif ? `<span class="n">${nNotif}</span>` : ''}</a>
    </header>
    ${conteudo}
  </div>
  </div>`;
}

// ------------------------------------------------------------------ acesso
const origem = () => `<figure class="origem" role="img" aria-label="MonitoraEA, realização INPE e ANPPEA">
  <img class="o-mon" src="${LOGO.MONITORAEA}" alt="">
  <div class="o-real" aria-hidden="true"><span></span><b>Realização</b><span></span></div>
  <div class="o-inst"><img class="o-inpe" src="${LOGO.INPE}" alt=""><img class="o-anppea" src="${LOGO.ANPPEA}" alt=""></div>
</figure>`;

export function pagAcesso(S) {
  const aba = S.abaAcesso || 'entrar';
  let corpo;
  if (S.api.modo === 'demo') {
    const grupo = (inst, t) => {
      const ms = S.api.demoMembros().filter((m) => (inst ? m.instituicao_id === inst : !PARCEIRAS.includes(m.instituicao_id)));
      return `<div class="grupo">${t}</div>` + ms.map((m) =>
        `<button type="button" data-acao="entrar-como" data-id="${e(m.id)}">${avatar(m)}<span><b style="font-weight:500">${e(m.nome)}</b><br><span class="hint">${e(PERFIL[m.perfil])} · ${e(m.papel || '')}</span></span></button>`).join('');
    };
    corpo = `<div><h2>Modo demonstração</h2><p class="hint" style="font-size:14px;margin-top:4px">Escolha uma pessoa para ver a plataforma com o perfil dela. Os dados são exemplos e ficam só neste navegador.</p></div>
      <div class="lista-demo">${grupo('INPE', 'INPE')}${grupo('ANPPEA', 'ANPPEA')}${grupo(null, 'Convidados externos')}</div>`;
  } else {
    corpo = `<div><h2>${aba === 'entrar' ? 'Entrar' : 'Ativar seu acesso'}</h2><p class="hint" style="font-size:14px;margin-top:4px">${aba === 'entrar' ? 'Use o e-mail e a senha que você criou.' : 'Use o código que a coordenação enviou para você.'}</p></div>
      <div class="tabs" role="tablist" aria-label="Tipo de acesso">
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
        <div class="f"><label for="cv-cod">Código do convite</label><input id="cv-cod" name="codigo" type="text" required autocomplete="off" placeholder="XXXX-XXXX"></div>
        <div class="f"><label for="cv-email">E-mail do convite</label><input id="cv-email" name="email" type="email" required autocomplete="username"></div>
        <div class="f"><label for="cv-nome">Seu nome</label><input id="cv-nome" name="nome" type="text" required></div>
        <div class="f"><label for="cv-senha">Crie uma senha</label><input id="cv-senha" name="senha" type="password" minlength="10" required autocomplete="new-password"><span class="hint">Pelo menos 10 caracteres</span></div>
        <label class="hint" style="display:flex;gap:10px;align-items:flex-start;font-size:13px"><input type="checkbox" name="termo" required style="margin-top:4px">Aceito o termo de uso e o compromisso de registrar aqui as demandas entre as instituições</label>
        <button class="btn pri" type="submit">Ativar acesso</button>
      </form>`}`;
  }
  return `<div class="acesso">
    <section class="a-esq"><h1>Governança compartilhada do MonitoraEA</h1><p>Onde as equipes do INPE e da ANPPEA registram, atribuem e acompanham o desenvolvimento e a operação do sistema.</p></section>
    <section class="a-dir">${origem()}<div class="a-form">${corpo}</div></section>
  </div>`;
}

// ------------------------------------------------------------------ painel
export function pagPainel(S) {
  const ab = S.d.itens.filter(aberto);
  const inst = S.eu.instituicao_id;
  const atrasado = (x) => x.prazo && diasAte(x.prazo) < 0;
  const triagemMinha = S.d.atribuicoes.filter((a) => a.para_instituicao === inst && a.situacao === 'aguardando');
  const comigo = ab.filter((x) => x.vez_membro_id === S.eu.id || (!x.vez_membro_id && x.vez_instituicao === inst && coordenaDe(S.eu, inst)));
  const h = new Date().getHours();
  const saud = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';

  const nVez = (i) => ab.filter((x) => x.vez_instituicao === i).length;
  const nOutros = ab.filter((x) => !PARCEIRAS.includes(x.vez_instituicao)).length;
  const resumo = (i) => {
    const xs = ab.filter((x) => x.vez_instituicao === i);
    const partes = [
      [xs.filter((x) => x.fase === 'andamento').length, 'em andamento'],
      [xs.filter((x) => x.fase === 'triagem').length, 'na triagem'],
      [xs.filter((x) => x.fase === 'validacao').length, 'em validação'],
      [xs.filter(atrasado).length, xs.filter(atrasado).length === 1 ? 'atrasado' : 'atrasados'],
    ].filter(([n]) => n).map(([n, t]) => `${n} ${t}`);
    return partes.length ? partes.join(', ') : 'nada pendente';
  };

  const frentes = FRENTES.map(([k, t]) => {
    const xs = ab.filter((x) => x.frente === k);
    if (!xs.length) return '';
    const p = (o) => (100 * xs.filter((x) => x.origem === o).length) / xs.length;
    return `<div><div style="display:flex;justify-content:space-between" class="sm"><span>${e(t)}</span><b style="font-weight:600">${xs.length}</b></div>
      <div class="fbar"><span style="width:${p('INPE')}%;background:var(--inpe)"></span><span style="width:${p('ANPPEA')}%;background:var(--anppea)"></span><span style="width:${p('CONJUNTA')}%;background:#C9D3DF"></span></div></div>`;
  }).join('');

  const prazos = [
    ...ab.filter((x) => x.prazo && diasAte(x.prazo) >= -7 && diasAte(x.prazo) <= 21).map((x) => ({ d: x.prazo, t: x.titulo, href: `#/item/${x.id}`, late: diasAte(x.prazo) < 0 })),
    ...S.d.decisoes.filter((d) => d.situacao === 'em_pauta' && d.data_pauta).map((d) => ({ d: d.data_pauta, t: `Comitê: ${d.titulo}`, href: '#/decisoes' })),
  ].sort((a, b) => a.d.localeCompare(b.d)).slice(0, 6);

  const processos = ab.filter((x) => x.tipo === 'processo');
  const ent = (x) => `<div class="row"><div style="flex:1;min-width:0"><a href="#/item/${x.id}" style="font-weight:500">${e(x.titulo)}</a><div class="xs muted">${e(x.vez_nota || FASE[x.fase])}</div></div>${tag(x.origem)}${stPrazo(x)}</div>`;

  return `<main class="page">
    ${cab({
      titulo: `${saud}, ${e(S.eu.nome.split(' ')[0])}`,
      sub: `${comigo.length ? `Há ${comigo.length} ${comigo.length === 1 ? 'item esperando' : 'itens esperando'} por você` : 'Nada esperando por você agora'}${souParceira(S) ? ` e ${triagemMinha.length} ${triagemMinha.length === 1 ? 'demanda' : 'demandas'} na triagem ${daDo(inst)} ${e(siglaDe(inst))}` : ''}.`,
      acoes: '<a class="btn" href="#/quadro">Abrir o quadro</a>',
    })}

    ${cartao('Com quem está a próxima ação', `<div class="cp" style="display:flex;flex-direction:column;gap:14px">
      <div class="balanca" role="img" aria-label="INPE com ${nVez('INPE')} itens, ANPPEA com ${nVez('ANPPEA')}, outros com ${nOutros}">
        ${nVez('INPE') ? `<div style="flex:${nVez('INPE')};background:var(--inpe);color:#fff">INPE<span>${nVez('INPE')}</span></div>` : ''}
        ${nVez('ANPPEA') ? `<div style="flex:${nVez('ANPPEA')};background:var(--anppea);color:#3A2600">ANPPEA<span>${nVez('ANPPEA')}</span></div>` : ''}
        ${nOutros ? `<div style="flex:${nOutros};background:#C9D3DF;color:var(--ink);padding:0 12px;font-size:13px">${nOutros}</div>` : ''}
      </div>
      <div style="display:flex;gap:24px;flex-wrap:wrap" class="sm muted"><span>INPE: ${resumo('INPE')}</span><span>ANPPEA: ${resumo('ANPPEA')}</span>${nOutros ? `<span>Órgãos externos e comitê: ${nOutros}</span>` : ''}</div>
    </div>`, `<span class="muted sm">${ab.length} itens abertos</span>`)}

    <div class="stats">
      <div class="card stat"><b>${ab.length}</b><span>itens abertos</span></div>
      <a class="card stat" href="#/triagem"><b>${triagemMinha.length}</b><span>na triagem ${daDo(inst)} ${e(siglaDe(inst))}</span></a>
      <div class="card stat"><b>${ab.filter((x) => x.prazo && diasAte(x.prazo) >= 0 && diasAte(x.prazo) <= 15).length}</b><span>prazos nos próximos 15 dias</span></div>
      <div class="card stat"><b style="color:var(--verm)">${ab.filter(atrasado).length}</b><span>itens atrasados</span></div>
    </div>

    <div class="duas">
      <div class="principal">
        ${cartao('Esperando por você', comigo.length ? `<div class="cb">${comigo.map(ent).join('')}</div>` : '<p class="vazio">Nada esperando por você.</p>', `<span class="muted sm">${comigo.length}</span>`)}
        ${cartao('Processos em negociação', processos.length ? `<div class="tbl"><table>
          <thead><tr><th>Processo</th><th>Origem</th><th>Fase</th><th>Próxima ação</th><th>Prazo</th></tr></thead>
          <tbody>${processos.map((x) => `<tr><td><a href="#/item/${x.id}" style="font-weight:500">${e(x.titulo)}</a>${x.instrumento ? `<div class="xs muted">${e(x.instrumento)}</div>` : ''}</td>
            <td>${tag(x.origem)}</td><td class="sm">${e(FASE[x.fase])}</td>
            <td class="sm">${e(siglaDe(x.vez_instituicao))}${x.vez_nota ? `, ${e(x.vez_nota.toLowerCase())}` : ''}</td><td>${stPrazo(x) || '<span class="muted">—</span>'}</td></tr>`).join('')}</tbody></table></div>`
          : '<p class="vazio">Nenhum processo em negociação.</p>', '<a class="sm" href="#/quadro">Ver no quadro</a>')}
      </div>
      <div class="lateral">
        ${cartao('Próximos prazos', prazos.length ? `<div class="cb">${prazos.map((p) => `<div class="row"><div class="dt"><b${p.late ? ' style="color:var(--verm)"' : ''}>${p.d.slice(8, 10)}</b><span>${dataCurta(p.d).split(' ').pop()}</span></div><a class="sm" href="${p.href}" style="color:var(--ink)">${e(p.t)}</a></div>`).join('')}</div>` : '<p class="vazio">Nada nas próximas semanas.</p>')}
        ${cartao('Frentes do sistema', `<div class="cp" style="display:flex;flex-direction:column;gap:14px">${frentes || '<p class="muted sm">Sem itens abertos.</p>'}
          <div class="legenda"><span><i style="background:var(--inpe)"></i>INPE</span><span><i style="background:var(--anppea)"></i>ANPPEA</span><span><i style="background:#C9D3DF"></i>Conjunta</span></div></div>`)}
        ${cartao('Atividade recente', `<div class="cb">${S.d.eventosRecentes.slice(0, 6).map((ev) => {
          const x = item(S, ev.item_id);
          return `<div class="row top">${autorAv(S, ev)}<div class="sm" style="min-width:0"><b style="font-weight:500">${e(autorNome(S, ev))}</b> ${e(/^[A-ZÀ-Ú][a-zà-ú]/.test(ev.detalhe) ? ev.detalhe.charAt(0).toLowerCase() + ev.detalhe.slice(1) : ev.detalhe)}${x ? ` em <a href="#/item/${x.id}">${e(x.titulo)}</a>` : ''}<div class="xs muted">${quando(ev.criado_em)}</div></div></div>`;
        }).join('') || '<p class="vazio">Sem atividade ainda.</p>'}</div>`)}
      </div>
    </div>
  </main>`;
}

// ------------------------------------------------------------------ quadro
export function pagQuadro(S) {
  const fil = S.filtros;
  let base = S.d.itens.filter((x) => x.fase !== 'arquivado');
  base = base.filter((x) => x.fase !== 'publicado' || !x.concluido_em || diasAte(x.concluido_em.slice(0, 10)) >= -30);
  const q = (fil.q || '').trim().toLowerCase();
  if (q) {
    base = base.filter((x) => [x.titulo, x.descricao, x.modulo, x.instrumento, nomeDe(S, x.responsavel_id),
      x.github_numero ? `#${x.github_numero}` : '', ...(x.github_etiquetas || []), ...(x.github_atribuidos || [])]
      .some((v) => String(v || '').toLowerCase().includes(q)));
  }
  const porOrigem = fil.origem === 'todas' ? base : base.filter((x) => x.origem === fil.origem);
  const vis = fil.frente === 'todas' ? porOrigem : porOrigem.filter((x) => x.frente === fil.frente);
  const conta = (k) => porOrigem.filter((x) => (k === 'todas' || x.frente === k) && aberto(x)).length;
  const nAnx = S.d.anexosPorItem || {};

  const card = (x) => {
    const s = situacaoPrazo(x);
    return `<a class="kc ${e(x.origem)}${aberto(x) ? '' : ' feito'}" href="#/item/${x.id}">
      <span class="inst ${e(x.origem)}">${e(siglaDe(x.origem))} · ${e(FRENTE_CURTA[x.frente] || '')}</span>
      <span class="kt">${e(x.titulo)}</span>
      <div class="km">${aberto(x) ? `
        ${x.responsavel_id ? avatar(membro(S, x.responsavel_id), 'p') : ''}
        ${x.prazo ? `<span class="${s ? s.cls : ''}">${s ? e(s.txt) : dataCurta(x.prazo)}</span>` : ''}
        ${nAnx[x.id] ? `<span class="clip" title="${nAnx[x.id]} anexos">${svg('clipe', 13)}${nAnx[x.id]}</span>` : ''}
        ${x.github_numero ? `<span class="clip" title="Issue #${x.github_numero} no GitHub">${svg('issue', 12)}#${x.github_numero}</span>` : ''}
        <span class="vezp"><i style="background:${corInst(x.vez_instituicao)}"></i>${e(siglaDe(x.vez_instituicao))}</span>`
      : `<span>Publicado em ${dataCurta(x.concluido_em || x.atualizado_em)}</span>`}</div>
    </a>`;
  };

  return `<main class="page wide">
    ${cab({
      titulo: 'Quadro do sistema',
      sub: 'Desenvolvimento e operação do MonitoraEA. A cor do card indica quem originou o item; o ponto no rodapé, com quem está a próxima ação.',
      acoes: podeEditar(S.eu) ? '<a class="btn pri" href="#/novo">Nova demanda</a>' : '',
    })}
    ${q ? `<div class="sm">Resultados para <b>“${e(fil.q)}”</b>: ${vis.length} ${vis.length === 1 ? 'item' : 'itens'}. <button type="button" class="lnk" data-acao="limpar-busca">Limpar busca</button></div>` : ''}
    <div class="filtros">
      ${[['todas', 'Todas as frentes'], ...FRENTES.map(([k]) => [k, FRENTE_CURTA[k]])].map(([k, t]) =>
        `<button type="button" class="chipf${fil.frente === k ? ' on' : ''}" aria-pressed="${fil.frente === k}" data-acao="filtro" data-chave="frente" data-valor="${k}">${e(t)} <b>${conta(k)}</b></button>`).join('')}
      <span class="esp"></span>
      <div class="seg" role="group" aria-label="Origem">${[['todas', 'Todas'], ['INPE', 'INPE'], ['ANPPEA', 'ANPPEA'], ['CONJUNTA', 'Conjuntas']].map(([k, t]) =>
        `<button type="button" class="${fil.origem === k ? 'on' : ''}" aria-pressed="${fil.origem === k}" data-acao="filtro" data-chave="origem" data-valor="${k}">${t}</button>`).join('')}</div>
    </div>
    <div class="board">
      ${FASES.map(([f, t]) => {
        const xs = vis.filter((x) => x.fase === f);
        return `<section class="col" aria-label="${e(t)}"><div class="colh">${f === 'triagem' ? `<a href="#/triagem">${t}</a>` : t}<span>${xs.length}</span></div>${xs.map(card).join('')}</section>`;
      }).join('')}
    </div>
  </main>`;
}

// ------------------------------------------------------------------ triagem
export function pagTriagem(S) {
  const inst = S.eu.instituicao_id;
  const outra = outraParceira(inst);
  const aba = S.filtros.triagem || 'recebidas';
  const souCoord = coordenaDe(S.eu, inst);
  const envolve = (a) => a.para_instituicao === inst || a.de_instituicao === inst || ehAdmin(S.eu);
  const grupos = {
    recebidas: S.d.atribuicoes.filter((a) => a.para_instituicao === inst && a.situacao === 'aguardando'),
    enviadas: S.d.atribuicoes.filter((a) => a.de_instituicao === inst && a.situacao === 'aguardando'),
    contra: S.d.atribuicoes.filter((a) => a.situacao === 'contraproposta' && envolve(a)),
    historico: S.d.atribuicoes.filter((a) => ['aceita', 'devolvida'].includes(a.situacao) && envolve(a)),
  };
  const relogio = (a) => {
    const rest = 5 - diasUteisDesde(a.criado_em);
    return `<span class="st ${rest <= 1 ? 'late' : 'wait'}" style="margin-left:auto">${rest > 0 ? `${rest} ${rest === 1 ? 'dia útil' : 'dias úteis'} para responder` : 'Prazo de resposta vencido'}</span>`;
  };
  const cls = { aguardando: 'wait', aceita: 'ok', contraproposta: 'warn', devolvida: 'late' };

  const pedido = (a) => {
    const x = item(S, a.item_id);
    if (!x) return '';
    let fim = '';
    if (aba === 'recebidas') {
      fim = souCoord ? `<details class="resp-d"><summary class="btn sm pri" style="align-self:flex-start">Responder</summary>
        <form class="resp" data-form="responder" data-id="${a.id}" style="margin-top:12px">
          <div class="g2">
            <div class="f"><label for="r-resp-${a.id}">Responsável ${daDo(inst)} ${e(siglaDe(inst))}</label><select id="r-resp-${a.id}" name="responsavel"><option value="">Escolha (para aceitar)</option>${opcoes(executores(S, inst).map((m) => [m.id, m.nome]), a.sugerido_membro_id)}</select></div>
            <div class="f"><label for="r-prazo-${a.id}">Prazo</label><input id="r-prazo-${a.id}" name="prazo" type="date" value="${e(a.prazo_sugerido || '')}"></div>
          </div>
          <div class="f"><label for="r-txt-${a.id}">Comentário (obrigatório para devolver)</label><textarea id="r-txt-${a.id}" name="texto" rows="2"></textarea></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn sm pri" type="submit" name="acao" value="aceitar">Aceitar e designar</button>
            <button class="btn sm alerta" type="submit" name="acao" value="contrapropor">Contrapropor</button>
            <button class="btn sm perigo" type="submit" name="acao" value="devolver">Devolver</button>
          </div>
        </form></details>` : `<p class="hint">A coordenação ${daDo(inst)} ${e(siglaDe(inst))} responde a esta demanda.</p>`;
    } else if (aba === 'contra') {
      fim = `<p class="sm">${e(siglaDe(a.para_instituicao))} propõe ${a.prazo_contraproposto ? `prazo de ${dataLonga(a.prazo_contraproposto)}` : 'ajuste de escopo'}${a.resposta ? `: ${e(a.resposta)}` : ''}</p>
        ${a.de_instituicao === inst && podeEditar(S.eu) ? `<div><button type="button" class="btn sm pri" data-acao="aceitar-contraproposta" data-id="${a.id}">Aceitar contraproposta</button></div>` : `<p class="hint">Aguardando a avaliação ${daDo(a.de_instituicao)} ${e(siglaDe(a.de_instituicao))}.</p>`}`;
    } else if (aba === 'historico') {
      fim = `<p class="sm"><span class="st ${cls[a.situacao]}">${e(SIT_ATRIB[a.situacao])}</span>${a.resposta ? ` <span class="muted">· ${e(a.resposta)}</span>` : ''}</p>`;
    }
    return `<div class="req">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${tag(a.de_instituicao, `De ${siglaDe(a.de_instituicao)}`)}${tag(a.para_instituicao, `Para ${siglaDe(a.para_instituicao)}`)}<span class="xs muted">${e(nomeDe(S, a.criado_por))}, ${quando(a.criado_em)}</span>${a.situacao === 'aguardando' ? relogio(a) : ''}</div>
      <a class="tit" href="#/item/${x.id}">${e(x.titulo)}</a>
      ${a.justificativa ? `<p class="sm muted">${e(a.justificativa)}</p>` : ''}
      ${a.prazo_sugerido ? `<p class="xs muted">Prazo sugerido: ${dataLonga(a.prazo_sugerido)}${a.sugerido_membro_id ? ` · sugere ${e(nomeDe(S, a.sugerido_membro_id))}` : ''}</p>` : ''}
      ${fim}
    </div>`;
  };

  const rotulos = { recebidas: `Recebidas ${daDo(inst)} ${siglaDe(inst)}`, enviadas: `Enviadas ${aAo(outra)} ${outra}`, contra: 'Contrapropostas', historico: 'Histórico' };
  const vazio = { recebidas: 'Nenhuma demanda aguardando a sua triagem.', enviadas: 'Nenhuma demanda enviada aguardando resposta.', contra: 'Nenhuma contraproposta em aberto.', historico: 'Nenhuma resposta registrada ainda.' };

  return `<main class="page">
    ${cab({ titulo: 'Triagem', sub: 'Demandas que uma instituição atribui à outra. Ninguém recebe trabalho sem aceitar: a coordenação de destino responde em até 5 dias úteis.' })}
    ${souParceira(S) ? `<div class="tabs" role="tablist" aria-label="Filtro da triagem">${Object.entries(rotulos).map(([k, t]) =>
      `<button type="button" role="tab" class="${aba === k ? 'on' : ''}" aria-selected="${aba === k}" data-acao="filtro" data-chave="triagem" data-valor="${k}">${e(t)}${k !== 'historico' ? `<b>${grupos[k].length}</b>` : ''}</button>`).join('')}</div>` : ''}
    <div class="duas">
      <section class="card principal" style="gap:0" aria-label="${e(rotulos[aba])}">${grupos[aba].map(pedido).join('') || `<p class="vazio">${vazio[aba]}</p>`}</section>
      <div class="lateral">
        ${souParceira(S) && podeEditar(S.eu) ? cartao(`Atribuir ${aAo(outra)} ${outra}`, `<form class="form cp" data-form="atribuir-novo">
          <div class="f"><label for="an-tit">O que se pede</label><input id="an-tit" name="titulo" type="text" required minlength="3"></div>
          <div class="f"><label for="an-jus">Por que é necessário</label><textarea id="an-jus" name="justificativa" rows="3"></textarea></div>
          <div class="g2" style="grid-template-columns:1fr 1fr">
            <div class="f"><label for="an-fr">Frente</label><select id="an-fr" name="frente">${opcoes(FRENTES)}</select></div>
            <div class="f"><label for="an-pz">Prazo sugerido</label><input id="an-pz" name="prazo" type="date" value="${somarDias(hojeISO(), 21)}"></div>
          </div>
          <div class="f"><label for="an-sug">Sugerir alguém ${daDo(outra)} ${outra} (opcional)</label><select id="an-sug" name="sugerido"><option value="">A coordenação decide</option>${opcoes(executores(S, outra).map((m) => [m.id, m.nome]))}</select></div>
          <p class="xs muted">Vai para a coordenação ${daDo(outra)} ${outra} e só entra na carga dela depois de aceito.</p>
          <button class="btn pri" type="submit">Atribuir ${aAo(outra)} ${outra}</button>
        </form>`) : ''}
        ${cartao('Como funciona', `<div class="cp sm" style="display:flex;flex-direction:column;gap:14px">
          <div class="passo"><span>1</span><p>A origem descreve o pedido e sugere um prazo.</p></div>
          <div class="passo"><span>2</span><p>A coordenação de destino tem 5 dias úteis para responder.</p></div>
          <div class="passo"><span>3</span><p>Ela aceita e designa alguém, contrapropõe prazo ou devolve com justificativa.</p></div>
          <div class="passo"><span>4</span><p>Na entrega, a origem valida o resultado.</p></div></div>`)}
      </div>
    </div>
    ${cartao('Todas as atribuições', S.d.atribuicoes.length ? `<div class="tbl"><table>
      <thead><tr><th>Demanda</th><th>De</th><th>Para</th><th>Situação</th><th>Responsável</th><th>Prazo</th></tr></thead>
      <tbody>${S.d.atribuicoes.map((a) => {
        const x = item(S, a.item_id);
        const prazo = a.situacao === 'contraproposta' && a.prazo_contraproposto ? `${dataCurta(a.prazo_sugerido)} → ${dataCurta(a.prazo_contraproposto)}` : (a.prazo_sugerido ? dataCurta(a.prazo_sugerido) : '—');
        return `<tr><td>${x ? `<a href="#/item/${x.id}" style="font-weight:500">${e(x.titulo)}</a>` : '—'}${a.resposta ? `<div class="xs muted">${e(a.resposta)}</div>` : ''}</td>
          <td>${tag(a.de_instituicao)}</td><td>${tag(a.para_instituicao)}</td><td><span class="st ${cls[a.situacao]}">${e(SIT_ATRIB[a.situacao])}</span></td>
          <td class="sm">${a.situacao === 'aceita' && x?.responsavel_id ? e(nomeDe(S, x.responsavel_id)) : '<span class="muted">—</span>'}</td><td class="sm">${prazo}</td></tr>`;
      }).join('')}</tbody></table></div>` : '<p class="vazio">Nenhuma atribuição ainda.</p>')}
  </main>`;
}

// ------------------------------------------------------------------ anexos (componentes)
function ferramentas(S, alvo, rotuloArquivo = 'Arquivo') {
  const gravando = S.rec?.alvo === alvo;
  return `<div class="tools">
    <label class="tool">${svg('clipe', 15)}${rotuloArquivo}<input type="file" multiple data-anexar="${e(alvo)}" aria-label="Escolher arquivos"></label>
    <button type="button" class="tool${gravando ? ' gravando' : ''}" data-acao="gravar" data-alvo="${e(alvo)}">${gravando ? 'Parar <span data-rec-tempo>0:00</span>' : `${svg('mic', 15)}Gravar áudio`}</button>
    <button type="button" class="tool" data-acao="abrir-link" data-alvo="${e(alvo)}" aria-expanded="${S.linkAberto === alvo}">${svg('link', 15)}Link de vídeo ou página</button>
  </div>`;
}
function caixaLink(S, alvo) {
  if (S.linkAberto !== alvo) return '';
  return `<div class="linkform" data-linkbox="${e(alvo)}">
    <div class="f"><label for="lk-url-${e(alvo)}">Endereço</label><input id="lk-url-${e(alvo)}" name="url" type="url" placeholder="https://youtube.com/… ou https://drive.google.com/…"></div>
    <div class="f"><label for="lk-nome-${e(alvo)}">Título</label><input id="lk-nome-${e(alvo)}" name="nome" type="text" placeholder="Ex.: Gravação da reunião de 8 de outubro"></div>
    <button type="button" class="btn sm pri" data-acao="confirmar-link" data-alvo="${e(alvo)}">Adicionar</button>
    <button type="button" class="btn sm txt" data-acao="fechar-link">Cancelar</button>
  </div>`;
}
export function pendentesHtml(S, alvo) {
  return (S.pend[alvo] || []).map((p) => `<span class="pchip">${svg(p.tipo === 'audio' ? 'mic' : p.tipo === 'link' ? 'link' : 'clipe', 13)}<span>${e(p.nome)}${p.tamanho ? ` · ${tamanhoFmt(p.tamanho)}` : ''}${p.duracao ? ` · ${duracaoFmt(p.duracao)}` : ''}</span><button type="button" data-acao="tirar-pend" data-alvo="${e(alvo)}" data-id="${p.id}" aria-label="Retirar ${e(p.nome)}">×</button></span>`).join('');
}
function anexoHtml(S, a) {
  const pode = a.criado_por === S.eu.id || ehAdmin(S.eu);
  const rem = pode ? `<button type="button" class="lnk perigo" data-acao="remover-anexo" data-id="${a.id}" data-item="${a.item_id}">Remover</button>` : '';
  const quem = `${e(nomeDe(S, a.criado_por).split(' ')[0])}, ${quando(a.criado_em)}`;
  const url = a.endereco;
  if (a.tipo === 'link') {
    if (!linkSeguro(url)) return '';
    const yt = youtubeId(url);
    if (yt) {
      return `<div class="midia larga"><iframe src="https://www.youtube-nocookie.com/embed/${e(yt)}" title="${e(a.nome)}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
        <div class="leg"><b>${e(a.nome)}</b><span>${quem} · <a href="${e(url)}" target="_blank" rel="noopener">Abrir no YouTube</a> ${rem}</span></div></div>`;
    }
    return `<div class="fx"><span class="ic video">${svg('link', 16)}</span><div class="info"><a href="${e(url)}" target="_blank" rel="noopener"><b>${e(a.nome)}</b></a><small>${e(new URL(url).hostname)} · ${quem}</small></div>${rem}</div>`;
  }
  if (!url) {
    return `<div class="fx"><span class="ic">${e(extensao(a.nome))}</span><div class="info"><b>${e(a.nome)}</b><small>${S.api.modo === 'demo' ? 'No modo demonstração, o arquivo fica disponível só na sessão em que foi enviado' : 'Arquivo indisponível'}</small></div>${rem}</div>`;
  }
  if (a.tipo === 'imagem') {
    return `<div class="midia"><a href="${e(url)}" target="_blank" rel="noopener"><img src="${e(url)}" alt="${e(a.nome)}" loading="lazy"></a><div class="leg"><b>${e(a.nome)}</b>${rem}</div></div>`;
  }
  if (a.tipo === 'video') {
    return `<div class="midia larga"><video controls preload="metadata" src="${e(url)}"></video><div class="leg"><b>${e(a.nome)}</b><span>${tamanhoFmt(a.tamanho)} · ${quem} ${rem}</span></div></div>`;
  }
  if (a.tipo === 'audio') {
    return `<div class="audiob"><audio controls preload="metadata" src="${e(url)}"></audio><div class="leg"><span>${e(a.nome)}${a.duracao_s ? ` · ${duracaoFmt(a.duracao_s)}` : ''} · ${quem}</span>${rem}</div></div>`;
  }
  const ext = extensao(a.nome);
  const ic = ext === 'PDF' ? 'pdf' : ['XLS', 'XLSX', 'CSV', 'ODS'].includes(ext) ? 'planilha' : '';
  return `<div class="fx"><span class="ic ${ic}">${e(ext)}</span><div class="info"><a href="${e(url)}" target="_blank" rel="noopener" download="${e(a.nome)}"><b>${e(a.nome)}</b></a><small>${tamanhoFmt(a.tamanho)} · ${quem}</small></div>${rem}</div>`;
}

// ------------------------------------------------------------------ item
export async function pagItem(S, id) {
  const x = item(S, id);
  if (!x) return `<main class="page">${cab({ titulo: 'Item não encontrado' })}<a href="#/quadro">Voltar ao quadro</a></main>`;
  const [coms, evs, anexos] = await Promise.all([
    S.api.comentarios(x.id), S.api.eventos(x.id), S.d.anexosAtivos ? S.api.anexos(x.id) : Promise.resolve([]),
  ]);
  const editar = podeEditarItem(S.eu, x);
  const atribs = S.d.atribuicoes.filter((a) => a.item_id === x.id);
  const aAberta = atribAberta(S, x.id);
  const outra = outraParceira(S.eu.instituicao_id);
  const idxFase = FASES.findIndex((f) => f[0] === x.fase);
  const daItem = anexos.filter((a) => !a.comentario_id);
  const doComentario = (cid) => anexos.filter((a) => a.comentario_id === cid);
  const realce = (t) => e(t).replace(/@(INPE|ANPPEA)\b/gi, (m, g) => `<span class="${g.toUpperCase() === 'INPE' ? 'men' : 'mena'}">${m}</span>`);
  const destinosVez = [
    ...PARCEIRAS.map((i) => [`inst:${i}`, `Coordenação ${daDo(i)} ${i}`]),
    ...ativos(S).filter((m) => PARCEIRAS.includes(m.instituicao_id) && m.perfil !== 'leitor').map((m) => [`m:${m.id}`, `${m.nome} (${siglaDe(m.instituicao_id)})`]),
  ];
  const alvoCm = `cm:${x.id}`;
  const alvoIt = `item:${x.id}`;

  return `<main class="page">
    ${cab({
      crumb: `<a href="#/quadro">Quadro</a> / ${e(TIPO[x.tipo])}`,
      titulo: e(x.titulo),
      tags: `${tag(x.origem, `Origem ${siglaDe(x.origem)}`)}<span class="tag ext">${e(FRENTE[x.frente])}</span>${x.modulo ? `<span class="tag ext">${e(x.modulo)}</span>` : ''}${x.instrumento ? `<span class="xs muted">${e(x.instrumento)}</span>` : ''}${stPrazo(x, false)}`,
      acoes: `${podeDestacar(S.eu) && 'destaque' in x ? `<button type="button" class="btn${x.destaque ? ' destaque' : ''}" data-acao="destaque" data-id="${x.id}" aria-pressed="${!!x.destaque}">${svg('estrela', 16)}${x.destaque ? 'Em destaque' : 'Destacar'}</button>` : ''}${editar ? `<a class="btn" href="#editar" data-acao="abrir-edicao">Editar</a>` : ''}${podeAtribuir(S, x) && !S.params.atribuir ? `<a class="btn" href="#/item/${x.id}/atribuir">Atribuir ${aAo(outra)} ${outra}</a>` : ''}`,
    })}

    <section class="card cp" aria-label="Fase">
      <div class="fases">${FASES.map(([f, t], i) => {
        const c = i < idxFase ? 'd' : i === idxFase ? 'c' : 'n';
        const clic = editar && f !== x.fase && f !== 'triagem' && !aAberta;
        return clic ? `<button type="button" class="fz ${c}" data-acao="fase" data-id="${x.id}" data-fase="${f}" aria-label="Mover para ${e(t)}"><i></i>${e(t)}</button>` : `<div class="fz ${c}"><i></i>${e(t)}</div>`;
      }).join('')}</div>
      ${editar && !aAberta ? `<p class="hint" style="margin-top:10px">Clique numa fase para mover o item.${x.fase !== 'arquivado' ? ` <button type="button" class="lnk" data-acao="fase" data-id="${x.id}" data-fase="arquivado">Arquivar</button>` : ` <button type="button" class="lnk" data-acao="fase" data-id="${x.id}" data-fase="priorizado">Reabrir</button>`}</p>` : ''}
    </section>

    <div class="duas">
      <div class="principal">
        ${S.params.atribuir && podeAtribuir(S, x) ? cartao(`Atribuir ${aAo(outra)} ${outra}`, `<form class="form cp" data-form="atribuir-item" data-id="${x.id}">
          <div class="f"><label for="ai-jus">O que se pede e por quê</label><textarea id="ai-jus" name="justificativa" rows="3" required></textarea></div>
          <div class="g2"><div class="f"><label for="ai-pz">Prazo sugerido</label><input id="ai-pz" name="prazo" type="date" value="${e(x.prazo || somarDias(hojeISO(), 21))}"></div>
          <div class="f"><label for="ai-sug">Sugerir alguém (opcional)</label><select id="ai-sug" name="sugerido"><option value="">A coordenação decide</option>${opcoes(executores(S, outra).map((m) => [m.id, m.nome]))}</select></div></div>
          <div style="display:flex;gap:10px;justify-content:flex-end"><a class="btn txt" href="#/item/${x.id}">Cancelar</a><button class="btn pri" type="submit">Atribuir</button></div>
        </form>`) : ''}

        ${aberto(x) ? `<section class="vezbox" aria-label="Próxima ação">
          <div style="display:flex;gap:14px;align-items:center;min-width:0;flex:1 1 360px">
            ${x.vez_membro_id ? avatar(membro(S, x.vez_membro_id)) : `<span class="av" style="background:${corInst(x.vez_instituicao)};color:#fff">${e(siglaDe(x.vez_instituicao).slice(0, 2))}</span>`}
            <div style="min-width:0"><div class="rot">${x.vez_membro_id === S.eu.id ? 'A próxima ação é sua' : `A próxima ação está com ${x.vez_membro_id ? e(nomeDe(S, x.vez_membro_id)) : `a coordenação ${daDo(x.vez_instituicao)} ${e(siglaDe(x.vez_instituicao))}`}`}${x.prazo ? `, até ${dataLonga(x.prazo)}` : ''}</div>
            <p>${e(x.vez_nota || FASE[x.fase])}</p>
            ${aAberta ? `<p class="sm">Atribuição ${e(SIT_ATRIB[aAberta.situacao].toLowerCase())}. <a href="#/triagem">Ver na triagem</a></p>` : ''}</div>
          </div>
          ${editar && !aAberta ? `<details><summary class="btn sm pri">Passar a vez</summary>
            <form class="form" data-form="passar-vez" data-id="${x.id}" style="margin-top:12px;min-width:280px;background:#fff;padding:14px;border-radius:12px">
              <div class="f"><label for="pv-dest">Para</label><select id="pv-dest" name="destino" required>${opcoes(destinosVez)}</select></div>
              <div class="f"><label for="pv-nota">O que precisa ser feito</label><input id="pv-nota" name="nota" type="text" required></div>
              <button class="btn sm pri" type="submit">Passar a vez</button>
            </form></details>` : ''}
        </section>` : ''}

        ${x.descricao ? cartao('Descrição', `<p class="cp" style="white-space:pre-wrap">${e(x.descricao)}</p>`) : ''}

        ${S.d.anexosAtivos ? `<section class="card" id="anexos"><div class="ch"><h2>Anexos</h2>${podeEditar(S.eu) ? ferramentas(S, alvoIt) : ''}</div>
          ${podeEditar(S.eu) ? `<div style="padding:0 20px">${caixaLink(S, alvoIt)}</div>` : ''}
          ${daItem.length ? `<div class="anx">${daItem.map((a) => anexoHtml(S, a)).join('')}</div>` : `<p class="vazio">Nenhum anexo ainda.${podeEditar(S.eu) ? ` Arquivos de até ${LIMITE_MB} MB, gravações de áudio ou links de vídeo (YouTube, Drive).` : ''}</p>`}
        </section>` : (ehAdmin(S.eu) ? cartao('Anexos', '<p class="vazio">Os anexos ainda não foram ativados nesta instalação. Rode o arquivo anexos.sql no SQL Editor do Supabase.</p>') : '')}

        ${cartao('Comentários', `<div class="cp">
          ${coms.map((c) => {
            const as = doComentario(c.id);
            return `<div class="cm">${avatar(membro(S, c.autor_id))}<div style="min-width:0;flex:1">
              <div class="sm"><b style="font-weight:600">${e(nomeDe(S, c.autor_id))}</b> <span class="muted">${e(siglaDe(membro(S, c.autor_id)?.instituicao_id))}, ${quando(c.criado_em)}</span></div>
              ${c.texto ? `<p>${realce(c.texto)}</p>` : ''}
              ${c.proposta_decisao ? '<p class="xs" style="margin-top:6px;color:var(--ambar);font-weight:500">Proposta de decisão, levada ao comitê</p>' : ''}
              ${as.length ? `<div class="anx compacto">${as.map((a) => anexoHtml(S, a)).join('')}</div>` : ''}
            </div></div>`;
          }).join('') || '<p class="muted sm" style="padding:4px 0 12px">Nenhum comentário ainda.</p>'}
          <form class="form" data-form="comentar" data-id="${x.id}" style="margin-top:12px">
            <label for="cm-txt" class="sm" style="font-weight:500">Comentar</label>
            <textarea id="cm-txt" name="texto" rows="3" placeholder="Escreva @INPE ou @ANPPEA para avisar a equipe toda"></textarea>
            <div class="pend" data-pend="${e(alvoCm)}">${pendentesHtml(S, alvoCm)}</div>
            ${S.d.anexosAtivos ? caixaLink(S, alvoCm) : ''}
            <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">
              ${S.d.anexosAtivos ? ferramentas(S, alvoCm, 'Anexar') : '<span></span>'}
              <button class="btn pri sm" type="submit">Publicar</button>
            </div>
            ${podeEditar(S.eu) ? '<label class="sm muted" style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="proposta">Levar ao comitê como proposta de decisão</label>' : ''}
          </form>
        </div>`, `<span class="muted sm">${coms.length}</span>`)}

        ${cartao('Histórico', `<div class="cb">${evs.map((ev) => `<div class="row"><span class="xs muted" style="width:52px;flex:none">${dataCurta(ev.criado_em)}</span><div class="sm"><b style="font-weight:500">${e(autorNome(S, ev))}</b> · ${e(ev.detalhe)}</div></div>`).join('')}</div>`)}
      </div>

      <div class="lateral">
        ${cartao('Detalhes', `<dl>
          <dt>Responsável</dt><dd>${x.responsavel_id ? e(nomeDe(S, x.responsavel_id)) : '<span class="muted">a definir</span>'}</dd>
          <dt>Envolvidas</dt><dd style="display:flex;gap:6px;flex-wrap:wrap">${(x.envolvidas || []).map((i) => tag(i)).join('') || '<span class="muted">—</span>'}</dd>
          <dt>Prioridade</dt><dd>${e(PRIORIDADE[x.prioridade])}</dd>
          <dt>Prazo</dt><dd>${x.prazo ? dataLonga(x.prazo) : '—'}</dd>
          <dt>Registrado</dt><dd>${dataLonga(x.criado_em)}, por ${e(nomeDe(S, x.criado_por))}</dd>
        </dl>
        ${editar ? `<details id="editar" style="padding:0 20px 18px"><summary class="btn sm">Editar</summary>
          <form class="form" data-form="ajustar" data-id="${x.id}" style="margin-top:14px">
            <div class="f"><label for="aj-tit">Título</label><textarea id="aj-tit" name="titulo" rows="2" required minlength="3">${e(x.titulo)}</textarea>${x.github_criado ? '<span class="hint">Este item acompanha a issue do GitHub: mudanças no título e na descrição feitas aqui são substituídas quando a issue for editada.</span>' : ''}</div>
            <div class="f"><label for="aj-desc">Descrição</label><textarea id="aj-desc" name="descricao" rows="4">${e(x.descricao || '')}</textarea></div>
            <div class="f"><label for="aj-tipo">Tipo</label><select id="aj-tipo" name="tipo">${opcoes(Object.entries(TIPO), x.tipo)}</select></div>
            <div class="f"><label for="aj-fr">Frente</label><select id="aj-fr" name="frente">${opcoes(Object.entries(FRENTE), x.frente)}</select></div>
            <div class="f"><label for="aj-mod">Módulo</label><input id="aj-mod" name="modulo" type="text" value="${e(x.modulo || '')}"></div>
            <div class="f"><label for="aj-ins">Instrumento ou processo</label><input id="aj-ins" name="instrumento" type="text" value="${e(x.instrumento || '')}" placeholder="Ex.: Processo SEI nº …"></div>
            <div class="f"><label for="aj-resp">Responsável</label><select id="aj-resp" name="responsavel"><option value="">A definir</option>${opcoes(ativos(S).filter((m) => PARCEIRAS.includes(m.instituicao_id) && m.perfil !== 'leitor').map((m) => [m.id, `${m.nome} (${siglaDe(m.instituicao_id)})`]), x.responsavel_id)}</select></div>
            <div class="f"><label for="aj-pz">Prazo</label><input id="aj-pz" name="prazo" type="date" value="${e(x.prazo || '')}"></div>
            <div class="f"><label for="aj-pr">Prioridade</label><select id="aj-pr" name="prioridade">${opcoes(Object.entries(PRIORIDADE), x.prioridade)}</select></div>
            ${S.d.githubAtivo && podeGithub(S.eu) ? `<div class="f"><label for="aj-gh">Issue do GitHub (número)</label><input id="aj-gh" name="github_numero" type="number" min="1" step="1" inputmode="numeric" value="${e(x.github_numero || '')}" placeholder="Ex.: 42"><span class="hint">Deixe em branco para desfazer o vínculo.</span></div>` : ''}
            <div class="f"><span class="t">Instituições envolvidas</span><div style="display:flex;gap:6px;flex-wrap:wrap">${S.d.instituicoes.map((i) => `<label class="ck"><input type="checkbox" name="envolvidas" value="${e(i.id)}"${(x.envolvidas || []).includes(i.id) ? ' checked' : ''}>${e(i.sigla)}</label>`).join('')}</div></div>
            <button class="btn sm pri" type="submit">Salvar</button>
          </form></details>` : ''}
        ${podeExcluirItem(S.eu, x) ? `<div style="padding:0 20px 18px"><button type="button" class="lnk perigo" data-acao="excluir-item" data-id="${x.id}">Excluir este item</button></div>` : ''}`)}
        ${x.github_numero ? cartao('GitHub', `<div class="cp ghbox">
          <a class="ghnum" href="${e(linkSeguro(x.github_url) || '#')}" target="_blank" rel="noopener">${svg('issue', 16)}Issue #${x.github_numero}</a>
          ${x.github_estado ? `<span class="st ${GH_ESTADO[x.github_estado][1]}">${e(GH_ESTADO[x.github_estado][0])}</span>` : '<span class="xs muted">Estado chega na próxima sincronização</span>'}
          ${(x.github_etiquetas || []).length ? `<div class="ghetq">${x.github_etiquetas.map((t) => `<span class="tag ext">${e(t)}</span>`).join('')}</div>` : ''}
          ${(x.github_atribuidos || []).length ? `<p class="sm">Com ${x.github_atribuidos.map((l) => `<b style="font-weight:500">@${e(l)}</b>`).join(', ')}</p>` : ''}
          <p class="xs muted">${x.github_criado ? 'Item criado a partir da issue: título e descrição acompanham o GitHub.' : 'Item vinculado à issue.'}${x.github_sinc ? ` Sincronizado ${quando(x.github_sinc)}.` : ''}</p>
        </div>`) : ''}
        ${atribs.length ? cartao('Atribuições', `<div class="cb">${atribs.map((a) => `<div class="row top" style="flex-direction:column;align-items:flex-start;gap:4px"><span style="display:inline-flex;gap:6px;align-items:center">${tag(a.de_instituicao)}→${tag(a.para_instituicao)}</span><span class="st ${({ aguardando: 'wait', aceita: 'ok', contraproposta: 'warn', devolvida: 'late' })[a.situacao]}">${e(SIT_ATRIB[a.situacao])}</span><span class="xs muted">${dataLonga(a.criado_em)}${a.resposta ? ` · ${e(a.resposta)}` : ''}</span></div>`).join('')}</div>`) : ''}
      </div>
    </div>
  </main>`;
}

// ------------------------------------------------------------------ issues do GitHub
const itemDaIssue = (S, n) => S.d.itens.find((x) => x.github_numero === n);
function issuesParaAvaliar(S) {
  return (S.d.githubIssues || []).filter((g) => g.estado === 'aberta' && !g.ignorada && !itemDaIssue(S, g.numero));
}

export function pagGithub(S) {
  const todas = S.d.githubIssues || [];
  const aba = S.filtros.github || 'avaliar';
  const grupos = {
    avaliar: issuesParaAvaliar(S),
    quadro: todas.filter((g) => itemDaIssue(S, g.numero)),
    ignoradas: todas.filter((g) => g.ignorada && !itemDaIssue(S, g.numero)),
    fechadas: todas.filter((g) => g.estado !== 'aberta' && !g.ignorada && !itemDaIssue(S, g.numero)),
  };
  const rotulos = { avaliar: 'Para avaliar', quadro: 'No Quadro', ignoradas: 'Ignoradas', fechadas: 'Fechadas fora do Quadro' };
  const vazio = {
    avaliar: todas.length ? 'Nenhuma issue aberta esperando avaliação.' : 'Nenhuma issue chegou ainda. Depois de configurar a automação no repositório, rode “Run workflow” na aba Actions para trazer as issues que já existem.',
    quadro: 'Nenhuma issue foi trazida para o Quadro ainda.',
    ignoradas: 'Nenhuma issue ignorada.',
    fechadas: 'Nenhuma issue fechada fora do Quadro.',
  };
  const editor = podeGithub(S.eu);
  const inst = S.eu.instituicao_id;
  const origens = ehAdmin(S.eu) ? ['INPE', 'ANPPEA', 'CONJUNTA'] : [PARCEIRAS.includes(inst) ? inst : null, 'CONJUNTA'].filter(Boolean);
  const semIssue = S.d.itens.filter((x) => aberto(x) && !x.github_numero);

  const linha = (g) => {
    const it = itemDaIssue(S, g.numero);
    const resumo = g.corpo ? (g.corpo.length > 220 ? g.corpo.slice(0, 217) + '…' : g.corpo) : '';
    const est = GH_ESTADO[g.estado];
    let acoes = '';
    if (it) {
      acoes = `<a class="btn sm" href="#/item/${it.id}">Abrir no Quadro</a><span class="xs muted">${e(FASE[it.fase])}</span>`;
    } else if (editor && g.ignorada) {
      acoes = `<button type="button" class="btn sm" data-acao="gh-ignorar" data-numero="${g.numero}" data-valor="0">Voltar para avaliação</button>`;
    } else if (editor) {
      acoes = `<details class="gh-d"><summary class="btn sm pri">Trazer para o Quadro</summary>
          <form class="form gh-f" data-form="gh-adicionar" data-numero="${g.numero}">
            <div class="f"><span class="t">Origem</span><div style="display:flex;gap:6px;flex-wrap:wrap">${origens.map((o, i) => `<label class="ck"><input type="radio" name="origem" value="${o}"${i === 0 ? ' checked' : ''}>${o === 'CONJUNTA' ? 'Conjunta' : e(siglaDe(o))}</label>`).join('')}</div></div>
            <div class="f"><label for="gh-fr-${g.numero}">Frente</label><select id="gh-fr-${g.numero}" name="frente">${opcoes(Object.entries(FRENTE), g.frente_sugerida || 'desenvolvimento')}</select></div>
            <button class="btn sm pri" type="submit">Adicionar ao Quadro</button>
          </form></details>
        ${semIssue.length ? `<details class="gh-d"><summary class="btn sm">Vincular a um item</summary>
          <form class="form gh-f" data-form="gh-vincular" data-numero="${g.numero}">
            <div class="f"><label for="gh-it-${g.numero}">Item que esta issue acompanha</label><select id="gh-it-${g.numero}" name="item" required>${opcoes(semIssue.map((x) => [x.id, x.titulo]))}</select></div>
            <button class="btn sm pri" type="submit">Vincular</button>
          </form></details>` : ''}
        ${g.estado === 'aberta' ? `<button type="button" class="lnk" data-acao="gh-ignorar" data-numero="${g.numero}" data-valor="1">Ignorar</button>` : ''}`;
    }
    return `<article class="ghl">
      <div class="ghl-t">
        <a class="ghl-n" href="${e(linkSeguro(g.url) || '#')}" target="_blank" rel="noopener" title="Abrir no GitHub">${svg('issue', 15)}#${g.numero}</a>
        <div style="min-width:0;flex:1">
          <h3>${e(g.titulo)}</h3>
          <div class="ghl-m">
            <span class="st ${est[1]}">${e(est[0])}</span>
            ${(g.etiquetas || []).map((t) => `<span class="tag ext">${e(t)}</span>`).join('')}
            ${(g.atribuidos || []).length ? `<span class="xs">Com ${g.atribuidos.map((l) => `@${e(l)}`).join(', ')}</span>` : ''}
            <span class="xs muted">${g.autor ? `Aberta por @${e(g.autor)} · ` : ''}${g.atualizada_em ? `atualizada ${quando(g.atualizada_em)}` : ''}</span>
          </div>
          ${resumo ? `<p class="sm muted ghl-r">${e(resumo)}</p>` : ''}
        </div>
      </div>
      ${acoes ? `<div class="ghl-a">${acoes}</div>` : ''}
    </article>`;
  };

  return `<main class="page">
    ${cab({
      titulo: 'Issues do GitHub',
      sub: 'As issues do repositório de desenvolvimento chegam aqui. Escolha quais entram no Quadro; a partir daí o item acompanha a issue: quem está atribuído, fechamento, reabertura e comentários.',
    })}
    <div class="tabs" role="tablist" aria-label="Situação das issues">${Object.entries(rotulos).map(([k, t]) =>
      `<button type="button" role="tab" class="${aba === k ? 'on' : ''}" aria-selected="${aba === k}" data-acao="filtro" data-chave="github" data-valor="${k}">${e(t)}<b>${grupos[k].length}</b></button>`).join('')}</div>
    <section class="card" style="gap:0" aria-label="${e(rotulos[aba])}">${grupos[aba].map(linha).join('') || `<p class="vazio">${vazio[aba]}</p>`}</section>

  </main>`;
}

// ------------------------------------------------------------------ novo registro
export function pagNovo(S) {
  if (!podeEditar(S.eu)) return `<main class="page">${cab({ titulo: 'Novo registro' })}<p class="vazio">Seu perfil é de leitura.</p></main>`;
  const inst = S.eu.instituicao_id;
  const outra = outraParceira(inst);
  return `<main class="page" style="max-width:1080px">
    ${cab({ crumb: '<a href="#/quadro">Quadro</a> / Novo registro', titulo: 'Novo registro', sub: 'O que você registrar aqui fica visível para as equipes do INPE e da ANPPEA.' })}
    <div class="duas">
      <form class="card principal" data-form="novo" style="gap:0">
        <fieldset class="sec"><legend>O que é</legend>
          <div class="opts">
            <label class="opt"><input type="radio" name="tipo" value="atividade" checked><div><b>Atividade</b><br><span>Algo que uma das equipes vai fazer</span></div></label>
            <label class="opt"><input type="radio" name="tipo" value="demanda"><div><b>Demanda</b><br><span>Um pedido de uma instituição à outra</span></div></label>
            <label class="opt"><input type="radio" name="tipo" value="processo"><div><b>Processo</b><br><span>Termo ou pactuação com fases</span></div></label>
          </div>
          <div class="f"><label for="nv-tit">Título</label><input id="nv-tit" name="titulo" type="text" required minlength="3"></div>
          <div class="f"><label for="nv-desc">Descrição</label><textarea id="nv-desc" name="descricao" rows="3" placeholder="Contexto, resultado esperado e o que significa estar pronto"></textarea></div>
          <div class="g2">
            <div class="f"><label for="nv-fr">Frente do sistema</label><select id="nv-fr" name="frente">${opcoes(FRENTES)}</select></div>
            <div class="f"><label for="nv-mod">Módulo ou perspectiva</label><input id="nv-mod" name="modulo" type="text" placeholder="Ex.: Portal, sínteses; Cadastro; IITEA"></div>
          </div>
        </fieldset>
        <fieldset class="sec"><legend>Quem faz</legend>
          <div class="opts">
            <label class="opt"><input type="radio" name="destino" value="minha" checked><div><b>Fica ${inst === 'ANPPEA' ? 'na' : 'no'} ${e(siglaDe(inst))}</b><br><span>Você escolhe o responsável</span></div></label>
            ${souParceira(S) ? `<label class="opt"><input type="radio" name="destino" value="atribuir"><div><b>Atribuir ${aAo(outra)} ${outra}</b><br><span>Vai para a triagem da coordenação ${daDo(outra)} ${outra}</span></div></label>` : ''}
          </div>
          <div class="g2">
            <div class="f"><label for="nv-resp">Responsável ${inst === 'ANPPEA' ? 'na' : 'no'} ${e(siglaDe(inst))}</label><select id="nv-resp" name="responsavel"><option value="">A definir</option>${opcoes(executores(S, inst).map((m) => [m.id, m.nome]), S.eu.id)}</select></div>
            ${souParceira(S) ? `<div class="f"><label for="nv-sug">Se atribuir: sugerir alguém ${daDo(outra)} ${outra}</label><select id="nv-sug" name="sugerido"><option value="">A coordenação decide</option>${opcoes(executores(S, outra).map((m) => [m.id, m.nome]))}</select></div>` : ''}
          </div>
          <div class="f"><span class="t">Origem</span><div style="display:flex;gap:8px;flex-wrap:wrap">
            <label class="ck"><input type="radio" name="origem" value="${inst}" checked>${e(siglaDe(inst))}</label>
            <label class="ck"><input type="radio" name="origem" value="CONJUNTA">Conjunta, INPE e ANPPEA</label>
          </div></div>
        </fieldset>
        <fieldset class="sec"><legend>Quando</legend>
          <div class="g2">
            <div class="f"><label for="nv-pz">Prazo</label><input id="nv-pz" name="prazo" type="date"></div>
            <div class="f"><label for="nv-pr">Prioridade</label><select id="nv-pr" name="prioridade">${opcoes(Object.entries(PRIORIDADE), 'media')}</select></div>
            <div class="f"><label for="nv-ins">Instrumento ou processo SEI</label><input id="nv-ins" name="instrumento" type="text" placeholder="Opcional"></div>
          </div>
        </fieldset>
        ${S.d.anexosAtivos ? `<fieldset class="sec"><legend>Anexos</legend>
          <p class="hint">Arquivos de até ${LIMITE_MB} MB, gravações de áudio ou links de vídeo (YouTube, Drive). Vídeos longos: prefira o link.</p>
          ${ferramentas(S, 'novo')}
          <div class="pend" data-pend="novo">${pendentesHtml(S, 'novo')}</div>
          ${caixaLink(S, 'novo')}
        </fieldset>` : ''}
        <div class="rodape-form"><a class="btn txt" href="#/quadro">Cancelar</a><button class="btn pri" type="submit">Registrar</button></div>
      </form>
      <aside class="lateral">
        <section class="card cp" style="display:flex;flex-direction:column;gap:8px"><b style="font-weight:600">Regras de convivência</b>
          <p class="sm muted">Todo item tem um responsável e alguém com a próxima ação. Demandas para a outra instituição passam pela triagem da coordenação de destino, que responde em até 5 dias úteis.</p>
        </section>
      </aside>
    </div>
  </main>`;
}

// ------------------------------------------------------------------ decisões
export function pagDecisoes(S) {
  const inst = S.eu.instituicao_id;
  const pactuo = ['coordenacao', 'administracao'].includes(S.eu.perfil) && PARCEIRAS.includes(inst);
  const emPauta = S.d.decisoes.filter((d) => d.situacao === 'em_pauta');
  const outras = S.d.decisoes.filter((d) => d.situacao !== 'em_pauta');
  const ok = (sim, i) => `<div class="okd"><i class="${sim ? 'sim' : ''}">${sim ? '✓' : '…'}</i>Coordenação ${daDo(i)} ${i} ${sim ? 'de acordo' : 'ainda não se manifestou'}</div>`;
  return `<main class="page">
    ${cab({
      titulo: 'Decisões',
      sub: 'Uma decisão só vale quando as coordenações do INPE e da ANPPEA dão o seu de acordo.',
      acoes: podeEditar(S.eu) ? '<a class="btn" href="#propor">Propor decisão</a>' : '',
    })}
    ${cartao('Em pauta', emPauta.length ? emPauta.map((d) => `<div class="req">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><span class="xs muted">${e(d.forum)}${d.data_pauta ? `, ${dataLonga(d.data_pauta)}` : ''}</span></div>
      <span class="tit">${e(d.titulo)}</span>
      ${d.descricao ? `<p class="sm muted">${e(d.descricao)}</p>` : ''}
      ${d.item_id && item(S, d.item_id) ? `<p class="sm">Item: <a href="#/item/${d.item_id}">${e(item(S, d.item_id).titulo)}</a></p>` : ''}
      <div style="display:flex;flex-direction:column;gap:6px">${ok(d.ok_inpe, 'INPE')}${ok(d.ok_anppea, 'ANPPEA')}</div>
      ${pactuo && !(inst === 'INPE' ? d.ok_inpe : d.ok_anppea) ? `<div style="display:flex;gap:8px"><button type="button" class="btn sm pri" data-acao="pactuar" data-id="${d.id}">De acordo</button><button type="button" class="btn sm perigo" data-acao="rejeitar" data-id="${d.id}">Rejeitar</button></div>` : ''}
    </div>`).join('') : '<p class="vazio">Nenhuma decisão em pauta.</p>', `<span class="muted sm">${emPauta.length}</span>`)}

    ${cartao('Histórico de decisões', outras.length ? `<div class="tbl"><table>
      <thead><tr><th>Data</th><th>Decisão</th><th>Fórum</th><th>Situação</th></tr></thead>
      <tbody>${outras.map((d) => `<tr><td class="sm">${dataCurta(d.pactuada_em || d.data_pauta || d.criado_em)}</td><td style="font-weight:500">${e(d.titulo)}</td><td class="sm muted">${e(d.forum)}</td>
        <td>${d.situacao === 'pactuada' ? `<div style="display:flex;gap:6px">${tag('INPE')}${tag('ANPPEA')}</div>` : '<span class="st late">Rejeitada</span>'}</td></tr>`).join('')}</tbody></table></div>`
      : '<p class="vazio">Nenhuma decisão registrada ainda.</p>')}

    ${podeEditar(S.eu) ? cartao('Propor decisão', `<form class="form cp" data-form="propor">
      <div class="g2">
        <div class="f"><label for="dc-tit">Decisão proposta</label><input id="dc-tit" name="titulo" type="text" required minlength="3"></div>
        <div class="f"><label for="dc-dt">Data da pauta</label><input id="dc-dt" name="data_pauta" type="date"></div>
        <div class="f"><label for="dc-for">Fórum</label><select id="dc-for" name="forum">${opcoes([['Comitê de governança', 'Comitê de governança'], ['Alinhamento operacional', 'Alinhamento operacional'], ['Revisão do portfólio', 'Revisão do portfólio']])}</select></div>
        <div class="f"><label for="dc-it">Item relacionado</label><select id="dc-it" name="item_id"><option value="">Nenhum</option>${opcoes(S.d.itens.filter(aberto).map((x) => [String(x.id), x.titulo]))}</select></div>
      </div>
      <div class="f"><label for="dc-desc">Detalhes</label><textarea id="dc-desc" name="descricao" rows="2"></textarea></div>
      <div><button class="btn pri" type="submit">Colocar em pauta</button></div>
    </form>`, '', ' id="propor"') : ''}
  </main>`;
}

// ------------------------------------------------------------------ equipe
// Texto do convite, pronto para mandar por e-mail
function mensagemConvite(c) {
  const url = location.origin + location.pathname;
  const validade = c.expira_em ? dataLonga(c.expira_em) : '';
  const assunto = 'Convite para a Governança MonitoraEA';
  const corpo = `Olá,

Você foi convidado(a) para a plataforma de Governança do MonitoraEA, compartilhada entre o INPE e a ANPPEA, com o perfil de ${PERFIL[c.perfil].toLowerCase()} (${siglaDe(c.instituicao_id)}).

Para ativar o seu acesso:
1. Abra ${url}
2. Clique em "Primeiro acesso".
3. Informe este e-mail (${c.email}) e o código: ${c.codigo}
4. Escreva o seu nome e crie uma senha.

${validade ? `O código vale até ${validade}.\n\n` : ''}Qualquer dúvida, é só responder esta mensagem.`;
  return { assunto, corpo, mailto: `mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}` };
}
const botoesConvite = (c, sm = true) => {
  const m = mensagemConvite(c);
  return `<a class="btn ${sm ? 'sm' : ''} pri" href="${e(m.mailto)}">${svg('envelope', 15)}Enviar por e-mail</a><button type="button" class="btn ${sm ? 'sm' : ''}" data-acao="copiar" data-texto="${e(m.corpo)}">Copiar mensagem</button>`;
};

export async function pagEquipe(S) {
  const ab = S.d.itens.filter(aberto);
  const conta = (m) => ({
    resp: ab.filter((x) => x.responsavel_id === m.id).length,
    vez: ab.filter((x) => x.vez_membro_id === m.id).length,
    atr: ab.filter((x) => x.responsavel_id === m.id && x.prazo && diasAte(x.prazo) < 0).length,
    fim: S.d.itens.filter((x) => x.responsavel_id === m.id && x.fase === 'publicado' && x.concluido_em && diasAte(x.concluido_em.slice(0, 10)) >= -30).length,
  });
  const coordAlgum = ['coordenacao', 'administracao'].includes(S.eu.perfil);
  const convites = coordAlgum ? await S.api.convites() : [];
  const fil = S.filtros.equipe || 'todas';
  const ms = S.d.membros.filter((m) => fil === 'todas' || (fil === 'externos' ? !PARCEIRAS.includes(m.instituicao_id) : m.instituicao_id === fil))
    .map((m) => ({ m, c: conta(m) })).sort((a, b) => (b.m.ativo - a.m.ativo) || ((b.c.resp + b.c.vez) - (a.c.resp + a.c.vez)));
  const max = Math.max(1, ...ms.map(({ c }) => c.resp + c.vez));

  const resumo = (inst) => {
    const pessoas = S.d.membros.filter((m) => m.instituicao_id === inst && m.ativo);
    const ids = new Set(pessoas.map((m) => m.id));
    return `<section class="card inst-card" aria-label="${inst}">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><div><h2 style="font-size:16px;font-weight:600">${inst}</h2><p class="xs muted">${pessoas.length} ${pessoas.length === 1 ? 'pessoa' : 'pessoas'}</p></div><img src="${LOGO[inst]}" alt="" style="height:${inst === 'INPE' ? 34 : 22}px;width:auto"></div>
      <div class="nums">
        <div><b>${ab.filter((x) => ids.has(x.responsavel_id)).length}</b><span>como responsável</span></div>
        <div><b>${ab.filter((x) => x.vez_instituicao === inst).length}</b><span>com a vez</span></div>
        <div><b style="color:var(--verm)">${ab.filter((x) => ids.has(x.responsavel_id) && x.prazo && diasAte(x.prazo) < 0).length}</b><span>atrasados</span></div>
        <div><b>${S.d.atribuicoes.filter((a) => a.para_instituicao === inst && a.situacao === 'aguardando').length}</b><span>na triagem</span></div>
      </div></section>`;
  };
  const instConvite = ehAdmin(S.eu)
    ? S.d.instituicoes.map((i) => [i.id, i.sigla])
    : [[S.eu.instituicao_id, siglaDe(S.eu.instituicao_id)], ...S.d.instituicoes.filter((i) => !i.parceira).map((i) => [i.id, `${i.sigla} (só leitor)`])];
  const novo = S.ultimoConvite;

  return `<main class="page">
    ${cab({
      titulo: 'Equipe',
      sub: 'Quem participa da governança do MonitoraEA, com que perfil de acesso e quantos itens cada pessoa tem agora.',
      acoes: coordAlgum ? '<a class="btn pri" href="#convidar">Convidar pessoa</a>' : '',
    })}
    <div class="g2" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr))">${resumo('INPE')}${resumo('ANPPEA')}</div>
    ${cartao('Pessoas', `<div class="tbl"><table>
      <thead><tr><th>Pessoa</th><th>Instituição</th><th>Perfil</th><th class="n">Responsável</th><th class="n">Com a vez</th><th class="n">Atrasados</th><th class="n">Concluídos em 30 dias</th><th>Carga</th></tr></thead>
      <tbody>${ms.map(({ m, c }) => {
        const gerir = coordenaDe(S.eu, m.instituicao_id) && m.id !== S.eu.id;
        return `<tr${m.ativo ? '' : ' style="opacity:.55"'}>
          <td><div class="pessoa">${avatar(m)}<div><div style="font-weight:500">${e(m.nome)}</div><div class="xs muted">${e(m.papel || '')}${m.github ? ` · @${e(m.github)}` : ''}${m.ativo ? '' : ' · inativo'}</div></div></div></td>
          <td>${tag(PARCEIRAS.includes(m.instituicao_id) ? m.instituicao_id : 'ext', siglaDe(m.instituicao_id))}</td>
          <td>${gerir ? `<form data-form="perfil" data-id="${e(m.id)}" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><label class="oculto" for="pf-${e(m.id)}">Perfil de ${e(m.nome)}</label><select id="pf-${e(m.id)}" name="perfil" style="min-height:34px;width:auto">${opcoes(Object.entries(PERFIL).filter(([k]) => k !== 'administracao' || ehAdmin(S.eu)), m.perfil)}</select><button class="btn sm" type="submit">Salvar</button><button class="lnk${m.ativo ? ' perigo' : ''}" type="button" data-acao="ativo" data-id="${e(m.id)}" data-valor="${m.ativo ? '0' : '1'}">${m.ativo ? 'Desativar' : 'Reativar'}</button></form>` : `<span class="sm">${e(PERFIL[m.perfil])}</span>`}</td>
          <td class="n${c.resp ? '' : ' z'}">${c.resp}</td><td class="n${c.vez ? '' : ' z'}">${c.vez}</td><td class="n${c.atr ? ' r' : ' z'}">${c.atr}</td><td class="n${c.fim ? '' : ' z'}">${c.fim}</td>
          <td>${PARCEIRAS.includes(m.instituicao_id) ? `<div class="carga" role="img" aria-label="Carga: ${c.resp + c.vez}"><span style="width:${(100 * (c.resp + c.vez)) / max}%;background:${corInst(m.instituicao_id)}"></span></div>` : ''}</td></tr>`;
      }).join('')}</tbody></table></div>`,
      `<div class="seg" role="group" aria-label="Instituição">${[['todas', 'Todas'], ['INPE', 'INPE'], ['ANPPEA', 'ANPPEA'], ['externos', 'Externos']].map(([k, t]) =>
        `<button type="button" class="${fil === k ? 'on' : ''}" aria-pressed="${fil === k}" data-acao="filtro" data-chave="equipe" data-valor="${k}">${t}</button>`).join('')}</div>`)}

    ${coordAlgum ? `<div class="duas" id="convidar">
      ${cartao('Convidar pessoa', `<form class="form cp" data-form="convidar">
        <div class="g2">
          <div class="f"><label for="cv-mail">E-mail</label><input id="cv-mail" name="email" type="email" required></div>
          <div class="f"><label for="cv-inst">Instituição</label><select id="cv-inst" name="instituicao_id">${opcoes(instConvite, S.eu.instituicao_id)}</select></div>
          <div class="f"><label for="cv-perf">Perfil</label><select id="cv-perf" name="perfil">${opcoes(Object.entries(PERFIL).filter(([k]) => k !== 'administracao' || ehAdmin(S.eu)), 'colaborador')}</select></div>
          <div class="f"><label for="cv-pap">Papel na equipe</label><input id="cv-pap" name="papel" type="text" placeholder="Ex.: Desenvolvimento, Articulação das redes"></div>
        </div>
        <div><button class="btn pri" type="submit">Gerar convite</button></div>
      </form>`, '', ' style="flex:999 1 560px"')}
      <div class="lateral">
        ${novo ? `<section class="card cp" style="display:flex;flex-direction:column;gap:10px;background:var(--sky);border-color:var(--sky)"><b>Convite criado para ${e(novo.email)}</b><span class="codigo">${e(novo.codigo)}</span><p class="sm">A plataforma não envia e-mails sozinha. Mande o convite pelo seu e-mail: o botão abaixo abre a mensagem já escrita, com o código, o endereço da plataforma e o passo a passo.</p><div style="display:flex;gap:8px;flex-wrap:wrap">${botoesConvite(novo, false)}</div></section>` : ''}
        ${cartao('Convites pendentes', `<div class="cb">${convites.filter((c) => !c.aceito_em).map((c) => `<div class="row"><div style="min-width:0"><b style="font-weight:500">${e(c.email)}</b><div class="xs muted">${e(siglaDe(c.instituicao_id))}, ${e(PERFIL[c.perfil].toLowerCase())} · <span style="font-family:ui-monospace,monospace">${e(c.codigo)}</span></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${botoesConvite(c)}</div></div></div>`).join('') || '<p class="vazio">Nenhum convite pendente.</p>'}</div>`)}
      </div>
    </div>` : ''}

    ${S.d.githubAtivo ? (() => {
      const quem = ativos(S).filter((m) => m.id === S.eu.id || coordenaDe(S.eu, m.instituicao_id));
      return cartao('Usuários do GitHub', `<form class="form cp" data-form="github">
        <p class="sm muted">Quando uma issue que está no Quadro é atribuída a alguém no GitHub, a plataforma reconhece a pessoa por este usuário e a torna responsável pelo item.</p>
        <div class="g2"><div class="f"><label for="gh-m">Pessoa</label><select id="gh-m" name="membro">${opcoes(quem.map((m) => [m.id, `${m.id === S.eu.id ? `${m.nome} (você)` : m.nome}${m.github ? ` · @${m.github}` : ""}`]), S.eu.id)}</select></div>
        <div class="f"><label for="gh-l">Usuário no GitHub</label><input id="gh-l" name="login" type="text" autocomplete="off" spellcheck="false" placeholder="ex.: maria-silva" value="${e(S.eu.github || membro(S, S.eu.id)?.github || '')}"></div></div>
        <div><button class="btn sm pri" type="submit">Salvar</button></div>
      </form>`);
    })() : ''}

    <p class="sm muted"><b style="color:var(--ink);font-weight:600">Perfis de acesso.</b> Leitores veem tudo e comentam. Colaboradores criam, anexam, atribuem e passam a vez. A coordenação faz a triagem, convida pessoas e pactua decisões. A administração gerencia perfis nas duas instituições.</p>
  </main>`;
}

// ------------------------------------------------------------------ avisos
export function pagNotificacoes(S) {
  const fil = S.filtros.notif || 'todas';
  const ns = fil === 'novas' ? S.notif.filter((n) => !n.lida) : S.notif;
  return `<main class="page" style="max-width:960px">
    ${cab({
      titulo: 'Avisos',
      sub: 'Menções, passagens de vez, respostas de triagem, anexos e itens prontos para validação.',
      acoes: S.notif.some((n) => !n.lida) ? '<button type="button" class="btn" data-acao="ler-todas">Marcar todos como lidos</button>' : '',
    })}
    ${cartao('Seus avisos', ns.map((n) => {
      const x = n.item_id ? item(S, n.item_id) : null;
      return `<div class="nt${n.lida ? ' lida' : ''}"><span class="ponto"${n.lida ? '' : ' role="img" aria-label="Novo"'}></span>
        <div style="flex:1;min-width:0"><p class="sm">${e(n.texto)}</p><p class="xs muted">${quando(n.criado_em)}</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${x ? `<button type="button" class="btn sm" data-acao="abrir-notif" data-id="${n.id}" data-item="${x.id}">Abrir</button>` : ''}${n.lida ? '' : `<button type="button" class="lnk" data-acao="ler" data-id="${n.id}">Marcar como lido</button>`}</div></div>`;
    }).join('') || '<p class="vazio">Nenhum aviso.</p>',
    `<div class="seg" role="group" aria-label="Filtro"><button type="button" class="${fil === 'todas' ? 'on' : ''}" aria-pressed="${fil === 'todas'}" data-acao="filtro" data-chave="notif" data-valor="todas">Todos</button><button type="button" class="${fil === 'novas' ? 'on' : ''}" aria-pressed="${fil === 'novas'}" data-acao="filtro" data-chave="notif" data-valor="novas">Não lidos</button></div>`)}
  </main>`;
}

// ------------------------------------------------------------------ envio de anexos
async function enviarPendentes(S, itemId, alvo, comentarioId = null) {
  const lista = S.pend[alvo] || [];
  for (const p of lista) {
    await S.api.anexar(itemId, { ...p, comentarioId });
  }
  delete S.pend[alvo];
  return lista.length;
}
function addPendente(S, alvo, p) {
  (S.pend[alvo] = S.pend[alvo] || []).push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...p });
}
export function prepararArquivo(arquivo, tipoDeMime) {
  if (arquivo.size > LIMITE_MB * 1048576) {
    throw new Error(`“${arquivo.name}” tem ${tamanhoFmt(arquivo.size)}; o limite é ${LIMITE_MB} MB. Para vídeos maiores, publique no YouTube ou no Drive e anexe o link.`);
  }
  return { arquivo, nome: arquivo.name, mime: arquivo.type || 'application/octet-stream', tipo: tipoDeMime(arquivo.type || ''), tamanho: arquivo.size };
}
// Recebe arquivos escolhidos (do <input type=file data-anexar>)
export async function receberArquivos(S, alvo, arquivos, tipoDeMime) {
  const prontos = [...arquivos].map((a) => prepararArquivo(a, tipoDeMime));
  if (alvo.startsWith('item:')) {
    const id = Number(alvo.split(':')[1]);
    for (const p of prontos) await S.api.anexar(id, p);
    return { recarregar: true, aviso: prontos.length === 1 ? 'Arquivo anexado.' : `${prontos.length} arquivos anexados.` };
  }
  prontos.forEach((p) => addPendente(S, alvo, p));
  return { aviso: prontos.length === 1 ? 'Arquivo pronto para enviar.' : `${prontos.length} arquivos prontos para enviar.` };
}
// Recebe uma gravação de áudio concluída
export async function receberGravacao(S, alvo, blob, duracao) {
  const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
  const d = new Date();
  const nome = `Mensagem de voz ${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}.${ext}`;
  const p = { arquivo: blob, nome, mime: blob.type.split(';')[0] || 'audio/webm', tipo: 'audio', tamanho: blob.size, duracao };
  if (blob.size > LIMITE_MB * 1048576) throw new Error('A gravação passou do limite de 50 MB.');
  if (alvo.startsWith('item:')) {
    await S.api.anexar(Number(alvo.split(':')[1]), p);
    return { recarregar: true, aviso: 'Áudio anexado.' };
  }
  addPendente(S, alvo, p);
  return { aviso: 'Áudio pronto para enviar com o comentário.' };
}

// ------------------------------------------------------------------ ações (cliques)
export const acoes = {
  async 'entrar-como'(S, el) { S.eu = await S.api.entrarComo(el.dataset.id); location.hash = '#/painel'; return { recarregar: true }; },
  async 'trocar-pessoa'(S) { await S.api.sair(); S.eu = null; S.pend = {}; location.hash = '#/acesso'; return {}; },
  async 'reiniciar-demo'(S) { S.api.reiniciarDemo(); return { recarregar: true, aviso: 'Exemplos restaurados.' }; },
  async sair(S) { await S.api.sair(); S.eu = null; S.pend = {}; location.hash = '#/acesso'; return {}; },
  async 'aba-acesso'(S, el) { S.abaAcesso = el.dataset.aba; return {}; },
  async 'abrir-edicao'() {
    const d = document.getElementById('editar');
    if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => document.getElementById('aj-tit')?.focus(), 300); }
    return { semRender: true };
  },
  async 'excluir-item'(S, el) {
    const x = item(S, Number(el.dataset.id));
    if (!x) return {};
    if (!confirm(`Excluir “${x.titulo}”?\n\nO item some do Quadro junto com os comentários, anexos, atribuições e o histórico. Isso não pode ser desfeito.\n\nSe a ideia é só tirá-lo de circulação, use “Arquivar”.`)) return {};
    await S.api.excluirItem(x.id);
    location.hash = '#/quadro';
    return { recarregar: true, aviso: 'Item excluído.' };
  },
  async imprimir() { window.print(); return { semRender: true }; },
  async 'filtro-frente'(S, el) {
    Object.assign(S.filtros, { frente: el.dataset.valor, origem: 'todas', q: '' });
    location.hash = '#/quadro';
    return {};
  },
  async destaque(S, el) {
    const x = item(S, Number(el.dataset.id));
    await S.api.atualizarItem(x.id, { destaque: !x.destaque });
    return { recarregar: true, aviso: x.destaque ? 'Item tirado dos destaques.' : 'Item marcado como destaque: ele aparece na linha do tempo da Síntese.' };
  },
  async copiar(S, el) {
    const t = el.dataset.texto || '';
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      const a = document.createElement('textarea');
      a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove();
    }
    return { aviso: 'Mensagem copiada. Cole no e-mail ou no WhatsApp.' };
  },
  async 'gh-ignorar'(S, el) {
    const ignorar = el.dataset.valor === '1';
    await S.api.githubIgnorar(Number(el.dataset.numero), ignorar);
    return { recarregar: true, aviso: ignorar ? `Issue #${el.dataset.numero} ignorada.` : `Issue #${el.dataset.numero} voltou para avaliação.` };
  },
  async filtro(S, el) { S.filtros[el.dataset.chave] = el.dataset.valor; return {}; },
  async 'limpar-busca'(S) { S.filtros.q = ''; return {}; },
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
    return { recarregar: true, aviso: 'Situação da pessoa atualizada.' };
  },
  async ler(S, el) { await S.api.marcarLida(Number(el.dataset.id)); return { recarregar: true }; },
  async 'ler-todas'(S) { await S.api.marcarTodas(); return { recarregar: true }; },
  async 'abrir-notif'(S, el) { await S.api.marcarLida(Number(el.dataset.id)); location.hash = `#/item/${el.dataset.item}`; return { recarregar: true }; },

  // anexos
  async 'abrir-link'(S, el) { S.linkAberto = S.linkAberto === el.dataset.alvo ? null : el.dataset.alvo; return { foco: `lk-url-${el.dataset.alvo}` }; },
  async 'fechar-link'(S) { S.linkAberto = null; return {}; },
  async 'confirmar-link'(S, el) {
    const alvo = el.dataset.alvo;
    const caixa = document.querySelector(`[data-linkbox="${CSS.escape(alvo)}"]`);
    const url = caixa.querySelector('[name=url]').value.trim();
    let nome = caixa.querySelector('[name=nome]').value.trim();
    if (!linkSeguro(url)) throw new Error('Use um endereço completo, começando com https://');
    if (!nome) nome = youtubeId(url) ? 'Vídeo do YouTube' : new URL(url).hostname;
    S.linkAberto = null;
    if (alvo.startsWith('item:')) {
      await S.api.anexar(Number(alvo.split(':')[1]), { tipo: 'link', nome, url });
      return { recarregar: true, aviso: 'Link anexado.' };
    }
    addPendente(S, alvo, { tipo: 'link', nome, url });
    return { aviso: 'Link pronto para enviar.' };
  },
  async 'tirar-pend'(S, el) {
    S.pend[el.dataset.alvo] = (S.pend[el.dataset.alvo] || []).filter((p) => p.id !== el.dataset.id);
    return {};
  },
  async 'remover-anexo'(S, el) {
    if (!confirm('Remover este anexo? Esta ação não pode ser desfeita.')) return {};
    const lista = await S.api.anexos(Number(el.dataset.item));
    const a = lista.find((x) => x.id === Number(el.dataset.id));
    if (a) await S.api.removerAnexo(a);
    return { recarregar: true, aviso: 'Anexo removido.' };
  },
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
  async buscar(S, fd) { S.filtros.q = txt(fd, 'q'); S.filtros.frente = 'todas'; S.filtros.origem = 'todas'; location.hash = '#/quadro'; return {}; },
  async novo(S, fd) {
    const inst = S.eu.instituicao_id;
    const atribuir = fd.get('destino') === 'atribuir';
    const resp = txt(fd, 'responsavel') || null;
    const origemSel = txt(fd, 'origem');
    const dados = {
      tipo: txt(fd, 'tipo'), titulo: txt(fd, 'titulo'), descricao: txt(fd, 'descricao'), frente: txt(fd, 'frente'),
      modulo: txt(fd, 'modulo'), origem: origemSel, prioridade: txt(fd, 'prioridade'), prazo: txt(fd, 'prazo') || null,
      instrumento: txt(fd, 'instrumento') || null, fase: 'priorizado',
      envolvidas: origemSel === 'CONJUNTA' ? ['INPE', 'ANPPEA'] : [inst],
      responsavel_id: atribuir ? null : resp, vez_instituicao: inst, vez_membro_id: atribuir ? null : resp,
    };
    const atr = atribuir ? {
      para_instituicao: outraParceira(inst), justificativa: dados.descricao,
      prazo_sugerido: dados.prazo, sugerido_membro_id: txt(fd, 'sugerido') || null,
    } : null;
    const it = await S.api.criarItem(dados, atr);
    const n = await enviarPendentes(S, it.id, 'novo');
    location.hash = `#/item/${it.id}`;
    return { recarregar: true, aviso: `${atribuir ? 'Registrado e enviado para a triagem' : 'Registrado'}${n ? `, com ${n} ${n === 1 ? 'anexo' : 'anexos'}` : ''}.` };
  },
  async 'atribuir-novo'(S, fd) {
    const inst = S.eu.instituicao_id;
    const prazo = txt(fd, 'prazo') || null;
    await S.api.criarItem({
      tipo: 'demanda', titulo: txt(fd, 'titulo'), descricao: txt(fd, 'justificativa'), frente: txt(fd, 'frente'),
      origem: inst, prioridade: 'media', prazo, fase: 'priorizado', envolvidas: [inst], vez_instituicao: inst,
    }, {
      para_instituicao: outraParceira(inst), justificativa: txt(fd, 'justificativa'),
      prazo_sugerido: prazo, sugerido_membro_id: txt(fd, 'sugerido') || null,
    });
    S.filtros.triagem = 'enviadas';
    return { recarregar: true, aviso: `Demanda atribuída. A coordenação ${daDo(outraParceira(inst))} ${outraParceira(inst)} foi avisada.` };
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
    const id = Number(form.dataset.id);
    const titulo = txt(fd, 'titulo');
    if (titulo.length < 3) throw new Error('O título precisa ter pelo menos 3 caracteres.');
    const patch = {
      titulo, descricao: txt(fd, 'descricao') || null, tipo: txt(fd, 'tipo'), frente: txt(fd, 'frente'),
      modulo: txt(fd, 'modulo') || null, instrumento: txt(fd, 'instrumento') || null,
      responsavel_id: txt(fd, 'responsavel') || null, prazo: txt(fd, 'prazo') || null,
      prioridade: txt(fd, 'prioridade'), envolvidas: fd.getAll('envolvidas'),
    };
    if (fd.has('github_numero')) {
      const n = txt(fd, 'github_numero') ? Number(txt(fd, 'github_numero')) : null;
      if (n !== null && !(Number.isInteger(n) && n > 0)) throw new Error('Informe só o número da issue, por exemplo 42.');
      if (n !== (item(S, id)?.github_numero || null)) patch.github_numero = n;
    }
    await S.api.atualizarItem(id, patch);
    return { recarregar: true, aviso: 'Alterações salvas.' };
  },
  async comentar(S, fd, form) {
    if (S.rec) throw new Error('Termine a gravação do áudio antes de publicar.');
    const id = Number(form.dataset.id);
    const alvo = `cm:${id}`;
    const texto = txt(fd, 'texto');
    const proposta = !!fd.get('proposta');
    if (!texto && !(S.pend[alvo] || []).length) throw new Error('Escreva um comentário ou anexe algo.');
    const c = await S.api.comentar(id, texto, proposta);
    const n = await enviarPendentes(S, id, alvo, c.id);
    if (proposta) {
      await S.api.proporDecisao({ titulo: item(S, id).titulo, descricao: texto, item_id: id });
    }
    return { recarregar: true, aviso: `Comentário publicado${n ? ` com ${n} ${n === 1 ? 'anexo' : 'anexos'}` : ''}${proposta ? ' e levado à pauta do comitê' : ''}.` };
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
    return { recarregar: true, aviso: 'Convite gerado. Agora mande pelo seu e-mail.' };
  },
  async 'gh-adicionar'(S, fd, form) {
    const n = Number(form.dataset.numero);
    const id = await S.api.githubAdicionar(n, txt(fd, 'origem'), txt(fd, 'frente') || null);
    location.hash = `#/item/${id}`;
    return { recarregar: true, aviso: `Issue #${n} adicionada ao Quadro.` };
  },
  async 'gh-vincular'(S, fd, form) {
    const n = Number(form.dataset.numero);
    const id = Number(txt(fd, 'item'));
    await S.api.atualizarItem(id, { github_numero: n });
    return { recarregar: true, aviso: `Issue #${n} vinculada a “${item(S, id)?.titulo || 'item'}”.` };
  },
  async github(S, fd) {
    await S.api.definirGithub(txt(fd, 'membro'), txt(fd, 'login'));
    return { recarregar: true, aviso: txt(fd, 'login') ? 'Usuário do GitHub salvo.' : 'Usuário do GitHub removido.' };
  },
  async perfil(S, fd, form) {
    await S.api.atualizarMembro(form.dataset.id, { perfil: txt(fd, 'perfil') });
    return { recarregar: true, aviso: 'Perfil atualizado.' };
  },
};
