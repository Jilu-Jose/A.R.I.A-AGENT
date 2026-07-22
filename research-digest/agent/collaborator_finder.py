import os
import sys
import json
import requests as req
from typing import TypedDict, List, Dict, Any, AsyncGenerator
from langgraph.graph import StateGraph, START, END
from agent.mcp_client import call_mcp_tool

class CollabState(TypedDict):
    topic: str
    github_context: str
    papers: List[Dict[str, Any]]
    prompt: str

async def collab_search_github_node(state: CollabState):
    topic = state["topic"]
    
    # We can try to use a Github MCP or Brave Search to find repos
    if not os.environ.get("BRAVE_API_KEY"):
        return {"github_context": "Brave API key not set."}
        
    try:
        result = await call_mcp_tool(
            "npx", 
            ["-y", "@modelcontextprotocol/server-brave-search"], 
            "brave_web_search", 
            {"query": f"site:github.com {topic} repository code", "count": 3}
        )
        return {"github_context": result.content[0].text if result.content else "No results found."}
    except Exception as e:
        return {"github_context": f"Search error: {e}"}

async def collab_search_papers_node(state: CollabState):
    topic = state["topic"]
    mcp_script = os.path.join(os.path.dirname(__file__), "mcp_semantic_scholar.py")
    try:
        result = await call_mcp_tool(
            sys.executable,
            [mcp_script],
            "search_papers",
            {"query": topic, "limit": 4}
        )
        raw_text = result.content[0].text if result.content else "[]"
        import ast
        papers = ast.literal_eval(raw_text)
        return {"papers": papers if isinstance(papers, list) else []}
    except Exception as e:
        return {"papers": []}

async def collab_build_prompt_node(state: CollabState):
    topic = state["topic"]
    github_context = state.get("github_context", "")
    papers = state.get("papers", [])
    
    authors_text = ""
    for idx, p in enumerate(papers):
        authors_text += f"\n[{idx+1}] {p.get('title', 'Unknown')} ({p.get('year', '')}) - Authors: {p.get('authors', [])}\n"
    
    prompt = f"""
    You are an expert Research Collaborator Finder. Based on the topic: "{topic}", identify potential collaborators, top authors, and key open-source contributors.
    
    Use the following GitHub context and Semantic Scholar highly-cited papers.
    
    Format your response in Markdown:
    - **Top Academic Authors**: List them and mention their key papers.
    - **Open-Source Contributors**: Based on the GitHub context, who is building tools in this space?
    - **Institutions**: Which labs or universities are leading this research?
    
    GitHub Context:
    {github_context}
    
    Recent Top Papers & Authors:
    {authors_text}
    """
    return {"prompt": prompt}

workflow = StateGraph(CollabState)
workflow.add_node("search_github", collab_search_github_node)
workflow.add_node("search_papers", collab_search_papers_node)
workflow.add_node("build_prompt", collab_build_prompt_node)

workflow.add_edge(START, "search_github")
workflow.add_edge(START, "search_papers")
workflow.add_edge(["search_github", "search_papers"], "build_prompt")
workflow.add_edge("build_prompt", END)

collab_finder_app = workflow.compile()

async def stream_collaborator_finder(topic: str) -> AsyncGenerator[str, None]:
    initial_state = {
        "topic": topic,
        "github_context": "",
        "papers": [],
        "prompt": ""
    }
    
    final_state = await collab_finder_app.ainvoke(initial_state)
    prompt = final_state.get("prompt", "")
    
    if not prompt:
        yield "Failed to generate collaborator prompt."
        return
        
    nvidia_api_key = os.environ.get("NVIDIA_API_KEY", "")
    url = f"{os.environ.get('NVIDIA_BASE_URL', 'https://integrate.api.nvidia.com/v1')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {nvidia_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": os.environ.get("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct"),
        "messages": [{"role": "user", "content": prompt}],
        "stream": True,
    }
    
    try:
        with req.post(url, headers=headers, json=payload, stream=True, timeout=120) as resp:
            for line in resp.iter_lines():
                if line:
                    decoded_line = line.decode("utf-8").strip()
                    if decoded_line.startswith("data: "):
                        data_str = decoded_line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            token = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if token:
                                yield token
                        except Exception:
                            continue
    except Exception as e:
        yield f" Error generating collaborator analysis: {str(e)}"
