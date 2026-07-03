import os
import numpy as np
from langchain.schema import Document
from loguru import logger
from langchain_community.vectorstores import FAISS
from langchain.embeddings.base import Embeddings

_embeddings_model = None

class SimpleSTEmbeddings(Embeddings):
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer(model_name)

    def embed_documents(self, texts):
        return self.model.encode(texts, show_progress_bar=False, convert_to_numpy=True).tolist()

    def embed_query(self, text):
        return self.model.encode([text], show_progress_bar=False, convert_to_numpy=True)[0].tolist()

def _get_embeddings():
    global _embeddings_model
    if _embeddings_model is None:
        logger.info("Loading sentence-transformers model (all-MiniLM-L6-v2)...")
        _embeddings_model = SimpleSTEmbeddings("all-MiniLM-L6-v2")
        logger.info("Embedding model loaded.")
    return _embeddings_model

def _get_index_path(user_id):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, "data", f"faiss_{user_id}")

def build_index(documents, user_id):
    if not documents:
        logger.info(f"No documents to index for user {user_id}")
        return []

    index_path = _get_index_path(user_id)
    embeddings = _get_embeddings()
    
    existing_vectorstore = None
    if os.path.exists(os.path.join(index_path, "index.faiss")):
        try:
            existing_vectorstore = FAISS.load_local(
                index_path, 
                embeddings, 
                allow_dangerous_deserialization=True
            )
            logger.debug(f"Loaded existing FAISS index for user {user_id}")
        except Exception as e:
            logger.warning(f"Could not load existing index for user {user_id}: {e}")

    unique_docs = []
    if existing_vectorstore:
        for doc in documents:
            docs_and_scores = existing_vectorstore.similarity_search_with_score(doc.page_content, k=1)
            if docs_and_scores:
                _, score = docs_and_scores[0]
                if score > 0.2:
                    unique_docs.append(doc)
                else:
                    logger.debug(f"Skipping near-duplicate (L2={score:.3f}): {doc.metadata.get('title', '')[:50]}")
            else:
                unique_docs.append(doc)
    else:
        unique_docs = list(documents)

    if not unique_docs:
        logger.info(f"All documents were near-duplicates for user {user_id}")
        return []

    if existing_vectorstore:
        existing_vectorstore.add_documents(unique_docs)
        vectorstore = existing_vectorstore
    else:
        vectorstore = FAISS.from_documents(unique_docs, embeddings)

    os.makedirs(index_path, exist_ok=True)
    vectorstore.save_local(index_path)
    logger.info(f"Added {len(unique_docs)} unique documents to FAISS for user {user_id}")
    
    return unique_docs

def get_embeddings_matrix(documents):
    if not documents:
        return np.array([], dtype=np.float32)
    embeddings = _get_embeddings()
    texts = [doc.page_content[:500] for doc in documents]
    return np.array(embeddings.embed_documents(texts), dtype=np.float32)

def get_retriever(user_id):
    """Returns a LangChain retriever for the user's vector store, or None if it doesn't exist."""
    index_path = _get_index_path(user_id)
    if not os.path.exists(os.path.join(index_path, "index.faiss")):
        return None
    
    try:
        embeddings = _get_embeddings()
        vectorstore = FAISS.load_local(
            index_path, 
            embeddings, 
            allow_dangerous_deserialization=True
        )
        return vectorstore.as_retriever(search_kwargs={"k": 4})
    except Exception as e:
        logger.error(f"Failed to load retriever for user {user_id}: {e}")
        return None
