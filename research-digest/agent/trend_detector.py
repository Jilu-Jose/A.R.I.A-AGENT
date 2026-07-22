import os
import json
import asyncio
import requests as req
from agent.mcp_client import call_mcp_tool

def run_trend_detector():
    asyncio.run(async_run_trend_detector())

async def async_run_trend_detector():
    print("Starting Trend Detector Agent...")
    if not os.environ.get("BRAVE_API_KEY"):
        raise ValueError("BRAVE_API_KEY not set in environment variables.")
        
    # 1. Query Brave Search
    try:
        print("Querying Brave Search MCP...")
        result = await call_mcp_tool(
            "npx", 
            ["-y", "@modelcontextprotocol/server-brave-search"], 
            "brave_web_search", 
            {"query": "trending AI and Machine Learning research topics papers this week", "count": 10}
        )
        search_text = result.content[0].text if result.content else ""
    except Exception as e:
        print(f"Brave Search MCP failed: {e}")
        raise Exception(f"Brave Search failed: {str(e)}")
        
    # 2. Synthesize with LLM
    print("Synthesizing trending topics with LLM...")
    nvidia_api_key = os.environ.get("NVIDIA_API_KEY", "")
    if not nvidia_api_key:
        raise ValueError("NVIDIA_API_KEY not set in environment variables.")
        
    url = f"{os.environ.get('NVIDIA_BASE_URL', 'https://integrate.api.nvidia.com/v1')}/chat/completions"
    
    prompt = f"""
    Based on the following web search results about trending AI/ML research topics, 
    generate a JSON list of 5-8 trending topics.
    Format exactly as a valid JSON array of objects with keys:
    "tag" (short alphanumeric string, no spaces, like "Agents"), 
    "label" (human readable like "Autonomous Agents"),
    "category" (an arxiv category code like "cs.AI", "cs.LG", "cs.CV", "cs.CL", "cs.RO", "cs.CR")
    
    Return ONLY the raw JSON array.
    
    Search Results:
    {search_text}
    """
    
    headers = {
        "Authorization": f"Bearer {nvidia_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": os.environ.get("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct"),
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }
    
    try:
        resp = req.post(url, headers=headers, json=payload, timeout=60)
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        
        # Parse JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
            
        topics = json.loads(content.strip())
        
        # 3. Save to data/trending_topics.json
        out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "trending_topics.json")
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "w") as f:
            json.dump(topics, f, indent=2)
            
        print(f"Successfully saved {len(topics)} trending topics.")
        return topics
    except Exception as e:
        print(f"LLM synthesis failed: {e}")
        raise Exception(f"Failed to detect trends: {str(e)}")

if __name__ == "__main__":
    run_trend_detector()
