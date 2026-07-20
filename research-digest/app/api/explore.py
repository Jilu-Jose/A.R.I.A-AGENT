import os
import httpx
import hashlib
import re
from fastapi import APIRouter, Depends, Query
from app.api.auth import get_approved_user
from app.models import User

router = APIRouter(prefix="/api/explore", tags=["explore"])

ARXIV_CATEGORIES = {
    "cs.AI": ("Artificial Intelligence", "AI"),
    "cs.LG": ("Machine Learning", "ML"),
    "cs.CV": ("Computer Vision", "CV"),
    "cs.CL": ("Natural Language Processing", "NLP"),
    "cs.RO": ("Robotics", "Robotics"),
    "cs.NE": ("Neural & Evolutionary Computing", "NeuralNets"),
    "stat.ML": ("Statistics & Machine Learning", "StatML"),
    "q-bio": ("Quantitative Biology", "Biology"),
    "physics": ("Physics", "Physics"),
    "math": ("Mathematics", "Math"),
    "eess": ("Electrical Engineering", "Engineering"),
    "cs.CR": ("Cryptography & Security", "Security"),
}

TOPIC_IMAGES = {
    "AI":           "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80",
    "ML":           "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80",
    "CV":           "https://images.unsplash.com/photo-1527430253228-e93688616381?w=600&q=80",
    "NLP":          "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&q=80",
    "Robotics":     "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80",
    "NeuralNets":   "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
    "StatML":       "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    "Biology":      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
    "Physics":      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=80",
    "Math":         "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80",
    "Engineering":  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80",
    "Security":     "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&q=80",
    "default":      "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&q=80",
}

def _parse_arxiv_feed(xml: str) -> list[dict]:
    from xml.etree import ElementTree as ET
    ns = {"atom": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}
    posts = []
    try:
        root = ET.fromstring(xml)
        for entry in root.findall("atom:entry", ns):
            paper_id_raw = (entry.findtext("atom:id", "", ns) or "").strip()
            paper_id = paper_id_raw.split("/abs/")[-1].replace("/", "_")
            title = (entry.findtext("atom:title", "", ns) or "").strip().replace("\n", " ")
            summary = (entry.findtext("atom:summary", "", ns) or "").strip().replace("\n", " ")
            published = (entry.findtext("atom:published", "", ns) or "").strip()

            # Authors
            authors = [
                (a.findtext("atom:name", "", ns) or "").strip()
                for a in entry.findall("atom:author", ns)
            ]

            # Categories / tags
            cats = [t.get("term", "") for t in entry.findall("atom:category", ns)]
            primary_cat = cats[0] if cats else ""
            short_tag = ARXIV_CATEGORIES.get(primary_cat, ("Research", "Research"))[1]
            category_label = ARXIV_CATEGORIES.get(primary_cat, ("Research", "Research"))[0]

            # Hashtags from categories
            hashtags = list({
                ARXIV_CATEGORIES.get(c, ("", c.replace(".", "").replace("-", "")))[1]
                for c in cats[:4] if c
            })

            # Paper link
            link = paper_id_raw

            # Cover image
            image_url = TOPIC_IMAGES.get(short_tag, TOPIC_IMAGES["default"])

            # Deterministic like count from paper id hash
            hash_val = int(hashlib.md5(paper_id.encode()).hexdigest()[:6], 16)
            likes = (hash_val % 890) + 12
            comments = (hash_val % 47) + 1

            # Use first author as "account"
            poster_name = authors[0] if authors else "A.R.I.A Research"
            poster_handle = "@" + re.sub(r"[^a-zA-Z]", "", poster_name.split()[-1]).lower() if authors else "@ariaresearch"

            posts.append({
                "id": paper_id,
                "title": title,
                "summary": summary[:280] + ("..." if len(summary) > 280 else ""),
                "full_summary": summary,
                "authors": authors[:3],
                "poster_name": poster_name,
                "poster_handle": poster_handle,
                "published": published,
                "link": link,
                "hashtags": hashtags[:5],
                "category": category_label,
                "image_url": image_url,
                "likes": likes,
                "comments": comments,
            })
    except Exception:
        pass
    return posts


@router.get("/feed")
async def get_explore_feed(
    category: str = Query("cs.AI"),
    current_user: User = Depends(get_approved_user)
):
    url = f"http://export.arxiv.org/api/query?search_query=cat:{category}&start=0&max_results=15&sortBy=submittedDate&sortOrder=descending"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url)
        posts = _parse_arxiv_feed(resp.text)
        return posts
    except Exception as e:
        return []


@router.get("/trending-topics")
async def get_trending_topics(current_user: User = Depends(get_approved_user)):
    """Returns trending topic metadata for the sidebar"""
    return [
        {"tag": tag, "label": label, "category": cat}
        for cat, (label, tag) in ARXIV_CATEGORIES.items()
    ]
