'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AnalysisConfig, AnalysisResult, SSEEvent } from '@/types/analysis';
import ConfigPanel from '@/components/ConfigPanel';
import ProgressBar from '@/components/ProgressBar';
import SummaryCards from '@/components/SummaryCards';
import InsightCard from '@/components/InsightCard';
import ExportButtons from '@/components/ExportButtons';
import LineTemporalChart from '@/components/charts/LineTemporalChart';
import ComparativoBarras from '@/components/charts/ComparativoBarras';
import SazonalidadeChart from '@/components/charts/SazonalidadeChart';
import HeatmapGrid from '@/components/charts/HeatmapGrid';
import RegiaoChart from '@/components/charts/RegiaoChart';
import { generateInsights } from '@/lib/insights';

const DEFAULT_CONFIG: AnalysisConfig = {
  kiq1_termos: [
    'polimento automotivo',
    'vitrificação automotiva',
    'higienização automotiva',
    'lavagem técnica carro',
    'ppf automotivo',
  ],
  kiq1_geo: 'BR-MG',
  kiq1_timeframe: '12m',
  kiq2_termos: [
    'estética automotiva belo horizonte',
    'polimento carro bh',
    'lava rápido bh',
  ],
  kiq2_geo: 'BR-MG',
  kiq2_timeframe: '5y',
  region_termo: 'estética automotiva',
  region_geo: 'BR-MG',
};

function SkeletonRect({ h = 'h-48' }: { h?: string }) {
  return <div className={`rounded-lg animate-pulse bg-[#1e293b] ${h}`} />;
}

