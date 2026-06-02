from datetime import datetime

import pandas as pd

from olimpo.config import (
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
)
from olimpo.utils import log


def gerar_relatorio(df_kiq1, medias, crescimento, df_kiq2, sazonal, anual, df_reg):
    ts = datetime.now().strftime("%d/%m/%Y %H:%M")
    sep = "─" * 72

    servico_maior_media = medias.idxmax()
    servico_maior_cresc = crescimento.idxmax()
    servico_menor_cresc = crescimento.idxmin()
    mes_pico = sazonal.idxmax()
    mes_vale = sazonal.idxmin()
    cresc_anual_pct = ((anual.iloc[-1] - anual.iloc[0]) / anual.iloc[0] * 100) if len(anual) > 1 else 0
    top_cidade = df_reg.index[0] if not df_reg.empty else "N/D"
    top_cidade_idx = df_reg.iloc[0, 0] if not df_reg.empty else 0

    relatorio = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        RELATÓRIO DE INTELIGÊNCIA COMPETITIVA — OLIMPO ESTÉTICA AUTOMOTIVA  ║
║        Gerado em: {ts:<52}║
║        Fonte: Google Trends (pytrends 4.9.2) | Região: MG                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

{sep}
  FERRAMENTA UTILIZADA
{sep}
  Nome       : Google Trends (via biblioteca pytrends)
  Versão     : pytrends 4.9.2
  Fornecedor : General Mills (open-source — licença MIT)
  URL        : https://trends.google.com.br
  Repositório: https://github.com/GeneralMills/pytrends
  Custo      : Gratuito (sem necessidade de chave de API ou cadastro)
  Tipo de dado: Volume relativo de buscas (índice 0–100), normalizado por região e período

{sep}
  PARÂMETROS CONFIGURADOS
{sep}

  [KIQ 1 — Comparativo de serviços]
  • Termos  : {', '.join(KIQ1_TERMOS)}
  • Região  : {KIQ1_GEO} (Minas Gerais)
  • Período : {KIQ1_TIMEFRAME} (últimos 12 meses)
  • Categoria: Todas | Tipo: Pesquisa na web

  [KIQ 2 — Sazonalidade]
  • Termos  : {', '.join(KIQ2_TERMOS)}
  • Região  : {KIQ2_GEO} (Minas Gerais)
  • Período : {KIQ2_TIMEFRAME} (últimos 5 anos)
  • Categoria: Todas | Tipo: Pesquisa na web

  [Distribuição regional]
  • Termo   : {REGION_TERMO}
  • Região  : {REGION_GEO} — resolução por cidade
  • Período : {REGION_TF}

{sep}
  RESULTADOS — KIQ 1
  "Quais serviços apresentam maior crescimento de demanda em BH?"
{sep}

  Médias de interesse (12 meses):
{''.join([f"    {'★' if k == servico_maior_media else ' '} {k.title():<35} → {v:.1f}/100\n" for k, v in medias.items()])}
  Variação de interesse (1ª vs 2ª metade do período):
{''.join([f"    {'▲' if v >= 0 else '▼'} {k.title():<35} → {v:+.0f}%\n" for k, v in crescimento.items()])}
  ► INSIGHT 1: O serviço de maior volume absoluto é "{servico_maior_media.title()}".
  ► INSIGHT 2: O serviço com maior crescimento recente é "{servico_maior_cresc.title()}"
    ({crescimento[servico_maior_cresc]:+.0f}% na segunda metade do período vs. primeira).
    Isso indica uma janela de oportunidade: investir nesse serviço pode capturar
    demanda crescente antes que os concorrentes se posicionem.
  ► INSIGHT 3: "{servico_menor_cresc.title()}" apresentou queda de interesse
    ({crescimento[servico_menor_cresc]:+.0f}%), sugerindo saturação ou migração
    de preferência do consumidor. Avaliar repricing ou bundling com outros serviços.

{sep}
  RESULTADOS — KIQ 2
  "Como a sazonalidade afeta a procura e quais períodos concentram maior demanda?"
{sep}

  Índice médio por mês (5 anos):
{''.join([f"    {'🔴' if m == mes_pico else ('🔵' if m == mes_vale else '  ')} {m:<6} → {v:.0f}\n" for m, v in sazonal.items()])}
  Evolução anual (índice médio):
{''.join([f"    {int(ano)}: {val:.0f}\n" for ano, val in anual.items()])}
  ► INSIGHT 4: O mês de pico de demanda é {mes_pico}, com índice {sazonal.max():.0f}/100.
    Recomenda-se acionamento máximo de freelancers e pré-agendamento a partir de outubro.
  ► INSIGHT 5: O mês de menor demanda é {mes_vale} (índice {sazonal.min():.0f}/100).
    Oportunidade para promoções de fidelização, treinamento e manutenção de equipamentos.
  ► INSIGHT 6: Há tendência de crescimento anual consistente de {cresc_anual_pct:.0f}% no período
    analisado, confirmando a expansão do mercado de estética automotiva em MG.

