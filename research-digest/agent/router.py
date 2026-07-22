import os
import requests as req
import loguru

def route_query(query: str) -> str:
    """
    Evaluates a natural language query and routes it to the appropriate specialized agent.
    Returns one of: 'REVIEW', 'GAP', 'COLLABORATORS', or 'CHAT'.
    """
    nvidia_api_key = os.environ.get("NVIDIA_API_KEY", "")
    if not nvidia_api_key:
        return "CHAT"
        
    url = f"{os.environ.get('NVIDIA_BASE_URL', 'https://integrate.api.nvidia.com/v1')}/chat/completions"
    
    prompt = f"""
    You are an intelligent routing supervisor for a research assistant.
    Your job is to analyze the user's query and categorize it into exactly one of the following four categories:
    
    1. REVIEW: The user is asking for a literature review, state-of-the-art summary, or comprehensive synthesis on a broad topic.
       (e.g., "Write a literature review on diffusion models", "What is the latest research in protein folding?")
    2. GAP: The user is asking for research gaps, limitations, open questions, or contradictions in a field.
       (e.g., "What are the limitations of current LLM reasoning?", "Find research gaps in quantum computing")
    3. COLLABORATORS: The user is looking for top researchers, authors, institutions, or open-source contributors for a topic.
       (e.g., "Who are the top authors in NLP?", "Find me collaborators for a project on graph neural networks")
    4. CHAT: The user is asking a specific question, asking for an explanation, or having a general conversation that doesn't fit the above.
       (e.g., "Explain what an embedding is", "What did paper X say about Y?", "Hello")
       
    User Query: "{query}"
    
    Output ONLY the category name in all caps (REVIEW, GAP, COLLABORATORS, or CHAT). Do not include any other text.
    """
    
    headers = {
        "Authorization": f"Bearer {nvidia_api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": os.environ.get("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct"),
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.0,
        "max_tokens": 10
    }
    
    try:
        resp = req.post(url, headers=headers, json=payload, timeout=10)
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"].strip().upper()
        
        # Clean up in case the LLM was verbose
        for category in ["REVIEW", "GAP", "COLLABORATORS", "CHAT"]:
            if category in content:
                loguru.logger.info(f"Routed query '{query}' to {category}")
                return category
                
    except Exception as e:
        loguru.logger.error(f"Semantic routing failed: {e}. Falling back to CHAT.")
        
    return "CHAT"
