"""
Orchestration module for A.R.I.A.

Coordinates the full agent pipeline: ingest → vectorstore → cluster → summarise → deliver.
Provides a run_for_user() function that can be called by the scheduler or the web UI.
"""

import sys
import os

# Ensure the project root is on sys.path so all imports resolve correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from loguru import logger

from app import create_app
from app.database import db
from app.models import User, Feed
from agent.ingest import ingest_feeds
from agent.vectorstore import build_index, get_embeddings_matrix
from agent.cluster import cluster_documents
from agent.summarise import summarise_clusters
from agent.deliver import deliver_digest

# Create a module-level app for use in scheduler and CLI contexts
_app = None


def _get_app():
    """Return (and lazily create) the Flask application instance.

    Ensures the app is only created once and reused across calls.

    Returns:
        The Flask application instance.
    """
    global _app
    if _app is None:
        _app = create_app()
    return _app


def run_for_user(user_id):
    """Execute the full research digest pipeline for a single user.

    Steps:
        1. Fetch the user's active feeds from the database.
        2. Ingest new articles from those feeds.
        3. Build/update the FAISS vector index, deduplicating near-duplicates.
        4. Cluster the new articles by topic using KMeans.
        5. Summarise each cluster with the local Ollama LLM.
        6. Deliver the digest by saving it to the database.

    This function is safe to call from both the web UI (within an app context)
    and the scheduler (which provides its own app context).

    Args:
        user_id: The integer primary key of the user.

    Returns:
        The new digest ID on success, or None on failure.
    """
    app = _get_app()

    try:
        with app.app_context():
            # Step 0: Validate user exists
            user = User.query.get(user_id)
            if not user:
                logger.error(f"User {user_id} not found")
                return None

            logger.info(f"=== Starting digest pipeline for user '{user.username}' (id={user_id}) ===")

            # Step 1: Get active feeds
            feeds = Feed.query.filter_by(user_id=user_id, is_active=True).all()
            if not feeds:
                logger.warning(f"User {user_id} has no active feeds")
                return None

            logger.info(f"Step 1: Found {len(feeds)} active feeds")

            # Step 2: Ingest articles
            documents = ingest_feeds(feeds, user_id)
            if not documents:
                logger.info(f"No new articles found for user {user_id}")
                return None

            logger.info(f"Step 2: Ingested {len(documents)} new articles")

            # Step 3: Vector store - build index and deduplicate
            unique_docs = build_index(documents, user_id)
            if not unique_docs:
                logger.info(f"All articles were duplicates for user {user_id}")
                return None

            logger.info(f"Step 3: {len(unique_docs)} unique articles after deduplication")

            # Step 4: Compute embeddings and cluster
            embeddings = get_embeddings_matrix(unique_docs)
            clusters = cluster_documents(unique_docs, embeddings)
            if not clusters:
                logger.warning(f"Clustering produced no results for user {user_id}")
                return None

            logger.info(f"Step 4: Created {len(clusters)} topic clusters")

            # Step 5: Summarise each cluster
            summaries = summarise_clusters(clusters)
            if not summaries:
                logger.warning(f"Summarisation produced no results for user {user_id}")
                return None

            logger.info(f"Step 5: Generated summaries for {len(summaries)} clusters")

            # Step 6: Deliver - save to database
            digest_id = deliver_digest(user_id, summaries)

            if digest_id:
                logger.info(f"=== Digest #{digest_id} delivered for user '{user.username}' ===")
            else:
                logger.error(f"=== Digest delivery failed for user '{user.username}' ===")

            return digest_id

    except Exception as e:
        logger.exception(f"Pipeline failed for user {user_id}: {e}")
        return None


if __name__ == "__main__":
    # Allow running the pipeline manually for a specific user via CLI
    import argparse

    parser = argparse.ArgumentParser(description="Run the A.R.I.A digest pipeline for a user.")
    parser.add_argument("user_id", type=int, help="The user ID to run the pipeline for.")
    args = parser.parse_args()

    result = run_for_user(args.user_id)
    if result:
        print(f"✓ Digest #{result} created successfully.")
    else:
        print("✕ No digest was created. Check logs for details.")
