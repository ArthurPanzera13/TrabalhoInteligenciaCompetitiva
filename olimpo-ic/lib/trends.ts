import seedrandom from 'seedrandom';
import type { AnalysisConfig, AnalysisResult, TimelinePoint } from '@/types/analysis';

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Seasonal multipliers: Dec–Feb peak (Brazilian summer = car detailing season)
const SEASONAL = [0.90, 0.86, 0.88, 0.80, 0.72, 0.70, 0.74, 0.79, 0.84, 0.90, 1.00, 1.10];

interface RawPoint {
  rawDate: Date;
  values: Record<string, number>;
}

function timeframeToStartDate(tf: string): Date {
  const d = new Date();
  switch (tf) {
    case '3m':  d.setMonth(d.getMonth() - 3);         break;
    case '6m':  d.setMonth(d.getMonth() - 6);         break;
    case '12m': d.setFullYear(d.getFullYear() - 1);   break;
    case '5y':  d.setFullYear(d.getFullYear() - 5);   break;
    default:    d.setFullYear(d.getFullYear() - 1);
  }
  return d;
}

function buildTimeline(rawPoints: RawPoint[], keywords: string[]): TimelinePoint[] {
  return rawPoints.map(pt => {
    const point: TimelinePoint = {
      date: pt.rawDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    };
    keywords.forEach(kw => { point[kw] = pt.values[kw] ?? 0; });
    return point;
  });
}

function calcAverages(rawPoints: RawPoint[], keywords: string[]): Record<string, number> {
  return Object.fromEntries(
    keywords.map(kw => {
      const vals = rawPoints.map(pt => pt.values[kw] ?? 0);
      return [kw, vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0];
    })
  );
}

function calcGrowthPct(rawPoints: RawPoint[], keywords: string[]): Record<string, number> {
  if (rawPoints.length < 4) return Object.fromEntries(keywords.map(kw => [kw, 0]));
  const half = Math.floor(rawPoints.length / 2);
  const first = rawPoints.slice(0, half);
  const last = rawPoints.slice(-half);
  return Object.fromEntries(
    keywords.map(kw => {
      const avgFirst = first.reduce((s, pt) => s + (pt.values[kw] ?? 0), 0) / first.length;
      const avgLast = last.reduce((s, pt) => s + (pt.values[kw] ?? 0), 0) / last.length;
      return [kw, avgFirst === 0 ? 0 : Math.round(((avgLast - avgFirst) / avgFirst) * 100)];
    })
  );
}

function extractSeasonality(rawPoints: RawPoint[], keywords: string[]) {
  const monthBuckets: Record<string, number[]> = {};
  const yearBuckets: Record<string, number[]> = {};
  const heatBuckets: Record<string, Record<string, number[]>> = {};
  MONTHS_PT.forEach(m => { monthBuckets[m] = []; });

  for (const pt of rawPoints) {
    const month = MONTHS_PT[pt.rawDate.getMonth()];
    const year = String(pt.rawDate.getFullYear());
    const vals = keywords.map(kw => pt.values[kw] ?? 0);
    const avg = vals.reduce((a, b) => a + b, 0) / Math.max(vals.length, 1);

    monthBuckets[month].push(avg);
    if (!yearBuckets[year]) yearBuckets[year] = [];
    yearBuckets[year].push(avg);
    if (!heatBuckets[year]) heatBuckets[year] = {};
    if (!heatBuckets[year][month]) heatBuckets[year][month] = [];
    heatBuckets[year][month].push(avg);
  }

  const sazonal = Object.fromEntries(
    MONTHS_PT.map(m => {
      const vals = monthBuckets[m];
      return [m, vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0];
    })
  );

  const anual = Object.fromEntries(
    Object.entries(yearBuckets).map(([yr, vals]) => [
      yr, Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    ])
  );

  const heatmap: Record<string, Record<string, number>> = {};
  Object.entries(heatBuckets).forEach(([yr, months]) => {
    heatmap[yr] = {};
    Object.entries(months).forEach(([mo, vals]) => {
      heatmap[yr][mo] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    });
  });

  return { sazonal, anual, heatmap };
}

