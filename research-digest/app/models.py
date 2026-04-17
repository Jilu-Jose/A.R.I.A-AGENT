
from datetime import datetime, timezone
from flask_login import UserMixin
from app.database import db
class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    is_active_user = db.Column(db.Boolean, default=True)
    feeds = db.relationship("Feed", backref="owner", lazy=True, cascade="all, delete-orphan")
    digests = db.relationship("Digest", backref="owner", lazy=True, cascade="all, delete-orphan")
    saved_papers = db.relationship("SavedPaper", backref="owner", lazy=True, cascade="all, delete-orphan")
    @property
    def is_active(self):
        return self.is_active_user
    def __repr__(self):
        return f"<User {self.username}>"
class Feed(db.Model):
    __tablename__ = "feeds"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(120))
    url = db.Column(db.String(500), nullable=False)
    tags = db.Column(db.String(200))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    def __repr__(self):
        return f"<Feed {self.name}>"
class Digest(db.Model):
    __tablename__ = "digests"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    title = db.Column(db.String(200))
    article_count = db.Column(db.Integer, default=0)
    clusters = db.relationship("DigestCluster", backref="digest", lazy=True, cascade="all, delete-orphan")
    def __repr__(self):
        return f"<Digest {self.title}>"
class DigestCluster(db.Model):
    __tablename__ = "digest_clusters"
    id = db.Column(db.Integer, primary_key=True)
    digest_id = db.Column(db.Integer, db.ForeignKey("digests.id"), nullable=False)
    topic_name = db.Column(db.String(200))
    summary = db.Column(db.Text)
    article_urls = db.Column(db.Text)
    article_titles = db.Column(db.Text)
    def __repr__(self):
        return f"<DigestCluster {self.topic_name}>"
class SavedPaper(db.Model):
    __tablename__ = "saved_papers"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    url = db.Column(db.String(1000), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    def __repr__(self):
        return f"<SavedPaper {self.title}>"
