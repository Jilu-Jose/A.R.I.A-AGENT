
import sys
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from apscheduler.schedulers.blocking import BlockingScheduler
from loguru import logger
from app import create_app
from app.models import User
from main import run_for_user
logger.add(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "scheduler.log"),
    rotation="7 days",
    retention="30 days",
    level="INFO",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
)
def daily_digest_job():
    app = create_app()
    with app.app_context():
        users = User.query.filter_by(is_active_user=True).all()
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
def start_scheduler():
    scheduler = BlockingScheduler()
    scheduler.add_job(
        daily_digest_job,
        trigger="cron",
        hour=7,
        minute=0,
        id="daily_digest",
        name="Daily Research Digest",
        misfire_grace_time=3600,
    )
    logger.info("A.R.I.A Scheduler started — daily digest runs at 07:00")
    print("◈ A.R.I.A Scheduler started — daily digest runs at 07:00")
    print("  Press Ctrl+C to stop.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped.")
        print("\n◈ Scheduler stopped.")
if __name__ == "__main__":
    start_scheduler()
