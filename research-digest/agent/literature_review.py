import os
import sys
import json
import requests as req
from typing import TypedDict, List, Dict, Any, AsyncGenerator
from langgraph.graph import StateGraph, START, END
from agent.mcp_client import call_mcp_tool

class LitReviewState(TypedDict):
    topic: str
    web_context: str
    papers: List[Dict[str, Any]]
    prompt: str

async def search_web_node(state: LitReviewState):
    topic = state["topic"]
    if not os.environ.get("BRAVE_API_KEY"):
        return {"web_context": "Brave API key not set. Skipped web search."}
        
    try:
        result = await call_mcp_tool(
            "npx", 
            ["-y", "@modelcontextprotocol/server-brave-search"], 
            "brave_web_search", 
            {"query": f"recent research advances {topic}", "count": 5}
        )
        return {"web_context": result.content[0].text if result.content else "No results found."}
    except Exception as e:
        return {"web_context": f"Search error: {e}"}

async def search_papers_node(state: LitReviewState):
    topic = state["topic"]
    mcp_script = os.path.join(os.path.dirname(__file__), "mcp_semantic_scholar.py")
    try:
        result = await call_mcp_tool(
            sys.executable,
            [mcp_script],
            "search_papers",
            {"query": topic[:100], "limit": 3}
        )
        raw_text = result.content[0].text if result.content else "[]"
        import ast
        papers = ast.literal_eval(raw_text)
        return {"papers": papers if isinstance(papers, list) else []}
    except Exception as e:
        return {"papers": []}

async def build_prompt_node(state: LitReviewState):
    topic = state["topic"]
    web_context = state.get("web_context", "")
    papers = state.get("papers", [])
    
    papers_text = ""
    for idx, p in enumerate(papers):
        papers_text += f"\n[{idx+1}] {p.get('title', 'Unknown')} ({p.get('year', '')})\n"
        papers_text += f"Abstract: {p.get('abstract', '')}\n"
    
    prompt = f"""
    You are an expert research analyst. Please write a comprehensive literature review on the topic: "{topic}".
    Use the following web search context and highly cited papers to synthesize your review.
    Format your response in Markdown with appropriate headings, bullet points, and citations (e.g., [1], [2]).
    Ensure the review discusses the current state of the art, methodologies, and potential gaps in the research.
    
    Web Context:
    {web_context}
    
    Papers Context:
    {papers_text}
    """
    return {"prompt": prompt}

# Define the graph
workflow = StateGraph(LitReviewState)
workflow.add_node("search_web", search_web_node)
workflow.add_node("search_papers", search_papers_node)
workflow.add_node("build_prompt", build_prompt_node)

workflow.add_edge(START, "search_web")
workflow.add_edge(START, "search_papers")
workflow.add_edge(["search_web", "search_papers"], "build_prompt")
workflow.add_edge("build_prompt", END)

lit_review_app = workflow.compile()

async def stream_literature_review(topic: str) -> AsyncGenerator[str, None]:
    """Runs the lit review graph and yields text tokens."""
    
    initial_state = {
        "topic": topic,
        "web_context": "",
        "papers": [],
        "prompt": ""
    }
    
    # Run graph to gather context
    final_state = await lit_review_app.ainvoke(initial_state)
    prompt = final_state.get("prompt", "")
    
    if not prompt:
        yield "Failed to generate review prompt."
        return
        
    # Stream from LLM
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
        yield f" Error generating review: {str(e)}"
