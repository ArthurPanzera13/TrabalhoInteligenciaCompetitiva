from typing import Literal

from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    terms_kiq1: list[str] = Field(default_factory=lambda: [
        "polimento automotivo",
        "vitrificação automotiva",
        "higienização automotiva",
        "lavagem técnica carro",
        "ppf automotivo",
    ])
    kiq1_geo: str = "BR-MG"
    kiq1_timeframe: str = "today 12-m"

    terms_kiq2: list[str] = Field(default_factory=lambda: [
        "estética automotiva belo horizonte",
        "polimento carro bh",
        "lava rápido bh",
    ])
    kiq2_geo: str = "BR-MG"
    kiq2_timeframe: str = "today 5-y"

    region_term: str = "estética automotiva"
    region_geo: str = "BR-MG"
    region_timeframe: str = "today 12-m"


class AnalysisJobResponse(BaseModel):
    job_id: str
    status: Literal["queued", "running", "done", "error"]


class JobStatusResponse(BaseModel):
    job_id: str
    status: Literal["queued", "running", "done", "error"]
    progress: int
    message: str


class JobResultResponse(BaseModel):
    job_id: str
    status: Literal["queued", "running", "done", "error"]
    progress: int
    message: str
    result: dict | None
    error: str | None
