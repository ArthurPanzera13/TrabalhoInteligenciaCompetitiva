import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const API_BASE = "http://127.0.0.1:8000";
const NUMBER_FORMATTER = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

const CHART_SOURCES = {
  kiq1_medias: {
    label: "KIQ1 medias",
    description: "Comparacao de interesse medio entre servicos.",
    color: "#c26d2c"
  },
  kiq1_crescimento_pct: {
    label: "KIQ1 crescimento",
    description: "Leitura de aceleracao recente por servico.",
    color: "#1f6f78"
  },
  kiq2_sazonal: {
    label: "KIQ2 sazonal",
    description: "Distribuicao da demanda ao longo dos meses.",
    color: "#2563eb"
  },
  kiq2_anual: {
    label: "KIQ2 anual",
    description: "Evolucao anual para observar tendencia de longo prazo.",
    color: "#7c3aed"
  },
  regioes: {
    label: "Regioes",
    description: "Mapa de potencial geografico por cidade.",
    color: "#d97706"
  }
};

const CHART_TYPES = {
  bar: { label: "Barra" },
  line: { label: "Linha" },
  area: { label: "Area" },
  pie: { label: "Pizza" }
};

const SORT_MODES = {
  desc: "Maior para menor",
  asc: "Menor para maior",
  abs: "Maior amplitude",
  none: "Ordem original"
};

const PALETTE = ["#c26d2c", "#1f6f78", "#2563eb", "#7c3aed", "#0f766e", "#b45309", "#dc2626"];

