import type { AnalysisResult } from '@/types/analysis';

export function exportJSON(result: AnalysisResult): void {
  const json = JSON.stringify(result, null, 2);
  triggerDownload(
    new Blob([json], { type: 'application/json' }),
    `olimpo-ic-${datestamp()}.json`
  );
}

export function exportCSV(result: AnalysisResult): void {
  const sections: string[] = [];

  sections.push('KIQ 1 - Médias de Interesse');
  sections.push('Termo,Média (0-100)');
  Object.entries(result.kiq1_medias).forEach(([k, v]) => {
    sections.push(`"${k}",${v}`);
  });

  sections.push('');
  sections.push('KIQ 1 - Variação no Período (%)');
  sections.push('Termo,Crescimento(%)');
  Object.entries(result.kiq1_crescimento_pct).forEach(([k, v]) => {
    sections.push(`"${k}",${v}`);
  });

  sections.push('');
  sections.push('KIQ 2 - Sazonalidade Mensal');
  sections.push('Mês,Índice Médio');
  Object.entries(result.kiq2_sazonal).forEach(([m, v]) => {
    sections.push(`${m},${v}`);
  });

  sections.push('');
  sections.push('KIQ 2 - Evolução Anual');
  sections.push('Ano,Índice Médio');
  Object.entries(result.kiq2_anual)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([y, v]) => { sections.push(`${y},${v}`); });

  sections.push('');
  sections.push('Regional - Top Cidades MG');
  sections.push('Cidade,Índice (0-100)');
  Object.entries(result.regioes).forEach(([c, v]) => {
    sections.push(`"${c}",${v}`);
  });

  const csv = '﻿' + sections.join('\n');
  triggerDownload(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    `olimpo-ic-${datestamp()}.csv`
  );
}

export async function copyReport(result: AnalysisResult): Promise<void> {
  await navigator.clipboard.writeText(result.insights_report);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function datestamp(): string {
  return new Date().toISOString().split('T')[0];
}
