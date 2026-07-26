from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, SavedPaper
from app.api.auth import get_approved_user
import os
import requests
from agent.mcp_client import call_mcp_tool

router = APIRouter(prefix="/api/export", tags=["export"])

@router.post("/notion/{paper_id}")
async def export_to_notion(paper_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    paper = db.query(SavedPaper).get(paper_id)
    if not paper or paper.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    notion_api_key = os.environ.get("NOTION_API_KEY")
    if not notion_api_key:
        return {"status": "error", "message": "NOTION_API_KEY not configured in .env"}
        
    try:
        # Use Notion MCP Server
        result = await call_mcp_tool(
            "npx",
            ["-y", "@notionhq/notion-mcp-server"],
            "create_page",
            {
                "parent_id": os.environ.get("NOTION_PARENT_PAGE_ID", ""),
                "title": paper.title,
                "content": f"URL: {paper.url}\n\nExported from A.R.I.A Research Digest."
            },
            env={"NOTION_API_KEY": notion_api_key}
        )
        return {"status": "success", "message": f"Successfully exported '{paper.title}' to Notion"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to export to Notion: {str(e)}"}

@router.post("/zotero/{paper_id}")
def export_to_zotero(paper_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    paper = db.query(SavedPaper).get(paper_id)
    if not paper or paper.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    zotero_api_key = os.environ.get("ZOTERO_API_KEY")
    zotero_user_id = os.environ.get("ZOTERO_USER_ID")
    if not zotero_api_key or not zotero_user_id:
        return {"status": "error", "message": "ZOTERO_API_KEY and ZOTERO_USER_ID not configured in .env"}
        
    try:
        headers = {
            "Zotero-API-Key": zotero_api_key,
            "Content-Type": "application/json"
        }
        item_data = [{
            "itemType": "journalArticle",
            "title": paper.title,
            "url": paper.url,
            "abstractNote": "Exported from A.R.I.A."
        }]
        resp = requests.post(
            f"https://api.zotero.org/users/{zotero_user_id}/items",
            headers=headers,
            json=item_data,
            timeout=10
        )
        resp.raise_for_status()
        return {"status": "success", "message": f"Successfully exported '{paper.title}' to Zotero"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to export to Zotero: {str(e)}"}
