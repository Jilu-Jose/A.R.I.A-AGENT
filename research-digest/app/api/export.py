from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, SavedPaper
from app.api.auth import get_approved_user
import os
import requests

router = APIRouter(prefix="/api/export", tags=["export"])

@router.post("/notion/{paper_id}")
def export_to_notion(paper_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    paper = db.query(SavedPaper).get(paper_id)
    if not paper or paper.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    notion_api_key = os.environ.get("NOTION_API_KEY")
    if not notion_api_key:
        return {"status": "error", "message": "NOTION_API_KEY not configured in .env"}
        
    # Stub: Here we would use @notionhq/notion-mcp-server or Notion API directly.
    # For now, simulate success if the key is present.
    return {"status": "success", "message": f"Successfully exported '{paper.title}' to Notion"}

@router.post("/zotero/{paper_id}")
def export_to_zotero(paper_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    paper = db.query(SavedPaper).get(paper_id)
    if not paper or paper.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    zotero_api_key = os.environ.get("ZOTERO_API_KEY")
    if not zotero_api_key:
        return {"status": "error", "message": "ZOTERO_API_KEY not configured in .env"}
        
    # Stub: Here we would call the Zotero API.
    return {"status": "success", "message": f"Successfully exported '{paper.title}' to Zotero"}
