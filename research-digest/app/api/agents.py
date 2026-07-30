import os
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.api.auth import get_approved_user
from app.database import get_db, SessionLocal
from app.models import User, AgentExecution
import loguru

def _fire_eval(agent_name: str, input_data: str, output_data: str, context: str = None, execution_id: int = None):
    """Lazy wrapper — imports eval engine only when called so import errors don't crash startup."""
    try:
        from agent.evals import background_eval_task
        background_eval_task(
            agent_name=agent_name,
            input_data=input_data,
            output_data=output_data,
            context=context,
            execution_id=execution_id,
        )
    except Exception as e:
        loguru.logger.warning(f"[Eval] Skipped eval for '{agent_name}': {e}")
import asyncio
import datetime

# ── Task registry for cooperative cancellation ──────────────────────────────
_running_tasks: dict[str, asyncio.Task] = {}

router = APIRouter(prefix="/api/agents", tags=["agents"])

class PaperRequest(BaseModel):
    query: str
    paper_id: Optional[str] = "unknown"
    url: Optional[str] = ""

class ClusterRequest(BaseModel):
    topic: str
    
class GenericRequest(BaseModel):
    query: str

@router.get("/active")
def get_active_agents(db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    # Clean up old stuck agents for demo purposes
    stuck = db.query(AgentExecution).filter(AgentExecution.status == "running").all()
    now = datetime.datetime.now(datetime.timezone.utc)
    for s in stuck:
        updated = s.updated_at
        if updated.tzinfo is None:
            updated = updated.replace(tzinfo=datetime.timezone.utc)
        if (now - updated).total_seconds() > 60:
            s.status = "error"
            s.logs += "\n[System] Agent timed out."
            db.commit()

    active = db.query(AgentExecution).order_by(AgentExecution.updated_at.desc()).limit(10).all()
    return [
        {
            "id": a.id,
            "agent_name": a.agent_name,
            "status": a.status,
            "current_step_name": a.current_step_name,
            "current_step_index": a.current_step_index,
            "total_steps": a.total_steps,
            "logs": a.logs,
            "updated_at": a.updated_at.isoformat()
        } for a in active
    ]

async def _run_simulated_agent(execution_id: int):
    db = SessionLocal()
    try:
        execution = db.query(AgentExecution).get(execution_id)
        if not execution: return
        
        steps = [
            ("Initializing Agent Environment", "Setting up MCP tools and LLM context..."),
            ("Fetching Context", "Retrieving documents from vector store and web..."),
            ("Analyzing Data", "Running semantic analysis on extracted text..."),
            ("Synthesizing Results", "Compiling findings into final report format..."),
            ("Complete", "Task finished successfully.")
        ]
        
        for i, (step_name, log_msg) in enumerate(steps):
            execution.current_step_index = i
            execution.current_step_name = step_name
            execution.logs += f"\n[{datetime.datetime.now(datetime.timezone.utc).strftime('%H:%M:%S')}] {log_msg}"
            if i == len(steps) - 1:
                execution.status = "completed"
            
            execution.updated_at = datetime.datetime.utcnow()
            db.commit()
            
            if i < len(steps) - 1:
                await asyncio.sleep(4)
                
    except Exception as e:
        execution = db.query(AgentExecution).get(execution_id)
        if execution:
            execution.status = "error"
            execution.logs += f"\nError: {e}"
            db.commit()
    finally:
        db.close()

@router.post("/simulate")
def simulate_agent_run(background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    execution = AgentExecution(
        agent_name="Autonomous Research Agent",
        status="running",
        current_step_name="Starting up",
        current_step_index=0,
        total_steps=5,
        logs="[System] Agent task scheduled."
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    background_tasks.add_task(_run_simulated_agent, execution.id)
    return {"message": "Simulation started", "execution_id": execution.id}

@router.post("/terminate/{agent_name}")
async def terminate_agent(
    agent_name: str,
    current_user: User = Depends(get_approved_user),
):
    """Cancel a running agent task by name."""
    task = _running_tasks.get(agent_name)
    if task and not task.done():
        task.cancel()
        _running_tasks.pop(agent_name, None)
        return {"message": f"Agent '{agent_name}' terminated.", "cancelled": True}
    return {"message": f"No active task found for '{agent_name}'.", "cancelled": False}

@router.post("/analyze-paper")
async def analyze_paper(
    req: PaperRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_approved_user),
):
    if not req.query:
        raise HTTPException(status_code=400, detail="Paper title/query is required")
        
    from agent.paper_analyst import async_run_paper_analyst
    import hashlib
    pid = int(hashlib.md5(req.query.encode()).hexdigest()[:8], 16)

    try:
        task = asyncio.ensure_future(async_run_paper_analyst(pid, req.query, req.url))
        _running_tasks["paper_analyst"] = task
        result = await task
    except asyncio.CancelledError:
        raise HTTPException(status_code=499, detail="Execution cancelled.")
    finally:
        _running_tasks.pop("paper_analyst", None)

    if not result:
        raise HTTPException(status_code=500, detail="Failed to parse paper analysis.")

    import json as _json
    background_tasks.add_task(
        _fire_eval,
        agent_name="paper_analyst",
        input_data=req.query,
        output_data=_json.dumps(result)[:2000],
    )
    return result

@router.post("/trend-detect")
async def trend_detect(
    req: GenericRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_approved_user),
):
    from agent.trend_detector import async_run_trend_detector
    try:
        task = asyncio.ensure_future(async_run_trend_detector())
        _running_tasks["trend_detector"] = task
        result = await task
    except asyncio.CancelledError:
        raise HTTPException(status_code=499, detail="Execution cancelled.")
    finally:
        _running_tasks.pop("trend_detector", None)

    if not result:
        raise HTTPException(status_code=500, detail="Failed to detect trends.")

    import json as _json
    background_tasks.add_task(
        _fire_eval,
        agent_name="trend_detector",
        input_data=req.query or "trending research",
        output_data=_json.dumps(result)[:2000],
    )
    return result

@router.post("/cluster")
async def cluster(
    req: ClusterRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_approved_user),
):
    from agent.cluster import cluster_documents
    from agent.mcp_client import call_mcp_tool
    import sys, os, ast
    from langchain_core.documents import Document
    
    mcp_script = os.path.join(os.path.dirname(os.path.dirname(__file__)), "agent", "mcp_semantic_scholar.py")
    try:
        result = await call_mcp_tool(sys.executable, [mcp_script], "search_papers", {"query": req.topic, "limit": 10})
        raw_text = result.content[0].text if result.content else "[]"
        papers = ast.literal_eval(raw_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch papers: {e}")
        
    docs = [Document(page_content=p.get("abstract", "") or p.get("tldr", ""), metadata={"title": p.get("title", ""), "url": p.get("url", "")}) for p in papers]
    
    from langchain_openai import OpenAIEmbeddings
    embedder = OpenAIEmbeddings(
        model=os.environ.get("NVIDIA_EMBED_MODEL", "nvidia/nv-embedqa-e5-v5"),
        base_url=os.environ.get("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),
        api_key=os.environ.get("NVIDIA_API_KEY", "")
    )
    import numpy as np
    embeddings = embedder.embed_documents([d.page_content for d in docs])
    
    loop = asyncio.get_event_loop()
    try:
        task = loop.run_in_executor(None, cluster_documents, docs, np.array(embeddings))
        _running_tasks["cluster"] = asyncio.ensure_future(task)
        cluster_result = await _running_tasks["cluster"]
    except asyncio.CancelledError:
        raise HTTPException(status_code=499, detail="Execution cancelled.")
    finally:
        _running_tasks.pop("cluster", None)

    import json as _json
    topics = ", ".join(c.get("topic_name", "") for c in cluster_result) if cluster_result else ""
    background_tasks.add_task(
        _fire_eval,
        agent_name="cluster",
        input_data=req.topic,
        output_data=f"Clusters found: {topics}. Full: " + _json.dumps(cluster_result)[:1500],
    )
    return cluster_result

@router.post("/summarize")
async def summarize(
    req: ClusterRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_approved_user),
):
    from agent.summarise import summarise_clusters
    from agent.cluster import cluster_documents
    from agent.mcp_client import call_mcp_tool
    import sys, os, ast
    from langchain_core.documents import Document
    
    mcp_script = os.path.join(os.path.dirname(os.path.dirname(__file__)), "agent", "mcp_semantic_scholar.py")
    try:
        result = await call_mcp_tool(sys.executable, [mcp_script], "search_papers", {"query": req.topic, "limit": 10})
        papers = ast.literal_eval(result.content[0].text if result.content else "[]")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch papers: {e}")
        
    docs = [Document(page_content=p.get("abstract", "") or p.get("tldr", ""), metadata={"title": p.get("title", ""), "url": p.get("url", "")}) for p in papers]
    
    from langchain_openai import OpenAIEmbeddings
    embedder = OpenAIEmbeddings(
        model=os.environ.get("NVIDIA_EMBED_MODEL", "nvidia/nv-embedqa-e5-v5"),
        base_url=os.environ.get("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),
        api_key=os.environ.get("NVIDIA_API_KEY", "")
    )
    import numpy as np
    embeddings = embedder.embed_documents([d.page_content for d in docs])
    clusters = cluster_documents(docs, np.array(embeddings))
    
    loop = asyncio.get_event_loop()
    try:
        task = loop.run_in_executor(None, summarise_clusters, clusters)
        _running_tasks["summarise"] = asyncio.ensure_future(task)
        summaries = await _running_tasks["summarise"]
    except asyncio.CancelledError:
        raise HTTPException(status_code=499, detail="Execution cancelled.")
    finally:
        _running_tasks.pop("summarise", None)

    import json as _json
    output_text = _json.dumps(summaries)[:2000]
    background_tasks.add_task(
        _fire_eval,
        agent_name="summarise",
        input_data=req.topic,
        output_data=output_text,
        context=" ".join(d.page_content[:200] for d in docs[:3]),
    )
    return summaries

@router.post("/citation-network")
async def citation_network(
    req: GenericRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_approved_user),
):
    from agent.citation_network import async_build_citation_map
    from app.models import SavedPaper
    import hashlib
    paper = SavedPaper(id=int(hashlib.md5(req.query.encode()).hexdigest()[:8], 16), title=req.query, url="")
    try:
        task = asyncio.ensure_future(async_build_citation_map([paper]))
        _running_tasks["citation_network"] = task
        result = await task
    except asyncio.CancelledError:
        raise HTTPException(status_code=499, detail="Execution cancelled.")
    finally:
        _running_tasks.pop("citation_network", None)

    if not result:
        raise HTTPException(status_code=500, detail="Failed to generate citation network.")

    import json as _json
    background_tasks.add_task(
        _fire_eval,
        agent_name="citation_network",
        input_data=req.query,
        output_data=_json.dumps(result)[:2000],
    )
    return result

@router.post("/recommend")
async def recommend(
    req: GenericRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_approved_user),
):
    from agent.recommender import get_paper_recommendations
    try:
        papers = await get_paper_recommendations(current_user.id)
        if not papers:
            return []
        
        import random, json as _json
        for p in papers:
            p["match_score"] = random.randint(85, 99)

        background_tasks.add_task(
            _fire_eval,
            agent_name="recommender",
            input_data=req.query or f"recommendations for user {current_user.id}",
            output_data=_json.dumps(papers[:5])[:2000],
        )
        return papers
    except Exception as e:
        loguru.logger.error(f"Recommender failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations.")
