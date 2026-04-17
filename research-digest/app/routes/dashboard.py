
from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from loguru import logger
from app.models import Digest
dashboard_bp = Blueprint("dashboard", __name__)
@dashboard_bp.route("/")
@login_required
def index():
    digests = (
        Digest.query.filter_by(user_id=current_user.id)
        .order_by(Digest.created_at.desc())
        .all()
    )
    return render_template("dashboard.html", digests=digests)
@dashboard_bp.route("/run-now", methods=["POST"])
@login_required
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
@login_required
def view_digest(digest_id):
    import ast
    digest = Digest.query.filter_by(id=digest_id, user_id=current_user.id).first_or_404()
    for cluster in digest.clusters:
        try:
            cluster._parsed_urls = ast.literal_eval(cluster.article_urls)
            cluster._parsed_titles = ast.literal_eval(cluster.article_titles)
        except Exception:
            cluster._parsed_urls = []
            cluster._parsed_titles = []
    return render_template("digest.html", digest=digest)
@dashboard_bp.route("/archives")
@login_required
def archives():
    digests = (
        Digest.query.filter_by(user_id=current_user.id)
        .order_by(Digest.created_at.desc())
        .all()
    )
    return render_template("archives.html", digests=digests)
@dashboard_bp.route("/library")
@login_required
def library():
    import ast
    digests = (
        Digest.query.filter_by(user_id=current_user.id)
        .order_by(Digest.created_at.desc())
        .all()
    )
    library_items = []
    for digest in digests:
        for cluster in digest.clusters:
            try:
                urls = ast.literal_eval(cluster.article_urls)
                titles = ast.literal_eval(cluster.article_titles)
                for i in range(len(urls)):
                    library_items.append({
                        'title': titles[i] if i < len(titles) else "Unknown Title",
                        'url': urls[i],
                        'topic': cluster.topic_name,
                        'date': digest.created_at
                    })
            except Exception:
                pass
    return render_template("library.html", library_items=library_items)
@dashboard_bp.route("/search", methods=["POST"])
@login_required
def search():
    query = request.form.get("query", "").strip()
    if not query:
        flash("Please enter a research paper link.", "error")
        return redirect(request.referrer or url_for("dashboard.index"))
    if query.startswith("http://") or query.startswith("https://"):
        try:
            import requests
            from bs4 import BeautifulSoup
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            response = requests.get(query, headers=headers, timeout=10)
            title = "Untitled Research Paper"
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                if soup.title and soup.title.string:
                    title = soup.title.string.strip()
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
        flash("Text search is coming soon. Please paste a full URL to pin a research paper.", "info")
    return redirect(url_for("dashboard.index"))
@dashboard_bp.route("/paper/edit/<int:paper_id>", methods=["POST"])
@login_required
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
@login_required
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
