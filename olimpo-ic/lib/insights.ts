import type { AnalysisResult, InsightItem } from '@/types/analysis';

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function generateInsights(result: AnalysisResult): InsightItem[] {
  const insights: InsightItem[] = [];
  const { kiq1_medias, kiq1_crescimento_pct, kiq2_sazonal, kiq2_anual, regioes } = result;

  // Growth analysis per term
  Object.entries(kiq1_crescimento_pct).forEach(([termo, pct]) => {
    if (pct > 30) {
      insights.push({
        id: `growth-high-${termo}`,
        type: 'warning',
        emoji: '⚠️',
        title: 'Janela de Oportunidade',
        message: `'${termo}' apresenta crescimento acelerado de +${pct}% — janela de oportunidade competitiva identificada.`,
      });
    } else if (pct < -15) {
      insights.push({
        id: `growth-low-${termo}`,
        type: 'danger',
        emoji: '📉',
        title: 'Queda de Interesse',
        message: `'${termo}' perdeu ${Math.abs(pct)}% de interesse no período. Avaliar reposicionamento ou bundling com outros serviços.`,
      });
    } else if (pct > 15) {
      insights.push({
        id: `growth-moderate-${termo}`,
        type: 'success',
        emoji: '📈',
        title: 'Crescimento Moderado',
        message: `'${termo}' cresce +${pct}% — tendência positiva e consistente no período.`,
      });
    }
  });

  // Seasonality peak
  const sazonalVals = Object.values(kiq2_sazonal).filter(v => v > 0);
  const avgSazonal = sazonalVals.length > 0 ? sazonalVals.reduce((a, b) => a + b, 0) / sazonalVals.length : 0;
  const peakEntry = Object.entries(kiq2_sazonal).sort(([, a], [, b]) => b - a)[0];
  const valleyEntry = Object.entries(kiq2_sazonal).sort(([, a], [, b]) => a - b)[0];

  if (peakEntry && avgSazonal > 0 && peakEntry[1] > avgSazonal * 1.4) {
    const peakIdx = MONTHS_PT.indexOf(peakEntry[0]);
    const prepIdx = (peakIdx - 2 + 12) % 12;
    const peakPct = Math.round((peakEntry[1] / avgSazonal - 1) * 100);
    insights.push({
      id: 'peak-month',
      type: 'danger',
      emoji: '🔴',
      title: 'Pico de Demanda Identificado',
      message: `${peakEntry[0]} concentra demanda ${peakPct}% acima da média anual. Recomenda-se pré-agendamento e reforço de equipe a partir de ${MONTHS_PT[prepIdx]}.`,
    });
  }

  // Annual growth trend
  const sortedYears = Object.keys(kiq2_anual).sort();
  if (sortedYears.length >= 3) {
    const firstVal = kiq2_anual[sortedYears[0]];
    const lastVal = kiq2_anual[sortedYears[sortedYears.length - 1]];
    if (firstVal > 0) {
      const annualGrowth = Math.round(((lastVal / firstVal) ** (1 / (sortedYears.length - 1)) - 1) * 100);
      if (annualGrowth > 10) {
        insights.push({
          id: 'annual-growth',
          type: 'success',
          emoji: '📈',
          title: 'Tendência Estrutural de Crescimento',
          message: `Crescimento estrutural de +${annualGrowth}% ao ano. Mercado em expansão — momento favorável para investimento em capacidade.`,
        });
      }
    }
  }

  // Regional highlight
  const topCity = Object.keys(regioes)[0];
  const secondCity = Object.keys(regioes)[1];
  if (topCity && topCity !== 'Belo Horizonte' && regioes[topCity] >= 90) {
    insights.push({
      id: 'top-city',
      type: 'info',
      emoji: '📍',
      title: 'Destaque Regional Fora de BH',
      message: `${topCity} supera BH em volume de buscas. Avaliar estratégia de expansão e atendimento na região.`,
    });
  }

  // Market leader gap
  const mediaSorted = Object.entries(kiq1_medias).sort(([, a], [, b]) => b - a);
  if (mediaSorted.length >= 2) {
    const gap = mediaSorted[0][1] - mediaSorted[1][1];
    if (gap > 20) {
      insights.push({
        id: 'leader-gap',
        type: 'info',
        emoji: '🏆',
        title: 'Liderança de Mercado',
        message: `'${mediaSorted[0][0]}' lidera com ${gap} pts de vantagem sobre '${mediaSorted[1][0]}'. Serviço âncora de posicionamento da marca.`,
      });
    }
  }

  // Valley opportunity
  if (valleyEntry && avgSazonal > 0 && valleyEntry[1] < avgSazonal * 0.7) {
    const valleyPct = Math.round((1 - valleyEntry[1] / avgSazonal) * 100);
    insights.push({
      id: 'valley-month',
      type: 'warning',
      emoji: '⚡',
      title: 'Período de Baixa Demanda',
      message: `${valleyEntry[0]} é o vale sazonal, ${valleyPct}% abaixo da média. Oportunidade para campanhas promocionais e programas de fidelidade.`,
    });
  }

  // Regional concentration
  if (topCity && secondCity) {
    const topShare = regioes[topCity];
    const secondShare = regioes[secondCity];
    if (topShare > 0 && topShare - secondShare > 30) {
      insights.push({
        id: 'regional-concentration',
        type: 'info',
        emoji: '🗺️',
        title: 'Concentração Regional',
        message: `${topCity} concentra demanda muito superior às demais cidades (${topShare} vs ${secondShare}/100). Mercado fortemente centralizado.`,
      });
    }
  }

  return insights;
}
