import os
import numpy as np
from langchain.schema import Document
from loguru import logger
_embedder = None
_FAISS = None
def _get_embedder():
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading sentence-transformers model (all-MiniLM-L6-v2)...")
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Embedding model loaded.")
    return _embedder
def _get_faiss():
    global _FAISS
    if _FAISS is None:
        import faiss
        _FAISS = faiss
    return _FAISS
def _get_index_path(user_id):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, "data", f"faiss_{user_id}")
def _embed_texts(texts):
    embedder = _get_embedder()
    embeddings = embedder.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    return embeddings.astype(np.float32)
def build_index(documents, user_id):
    if not documents:
        logger.info(f"No documents to index for user {user_id}")
        return []
    faiss = _get_faiss()
    index_path = _get_index_path(user_id)
    os.makedirs(index_path, exist_ok=True)
    texts = [doc.page_content[:500] for doc in documents]                          
    new_embeddings = _embed_texts(texts)
    norms = np.linalg.norm(new_embeddings, axis=1, keepdims=True)
    norms[norms == 0] = 1
    new_embeddings_normed = new_embeddings / norms
    index_file = os.path.join(index_path, "index.faiss")
    existing_index = None
    unique_docs = []
    unique_embeddings = []
    if os.path.exists(index_file):
        try:
            existing_index = faiss.read_index(index_file)
            logger.debug(f"Loaded existing FAISS index with {existing_index.ntotal} vectors")
        except Exception as e:
            logger.warning(f"Could not load existing index for user {user_id}: {e}")
            existing_index = None
    if existing_index and existing_index.ntotal > 0:
        for i, (doc, emb) in enumerate(zip(documents, new_embeddings_normed)):
            emb_query = emb.reshape(1, -1)
            scores, _ = existing_index.search(emb_query, min(1, existing_index.ntotal))
            max_sim = scores[0][0] if scores.size > 0 else 0.0
            if max_sim < 0.92:
                unique_docs.append(doc)
                unique_embeddings.append(new_embeddings_normed[i])
            else:
                logger.debug(f"Skipping near-duplicate (sim={max_sim:.3f}): {doc.metadata.get('title', '')[:50]}")
    else:
        unique_docs = list(documents)
        unique_embeddings = list(new_embeddings_normed)
    if not unique_embeddings:
        logger.info(f"All documents were near-duplicates for user {user_id}")
        return []
    unique_matrix = np.array(unique_embeddings, dtype=np.float32)
    dim = unique_matrix.shape[1]
    if existing_index:
        existing_index.add(unique_matrix)
        faiss.write_index(existing_index, index_file)
    else:
        index = faiss.IndexFlatIP(dim)                                                  
        index.add(unique_matrix)
        faiss.write_index(index, index_file)
    logger.info(f"Added {len(unique_docs)} unique documents to FAISS for user {user_id}")
    return unique_docs
def get_embeddings_matrix(documents):
    if not documents:
        return np.array([], dtype=np.float32)
    texts = [doc.page_content[:500] for doc in documents]
    return _embed_texts(texts)
