import os
from loguru import logger
from pydantic import BaseModel, Field

class DraftSummary(BaseModel):
    bullets: list[str] = Field(description="Exactly 4 bullet points summarizing the text.")

class Critique(BaseModel):
    is_valid: bool = Field(description="True if the summary has exactly 4 bullets and contains no hallucinations based on the source text, False otherwise.")
    feedback: str = Field(description="Feedback on what needs to be fixed if is_valid is False.")

def _get_llm(temperature=0.3):
    import os
    from langchain_openai import ChatOpenAI
    from loguru import logger
    
    base_url = os.environ.get("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
    model = os.environ.get("NVIDIA_MODEL", "moonshotai/kimi-k2.6")
    api_key = os.environ.get("NVIDIA_API_KEY", "")
    
    logger.info(f"Using NVIDIA NIM API: {model}")
    return ChatOpenAI(
        model=model,
        base_url=base_url,
        api_key=api_key,
        temperature=temperature,
    )

def _truncate_to_words(text, max_words=150):
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]) + "..."

def _parse_bullets(response):
    bullets = []
    for line in response.split("\n"):
        line = line.strip()
        if line.startswith("-") or line.startswith("•") or line.startswith("*"):
            clean = line.lstrip("-•* ").strip()
            if clean:
                bullets.append(f"- {clean}")
    return bullets

def summarise_clusters(clusters):

    if not clusters:
        return []
        
    llm = _get_llm()
    
    summaries = []
    
    for cluster in clusters:
        topic = cluster["topic_name"]
        docs = cluster["documents"]
        logger.debug(f"Summarising cluster '{topic}' ({len(docs)} docs)")
        
        snippets_parts = []
        for doc in docs[:5]:
            snippet = _truncate_to_words(doc.page_content, 150)
            snippets_parts.append(snippet)
        snippets = "\n\n".join(snippets_parts)
        
        prompt = f"Summarise the following text into exactly 4 bullet points.\n\n{snippets}"
        bullets = []
        try:
            response = llm.invoke(prompt)
            response_text = response if isinstance(response, str) else getattr(response, "content", str(response))
            bullets = _parse_bullets(response_text)
        except Exception as e:
            logger.error(f"LLM summarisation failed for cluster '{topic}': {e}")
        if len(bullets) < 2:
            try:
                simple_prompt = f"List 4 key points from this text. Start each with '-':\n{snippets[:500]}"
                response = llm.invoke(simple_prompt)
                response_text = response if isinstance(response, str) else getattr(response, "content", str(response))
                retry_bullets = _parse_bullets(response_text)
                if len(retry_bullets) >= 2:
                    bullets = retry_bullets
            except Exception as e:
                logger.error(f"Retry summarisation failed for cluster '{topic}': {e}")
        
        final_bullets = []
        for b in bullets:
            clean = b.lstrip("-•* ")
            final_bullets.append(f"- {clean}")
            
        if not final_bullets:
            final_bullets = [f"- Research updates on {topic}"]
            
        top_urls = []
        top_titles = []
        for doc in docs[:3]:
            url = doc.metadata.get("url", "")
            title = doc.metadata.get("title", "Untitled")
            if url:
                top_urls.append(url)
                top_titles.append(title)
                
        summaries.append({
            "topic_name": topic,
            "summary_bullets": final_bullets,
            "top_urls": top_urls,
            "top_titles": top_titles,
        })
        logger.info(f"Summarised '{topic}' with {len(final_bullets)} bullets")
        
    return summaries
