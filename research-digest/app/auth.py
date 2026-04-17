"""
Authentication helpers for A.R.I.A.

Provides password hashing utilities and Flask-Login user loader setup.
"""

from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager

from app.models import User

login_manager = LoginManager()
login_manager.login_view = "auth.login"
login_manager.login_message = "Please log in to access this page."
login_manager.login_message_category = "error"


@login_manager.user_loader
def load_user(user_id):
    """Load a user by their primary key for Flask-Login session management.

    Args:
        user_id: The integer primary key of the user.

    Returns:
        The User instance, or None if not found.
    """
    return User.query.get(int(user_id))


def hash_password(password):
    """Generate a secure hash of the given plaintext password.

    Args:
        password: The plaintext password string.

    Returns:
        The hashed password string.
    """
    return generate_password_hash(password, method="pbkdf2:sha256")


def verify_password(password_hash, password):
    """Verify a plaintext password against a stored hash.

    Args:
        password_hash: The stored password hash.
        password: The plaintext password to check.

    Returns:
        True if the password matches the hash, False otherwise.
    """
    return check_password_hash(password_hash, password)
