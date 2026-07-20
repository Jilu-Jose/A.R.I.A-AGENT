from functools import wraps
from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from app.database import db
from app.models import User

admin_bp = Blueprint("admin", __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not getattr(current_user, 'is_admin', False):
            flash("You do not have permission to access the admin dashboard.", "error")
            return redirect(url_for("dashboard.index"))
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route("/admin")
@login_required
@admin_required
def index():
    users = User.query.filter(User.is_admin == False).order_by(User.created_at.desc()).all()
    return render_template("admin_dashboard.html", users=users)

@admin_bp.route("/admin/approve/<int:user_id>", methods=["POST"])
@login_required
@admin_required
def approve_user(user_id):
    user = User.query.get_or_404(user_id)
    if not user.payment_status:
        flash(f"Cannot approve {user.username}. Payment has not been verified.", "error")
    else:
        user.is_approved = True
        db.session.commit()
        flash(f"User {user.username} has been approved.", "success")
    return redirect(url_for("admin.index"))

@admin_bp.route("/admin/reject/<int:user_id>", methods=["POST"])
@login_required
@admin_required
def reject_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    flash(f"User {user.username}'s request has been rejected and deleted.", "success")
    return redirect(url_for("admin.index"))

@admin_bp.route("/admin/toggle_payment/<int:user_id>", methods=["POST"])
@login_required
@admin_required
def toggle_payment(user_id):
    user = User.query.get_or_404(user_id)
    user.payment_status = not user.payment_status
    if not user.payment_status:
        user.is_approved = False # Revoke approval if payment is marked unverified
    db.session.commit()
    status = "Verified" if user.payment_status else "Unverified"
    flash(f"Payment status for {user.username} marked as {status}.", "success")
    return redirect(url_for("admin.index"))
