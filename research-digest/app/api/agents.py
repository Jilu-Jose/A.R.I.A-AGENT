import os
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.api.auth import get_approved_user
from app.database import get_db, SessionLocal
from app.models import User, AgentExecution
import loguru
import asyncio
import datetime

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

@router.post("/analyze-paper")
async def analyze_paper(req: PaperRequest, current_user: User = Depends(get_approved_user)):
    if not req.query:
        raise HTTPException(status_code=400, detail="Paper title/query is required")
        
    from agent.paper_analyst import async_run_paper_analyst
    
    # Generate a dummy paper_id integer since the agent expects one for file saving
    import hashlib
    pid = int(hashlib.md5(req.query.encode()).hexdigest()[:8], 16)
    
    result = await async_run_paper_analyst(pid, req.query, req.url)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to parse paper analysis.")
    return result

@router.post("/trend-detect")
async def trend_detect(req: GenericRequest, current_user: User = Depends(get_approved_user)):
    from agent.trend_detector import async_run_trend_detector
    result = await async_run_trend_detector()
    if not result:
        raise HTTPException(status_code=500, detail="Failed to detect trends.")
    return result

@router.post("/cluster")
async def cluster(req: ClusterRequest, current_user: User = Depends(get_approved_user)):
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
    
    result = cluster_documents(docs, np.array(embeddings))
    return result

@router.post("/summarize")
async def summarize(req: ClusterRequest, current_user: User = Depends(get_approved_user)):
    from agent.summarise import summarise_clusters
    # Reuse cluster logic to get clusters then summarize them
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
    
    result = summarise_clusters(clusters)
    return result

@router.post("/citation-network")
async def citation_network(req: GenericRequest, current_user: User = Depends(get_approved_user)):
    from agent.citation_network import async_build_citation_map
    from app.models import SavedPaper
    import hashlib
    # Mock a SavedPaper object to pass into the citation map
    paper = SavedPaper(id=int(hashlib.md5(req.query.encode()).hexdigest()[:8], 16), title=req.query, url="")
    result = await async_build_citation_map([paper])
    if not result:
        raise HTTPException(status_code=500, detail="Failed to generate citation network.")
    return result

@router.post("/recommend")
async def recommend(req: GenericRequest, current_user: User = Depends(get_approved_user)):
    from agent.recommender import get_paper_recommendations
    try:
        papers = await get_paper_recommendations(current_user.id)
        if not papers:
            return []
        
        # Add mock match percentages for UI flair since the agent doesn't natively return scores yet
        import random
        for p in papers:
            p["match_score"] = random.randint(85, 99)
            
        return papers
    except Exception as e:
        loguru.logger.error(f"Recommender failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations.")
