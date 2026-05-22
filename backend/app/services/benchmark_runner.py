import asyncio
import logging
from datetime import datetime

from sqlalchemy.orm import Session

from app.models import BenchmarkRun, ModelResult
from app.services.ollama_client import OllamaClient
from app.services.evaluator import evaluate
from app.core.config import settings

logger = logging.getLogger(__name__)

# LangSmith tracing — only imported when tracing is enabled
if settings.LANGSMITH_TRACING and settings.LANGSMITH_API_KEY:
    from langsmith import traceable
else:
    def traceable(**_kwargs):
        def decorator(fn):
            return fn
        return decorator


@traceable(name="ollama-model-call", run_type="llm")
async def _run_one(client: OllamaClient, model: str, prompt: str, context) -> dict:
    return await client.generate(model, prompt, context)


@traceable(name="benchmark-run", run_type="chain")
async def run_benchmark(run_id: str, db: Session) -> None:
    run: BenchmarkRun = db.query(BenchmarkRun).filter(BenchmarkRun.id == run_id).first()
    if not run:
        return

    run.status = "running"
    db.commit()

    client = OllamaClient(base_url=settings.OLLAMA_BASE_URL)

    try:
        raw_results = []
        for m in run.models:
            db.refresh(run)
            if run.status == "cancelled":
                logger.info("Benchmark run %s was cancelled — discarding results", run_id)
                return
            logger.info("Running model %s for run %s", m, run_id)
            run.current_model = m
            db.commit()
            try:
                result = await _run_one(client, m, run.prompt, run.context)
            except Exception as exc:
                result = exc
            raw_results.append(result)

        run.current_model = None
        db.commit()

        for model_name, result in zip(run.models, raw_results):
            if isinstance(result, Exception):
                logger.error("Model %s failed: %s", model_name, repr(result))
                db_result = ModelResult(
                    run_id=run_id,
                    model_name=model_name,
                    response="",
                    error=str(result),
                )
            else:
                scores = evaluate(run.prompt, result["response"], run.context)
                db_result = ModelResult(
                    run_id=run_id,
                    model_name=model_name,
                    response=result["response"],
                    latency_ms=result["latency_ms"],
                    tokens_used=result["total_tokens"],
                    prompt_tokens=result["prompt_eval_count"],
                    completion_tokens=result["eval_count"],
                    relevancy_score=scores.get("relevancy_score"),
                    faithfulness_score=scores.get("faithfulness_score"),
                    hallucination_rate=scores.get("hallucination_rate"),
                    cosine_score=scores.get("cosine_score"),
                )
            db.add(db_result)

        run.status = "completed"
        run.completed_at = datetime.utcnow()

    except Exception as exc:
        logger.exception("Benchmark run %s failed: %s", run_id, exc)
        run.status = "failed"

    db.commit()
