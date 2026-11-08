// Dados de EXEMPLO para o modo demonstração da página Formações.
// Os totais por processo, gênero, setor e as UF com mais participações seguem a
// planilha Dados_Processos_Formativos_Anppea_2 (08/11/2026); a distribuição por
// município é ilustrativa e usa códigos reais do IBGE.
export const MUN_DEMO = {"RN":["2408102","2414159","2400505","2413359","2402204","2401453","2403400","2409902","2413706","2411205"],"SC":["4205407","4217550","4219358","4215455","4218202","4217758","4203907","4203709","4201109","4215109"],"RS":["4314902","4323309","4303707","4321204","4323770","4309506","4311239","4315073","4300109","4322301"],"MG":["3106200","3120300","3128501","3120805","3125903","3169901","3145703","3171600","3150539","3124708"],"GO":["5208707","5202155","5221502","5203906","5209952","5216809","5214861","5210000","5221577","5201504"],"SP":["3550308","3527306","3555802","3511102","3516408","3500808","3502754","3549250","3505401","3549805"],"PR":["4106902","4122701","4104303","4119905","4115002","4128104","4113700","4118204","4115853","4113429"],"BA":["2927408","2924306","2917607","2906204","2918803","2933000","2916708","2925501","2910701","2902609"],"PI":["2211001","2202901","2207603","2203354","2200400","2207801","2211100","2205607","2209807","2203107"],"PB":["2507507","2512200","2512002","2513943","2509602","2504702","2506251","2503209","2516102","2515971"],"MA":["2111300","2103307","2103604","2106003","2109007","2112308","2106102","2102903","2100204","2110401"],"AL":["2704302","2700409","2709301","2703759","2703007","2706208","2706422","2702355","2706406","2703205"],"MT":["5103403","5104807","5106190","5102694","5102637","5107305","5105309","5102702","5102793","5107008"],"CE":["2304400","2313500","2306553","2305605","2308351","2310704","2301505","2313351","2301802","2305001"],"MS":["5002704","5007950","5002209","5004809","5004908","5000203","5005608","5003504","5003207","5005251"],"PA":["1501402","1503309","1501709","1501725","1507979","1506351","1504901","1500305","1501600","1507466"],"TO":["1721000","1712009","1720903","1701101","1709807","1702158","1718451","1711803","1721307","1713957"],"SE":["2800308","2805604","2805406","2804508","2800670","2807600","2801504","2805000","2804805","2803807"],"RR":["1400100","1400605","1400506","1400050","1400308","1400704","1400282","1400233","1400175","1400456"],"PE":["2611606","2600500","2607752","2616209","2606309","2610202","2608008","2609006","2611101","2602902"],"RJ":["3304557","3302007","3302205","3305406","3301876","3300308","3305208","3304128","3305158","3304102"],"AM":["1302603","1300102","1301654","1302553","1300805","1304203","1303106","1302504","1302801","1304302"],"DF":["5300108"],"ES":["3205309","3204658","3200904","3204351","3202207","3204708","3205036","3204005","3202504","3200409"],"AC":["1200401","1200344","1200252","1200609","1200500","1200138","1200336","1200385","1200104","1200393"],"RO":["1100205","1100015","1100098","1100106","1101203","1101492","1101450","1101484","1100601","1100908"],"AP":["1600303","1600279","1600402","1600550","1600709","1600105","1600808","1600253","1600212","1600600"]};

