import os
import sys
import json
import asyncio
import requests as req
import loguru
from agent.mcp_client import call_mcp_tool

async def run_auto_annotator(file_path: str, user_id: int):
    loguru.logger.info(f"Running Auto-Annotator for file: {file_path}")
    
    try:
        # 1. Read file using Filesystem MCP (simulating reading the PDF text)
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(file_path)))
        read_result = await call_mcp_tool(
            "npx", 
            ["-y", "@modelcontextprotocol/server-filesystem", base_dir], 
            "read_file", 
            {"path": file_path}
        )
        content = read_result.content[0].text if read_result.content else ""
        if not content:
            loguru.logger.warning("Empty content read from file.")
            return False
            
    except Exception as e:
        loguru.logger.error(f"Failed to read file via MCP: {e}")
        return False
        
    # 2. Extract highlights using LLM
    prompt = f"""
    You are an Auto-Annotator agent. Given the following research paper text, extract 3 key highlights and any important figures/statistics mentioned.
    
    Paper Text (Truncated):
    {content[:15000]}
    
    Return ONLY valid JSON with this structure:
    {{
      "highlights": ["highlight 1", "highlight 2", "highlight 3"],
      "statistics": ["stat 1", "stat 2"]
    }}
    """
    
    nvidia_api_key = os.environ.get("NVIDIA_API_KEY", "")
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
        llm_output = resp.json()["choices"][0]["message"]["content"]
        
        if "```json" in llm_output:
            llm_output = llm_output.split("```json")[1].split("```")[0]
        elif "```" in llm_output:
            llm_output = llm_output.split("```")[1].split("```")[0]
            
        annotations = json.loads(llm_output.strip())
    except Exception as e:
        loguru.logger.error(f"LLM annotation failed: {e}")
        return False
        
    # 3. Save highlights to Memory MCP
    try:
        file_name = os.path.basename(file_path)
        await call_mcp_tool(
            "npx", 
            ["-y", "@modelcontextprotocol/server-memory"], 
            "create_entities", 
            {
                "entities": [
                    {
                        "name": f"Annotations for {file_name}",
                        "entityType": "Annotation",
                        "observations": annotations.get("highlights", []) + annotations.get("statistics", [])
                    }
                ]
            }
        )
        loguru.logger.info(f"Annotations saved to Memory MCP for {file_name}")
        return True
    except Exception as e:
        loguru.logger.error(f"Failed to save to Memory MCP: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 2:
        asyncio.run(run_auto_annotator(sys.argv[1], int(sys.argv[2])))