export default function Home() {
  const [config, setConfig] = useState<AnalysisConfig>(DEFAULT_CONFIG);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ pct: 0, message: '' });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('olimpo-theme');
    if (stored === 'light') {
      setIsDark(false);
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('olimpo-theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('olimpo-theme', 'light');
    }
  };

  const runAnalysis = useCallback(() => {
    if (isRunning) return;
    esRef.current?.close();
    setIsRunning(true);
    setResult(null);
    setProgress({ pct: 0, message: 'Iniciando análise...' });

    const configB64 = btoa(encodeURIComponent(JSON.stringify(config)));
    const es = new EventSource(`/api/analyze/stream?config=${configB64}`);
    esRef.current = es;

    es.onmessage = (event) => {
      const data: SSEEvent = JSON.parse(event.data);
      if (data.type === 'progress') {
        setProgress({ pct: data.pct, message: data.message });
      } else if (data.type === 'done') {
        setResult(data.result);
        setIsRunning(false);
        es.close();
      } else if (data.type === 'error') {
        console.error('Analysis error:', data.message);
        setIsRunning(false);
        es.close();
      }
    };

    es.onerror = () => {
      setIsRunning(false);
      es.close();
    };
  }, [config, isRunning]);

  const insights = result ? generateInsights(result) : [];

  const card = (isDark ? '#111827' : '#ffffff');
  const border = (isDark ? '#1e293b' : '#e2e8f0');
  const fg = (isDark ? '#e2e8f0' : '#0f172a');
  const muted = (isDark ? '#94a3b8' : '#64748b');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: isDark ? '#0a0f1a' : '#f8fafc', color: fg }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 px-4 py-2.5 flex items-center justify-between gap-4 border-b"
        style={{ background: card, borderColor: border }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-1.5 rounded-lg transition-colors text-base hover:opacity-70"
            aria-label="Toggle sidebar"
            style={{ color: muted }}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <span className="text-[#F4A261] font-bold text-lg">⚡ Olimpo IC</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#2E4057', color: '#fff' }}>
            PUC-MG 2026
          </span>
          {result?.is_demo && (
            <span className="text-xs px-2 py-0.5 rounded-full border"
              style={{ background: 'rgba(234,179,8,0.15)', color: '#facc15', borderColor: 'rgba(234,179,8,0.3)' }}>
              Modo demonstração
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity text-base" aria-label="Theme">
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={runAnalysis}
            disabled={isRunning}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50 hover:opacity-90"
            style={{ background: '#F4A261', color: '#1a1a1a' }}
          >
            {isRunning ? <><span className="inline-block animate-spin">⟳</span> Analisando...</> : <>▶ Executar Análise</>}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-72 flex-shrink-0 overflow-y-auto border-r" style={{ background: isDark ? '#111827' : '#f1f5f9', borderColor: border }}>
            <ConfigPanel config={config} onChange={setConfig} />
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">

          {isRunning && <ProgressBar pct={progress.pct} message={progress.message} />}

          {isRunning && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <SkeletonRect key={i} h="h-20" />)}
              </div>
              <div className="rounded-xl border p-4" style={{ background: card, borderColor: border }}>
                <SkeletonRect h="h-4 w-40 mb-3" />
                <SkeletonRect />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border p-4" style={{ background: card, borderColor: border }}>
                  <SkeletonRect />
                </div>
                <div className="rounded-xl border p-4" style={{ background: card, borderColor: border }}>
                  <SkeletonRect />
                </div>
              </div>
            </div>
          )}

          {!result && !isRunning && (
            <div className="flex flex-col items-center justify-center h-72 gap-4 text-center">
              <div className="text-6xl opacity-20">📊</div>
              <p className="text-base font-medium" style={{ color: muted }}>
                Configure os parâmetros e execute a análise
              </p>
              <p className="text-sm" style={{ color: isDark ? '#475569' : '#94a3b8' }}>
                Dados coletados do Google Trends em tempo real
              </p>
              <button
                onClick={runAnalysis}
                className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity mt-2"
                style={{ background: '#F4A261', color: '#1a1a1a' }}
              >
                ▶ Executar Análise Agora
              </button>
            </div>
          )}

          {result && !isRunning && (
            <div className="space-y-8 max-w-[1400px]">

              <SummaryCards
                summary={result.summary}
                medias={result.kiq1_medias}
                crescimento={result.kiq1_crescimento_pct}
              />

              {/* KIQ 1 */}
              <section>
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider" style={{ color: fg }}>
                  <span style={{ color: '#F4A261' }}>▪</span> KIQ 1 — Comparativo de Serviços
                </h2>
                <div className="space-y-4">
                  <div className="rounded-xl border p-4" style={{ background: card, borderColor: border }}>
                    <p className="text-xs mb-3" style={{ color: muted }}>Evolução temporal do interesse (índice 0–100)</p>
                    <LineTemporalChart timeline={result.kiq1_timeline} terms={config.kiq1_termos} />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-xl border p-4" style={{ background: card, borderColor: border }}>
                      <p className="text-xs mb-3" style={{ color: muted }}>Interesse médio por serviço</p>
                      <ComparativoBarras data={result.kiq1_medias} type="media" />
                    </div>
                    <div className="rounded-xl border p-4" style={{ background: card, borderColor: border }}>
                      <p className="text-xs mb-3" style={{ color: muted }}>Variação no período (%)</p>
                      <ComparativoBarras data={result.kiq1_crescimento_pct} type="crescimento" />
                    </div>
                  </div>
                </div>
              </section>

              {/* KIQ 2 */}
              <section>
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider" style={{ color: fg }}>
                  <span style={{ color: '#F4A261' }}>▪</span> KIQ 2 — Sazonalidade
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl border p-4" style={{ background: card, borderColor: border }}>
                    <SazonalidadeChart sazonal={result.kiq2_sazonal} anual={result.kiq2_anual} />
                  </div>
                  <div className="rounded-xl border p-4" style={{ background: card, borderColor: border }}>
                    <p className="text-xs mb-3" style={{ color: muted }}>Heatmap intensidade (ano × mês)</p>
                    <HeatmapGrid heatmap={result.kiq2_heatmap} />
                  </div>
                </div>
              </section>

              {/* Regional */}
              <section>
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider" style={{ color: fg }}>
                  <span style={{ color: '#F4A261' }}>▪</span> Análise Regional — Minas Gerais
                </h2>
                <div className="rounded-xl border p-4" style={{ background: card, borderColor: border }}>
                  <p className="text-xs mb-3" style={{ color: muted }}>
                    Termo: <strong style={{ color: '#F4A261' }}>&quot;{config.region_termo}&quot;</strong>
                    {' '}— laranja = cidade com maior índice
                  </p>
                  <RegiaoChart regioes={result.regioes} topCity={result.summary.region_top_city} />
                </div>
              </section>

              {/* Insights */}
              {insights.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider" style={{ color: fg }}>
                    <span style={{ color: '#F4A261' }}>▪</span> Perspectiva Analítica
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {insights.map(insight => (
                      <InsightCard key={insight.id} insight={insight} />
                    ))}
                  </div>
                </section>
              )}

              <ExportButtons result={result} />
            </div>
          )}
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="text-center text-xs py-2.5 px-6 border-t" style={{ background: card, borderColor: border, color: isDark ? '#475569' : '#94a3b8' }}>
        Fonte: Google Trends&nbsp;|&nbsp;google-trends-api 4.9.2&nbsp;|&nbsp;Dados normalizados 0–100&nbsp;|&nbsp;Olimpo Estética Automotiva — PUC-MG 2026
      </footer>
    </div>
  );
}
