import asyncio
import json
from typing import TypedDict, List, Dict, Any, Annotated
from langgraph.graph import StateGraph, START, END
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import sys
import os

from app.database import SessionLocal
from app.models import SavedPaper, User
from agent.mcp_client import call_mcp_tool

class RecommenderState(TypedDict):
    user_id: int
    memory_data: Dict[str, Any]
    bootstrap_needed: bool
    saved_papers: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]

async def fetch_memory_node(state: RecommenderState):
    user_id = state["user_id"]
    try:
        # Use npx memory server
        result = await call_mcp_tool(
            "npx", 
            ["-y", "@modelcontextprotocol/server-memory"], 
            "read_graph", 
            {}
        )
        # Parse memory result
        # For a real multi-user app, we'd filter entities by user_id, 
        # but for this prototype, we'll just read the graph.
        
        # If the graph is effectively empty or lacks user interests, we bootstrap
        memory_content = result.content[0].text if result.content else "{}"
        memory_data = json.loads(memory_content) if memory_content.strip().startswith("{") else {"entities": []}
        
        # very simple check if empty
        bootstrap = True if not memory_data or not memory_data.get("entities") else False
            
        return {"memory_data": memory_data, "bootstrap_needed": bootstrap}
    except Exception as e:
        print(f"Memory MCP error: {e}")
        return {"memory_data": {}, "bootstrap_needed": True}

async def bootstrap_memory_node(state: RecommenderState):
    user_id = state["user_id"]
    bootstrap = state.get("bootstrap_needed", False)
    saved_papers_list = []
    
    if bootstrap:
        # Fetch papers from DB
        db = SessionLocal()
        try:
            papers = db.query(SavedPaper).filter(SavedPaper.user_id == user_id).limit(10).all()
            for p in papers:
                saved_papers_list.append({"title": p.title, "url": p.url})
                
                # We could call memory MCP 'create_entities' here to store them
                try:
                    await call_mcp_tool(
                        "npx", 
                        ["-y", "@modelcontextprotocol/server-memory"], 
                        "create_entities", 
                        {
                            "entities": [
                                {
                                    "name": p.title,
                                    "entityType": "Paper",
                                    "observations": ["Saved by user"]
                                }
                            ]
                        }
                    )
                except Exception as e:
                    print(f"Failed to save to memory MCP: {e}")
        finally:
            db.close()
            
    return {"saved_papers": saved_papers_list}

async def recommend_node(state: RecommenderState):
    # Use Semantic Scholar MCP
    user_id = state["user_id"]
    memory_data = state.get("memory_data", {})
    saved_papers = state.get("saved_papers", [])
    
    # Simple logic: If we have saved papers, use the first one's title to search, 
    # OR if we had memory, use an entity name.
    query = "machine learning"
    if saved_papers:
        query = saved_papers[0]["title"]
    elif memory_data.get("entities"):
        query = memory_data["entities"][0].get("name", "artificial intelligence")
        
    mcp_script = os.path.join(os.path.dirname(__file__), "mcp_semantic_scholar.py")
    
    try:
        # Call search_papers on Semantic Scholar MCP
        result = await call_mcp_tool(
            sys.executable,
            [mcp_script],
            "search_papers",
            {"query": query[:100], "limit": 5}
        )
        
        # result.content is a list of TextContent objects
        raw_text = result.content[0].text if result.content else "[]"
        # eval string representation of list to actual list
        import ast
        try:
            papers = ast.literal_eval(raw_text)
        except:
            papers = []
            
        return {"recommendations": papers}
    except Exception as e:
        print(f"Semantic Scholar MCP error: {e}")
        return {"recommendations": []}

# Define the graph
workflow = StateGraph(RecommenderState)
workflow.add_node("fetch_memory", fetch_memory_node)
workflow.add_node("bootstrap_memory", bootstrap_memory_node)
workflow.add_node("recommend", recommend_node)

workflow.add_edge(START, "fetch_memory")
workflow.add_edge("fetch_memory", "bootstrap_memory")
workflow.add_edge("bootstrap_memory", "recommend")
workflow.add_edge("recommend", END)

recommender_app = workflow.compile()

async def get_paper_recommendations(user_id: int):
    """Entry point for the API"""
    initial_state = {
        "user_id": user_id,
        "memory_data": {},
        "bootstrap_needed": False,
        "saved_papers": [],
        "recommendations": []
    }
    
    final_state = await recommender_app.ainvoke(initial_state)
    return final_state.get("recommendations", [])
