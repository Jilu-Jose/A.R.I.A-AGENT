from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from loguru import logger
from app.models import Digest
from app.routes.auth import approved_required

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/")
@approved_required
def index():
    digests = (
        Digest.query.filter_by(user_id=current_user.id)
        .order_by(Digest.created_at.desc())
        .all()
    )
    return render_template("dashboard.html", digests=digests)

@dashboard_bp.route("/run-now", methods=["POST"])
@approved_required
def run_now():
    try:
        from main import run_for_user
        digest_id = run_for_user(current_user.id)
        if digest_id:
            flash("Digest generated successfully!", "success")
            return redirect(url_for("dashboard.view_digest", digest_id=digest_id))
        else:
            flash("No new articles were found to create a digest.", "error")
    except Exception as e:
        logger.error(f"Error running digest for user {current_user.id}: {e}")
        flash(f"An error occurred while generating your digest: {str(e)}", "error")
    return redirect(url_for("dashboard.index"))

@dashboard_bp.route("/digest/<int:digest_id>")
@approved_required
def view_digest(digest_id):
    import json as _json
    digest = Digest.query.filter_by(id=digest_id, user_id=current_user.id).first_or_404()
    for cluster in digest.clusters:
        try:
            cluster._parsed_urls = _json.loads(cluster.article_urls)
            cluster._parsed_titles = _json.loads(cluster.article_titles)
        except Exception:
            cluster._parsed_urls = []
            cluster._parsed_titles = []
    return render_template("digest.html", digest=digest)

@dashboard_bp.route("/archives")
@approved_required
def archives():
    digests = (
        Digest.query.filter_by(user_id=current_user.id)
        .order_by(Digest.created_at.desc())
        .all()
    )
    return render_template("archives.html", digests=digests)

@dashboard_bp.route("/library")
@approved_required
def library():
    import json as _json
    digests = (
        Digest.query.filter_by(user_id=current_user.id)
        .order_by(Digest.created_at.desc())
        .all()
    )
    library_items = []
    for digest in digests:
        for cluster in digest.clusters:
            try:
                urls = _json.loads(cluster.article_urls)
                titles = _json.loads(cluster.article_titles)
                for i in range(len(urls)):
                    library_items.append({
                        'title': titles[i] if i < len(titles) else "Unknown Title",
                        'url': urls[i],
                        'topic': cluster.topic_name,
                        'date': digest.created_at
                    })
            except Exception as e:
                logger.error(f"Failed to load library items for digest {digest.id}, cluster {cluster.id}: {e}")
                flash(f"Warning: Could not load some articles for '{cluster.topic_name}'.", "error")
    return render_template("library.html", library_items=library_items)

@dashboard_bp.route("/search", methods=["POST"])
@approved_required
def search():
    query = request.form.get("query", "").strip()
    if not query:
        flash("Please enter a research paper link.", "error")
        return redirect(request.referrer or url_for("dashboard.index"))
    if query.startswith("http://") or query.startswith("https://"):
        try:
            import requests
            from bs4 import BeautifulSoup
            from app.config import USER_AGENT
            headers = {"User-Agent": USER_AGENT}
            response = requests.get(query, headers=headers, timeout=10)
            title = "Untitled Research Paper"
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                if soup.title and soup.title.string:
                    title = soup.title.string.strip()
            
            if title == "Untitled Research Paper":
                from urllib.parse import urlparse
                parsed_url = urlparse(query)
                title = parsed_url.path.split('/')[-1] or parsed_url.netloc or "Unknown Title"
            from app.models import SavedPaper
            from app.database import db
            new_paper = SavedPaper(user_id=current_user.id, title=title, url=query)
            db.session.add(new_paper)
            db.session.commit()
            flash(f"Pinned research paper: {title[:30]}...", "success")
        except Exception as e:
            logger.error(f"Failed to scrape URL {query}: {e}")
            flash("Failed to pin URL. Please check the link.", "error")
    else:
        try:
            import requests
            import urllib.parse
            from bs4 import BeautifulSoup
            from app.models import SavedPaper
            from app.database import db
            from app.config import USER_AGENT
            
            encoded_query = urllib.parse.quote(query)
            api_url = f"http://export.arxiv.org/api/query?search_query=all:{encoded_query}&start=0&max_results=1"
            headers = {"User-Agent": USER_AGENT}
            response = requests.get(api_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "xml")
                entry = soup.find("entry")
                if entry:
                    title = entry.find("title").text.strip().replace('\n', ' ')
                    url = entry.find("id").text.strip()
                    new_paper = SavedPaper(user_id=current_user.id, title=title, url=url)
                    db.session.add(new_paper)
                    db.session.commit()
                    flash(f"Pinned research paper: {title[:30]}...", "success")
                else:
                    flash("No papers found for your search.", "info")
            else:
                flash("Failed to search arXiv.", "error")
        except Exception as e:
            logger.error(f"Failed to search text {query}: {e}")
            flash("Failed to search. Please try again.", "error")
    return redirect(url_for("dashboard.index"))

