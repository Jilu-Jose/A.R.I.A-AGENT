from datetime import datetime, timezone
from app.database import Base
import sqlalchemy as sa
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"
    id = sa.Column(sa.Integer, primary_key=True)
    username = sa.Column(sa.String(80), unique=True, nullable=False)
    email = sa.Column(sa.String(120), unique=True, nullable=False)
    password_hash = sa.Column(sa.String(256))
    created_at = sa.Column(sa.DateTime, default=lambda: datetime.now(timezone.utc))
    is_active_user = sa.Column(sa.Boolean, default=True)
    
    role = sa.Column(sa.String(50))
    payment_tier = sa.Column(sa.Integer, default=1)
    payment_status = sa.Column(sa.Boolean, default=False)
    verification_doc_path = sa.Column(sa.String(500))
    reason_for_access = sa.Column(sa.Text)
    is_approved = sa.Column(sa.Boolean, default=False)
    is_admin = sa.Column(sa.Boolean, default=False)
    
    feeds = relationship("Feed", back_populates="owner", lazy="select", cascade="all, delete-orphan")
    digests = relationship("Digest", back_populates="owner", lazy="select", cascade="all, delete-orphan")
    saved_papers = relationship("SavedPaper", back_populates="owner", lazy="select", cascade="all, delete-orphan")

    @property
    def is_active(self):
        return self.is_active_user

    def __repr__(self):
        return f"<User {self.username}>"

class Feed(Base):
    __tablename__ = "feeds"
    id = sa.Column(sa.Integer, primary_key=True)
    user_id = sa.Column(sa.Integer, sa.ForeignKey("users.id"), nullable=False)
    name = sa.Column(sa.String(120))
    url = sa.Column(sa.String(500), nullable=False)
    tags = sa.Column(sa.String(200))
    is_active = sa.Column(sa.Boolean, default=True)
    created_at = sa.Column(sa.DateTime, default=lambda: datetime.now(timezone.utc))
    
    owner = relationship("User", back_populates="feeds")

    def __repr__(self):
        return f"<Feed {self.name}>"

class Digest(Base):
    __tablename__ = "digests"
    id = sa.Column(sa.Integer, primary_key=True)
    user_id = sa.Column(sa.Integer, sa.ForeignKey("users.id"), nullable=False)
    created_at = sa.Column(sa.DateTime, default=lambda: datetime.now(timezone.utc))
    title = sa.Column(sa.String(200))
    article_count = sa.Column(sa.Integer, default=0)
    
    owner = relationship("User", back_populates="digests")
    clusters = relationship("DigestCluster", back_populates="digest", lazy="select", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Digest {self.title}>"

class DigestCluster(Base):
    __tablename__ = "digest_clusters"
    id = sa.Column(sa.Integer, primary_key=True)
    digest_id = sa.Column(sa.Integer, sa.ForeignKey("digests.id"), nullable=False)
    topic_name = sa.Column(sa.String(200))
    summary = sa.Column(sa.Text)
    article_urls = sa.Column(sa.Text)
    article_titles = sa.Column(sa.Text)
    
    digest = relationship("Digest", back_populates="clusters")

    def __repr__(self):
        return f"<DigestCluster {self.topic_name}>"

class SavedPaper(Base):
    __tablename__ = "saved_papers"
    id = sa.Column(sa.Integer, primary_key=True)
    user_id = sa.Column(sa.Integer, sa.ForeignKey("users.id"), nullable=False)
    title = sa.Column(sa.String(500), nullable=False)
    url = sa.Column(sa.String(1000), nullable=False)
    created_at = sa.Column(sa.DateTime, default=lambda: datetime.now(timezone.utc))
    
    owner = relationship("User", back_populates="saved_papers")

    def __repr__(self):
        return f"<SavedPaper {self.title}>"
