import os
import sys
import json
import asyncio
import loguru
import requests as req
from agent.mcp_client import call_mcp_tool

def run_paper_analyst(paper_id: int, title: str, url: str):
    asyncio.run(async_run_paper_analyst(paper_id, title, url))
    
async def async_run_paper_analyst(paper_id: int, title: str, url: str):
    loguru.logger.info(f"Running Deep Paper Analyst for paper {paper_id}: {title}")
    
    mcp_script = os.path.join(os.path.dirname(__file__), "mcp_semantic_scholar.py")
    try:
        result = await call_mcp_tool(
            sys.executable,
            [mcp_script],
            "search_papers",
            {"query": title, "limit": 1}
        )
        raw_text = result.content[0].text if result.content else "[]"
        import ast
        papers = ast.literal_eval(raw_text)
        paper_info = papers[0] if papers else {}
    except Exception as e:
        loguru.logger.error(f"Semantic Scholar search failed: {e}")
        paper_info = {}
        
    abstract = paper_info.get("abstract", "")
    tldr = paper_info.get("tldr", "")
    
    if not abstract and os.environ.get("BRAVE_API_KEY"):
        try:
            result = await call_mcp_tool(
                "npx", 
                ["-y", "@modelcontextprotocol/server-brave-search"], 
                "brave_web_search", 
                {"query": f"{title} paper abstract", "count": 2}
            )
            abstract = result.content[0].text if result.content else ""
        except:
            pass

    prompt = f"""
    You are a Deep Paper Analyst Agent. Perform a comprehensive analysis of the following research paper.
    
    Title: {title}
    URL: {url}
    Abstract/Context: {abstract}
    TLDR: {tldr}
    
    Output a JSON object with the following keys:
    - "motivation": string (The problem they are trying to solve)
    - "methodology": string (How they solved it)
    - "results": string (Key findings)
    - "limitations": string (What's missing)
    - "impact_statement": string (So What? Plain language impact)
    - "highlights": list of 3 short string bullet points for margin notes
    
    Return ONLY valid JSON.
    """
    
    nvidia_api_key = os.environ.get("NVIDIA_API_KEY", "")
    if not nvidia_api_key:
        raise ValueError("NVIDIA_API_KEY is not set in environment variables.")
        
    api_url = f"{os.environ.get('NVIDIA_BASE_URL', 'https://integrate.api.nvidia.com/v1')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {nvidia_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": os.environ.get("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct"),
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2
    }
    
    try:
        resp = req.post(api_url, headers=headers, json=payload, timeout=60)
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
            
        analysis = json.loads(content.strip())
        
        out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "analyses", f"{paper_id}.json")
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "w") as f:
            json.dump(analysis, f, indent=2)
            
        loguru.logger.info(f"Analysis saved for paper {paper_id}")
        return analysis
    except Exception as e:
        loguru.logger.error(f"LLM analysis failed: {e}")
        raise Exception(f"Failed to analyze paper: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) > 3:
        run_paper_analyst(int(sys.argv[1]), sys.argv[2], sys.argv[3])
