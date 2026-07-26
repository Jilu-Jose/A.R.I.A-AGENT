import sys
import os
from datetime import datetime, timezone

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, Base, engine
from app.models import User, Feed, Digest, DigestCluster, SavedPaper
from app.auth import hash_password

def seed_db():
    print("Creating tables if they don't exist...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    print("Checking for admin user...")
    admin = db.query(User).filter_by(username="admin").first()
    if not admin:
        print("Creating admin user...")
        admin = User(
            username="admin",
            email="admin@example.com",
            password_hash=hash_password("admin123"),
            is_active_user=True,
            is_approved=True,
            is_admin=True,
            role="admin",
            reason_for_access="To view the full potential of this project."
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    else:
        print("Admin user already exists. We will use this user to attach seed data.")
        
    print("Creating seed feeds...")
    if db.query(Feed).filter_by(user_id=admin.id).count() == 0:
        feeds = [
            Feed(user_id=admin.id, name="AI News", url="https://example.com/ai-rss", tags="AI, Machine Learning"),
            Feed(user_id=admin.id, name="Tech Blogs", url="https://example.com/tech", tags="Tech, Startups"),
            Feed(user_id=admin.id, name="Science Daily", url="https://example.com/science", tags="Science, Research"),
        ]
        db.add_all(feeds)
    else:
        print("Feeds already exist for this user.")
    
    print("Creating seed digests...")
    if db.query(Digest).filter_by(user_id=admin.id).count() == 0:
        digest1 = Digest(user_id=admin.id, title="Weekly AI Digest", article_count=5)
        digest2 = Digest(user_id=admin.id, title="Tech Trends Review", article_count=3)
        db.add_all([digest1, digest2])
        db.commit()
        db.refresh(digest1)
        db.refresh(digest2)
        
        print("Creating digest clusters...")
        clusters = [
            DigestCluster(
                digest_id=digest1.id, 
                topic_name="Large Language Models", 
                summary="Updates on the latest LLMs and their performance benchmarks.", 
                article_urls="https://example.com/llm1,https://example.com/llm2", 
                article_titles="LLM Scaling Laws,New GPT Model Released"
            ),
            DigestCluster(
                digest_id=digest1.id, 
                topic_name="Robotics", 
                summary="Recent advancements in humanoid robotics.", 
                article_urls="https://example.com/robotics1", 
                article_titles="Boston Dynamics New Robot"
            ),
            DigestCluster(
                digest_id=digest2.id, 
                topic_name="Quantum Computing", 
                summary="Breakthroughs in qubit stability.", 
                article_urls="https://example.com/qc1", 
                article_titles="Quantum Error Correction Milestone"
            )
        ]
        db.add_all(clusters)
    else:
        print("Digests already exist for this user.")

    print("Creating saved papers...")
    if db.query(SavedPaper).filter_by(user_id=admin.id).count() == 0:
        papers = [
            SavedPaper(user_id=admin.id, title="Attention Is All You Need", url="https://arxiv.org/abs/1706.03762"),
            SavedPaper(user_id=admin.id, title="BERT: Pre-training of Deep Bidirectional Transformers", url="https://arxiv.org/abs/1810.04805")
        ]
        db.add_all(papers)
    else:
        print("Saved papers already exist for this user.")

    db.commit()
    db.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    seed_db()
