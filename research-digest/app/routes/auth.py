
import os
import yaml
from flask import Blueprint, render_template, redirect, url_for, flash, request, session
from flask_login import login_user, logout_user, login_required, current_user
from app.database import db
from app.models import User, Feed
from app.auth import hash_password, verify_password
auth_bp = Blueprint("auth", __name__)
def _load_default_feeds():
    config_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "config",
        "default_feeds.yaml",
    )
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return data.get("feeds", [])
    except Exception:
        return []
@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")
        errors = []
        if not username or len(username) < 3:
            errors.append("Username must be at least 3 characters.")
        if not email or "@" not in email:
            errors.append("A valid email address is required.")
        if not password or len(password) < 6:
            errors.append("Password must be at least 6 characters.")
        if password != confirm_password:
            errors.append("Passwords do not match.")
        if User.query.filter_by(username=username).first():
            errors.append("Username is already taken.")
        if User.query.filter_by(email=email).first():
            errors.append("Email is already registered.")
        if errors:
            for err in errors:
                flash(err, "error")
            return render_template("register.html", username=username, email=email)
        user = User(
            username=username,
            email=email,
            password_hash=hash_password(password),
        )
        db.session.add(user)
        db.session.commit()
        default_feeds = _load_default_feeds()
        for feed_data in default_feeds:
            feed = Feed(
                user_id=user.id,
                name=feed_data.get("name", ""),
                url=feed_data.get("url", ""),
                tags=feed_data.get("tags", ""),
            )
            db.session.add(feed)
        db.session.commit()
        login_user(user)
        flash("Welcome to A.R.I.A! Your account has been created.", "success")
        return redirect(url_for("dashboard.index"))
    return render_template("register.html")
@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        user = User.query.filter_by(email=email).first()
        if user and verify_password(user.password_hash, password):
            login_user(user, remember=True)
            session.permanent = True
            flash("Welcome back!", "success")
            next_page = request.args.get("next")
            return redirect(next_page or url_for("dashboard.index"))
        else:
            flash("Invalid email or password.", "error")
            return render_template("login.html", email=email)
    return render_template("login.html")
@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You have been logged out.", "success")
    return redirect(url_for("auth.login"))
