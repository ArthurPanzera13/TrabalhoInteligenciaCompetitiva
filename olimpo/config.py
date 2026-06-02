import os

# Identidade visual da ferramenta
BRAND_COLOR = "#2E4057"
ACCENT_COLOR = "#F4A261"
SUCCESS_COLOR = "#2A9D8F"
WARN_COLOR = "#E76F51"

# Diretório de saída
OUTPUT_DIR = "relatorio_olimpo"

# KIQ 1 — Comparativo de serviços (últimos 12 meses, Minas Gerais)
KIQ1_TERMOS = [
    "polimento automotivo",
    "vitrificação automotiva",
    "higienização automotiva",
    "lavagem técnica carro",
    "ppf automotivo",
]
KIQ1_GEO = "BR-MG"
KIQ1_TIMEFRAME = "today 12-m"

# KIQ 2 — Sazonalidade (5 anos, Minas Gerais)
KIQ2_TERMOS = [
    "estética automotiva belo horizonte",
    "polimento carro bh",
    "lava rápido bh",
]
KIQ2_GEO = "BR-MG"
KIQ2_TIMEFRAME = "today 5-y"

# Consulta adicional — interesse por região dentro de MG
REGION_TERMO = "estética automotiva"
REGION_GEO = "BR-MG"
REGION_TF = "today 12-m"


def ensure_output_dirs() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(f"{OUTPUT_DIR}/graficos", exist_ok=True)
