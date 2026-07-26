import json
import os
import requests
from datetime import datetime, timezone
from loguru import logger
from app.database import SessionLocal
from app.models import Digest, DigestCluster

def deliver_digest(user_id, summaries):
    if not summaries:
        logger.info(f"No summaries to deliver for user {user_id}")
        return None
        
    with SessionLocal() as session:
        try:
            now = datetime.now(timezone.utc)
            title = f"Your digest for {now.strftime('%B %d, %Y')}"
            total_articles = sum(len(s.get("top_urls", [])) for s in summaries)
            
            digest = Digest(
                user_id=user_id,
                title=title,
                article_count=total_articles,
                created_at=now,
            )
            session.add(digest)
            session.flush()                                       
            
            webhook_text = f"*A.R.I.A Research Digest*\n_({total_articles} articles across {len(summaries)} clusters)_\n\n"
            
            for summary in summaries:
                cluster = DigestCluster(
                    digest_id=digest.id,
                    topic_name=summary["topic_name"],
                    summary="\n".join(summary["summary_bullets"]),
                    article_urls=json.dumps(summary.get("top_urls", [])),
                    article_titles=json.dumps(summary.get("top_titles", [])),
                )
                session.add(cluster)
                
                webhook_text += f"*{summary['topic_name']}*\n"
                for bullet in summary["summary_bullets"]:
                    webhook_text += f"• {bullet}\n"
                webhook_text += "\n"
            
            session.commit()
            logger.info(f"Delivered digest #{digest.id} for user {user_id} ({len(summaries)} clusters, {total_articles} articles)")
            
            # Send to webhooks if configured
            slack_url = os.environ.get("SLACK_WEBHOOK_URL")
            if slack_url:
                try:
                    requests.post(slack_url, json={"text": webhook_text}, timeout=10)
                    logger.info("Sent digest to Slack")
                except Exception as e:
                    logger.error(f"Slack webhook failed: {e}")
                    
            discord_url = os.environ.get("DISCORD_WEBHOOK_URL")
            if discord_url:
                try:
                    requests.post(discord_url, json={"content": webhook_text}, timeout=10)
                    logger.info("Sent digest to Discord")
                except Exception as e:
                    logger.error(f"Discord webhook failed: {e}")
            
            return digest.id
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to deliver digest for user {user_id}: {e}")
            return None
