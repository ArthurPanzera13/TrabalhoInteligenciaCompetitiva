import numpy as np
import pandas as pd


def demo_kiq1() -> pd.DataFrame:
    datas = pd.date_range("2025-05-01", periods=52, freq="W")
    np.random.seed(42)
    dados = {
        "polimento automotivo": np.clip(70 + np.sin(np.linspace(0, 2 * np.pi, 52)) * 15 + np.random.normal(0, 3, 52), 40, 100),
        "vitrificação automotiva": np.clip(55 + np.linspace(0, 30, 52) + np.random.normal(0, 4, 52), 30, 100),
        "higienização automotiva": np.clip(60 + np.sin(np.linspace(0, 2 * np.pi, 52)) * 10 + np.random.normal(0, 3, 52), 35, 95),
        "lavagem técnica carro": np.clip(42 + np.random.normal(0, 5, 52), 25, 75),
        "ppf automotivo": np.clip(25 + np.linspace(0, 25, 52) + np.random.normal(0, 4, 52), 10, 75),
    }
    return pd.DataFrame(dados, index=datas)


def demo_kiq2() -> pd.DataFrame:
    datas = pd.date_range("2021-01-01", periods=260, freq="W")
    np.random.seed(7)
    base = np.linspace(35, 75, 260)
    saz = 20 * np.sin((np.arange(260) / 52) * 2 * np.pi - np.pi / 2)
    ruido = np.random.normal(0, 5, 260)
    soma = np.clip(base + saz + ruido, 10, 100)
    dados = {
        "estética automotiva belo horizonte": soma * 0.45,
        "polimento carro bh": soma * 0.35,
        "lava rápido bh": soma * 0.20,
    }
    return pd.DataFrame(dados, index=datas)


def demo_regioes() -> pd.DataFrame:
    dados = {
        "estética automotiva": [100, 87, 82, 76, 69, 65, 60, 54, 48, 41]
    }
    index = [
        "Contagem", "Belo Horizonte", "Betim", "Venda Nova",
        "Pampulha", "Barreiro", "Santa Luzia", "Ribeirão das Neves",
        "Ibirité", "Sabará",
    ]
    return pd.DataFrame(dados, index=index)
