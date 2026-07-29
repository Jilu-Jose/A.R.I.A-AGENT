from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Form, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Digest, SavedPaper, DigestCluster
from app.api.auth import get_approved_user
import json
import logging
from typing import List
from pydantic import BaseModel
import os
import uuid
import shutil

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

class ClusterResponse(BaseModel):
    id: int
    topic_name: str
    summary: str
    articles: list[dict]

class DigestResponse(BaseModel):
    id: int
    title: str
    created_at: str
    article_count: int
    clusters: List[ClusterResponse]

class PaperUpdateRequest(BaseModel):
    title: str | None = None
    category: str | None = None
    document_type: str | None = None

class PaperResponse(BaseModel):
    id: int
    title: str
    url: str
    created_at: str
    cover_image_url: str | None = None
    file_size_bytes: int | None = None
    original_filename: str | None = None
    category: str | None = None
    document_type: str | None = None

@router.get("/latest", response_model=DigestResponse | dict)
def get_latest_digest(db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    digest = db.query(Digest).filter_by(user_id=current_user.id).order_by(Digest.created_at.desc()).first()
    if not digest:
        return {}
        
    clusters_data = []
    for cluster in digest.clusters:
        try:
            urls = json.loads(cluster.article_urls)
            titles = json.loads(cluster.article_titles)
        except:
            urls = []
            titles = []
            
        articles = [{"url": u, "title": t} for u, t in zip(urls, titles)]
        clusters_data.append({
            "id": cluster.id,
            "topic_name": cluster.topic_name,
            "summary": cluster.summary,
            "articles": articles
        })
        
    return {
        "id": digest.id,
        "title": digest.title,
        "created_at": digest.created_at.isoformat(),
        "article_count": digest.article_count,
        "clusters": clusters_data
    }

@router.get("/archives")
def get_archives(db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    digests = db.query(Digest).filter_by(user_id=current_user.id).order_by(Digest.created_at.desc()).all()
    return [{"id": d.id, "title": d.title, "created_at": d.created_at.isoformat(), "article_count": d.article_count} for d in digests]

@router.post("/run-now")
def run_now(background_tasks: BackgroundTasks, current_user: User = Depends(get_approved_user)):
    from pipeline import run_for_user
    background_tasks.add_task(run_for_user, current_user.id)
    return {"message": "Digest generation started in the background."}

@router.get("/library", response_model=List[PaperResponse])
def get_library(db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    papers = db.query(SavedPaper).filter_by(user_id=current_user.id).order_by(SavedPaper.created_at.desc()).all()
    return [{
        "id": p.id, 
        "title": p.title, 
        "url": p.url, 
        "created_at": p.created_at.isoformat(),
        "cover_image_url": p.cover_image_url,
        "file_size_bytes": p.file_size_bytes,
        "original_filename": p.original_filename,
        "category": p.category,
        "document_type": p.document_type
    } for p in papers]

@router.post("/search")
def search_and_pin(query: str = Form(...), background_tasks: BackgroundTasks = BackgroundTasks(), db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    query = query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    title = "Untitled Research Paper"
    if query.startswith("http://") or query.startswith("https://"):
        try:
            import requests
            from bs4 import BeautifulSoup
            headers = {"User-Agent": "ARIA-Agent/1.0"}
            response = requests.get(query, headers=headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                if soup.title and soup.title.string:
                    title = soup.title.string.strip()
            if title == "Untitled Research Paper":
                from urllib.parse import urlparse
                parsed_url = urlparse(query)
                title = parsed_url.path.split('/')[-1] or parsed_url.netloc or "Unknown Title"
        except:
            raise HTTPException(status_code=400, detail="Failed to fetch URL")
        
        new_paper = SavedPaper(user_id=current_user.id, title=title, url=query)
        db.add(new_paper)
        db.commit()
        db.refresh(new_paper)
        
        from agent.paper_analyst import run_paper_analyst
        background_tasks.add_task(run_paper_analyst, new_paper.id, new_paper.title, new_paper.url)
        
        return {"message": f"Pinned: {title[:30]}..."}
    else:
        try:
            import requests
            import urllib.parse
            from bs4 import BeautifulSoup
            encoded_query = urllib.parse.quote(query)
            api_url = f"http://export.arxiv.org/api/query?search_query=all:{encoded_query}&start=0&max_results=1"
            response = requests.get(api_url, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "xml")
                entry = soup.find("entry")
                if entry:
                    title = entry.find("title").text.strip().replace('\n', ' ')
                    url = entry.find("id").text.strip()
                    new_paper = SavedPaper(user_id=current_user.id, title=title, url=url)
                    db.add(new_paper)
                    db.commit()
                    db.refresh(new_paper)
                    
                    from agent.paper_analyst import run_paper_analyst
                    background_tasks.add_task(run_paper_analyst, new_paper.id, new_paper.title, new_paper.url)
                    
                    return {"message": f"Pinned: {title[:30]}..."}
                else:
                    raise HTTPException(status_code=404, detail="No papers found")
            else:
                raise HTTPException(status_code=500, detail="Failed to search arXiv")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.delete("/paper/{paper_id}")
def delete_paper(paper_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    paper = db.query(SavedPaper).get(paper_id)
    if not paper or paper.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Paper not found")
    db.delete(paper)
    db.commit()
    return {"message": "Paper removed"}

@router.put("/paper/{paper_id}")
def update_paper(paper_id: int, update_data: PaperUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    paper = db.query(SavedPaper).get(paper_id)
    if not paper or paper.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    if update_data.title is not None:
        paper.title = update_data.title
    if update_data.category is not None:
        paper.category = update_data.category
    if update_data.document_type is not None:
        paper.document_type = update_data.document_type
        
    db.commit()
    db.refresh(paper)
    return {"message": "Paper updated successfully"}

@router.get("/citation-map")
def get_citation_map(db: Session = Depends(get_db), current_user: User = Depends(get_approved_user)):
    papers = db.query(SavedPaper).filter_by(user_id=current_user.id).all()
    if not papers:
        return {"nodes": [], "links": []}
        
    from agent.citation_network import build_citation_map
    try:
        graph_data = build_citation_map(papers)
        return graph_data
    except Exception as e:
        logger.error(f"Failed to build citation map: {e}")
        return {"nodes": [], "links": []}

@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    category: str = Form(None),
    document_type: str = Form(None),
    custom_title: str = Form(None),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_approved_user)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    unique_filename = f"{uuid.uuid4()}.pdf"
    file_path = os.path.join(upload_dir, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_size = os.path.getsize(file_path)
    original_filename = file.filename
    
    cover_image_url = None
    try:
        import fitz
        doc = fitz.open(file_path)
        if len(doc) > 0:
            page = doc[0]
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            cover_filename = unique_filename.replace('.pdf', '_cover.png')
            cover_path = os.path.join(upload_dir, cover_filename)
            pix.save(cover_path)
            cover_image_url = f"/uploads/{cover_filename}"
        doc.close()
    except Exception as e:
        logger.error(f"Failed to extract cover image: {e}")
        
    title = custom_title if custom_title and custom_title.strip() else (file.filename[:-4] if file.filename.lower().endswith(".pdf") else file.filename)
    title = title or "Untitled Uploaded Paper"
    
    file_url = f"/uploads/{unique_filename}"
    
    new_paper = SavedPaper(
        user_id=current_user.id, 
        title=title, 
        url=file_url,
        cover_image_url=cover_image_url,
        file_size_bytes=file_size,
        original_filename=original_filename,
        category=category,
        document_type=document_type or "Research Paper"
    )
    db.add(new_paper)
    db.commit()
    db.refresh(new_paper)
    
    from agent.paper_analyst import run_paper_analyst
    background_tasks.add_task(run_paper_analyst, new_paper.id, new_paper.title, new_paper.url)
    
    return {"message": f"Uploaded: {title[:30]}...", "id": new_paper.id, "url": file_url}
