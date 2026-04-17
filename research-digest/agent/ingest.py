
import hashlib
import json
import os
from datetime import datetime, timezone
import feedparser
import requests
from bs4 import BeautifulSoup
from langchain.schema import Document
from loguru import logger
def _get_seen_urls_path(user_id):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, "data", f"seen_urls_{user_id}.json")
def _load_seen_urls(user_id):
    path = _get_seen_urls_path(user_id)
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return set(json.load(f))
        except Exception as e:
            logger.warning(f"Could not load seen URLs for user {user_id}: {e}")
    return set()
def _save_seen_urls(user_id, seen_hashes):
    path = _get_seen_urls_path(user_id)
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(list(seen_hashes), f)
    except Exception as e:
        logger.error(f"Could not save seen URLs for user {user_id}: {e}")
def _url_hash(url):
    return hashlib.md5(url.encode("utf-8")).hexdigest()
def _fetch_article_text(url, timeout=10):
    try:
        headers = {"User-Agent": "ARIA-Research-Agent/1.0"}
        resp = requests.get(url, timeout=timeout, headers=headers)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)
        return text
    except Exception as e:
        logger.debug(f"Could not fetch article text from {url}: {e}")
        return ""
def ingest_feeds(feeds, user_id):
    seen_hashes = _load_seen_urls(user_id)
    documents = []
    new_hashes = set()
    active_feeds = [f for f in feeds if f.is_active]
    logger.info(f"Ingesting {len(active_feeds)} active feeds for user {user_id}")
    for feed in active_feeds:
        try:
            logger.debug(f"Parsing feed: {feed.name} ({feed.url})")
            parsed = feedparser.parse(feed.url)
            if parsed.bozo and not parsed.entries:
                logger.warning(f"Feed parse error for {feed.name}: {parsed.bozo_exception}")
                continue
            for entry in parsed.entries[:15]:                          
                url = entry.get("link", "")
                if not url:
                    continue
                h = _url_hash(url)
                if h in seen_hashes:
                    continue
                title = entry.get("title", "Untitled")
                date = entry.get("published", entry.get("updated", ""))
                content = ""
                if "summary" in entry:
                    content = entry.summary
                elif "content" in entry and entry.content:
                    content = entry.content[0].get("value", "")
                if content:
                    soup = BeautifulSoup(content, "lxml")
                    content = soup.get_text(separator=" ", strip=True)
                if len(content) < 100:
                    fetched = _fetch_article_text(url)
                    if fetched:
                        content = fetched
                if not content:
                    content = title
                doc = Document(
                    page_content=content,
                    metadata={
                        "title": title,
                        "url": url,
                        "source": feed.name,
                        "date": date,
                    },
                )
                documents.append(doc)
                new_hashes.add(h)
        except Exception as e:
            logger.error(f"Error ingesting feed '{feed.name}': {e}")
            continue
    seen_hashes.update(new_hashes)
    _save_seen_urls(user_id, seen_hashes)
    logger.info(f"Ingested {len(documents)} new articles for user {user_id}")
    return documents
