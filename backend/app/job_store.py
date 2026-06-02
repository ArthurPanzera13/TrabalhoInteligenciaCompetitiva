from dataclasses import dataclass, field
from threading import Lock


@dataclass
class JobState:
    status: str = "queued"
    progress: int = 0
    message: str = "Aguardando execução"
    result: dict | None = None
    error: str | None = None


@dataclass
class JobStore:
    jobs: dict[str, JobState] = field(default_factory=dict)
    lock: Lock = field(default_factory=Lock)

    def create(self, job_id: str) -> JobState:
        with self.lock:
            state = JobState()
            self.jobs[job_id] = state
            return state

    def get(self, job_id: str) -> JobState | None:
        with self.lock:
            return self.jobs.get(job_id)

    def update(self, job_id: str, **kwargs) -> JobState | None:
        with self.lock:
            state = self.jobs.get(job_id)
            if not state:
                return None
            for key, value in kwargs.items():
                setattr(state, key, value)
            return state
