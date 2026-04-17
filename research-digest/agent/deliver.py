"""
Delivery module for A.R.I.A.

Persists summarised clusters as Digest and DigestCluster records in the DB.
"""

import json
from datetime import datetime, timezone

from loguru import logger

from app.database import db
from app.models import Digest, DigestCluster


def deliver_digest(user_id, summaries):
    """Save a complete digest with its clusters to the database.

    Creates a Digest record titled with today's date and one DigestCluster
    record per summarised topic. All records are committed in a single
    transaction.

    Args:
        user_id: The integer ID of the user.
        summaries: A list of dicts from summarise_clusters(), each containing
                   'topic_name', 'summary_bullets', 'top_urls', 'top_titles'.

    Returns:
        The new digest ID on success, or None on failure.
    """
    if not summaries:
        logger.info(f"No summaries to deliver for user {user_id}")
        return None

    try:
        now = datetime.now(timezone.utc)
        title = f"Your digest for {now.strftime('%B %d, %Y')}"

        # Count total articles
        total_articles = sum(len(s.get("top_urls", [])) for s in summaries)

        digest = Digest(
            user_id=user_id,
            title=title,
            article_count=total_articles,
            created_at=now,
        )
        db.session.add(digest)
        db.session.flush()  # Get the digest.id before committing

        for summary in summaries:
            cluster = DigestCluster(
                digest_id=digest.id,
                topic_name=summary["topic_name"],
                summary="\n".join(summary["summary_bullets"]),
                article_urls=json.dumps(summary.get("top_urls", [])),
                article_titles=json.dumps(summary.get("top_titles", [])),
            )
            db.session.add(cluster)

        db.session.commit()
        logger.info(f"Delivered digest #{digest.id} for user {user_id} ({len(summaries)} clusters, {total_articles} articles)")
        return digest.id

    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to deliver digest for user {user_id}: {e}")
        return None
