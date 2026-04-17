
from loguru import logger
def _get_llm():
    from langchain_ollama import OllamaLLM
    import os
    base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    model = os.environ.get("OLLAMA_MODEL", "qwen2.5:0.5b")
    return OllamaLLM(
        model=model,
        base_url=base_url,
        temperature=0.5,
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
        prompt = f"Summarise these news snippets in 4 bullet points starting with '-':\n{snippets}"
        bullets = []
        try:
            response = llm.invoke(prompt)
            bullets = _parse_bullets(response)
        except Exception as e:
            logger.error(f"LLM summarisation failed for cluster '{topic}': {e}")
        if len(bullets) < 2:
            try:
                simple_prompt = f"List 4 key points from this text. Start each with '-':\n{snippets[:500]}"
                response = llm.invoke(simple_prompt)
                retry_bullets = _parse_bullets(response)
                if len(retry_bullets) >= 2:
                    bullets = retry_bullets
            except Exception as e:
                logger.error(f"Retry summarisation failed for cluster '{topic}': {e}")
        if not bullets:
            bullets = [f"- Research updates on {topic}"]
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
            "summary_bullets": bullets,
            "top_urls": top_urls,
            "top_titles": top_titles,
        })
        logger.debug(f"Generated {len(bullets)} bullets for '{topic}'")
    logger.info(f"Summarised {len(summaries)} clusters")
    return summaries
