from sqlalchemy import Column, String, Float, Integer, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class BenchmarkRun(Base):
    __tablename__ = "benchmark_runs"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    prompt = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    task_type = Column(String(50), default="qa")
    models = Column(JSON, default=list)
    status = Column(String(20), default="pending")
    current_model = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    results = relationship("ModelResult", back_populates="run", cascade="all, delete-orphan")


class ModelResult(Base):
    __tablename__ = "model_results"

    id = Column(String, primary_key=True, default=_uuid)
    run_id = Column(String, ForeignKey("benchmark_runs.id"), nullable=False)
    model_name = Column(String(100), nullable=False)
    response = Column(Text, nullable=False, default="")
    latency_ms = Column(Float, default=0.0)
    tokens_used = Column(Integer, default=0)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    relevancy_score = Column(Float, nullable=True)
    faithfulness_score = Column(Float, nullable=True)
    hallucination_rate = Column(Float, nullable=True)
    cosine_score = Column(Float, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    run = relationship("BenchmarkRun", back_populates="results")
