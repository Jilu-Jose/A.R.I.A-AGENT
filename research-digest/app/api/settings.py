import os
import re
from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Feed
from app.api.auth import get_approved_user
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/settings", tags=["settings"])

class FeedResponse(BaseModel):
    id: int
    name: str
    url: str
    tags: str | None
    is_active: bool
    created_at: str

@router.get("/feeds", response_model=List[FeedResponse])
def get_feeds(db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    feeds = db.query(Feed).filter_by(user_id=current_user.id).order_by(Feed.created_at.desc()).all()
    return [
        {
            "id": f.id, 
            "name": f.name, 
            "url": f.url, 
            "tags": f.tags, 
            "is_active": f.is_active, 
            "created_at": f.created_at.isoformat()
        } for f in feeds
    ]

@router.post("/feeds")
def add_feed(
    name: str = Form(""), 
    url: str = Form(...), 
    tags: str = Form(""), 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_approved_user)
):
    url = url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Feed URL is required.")
        
    url_pattern = re.compile(r"^https?://[^\s/$.?#].[^\s]*$", re.IGNORECASE)
    if not url_pattern.match(url):
        raise HTTPException(status_code=400, detail="Please enter a valid URL.")
        
    feed = Feed(
        user_id=current_user.id,
        name=name.strip() or url,
        url=url,
        tags=tags.strip(),
    )
    db.add(feed)
    db.commit()
    return {"message": "Feed added successfully"}

@router.delete("/feeds/{feed_id}")
def delete_feed(feed_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    feed = db.query(Feed).filter_by(id=feed_id, user_id=current_user.id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    db.delete(feed)
    db.commit()
    return {"message": "Feed deleted"}

@router.put("/feeds/{feed_id}/toggle")
def toggle_feed(feed_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    feed = db.query(Feed).filter_by(id=feed_id, user_id=current_user.id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    feed.is_active = not feed.is_active
    db.commit()
    return {"message": "Feed toggled", "is_active": feed.is_active}

@router.get("/logs")
def view_logs(current_user: User = Depends(get_approved_user)):
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    log_path = os.path.join(base_dir, "logs", "engine.log")
    if not os.path.exists(log_path):
        return {"logs": "Engine logs not found or empty."}
    
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            log_content = f.read()
        return {"logs": log_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read logs: {e}")
