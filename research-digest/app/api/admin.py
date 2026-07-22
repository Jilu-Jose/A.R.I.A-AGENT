from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.api.auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional
import os, shutil, uuid

router = APIRouter(prefix="/api/admin", tags=["admin"])

def get_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

class AdminUserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str | None
    payment_tier: int
    payment_status: bool
    is_approved: bool
    created_at: str
    verification_doc_path: str | None
    reason_for_access: str | None

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/request-access")
async def submit_access_request(
    role: str = Form(...),
    payment_tier: int = Form(...),
    reason: str = Form(...),
    gov_id: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.is_approved:
        raise HTTPException(status_code=400, detail="Already approved.")

    # Save the uploaded file
    ext = os.path.splitext(gov_id.filename)[-1] or ".pdf"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(UPLOAD_DIR, filename)
    with open(dest, "wb") as f:
        shutil.copyfileobj(gov_id.file, f)

    current_user.role = role
    current_user.payment_tier = payment_tier
    current_user.reason_for_access = reason
    current_user.verification_doc_path = dest
    db.commit()

    return {"message": "Access request submitted. The admin will review your request."}


@router.get("/users", response_model=List[AdminUserResponse])
def get_users(db: Session = Depends(get_db), admin_user: User = Depends(get_admin_user)):
    users = db.query(User).filter(User.is_admin == False).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "payment_tier": u.payment_tier,
            "payment_status": u.payment_status,
            "is_approved": u.is_approved,
            "created_at": u.created_at.isoformat(),
            "verification_doc_path": u.verification_doc_path,
            "reason_for_access": u.reason_for_access,
        } for u in users
    ]

@router.post("/users/{user_id}/approve")
def approve_user(user_id: int, db: Session = Depends(get_db), admin_user: User = Depends(get_admin_user)):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.payment_status:
        raise HTTPException(status_code=400, detail="Cannot approve. Payment has not been verified.")
        
    user.is_approved = True
    db.commit()
    return {"message": f"User {user.username} approved."}

@router.post("/users/{user_id}/reject")
def reject_user(user_id: int, db: Session = Depends(get_db), admin_user: User = Depends(get_admin_user)):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": f"User {user.username} rejected and deleted."}

@router.post("/users/{user_id}/toggle_payment")
def toggle_payment(user_id: int, db: Session = Depends(get_db), admin_user: User = Depends(get_admin_user)):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.payment_status = not user.payment_status
    if not user.payment_status:
        user.is_approved = False
        
    db.commit()
    status = "Verified" if user.payment_status else "Unverified"
    return {"message": f"Payment status marked as {status}.", "payment_status": user.payment_status}

@router.get("/users/{user_id}/document")
def get_user_document(user_id: int, db: Session = Depends(get_db), admin_user: User = Depends(get_admin_user)):
    from fastapi.responses import FileResponse
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.verification_doc_path or not os.path.exists(user.verification_doc_path):
        raise HTTPException(status_code=404, detail="No verification document found")
    return FileResponse(user.verification_doc_path, filename=f"verification_{user.username}{os.path.splitext(user.verification_doc_path)[1]}")

@router.get("/system")
def get_system_info(admin_user: User = Depends(get_admin_user)):
    agents = [
        {"id": "citation_network", "name": "Citation Network Agent", "status": "active", "description": "Builds citation graphs for context mapping."},
        {"id": "cluster", "name": "Clustering Agent", "status": "active", "description": "Groups related papers for digest topics."},
        {"id": "collaborator_finder", "name": "Collaborator Finder", "status": "active", "description": "Finds potential co-authors based on research overlap."},
        {"id": "gap_finder", "name": "Gap Finder", "status": "active", "description": "Identifies unexplored areas in literature."},
        {"id": "literature_review", "name": "Literature Reviewer", "status": "active", "description": "Generates comprehensive literature reviews."},
        {"id": "paper_analyst", "name": "Paper Analyst", "status": "active", "description": "Extracts key findings and methodology from papers."},
        {"id": "recommender", "name": "Recommender Agent", "status": "active", "description": "Suggests papers based on user reading history."},
        {"id": "summarise", "name": "Summarisation Agent", "status": "active", "description": "Summarizes individual papers or abstracts."},
        {"id": "trend_detector", "name": "Trend Detector", "status": "active", "description": "Detects emerging research topics across feeds."}
    ]
    mcp_servers = [
        {"id": "semantic_scholar", "name": "Semantic Scholar MCP Server", "status": "connected", "type": "Tool/Resource"},
        {"id": "notion", "name": "Notion MCP Server", "status": "stub", "type": "Export Destination"}
    ]
    return {"agents": agents, "mcp_servers": mcp_servers}
