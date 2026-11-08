// Formações: painel dos processos formativos e atualização por planilha.
// Os mapas usam a malha oficial do IBGE (Malha Municipal Digital 2025), já simplificada
// e convertida em caminhos SVG nos arquivos malha-uf.json e malha-municipios.json.
import { e, dataLonga, dataCurta, quando, siglaDe, podeEditar } from './util.js?v=20261108b';

const V = '20261108b';
const XLSX_URL = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';

// ------------------------------------------------------------------ constantes
// qualquer pessoa da plataforma que não tenha perfil só de leitura
export const podeFormacao = (eu) => podeEditar(eu);
const REGIAO_UF = { AC: 'Norte', AM: 'Norte', AP: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
  AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste', PE: 'Nordeste', PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
  DF: 'Centro-Oeste', GO: 'Centro-Oeste', MS: 'Centro-Oeste', MT: 'Centro-Oeste',
  ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste', PR: 'Sul', RS: 'Sul', SC: 'Sul' };
const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
const COR_REAL = { INPE: '#0077B8', ANPPEA: '#D8920C', CONJUNTA: '#7A5FB8' };
const NOME_REAL = { INPE: 'INPE', ANPPEA: 'ANPPEA', CONJUNTA: 'Conjunta' };
const SEM_REAL = '#8A97A8';
const COR_SETOR = ['#0B3570', '#2C7FC9', '#9DC6EC', '#5B6678', '#A3ADBA', '#D6DCE4'];
const RAMPA = ['#E3EEF9', '#B7D3F0', '#6FA3DD', '#2C63AE', '#0B3570'];
const ZERO = '#EEF1F5';
const FAIXAS = { uf: [1, 10, 20, 50, 100], mun: [1, 2, 5, 20, 50] };
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const TOTAL_MUN = 5570;

// ------------------------------------------------------------------ malhas do IBGE
const malhas = {};
async function malha(qual) {
  if (!malhas[qual]) {
    malhas[qual] = fetch(`malha-${qual === 'uf' ? 'uf' : 'municipios'}.json?v=${V}`).then((r) => {
      if (!r.ok) throw new Error('Não foi possível carregar a malha do IBGE (' + r.status + ').');
      return r.json();
    }).catch((err) => { delete malhas[qual]; throw err; });
  }
  return malhas[qual];
}
// caixa de um caminho no formato gerado (M x y l dx dy ... z)
function caixa(d, b = [Infinity, Infinity, -Infinity, -Infinity]) {
  let x = 0, y = 0, abs = false;
  const tok = d.match(/[Mlhvz]|-?\d+(?:\.\d+)?/g) || [];
  let cmd = '';
  const nums = [];
  const marca = () => { if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y; };
  for (const t of tok) {
    if (/[Mlhvz]/.test(t)) { cmd = t; nums.length = 0; continue; }
    nums.push(Number(t));
    if (cmd === 'M' && nums.length === 2) { x = nums[0]; y = nums[1]; nums.length = 0; marca(); abs = true; }
    else if (cmd === 'l' && nums.length === 2) { x += nums[0]; y += nums[1]; nums.length = 0; marca(); }
    else if (cmd === 'h' && nums.length === 1) { x += nums[0]; nums.length = 0; marca(); }
    else if (cmd === 'v' && nums.length === 1) { y += nums[0]; nums.length = 0; marca(); }
  }
  return abs ? b : null;
}

// ------------------------------------------------------------------ dados
export async function garantirFormacoes(S) {
  if (!S.form) S.form = await S.api.formacoes();
  return S.form;
}
const ym = (s) => (s && /^\d{4}-\d{2}$/.test(s) ? Number(s.slice(0, 4)) * 12 + Number(s.slice(5)) - 1 : null);
const mesAno = (s) => (s ? `${MESES[Number(s.slice(5)) - 1]}/${s.slice(0, 4)}` : '—');
function periodo(p) {
  if (!p.inicio) return '—';
  if (!p.fim || p.fim === p.inicio) return mesAno(p.inicio);
  return p.inicio.slice(0, 4) === p.fim.slice(0, 4)
    ? `${MESES[Number(p.inicio.slice(5)) - 1]}–${mesAno(p.fim)}` : `${mesAno(p.inicio)} – ${mesAno(p.fim)}`;
}
function emAndamento(p) {
  const hoje = new Date();
  const agora = hoje.getFullYear() * 12 + hoje.getMonth();
  return !p.fim || ym(p.fim) >= agora;
}
function processosDe(S) {
  const v = S.form?.versao;
  if (!v) return [];
  const lista = [...(v.dados.processos || [])];
  const cods = new Set(lista.map((p) => String(p.cod)));
  for (const r of v.dados.participacoes) if (!cods.has(String(r.cod_processo))) { cods.add(String(r.cod_processo)); lista.push({ cod: String(r.cod_processo), sigla: String(r.cod_processo) }); }
  return lista.map((p) => ({ ...p, cod: String(p.cod), meta: S.form.meta[String(p.cod)] || {} }))
    .sort((a, b) => (a.inicio || '9').localeCompare(b.inicio || '9'));
}
function filtrar(S, linhas) {
  const f = S.filtros;
  const q = (f.fq || '').trim().toLowerCase();
  return linhas.filter((r) => (f.fproc === 'todos' || String(r.cod_processo) === f.fproc)
    && (f.fregiao === 'todas' || r.regiao === f.fregiao)
    && (f.fsetor === 'todos' || (r.setor || 'Não informado') === f.fsetor)
    && (f.fciea === 'todos' || (f.fciea === 'sim') === !!r.ciea)
    && (!f.fuf || r.uf === f.fuf)
    && (!q || (r.instituicao || '').toLowerCase().includes(q) || String(r.cod_pessoa).includes(q)));
}
const conta = (lista, chave) => lista.reduce((m, r) => { const k = typeof chave === 'function' ? chave(r) : r[chave]; if (k !== undefined && k !== null && k !== '') m.set(k, (m.get(k) || 0) + 1); return m; }, new Map());
const fmt = (n, d = 0) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: d });
const titulo = (s) => String(s || '').toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()).replace(/\b(De|Da|Do|Das|Dos|E)\b/g, (c) => c.toLowerCase());

// ------------------------------------------------------------------ verificação de consistência
// Código IBGE da UF = 2 primeiros dígitos do código do município
const UF_IBGE = { 11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO', 21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
  31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS', 50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF' };
// Verificações de um processo (usadas na tabela, na edição e na qualidade dos dados)
export function verificarProcesso(p, nPart) {
  const out = [];
  const nome = p.sigla || p.cod;
  if (p.turmas && p.carga_turma && p.carga_total && Math.abs(p.turmas * p.carga_turma - p.carga_total) > 0.5) {
    out.push({ tipo: 'erro', cod: p.cod, texto: `Carga horária de ${nome}: ${fmt(p.turmas)} ${p.turmas === 1 ? 'turma' : 'turmas'} × ${fmt(p.carga_turma)} h = ${fmt(p.turmas * p.carga_turma)} h, mas o total informado é ${fmt(p.carga_total)} h`, n: 1, acao: 'Corrigir as turmas, a carga por turma ou o total' });
  }
  if (p.inicio && p.fim && p.fim < p.inicio) out.push({ tipo: 'erro', cod: p.cod, texto: `${nome} termina (${mesAno(p.fim)}) antes de começar (${mesAno(p.inicio)})`, n: 1, acao: 'Corrigir o início ou o fim' });
  if (!p.inicio) out.push({ tipo: 'aviso', cod: p.cod, texto: `${nome} sem data de início`, n: 1, acao: 'Informar o mês de início' });
  if (!p.carga_total && !(p.turmas && p.carga_turma)) out.push({ tipo: 'aviso', cod: p.cod, texto: `${nome} sem carga horária`, n: 1, acao: 'Informar as turmas e a carga horária' });
  if (nPart === 0) out.push({ tipo: 'aviso', cod: p.cod, texto: `${nome} não tem nenhuma participação`, n: 1, acao: 'Conferir o código do processo na aba de participações' });
  return out;
}
// Todas as verificações de um conjunto de dados {processos, participacoes}
export function verificar(dados) {
  const procs = dados.processos || [];
  const parts = dados.participacoes || [];
  const out = [];
  const porProc = conta(parts, (r) => String(r.cod_processo));
  for (const p of procs) out.push(...verificarProcesso({ ...p, cod: String(p.cod) }, porProc.get(String(p.cod)) || 0));
  const cods = new Set(procs.map((p) => String(p.cod)));
  const orfas = parts.filter((r) => !cods.has(String(r.cod_processo))).length;
  if (orfas) out.push({ tipo: 'aviso', texto: 'Participações de processos sem cadastro na aba de processos', n: orfas, acao: 'Incluir o processo (código, datas e carga)' });
  const chaves = conta(parts, (r) => `${r.cod_pessoa}|${r.cod_processo}`);
  const dup = [...chaves.values()].filter((n) => n > 1).reduce((t, n) => t + n - 1, 0);
  if (dup) out.push({ tipo: 'erro', texto: 'Mesma pessoa mais de uma vez no mesmo processo', n: dup, acao: 'Unificar os registros na planilha' });
  const munFora = parts.filter((r) => r.cod_mun && r.uf && UF_IBGE[r.cod_mun.slice(0, 2)] !== r.uf).length;
  if (munFora) out.push({ tipo: 'erro', texto: 'Município de outra UF (o código IBGE não bate com a UF informada)', n: munFora, acao: 'Conferir a UF ou o código do município' });
  const regFora = parts.filter((r) => r.uf && r.regiao && REGIAO_UF[r.uf] && REGIAO_UF[r.uf] !== r.regiao).length;
  if (regFora) out.push({ tipo: 'aviso', texto: 'Região diferente da região da UF', n: regFora, acao: 'Conferir a UF ou a região' });
  const generos = new Map();
  for (const r of parts) if (r.genero) { const g = generos.get(r.cod_pessoa) || new Set(); g.add(r.genero); generos.set(r.cod_pessoa, g); }
  const genDiv = [...generos.values()].filter((g) => g.size > 1).length;
  if (genDiv) out.push({ tipo: 'aviso', texto: 'Mesma pessoa com gênero diferente em processos diferentes', n: genDiv, acao: 'Conferir o cadastro da pessoa' });
  const semUF = parts.filter((r) => !r.uf).length;
  if (semUF) out.push({ tipo: 'aviso', texto: 'Participantes sem UF', n: semUF, acao: 'Usar a sigla da UF (ex.: SP)' });
  if (!parts.some((r) => r.cod_mun)) out.push({ tipo: 'aviso', texto: 'Coluna de município (código IBGE) ausente', n: parts.length, acao: 'Sem ela o mapa por município fica sem cores' });
  else { const sem = parts.filter((r) => !r.cod_mun).length; if (sem) out.push({ tipo: 'aviso', texto: 'Participantes sem código de município', n: sem, acao: 'Completar o código IBGE' }); }
  const outros = parts.filter((r) => /^outros?$/i.test(r.instituicao || '')).length;
  if (outros) out.push({ tipo: 'aviso', texto: 'Instituição registrada só como "OUTROS"', n: outros, acao: 'Identificar a instituição' });
  return out.sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === 'erro' ? -1 : 1));
}
export const contarAlertas = (lista) => ({ erros: lista.filter((x) => x.tipo === 'erro').length, avisos: lista.filter((x) => x.tipo !== 'erro').length });
// pendências que só a planilha revela (e-mail, linhas ignoradas): ficam guardadas no resumo
const daPlanilha = (v) => (v?.resumo?.pendencias || []).filter((p) => p.fonte === 'planilha' || /e-mail|ignoradas/i.test(p.texto));

