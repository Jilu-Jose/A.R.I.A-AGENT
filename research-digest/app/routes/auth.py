
import os
import yaml
from functools import wraps
from flask import Blueprint, render_template, redirect, url_for, flash, request, session
from flask_login import login_user, logout_user, login_required, current_user
from app.database import db
from app.models import User, Feed
from app.auth import hash_password, verify_password

auth_bp = Blueprint("auth", __name__)

def approved_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return redirect(url_for("auth.login"))
        if not current_user.is_approved and not getattr(current_user, 'is_admin', False):
            return redirect(url_for("auth.pending"))
        return f(*args, **kwargs)
    return decorated_function

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
            is_approved=False
        )
        db.session.add(user)
        db.session.commit()

        flash("Registration successful. Please log in to request services.", "success")
        return redirect(url_for("auth.login"))
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
            
            if not user.is_approved and not user.is_admin:
                return redirect(url_for("auth.pending"))
                
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

@auth_bp.route("/pending")
@login_required
def pending():
    if current_user.is_approved or getattr(current_user, 'is_admin', False):
        return redirect(url_for("dashboard.index"))
    return render_template("pending.html")

@auth_bp.route("/submit_request", methods=["POST"])
@login_required
def submit_request():
    if current_user.is_approved or getattr(current_user, 'is_admin', False):
        return redirect(url_for("dashboard.index"))
        
    import os
    from werkzeug.utils import secure_filename
    
    role = request.form.get("role", "Others")
    payment_tier = int(request.form.get("payment_tier", 1))
    
    gov_id_file = request.files.get("gov_id")
    doc_path = current_user.verification_doc_path
    
    if gov_id_file and gov_id_file.filename:
        filename = secure_filename(gov_id_file.filename)
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "uploads", "verification")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, f"{current_user.username}_{filename}")
        gov_id_file.save(file_path)
        doc_path = f"uploads/verification/{current_user.username}_{filename}"

    current_user.role = role
    current_user.payment_tier = payment_tier
    current_user.verification_doc_path = doc_path
    db.session.commit()
    
    flash("Your request has been submitted and is pending approval.", "success")
    return redirect(url_for("auth.pending"))
