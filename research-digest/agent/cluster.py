
import numpy as np
from sklearn.cluster import KMeans
from loguru import logger
import os
def _get_llm():
    from langchain_ollama import OllamaLLM
    base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    model = os.environ.get("OLLAMA_MODEL", "qwen2.5:0.5b")
    return OllamaLLM(
        model=model,
        base_url=base_url,
        temperature=0.3,
    )
def _generate_topic_name(titles, llm):
    titles_text = "; ".join(titles[:5])                              
    prompt = f"Give a 3-word topic name for articles titled: {titles_text}. Reply with only the topic name."
    try:
        response = llm.invoke(prompt)
        name = response.strip().strip('"').strip("'").strip(".")
        name = name.split("\n")[0].strip()
        if len(name) > 50:
            name = name[:50].strip()
        if not name:
            name = "Miscellaneous Topics"
        return name
    except Exception as e:
        logger.warning(f"Failed to generate topic name: {e}")
        return "Research Updates"
def cluster_documents(documents, embeddings_matrix):
    if not documents or len(documents) == 0:
        return []
    n_docs = len(documents)
    if n_docs == 1:
        return [{
            "cluster_id": 0,
            "topic_name": documents[0].metadata.get("title", "Research Update")[:50],
            "documents": documents,
        }]
    n_clusters = min(5, n_docs)
    logger.info(f"Clustering {n_docs} documents into {n_clusters} clusters")
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(embeddings_matrix)
    cluster_groups = {}
    for idx, label in enumerate(labels):
        label = int(label)
        if label not in cluster_groups:
            cluster_groups[label] = []
        cluster_groups[label].append(documents[idx])
    llm = _get_llm()
    clusters = []
    for cluster_id, docs in sorted(cluster_groups.items()):
        titles = [doc.metadata.get("title", "Untitled") for doc in docs]
        topic_name = _generate_topic_name(titles, llm)
        clusters.append({
            "cluster_id": cluster_id,
            "topic_name": topic_name,
            "documents": docs,
        })
        logger.debug(f"Cluster {cluster_id}: '{topic_name}' ({len(docs)} docs)")
    logger.info(f"Generated {len(clusters)} topic clusters")
    return clusters
