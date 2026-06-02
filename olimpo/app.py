import sys
import time
import warnings

from olimpo.analysis import analisar_kiq1, analisar_kiq2, analisar_regioes
from olimpo.compat import patch_pytrends_retry_compat
from olimpo.config import OUTPUT_DIR, ensure_output_dirs
from olimpo.reporting import gerar_relatorio
from olimpo.utils import banner, log

warnings.filterwarnings("ignore")


def main() -> None:
    ensure_output_dirs()
    banner()

    patch_pytrends_retry_compat()
    try:
        from pytrends.request import TrendReq
    except ImportError:
        log("pytrends não encontrado. Execute: pip install pytrends", "ERRO")
        sys.exit(1)

    log("Inicializando conexão com Google Trends...")
    pt = TrendReq(hl="pt-BR", tz=-180, timeout=(10, 30), retries=2, backoff_factor=0.5)
    log("Conexão iniciada.", "OK")

    print()
    log("━━━ MÓDULO 1: KIQ 1 — Comparativo de serviços ━━━")
    df_kiq1, medias, crescimento = analisar_kiq1(pt)

    time.sleep(5)

    print()
    log("━━━ MÓDULO 2: KIQ 2 — Sazonalidade ━━━")
    df_kiq2, sazonal, anual = analisar_kiq2(pt)

    time.sleep(5)

    print()
    log("━━━ MÓDULO 3: Distribuição regional ━━━")
    df_reg = analisar_regioes(pt)

    print()
    log("━━━ MÓDULO 4: Gerando relatório de insights ━━━")
    gerar_relatorio(df_kiq1, medias, crescimento, df_kiq2, sazonal, anual, df_reg)

    print()
    log(f"Análise concluída! Resultados em: ./{OUTPUT_DIR}/", "OK")
    log("Arquivos gerados: 5 gráficos PNG + 1 XLSX + 1 TXT", "OK")
    print()
