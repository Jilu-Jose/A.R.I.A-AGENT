"""
Settings routes for A.R.I.A.

Handles feed management: listing, adding, deleting, and toggling feeds.
"""

import re
from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user

from app.database import db
from app.models import Feed

settings_bp = Blueprint("settings", __name__)


@settings_bp.route("/settings")
@login_required
def index():
    """Render the settings page with the user's feed list and account info.

    Displays all feeds belonging to the current user and a form to add new ones.
    """
    feeds = Feed.query.filter_by(user_id=current_user.id).order_by(Feed.created_at.desc()).all()
    return render_template("settings.html", feeds=feeds)


@settings_bp.route("/settings/feeds/add", methods=["POST"])
@login_required
def add_feed():
    """Add a new RSS feed for the current user.

    Validates that the URL is in a plausible format before saving.
    """
    name = request.form.get("name", "").strip()
    url = request.form.get("url", "").strip()
    tags = request.form.get("tags", "").strip()

    if not url:
        flash("Feed URL is required.", "error")
        return redirect(url_for("settings.index"))

    url_pattern = re.compile(r"^https?://[^\s/$.?#].[^\s]*$", re.IGNORECASE)
    if not url_pattern.match(url):
        flash("Please enter a valid URL starting with http:// or https://.", "error")
        return redirect(url_for("settings.index"))

    feed = Feed(
        user_id=current_user.id,
        name=name or url,
        url=url,
        tags=tags,
    )
    db.session.add(feed)
    db.session.commit()

    flash(f"Feed '{feed.name}' added successfully.", "success")
    return redirect(url_for("settings.index"))


@settings_bp.route("/settings/feeds/delete/<int:feed_id>", methods=["POST"])
@login_required
def delete_feed(feed_id):
    """Delete a feed only if it belongs to the current user.

    Args:
        feed_id: The primary key of the feed to delete.
    """
    feed = Feed.query.filter_by(id=feed_id, user_id=current_user.id).first_or_404()
    db.session.delete(feed)
    db.session.commit()
    flash(f"Feed '{feed.name}' has been removed.", "success")
    return redirect(url_for("settings.index"))


@settings_bp.route("/settings/feeds/toggle/<int:feed_id>", methods=["POST"])
@login_required
def toggle_feed(feed_id):
    """Toggle the active status of a feed.

    Args:
        feed_id: The primary key of the feed to toggle.
    """
    feed = Feed.query.filter_by(id=feed_id, user_id=current_user.id).first_or_404()
    feed.is_active = not feed.is_active
    db.session.commit()
    status = "activated" if feed.is_active else "deactivated"
    flash(f"Feed '{feed.name}' has been {status}.", "success")
    return redirect(url_for("settings.index"))
