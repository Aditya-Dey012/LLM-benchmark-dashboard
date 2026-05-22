from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ModelResultOut(BaseModel):
    id: str
    run_id: str
    model_name: str
    response: str
    latency_ms: float
    tokens_used: int
    prompt_tokens: int
    completion_tokens: int
    relevancy_score: Optional[float] = None
    faithfulness_score: Optional[float] = None
    hallucination_rate: Optional[float] = None
    cosine_score: Optional[float] = None
    error: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BenchmarkRunCreate(BaseModel):
    name: str
    description: Optional[str] = None
    prompt: str
    context: Optional[str] = None
    task_type: str = "qa"
    models: List[str] = ["gemma:2b", "phi3:mini", "deepseek-coder:6.7b", "mistral:7b", "llama3.1:8b"]


class BenchmarkRunOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    prompt: str
    context: Optional[str] = None
    task_type: str
    models: List[str]
    status: str
    current_model: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    results: List[ModelResultOut] = []

    model_config = {"from_attributes": True}


class BenchmarkSummaryOut(BaseModel):
    id: str
    name: str
    task_type: str
    models: List[str]
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    result_count: int = 0

    model_config = {"from_attributes": True}


class ModelScoreOut(BaseModel):
    model: str
    avg_relevancy: float
    avg_latency: float
    count: int


class StatsOut(BaseModel):
    total_runs: int
    completed_runs: int
    total_results: int
    model_scores: List[ModelScoreOut]