function createChartId() {
  return globalThis.crypto?.randomUUID?.() || `chart-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createDefaultChartConfigs() {
  return [
    {
      id: createChartId(),
      title: "KIQ1 - media por servico",
      source: "kiq1_medias",
      type: "bar",
      limit: 5,
      sortMode: "desc"
    },
    {
      id: createChartId(),
      title: "KIQ1 - crescimento percentual",
      source: "kiq1_crescimento_pct",
      type: "bar",
      limit: 5,
      sortMode: "abs"
    },
    {
      id: createChartId(),
      title: "KIQ2 - sazonalidade mensal",
      source: "kiq2_sazonal",
      type: "line",
      limit: 6,
      sortMode: "none"
    },
    {
      id: createChartId(),
      title: "KIQ2 - evolucao anual",
      source: "kiq2_anual",
      type: "area",
      limit: 8,
      sortMode: "none"
    },
    {
      id: createChartId(),
      title: "Regioes com maior potencial",
      source: "regioes",
      type: "pie",
      limit: 5,
      sortMode: "desc"
    }
  ];
}

function cleanInsightsReport(report) {
  if (!report) return "";

  return report
    .replace(/\s[\s\S]*?FERRAMENTA UTILIZADA[\s\S]*?PARÂMETROS CONFIGURADOS/m, "PARÂMETROS CONFIGURADOS")
    .replace(/ARQUIVOS GERADOS[\s\S]*$/m, "")
    .trim();
}

function formatLabel(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function summaryCards(summary) {
  return [
    { label: "Servico lider", value: formatLabel(summary.kiq1_top_media || "-") },
    { label: "Maior crescimento", value: formatLabel(summary.kiq1_top_growth || "-") },
    { label: "Mes mais aquecido", value: formatLabel(summary.kiq2_peak_month || "-") },
    { label: "Cidade com demanda", value: formatLabel(summary.region_top_city || "-") }
  ];
}

function topEntries(record, limit = 5) {
  return Object.entries(record || {}).slice(0, limit);
}

function maxValue(record) {
  const values = Object.values(record || {});
  return values.length ? Math.max(...values.map((value) => Number(value) || 0), 1) : 1;
}

function buildChartData(record, config) {
  const limit = Math.max(1, Number(config.limit) || 5);
  const entries = Object.entries(record || {})
    .map(([rawLabel, rawValue]) => ({
      name: formatLabel(rawLabel),
      value: Number(rawValue) || 0
    }))
    .filter((item) => Number.isFinite(item.value));

  if (config.sortMode === "desc") {
    entries.sort((left, right) => right.value - left.value);
  } else if (config.sortMode === "asc") {
    entries.sort((left, right) => left.value - right.value);
  } else if (config.sortMode === "abs") {
    entries.sort((left, right) => Math.abs(right.value) - Math.abs(left.value));
  }

  return entries.slice(0, limit);
}

function ChartCanvas({ config, data }) {
  const sourceMeta = CHART_SOURCES[config.source] || CHART_SOURCES.kiq1_medias;
  const hasNegativeValues = data.some((item) => item.value < 0);

  if (!data.length) {
    return <div className="chartEmpty">Execute uma analise para carregar esta visualizacao.</div>;
  }

  if (config.type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Tooltip formatter={(value) => NUMBER_FORMATTER.format(Number(value) || 0)} />
          <Legend />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={112}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (config.type === "line") {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(20, 33, 61, 0.1)" />
          <XAxis dataKey="name" tick={{ fill: "#62748a", fontSize: 12 }} interval={0} />
          <YAxis tick={{ fill: "#62748a", fontSize: 12 }} tickFormatter={(value) => NUMBER_FORMATTER.format(value)} />
          <Tooltip formatter={(value) => NUMBER_FORMATTER.format(Number(value) || 0)} />
          <Legend />
          {hasNegativeValues && <ReferenceLine y={0} stroke="rgba(20, 33, 61, 0.35)" strokeDasharray="5 5" />}
          <Line
            type="monotone"
            dataKey="value"
            stroke={sourceMeta.color}
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (config.type === "area") {
    const gradientId = `${config.id}-gradient`;

    return (
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={sourceMeta.color} stopOpacity={0.5} />
              <stop offset="95%" stopColor={sourceMeta.color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(20, 33, 61, 0.1)" />
          <XAxis dataKey="name" tick={{ fill: "#62748a", fontSize: 12 }} interval={0} />
          <YAxis tick={{ fill: "#62748a", fontSize: 12 }} tickFormatter={(value) => NUMBER_FORMATTER.format(value)} />
          <Tooltip formatter={(value) => NUMBER_FORMATTER.format(Number(value) || 0)} />
          <Legend />
          {hasNegativeValues && <ReferenceLine y={0} stroke="rgba(20, 33, 61, 0.35)" strokeDasharray="5 5" />}
          <Area type="monotone" dataKey="value" stroke={sourceMeta.color} fill={`url(#${gradientId})`} strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="4 4" stroke="rgba(20, 33, 61, 0.1)" />
        <XAxis dataKey="name" tick={{ fill: "#62748a", fontSize: 12 }} interval={0} />
        <YAxis tick={{ fill: "#62748a", fontSize: 12 }} tickFormatter={(value) => NUMBER_FORMATTER.format(value)} />
        <Tooltip formatter={(value) => NUMBER_FORMATTER.format(Number(value) || 0)} />
        <Legend />
        {hasNegativeValues && <ReferenceLine y={0} stroke="rgba(20, 33, 61, 0.35)" strokeDasharray="5 5" />}
        <Bar dataKey="value" fill={sourceMeta.color} radius={[12, 12, 0, 0]} barSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function App() {
  const [form, setForm] = useState({
    terms_kiq1: "polimento automotivo, vitrificacao automotiva, higienizacao automotiva, lavagem tecnica carro, ppf automotivo",
    kiq1_geo: "BR-MG",
    kiq1_timeframe: "today 12-m",
    terms_kiq2: "estetica automotiva belo horizonte, polimento carro bh, lava rapido bh",
    kiq2_geo: "BR-MG",
    kiq2_timeframe: "today 5-y",
    region_term: "estetica automotiva",
    region_geo: "BR-MG",
    region_timeframe: "today 12-m"
  });
  const [chartConfigs, setChartConfigs] = useState(() => createDefaultChartConfigs());
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Pronto para uma nova analise");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateChartConfig = (id, key, value) => {
    setChartConfigs((prev) => prev.map((chart) => (chart.id === id ? { ...chart, [key]: value } : chart)));
  };

  const addChart = () => {
    setChartConfigs((prev) => [
      ...prev,
      {
        id: createChartId(),
        title: `Visualizacao ${prev.length + 1}`,
        source: "kiq1_medias",
        type: "bar",
        limit: 5,
        sortMode: "desc"
      }
    ]);
  };

  const removeChart = (id) => {
    setChartConfigs((prev) => (prev.length === 1 ? prev : prev.filter((chart) => chart.id !== id)));
  };

  const resetCharts = () => {
    setChartConfigs(createDefaultChartConfigs());
  };

  const startAnalysis = async () => {
    setError("");
    setResult(null);
    setProgress(0);
    setMessage("Preparando consulta");

    const payload = {
      ...form,
      terms_kiq1: form.terms_kiq1.split(",").map((value) => value.trim()).filter(Boolean),
      terms_kiq2: form.terms_kiq2.split(",").map((value) => value.trim()).filter(Boolean)
    };

    const runResp = await fetch(`${API_BASE}/analysis/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!runResp.ok) {
      setError("Falha ao iniciar analise.");
      return;
    }

    const runData = await runResp.json();
    setJobId(runData.job_id);
    setStatus(runData.status);

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/analysis/${runData.job_id}`);
    ws.onopen = () => ws.send("subscribe");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data.progress ?? 0);
      setMessage(data.message ?? "Atualizando...");
    };

    const interval = setInterval(async () => {
      const statusResp = await fetch(`${API_BASE}/analysis/${runData.job_id}`);
      if (!statusResp.ok) return;
      const statusData = await statusResp.json();
      setStatus(statusData.status);
      setProgress(statusData.progress);
      setMessage(statusData.message);

      if (statusData.status === "done" || statusData.status === "error") {
        clearInterval(interval);
        ws.close();

        const resultResp = await fetch(`${API_BASE}/analysis/${runData.job_id}/result`);
        const resultData = await resultResp.json();
        if (resultData.status === "done") {
          setResult(resultData.result);
        } else {
          setError(resultData.error || "Erro na analise");
        }
      }
    }, 1500);
  };

  const cards = result ? summaryCards(result.summary) : [];
  const displayReport = cleanInsightsReport(result?.insights_report);
  const topServices = topEntries(result?.kiq1_medias, 5);
  const topGrowth = topEntries(result?.kiq1_crescimento_pct, 5);
  const topRegions = topEntries(result?.regioes, 5);
  const seasonalMoments = topEntries(result?.kiq2_sazonal, 6);
  const servicesMax = maxValue(result?.kiq1_medias);
  const growthMax = Math.max(...topGrowth.map(([, value]) => Math.abs(value)), 1);
  const regionMax = maxValue(result?.regioes);
  const seasonalMax = maxValue(result?.kiq2_sazonal);

  const chartViews = useMemo(
    () =>
      chartConfigs.map((config) => ({
        ...config,
        sourceMeta: CHART_SOURCES[config.source] || CHART_SOURCES.kiq1_medias,
        data: buildChartData(result?.[config.source], config)
      })),
    [chartConfigs, result]
  );

  return (
    <div className="pageShell">
      <div className="ambient ambientLeft" />
      <div className="ambient ambientRight" />

      <main className="page">
        <section className="heroCard">
          <div className="heroCopy">
            <span className="eyebrow">Painel de inteligencia competitiva</span>
            <h1>Decisoes mais rapidas com sinais de mercado em tempo real.</h1>
            <p>
              Rode analises do Google Trends, acompanhe o processamento ao vivo e transforme os
              resultados em acoes de portfolio, agenda e expansao regional.
            </p>
          </div>

          <div className="heroStats">
            <div className="statTile">
              <span>Foco</span>
              <strong>Demanda e sazonalidade</strong>
            </div>
            <div className="statTile">
              <span>Visao</span>
              <strong>Servico, periodo e regiao</strong>
            </div>
            <div className="statTile">
              <span>Entrega</span>
              <strong>Graficos, insights e relatorio</strong>
            </div>
          </div>
        </section>

        <section className="workspace">
          <aside className="controlPanel">
            <div className="panelHeader">
              <h2>Configurar analise</h2>
              <p>Ajuste os parametros e dispare uma nova leitura de mercado.</p>
            </div>

            <div className="formSection">
              <h3>Comparativo de servicos</h3>
              <label>Termos KIQ1</label>
              <textarea rows="4" value={form.terms_kiq1} onChange={(e) => onChange("terms_kiq1", e.target.value)} />
              <div className="fieldRow">
                <div>
                  <label>Regiao</label>
                  <input value={form.kiq1_geo} onChange={(e) => onChange("kiq1_geo", e.target.value)} />
                </div>
                <div>
                  <label>Periodo</label>
                  <input value={form.kiq1_timeframe} onChange={(e) => onChange("kiq1_timeframe", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="formSection">
              <h3>Sazonalidade</h3>
              <label>Termos KIQ2</label>
              <textarea rows="3" value={form.terms_kiq2} onChange={(e) => onChange("terms_kiq2", e.target.value)} />
              <div className="fieldRow">
                <div>
                  <label>Regiao</label>
                  <input value={form.kiq2_geo} onChange={(e) => onChange("kiq2_geo", e.target.value)} />
                </div>
                <div>
                  <label>Periodo</label>
                  <input value={form.kiq2_timeframe} onChange={(e) => onChange("kiq2_timeframe", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="formSection">
              <h3>Regiao prioritaria</h3>
              <label>Termo regional</label>
              <input value={form.region_term} onChange={(e) => onChange("region_term", e.target.value)} />
              <div className="fieldRow">
                <div>
                  <label>Regiao</label>
                  <input value={form.region_geo} onChange={(e) => onChange("region_geo", e.target.value)} />
                </div>
                <div>
                  <label>Periodo</label>
                  <input value={form.region_timeframe} onChange={(e) => onChange("region_timeframe", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="formSection">
              <div className="sectionInlineHeader">
                <div>
                  <h3>Biblioteca de visualizacoes</h3>
                  <p>Troque fonte, tipo e ordem para adaptar o painel a qualquer leitura.</p>
                </div>
                <div className="sectionActions">
                  <button type="button" className="secondaryButton" onClick={resetCharts}>
                    Resetar
                  </button>
                  <button type="button" className="secondaryButton" onClick={addChart}>
                    Novo grafico
                  </button>
                </div>
              </div>

              <div className="chartConfigList">
                {chartConfigs.map((config, index) => (
                  <article className="chartConfigCard" key={config.id}>
                    <div className="chartConfigHeader">
                      <strong>Grafico {index + 1}</strong>
                      <button type="button" className="ghostButton" onClick={() => removeChart(config.id)}>
                        Remover
                      </button>
                    </div>

                    <label>Titulo</label>
                    <input value={config.title} onChange={(e) => updateChartConfig(config.id, "title", e.target.value)} />

                    <div className="chartConfigGrid">
                      <div>
                        <label>Fonte KIQ</label>
                        <select value={config.source} onChange={(e) => updateChartConfig(config.id, "source", e.target.value)}>
                          {Object.entries(CHART_SOURCES).map(([key, meta]) => (
                            <option key={key} value={key}>
                              {meta.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label>Tipo</label>
                        <select value={config.type} onChange={(e) => updateChartConfig(config.id, "type", e.target.value)}>
                          {Object.entries(CHART_TYPES).map(([key, meta]) => (
                            <option key={key} value={key}>
                              {meta.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label>Limite</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={config.limit}
                          onChange={(e) => updateChartConfig(config.id, "limit", Number(e.target.value) || 1)}
                        />
                      </div>

                      <div>
                        <label>Ordem</label>
                        <select value={config.sortMode} onChange={(e) => updateChartConfig(config.id, "sortMode", e.target.value)}>
                          {Object.entries(SORT_MODES).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <button type="button" className="primaryButton" onClick={startAnalysis}>
              Rodar analise estrategica
            </button>
          </aside>

          <section className="dashboardPanel">
            <div className="statusCard">
              <div className="statusTop">
                <div>
                  <span className="miniLabel">Status atual</span>
                  <h2>{formatLabel(status)}</h2>
                </div>
                <div className="jobPill">{jobId ? `Job ${jobId.slice(0, 8)}` : "Sem job ativo"}</div>
              </div>

              <div className="progressTrack">
                <div className="progressFill" style={{ width: `${progress}%` }} />
              </div>

              <div className="statusMeta">
                <strong>{progress}%</strong>
                <span>{message}</span>
              </div>
            </div>

            {error && <div className="errorCard">{error}</div>}

            {result && (
              <>
                <div className="summaryGrid">
                  {cards.map((card) => (
                    <article className="summaryCard" key={card.label}>
                      <span>{card.label}</span>
                      <strong>{card.value}</strong>
                    </article>
                  ))}
                </div>

                <section className="insightPanel">
                  <div className="sectionHeader">
                    <div>
                      <span className="eyebrow">Leitura executiva</span>
                      <h3>Insights para decisao</h3>
                    </div>
                  </div>
                  <pre>{displayReport}</pre>
                </section>

                <section className="compiledPanel">
                  <div className="sectionHeader">
                    <div>
                      <span className="eyebrow">Analise compilada</span>
                      <h3>Leituras visuais para decisao rapida</h3>
                    </div>
                  </div>

                  <div className="compiledGrid">
                    <article className="compiledCard spotlightCard">
                      <span className="compiledLabel">Prioridade de portfolio</span>
                      <strong>{formatLabel(result.summary.kiq1_top_growth)}</strong>
                      <p>
                        O servico com maior aceleracao recente merece destaque comercial e teste de
                        oferta combinada.
                      </p>
                    </article>

                    <article className="compiledCard spotlightCard altSpotlight">
                      <span className="compiledLabel">Janela sazonal</span>
                      <strong>{formatLabel(result.summary.kiq2_peak_month)}</strong>
                      <p>
                        Planeje reforco de agenda, capacidade operacional e campanhas antes do pico.
                      </p>
                    </article>

                    <article className="compiledCard rankingCard">
                      <div className="compiledHeader">
                        <span className="compiledLabel">Servicos mais fortes</span>
                        <strong>Volume medio</strong>
                      </div>
                      <div className="metricList">
                        {topServices.map(([label, value]) => (
                          <div className="metricRow" key={label}>
                            <div className="metricText">
                              <span>{formatLabel(label)}</span>
                              <strong>{value.toFixed(1)}</strong>
                            </div>
                            <div className="metricBarTrack">
                              <div className="metricBarFill warmFill" style={{ width: `${(value / servicesMax) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>

                    <article className="compiledCard rankingCard">
                      <div className="compiledHeader">
                        <span className="compiledLabel">Crescimento recente</span>
                        <strong>Variacao percentual</strong>
                      </div>
                      <div className="metricList">
                        {topGrowth.map(([label, value]) => (
                          <div className="metricRow" key={label}>
                            <div className="metricText">
                              <span>{formatLabel(label)}</span>
                              <strong>{value.toFixed(0)}%</strong>
                            </div>
                            <div className="metricBarTrack">
                              <div
                                className={`metricBarFill ${value >= 0 ? "coolFill" : "alertFill"}`}
                                style={{ width: `${(Math.abs(value) / growthMax) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>

                    <article className="compiledCard rankingCard">
                      <div className="compiledHeader">
                        <span className="compiledLabel">Radar sazonal</span>
                        <strong>Meses com maior intensidade</strong>
                      </div>
                      <div className="metricList">
                        {seasonalMoments.map(([label, value]) => (
                          <div className="metricRow" key={label}>
                            <div className="metricText">
                              <span>{formatLabel(label)}</span>
                              <strong>{value.toFixed(0)}</strong>
                            </div>
                            <div className="metricBarTrack">
                              <div className="metricBarFill neutralFill" style={{ width: `${(value / seasonalMax) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>

                    <article className="compiledCard rankingCard">
                      <div className="compiledHeader">
                        <span className="compiledLabel">Regioes em destaque</span>
                        <strong>Potencial geografico</strong>
                      </div>
                      <div className="metricList">
                        {topRegions.map(([label, value]) => (
                          <div className="metricRow" key={label}>
                            <div className="metricText">
                              <span>{formatLabel(label)}</span>
                              <strong>{value.toFixed(0)}</strong>
                            </div>
                            <div className="metricBarTrack">
                              <div className="metricBarFill darkFill" style={{ width: `${(value / regionMax) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>
                </section>

                <section className="chartsPanel">
                  <div className="sectionHeader">
                    <div>
                      <span className="eyebrow">Visualizacoes</span>
                      <h3>Painel de graficos configuraveis</h3>
                    </div>
                  </div>

                  <div className="chartsGrid">
                    {chartViews.map((chart, index) => (
                      <article className={`chartCard ${index === 0 ? "chartCardFeatured" : ""}`} key={chart.id}>
                        <div className="chartHeader">
                          <span>{CHART_TYPES[chart.type]?.label || "Visualizacao"}</span>
                          <strong>{chart.title}</strong>
                        </div>

                        <div className="chartSourceMeta">
                          <span>{chart.sourceMeta.label}</span>
                          <span>{chart.data.length} pontos</span>
                        </div>

                        <ChartCanvas config={chart} data={chart.data} />
                      </article>
                    ))}
                  </div>
                </section>
              </>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}