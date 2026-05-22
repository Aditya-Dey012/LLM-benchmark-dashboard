from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BenchmarkRun, ModelResult
from app.schemas import StatsOut, ModelScoreOut

router = APIRouter()


@router.get("/stats", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    total_runs = db.query(BenchmarkRun).count()
    completed_runs = db.query(BenchmarkRun).filter(BenchmarkRun.status == "completed").count()
    total_results = db.query(ModelResult).count()

    rows = (
        db.query(
            ModelResult.model_name,
            func.avg(ModelResult.relevancy_score).label("avg_relevancy"),
            func.avg(ModelResult.latency_ms).label("avg_latency"),
            func.count(ModelResult.id).label("count"),
        )
        .group_by(ModelResult.model_name)
        .all()
    )

    model_scores = [
        ModelScoreOut(
            model=r.model_name,
            avg_relevancy=round(r.avg_relevancy or 0, 4),
            avg_latency=round(r.avg_latency or 0, 2),
            count=r.count,
        )
        for r in rows
    ]

    return StatsOut(
        total_runs=total_runs,
        completed_runs=completed_runs,
        total_results=total_results,
        model_scores=model_scores,
    )