{sep}
  RESULTADOS — DISTRIBUIÇÃO REGIONAL
  "Quais regiões de MG concentram maior demanda?"
{sep}

  Top cidades por interesse em "{REGION_TERMO}":
{''.join([f"    {'★' if i == 0 else ' '} {idx:<40} → {row.iloc[0]:.0f}/100\n" for i, (idx, row) in enumerate(df_reg.iterrows())])}
  ► INSIGHT 7: {top_cidade} lidera com índice {top_cidade_idx:.0f}/100.
    A Olimpo deve avaliar se sua localização atual cobre essa demanda ou se
    há oportunidade de expansão / deslocamento até clientes nessa região.

{sep}
  RECOMENDAÇÕES ESTRATÉGICAS PARA O PROPRIETÁRIO (Arthur Aguiar)
{sep}

  1. PORTFÓLIO: Ampliar e divulgar os serviços com maior crescimento de demanda,
     especialmente vitrificação e PPF. Criar pacotes combinados para aumentar o
     ticket médio por atendimento.

  2. CAPACIDADE: Garantir disponibilidade de todos os freelancers em outubro,
     novembro e dezembro (período de pico). Confirmar agenda com antecedência mínima
     de 60 dias.

  3. RETENÇÃO: Usar os meses de menor demanda (junho/julho) para contatar clientes
     inativos com ofertas personalizadas de retorno (polimento de manutenção, lavagem
     técnica com desconto).

  4. POSICIONAMENTO LOCAL: Avaliar parcerias ou atendimento a domicílio nas regiões
     de BH com maior índice de interesse identificadas pela análise regional.

  5. MONITORAMENTO CONTÍNUO: Repetir essa análise mensalmente para identificar
     mudanças de tendência com antecedência. O ciclo recomendado é: coleta mensal
     → comparação com mês anterior → ajuste de agenda/portfólio.

{sep}
  LIMITES DA FERRAMENTA
{sep}

  • Os índices são relativos (0–100), não absolutos. Não é possível saber o volume
    exato de buscas, apenas a proporção entre períodos.
  • A ferramenta não distingue buscas informacionais ("o que é vitrificação") de
    buscas transacionais ("vitrificação automotiva BH preço"), podendo superestimar
    a demanda efetiva.
  • Granularidade geográfica limitada para subdivisões municipais (bairros).
  • Dados regionais de cidades menores têm margem de erro maior por baixo volume.
  • Não fornece dados de concorrentes específicos, preços ou perfil socioeconômico.

{sep}
  POTENCIAL DA FERRAMENTA
{sep}

  • Monitoramento de tendências antes que se tornem evidentes na queda de demanda.
  • Combinação com Google Meu Negócio (avaliações de concorrentes) e SEBRAE
    (dados setoriais) para análise triangulada.
  • Exportação em CSV para integração com planilhas de gestão financeira.
  • Uso gratuito, sem limite de consultas, acessível pelo smartphone.
  • Dados atualizados em tempo real, com histórico de até 2004.

{sep}
  ARQUIVOS GERADOS
{sep}

  graficos/kiq1_linha_temporal.png       → evolução temporal por serviço
  graficos/kiq1_comparativo_barras.png   → média e crescimento por serviço
  graficos/kiq2_sazonalidade.png         → padrão sazonal e evolução anual
  graficos/kiq2_heatmap.png              → mapa de calor mês × ano
  graficos/regioes_mg.png                → interesse por cidade em MG
  relatorio_olimpo_ic.xlsx               → dados brutos exportados
  relatorio_olimpo_ic.txt                → este relatório

══════════════════════════════════════════════════════════════════════════════
  PUC-MG | Engenharia de Software | Tecnologias da Informação e do Conhecimento
  Profa. Adriane Maria Arantes de Carvalho | 2026
══════════════════════════════════════════════════════════════════════════════
"""

    path_txt = f"{OUTPUT_DIR}/relatorio_olimpo_ic.txt"
    with open(path_txt, "w", encoding="utf-8") as f:
        f.write(relatorio)
    log(f"Relatório salvo: {path_txt}", "OK")

    path_xlsx = f"{OUTPUT_DIR}/relatorio_olimpo_ic.xlsx"
    with pd.ExcelWriter(path_xlsx, engine="openpyxl") as writer:
        df_kiq1.to_excel(writer, sheet_name="KIQ1_Servicos")
        medias.to_frame("media").to_excel(writer, sheet_name="KIQ1_Medias")
        crescimento.to_frame("variacao_pct").to_excel(writer, sheet_name="KIQ1_Crescimento")
        df_kiq2[["mes", "ano", "soma"]].to_excel(writer, sheet_name="KIQ2_Sazonal")
        sazonal.to_frame("indice_medio").to_excel(writer, sheet_name="KIQ2_PorMes")
        anual.to_frame("media_anual").to_excel(writer, sheet_name="KIQ2_PorAno")
        df_reg.to_excel(writer, sheet_name="Regioes_MG")
    log(f"Excel salvo: {path_xlsx}", "OK")

    print(relatorio)
    return relatorio
