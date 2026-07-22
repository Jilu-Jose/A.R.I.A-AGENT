import httpx
from mcp.server.fastmcp import FastMCP
from typing import Optional, List, Dict, Any

# Create the MCP server
mcp = FastMCP("SemanticScholar")

BASE_URL = "https://api.semanticscholar.org/graph/v1"
# Adding some sensible default fields
DEFAULT_FIELDS = "title,authors,year,abstract,citationCount,url,tldr,referenceCount"

@mcp.tool()
async def search_papers(query: str, limit: int = 5) -> str:
    """
    Search for papers on Semantic Scholar.
    
    Args:
        query: The search query string.
        limit: Maximum number of results to return (default 5).
    """
    url = f"{BASE_URL}/paper/search"
    params = {
        "query": query,
        "limit": limit,
        "fields": DEFAULT_FIELDS
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            return str(data.get("data", []))
        except Exception as e:
            return f"Error searching papers: {str(e)}"

@mcp.tool()
async def get_paper_details(paper_id: str) -> str:
    """
    Get detailed information about a specific paper by its Semantic Scholar ID.
    
    Args:
        paper_id: The Semantic Scholar ID of the paper.
    """
    url = f"{BASE_URL}/paper/{paper_id}"
    params = {
        "fields": DEFAULT_FIELDS + ",citations,references"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=15.0)
            response.raise_for_status()
            return str(response.json())
        except Exception as e:
            return f"Error getting paper details: {str(e)}"

@mcp.tool()
async def get_recommendations(paper_ids: str, limit: int = 5) -> str:
    """
    Get recommended papers based on one or more seed paper IDs.
    
    Args:
        paper_ids: Comma-separated list of Semantic Scholar paper IDs.
        limit: Maximum number of recommendations to return (default 5).
    """
    first_id = paper_ids.split(",")[0].strip()
    url = f"{BASE_URL}/paper/{first_id}/recommendations"
    params = {
        "limit": limit,
        "fields": DEFAULT_FIELDS
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            return str(data.get("recommendedPapers", []))
        except Exception as e:
            return f"Error getting recommendations: {str(e)}"

if __name__ == "__main__":
    mcp.run()
