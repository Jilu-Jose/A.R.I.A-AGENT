"""
Vector store module for A.R.I.A.

Manages per-user FAISS indices using sentence-transformers embeddings.
Handles building, persisting, merging, and deduplication via cosine similarity.
"""

import os

import numpy as np
from langchain.schema import Document
from loguru import logger

# Lazy-loaded globals to avoid slow import at module level
_embedder = None
_FAISS = None


def _get_embedder():
    """Lazily initialize and return the sentence-transformer embedding model.

    Uses all-MiniLM-L6-v2 for fast, high-quality local embeddings.

    Returns:
        A SentenceTransformer model instance.
    """
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading sentence-transformers model (all-MiniLM-L6-v2)...")
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Embedding model loaded.")
    return _embedder


def _get_faiss():
    """Lazily import the faiss module.

    Returns:
        The faiss module.
    """
    global _FAISS
    if _FAISS is None:
        import faiss
        _FAISS = faiss
    return _FAISS


def _get_index_path(user_id):
    """Return the directory path for a user's FAISS index.

    Args:
        user_id: The integer ID of the user.

    Returns:
        Absolute path to the user's FAISS index directory.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, "data", f"faiss_{user_id}")


def _embed_texts(texts):
    """Embed a list of text strings into dense vectors.

    Args:
        texts: A list of strings to embed.

    Returns:
        A numpy array of shape (len(texts), embedding_dim) with float32 dtype.
    """
    embedder = _get_embedder()
    embeddings = embedder.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    return embeddings.astype(np.float32)


def build_index(documents, user_id):
    """Build or update the FAISS index for a user with new documents.

    If the user already has a FAISS index, new documents are checked against
    existing embeddings using cosine similarity. Documents with similarity
    above 0.92 to any existing document are skipped (near-duplicates).

    New unique documents are added to the index which is then persisted.

    Args:
        documents: A list of LangChain Document objects.
        user_id: The integer ID of the user.

    Returns:
        A list of Document objects that were actually added (not duplicates).
    """
    if not documents:
        logger.info(f"No documents to index for user {user_id}")
        return []

    faiss = _get_faiss()
    index_path = _get_index_path(user_id)
    os.makedirs(index_path, exist_ok=True)

    # Embed new documents
    texts = [doc.page_content[:500] for doc in documents]  # Truncate for embedding
    new_embeddings = _embed_texts(texts)

    # Normalise for cosine similarity
    norms = np.linalg.norm(new_embeddings, axis=1, keepdims=True)
    norms[norms == 0] = 1
    new_embeddings_normed = new_embeddings / norms

    index_file = os.path.join(index_path, "index.faiss")
    existing_index = None
    unique_docs = []
    unique_embeddings = []

    # Load existing index if available
    if os.path.exists(index_file):
        try:
            existing_index = faiss.read_index(index_file)
            logger.debug(f"Loaded existing FAISS index with {existing_index.ntotal} vectors")
        except Exception as e:
            logger.warning(f"Could not load existing index for user {user_id}: {e}")
            existing_index = None

    if existing_index and existing_index.ntotal > 0:
        # Check each new embedding against the existing index
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

    # Build or extend index
    unique_matrix = np.array(unique_embeddings, dtype=np.float32)
    dim = unique_matrix.shape[1]

    if existing_index:
        existing_index.add(unique_matrix)
        faiss.write_index(existing_index, index_file)
    else:
        index = faiss.IndexFlatIP(dim)  # Inner product for cosine on normalised vectors
        index.add(unique_matrix)
        faiss.write_index(index, index_file)

    logger.info(f"Added {len(unique_docs)} unique documents to FAISS for user {user_id}")
    return unique_docs


def get_embeddings_matrix(documents):
    """Compute and return the embedding matrix for a list of documents.

    Args:
        documents: A list of LangChain Document objects.

    Returns:
        A numpy array of shape (len(documents), embedding_dim).
    """
    if not documents:
        return np.array([], dtype=np.float32)

    texts = [doc.page_content[:500] for doc in documents]
    return _embed_texts(texts)
