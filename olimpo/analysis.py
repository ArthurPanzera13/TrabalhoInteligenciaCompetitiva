import time

import olimpo.plot_backend  # noqa: F401
import matplotlib.pyplot as plt
import seaborn as sns

from olimpo.config import (
    ACCENT_COLOR,
    BRAND_COLOR,
    KIQ1_GEO,
    KIQ1_TERMOS,
    KIQ1_TIMEFRAME,
    KIQ2_GEO,
    KIQ2_TERMOS,
    KIQ2_TIMEFRAME,
    OUTPUT_DIR,
    REGION_GEO,
    REGION_TERMO,
    REGION_TF,
    SUCCESS_COLOR,
    WARN_COLOR,
)
from olimpo.demo_data import demo_kiq1, demo_kiq2, demo_regioes
from olimpo.utils import apply_style, log, safe_trends


def analisar_kiq1(pytrends):
    log("Coletando dados KIQ 1 — Comparativo de serviços (12 meses, MG)...")
    df = safe_trends(pytrends, KIQ1_TERMOS, KIQ1_GEO, KIQ1_TIMEFRAME)
    if df is None or df.empty:
        log("Falha ao coletar KIQ 1. Usando dados de demonstração.", "WARN")
        df = demo_kiq1()

    log(f"KIQ 1: {len(df)} semanas coletadas, {len(df.columns)} termos.", "OK")

    medias = df.mean().sort_values(ascending=False)
    primeiros = df.iloc[: len(df) // 2].mean()
    ultimos = df.iloc[len(df) // 2 :].mean()
    crescimento = ((ultimos - primeiros) / primeiros.replace(0, 1) * 100).sort_values(ascending=False)

    apply_style()
    cores_graf = [BRAND_COLOR, ACCENT_COLOR, SUCCESS_COLOR, WARN_COLOR, "#9B59B6"]
    fig, ax = plt.subplots(figsize=(13, 5))

    for i, col in enumerate(df.columns):
        ax.plot(df.index, df[col], label=col.title(), color=cores_graf[i % len(cores_graf)], linewidth=2.2, alpha=0.9)
        ultimo_val = df[col].iloc[-1]
        ax.annotate(
            f"{int(ultimo_val)}",
            xy=(df.index[-1], ultimo_val),
            xytext=(6, 0),
            textcoords="offset points",
            fontsize=8,
            color=cores_graf[i % len(cores_graf)],
            va="center",
        )

    ax.set_title(
        "KIQ 1 — Interesse por serviço de estética automotiva\n(Minas Gerais, últimos 12 meses | Google Trends)",
        pad=14,
        fontweight="bold",
    )
    ax.set_ylabel("Índice de interesse relativo (0–100)")
    ax.set_xlabel("")
    ax.set_ylim(0, 110)
    ax.legend(loc="upper left", framealpha=0.9)
    ax.xaxis.set_major_formatter(plt.matplotlib.dates.DateFormatter("%b/%y"))
    plt.xticks(rotation=30, ha="right")
    plt.tight_layout()
    path1a = f"{OUTPUT_DIR}/graficos/kiq1_linha_temporal.png"
    plt.savefig(path1a, dpi=150, bbox_inches="tight")
    plt.close()
    log(f"Gráfico salvo: {path1a}", "OK")

    fig, axes = plt.subplots(1, 2, figsize=(13, 5))

    ax1 = axes[0]
    bars = ax1.barh(medias.index[::-1], medias.values[::-1], color=cores_graf[: len(medias)], alpha=0.85, height=0.6)
    for bar, val in zip(bars, medias.values[::-1]):
        ax1.text(val + 1, bar.get_y() + bar.get_height() / 2, f"{val:.1f}", va="center", fontsize=9, fontweight="bold")
    ax1.set_title("Média de interesse — últimos 12 meses", fontweight="bold")
    ax1.set_xlabel("Índice médio (0–100)")
    ax1.set_xlim(0, 115)
    ax1.set_yticklabels([c.title() for c in medias.index[::-1]], fontsize=9)
    ax1.set_facecolor("#F8F9FA")

    ax2 = axes[1]
    cores_cresc = [SUCCESS_COLOR if v >= 0 else WARN_COLOR for v in crescimento.values]
    bars2 = ax2.barh(crescimento.index[::-1], crescimento.values[::-1], color=cores_cresc[::-1], alpha=0.85, height=0.6)
    for bar, val in zip(bars2, crescimento.values[::-1]):
        ax2.text(
            val + 0.5 if val >= 0 else val - 0.5,
            bar.get_y() + bar.get_height() / 2,
            f"{val:+.0f}%",
            va="center",
            fontsize=9,
            fontweight="bold",
            ha="left" if val >= 0 else "right",
        )
    ax2.axvline(0, color="#555", linewidth=0.8)
    ax2.set_title("Variação de interesse (1ª metade → 2ª metade do período)", fontweight="bold")
    ax2.set_xlabel("Variação percentual (%)")
    ax2.set_yticklabels([c.title() for c in crescimento.index[::-1]], fontsize=9)
    ax2.set_facecolor("#F8F9FA")

    plt.suptitle("Google Trends · Olimpo Estética Automotiva · KIQ 1", fontsize=10, color="#888", y=1.01)
    plt.tight_layout()
    path1b = f"{OUTPUT_DIR}/graficos/kiq1_comparativo_barras.png"
    plt.savefig(path1b, dpi=150, bbox_inches="tight")
    plt.close()
    log(f"Gráfico salvo: {path1b}", "OK")

    return df, medias, crescimento


def analisar_kiq2(pytrends):
    log("Coletando dados KIQ 2 — Sazonalidade (5 anos, MG)...")
    df = safe_trends(pytrends, KIQ2_TERMOS, KIQ2_GEO, KIQ2_TIMEFRAME)
    if df is None or df.empty:
        log("Falha ao coletar KIQ 2. Usando dados de demonstração.", "WARN")
        df = demo_kiq2()

    log(f"KIQ 2: {len(df)} semanas coletadas.", "OK")

    df["mes"] = df.index.month
    df["ano"] = df.index.year
    df["soma"] = df[KIQ2_TERMOS].sum(axis=1) if all(c in df.columns for c in KIQ2_TERMOS) else df.sum(axis=1)

    sazonal = df.groupby("mes")["soma"].mean()
    nomes_mes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    sazonal.index = [nomes_mes[m - 1] for m in sazonal.index]

    anual = df.groupby("ano")["soma"].mean()

    apply_style()
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))

    ax1 = axes[0]
    cores_mes = [WARN_COLOR if v == sazonal.max() else (SUCCESS_COLOR if v == sazonal.min() else BRAND_COLOR) for v in sazonal.values]
    bars = ax1.bar(sazonal.index, sazonal.values, color=cores_mes, alpha=0.85, width=0.65)
    for bar, val in zip(bars, sazonal.values):
        ax1.text(bar.get_x() + bar.get_width() / 2, val + 1, f"{val:.0f}", ha="center", va="bottom", fontsize=9, fontweight="bold")
    ax1.set_title("Padrão sazonal médio — demanda por mês\n(agregado 5 anos)", fontweight="bold")
    ax1.set_ylabel("Índice médio agregado")
    ax1.set_ylim(0, sazonal.max() * 1.2)

    from matplotlib.patches import Patch

    legenda = [
        Patch(color=WARN_COLOR, label="Pico de demanda"),
        Patch(color=SUCCESS_COLOR, label="Vale de demanda"),
        Patch(color=BRAND_COLOR, label="Demanda regular"),
    ]
    ax1.legend(handles=legenda, loc="upper left", fontsize=8)
    ax1.axhline(sazonal.mean(), color="#555", linestyle="--", linewidth=1, label=f"Média anual: {sazonal.mean():.0f}")

    ax2 = axes[1]
    ax2.plot(
        anual.index,
        anual.values,
        color=BRAND_COLOR,
        linewidth=2.5,
        marker="o",
        markersize=7,
        markerfacecolor=ACCENT_COLOR,
        markeredgecolor=BRAND_COLOR,
    )
    for x, y in zip(anual.index, anual.values):
        ax2.annotate(f"{y:.0f}", (x, y), textcoords="offset points", xytext=(0, 10), ha="center", fontsize=9, fontweight="bold")
    ax2.fill_between(anual.index, anual.values, alpha=0.12, color=BRAND_COLOR)
    ax2.set_title("Evolução anual do interesse\n(tendência 2021–2026)", fontweight="bold")
    ax2.set_ylabel("Índice médio anual")
    ax2.set_xlabel("Ano")
    ax2.set_xticks(anual.index)

    plt.suptitle("Google Trends · Olimpo Estética Automotiva · KIQ 2 — Sazonalidade", fontsize=10, color="#888", y=1.01)
    plt.tight_layout()
    path2a = f"{OUTPUT_DIR}/graficos/kiq2_sazonalidade.png"
    plt.savefig(path2a, dpi=150, bbox_inches="tight")
    plt.close()
    log(f"Gráfico salvo: {path2a}", "OK")

    pivot = df.pivot_table(values="soma", index="ano", columns="mes", aggfunc="mean")
    pivot.columns = nomes_mes[: len(pivot.columns)]

    fig, ax = plt.subplots(figsize=(13, 4))
    sns.heatmap(
        pivot,
        cmap="YlOrRd",
        annot=True,
        fmt=".0f",
        linewidths=0.5,
        linecolor="white",
        ax=ax,
        cbar_kws={"label": "Índice de interesse"},
    )
    ax.set_title("KIQ 2 — Mapa de calor: interesse por mês e ano\n(Minas Gerais | Google Trends)", fontweight="bold", pad=12)
    ax.set_xlabel("Mês")
    ax.set_ylabel("Ano")
    plt.tight_layout()
    path2b = f"{OUTPUT_DIR}/graficos/kiq2_heatmap.png"
    plt.savefig(path2b, dpi=150, bbox_inches="tight")
    plt.close()
    log(f"Gráfico salvo: {path2b}", "OK")

    return df, sazonal, anual


