"""
Dashboard routes for A.R.I.A.

Handles the main dashboard view, individual digest view, and manual digest triggers.
"""

from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_required, current_user
from loguru import logger

from app.models import Digest

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/")
@login_required
def index():
    """Render the main dashboard showing the user's past digests.

    Displays digests ordered by creation date (newest first).
    Shows a helpful message if no digests have been generated yet.
    """
    digests = (
        Digest.query.filter_by(user_id=current_user.id)
        .order_by(Digest.created_at.desc())
        .all()
    )
    return render_template("dashboard.html", digests=digests)


@dashboard_bp.route("/run-now", methods=["POST"])
@login_required
def run_now():
    """Trigger the full agent pipeline for the current user synchronously.

    Imports and runs the agent orchestration, then redirects to the dashboard.
    """
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
    """Render a full digest with all its topic clusters.

    Args:
        digest_id: The primary key of the digest to view.

    Only shows digests owned by the current user.
    """
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
    """Render all past digests."""
    digests = (
        Digest.query.filter_by(user_id=current_user.id)
        .order_by(Digest.created_at.desc())
        .all()
    )
    return render_template("archives.html", digests=digests)

@dashboard_bp.route("/library")
@login_required
def library():
    """Render a library of all curated articles across all digests."""
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
