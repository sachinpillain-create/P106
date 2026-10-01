"""
SIH26106 — AI-Powered Email Threat Detection, GeoLocation and Forensic
Intelligence Platform. FastAPI application entrypoint.

Run with:
    uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000

Then open http://localhost:8000/docs for the interactive API, or open
frontend/index.html in a browser for the dashboard.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from backend.db.database import init_db
from backend.api.routes import router as api_router

app = FastAPI(
    title="SIH26106 Forensic Intelligence Platform",
    description="Hybrid CPU/GPU email threat detection and forensic analysis prototype",
    version="0.1.0",
)

# Local-only prototype — permissive CORS for the bundled static frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/app", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "SIH26106 backend is running. Visit /docs for the API, or /app for the dashboard.",
    }


@app.get("/api/health")
def health():
    """
    Reports which compute device the ML stage will actually use — lets the
    UI show 'GPU-accelerated' vs 'CPU fallback' per PRD Section 15/23.
    """
    gpu_available = False
    gpu_name = None
    try:
        import torch
        gpu_available = torch.cuda.is_available()
        if gpu_available:
            gpu_name = torch.cuda.get_device_name(0)
    except ImportError:
        pass  # torch not installed yet — Stage A (CPU baseline) still works

    from backend.ml.inference import BASELINE_MODEL_PATH
    import os as _os

    return {
        "status": "ok",
        "cuda_available": gpu_available,
        "gpu_name": gpu_name,
        "baseline_model_trained": _os.path.exists(BASELINE_MODEL_PATH),
    }
