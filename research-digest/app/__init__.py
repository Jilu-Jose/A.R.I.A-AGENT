"""
A.R.I.A — Autonomous Research Intelligence Agent.

Flask application factory.
"""

import os
from flask import Flask
from app.database import db, init_db
from app.auth import login_manager


def create_app():
    """Create and configure the Flask application.

    Registers blueprints for auth, dashboard, and settings routes.
    Initialises the database and Flask-Login extension.

    Returns:
        The configured Flask application instance.
    """
    app = Flask(
        __name__,
        template_folder=os.path.join(os.path.dirname(__file__), "templates"),
        static_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), "static"),
    )

    # Configuration
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "data", "digest.db")
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Initialise extensions
    init_db(app)
    login_manager.init_app(app)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.settings import settings_bp
    from app.routes.chat import chat_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(chat_bp)

    return app
