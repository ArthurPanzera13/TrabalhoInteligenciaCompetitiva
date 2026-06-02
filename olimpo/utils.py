import time

import olimpo.plot_backend  # noqa: F401
import matplotlib.pyplot as plt


def banner() -> None:
    print("\n" + "═" * 72)
    print("   OLIMPO ESTÉTICA AUTOMOTIVA — INTELIGÊNCIA COMPETITIVA")
    print("   Sistema de monitoramento via Google Trends")
    print("   PUC-MG | Engenharia de Software | 2026")
    print("═" * 72 + "\n")


def log(msg: str, tipo: str = "INFO") -> None:
    cores = {"INFO": "\033[94m", "OK": "\033[92m", "WARN": "\033[93m", "ERRO": "\033[91m"}
    reset = "\033[0m"
    cor = cores.get(tipo, "")
    print(f"  [{cor}{tipo}{reset}] {msg}")


def safe_trends(pytrends, termos, geo, timeframe, tentativas=3, espera=8):
    """Coleta dados do Google Trends com retry automático."""
    for tentativa in range(1, tentativas + 1):
        try:
            pytrends.build_payload(termos, timeframe=timeframe, geo=geo)
            df = pytrends.interest_over_time()
            if "isPartial" in df.columns:
                df = df.drop(columns=["isPartial"])
            return df
        except Exception as e:
            log(f"Tentativa {tentativa}/{tentativas} falhou: {e}", "WARN")
            if tentativa < tentativas:
                log(f"Aguardando {espera}s antes de tentar novamente...", "WARN")
                time.sleep(espera)
                espera *= 2
    return None


def apply_style() -> None:
    plt.rcParams.update({
        "font.family": "DejaVu Sans",
        "axes.facecolor": "#F8F9FA",
        "figure.facecolor": "white",
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.grid": True,
        "grid.color": "#E0E0E0",
        "grid.linestyle": "--",
        "grid.alpha": 0.7,
        "axes.titlesize": 13,
        "axes.labelsize": 11,
        "xtick.labelsize": 9,
        "ytick.labelsize": 9,
        "legend.fontsize": 9,
    })