def analisar_regioes(pytrends):
    log("Coletando distribuição regional dentro de MG...")
    time.sleep(3)
    try:
        pytrends.build_payload([REGION_TERMO], timeframe=REGION_TF, geo=REGION_GEO)
        df_reg = pytrends.interest_by_region(resolution="CITY", inc_low_vol=True, inc_geo_code=False)
        df_reg = df_reg[df_reg[REGION_TERMO] > 0].sort_values(REGION_TERMO, ascending=False).head(10)
    except Exception as e:
        log(f"Falha região: {e}. Usando dados de demonstração.", "WARN")
        df_reg = demo_regioes()

    apply_style()
    fig, ax = plt.subplots(figsize=(10, 5))
    cores_reg = [ACCENT_COLOR if i == 0 else BRAND_COLOR for i in range(len(df_reg))]
    bars = ax.barh(df_reg.index[::-1], df_reg[REGION_TERMO].values[::-1], color=cores_reg[::-1], alpha=0.85, height=0.65)
    for bar, val in zip(bars, df_reg[REGION_TERMO].values[::-1]):
        ax.text(val + 1, bar.get_y() + bar.get_height() / 2, f"{int(val)}", va="center", fontsize=9, fontweight="bold")
    ax.set_title(f'Interesse por "{REGION_TERMO}" — Cidades de MG\n(últimos 12 meses | Google Trends)', fontweight="bold", pad=12)
    ax.set_xlabel("Índice relativo (0–100)")
    ax.set_xlim(0, 115)
    plt.tight_layout()
    path_reg = f"{OUTPUT_DIR}/graficos/regioes_mg.png"
    plt.savefig(path_reg, dpi=150, bbox_inches="tight")
    plt.close()
    log(f"Gráfico salvo: {path_reg}", "OK")

    return df_reg
