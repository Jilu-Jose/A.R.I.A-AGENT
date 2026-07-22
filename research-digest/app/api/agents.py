import os
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.api.auth import get_approved_user
from app.models import User
import loguru

router = APIRouter(prefix="/api/agents", tags=["agents"])

class PaperRequest(BaseModel):
    query: str
    paper_id: Optional[str] = "unknown"
    url: Optional[str] = ""

class ClusterRequest(BaseModel):
    topic: str
    
class GenericRequest(BaseModel):
    query: str

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
