"""
Ingestion module for A.R.I.A.

Fetches RSS feeds, parses articles, and deduplicates by URL hash.
Returns a list of LangChain Document objects with structured metadata.
"""

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
    """Return the filesystem path for a user's seen-URLs tracking file.

    Args:
        user_id: The integer ID of the user.

    Returns:
        Absolute path to the user's seen_urls JSON file.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, "data", f"seen_urls_{user_id}.json")


def _load_seen_urls(user_id):
    """Load the set of previously seen URL hashes for a user.

    Args:
        user_id: The integer ID of the user.

    Returns:
        A set of MD5 hex-digest strings of URLs already processed.
    """
    path = _get_seen_urls_path(user_id)
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return set(json.load(f))
        except Exception as e:
            logger.warning(f"Could not load seen URLs for user {user_id}: {e}")
    return set()


def _save_seen_urls(user_id, seen_hashes):
    """Persist the set of seen URL hashes for a user.

    Args:
        user_id: The integer ID of the user.
        seen_hashes: A set of MD5 hex-digest strings.
    """
    path = _get_seen_urls_path(user_id)
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(list(seen_hashes), f)
    except Exception as e:
        logger.error(f"Could not save seen URLs for user {user_id}: {e}")


def _url_hash(url):
    """Compute an MD5 hash of a URL string for deduplication.

    Args:
        url: The URL to hash.

    Returns:
        The hexadecimal MD5 digest of the URL.
    """
    return hashlib.md5(url.encode("utf-8")).hexdigest()


def _fetch_article_text(url, timeout=10):
    """Fetch and extract the main text content from a web page.

    Uses requests + BeautifulSoup to strip HTML and return cleaned text.

    Args:
        url: The URL to fetch.
        timeout: Request timeout in seconds.

    Returns:
        The extracted text content, or an empty string on failure.
    """
    try:
        headers = {"User-Agent": "ARIA-Research-Agent/1.0"}
        resp = requests.get(url, timeout=timeout, headers=headers)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        # Remove script and style elements
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        text = soup.get_text(separator=" ", strip=True)
        return text
    except Exception as e:
        logger.debug(f"Could not fetch article text from {url}: {e}")
        return ""


def ingest_feeds(feeds, user_id):
    """Fetch articles from RSS feeds, deduplicate, and return Document objects.

    For each active feed, parses the RSS XML and extracts article entries.
    Skips articles whose URL has been seen before (tracked per-user).
    Optionally fetches full article text for richer document content.

    Args:
        feeds: A list of Feed SQLAlchemy model objects.
        user_id: The integer ID of the user owning these feeds.

    Returns:
        A list of LangChain Document objects with metadata containing:
        title, url, source, and date.
    """
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

            for entry in parsed.entries[:15]:  # Limit entries per feed
                url = entry.get("link", "")
                if not url:
                    continue

                h = _url_hash(url)
                if h in seen_hashes:
                    continue

                title = entry.get("title", "Untitled")
                date = entry.get("published", entry.get("updated", ""))

                # Try to get content from the feed entry first
                content = ""
                if "summary" in entry:
                    content = entry.summary
                elif "content" in entry and entry.content:
                    content = entry.content[0].get("value", "")

                # Strip HTML from RSS content
                if content:
                    soup = BeautifulSoup(content, "lxml")
                    content = soup.get_text(separator=" ", strip=True)

                # If content is too short, try fetching the full article
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

    # Update seen URLs
    seen_hashes.update(new_hashes)
    _save_seen_urls(user_id, seen_hashes)

    logger.info(f"Ingested {len(documents)} new articles for user {user_id}")
    return documents