function buildInsightsReport(
  result: Omit<AnalysisResult, 'is_demo' | 'insights_report'>
): string {
  const { summary, kiq1_medias, kiq1_crescimento_pct, kiq2_sazonal, kiq2_anual, regioes } = result;
  const lines = [
    '=== RELATÓRIO DE INTELIGÊNCIA COMPETITIVA — OLIMPO ESTÉTICA AUTOMOTIVA ===',
    `Gerado em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    '',
    '--- KIQ 1: COMPARATIVO DE SERVIÇOS ---',
    `Líder em interesse médio: ${summary.kiq1_top_media} (${kiq1_medias[summary.kiq1_top_media] ?? 0} pts)`,
    `Maior crescimento: ${summary.kiq1_top_growth} (${(kiq1_crescimento_pct[summary.kiq1_top_growth] ?? 0) >= 0 ? '+' : ''}${kiq1_crescimento_pct[summary.kiq1_top_growth] ?? 0}%)`,
    '',
    'Médias de interesse:',
    ...Object.entries(kiq1_medias).map(([k, v]) => `  ${k}: ${v} pts`),
    '',
    'Crescimento no período:',
    ...Object.entries(kiq1_crescimento_pct).map(([k, v]) => `  ${k}: ${v >= 0 ? '+' : ''}${v}%`),
    '',
    '--- KIQ 2: SAZONALIDADE ---',
    `Mês de maior demanda: ${summary.kiq2_peak_month}`,
    '',
    'Interesse médio mensal:',
    ...Object.entries(kiq2_sazonal).map(([m, v]) => `  ${m}: ${v}`),
    '',
    'Evolução anual:',
    ...Object.entries(kiq2_anual).sort(([a], [b]) => Number(a) - Number(b)).map(([y, v]) => `  ${y}: ${v}`),
    '',
    '--- ANÁLISE REGIONAL (MG) ---',
    `Cidade destaque: ${summary.region_top_city}`,
    '',
    'Top 10 cidades:',
    ...Object.entries(regioes).map(([c, v]) => `  ${c}: ${v}/100`),
    '',
    '=== FIM DO RELATÓRIO ===',
  ];
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────
//  Real Google Trends integration
// ─────────────────────────────────────────────────────────────
async function fetchRealData(
  config: AnalysisConfig
): Promise<Omit<AnalysisResult, 'is_demo' | 'insights_report'>> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const googleTrends = require('google-trends-api');
  const now = new Date();

  const kiq1Start = timeframeToStartDate(config.kiq1_timeframe);
  const raw1 = await googleTrends.interestOverTime({
    keyword: config.kiq1_termos,
    geo: config.kiq1_geo,
    startTime: kiq1Start,
    endTime: now,
    hl: 'pt-BR',
  });
  const kiq1Raw: RawPoint[] = (JSON.parse(raw1).default?.timelineData ?? []).map(
    (pt: { time: string; value: number[] }) => ({
      rawDate: new Date(parseInt(pt.time) * 1000),
      values: Object.fromEntries(config.kiq1_termos.map((kw, i) => [kw, pt.value[i] ?? 0])),
    })
  );

  const kiq2Start = timeframeToStartDate(config.kiq2_timeframe);
  const raw2 = await googleTrends.interestOverTime({
    keyword: config.kiq2_termos,
    geo: config.kiq2_geo,
    startTime: kiq2Start,
    endTime: now,
    hl: 'pt-BR',
  });
  const kiq2Raw: RawPoint[] = (JSON.parse(raw2).default?.timelineData ?? []).map(
    (pt: { time: string; value: number[] }) => ({
      rawDate: new Date(parseInt(pt.time) * 1000),
      values: Object.fromEntries(config.kiq2_termos.map((kw, i) => [kw, pt.value[i] ?? 0])),
    })
  );

  const regionStart = new Date();
  regionStart.setFullYear(regionStart.getFullYear() - 1);
  const rawRegion = await googleTrends.interestByRegion({
    keyword: config.region_termo,
    geo: config.region_geo,
    startTime: regionStart,
    resolution: 'CITY',
    hl: 'pt-BR',
  });
  const regioes = Object.fromEntries(
    (JSON.parse(rawRegion).default?.geoMapData ?? [])
      .filter((item: { value: number[] }) => item.value[0] > 0)
      .sort((a: { value: number[] }, b: { value: number[] }) => b.value[0] - a.value[0])
      .slice(0, 10)
      .map((item: { geoName: string; value: number[] }) => [item.geoName, item.value[0]])
  );

  const kiq1Timeline = buildTimeline(kiq1Raw, config.kiq1_termos);
  const kiq1_medias = calcAverages(kiq1Raw, config.kiq1_termos);
  const kiq1_crescimento_pct = calcGrowthPct(kiq1Raw, config.kiq1_termos);
  const { sazonal, anual, heatmap } = extractSeasonality(kiq2Raw, config.kiq2_termos);

  const kiq1_top_media  = Object.entries(kiq1_medias).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '';
  const kiq1_top_growth = Object.entries(kiq1_crescimento_pct).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '';
  const kiq2_peak_month = Object.entries(sazonal).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '';
  const region_top_city = Object.keys(regioes)[0] ?? '';

  return {
    summary: { kiq1_top_media, kiq1_top_growth, kiq2_peak_month, region_top_city },
    kiq1_timeline: kiq1Timeline,
    kiq1_medias,
    kiq1_crescimento_pct,
    kiq2_sazonal: sazonal,
    kiq2_anual: anual,
    kiq2_heatmap: heatmap,
    regioes,
  };
}

// ─────────────────────────────────────────────────────────────
//  Demo / fallback data generator
// ─────────────────────────────────────────────────────────────
function generateDemoResult(
  config: AnalysisConfig
): Omit<AnalysisResult, 'is_demo' | 'insights_report'> {
  const rng = seedrandom(config.kiq1_termos.join('|'));
  const rand = () => rng();
  const now = new Date();

  const numWeeks = { '3m': 13, '6m': 26, '12m': 52, '5y': 260 }[config.kiq1_timeframe] ?? 52;

  const terms = config.kiq1_termos;
  const bases = terms.map((_, i) => ([72, 48, 36, 24, 14][i % 5]) + Math.floor(rand() * 12));
  const growths = terms.map(() => (rand() - 0.3) * 0.6);

  const kiq1Raw: RawPoint[] = Array.from({ length: numWeeks }, (_, w) => {
    const date = new Date(now.getTime() - (numWeeks - w) * 7 * 24 * 60 * 60 * 1000);
    const progress = w / numWeeks;
    const values: Record<string, number> = {};
    terms.forEach((term, i) => {
      const noise = 1 + (rand() - 0.5) * 0.3;
      values[term] = Math.max(1, Math.min(100, Math.round(
        bases[i] * (1 + growths[i] * progress) * SEASONAL[date.getMonth()] * noise
      )));
    });
    return { rawDate: date, values };
  });

  const rng2 = seedrandom(config.kiq2_termos.join('|'));
  const rand2 = () => rng2();
  const kiq2Terms = config.kiq2_termos;
  const kiq2Bases = kiq2Terms.map((_, i) => 28 + i * 8 + Math.floor(rand2() * 18));
  const yearNow = now.getFullYear();

  const kiq2Raw: RawPoint[] = [];
  for (let yr = yearNow - 4; yr <= yearNow; yr++) {
    for (let mo = 0; mo < 12; mo++) {
      if (yr === yearNow && mo > now.getMonth()) break;
      const date = new Date(yr, mo, 1);
      const yp = (yr - (yearNow - 4)) / 4;
      const values: Record<string, number> = {};
      kiq2Terms.forEach((term, i) => {
        const noise = 1 + (rand2() - 0.5) * 0.2;
        values[term] = Math.max(1, Math.min(100, Math.round(
          kiq2Bases[i] * (1 + yp * 0.28) * SEASONAL[mo] * noise
        )));
      });
      kiq2Raw.push({ rawDate: date, values });
    }
  }

  const rng3 = seedrandom(config.region_termo);
  const rand3 = () => rng3();
  const cities = ['Contagem', 'Belo Horizonte', 'Uberlândia', 'Betim', 'Juiz de Fora',
                  'Ribeirão das Neves', 'Montes Claros', 'Uberaba', 'Governador Valadares', 'Ipatinga'];
  const rawVals = cities.map(() => 30 + Math.floor(rand3() * 70));
  const maxVal = Math.max(...rawVals);
  const regioes = Object.fromEntries(
    cities.map((c, i) => [c, Math.round((rawVals[i] / maxVal) * 100)] as [string, number])
      .sort(([, a], [, b]) => b - a)
  );

  const kiq1Timeline = buildTimeline(kiq1Raw, terms);
  const kiq1_medias = calcAverages(kiq1Raw, terms);
  const kiq1_crescimento_pct = calcGrowthPct(kiq1Raw, terms);
  const { sazonal, anual, heatmap } = extractSeasonality(kiq2Raw, kiq2Terms);

  const kiq1_top_media  = Object.entries(kiq1_medias).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '';
  const kiq1_top_growth = Object.entries(kiq1_crescimento_pct).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '';
  const kiq2_peak_month = Object.entries(sazonal).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '';
  const region_top_city = Object.keys(regioes)[0] ?? '';

  return {
    summary: { kiq1_top_media, kiq1_top_growth, kiq2_peak_month, region_top_city },
    kiq1_timeline: kiq1Timeline,
    kiq1_medias,
    kiq1_crescimento_pct,
    kiq2_sazonal: sazonal,
    kiq2_anual: anual,
    kiq2_heatmap: heatmap,
    regioes,
  };
}

// ─────────────────────────────────────────────────────────────
//  Main entry point
// ─────────────────────────────────────────────────────────────
export async function runAnalysis(
  config: AnalysisConfig,
  onProgress: (pct: number, message: string) => void
): Promise<AnalysisResult> {
  onProgress(5, 'Conectando ao Google Trends...');

  try {
    onProgress(15, 'Coletando KIQ 1 — Comparativo de Serviços...');
    const core = await fetchRealData(config);
    onProgress(90, 'Gerando relatório e perspectivas...');
    const insights_report = buildInsightsReport(core);
    onProgress(100, 'Análise concluída!');
    return { ...core, insights_report, is_demo: false };
  } catch (err) {
    console.error('[trends] Fallback para dados de demonstração:', (err as Error).message);
    onProgress(20, 'Gerando dados de demonstração...');
    await delay(400);
    onProgress(45, 'Calculando comparativo de serviços...');
    await delay(400);
    onProgress(65, 'Analisando sazonalidade (5 anos)...');
    await delay(350);
    onProgress(80, 'Mapeando regiões de Minas Gerais...');
    await delay(300);
    onProgress(92, 'Gerando relatório de perspectivas...');
    const core = generateDemoResult(config);
    const insights_report = buildInsightsReport(core);
    onProgress(100, 'Análise concluída (modo demonstração).');
    return { ...core, insights_report, is_demo: true };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
