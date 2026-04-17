"""
Summarisation module for A.R.I.A.

For each topic cluster, concatenates article snippets and prompts the local
Ollama LLM for a concise bullet-point summary. Avoids heavy chain-based
approaches that exceed the small model's context window.
"""

from loguru import logger


def _get_llm():
    """Create and return an OllamaLLM instance for summarisation.

    Returns:
        A LangChain OllamaLLM instance configured for qwen2.5:0.5b.
    """
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
    """Truncate text to a maximum number of words.

    Args:
        text: The input text string.
        max_words: Maximum number of words to keep.

    Returns:
        The truncated text string.
    """
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]) + "..."


def _parse_bullets(response):
    """Parse dash-prefixed bullet points from the LLM response.

    Args:
        response: The raw LLM response string.

    Returns:
        A list of bullet-point strings (each starting with '- ').
    """
    bullets = []
    for line in response.split("\n"):
        line = line.strip()
        if line.startswith("-") or line.startswith("•") or line.startswith("*"):
            clean = line.lstrip("-•* ").strip()
            if clean:
                bullets.append(f"- {clean}")
    return bullets


def summarise_clusters(clusters):
    """Generate bullet-point summaries for each topic cluster.

    For each cluster, concatenates the first 150 words of each article,
    then sends a single short prompt to the Ollama LLM asking for 4 bullet
    points. If the response has fewer than 2 bullets, retries once with
    a simpler prompt.

    Args:
        clusters: A list of dicts from cluster_documents(), each with
                  'cluster_id', 'topic_name', and 'documents'.

    Returns:
        A list of dicts, each containing:
        - topic_name (str): The cluster's topic name.
        - summary_bullets (list[str]): Bullet-point summary lines.
        - top_urls (list[str]): Up to 3 article URLs.
        - top_titles (list[str]): Up to 3 article titles.
    """
    if not clusters:
        return []

    llm = _get_llm()
    summaries = []

    for cluster in clusters:
        topic = cluster["topic_name"]
        docs = cluster["documents"]

        logger.debug(f"Summarising cluster '{topic}' ({len(docs)} docs)")

        # Build snippets
        snippets_parts = []
        for doc in docs[:5]:  # Limit articles per cluster
            snippet = _truncate_to_words(doc.page_content, 150)
            snippets_parts.append(snippet)

        snippets = "\n\n".join(snippets_parts)

        # First attempt
        prompt = f"Summarise these news snippets in 4 bullet points starting with '-':\n{snippets}"
        bullets = []

        try:
            response = llm.invoke(prompt)
            bullets = _parse_bullets(response)
        except Exception as e:
            logger.error(f"LLM summarisation failed for cluster '{topic}': {e}")

        # Retry with simpler prompt if insufficient bullets
        if len(bullets) < 2:
            try:
                simple_prompt = f"List 4 key points from this text. Start each with '-':\n{snippets[:500]}"
                response = llm.invoke(simple_prompt)
                retry_bullets = _parse_bullets(response)
                if len(retry_bullets) >= 2:
                    bullets = retry_bullets
            except Exception as e:
                logger.error(f"Retry summarisation failed for cluster '{topic}': {e}")

        # Fallback if still no bullets
        if not bullets:
            bullets = [f"- Research updates on {topic}"]

        # Collect top URLs and titles
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
