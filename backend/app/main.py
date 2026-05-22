import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.database import engine, Base
from app.routers import benchmarks, models_router, results

setup_logging()

# LangSmith tracing — only if the user opted in
if settings.LANGSMITH_TRACING and settings.LANGSMITH_API_KEY:
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"] = settings.LANGSMITH_API_KEY
    os.environ["LANGCHAIN_PROJECT"] = settings.LANGSMITH_PROJECT

Base.metadata.create_all(bind=engine)

# Add current_model column if upgrading from older schema
from sqlalchemy import text
with engine.connect() as _conn:
    try:
        _conn.execute(text("ALTER TABLE benchmark_runs ADD COLUMN current_model VARCHAR(100)"))
        _conn.commit()
    except Exception:
        pass  # column already exists

app = FastAPI(
    title="LLM Benchmark Dashboard",
    description="Compare local LLMs on generation and RAG tasks",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(benchmarks.router, prefix="/api/benchmarks", tags=["Benchmarks"])
app.include_router(models_router.router, prefix="/api/models", tags=["Models"])
app.include_router(results.router, prefix="/api/results", tags=["Results"])


@app.get("/", tags=["Root"])
def root():
    return {"message": "LLM Benchmark Dashboard API", "docs": "/docs"}


@app.get("/health", tags=["Root"])
def health():
    return {"status": "ok"}