const REGIAO = { AC: 'Norte', AM: 'Norte', AP: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
  AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste', PE: 'Nordeste', PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
  DF: 'Centro-Oeste', GO: 'Centro-Oeste', MS: 'Centro-Oeste', MT: 'Centro-Oeste',
  ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste', PR: 'Sul', RS: 'Sul', SC: 'Sul' };

export const PROCESSOS_DEMO = [
  { cod: '20005', sigla: 'Indicadores_MonitoraEA', nome: 'Oficinas de construção dos indicadores', inicio: '2019-03', fim: '2019-06', turmas: 5, carga_turma: 36, carga_total: 180, modalidade: 'Híbrido' },
  { cod: '20003', sigla: 'Ibama', nome: 'Formação, monitoramento e comunicação do ciclo de políticas de EA', inicio: '2020-11', fim: '2021-08', turmas: 1, carga_turma: 100, carga_total: 100, modalidade: 'Virtual' },
  { cod: '20001', sigla: 'PPPZCM', nome: 'Rede de comunidades de aprendizagem', inicio: '2021-05', fim: '2022-08', turmas: 1, carga_turma: 190, carga_total: 190, modalidade: 'Híbrido' },
  { cod: '20002', sigla: 'Guandu', nome: 'Indicadores de políticas públicas de EA no MonitoraEA', inicio: '2022-02', fim: '2022-03', turmas: 4, carga_turma: 48, carga_total: 192, modalidade: 'Virtual' },
  { cod: '20004', sigla: 'MonitoraEA_CIEAS', nome: 'Capacidade adaptativa em perspectiva policêntrica', inicio: '2023-02', fim: '2026-12', turmas: 5, carga_turma: 16, carga_total: 160, modalidade: 'Híbrido' },
];

// participações por processo e distribuição de setores (%) da planilha
const PLANO = {
  20005: { n: 276, ufs: 20, setor: [46.4, 22.1, 21, 4.3, 4, 2.2] },
  20003: { n: 58, ufs: 17, setor: [89.7, 6.9, 3.4, 0, 0, 0] },
  20001: { n: 63, ufs: 19, setor: [49.2, 30.2, 15.9, 1.6, 3.2, 0] },
  20002: { n: 121, ufs: 2, setor: [75.2, 12.4, 4.1, 1.7, 6.6, 0] },
  20004: { n: 266, ufs: 26, setor: [60.5, 22.2, 13.9, 1.1, 2.3, 0] },
};
const SETORES = ['GOVERNO', 'SOCIEDADE CIVIL', 'ACADÊMICO', 'EMPRESARIAL', 'OUTROS', 'COLEGIADOS'];
const PESO_UF = { RJ: 137, MS: 79, PA: 74, BA: 71, SP: 61, MG: 45, PR: 41, RS: 32, SC: 30, MT: 22, ES: 20, PE: 18, GO: 18, DF: 17, CE: 14, AL: 13, MA: 12, SE: 12, AM: 12, PB: 10, RN: 9, PI: 8, RO: 8, AC: 6, TO: 6, AP: 5, RR: 4 };
const INST = ['Ibama', 'Secretaria Municipal de Meio Ambiente', 'Secretaria Municipal de Educação', 'Prefeitura Municipal', 'Secretaria Estadual de Educação', 'Secretaria Estadual de Meio Ambiente', 'Universidade Federal', 'Instituto Federal', 'ONG ambientalista', 'Comitê de Bacia', 'OUTROS'];

function sorteio(semente) {
  let s = semente >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function escolher(r, pesos) {
  const tot = pesos.reduce((a, [, p]) => a + p, 0);
  let x = r() * tot;
  for (const [v, p] of pesos) { if ((x -= p) <= 0) return v; }
  return pesos[pesos.length - 1][0];
}

export function participacoesDemo() {
  const r = sorteio(2026);
  const linhas = [];
  let prox = 30001;
  const veteranos = [];
  const generoDe = new Map();  // cada pessoa mantém o mesmo gênero em todos os processos
  for (const p of PROCESSOS_DEMO) {
    const plano = PLANO[p.cod];
    const noProcesso = new Set();
    const ufs = p.cod === '20002' ? [['RJ', 119], ['SP', 2]]
      : Object.entries(PESO_UF).sort(() => r() - 0.5).slice(0, plano.ufs).map(([u, w]) => [u, w]);
    const setores = SETORES.map((s, i) => [s, plano.setor[i]]).filter(([, w]) => w > 0);
    for (let i = 0; i < plano.n; i++) {
      const uf = escolher(r, ufs);
      const muns = MUN_DEMO[uf];
      const cod_mun = muns.length === 1 || r() < 0.45 ? muns[0] : muns[1 + Math.floor(r() * (muns.length - 1))];
      // algumas pessoas voltam em mais de um processo
      let cod_pessoa = null;
      if (veteranos.length && r() < 0.16) {
        const v = veteranos[Math.floor(r() * veteranos.length)];
        if (!noProcesso.has(v)) cod_pessoa = v;
      }
      if (!cod_pessoa) { cod_pessoa = String(prox++); veteranos.push(cod_pessoa); }
      noProcesso.add(cod_pessoa);
      linhas.push({
        cod_pessoa: i < 3 ? String(10001 + (linhas.length + i) % 14) : cod_pessoa,
        cod_processo: p.cod,
        papel: i < 3 ? 'formador' : 'formando',
        uf, cod_mun, regiao: REGIAO[uf],
        genero: (() => { const g = r() < 0.71 ? 'F' : 'M'; const k = i < 3 ? String(10001 + (linhas.length + i) % 14) : cod_pessoa; if (!generoDe.has(k)) generoDe.set(k, g); return generoDe.get(k); })(),
        setor: escolher(r, setores),
        instituicao: INST[Math.min(INST.length - 1, Math.floor(Math.pow(r(), 1.7) * INST.length))],
        ciea: p.cod === '20004' ? r() < 0.7 : r() < 0.06,
      });
    }
  }
  return linhas;
}

export function versaoDemo(agoraMenos) {
  const participacoes = participacoesDemo();
  return {
    id: 1, criado_em: agoraMenos(0, 2), criado_por: 'm4',
    arquivo: 'Dados_Processos_Formativos_Anppea_2.xlsx',
    nota: 'Carga inicial a partir da planilha de 08/11/2026',
    dados: { processos: PROCESSOS_DEMO, participacoes },
    resumo: {
      participacoes: participacoes.length,
      pendencias: [
        { tipo: 'aviso', texto: 'Instituição registrada só como "OUTROS"', n: participacoes.filter((x) => x.instituicao === 'OUTROS').length, acao: 'Identificar a instituição' },
        { tipo: 'aviso', texto: 'Participantes sem e-mail', n: 5, acao: 'Completar com a coordenação' },
        { tipo: 'aviso', texto: 'Carga horária do MonitoraEA_CIEAS: 5 turmas × 16 h = 80 h, mas o total informado é 160 h', n: 1, acao: 'Conferir com a coordenação' },
      ],
    },
  };
}
