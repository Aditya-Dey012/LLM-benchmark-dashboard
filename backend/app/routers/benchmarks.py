from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db, SessionLocal
from app.models import BenchmarkRun
from app.schemas import BenchmarkRunCreate, BenchmarkRunOut, BenchmarkSummaryOut
from app.services.benchmark_runner import run_benchmark

router = APIRouter()


async def _bg_run(run_id: str):
    db = SessionLocal()
    try:
        await run_benchmark(run_id, db)
    finally:
        db.close()


@router.post("/", response_model=BenchmarkRunOut, status_code=201)
async def create_benchmark(
    payload: BenchmarkRunCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    run = BenchmarkRun(
        name=payload.name,
        description=payload.description,
        prompt=payload.prompt,
        context=payload.context,
        task_type=payload.task_type,
        models=payload.models,
        status="pending",
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    background_tasks.add_task(_bg_run, run.id)
    return run


@router.get("/", response_model=List[BenchmarkSummaryOut])
def list_benchmarks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    runs = (
        db.query(BenchmarkRun)
        .order_by(BenchmarkRun.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        BenchmarkSummaryOut(
            id=r.id,
            name=r.name,
            task_type=r.task_type,
            models=r.models,
            status=r.status,
            created_at=r.created_at,
            completed_at=r.completed_at,
            result_count=len(r.results),
        )
        for r in runs
    ]


@router.get("/{run_id}", response_model=BenchmarkRunOut)
def get_benchmark(run_id: str, db: Session = Depends(get_db)):
    run = db.query(BenchmarkRun).filter(BenchmarkRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Not found")
    return run


@router.post("/{run_id}/cancel", response_model=BenchmarkRunOut)
def cancel_benchmark(run_id: str, db: Session = Depends(get_db)):
    run = db.query(BenchmarkRun).filter(BenchmarkRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Not found")
    if run.status not in ("pending", "running"):
        raise HTTPException(status_code=400, detail=f"Cannot cancel a run with status '{run.status}'")
    run.status = "cancelled"
    db.commit()
    db.refresh(run)
    return run


@router.delete("/{run_id}", status_code=204)
def delete_benchmark(run_id: str, db: Session = Depends(get_db)):
    run = db.query(BenchmarkRun).filter(BenchmarkRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(run)
    db.commit()
