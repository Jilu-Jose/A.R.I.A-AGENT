from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import get_db
from app.models import User, Digest, DigestCluster, SavedPaper, Feed
from app.api.auth import get_approved_user
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/overview")
def get_overview(db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    total_digests = db.query(Digest).filter_by(user_id=current_user.id).count()
    total_articles = db.query(func.sum(Digest.article_count)).filter(
        Digest.user_id == current_user.id
    ).scalar() or 0
    total_papers = db.query(SavedPaper).filter_by(user_id=current_user.id).count()
    total_feeds = db.query(Feed).filter_by(user_id=current_user.id).count()
    active_feeds = db.query(Feed).filter_by(user_id=current_user.id, is_active=True).count()

    # Latest digest info
    latest = db.query(Digest).filter_by(user_id=current_user.id).order_by(Digest.created_at.desc()).first()

    return {
        "total_digests": total_digests,
        "total_articles_processed": int(total_articles),
        "total_papers_saved": total_papers,
        "total_feeds": total_feeds,
        "active_feeds": active_feeds,
        "last_digest_date": latest.created_at.isoformat() if latest else None,
    }

@router.get("/digests-over-time")
def get_digests_over_time(db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    """Returns monthly digest counts for the past 12 months"""
    now = datetime.now(timezone.utc)
    result = []
    for i in range(11, -1, -1):
        # Proper calendar-aware month arithmetic
        target_month = now.month - i
        target_year = now.year
        while target_month <= 0:
            target_month += 12
            target_year -= 1
        month_start = datetime(target_year, target_month, 1, tzinfo=timezone.utc)
        # Calculate next month for the end boundary
        next_month = target_month + 1
        next_year = target_year
        if next_month > 12:
            next_month = 1
            next_year += 1
        month_end = datetime(next_year, next_month, 1, tzinfo=timezone.utc)

        count = db.query(Digest).filter(
            Digest.user_id == current_user.id,
            Digest.created_at >= month_start,
            Digest.created_at < month_end,
        ).count()
        articles = db.query(func.sum(Digest.article_count)).filter(
            Digest.user_id == current_user.id,
            Digest.created_at >= month_start,
            Digest.created_at < month_end,
        ).scalar() or 0
        result.append({
            "month": month_start.strftime("%b %Y"),
            "digests": count,
            "articles": int(articles),
        })
    return result

@router.get("/top-topics")
def get_top_topics(db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    """Returns top cluster topics by frequency across all digests"""
    # Get all clusters from user's digests
    user_digest_ids = [d.id for d in db.query(Digest.id).filter_by(user_id=current_user.id).all()]
    
    if not user_digest_ids:
        return []

    clusters = db.query(DigestCluster).filter(
        DigestCluster.digest_id.in_(user_digest_ids)
    ).all()

    # Count topics (simple keyword frequency from topic names)
    topic_counts: dict[str, int] = {}
    for c in clusters:
        name = c.topic_name.strip() if c.topic_name else "Unknown"
        topic_counts[name] = topic_counts.get(name, 0) + 1

    sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    return [{"topic": t, "count": c} for t, c in sorted_topics]

@router.get("/feed-activity")
def get_feed_activity(db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    """Returns feed status breakdown"""
    feeds = db.query(Feed).filter_by(user_id=current_user.id).all()
    active = sum(1 for f in feeds if f.is_active)
    inactive = len(feeds) - active
    return [
        {"label": "Active", "value": active},
        {"label": "Inactive", "value": inactive},
    ]
