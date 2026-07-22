import sys
import os
from dotenv import load_dotenv
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
from agent.trend_detector import run_trend_detector

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
                    
                    # Deliver to Slack/Discord if webhook is set
                    webhook_url = os.environ.get("SLACK_WEBHOOK_URL") or os.environ.get("DISCORD_WEBHOOK_URL")
                    if webhook_url:
                        try:
                            import requests
                            payload = {"content": f"New Research Digest #{digest_id} created for {user.username}! Check your dashboard."}
                            if "slack" in webhook_url:
                                payload = {"text": payload["content"]}
                            requests.post(webhook_url, json=payload, timeout=5)
                            logger.info("✓ Digest notification sent to webhook.")
                        except Exception as e:
                            logger.error(f"Failed to send webhook notification: {e}")
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
    scheduler.add_job(
        run_trend_detector,
        trigger="cron",
        hour=6,
        minute=0,
        id="trend_detector",
        name="Trend Detector Agent",
        misfire_grace_time=3600,
    )
    scheduler.start()
    logger.info("A.R.I.A Scheduler started — daily digest runs at 07:00, trend detector at 06:00")

if __name__ == "__main__":
    from apscheduler.schedulers.blocking import BlockingScheduler
    def start_standalone():
        scheduler = BlockingScheduler()
        scheduler.add_job(daily_digest_job, trigger="cron", hour=7, minute=0)
        scheduler.add_job(run_trend_detector, trigger="cron", hour=6, minute=0)
        print("◈ Standalone Scheduler started")
        scheduler.start()
    start_standalone()
