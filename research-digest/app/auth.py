
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager
from app.models import User
login_manager = LoginManager()
login_manager.login_view = "auth.login"
login_manager.login_message = "Please log in to access this page."
login_manager.login_message_category = "error"
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))
def hash_password(password):
    return generate_password_hash(password, method="pbkdf2:sha256")
def verify_password(password_hash, password):
    return check_password_hash(password_hash, password)
