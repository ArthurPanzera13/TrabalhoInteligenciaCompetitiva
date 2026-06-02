import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

const chartTitles = [
  "Interesse por servicos ao longo do tempo",
  "Media e crescimento por servico",
  "Sazonalidade mensal e evolucao anual",
  "Mapa de calor por mes e ano",
  "Distribuicao regional em Minas Gerais"
];

function cleanInsightsReport(report) {
  if (!report) return "";

  return report
    .replace(
      /[\s\S]*?FERRAMENTA UTILIZADA[\s\S]*?PARÂMETROS CONFIGURADOS/m,
      "PARÂMETROS CONFIGURADOS"
    )
    .replace(
      /ARQUIVOS GERADOS[\s\S]*$/m,
      ""
    )
    .trim();
}

function formatLabel(value) {
  return value
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
  return values.length ? Math.max(...values) : 1;
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
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Pronto para uma nova analise");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const startAnalysis = async () => {
    setError("");
    setResult(null);
    setProgress(0);
    setMessage("Preparando consulta");

    const payload = {
      ...form,
      terms_kiq1: form.terms_kiq1.split(",").map((s) => s.trim()).filter(Boolean),
      terms_kiq2: form.terms_kiq2.split(",").map((s) => s.trim()).filter(Boolean)
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

            <button className="primaryButton" onClick={startAnalysis}>
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
                      <h3>Painel de graficos</h3>
                    </div>
                  </div>

                  <div className="chartsGrid">
                    {(result?.artifacts?.charts || []).map((src, index) => (
                      <article className={`chartCard ${index === 0 ? "chartCardFeatured" : ""}`} key={src}>
                        <div className="chartHeader">
                          <span>Grafico {index + 1}</span>
                          <strong>{chartTitles[index] || "Visualizacao"}</strong>
                        </div>
                        <img src={`${API_BASE}${src}`} alt={chartTitles[index] || src} />
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