// ------------------------------------------------------------------ peças visuais
const legenda = (itens) => `<div class="fm-lg">${itens.map(([cor, txt, borda]) => `<span><i style="background:${cor}${borda ? ';outline:1px solid #C9D2DD' : ''}"></i>${e(txt)}</span>`).join('')}</div>`;
function faixa(n, lim) { let k = -1; lim.forEach((l, i) => { if (n >= l) k = i; }); return k; }
function rotulosFaixa(lim) {
  return lim.map((l, i) => (i === lim.length - 1 ? `${l} ou mais` : (lim[i + 1] - 1 === l ? `${l}` : `${l} a ${lim[i + 1] - 1}`)));
}
function barra(itens, total, alt = 14) {
  return `<div class="fm-stk" style="height:${alt}px">${itens.filter(([, v]) => v).map(([cor, v, tip]) => `<span title="${e(tip)}" style="flex:${v};background:${cor}"></span>`).join('')}${total ? '' : ''}</div>`;
}

function blocoMapa(S, rs, mUF, mMun) {
  const f = S.filtros;
  const modo = f.fmapa === 'mun' ? 'mun' : 'uf';
  const medida = f.fmed === 'pessoas' ? 'pessoas' : 'part';
  const contar = (chave) => {
    if (medida === 'part') return conta(rs, chave);
    const m = new Map();
    const vistos = new Set();
    for (const r of rs) { const k = r[chave]; const id = k + '|' + r.cod_pessoa; if (k && !vistos.has(id)) { vistos.add(id); m.set(k, (m.get(k) || 0) + 1); } }
    return m;
  };
  const rotMedida = medida === 'part' ? 'participações' : 'pessoas';
  const lim = FAIXAS[modo];
  const leg = legenda([[ZERO, 'nenhuma', true], ...rotulosFaixa(lim).map((t, i) => [RAMPA[i], t])]);
  const botoes = `<div class="seg" role="group" aria-label="Recorte do mapa">${[['uf', 'Por UF'], ['mun', 'Por município']].map(([k, t]) => `<button type="button" class="${modo === k ? 'on' : ''}" aria-pressed="${modo === k}" data-acao="filtro" data-chave="fmapa" data-valor="${k}">${t}</button>`).join('')}</div>
    <div class="seg" role="group" aria-label="Medida">${[['part', 'Participações'], ['pessoas', 'Pessoas']].map(([k, t]) => `<button type="button" class="${medida === k ? 'on' : ''}" aria-pressed="${medida === k}" data-acao="filtro" data-chave="fmed" data-valor="${k}">${t}</button>`).join('')}</div>`;
  let svg = '', lado = '', aviso = '';
  if (modo === 'uf') {
    const c = contar('uf');
    const paths = mUF.uf.map((u) => {
      const n = c.get(u.uf) || 0;
      const k = faixa(n, lim);
      const sel = f.fuf === u.uf;
      return `<path class="fm-uf${sel ? ' sel' : ''}" d="${u.d}" fill="${k < 0 ? ZERO : RAMPA[k]}" data-acao="fm-uf" data-uf="${u.uf}"><title>${e(u.nm)} (${u.uf}): ${fmt(n)} ${rotMedida}</title></path>`;
    }).join('');
    svg = `<svg class="fm-map" viewBox="0 0 ${mUF.w} ${mUF.h}" role="img" aria-label="Mapa das UF do Brasil, coloridas por número de ${rotMedida}">${paths}</svg>`;
    const top = [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const nomeUF = Object.fromEntries(mUF.uf.map((u) => [u.uf, u.nm]));
    lado = `<div class="xs muted" style="margin-bottom:6px">UF com mais ${rotMedida}</div><table class="fm-tb"><tbody>${top.map(([u, n]) => `<tr><td><button type="button" class="lnk" data-acao="fm-uf" data-uf="${u}">${e(nomeUF[u] || u)}</button></td><td class="n">${fmt(n)}</td></tr>`).join('') || '<tr><td class="muted">Nenhuma UF no filtro.</td></tr>'}</tbody></table>
      <p class="xs muted" style="margin-top:10px">Clique numa UF para filtrar o painel e ver os municípios dela.</p>`;
  } else {
    const temMun = rs.some((r) => r.cod_mun);
    const c = contar('cod_mun');
    const lista = f.fuf ? mMun.mun.filter((m) => m[2] === f.fuf) : mMun.mun;
    let vb = `0 0 ${mMun.w} ${mMun.h}`;
    if (f.fuf && mMun.contorno_uf[f.fuf]) {
      const b = caixa(mMun.contorno_uf[f.fuf]);
      if (b) { const pad = Math.max(b[2] - b[0], b[3] - b[1]) * 0.04; vb = `${b[0] - pad} ${b[1] - pad} ${b[2] - b[0] + 2 * pad} ${b[3] - b[1] + 2 * pad}`; }
    }
    const paths = lista.map(([cd, nm, uf, d]) => {
      const n = c.get(cd) || 0;
      const k = faixa(n, lim);
      return `<path d="${d}" fill="${k < 0 ? ZERO : RAMPA[k]}"${n ? '' : ' class="z"'}><title>${e(nm)} (${uf}): ${fmt(n)} ${rotMedida}</title></path>`;
    }).join('');
    const ufs = Object.entries(mMun.contorno_uf).filter(([u]) => !f.fuf || u === f.fuf).map(([, d]) => `<path class="fm-cont" d="${d}"></path>`).join('');
    svg = `<svg class="fm-map mun" viewBox="${vb}" role="img" aria-label="Mapa dos municípios${f.fuf ? ' de ' + f.fuf : ' do Brasil'}, coloridos por número de ${rotMedida}">${paths}${ufs}</svg>`;
    const nomes = new Map(mMun.mun.map((m) => [m[0], `${m[1]} (${m[2]})`]));
    const top = [...c.entries()].filter(([cd]) => !f.fuf || nomes.get(cd)?.endsWith(`(${f.fuf})`)).sort((a, b) => b[1] - a[1]).slice(0, 8);
    lado = `<div class="xs muted" style="margin-bottom:6px">Municípios com mais ${rotMedida}</div><table class="fm-tb"><tbody>${top.map(([cd, n]) => `<tr><td>${e(nomes.get(cd) || cd)}</td><td class="n">${fmt(n)}</td></tr>`).join('') || '<tr><td class="muted">Nenhum município identificado no filtro.</td></tr>'}</tbody></table>`;
    if (!temMun) aviso = '<p class="fm-aviso">A planilha publicada não traz o código IBGE do município de cada participante, então o mapa fica sem cores. Inclua uma coluna com o código de 7 dígitos (por exemplo, 3550308 para São Paulo) e atualize os dados.</p>';
  }
  return `<section class="card fm-bx" aria-labelledby="t-mapa">
    <div class="fm-cab"><div><h2 id="t-mapa">Onde estão os participantes${f.fuf ? ` · ${e(f.fuf)} <button type="button" class="lnk" data-acao="fm-uf" data-uf="">ver Brasil</button>` : ''}</h2><p class="s">Malha oficial do IBGE (2025). Passe o mouse para ver os números de cada ${modo === 'uf' ? 'UF' : 'município'}.</p></div><div class="fm-acoes">${botoes}</div></div>
    ${leg}
    <div class="fm-mapa-l"><div class="fm-mapa-w">${svg}</div><div class="fm-mapa-lado">${lado}${aviso}</div></div>
  </section>`;
}

// ------------------------------------------------------------------ página principal
export async function pagFormacoes(S) {
  await garantirFormacoes(S);
  const v = S.form.versao;
  const pode = podeFormacao(S.eu);
  const cab = `<div class="ph"><div class="txt"><h1>Formações</h1><p class="sub">Processos formativos do MonitoraEA e parceiros: quem participou, onde e com que carga horária</p></div>
    <div class="acoes-ph">${v ? '<button type="button" class="btn" data-acao="imprimir">Imprimir ou salvar PDF</button>' : ''}${pode ? '<a class="btn pri" href="#/formacoes/atualizar">Atualizar dados</a>' : ''}</div></div>`;
  if (!v) {
    return `<main class="page">${cab}<section class="card fm-bx" style="text-align:center;padding:48px 24px"><h2>Nenhum dado de formação publicado ainda</h2>
      <p class="sub" style="margin:8px auto 18px">Os dados vêm da planilha de processos formativos (abas de participações e de processos). ${pode ? 'Envie a planilha para montar o painel.' : 'Quem atualiza é qualquer pessoa da plataforma com perfil de edição.'}</p>
      ${pode ? '<a class="btn pri" href="#/formacoes/atualizar">Enviar a planilha</a>' : ''}</section></main>`;
  }
  const [mUF, mMun] = await Promise.all([malha('uf'), S.filtros.fmapa === 'mun' ? malha('mun') : Promise.resolve(null)]);
  const f = S.filtros;
  const todas = v.dados.participacoes;
  const rs = filtrar(S, todas);
  const procs = processosDe(S);
  const alertas = verificar(v.dados);
  const nAl = contarAlertas(alertas);
  const alertasProc = (cod) => alertas.filter((x) => x.cod === cod);
  const procsF = f.fproc === 'todos' ? procs : procs.filter((p) => p.cod === f.fproc);
  const pessoas = new Set(rs.map((r) => r.cod_pessoa));
  const multi = [...conta(todas, 'cod_pessoa').values()].filter((n) => n > 1).length;
  const formadores = new Set(rs.filter((r) => r.papel === 'formador').map((r) => r.cod_pessoa)).size;
  const cargas = procsF.filter((p) => typeof p.carga_total === 'number');
  const cargaTot = cargas.reduce((s, p) => s + p.carga_total, 0);
  const ufs = new Set(rs.map((r) => r.uf).filter(Boolean));
  const muns = new Set(rs.map((r) => r.cod_mun).filter(Boolean));
  const mulheres = rs.filter((r) => r.genero === 'F').length;
  const comGenero = rs.filter((r) => r.genero).length;
  const quem = S.d.membros.find((m) => m.id === v.criado_por);

  // filtros
  const setores = [...conta(todas, (r) => r.setor || 'Não informado').entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
  const opt = (lista, atual) => lista.map(([k, t]) => `<option value="${e(k)}"${k === atual ? ' selected' : ''}>${e(t)}</option>`).join('');
  const filtros = `<form class="fm-filtros" data-form="fm-busca">
    <div class="fm-f"><label for="ff-proc">Processo</label><select id="ff-proc" data-filtro="fproc">${opt([['todos', `Todos os ${procs.length}`], ...procs.map((p) => [p.cod, p.sigla || p.cod])], f.fproc)}</select></div>
    <div class="fm-f"><label for="ff-reg">Região</label><select id="ff-reg" data-filtro="fregiao">${opt([['todas', 'Todas'], ...REGIOES.map((r) => [r, r])], f.fregiao)}</select></div>
    <div class="fm-f"><label for="ff-set">Setor</label><select id="ff-set" data-filtro="fsetor">${opt([['todos', 'Todos'], ...setores.map((s) => [s, titulo(s)])], f.fsetor)}</select></div>
    <div class="fm-f"><label for="ff-ciea">Representa CIEA</label><select id="ff-ciea" data-filtro="fciea">${opt([['todos', 'Todos'], ['sim', 'Sim'], ['nao', 'Não']], f.fciea)}</select></div>
    <div class="fm-f" style="flex:1 1 220px"><label for="ff-q">Buscar instituição ou código</label><div style="display:flex;gap:6px"><input id="ff-q" name="q" type="search" value="${e(f.fq || '')}" placeholder="Ex.: Ibama, Secretaria, 30012"><button class="btn sm" type="submit">Buscar</button></div></div>
    ${(f.fproc !== 'todos' || f.fregiao !== 'todas' || f.fsetor !== 'todos' || f.fciea !== 'todos' || f.fuf || f.fq) ? '<button type="button" class="lnk" data-acao="fm-limpar" style="align-self:center">Limpar filtros</button>' : ''}
  </form>`;

  const kpi = (k, val, d) => `<div class="card"><span class="k">${k}</span><span class="v">${val}</span><span class="d">${d}</span></div>`;
  const kpis = `<div class="fm-kp">
    ${kpi('Processos formativos', procsF.length, `${procsF.filter(emAndamento).length} em andamento`)}
    ${kpi('Pessoas únicas', fmt(pessoas.size), formadores ? `${fmt(pessoas.size - formadores)} formandos, ${fmt(formadores)} formadores` : 'no filtro')}
    ${kpi('Participações', fmt(rs.length), f.fproc === 'todos' && !f.fuf ? `${fmt(multi)} pessoas em mais de um processo` : 'uma por pessoa em cada processo')}
    ${kpi('Carga horária média', cargas.length ? `${fmt(cargaTot / cargas.length)} h` : '—', cargas.length ? `por processo · ${fmt(cargaTot)} h no total` : 'carga não informada')}
    ${kpi('Cobertura', `${ufs.size} UF`, muns.size ? `${fmt(muns.size)} de ${fmt(TOTAL_MUN)} municípios` : 'municípios: falta o código IBGE')}
    ${kpi('Mulheres', comGenero ? `${fmt((100 * mulheres) / comGenero)}%` : '—', comGenero ? `${fmt(mulheres)} de ${fmt(comGenero)} participações` : 'gênero não informado')}
  </div>`;

  // processos
  const partPorProc = conta(todas, 'cod_processo');
  const ufPorProc = new Map(procs.map((p) => [p.cod, new Set(todas.filter((r) => String(r.cod_processo) === p.cod).map((r) => r.uf).filter(Boolean)).size]));
  const itensAbertos = S.d.itens.filter((x) => x.fase !== 'arquivado');
  const linhaProc = (p) => {
    const real = p.meta.realizacao;
    const item = p.meta.item_id ? S.d.itens.find((x) => x.id === p.meta.item_id) : null;
    const turmas = p.turmas && p.carga_turma ? `${p.turmas} × ${fmt(p.carga_turma)} h` : (p.carga_total ? `${fmt(p.carga_total)} h` : '—');
    const al = alertasProc(p.cod);
    const alErro = al.some((x) => x.tipo === 'erro');
    const marca = al.length ? ` <span class="fm-marca${alErro ? ' er' : ''}" title="${e(al.map((x) => x.texto).join(' · '))}">${icone(alErro ? 'er' : 'wa')}${alErro ? 'Inconsistente' : 'Incompleto'}</span>` : '';
    const aberto = S.fmEditar === p.cod;
    const num = (k, rot, passo = '1') => `<div class="f"><label for="fp-${k}-${e(p.cod)}">${rot}</label><input id="fp-${k}-${e(p.cod)}" name="${k}" type="number" min="0" step="${passo}" value="${p[k] ?? ''}" data-fm-calc></div>`;
    return `<tr id="proc-${e(p.cod)}"${f.fproc === p.cod ? ' class="sel"' : ''}>
      <td class="muted">${e(p.cod)}</td>
      <td><button type="button" class="lnk forte" data-acao="filtro" data-chave="fproc" data-valor="${e(f.fproc === p.cod ? 'todos' : p.cod)}" title="${f.fproc === p.cod ? 'Ver todos os processos' : 'Filtrar o painel por este processo'}">${e(p.sigla || p.cod)}</button>${marca}${p.nome ? `<div class="xs muted">${e(p.nome)}</div>` : ''}</td>
      <td>${e(periodo(p))}</td><td>${e(p.modalidade || '—')}</td><td class="n${al.some((x) => x.tipo === 'erro' && /Carga/.test(x.texto)) ? ' fm-ruim' : ''}">${turmas}${p.carga_total && p.turmas && p.carga_turma ? `<div class="xs muted">total ${fmt(p.carga_total)} h</div>` : ''}</td>
      <td class="n"><b>${fmt(partPorProc.get(p.cod) || 0)}</b></td><td class="n">${ufPorProc.get(p.cod) || 0}</td>
      <td>${real ? `<span class="fm-real"><i style="background:${COR_REAL[real]}"></i>${NOME_REAL[real]}</span>` : '<span class="xs muted">a definir</span>'}</td>
      <td><span class="fm-pill ${emAndamento(p) ? 'and' : 'fim'}">${emAndamento(p) ? 'Em andamento' : 'Concluído'}</span></td>
      <td>${item ? `<a href="#/item/${item.id}" class="sm">${e(item.titulo.length > 42 ? item.titulo.slice(0, 40) + '…' : item.titulo)} ›</a>` : '<span class="xs muted">—</span>'}
        ${pode ? `<div><button type="button" class="lnk xs fm-edbt" data-acao="${aberto ? 'fm-fechar' : 'fm-editar'}" data-cod="${e(p.cod)}" aria-expanded="${aberto}">${aberto ? 'Fechar edição' : (al.length ? 'Editar e corrigir' : 'Editar')}</button></div>` : ''}</td></tr>
      ${pode && aberto ? `<tr class="fm-edrow"><td colspan="10"><form class="form fm-edf" data-form="fm-proc" data-cod="${e(p.cod)}"><h3>Editar ${e(p.sigla || p.cod)}</h3>
          ${al.length ? `<div class="fm-edal">${al.map((x) => `<div>${icone(x.tipo === 'erro' ? 'er' : 'wa')}<span>${e(x.texto)}</span></div>`).join('')}</div>` : ''}
          <div class="fm-edg">
            <div class="f"><label for="fp-sigla-${e(p.cod)}">Sigla</label><input id="fp-sigla-${e(p.cod)}" name="sigla" type="text" maxlength="80" value="${e(p.sigla || '')}"></div>
            <div class="f"><label for="fp-mod-${e(p.cod)}">Modalidade</label><input id="fp-mod-${e(p.cod)}" name="modalidade" type="text" maxlength="40" value="${e(p.modalidade || '')}" placeholder="Presencial, Virtual, Híbrido"></div>
            <div class="f largo"><label for="fp-nome-${e(p.cod)}">Descrição</label><input id="fp-nome-${e(p.cod)}" name="nome" type="text" maxlength="300" value="${e(p.nome || '')}"></div>
            <div class="f"><label for="fp-ini-${e(p.cod)}">Início</label><input id="fp-ini-${e(p.cod)}" name="inicio" type="month" value="${e(p.inicio || '')}"></div>
            <div class="f"><label for="fp-fim-${e(p.cod)}">Fim</label><input id="fp-fim-${e(p.cod)}" name="fim" type="month" value="${e(p.fim || '')}"></div>
            ${num('turmas', 'Turmas')}${num('carga_turma', 'Horas por turma', '0.5')}${num('carga_total', 'Carga total (h)', '0.5')}
            <div class="fm-conta largo" data-fm-conta aria-live="polite">${contaCarga(p.turmas, p.carga_turma, p.carga_total)}</div>
            <div class="f"><label for="fr-${e(p.cod)}">Realização</label><select id="fr-${e(p.cod)}" name="realizacao">${opt([['', 'A definir'], ['INPE', 'INPE'], ['ANPPEA', 'ANPPEA'], ['CONJUNTA', 'Conjunta']], real || '')}</select></div>
            <div class="f"><label for="fi-${e(p.cod)}">Item do Quadro</label><select id="fi-${e(p.cod)}" name="item">${opt([['', 'Nenhum'], ...itensAbertos.map((x) => [String(x.id), x.titulo.length > 60 ? x.titulo.slice(0, 58) + '…' : x.titulo])], p.meta.item_id ? String(p.meta.item_id) : '')}</select></div>
            <div class="f largo"><label for="fp-nota-${e(p.cod)}">O que foi corrigido <span class="muted" style="font-weight:400">(vai para o histórico)</span></label><input id="fp-nota-${e(p.cod)}" name="nota" type="text" maxlength="200" placeholder="Ex.: carga total conferida com a coordenação"></div>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn sm" data-acao="fm-fechar">Cancelar</button><button class="btn sm pri" type="submit">Salvar correção</button></div></form></td></tr>` : ''}`;
  };
  const tabela = `<section class="card" style="overflow:hidden" aria-labelledby="t-proc"><div class="ch"><h2 id="t-proc">Processos formativos</h2><span class="xs muted">Clique num processo para filtrar o painel</span></div>
    <div class="fm-rolar"><table class="fm-tb grande"><thead><tr><th>Código</th><th>Processo</th><th>Período</th><th>Modalidade</th><th class="n">Turmas × horas</th><th class="n">Participações</th><th class="n">UF</th><th>Realização</th><th>Situação</th><th>No Quadro</th></tr></thead>
    <tbody>${procs.map(linhaProc).join('')}</tbody></table></div></section>`;

  // linha do tempo
  const comData = procs.filter((p) => ym(p.inicio) !== null);
  let linha = '';
  if (comData.length) {
    const hoje = new Date(); const agora = hoje.getFullYear() * 12 + hoje.getMonth();
    const a0 = Math.floor(Math.min(...comData.map((p) => ym(p.inicio))) / 12) * 12;
    const a1 = (Math.floor(Math.max(agora, ...comData.map((p) => ym(p.fim) ?? ym(p.inicio))) / 12) + 1) * 12;
    const LW = 200, W = 1080, GW = W - LW - 50, rh = 32, topo = 28, H = topo + rh * comData.length + 22;
    const X = (m) => LW + ((m - a0) / (a1 - a0)) * GW;
    const s = [`<svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:720px" role="img" aria-label="Linha do tempo dos processos formativos">`];
    for (let a = a0; a <= a1; a += 12) s.push(`<line x1="${X(a).toFixed(1)}" x2="${X(a).toFixed(1)}" y1="18" y2="${H - 18}" stroke="#EEF2F6"></line>${a < a1 ? `<text x="${(X(a) + 4).toFixed(1)}" y="12" font-size="11" fill="#8792A2">${a / 12}</text>` : ''}`);
    comData.forEach((p, i) => {
      const y = topo + i * rh;
      const xa = X(ym(p.inicio)), xb = X((ym(p.fim) ?? ym(p.inicio)) + 1);
      const cor = COR_REAL[p.meta.realizacao] || SEM_REAL;
      const n = partPorProc.get(p.cod) || 0;
      s.push(`<text x="0" y="${y + 14}" font-size="12.5" fill="#10213A">${e((p.sigla || p.cod).slice(0, 26))}</text><rect class="sx-hov" x="${xa.toFixed(1)}" y="${y + 2}" width="${Math.max(xb - xa, 8).toFixed(1)}" height="16" rx="4" fill="${cor}"${f.fproc !== 'todos' && f.fproc !== p.cod ? ' opacity=".3"' : ''}><title>${e(p.sigla || p.cod)}: ${e(periodo(p))} · ${fmt(n)} participações</title></rect>`);
      s.push(xb + 40 > W ? `<text x="${(xb - 8).toFixed(1)}" y="${y + 14}" font-size="11" font-weight="600" fill="#fff" text-anchor="end">${fmt(n)}</text>` : `<text x="${(xb + 6).toFixed(1)}" y="${y + 14}" font-size="11" fill="#5B6678">${fmt(n)}</text>`);
    });
    const xh = X(agora + hoje.getDate() / 31);
    s.push(`<line x1="${xh.toFixed(1)}" x2="${xh.toFixed(1)}" y1="16" y2="${H - 16}" stroke="#0B3570" stroke-width="2"></line><text x="${(xh - 6).toFixed(1)}" y="${H - 4}" font-size="10.5" font-weight="600" fill="#0B3570" text-anchor="end">hoje</text></svg>`);
    const reais = [...new Set(comData.map((p) => p.meta.realizacao || ''))];
    linha = `<section class="card fm-bx" aria-labelledby="t-tl"><div class="fm-cab"><div><h2 id="t-tl">Linha do tempo</h2><p class="s">Cada barra mostra o período de um processo; o número é o total de participações</p></div>${legenda(reais.map((r) => [COR_REAL[r] || SEM_REAL, NOME_REAL[r] || 'Realização a definir']))}</div><div class="fm-rolar">${s.join('')}</div></section>`;
  }

  // setor por processo e perfil
  const setTop = setores.slice(0, 5);
  const setGrupo = (s) => (setTop.includes(s) ? s : 'Outros');
  const cats = [...setTop, ...(setores.length > 5 ? ['Outros'] : [])];
  const corSet = (s) => COR_SETOR[cats.indexOf(s)] || '#D6DCE4';
  const totSet = conta(rs, (r) => setGrupo(r.setor || 'Não informado'));
  const linhasSet = procsF.map((p) => {
    const sub = rs.filter((r) => String(r.cod_processo) === p.cod);
    if (!sub.length) return '';
    const c = conta(sub, (r) => setGrupo(r.setor || 'Não informado'));
    return `<div class="fm-rw"><span>${e(p.sigla || p.cod)}</span>${barra(cats.map((s) => [corSet(s), c.get(s) || 0, `${titulo(s)}: ${fmt(c.get(s) || 0)} (${fmt((100 * (c.get(s) || 0)) / sub.length)}%)`]))}<span class="xs muted n">${fmt(sub.length)}</span></div>`;
  }).join('');
  const setor = `<section class="card fm-bx" aria-labelledby="t-set"><h2 id="t-set">Setor das instituições, por processo</h2><p class="s">Proporção das participações de cada processo</p>
    ${legenda(cats.map((s) => [corSet(s), `${titulo(s)} (${fmt(totSet.get(s) || 0)})`, s === cats[cats.length - 1] && corSet(s) === '#D6DCE4']))}<div style="margin-top:10px">${linhasSet || '<p class="vazio">Nenhuma participação no filtro.</p>'}</div></section>`;
  const pb = (rot, partes) => `<div><div class="xs muted" style="margin-bottom:6px">${rot}</div><div class="fm-stk fm-rot">${partes.filter(([, v]) => v).map(([cor, v, txt, claro]) => `<span style="flex:${v};background:${cor};color:${claro ? '#0B3570' : '#fff'}" title="${e(txt)}: ${fmt(v)}">${v / Math.max(1, partes.reduce((s, x) => s + x[1], 0)) > 0.14 ? `${e(txt)} ${fmt(v)}` : fmt(v)}</span>`).join('')}</div></div>`;
  const ciea = rs.filter((r) => r.ciea).length;
  const perfil = `<section class="card fm-bx" aria-labelledby="t-perf"><h2 id="t-perf">Perfil de quem participa</h2><p class="s">Participações no filtro</p><div class="fm-perf">
    ${pb('Gênero', [['#0B3570', mulheres, 'Mulheres'], ['#9DC6EC', comGenero - mulheres, 'Homens', true], ['#D6DCE4', rs.length - comGenero, 'Não informado', true]])}
    ${pb('Representam uma CIEA', [['#0B3570', ciea, 'Sim'], ['#D6DCE4', rs.length - ciea, 'Não', true]])}
    ${formadores ? pb('Formandos e formadores', [['#0B3570', pessoas.size - formadores, 'Formandos'], ['#D8920C', formadores, 'Formadores']]) : ''}
    ${multi ? `<p class="xs muted">${fmt(multi)} pessoas participaram de mais de um processo.</p>` : ''}</div></section>`;

  // região, cobertura, instituições
  const porReg = conta(rs, 'regiao');
  const maxReg = Math.max(1, ...porReg.values());
  const regiao = REGIOES.map((r) => `<div class="fm-rw curto"><span>${r}</span><div class="fm-stk"><span style="flex:0 0 ${((100 * (porReg.get(r) || 0)) / maxReg).toFixed(1)}%;background:#2C63AE"></span></div><span class="xs n">${fmt(porReg.get(r) || 0)}</span></div>`).join('');
  const cob = procsF.map((p) => {
    const sub = todas.filter((r) => String(r.cod_processo) === p.cod);
    const u = new Set(sub.map((r) => r.uf).filter(Boolean)).size;
    const mm = new Set(sub.map((r) => r.cod_mun).filter(Boolean)).size;
    return [p, u, mm];
  }).sort((a, b) => b[1] - a[1]).map(([p, u, mm]) => `<div class="fm-rw"><span>${e(p.sigla || p.cod)}</span><div class="fm-stk"><span style="flex:0 0 ${((100 * u) / 27).toFixed(1)}%;background:#2C63AE"></span></div><span class="xs n">${u} UF${mm ? `<br><span class="muted">${fmt(mm)} mun.</span>` : ''}</span></div>`).join('');
  const inst = [...conta(rs, 'instituicao').entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const lado = `<div class="fm-g3"><section class="card fm-bx" aria-labelledby="t-reg"><h2 id="t-reg">Por região</h2><p class="s">Participações no filtro</p>${regiao}</section>
    <section class="card fm-bx" aria-labelledby="t-cob"><h2 id="t-cob">Cobertura por processo</h2><p class="s">Em quantas das 27 UF cada processo teve participantes</p>${cob}</section>
    <section class="card fm-bx" aria-labelledby="t-inst"><h2 id="t-inst">Instituições mais frequentes</h2><p class="s">Participações no filtro</p><table class="fm-tb"><tbody>${inst.map(([i, n]) => `<tr><td>${e(i)}</td><td class="n">${fmt(n)}</td></tr>`).join('') || '<tr><td class="muted">—</td></tr>'}</tbody></table></section></div>`;

  // qualidade e histórico
  const pend = [...alertas, ...daPlanilha(v).map((p) => ({ ...p, tipo: 'aviso' }))];
  const qual = `<section class="card" aria-labelledby="t-q"><div class="ch"><h2 id="t-q" tabindex="-1">Qualidade dos dados</h2><span class="xs muted">Conferido automaticamente a cada atualização ou correção</span></div>
    <div class="fm-rolar"><table class="fm-tb grande"><thead><tr><th style="width:28px"></th><th>Verificação</th><th class="n">Registros</th><th>O que fazer</th></tr></thead><tbody>
    ${pend.map((p) => `<tr${p.tipo === 'erro' ? ' class="fm-err"' : ''}><td>${icone(p.tipo === 'erro' ? 'er' : 'wa')}</td><td>${e(p.texto)}</td><td class="n">${fmt(p.n)}</td><td class="muted">${e(p.acao || '')}${p.cod && pode ? ` <button type="button" class="btn sm" data-acao="fm-editar" data-cod="${e(p.cod)}">Corrigir</button>` : ''}</td></tr>`).join('') || `<tr><td>${icone('ok')}</td><td colspan="3">Nenhuma inconsistência encontrada.</td></tr>`}
    </tbody></table></div></section>`;
  const versoes = S.form.versoes || [];
  const hist = `<details class="card fm-hist"><summary><b>Histórico de atualizações</b> <span class="xs muted">${versoes.length} ${versoes.length === 1 ? 'versão' : 'versões'}</span></summary>
    <div class="fm-rolar"><table class="fm-tb grande"><thead><tr><th>Quando</th><th>Quem</th><th>Arquivo</th><th>Nota</th><th class="n">Participações</th><th></th></tr></thead><tbody>
    ${versoes.map((x, i) => `<tr><td>${dataLonga(x.criado_em)}<div class="xs muted">${quando(x.criado_em)}</div></td><td>${e(S.d.membros.find((m) => m.id === x.criado_por)?.nome || '—')}</td><td class="sm">${e(x.arquivo || '—')}</td><td class="sm">${e(x.nota || '')}</td><td class="n">${fmt(x.resumo?.participacoes ?? 0)}</td>
      <td>${i === 0 ? '<span class="fm-pill and">Publicada</span>' : (pode ? `<button type="button" class="btn sm" data-acao="fm-restaurar" data-id="${x.id}">Restaurar</button>` : '')}</td></tr>`).join('')}
    </tbody></table></div></details>`;

  const meta = `<div class="fm-meta">${icone('ok')}<span class="fm-meta-t">Dados de <b>${dataLonga(v.criado_em)}</b>${quem ? `, enviados por <b>${e(quem.nome)}</b>` : ''}${v.arquivo ? ` a partir de <b>${e(v.arquivo)}</b>` : ''}${v.nota ? ` · ${e(v.nota)}` : ''}</span></div>`;
  const mapa = blocoMapa(S, rs, mUF, mMun);
  const destaque = alertas.filter((x) => x.tipo === 'erro').slice(0, 3);
  const faixa = nAl.erros ? `<div class="fm-alerta" role="alert">${icone('er')}<div style="flex:1;min-width:0"><b>${nAl.erros === 1 ? 'Uma inconsistência precisa de correção' : `${nAl.erros} inconsistências precisam de correção`}</b>
      <ul>${destaque.map((x) => `<li>${e(x.texto)}${x.cod && pode ? ` <button type="button" class="lnk" data-acao="fm-editar" data-cod="${e(x.cod)}">Corrigir</button>` : ''}</li>`).join('')}</ul>
      <span class="xs">Os números do painel usam os dados como estão.${nAl.avisos ? ` Há também ${nAl.avisos} ${nAl.avisos === 1 ? 'aviso' : 'avisos'}.` : ''}</span></div>
      <button type="button" class="btn sm" data-acao="fm-ir-qualidade">Ver todas</button></div>` : '';
  return `<main class="page fm">${cab}${meta}${faixa}${filtros}${kpis}${tabela}${linha}
    <div class="fm-g2">${setor}${perfil}</div>
    ${mapa}${lado}
    ${qual}${hist}
    <p class="xs muted">Malha territorial: IBGE, Malha Municipal Digital 2025, simplificada para exibição na web. Participações contam cada pessoa uma vez por processo. O banco guarda só códigos e atributos agregáveis: nomes, e-mails e telefones da planilha não são gravados.</p>
  </main>`;
}

// conta das turmas × horas, mostrada (e atualizada ao digitar) no formulário de edição
export function contaCarga(t, h, total) {
  t = Number(t) || 0; h = Number(h) || 0; total = Number(total) || 0;
  if (!t || !h) return '';
  const calc = t * h;
  if (!total) return `<span class="muted">${fmt(t)} × ${fmt(h)} h = ${fmt(calc)} h. A carga total fica vazia.</span>`;
  if (Math.abs(calc - total) <= 0.5) return `${icone('ok')}<span>${fmt(t)} × ${fmt(h)} h = ${fmt(calc)} h, igual à carga total</span>`;
  return `${icone('er')}<span class="fm-ruim">${fmt(t)} × ${fmt(h)} h = ${fmt(calc)} h, mas a carga total diz ${fmt(total)} h</span> <button type="button" class="lnk" data-acao="fm-usar-conta" data-valor="${calc}">Usar ${fmt(calc)} h</button>`;
}
function icone(k) {
  if (k === 'ok') return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E7A43" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg>';
  if (k === 'er') return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B42323" stroke-width="2.4" stroke-linecap="round" aria-label="erro"><circle cx="12" cy="12" r="9"></circle><path d="M12 7.5v5.5"></path><path d="M12 16.5v.2"></path></svg>';
  return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A5F00" stroke-width="2.4" stroke-linecap="round" aria-label="atenção"><path d="M12 3 2.5 20h19z"></path><path d="M12 10v4.5"></path><path d="M12 17.5v.2"></path></svg>';
}

// ------------------------------------------------------------------ importação da planilha
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const CAMPOS_PART = [
  ['cod_pessoa', 'Código da pessoa', ['cod_pessoa', 'codigo_pessoa', 'id_pessoa', 'cod_participante', 'codigo_participante', 'codigo', 'cod', 'id'], true],
  ['cod_processo', 'Código do processo', ['cod_formacao', 'codigo_formacao', 'cod_processo', 'codigo_processo', 'formacao_cod', 'cod_curso'], true],
  ['uf', 'UF', ['uf', 'sigla_uf', 'estado_uf', 'uf_sigla']],
  ['cod_mun', 'Município (código IBGE)', ['cod_mun', 'cd_mun', 'codigo_ibge', 'cod_ibge', 'ibge', 'codigo_municipio', 'cod_municipio', 'municipio_ibge', 'geocodigo']],
  ['regiao', 'Região', ['regiao', 'regiao_geografica']],
  ['genero', 'Gênero', ['genero', 'sexo']],
  ['setor', 'Setor', ['setor', 'setor_instituicao', 'segmento']],
  ['instituicao', 'Instituição', ['instituicao', 'orgao', 'organizacao', 'entidade']],
  ['ciea', 'Representa CIEA', ['representando_ciea', 'representa_ciea', 'ciea']],
  ['email', 'E-mail (só para conferir, não é gravado)', ['email', 'e_mail', 'correio_eletronico']],
];
const CAMPOS_PROC = [
  ['cod', 'Código', ['cod_formacao', 'codigo_formacao', 'cod_processo', 'codigo', 'cod'], true],
  ['sigla', 'Sigla ou nome curto', ['sigla', 'formacao', 'processo', 'nome_curto', 'nome_da_formacao']],
  ['nome', 'Descrição', ['descricao', 'titulo', 'nome', 'objetivo', 'tema']],
  ['inicio', 'Início', ['inicio', 'data_inicio', 'data_de_inicio', 'comeco']],
  ['fim', 'Fim', ['fim', 'termino', 'data_fim', 'data_termino', 'data_de_termino', 'final']],
  ['turmas', 'Turmas', ['turmas', 'n_turmas', 'numero_de_turmas', 'qtd_turmas', 'quantidade_de_turmas']],
  ['carga_turma', 'Carga horária por turma', ['carga_horaria_turma', 'carga_turma', 'ch_turma', 'carga_horaria_por_turma', 'carga_horaria']],
  ['carga_total', 'Carga horária total', ['carga_horaria_total', 'carga_total', 'ch_total', 'total_de_horas', 'carga_total_h']],
  ['modalidade', 'Modalidade', ['modalidade', 'formato']],
];
function acharColuna(cols, sinonimos, usadas) {
  const nc = cols.map(norm);
  for (const s of sinonimos) { const i = nc.indexOf(s); if (i >= 0 && !usadas.has(cols[i])) return cols[i]; }
  for (const s of sinonimos) { if (s.length < 4) continue; const i = nc.findIndex((c, j) => c.includes(s) && !usadas.has(cols[j])); if (i >= 0) return cols[i]; }
  return '';
}
function mapear(cols, campos) {
  const usadas = new Set(); const m = {};
  for (const [k, , sin] of campos) { const c = acharColuna(cols, sin, usadas); m[k] = c; if (c) usadas.add(c); }
  return m;
}
async function carregarXLSX() {
  if (window.XLSX) return window.XLSX;
  await new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = XLSX_URL; s.onload = ok; s.onerror = () => falha(new Error('Não foi possível carregar o leitor de planilhas. Verifique a conexão e tente de novo.'));
    document.head.appendChild(s);
  });
  return window.XLSX;
}
export async function receberPlanilha(S, arquivo) {
  if (arquivo.size > 25 * 1024 * 1024) throw new Error('Planilha grande demais (máximo de 25 MB).');
  const X = await carregarXLSX();
  const wb = X.read(await arquivo.arrayBuffer(), { type: 'array', cellDates: true });
  const abas = {};
  for (const nome of wb.SheetNames) {
    const linhas = X.utils.sheet_to_json(wb.Sheets[nome], { defval: '', raw: true });
    if (!linhas.length) continue;
    const cols = [...new Set(linhas.flatMap((l) => Object.keys(l)))].filter((c) => !/^__EMPTY/.test(c));
    abas[nome] = { cols, linhas };
  }
  if (!Object.keys(abas).length) throw new Error('A planilha está vazia ou não tem cabeçalho na primeira linha.');
  // aba das participações: a que tem pessoa e processo; aba dos processos: a que tem carga ou sigla
  const pontua = (a, campos) => Object.values(mapear(a.cols, campos)).filter(Boolean).length;
  const nomes = Object.keys(abas);
  const abaPart = nomes.slice().sort((a, b) => (pontua(abas[b], CAMPOS_PART) - pontua(abas[a], CAMPOS_PART)) || (abas[b].linhas.length - abas[a].linhas.length))[0];
  const restoProc = nomes.filter((n) => n !== abaPart).sort((a, b) => pontua(abas[b], CAMPOS_PROC) - pontua(abas[a], CAMPOS_PROC));
  const abaProc = restoProc.length && pontua(abas[restoProc[0]], CAMPOS_PROC) >= 2 ? restoProc[0] : '';
  S.fimp = { arquivo: arquivo.name, abas, abaPart, abaProc, mPart: mapear(abas[abaPart].cols, CAMPOS_PART), mProc: abaProc ? mapear(abas[abaProc].cols, CAMPOS_PROC) : {} };
  try { await malha('mun'); } catch { /* sem a malha, códigos de 6 dígitos não são convertidos */ }
  return { aviso: `Planilha lida: ${Object.keys(abas).length} ${Object.keys(abas).length === 1 ? 'aba' : 'abas'}. Confira as colunas antes de publicar.` };
}

// ---- conversão dos valores
const texto = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? '').trim());
function codigo(v) { const t = texto(v); return /^\d+(\.0+)?$/.test(t) ? String(Number(t)) : t; }
function simNao(v) { const t = norm(v); if (['sim', 's', 'true', 'verdadeiro', '1', 'x', 'yes'].includes(t)) return true; if (['nao', 'n', 'false', 'falso', '0', 'no'].includes(t)) return false; return null; }
function genero(v) { const t = norm(v); if (['f', 'feminino', 'mulher', 'fem'].includes(t)) return 'F'; if (['m', 'masculino', 'homem', 'masc'].includes(t)) return 'M'; return null; }
function numero(v) { if (typeof v === 'number') return v; const t = texto(v).replace(/h$/i, '').replace(/\./g, '').replace(',', '.').trim(); const n = Number(t); return t && Number.isFinite(n) ? n : null; }
const NOME_MES = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
function mes(v) {
  if (v instanceof Date && !isNaN(v)) return `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, '0')}`;
  if (typeof v === 'number' && v > 20000 && v < 80000) { const d = new Date(Math.round((v - 25569) * 86400000)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; }
  const t = norm(v);
  let m;
  if ((m = t.match(/^(\d{4})_(\d{1,2})(_\d{1,2})?$/))) return `${m[1]}-${m[2].padStart(2, '0')}`;
  if ((m = t.match(/^(\d{1,2})_(\d{1,2})_(\d{4})$/))) return `${m[3]}-${m[2].padStart(2, '0')}`;
  if ((m = t.match(/^(\d{1,2})_(\d{4})$/))) return `${m[2]}-${m[1].padStart(2, '0')}`;
  if ((m = t.match(/^([a-z]{3})[a-z]*_(?:de_)?(\d{4})$/)) && NOME_MES[m[1]]) return `${m[2]}-${String(NOME_MES[m[1]]).padStart(2, '0')}`;
  if ((m = t.match(/^(\d{4})$/))) return `${m[1]}-01`;
  return null;
}

function montar(S) {
  const fi = S.fimp;
  const codsMun = malhas.munPronta || null;
  const part = fi.abas[fi.abaPart];
  const mp = fi.mPart;
  const pegar = (l, k) => (mp[k] ? l[mp[k]] : '');
  const participacoes = [];
  let ignoradas = 0, semEmail = 0, munInvalido = 0, mun6 = 0;
  for (const l of part.linhas) {
    const cod_pessoa = codigo(pegar(l, 'cod_pessoa'));
    const cod_processo = codigo(pegar(l, 'cod_processo'));
    if (!cod_pessoa || !cod_processo) { ignoradas++; continue; }
    const r = { cod_pessoa, cod_processo };
    const uf = texto(pegar(l, 'uf')).toUpperCase();
    if (/^[A-Z]{2}$/.test(uf) && REGIAO_UF[uf]) r.uf = uf;
    if (mp.cod_mun) {
      let cm = texto(pegar(l, 'cod_mun')).replace(/\D/g, '');
      if (cm.length === 6 && codsMun) { const achado = codsMun.seis.get(cm); if (achado) { cm = achado; mun6++; } }
      if (/^\d{7}$/.test(cm) && (!codsMun || codsMun.sete.has(cm))) r.cod_mun = cm; else if (cm) munInvalido++;
      if (r.cod_mun && !r.uf && codsMun) r.uf = codsMun.uf.get(r.cod_mun);
    }
    const reg = texto(pegar(l, 'regiao'));
    r.regiao = (r.uf && REGIAO_UF[r.uf]) || REGIOES.find((x) => norm(x) === norm(reg)) || undefined;
    const g = genero(pegar(l, 'genero')); if (g) r.genero = g;
    const st = texto(pegar(l, 'setor')); if (st) r.setor = st.toUpperCase();
    const ins = texto(pegar(l, 'instituicao')); if (ins) r.instituicao = ins;
    const c = simNao(pegar(l, 'ciea')); if (c !== null) r.ciea = c;
    const n = Number(cod_pessoa); if (Number.isFinite(n)) r.papel = n >= 10000 && n < 20000 ? 'formador' : n >= 30000 && n < 40000 ? 'formando' : undefined;
    if (mp.email && !texto(pegar(l, 'email'))) semEmail++;
    for (const k of Object.keys(r)) if (r[k] === undefined) delete r[k];
    participacoes.push(r);
  }
  // processos: da aba de processos, completando com os já publicados
  const atuais = new Map((S.form?.versao?.dados.processos || []).map((p) => [String(p.cod), p]));
  const procs = new Map();
  if (fi.abaProc) {
    const mq = fi.mProc;
    const pg = (l, k) => (mq[k] ? l[mq[k]] : '');
    for (const l of fi.abas[fi.abaProc].linhas) {
      const cod = codigo(pg(l, 'cod'));
      if (!cod) continue;
      const p = { ...(atuais.get(cod) || {}), cod };
      const sig = texto(pg(l, 'sigla')); if (sig) p.sigla = sig;
      const nome = texto(pg(l, 'nome')); if (nome && nome !== sig) p.nome = nome;
      const ini = mes(pg(l, 'inicio')); if (ini) p.inicio = ini;
      const fim = mes(pg(l, 'fim')); if (fim) p.fim = fim;
      for (const k of ['turmas', 'carga_turma', 'carga_total']) { const n = numero(pg(l, k)); if (n !== null) p[k] = n; }
      const mod = texto(pg(l, 'modalidade')); if (mod) p.modalidade = titulo(mod);
      procs.set(cod, p);
    }
  }
  for (const r of participacoes) if (!procs.has(r.cod_processo)) procs.set(r.cod_processo, { ...(atuais.get(r.cod_processo) || {}), cod: r.cod_processo, sigla: atuais.get(r.cod_processo)?.sigla || r.cod_processo });
  const processos = [...procs.values()];

  // inconsistências (as mesmas do painel) e pendências que só a planilha revela
  const pend = verificar({ processos, participacoes });
  if (munInvalido) pend.unshift({ tipo: 'erro', texto: 'Códigos de município que não existem na malha do IBGE (ficam sem município)', n: munInvalido, acao: 'Conferir os códigos (7 dígitos)' });
  if (semEmail) pend.push({ tipo: 'aviso', fonte: 'planilha', texto: 'Participantes sem e-mail', n: semEmail, acao: 'Completar com a coordenação' });
  if (ignoradas) pend.push({ tipo: 'aviso', fonte: 'planilha', texto: 'Linhas ignoradas por não ter código da pessoa ou do processo', n: ignoradas, acao: 'Completar ou apagar essas linhas' });

  // diferenças em relação à versão publicada
  const ant = S.form?.versao?.dados.participacoes || [];
  const chave = (r) => `${r.cod_pessoa}|${r.cod_processo}`;
  const antMap = new Map(ant.map((r) => [chave(r), r]));
  const novMap = new Map(participacoes.map((r) => [chave(r), r]));
  const iguais = (a, b) => ['uf', 'cod_mun', 'genero', 'setor', 'instituicao', 'ciea'].every((k) => (a[k] ?? null) === (b[k] ?? null));
  let novas = 0, alteradas = 0, mesmas = 0;
  for (const [k, r] of novMap) { const a = antMap.get(k); if (!a) novas++; else if (iguais(a, r)) mesmas++; else alteradas++; }
  const removidas = [...antMap.keys()].filter((k) => !novMap.has(k)).length;
  const pessoasAnt = new Set(ant.map((r) => r.cod_pessoa));
  const pessoasNovas = new Set(participacoes.filter((r) => !pessoasAnt.has(r.cod_pessoa)).map((r) => r.cod_pessoa)).size;
  const ufsAnt = new Set(ant.map((r) => r.uf));
  const ufsNovas = [...new Set(participacoes.map((r) => r.uf).filter((u) => u && !ufsAnt.has(u)))];
  const procAnt = new Set((S.form?.versao?.dados.processos || []).map((p) => String(p.cod)));
  const procNovos = processos.filter((p) => !procAnt.has(p.cod));
  const resumo = {
    participacoes: participacoes.length, pessoas: new Set(participacoes.map((r) => r.cod_pessoa)).size, processos: processos.length,
    ufs: new Set(participacoes.map((r) => r.uf).filter(Boolean)).size, municipios: new Set(participacoes.map((r) => r.cod_mun).filter(Boolean)).size,
    pendencias: pend.filter((p) => p.fonte === 'planilha'),
    alertas: contarAlertas(pend.filter((p) => p.fonte !== 'planilha')),
  };
  resumo.lista = pend;
  return { dados: { processos, participacoes }, resumo, dif: { novas, alteradas, mesmas, removidas, pessoasNovas, ufsNovas, procNovos, mun6, primeira: !ant.length } };
}

export async function pagFormacoesAtualizar(S) {
  await garantirFormacoes(S);
  if (!podeFormacao(S.eu)) {
    return `<main class="page"><section class="card fm-bx"><h2>Atualizar dados de formação</h2><p class="sub">Seu perfil é só de leitura. Quem tem perfil de colaboração ou coordenação, em qualquer instituição, pode atualizar os dados de formação.</p><a class="btn" href="#/formacoes">Voltar para Formações</a></section></main>`;
  }
  try { const m = await malha('mun'); if (!malhas.munPronta) malhas.munPronta = { sete: new Set(m.mun.map((x) => x[0])), seis: new Map(m.mun.map((x) => [x[0].slice(0, 6), x[0]])), uf: new Map(m.mun.map((x) => [x[0], x[2]])) }; } catch { /* segue sem validar municípios */ }
  const fi = S.fimp;
  const passo = (n, t, est) => `<div class="${est}"><b>${est === 'ok' ? icone('ok').replace('#1E7A43', '#fff') : n}</b>${t}</div>`;
  const cab = `<div class="ph"><div class="txt"><div class="xs muted" style="margin-bottom:4px"><a href="#/formacoes">Formações</a> / Atualizar dados</div><h1>Atualizar dados de formação</h1><p class="sub">Envie a planilha de sempre. A plataforma confere, mostra o que muda e só publica depois que você confirmar.</p></div>
    <div class="acoes-ph"><button type="button" class="btn" data-acao="fm-modelo">Baixar planilha modelo</button></div></div>
    <div class="fm-step" aria-label="Etapas">${passo(1, 'Enviar planilha', fi ? 'ok' : 'at')}<i></i>${passo(2, 'Conferir', fi ? 'at' : '')}<i></i>${passo(3, 'Publicar', '')}</div>`;
  const envio = `<label class="fm-drop${fi ? ' feito' : ''}">${fi ? icone('ok') : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"></path><path d="m7 9 5-5 5 5"></path><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"></path></svg>'}
    <div style="flex:1;min-width:0">${fi ? `<b>${e(fi.arquivo)}</b><div class="xs muted">${Object.keys(fi.abas).length} ${Object.keys(fi.abas).length === 1 ? 'aba' : 'abas'}: ${Object.entries(fi.abas).map(([n, a]) => `${e(n)} (${fmt(a.linhas.length)} linhas)`).join(', ')}</div>` : '<b>Escolha a planilha (.xlsx, .xls ou .csv)</b><div class="xs muted">Uma aba com uma linha por pessoa em cada processo e, se houver, uma aba com os processos</div>'}</div>
    <span class="btn sm">${fi ? 'Trocar arquivo' : 'Escolher arquivo'}</span><input type="file" data-fm-arquivo accept=".xlsx,.xls,.csv,.ods" aria-label="Planilha de formações"></label>`;
  if (!fi) {
    return `<main class="page fm" style="max-width:1080px">${cab}<section class="card fm-bx">${envio}</section>
      <section class="card fm-bx"><h2>O que a planilha precisa ter</h2><p class="s">Os nomes das colunas não precisam ser exatos: a plataforma reconhece variações e, se errar, você escolhe a coluna certa na próxima etapa.</p>
      <ul class="fm-ul"><li><b>Obrigatórias:</b> código da pessoa e código do processo.</li><li><b>Recomendadas:</b> UF, código IBGE do município (7 dígitos), região, gênero, setor, instituição e se representa uma CIEA.</li><li><b>Aba de processos (opcional):</b> código, sigla, descrição, início, fim, turmas, carga horária por turma e total, modalidade.</li><li>Nomes, e-mails e telefones podem continuar na planilha: <b>eles não são gravados</b> na plataforma.</li></ul></section></main>`;
  }
  const { resumo, dif } = montar(S);
  const sel = (grupo, k, cols, atual) => `<select data-fm-col="${grupo}:${k}" aria-label="Coluna para ${k}"><option value="">— não usar —</option>${cols.map((c) => `<option value="${e(c)}"${c === atual ? ' selected' : ''}>${e(c)}</option>`).join('')}</select>`;
  const linhasMapa = (grupo, campos, m, cols) => campos.map(([k, rot, , obrig]) => `<tr><td>${m[k] ? icone('ok') : icone(obrig ? 'er' : 'wa')}</td><td><b style="font-weight:500">${e(rot)}</b>${obrig ? ' <span class="xs muted">obrigatória</span>' : ''}</td><td>${sel(grupo, k, cols, m[k])}</td></tr>`).join('');
  const abasOpt = (atual, comNenhuma) => `${comNenhuma ? `<option value=""${!atual ? ' selected' : ''}>Nenhuma (usar os processos já publicados)</option>` : ''}${Object.keys(fi.abas).map((n) => `<option value="${e(n)}"${n === atual ? ' selected' : ''}>${e(n)}</option>`).join('')}`;
  const falta = !fi.mPart.cod_pessoa || !fi.mPart.cod_processo || !resumo.participacoes;
  const cartao = (n, t) => `<div><b>${n}</b><span>${t}</span></div>`;
  const sinal = (n) => (n > 0 ? `+${fmt(n)}` : fmt(n));
  const totalAnt = S.form?.versao?.dados.participacoes.length || 0;
  const muda = dif.primeira
    ? `<div class="fm-dif">${cartao(fmt(resumo.participacoes), 'participações')}${cartao(fmt(resumo.pessoas), 'pessoas')}${cartao(fmt(resumo.processos), 'processos')}${cartao(fmt(resumo.ufs), 'UF')}</div><p class="xs muted" style="margin-top:10px">Primeira publicação: estes números formam o painel.</p>`
    : `<div class="fm-dif">${cartao(sinal(resumo.participacoes - totalAnt), 'participações')}${cartao(sinal(dif.pessoasNovas), 'pessoas novas')}${cartao(sinal(dif.ufsNovas.length), `UF novas${dif.ufsNovas.length ? ` (${dif.ufsNovas.join(', ')})` : ''}`)}${cartao(fmt(dif.alteradas), 'correções')}</div>
      <div class="fm-lst"><div><span>Participações novas</span><span class="muted">${fmt(dif.novas)}</span></div><div><span>Participações corrigidas (UF, município, setor…)</span><span class="muted">${fmt(dif.alteradas)}</span></div><div><span>Participações que saem do painel</span><span class="muted">${fmt(dif.removidas)}</span></div><div><span>Sem mudança</span><span class="muted">${fmt(dif.mesmas)}</span></div>${dif.procNovos.length ? `<div><span>Processos novos</span><span class="muted">${dif.procNovos.map((p) => e(p.sigla || p.cod)).join(', ')}</span></div>` : ''}${dif.mun6 ? `<div><span>Códigos de município com 6 dígitos completados</span><span class="muted">${fmt(dif.mun6)}</span></div>` : ''}</div>`;
  const pend = resumo.lista;
  return `<main class="page fm" style="max-width:1080px">${cab}
    <section class="card fm-bx">${envio}</section>
    <div class="fm-g11">
      <section class="card fm-bx"><h2>Colunas reconhecidas</h2><p class="s">Como a planilha vira o painel. Se alguma estiver errada, escolha a coluna certa.</p>
        <div class="f" style="margin-bottom:10px"><label for="fm-aba-p" class="xs muted">Aba das participações</label><select id="fm-aba-p" data-fm-aba="part">${abasOpt(fi.abaPart, false)}</select></div>
        <table class="fm-tb"><tbody>${linhasMapa('part', CAMPOS_PART, fi.mPart, fi.abas[fi.abaPart].cols)}</tbody></table>
        <div class="f" style="margin:16px 0 10px"><label for="fm-aba-q" class="xs muted">Aba dos processos</label><select id="fm-aba-q" data-fm-aba="proc">${abasOpt(fi.abaProc, true)}</select></div>
        ${fi.abaProc ? `<table class="fm-tb"><tbody>${linhasMapa('proc', CAMPOS_PROC, fi.mProc, fi.abas[fi.abaProc].cols)}</tbody></table>` : ''}
      </section>
      <section class="card fm-bx"><h2>O que muda no painel</h2><p class="s">${dif.primeira ? 'Ainda não há dados publicados' : `Comparado com os dados publicados em ${dataLonga(S.form.versao.criado_em)}`}</p>${muda}</section>
    </div>
    <section class="card fm-bx"><h2>Pontos para conferir antes de publicar</h2><p class="s">${pend.length ? `${resumo.alertas.erros ? `<b class="fm-ruim">${resumo.alertas.erros} ${resumo.alertas.erros === 1 ? 'inconsistência' : 'inconsistências'}</b>. ` : ''}Dá para publicar assim: os itens ficam em destaque no painel até alguém corrigir` : 'Nenhum problema encontrado'}</p>
      <table class="fm-tb"><tbody>${pend.map((p) => `<tr><td style="width:24px">${icone(p.tipo === 'erro' ? 'er' : 'wa')}</td><td>${e(p.texto)}</td><td class="n">${fmt(p.n)}</td><td class="muted sm">${e(p.acao || '')}</td></tr>`).join('') || `<tr><td>${icone('ok')}</td><td>Tudo certo.</td></tr>`}</tbody></table></section>
    <form class="card fm-bx fm-pub" data-form="fm-publicar">
      <div class="f" style="flex:1 1 400px"><label for="fm-nota">Nota da atualização <span class="muted" style="font-weight:400">(aparece no histórico)</span></label><input id="fm-nota" name="nota" type="text" maxlength="300" placeholder="Ex.: Inclui a turma 5 do MonitoraEA_CIEAS"></div>
      <div style="display:flex;gap:10px;align-items:flex-end"><button type="button" class="btn" data-acao="fm-cancelar">Cancelar</button><button class="btn pri" type="submit"${falta ? ' disabled' : ''}>Publicar atualização</button></div>
      <p class="xs muted" style="flex-basis:100%">${falta ? 'Para publicar, indique as colunas do código da pessoa e do código do processo.' : 'A versão anterior fica guardada e pode ser restaurada. Itens do Quadro ligados aos processos ganham um registro no histórico. Nomes, e-mails e telefones não são gravados.'}</p>
    </form></main>`;
}

// ------------------------------------------------------------------ ações e formulários
export const acoes = {
  async 'fm-uf'(S, el) {
    const uf = el.dataset.uf || '';
    S.filtros.fuf = S.filtros.fuf === uf ? '' : uf;
    if (S.filtros.fuf) S.filtros.fmapa = 'mun';
    return {};
  },
  async 'fm-limpar'(S) {
    Object.assign(S.filtros, { fproc: 'todos', fregiao: 'todas', fsetor: 'todos', fciea: 'todos', fuf: '', fq: '' });
    return {};
  },
  async 'fm-restaurar'(S, el) {
    if (!confirm('Restaurar esta versão? Ela passa a ser a versão publicada; a atual continua no histórico.')) return {};
    await S.api.formacaoRestaurar(Number(el.dataset.id));
    S.form = null;
    return { aviso: 'Versão restaurada.' };
  },
  async 'fm-editar'(S, el) {
    S.fmEditar = el.dataset.cod;
    S.filtros.fproc = 'todos';
    setTimeout(() => document.getElementById('proc-' + el.dataset.cod)?.scrollIntoView({ block: 'center' }), 30);
    return { foco: 'fp-turmas-' + el.dataset.cod };
  },
  async 'fm-fechar'(S) { S.fmEditar = null; return {}; },
  async 'fm-ir-qualidade'() {
    const h = document.getElementById('t-q');
    h?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    h?.focus({ preventScroll: true });
    return { semRender: true };
  },
  async 'fm-usar-conta'(S, el) {
    const form = el.closest('form');
    form.querySelector('input[name=carga_total]').value = el.dataset.valor;
    atualizarConta(form);
    return { semRender: true };
  },
  async 'fm-cancelar'(S) { S.fimp = null; location.hash = '#/formacoes'; return {}; },
  async 'fm-modelo'() {
    const cab = ['codigo', 'cod_formacao', 'UF', 'cod_mun', 'Região', 'Gênero', 'Setor', 'Instituição', 'Representando CIEA', 'email'];
    const ex = ['30001', '20004', 'SP', '3550308', 'SUDESTE', 'F', 'GOVERNO', 'Secretaria Municipal de Meio Ambiente', 'SIM', 'pessoa@exemplo.org'];
    const proc = ['cod_formacao;sigla;descricao;inicio;fim;turmas;carga_horaria_turma;carga_horaria_total;modalidade', '20004;MonitoraEA_CIEAS;Capacidade adaptativa em perspectiva policêntrica;02/2023;12/2026;5;16;80;Híbrido'];
    const csv = '﻿' + [cab.join(';'), ex.join(';')].join('\n');
    const baixar = (nome, conteudo) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' })); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
    baixar('modelo-participacoes.csv', csv);
    setTimeout(() => baixar('modelo-processos.csv', '﻿' + proc.join('\n')), 300);
    return { semRender: true, aviso: 'Modelos baixados: participações e processos (CSV). Também dá para usar uma planilha .xlsx com as duas abas.' };
  },
};
export const formularios = {
  async 'fm-busca'(S, fd) { S.filtros.fq = String(fd.get('q') || '').trim(); return {}; },
  async 'fm-proc'(S, fd, form) {
    const cod = form.dataset.cod;
    const v = S.form?.versao;
    const atual = (v?.dados.processos || []).find((p) => String(p.cod) === cod) || { cod };
    const meta = S.form?.meta[cod] || {};
    // campos do processo: só manda o que mudou (vazio apaga)
    const campos = {};
    for (const k of ['sigla', 'nome', 'modalidade', 'inicio', 'fim']) {
      const novo = String(fd.get(k) || '').trim() || null;
      if (novo !== (atual[k] ?? null)) campos[k] = novo;
    }
    for (const k of ['turmas', 'carga_turma', 'carga_total']) {
      const t = String(fd.get(k) ?? '').trim();
      const novo = t === '' ? null : Number(t);
      if (novo !== null && (!Number.isFinite(novo) || novo < 0)) throw new Error('Use números positivos em turmas e carga horária.');
      if (novo !== (atual[k] ?? null)) campos[k] = novo;
    }
    const realizacao = String(fd.get('realizacao') || '') || null;
    const item = fd.get('item') ? Number(fd.get('item')) : null;
    const mudouMeta = realizacao !== (meta.realizacao || null) || item !== (meta.item_id || null);
    const mudouDados = Object.keys(campos).length > 0;
    if (!mudouDados && !mudouMeta) { S.fmEditar = null; return { aviso: 'Nada foi alterado.' }; }
    let restam = [];
    if (mudouDados) {
      const corrigido = { ...atual, ...campos };
      for (const k of Object.keys(corrigido)) if (corrigido[k] === null) delete corrigido[k];
      const processos = (v.dados.processos || []).some((p) => String(p.cod) === cod)
        ? v.dados.processos.map((p) => (String(p.cod) === cod ? corrigido : p)) : [...(v.dados.processos || []), corrigido];
      const lista = verificar({ processos, participacoes: v.dados.participacoes });
      restam = lista.filter((x) => x.cod === cod);
      const resumo = { ...(v.resumo || {}), alertas: contarAlertas(lista) };
      await S.api.formacaoCorrigir(cod, campos, String(fd.get('nota') || '').trim(), resumo);
    }
    if (mudouMeta) await S.api.formacaoProcesso(cod, realizacao, item);
    S.form = null; S.fmEditar = null;
    const erros = restam.filter((x) => x.tipo === 'erro');
    if (erros.length) return { recarregar: true, aviso: `Correção salva, mas o processo ainda tem ${erros.length === 1 ? 'uma inconsistência' : `${erros.length} inconsistências`}: ${erros[0].texto}.` };
    return { recarregar: true, aviso: mudouDados ? 'Correção salva. A versão anterior continua no histórico.' : 'Processo atualizado.' };
  },
  async 'fm-publicar'(S, fd) {
    if (!S.fimp) throw new Error('Envie a planilha primeiro.');
    const { dados, resumo } = montar(S);
    if (!dados.participacoes.length) throw new Error('Nenhuma participação reconhecida. Confira as colunas obrigatórias.');
    const { lista, ...gravar } = resumo;
    await S.api.formacaoPublicar(dados, S.fimp.arquivo, String(fd.get('nota') || '').trim(), gravar);
    S.fimp = null; S.form = null;
    location.hash = '#/formacoes';
    return { recarregar: true, aviso: `Dados publicados: ${fmt(resumo.participacoes)} participações de ${fmt(resumo.pessoas)} pessoas.` };
  },
};
// refaz a conta das turmas enquanto a pessoa digita
export function atualizarConta(form) {
  const alvo = form?.querySelector('[data-fm-conta]');
  if (!alvo) return;
  const g = (n) => form.querySelector(`input[name=${n}]`)?.value;
  alvo.innerHTML = contaCarga(g('turmas'), g('carga_turma'), g('carga_total'));
}
// mudanças nos seletores da conferência
export function mudarColuna(S, el) {
  if (!S.fimp) return;
  if (el.dataset.fmAba) {
    const aba = el.value;
    if (el.dataset.fmAba === 'part') { S.fimp.abaPart = aba; S.fimp.mPart = mapear(S.fimp.abas[aba].cols, CAMPOS_PART); }
    else { S.fimp.abaProc = aba; S.fimp.mProc = aba ? mapear(S.fimp.abas[aba].cols, CAMPOS_PROC) : {}; }
    return;
  }
  const [grupo, k] = el.dataset.fmCol.split(':');
  (grupo === 'part' ? S.fimp.mPart : S.fimp.mProc)[k] = el.value;
}
export { dataCurta, siglaDe };
