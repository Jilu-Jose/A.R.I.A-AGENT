
import sys
import os
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
_app = None
def _get_app():
    global _app
    if _app is None:
        _app = create_app()
    return _app
def run_for_user(user_id):
    app = _get_app()
    try:
        with app.app_context():
            user = User.query.get(user_id)
            if not user:
                logger.error(f"User {user_id} not found")
                return None
            logger.info(f"=== Starting digest pipeline for user '{user.username}' (id={user_id}) ===")
            feeds = Feed.query.filter_by(user_id=user_id, is_active=True).all()
            if not feeds:
                logger.warning(f"User {user_id} has no active feeds")
                return None
            logger.info(f"Step 1: Found {len(feeds)} active feeds")
            documents = ingest_feeds(feeds, user_id)
            if not documents:
                logger.info(f"No new articles found for user {user_id}")
                return None
            logger.info(f"Step 2: Ingested {len(documents)} new articles")
            unique_docs = build_index(documents, user_id)
            if not unique_docs:
                logger.info(f"All articles were duplicates for user {user_id}")
                return None
            logger.info(f"Step 3: {len(unique_docs)} unique articles after deduplication")
            embeddings = get_embeddings_matrix(unique_docs)
            clusters = cluster_documents(unique_docs, embeddings)
            if not clusters:
                logger.warning(f"Clustering produced no results for user {user_id}")
                return None
            logger.info(f"Step 4: Created {len(clusters)} topic clusters")
            summaries = summarise_clusters(clusters)
            if not summaries:
                logger.warning(f"Summarisation produced no results for user {user_id}")
                return None
            logger.info(f"Step 5: Generated summaries for {len(summaries)} clusters")
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
    import argparse
    parser = argparse.ArgumentParser(description="Run the A.R.I.A digest pipeline for a user.")
    parser.add_argument("user_id", type=int, help="The user ID to run the pipeline for.")
    args = parser.parse_args()
    result = run_for_user(args.user_id)
    if result:
        print(f"✓ Digest #{result} created successfully.")
    else:
        print("✕ No digest was created. Check logs for details.")
