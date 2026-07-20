import sys
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from apscheduler.schedulers.background import BackgroundScheduler
from loguru import logger
from app.database import SessionLocal
from app.models import User
from pipeline import run_for_user

logger.add(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "scheduler.log"),
    rotation="7 days",
    retention="30 days",
    level="INFO",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
)

def daily_digest_job():
    with SessionLocal() as db:
        users = db.query(User).filter_by(is_active_user=True).all()
        logger.info(f"Daily digest job started — processing {len(users)} active users")
        success_count = 0
        error_count = 0
        for user in users:
            try:
                logger.info(f"Processing user: {user.username} (id={user.id})")
                digest_id = run_for_user(user.id)
                if digest_id:
                    success_count += 1
                    logger.info(f"✓ Digest #{digest_id} created for {user.username}")
                else:
                    logger.info(f"— No digest created for {user.username} (no new articles)")
            except Exception as e:
                error_count += 1
                logger.error(f"✕ Failed for {user.username}: {e}")
        logger.info(
            f"Daily digest job completed — "
            f"{success_count} digests created, "
            f"{error_count} errors, "
            f"{len(users) - success_count - error_count} skipped"
        )

def init_scheduler(app=None):
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        daily_digest_job,
        trigger="cron",
        hour=7,
        minute=0,
        id="daily_digest",
        name="Daily Research Digest",
        misfire_grace_time=3600,
    )
    scheduler.start()
    logger.info("A.R.I.A Scheduler started — daily digest runs at 07:00")

if __name__ == "__main__":
    from apscheduler.schedulers.blocking import BlockingScheduler
    def start_standalone():
        scheduler = BlockingScheduler()
        scheduler.add_job(daily_digest_job, trigger="cron", hour=7, minute=0)
        print("◈ Standalone Scheduler started")
        scheduler.start()
    start_standalone()
