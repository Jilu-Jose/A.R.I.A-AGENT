"""
app/api/evals.py — REST API for reading and managing agent evaluation results.

Endpoints
---------
GET  /api/evals/results          — paginated list of eval rows, filterable by agent
GET  /api/evals/summary          — average score per agent + per metric
POST /api/evals/run/{agent_name} — manually trigger eval on latest completed run
DELETE /api/evals/results/{id}   — delete a specific eval row
"""

import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.auth import get_approved_user
from app.database import get_db
from app.models import User, AgentEvalResult, AgentExecution

router = APIRouter(prefix="/api/evals", tags=["evals"])


# ---------------------------------------------------------------------------
# GET /api/evals/results
# ---------------------------------------------------------------------------

@router.get("/results")
def get_eval_results(
    agent_name: Optional[str] = Query(None, description="Filter by agent name"),
    eval_type:  Optional[str] = Query(None, description="Filter by metric (faithfulness, relevance, …)"),
    limit:  int = Query(50, ge=1, le=200),
    offset: int = Query(0,  ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_approved_user),
):
    """Return paginated evaluation results, newest first."""
    q = db.query(AgentEvalResult)
    if agent_name:
        q = q.filter(AgentEvalResult.agent_name == agent_name)
    if eval_type:
        q = q.filter(AgentEvalResult.eval_type == eval_type)

    total = q.count()
    rows  = q.order_by(AgentEvalResult.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "results": [
            {
                "id":              r.id,
                "agent_name":      r.agent_name,
                "eval_type":       r.eval_type,
                "score":           r.score,
                "reasoning":       r.reasoning,
                "input_snapshot":  r.input_snapshot,
                "output_snapshot": r.output_snapshot,
                "created_at":      r.created_at.isoformat() if r.created_at else None,
                "execution_id":    r.execution_id,
            }
            for r in rows
        ],
    }


# ---------------------------------------------------------------------------
# GET /api/evals/summary
# ---------------------------------------------------------------------------

@router.get("/summary")
def get_eval_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_approved_user),
):
    """
    Return per-agent aggregate stats:
      - avg_score, min_score, max_score, total_evals
      - breakdown by eval_type
      - recent 10 scores (for sparkline)
    """
    # Aggregate per agent + metric
    rows = (
        db.query(
            AgentEvalResult.agent_name,
            AgentEvalResult.eval_type,
            func.avg(AgentEvalResult.score).label("avg_score"),
            func.min(AgentEvalResult.score).label("min_score"),
            func.max(AgentEvalResult.score).label("max_score"),
            func.count(AgentEvalResult.id).label("total"),
        )
        .group_by(AgentEvalResult.agent_name, AgentEvalResult.eval_type)
        .all()
    )

    # Group by agent
    agents: dict = {}
    for row in rows:
        a = row.agent_name
        if a not in agents:
            agents[a] = {"agent_name": a, "overall_avg": 0.0, "total_evals": 0, "metrics": {}}

        agents[a]["metrics"][row.eval_type] = {
            "avg_score": round(float(row.avg_score), 2),
            "min_score": row.min_score,
            "max_score": row.max_score,
            "total":     row.total,
        }
        agents[a]["total_evals"] += row.total

    # Compute overall average per agent
    for a_name, data in agents.items():
        all_avgs = [m["avg_score"] for m in data["metrics"].values()]
        data["overall_avg"] = round(sum(all_avgs) / len(all_avgs), 2) if all_avgs else 0.0

    # Recent scores per agent for sparklines (last 10 rows ordered by time)
    all_agents = list(agents.keys())
    for a_name in all_agents:
        recent = (
            db.query(AgentEvalResult.score, AgentEvalResult.created_at)
            .filter(AgentEvalResult.agent_name == a_name)
            .order_by(AgentEvalResult.created_at.desc())
            .limit(10)
            .all()
        )
        agents[a_name]["recent_scores"] = [r.score for r in reversed(recent)]

    return {"agents": list(agents.values())}


# ---------------------------------------------------------------------------
# GET /api/evals/agents  (list distinct agent names that have been evaluated)
# ---------------------------------------------------------------------------

@router.get("/agents")
def get_evaluated_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_approved_user),
):
    """Return a list of distinct agent names that have eval results."""
    rows = db.query(AgentEvalResult.agent_name).distinct().all()
    return [r.agent_name for r in rows]


# ---------------------------------------------------------------------------
# POST /api/evals/run/{agent_name}  (manual trigger on last completed run)
# ---------------------------------------------------------------------------

@router.post("/run/{agent_name}")
def trigger_manual_eval(
    agent_name: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_approved_user),
):
    """
    Find the last completed AgentExecution for the given agent and re-run
    the evaluation on its logs as a proxy for output data.
    """
    execution = (
        db.query(AgentExecution)
        .filter(
            AgentExecution.agent_name.ilike(f"%{agent_name}%"),
            AgentExecution.status == "completed",
        )
        .order_by(AgentExecution.updated_at.desc())
        .first()
    )

    if not execution:
        raise HTTPException(
            status_code=404,
            detail=f"No completed execution found for agent '{agent_name}'.",
        )

    from agent.evals import background_eval_task

    background_tasks.add_task(
        background_eval_task,
        agent_name=agent_name,
        input_data=f"Manual eval trigger for agent: {agent_name}",
        output_data=execution.logs or "(no logs)",
        context=None,
        execution_id=execution.id,
    )

    return {
        "message": f"Evaluation for '{agent_name}' started in background.",
        "execution_id": execution.id,
    }


# ---------------------------------------------------------------------------
# DELETE /api/evals/results/{id}
# ---------------------------------------------------------------------------

@router.delete("/results/{result_id}")
def delete_eval_result(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_approved_user),
):
    """Delete a specific eval result row by id."""
    row = db.query(AgentEvalResult).get(result_id)
    if not row:
        raise HTTPException(status_code=404, detail="Eval result not found.")
    db.delete(row)
    db.commit()
    return {"message": f"Eval result {result_id} deleted."}