@dashboard_bp.route("/paper/edit/<int:paper_id>", methods=["POST"])
@approved_required
def edit_paper(paper_id):
    from app.models import SavedPaper
    from app.database import db
    paper = SavedPaper.query.get_or_404(paper_id)
    if paper.user_id != current_user.id:
        flash("Unauthorized", "error")
        return redirect(url_for("dashboard.index"))
    new_title = request.form.get("title")
    if new_title:
        paper.title = new_title.strip()
        db.session.commit()
        flash("Paper title updated.", "success")
    return redirect(url_for("dashboard.index"))

@dashboard_bp.route("/paper/delete/<int:paper_id>", methods=["POST"])
@approved_required
def delete_paper(paper_id):
    from app.models import SavedPaper
    from app.database import db
    paper = SavedPaper.query.get_or_404(paper_id)
    if paper.user_id != current_user.id:
        flash("Unauthorized", "error")
        return redirect(url_for("dashboard.index"))
    db.session.delete(paper)
    db.session.commit()
    flash("Paper removed from pinned list.", "info")
    return redirect(url_for("dashboard.index"))

@dashboard_bp.route("/digest/<int:digest_id>/pdf")
@approved_required
def download_pdf(digest_id):
    from flask import make_response
    from fpdf import FPDF
    import json as _json
    digest = Digest.query.filter_by(id=digest_id, user_id=current_user.id).first_or_404()
    
    class PDF(FPDF):
        def header(self):
            self.set_font('helvetica', 'B', 15)
            self.cell(0, 10, f'A.R.I.A Digest - VOL. {digest.id}', 0, 1, 'C')
            self.set_font('helvetica', 'I', 10)
            self.cell(0, 10, digest.created_at.strftime('%B %d, %Y'), 0, 1, 'C')
            self.ln(10)
            
        def footer(self):
            self.set_y(-15)
            self.set_font('helvetica', 'I', 8)
            self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')
            
    pdf = PDF()
    pdf.add_page()
    
    for cluster in digest.clusters:
        pdf.set_font('helvetica', 'B', 14)
        pdf.cell(0, 10, cluster.topic_name, 0, 1, 'L')
        pdf.ln(4)
        
        pdf.set_font('helvetica', '', 11)
        for bullet in cluster.summary.split('\n'):
            if bullet.strip():
                clean_bullet = bullet.strip().lstrip('-•* ')
                pdf.multi_cell(0, 8, f"\x95 {clean_bullet}")
                
        pdf.ln(5)
        
        try:
            urls = _json.loads(cluster.article_urls)
            titles = _json.loads(cluster.article_titles)
            if urls and titles:
                pdf.set_font('helvetica', 'B', 10)
                pdf.cell(0, 8, 'Primary Sources:', 0, 1, 'L')
                pdf.set_font('helvetica', '', 9)
                for i in range(min(len(urls), len(titles), 3)):
                    pdf.multi_cell(0, 6, f"- {titles[i]} ({urls[i]})")
        except Exception:
            pass
            
        pdf.ln(10)
        
    response = make_response(bytes(pdf.output()))
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'attachment; filename=ARIA_Digest_{digest.id}.pdf'
    return response

@dashboard_bp.route("/analytics")
@approved_required
def analytics():
    from app.models import Digest, Feed, SavedPaper, DigestCluster
    from app.database import db
    from sqlalchemy import func
    from datetime import datetime, timedelta, timezone

    # Counters
    completed_researches = Digest.query.filter_by(user_id=current_user.id).count()
    ongoing_researches = Feed.query.filter_by(user_id=current_user.id, is_active=True).count()
    pinned_papers = SavedPaper.query.filter_by(user_id=current_user.id).count()
    
    total_articles = db.session.query(func.sum(Digest.article_count)).filter(Digest.user_id == current_user.id).scalar()
    total_articles = total_articles or 0

    # Line Chart Data (Last 30 days)
    today = datetime.now(timezone.utc).date()
    date_counts = {}
    for i in range(29, -1, -1):
        d = (today - timedelta(days=i)).strftime('%Y-%m-%d')
        date_counts[d] = 0

    # Filter for the last 30 days
    start_date = datetime.now(timezone.utc) - timedelta(days=30)
    digests = Digest.query.filter_by(user_id=current_user.id).filter(Digest.created_at >= start_date).all()
    for d in digests:
        if d.created_at:
            date_str = d.created_at.strftime('%Y-%m-%d')
            if date_str in date_counts:
                date_counts[date_str] += 1
            
    dates_list = list(date_counts.keys())
    counts_list = list(date_counts.values())

    # Doughnut Chart Data (Top Topics)
    top_topics_query = db.session.query(
        DigestCluster.topic_name, 
        func.count(DigestCluster.id)
    ).join(Digest, DigestCluster.digest_id == Digest.id)\
     .filter(Digest.user_id == current_user.id)\
     .group_by(DigestCluster.topic_name)\
     .order_by(func.count(DigestCluster.id).desc())\
     .limit(5).all()

    topics = [t[0] for t in top_topics_query]
    topic_counts = [t[1] for t in top_topics_query]
    
    # If no topics, provide a fallback
    if not topics:
        topics = ["No Data"]
        topic_counts = [1]

    return render_template(
        "analytics.html",
        completed_researches=completed_researches,
        ongoing_researches=ongoing_researches,
        pinned_papers=pinned_papers,
        total_articles=total_articles,
        dates_list=dates_list,
        counts_list=counts_list,
        topics=topics,
        topic_counts=topic_counts
    )
