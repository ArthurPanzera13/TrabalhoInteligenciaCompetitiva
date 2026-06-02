from __future__ import annotations

import asyncio
import uuid
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.job_store import JobStore
from backend.app.realtime_analysis import run_analysis
from backend.app.schemas import AnalysisJobResponse, AnalysisRequest, JobResultResponse, JobStatusResponse
from olimpo.config import ensure_output_dirs

app = FastAPI(title="Olimpo Trends API", version="0.1.0")
store = JobStore()
executor = ThreadPoolExecutor(max_workers=2)
listeners: dict[str, set[WebSocket]] = {}
main_loop: asyncio.AbstractEventLoop | None = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _push_progress(job_id: str, progress: int, message: str) -> None:
    store.update(job_id, progress=progress, message=message)
    sockets = listeners.get(job_id, set()).copy()
    if main_loop is None:
        return
    for ws in sockets:
        try:
            asyncio.run_coroutine_threadsafe(
                ws.send_json({"job_id": job_id, "progress": progress, "message": message}),
                loop=main_loop,
            )
        except Exception:
            continue


def _run_job(job_id: str, payload: dict) -> None:
    store.update(job_id, status="running", progress=1, message="Iniciando job")
    try:
        result = run_analysis(payload, lambda p, m: _push_progress(job_id, p, m))
        store.update(job_id, status="done", progress=100, message="Finalizado", result=result)
    except Exception as exc:
        store.update(job_id, status="error", error=str(exc), message="Falha durante execução")


@app.on_event("startup")
async def on_startup() -> None:
    global main_loop
    main_loop = asyncio.get_running_loop()
    ensure_output_dirs()
    app.mount("/artifacts", StaticFiles(directory="relatorio_olimpo"), name="artifacts")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/analysis/run", response_model=AnalysisJobResponse)
async def run_endpoint(payload: AnalysisRequest) -> AnalysisJobResponse:
    job_id = str(uuid.uuid4())
    store.create(job_id)
    loop = asyncio.get_running_loop()
    loop.run_in_executor(executor, _run_job, job_id, payload.model_dump())
    return AnalysisJobResponse(job_id=job_id, status="queued")


@app.get("/analysis/{job_id}", response_model=JobStatusResponse)
async def status_endpoint(job_id: str) -> JobStatusResponse:
    state = store.get(job_id)
    if not state:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    return JobStatusResponse(job_id=job_id, status=state.status, progress=state.progress, message=state.message)


@app.get("/analysis/{job_id}/result", response_model=JobResultResponse)
async def result_endpoint(job_id: str) -> JobResultResponse:
    state = store.get(job_id)
    if not state:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    return JobResultResponse(
        job_id=job_id,
        status=state.status,
        progress=state.progress,
        message=state.message,
        result=state.result,
        error=state.error,
    )


@app.websocket("/ws/analysis/{job_id}")
async def ws_endpoint(websocket: WebSocket, job_id: str) -> None:
    await websocket.accept()
    listeners.setdefault(job_id, set()).add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        listeners[job_id].discard(websocket)
