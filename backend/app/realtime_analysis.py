from __future__ import annotations

import time
from pathlib import Path
from typing import Callable

from olimpo.analysis import analisar_kiq1, analisar_kiq2, analisar_regioes
from olimpo.compat import patch_pytrends_retry_compat
from olimpo.reporting import gerar_relatorio

ProgressCb = Callable[[int, str], None]


def _series_to_dict(series):
    return {str(k): float(v) for k, v in series.items()}


def run_analysis(payload: dict, progress_cb: ProgressCb) -> dict:
    patch_pytrends_retry_compat()
    from pytrends.request import TrendReq

    progress_cb(5, "Inicializando conexão com Google Trends")
    pytrends = TrendReq(hl="pt-BR", tz=-180, timeout=(10, 30), retries=2, backoff_factor=0.5)

    progress_cb(15, "Gerando KIQ1 e gráficos")
    df_kiq1, medias, crescimento = analisar_kiq1(pytrends)

    time.sleep(2)
    progress_cb(45, "Gerando KIQ2 e gráficos")
    df_kiq2, sazonal, anual = analisar_kiq2(pytrends)

    time.sleep(2)
    progress_cb(70, "Gerando gráfico regional")
    df_reg = analisar_regioes(pytrends)

    progress_cb(85, "Gerando relatório de insights")
    report_text = gerar_relatorio(df_kiq1, medias, crescimento, df_kiq2, sazonal, anual, df_reg)

    progress_cb(100, "Concluído")
    return {
        "summary": {
            "kiq1_top_media": str(medias.idxmax()),
            "kiq1_top_growth": str(crescimento.idxmax()),
            "kiq2_peak_month": str(sazonal.idxmax()),
            "region_top_city": str(df_reg.index[0]) if not df_reg.empty else "N/D",
        },
        "kiq1_medias": _series_to_dict(medias),
        "kiq1_crescimento_pct": _series_to_dict(crescimento),
        "kiq2_sazonal": _series_to_dict(sazonal),
        "kiq2_anual": _series_to_dict(anual),
        "regioes": {str(i): float(v) for i, v in df_reg.iloc[:, 0].items()},
        "artifacts": {
            "report_txt": str(Path("relatorio_olimpo/relatorio_olimpo_ic.txt")),
            "report_xlsx": str(Path("relatorio_olimpo/relatorio_olimpo_ic.xlsx")),
            "charts_dir": str(Path("relatorio_olimpo/graficos")),
            "charts": [
                "/artifacts/graficos/kiq1_linha_temporal.png",
                "/artifacts/graficos/kiq1_comparativo_barras.png",
                "/artifacts/graficos/kiq2_sazonalidade.png",
                "/artifacts/graficos/kiq2_heatmap.png",
                "/artifacts/graficos/regioes_mg.png",
            ],
        },
        "insights_report": report_text,
    }
