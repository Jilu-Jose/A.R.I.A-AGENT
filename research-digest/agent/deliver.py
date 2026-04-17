
import json
from datetime import datetime, timezone
from loguru import logger
from app.database import db
from app.models import Digest, DigestCluster
def deliver_digest(user_id, summaries):
    if not summaries:
        logger.info(f"No summaries to deliver for user {user_id}")
        return None
    try:
        now = datetime.now(timezone.utc)
        title = f"Your digest for {now.strftime('%B %d, %Y')}"
        total_articles = sum(len(s.get("top_urls", [])) for s in summaries)
        digest = Digest(
            user_id=user_id,
            title=title,
            article_count=total_articles,
            created_at=now,
        )
        db.session.add(digest)
        db.session.flush()                                       
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
