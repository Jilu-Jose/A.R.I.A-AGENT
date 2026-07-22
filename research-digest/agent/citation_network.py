import os
import sys
import json
import loguru
from typing import List, Dict, Any
from app.models import SavedPaper
from sqlalchemy.orm import Session
from agent.mcp_client import call_mcp_tool
import asyncio

async def async_build_citation_map(papers: List[SavedPaper]) -> Dict[str, Any]:
    """
    Builds a nodes and links graph of citations for the given papers.
    """
    nodes = []
    links = []
    
    mcp_script = os.path.join(os.path.dirname(__file__), "mcp_semantic_scholar.py")
    
    for paper in papers:
        # Add the saved paper as a node
        nodes.append({
            "id": str(paper.id),
            "label": paper.title[:30] + "..." if len(paper.title) > 30 else paper.title,
            "type": "saved",
            "url": paper.url
        })
        
        # We can simulate fetching the citation network here, or if the Semantic Scholar MCP 
        # had a get_citation_graph method, we'd call it.
        # Since it currently only has search_papers and get_recommendations, we will 
        # use search_papers to simulate finding related papers (references).
        try:
            result = await call_mcp_tool(
                sys.executable,
                [mcp_script],
                "search_papers",
                {"query": f"{paper.title} related papers citations", "limit": 3}
            )
            raw_text = result.content[0].text if result.content else "[]"
            import ast
            related_papers = ast.literal_eval(raw_text)
            
            for i, rel in enumerate(related_papers):
                rel_id = f"rel_{paper.id}_{i}"
                nodes.append({
                    "id": rel_id,
                    "label": rel.get("title", "Unknown")[:30] + "...",
                    "type": "related",
                    "url": rel.get("url", "")
                })
                # Add link from saved paper to related paper
                links.append({
                    "source": str(paper.id),
                    "target": rel_id,
                    "type": "citation"
                })
        except Exception as e:
            loguru.logger.error(f"Failed to fetch related papers for {paper.title}: {e}")
            
    return {"nodes": nodes, "links": links}

def build_citation_map(papers: List[SavedPaper]) -> Dict[str, Any]:
    return asyncio.run(async_build_citation_map(papers))
