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


FAKE_POSTS = [
    {
        "id": "fake_post_1",
        "title": "Scaling Laws for Autoregressive Models in Complex Environments",
        "summary": "We investigate the scaling behavior of autoregressive models across multiple domains, finding that parameter count and data volume exhibit predictable power-law improvements...",
        "full_summary": "We investigate the scaling behavior of autoregressive models across multiple domains, finding that parameter count and data volume exhibit predictable power-law improvements. The implications suggest a pathway to AGI within the next decade.",
        "authors": ["Alan Turing", "Geoffrey Hinton"],
        "poster_name": "Alan Turing",
        "poster_handle": "@aturing",
        "published": "2026-07-28T10:00:00Z",
        "link": "https://arxiv.org/abs/fake_post_1",
        "hashtags": ["AI", "ScalingLaws", "LLM"],
        "category": "Artificial Intelligence",
        "image_url": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80",
        "likes": 1205,
        "comments": 342,
    },
    {
        "id": "fake_post_2",
        "title": "Quantum Error Correction with Topological Qubits",
        "summary": "A novel approach to quantum error correction using non-Abelian anyons, reducing the physical-to-logical qubit overhead by an order of magnitude.",
        "full_summary": "A novel approach to quantum error correction using non-Abelian anyons, reducing the physical-to-logical qubit overhead by an order of magnitude. This breakthrough paves the way for fault-tolerant quantum computation.",
        "authors": ["Richard Feynman", "John Preskill"],
        "poster_name": "Richard Feynman",
        "poster_handle": "@rfeynman",
        "published": "2026-07-27T14:30:00Z",
        "link": "https://arxiv.org/abs/fake_post_2",
        "hashtags": ["Quantum", "ErrorCorrection"],
        "category": "Physics",
        "image_url": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80",
        "likes": 890,
        "comments": 156,
    },
    {
        "id": "fake_post_3",
        "title": "Neuromorphic Hardware for Energy-Efficient Edge AI",
        "summary": "We present a spiking neural network chip architecture that achieves 100x energy efficiency improvements for computer vision tasks on the edge.",
        "full_summary": "We present a spiking neural network chip architecture that achieves 100x energy efficiency improvements for computer vision tasks on the edge, mimicking the event-driven nature of biological brains.",
        "authors": ["Carver Mead"],
        "poster_name": "Carver Mead",
        "poster_handle": "@cmead",
        "published": "2026-07-26T09:15:00Z",
        "link": "https://arxiv.org/abs/fake_post_3",
        "hashtags": ["Neuromorphic", "EdgeAI", "Hardware"],
        "category": "Engineering",
        "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
        "likes": 450,
        "comments": 89,
    },
    {
        "id": "fake_post_4",
        "title": "Advances in Multi-Agent Reinforcement Learning",
        "summary": "Addressing the non-stationarity problem in MARL through a novel centralized training, decentralized execution framework with communication protocols.",
        "full_summary": "Addressing the non-stationarity problem in MARL through a novel centralized training, decentralized execution framework with communication protocols. Results show superior coordination in complex zero-sum games.",
        "authors": ["Demis Hassabis", "David Silver"],
        "poster_name": "Demis Hassabis",
        "poster_handle": "@dhassabis",
        "published": "2026-07-25T16:45:00Z",
        "link": "https://arxiv.org/abs/fake_post_4",
        "hashtags": ["RL", "MARL", "Agents"],
        "category": "Artificial Intelligence",
        "image_url": "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=600&q=80",
        "likes": 2100,
        "comments": 540,
    },
    {
        "id": "fake_post_5",
        "title": "CRISPR-Cas9 Off-Target Prediction using Deep Learning",
        "summary": "A transformer-based model predicting CRISPR off-target cleavage sites with 99.8% accuracy, trained on a massive novel dataset of human cell lines.",
        "full_summary": "A transformer-based model predicting CRISPR off-target cleavage sites with 99.8% accuracy, trained on a massive novel dataset of human cell lines. This significantly reduces the risks associated with gene editing therapies.",
        "authors": ["Jennifer Doudna", "Emmanuelle Charpentier"],
        "poster_name": "Jennifer Doudna",
        "poster_handle": "@jdoudna",
        "published": "2026-07-24T11:20:00Z",
        "link": "https://arxiv.org/abs/fake_post_5",
        "hashtags": ["CRISPR", "DeepLearning", "Biology"],
        "category": "Quantitative Biology",
        "image_url": "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&q=80",
        "likes": 1540,
        "comments": 210,
    },
    {
        "id": "fake_post_6",
        "title": "Zero-Shot Translation for Low-Resource Languages",
        "summary": "Leveraging massive multilingual pre-trained models to achieve near-human translation quality for 50+ low-resource languages without parallel corpora.",
        "full_summary": "Leveraging massive multilingual pre-trained models to achieve near-human translation quality for 50+ low-resource languages without parallel corpora. The architecture utilizes cross-lingual alignment in the embedding space.",
        "authors": ["Ilya Sutskever"],
        "poster_name": "Ilya Sutskever",
        "poster_handle": "@ilyasut",
        "published": "2026-07-23T08:00:00Z",
        "link": "https://arxiv.org/abs/fake_post_6",
        "hashtags": ["NLP", "Translation", "ZeroShot"],
        "category": "Natural Language Processing",
        "image_url": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80",
        "likes": 3200,
        "comments": 780,
    },
    {
        "id": "fake_post_7",
        "title": "Homomorphic Encryption for Secure Cloud Computing",
        "summary": "A new lattice-based fully homomorphic encryption scheme that reduces computational overhead by 60%, making secure cloud operations practical.",
        "full_summary": "A new lattice-based fully homomorphic encryption scheme that reduces computational overhead by 60%, making secure cloud operations practical for real-time analytics and machine learning inference on encrypted data.",
        "authors": ["Craig Gentry"],
        "poster_name": "Craig Gentry",
        "poster_handle": "@cgentry",
        "published": "2026-07-22T13:10:00Z",
        "link": "https://arxiv.org/abs/fake_post_7",
        "hashtags": ["Cryptography", "Security", "FHE"],
        "category": "Cryptography & Security",
        "image_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
        "likes": 950,
        "comments": 120,
    },
    {
        "id": "fake_post_8",
        "title": "Generative Models for Material Discovery",
        "summary": "Using diffusion models to generate novel crystal structures with desired thermodynamic stability and electronic properties.",
        "full_summary": "Using diffusion models to generate novel crystal structures with desired thermodynamic stability and electronic properties. We synthesize three of the proposed materials and experimentally verify their super-conducting properties.",
        "authors": ["John Goodenough"],
        "poster_name": "Material Science Lab",
        "poster_handle": "@matscilab",
        "published": "2026-07-21T10:45:00Z",
        "link": "https://arxiv.org/abs/fake_post_8",
        "hashtags": ["MaterialScience", "GenerativeAI"],
        "category": "Physics",
        "image_url": "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&q=80",
        "likes": 670,
        "comments": 45,
    },
    {
        "id": "fake_post_9",
        "title": "Autonomous Navigation in Unstructured Environments",
        "summary": "A robust SLAM system combined with deep reinforcement learning allows robots to navigate dense forests and rubble without prior mapping.",
        "full_summary": "A robust SLAM system combined with deep reinforcement learning allows robots to navigate dense forests and rubble without prior mapping. Our system demonstrates unprecedented reliability in search-and-rescue simulations.",
        "authors": ["Sebastian Thrun"],
        "poster_name": "Sebastian Thrun",
        "poster_handle": "@sthrun",
        "published": "2026-07-20T15:20:00Z",
        "link": "https://arxiv.org/abs/fake_post_9",
        "hashtags": ["Robotics", "SLAM", "Navigation"],
        "category": "Robotics",
        "image_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80",
        "likes": 1120,
        "comments": 190,
    },
    {
        "id": "fake_post_10",
        "title": "Beyond Backpropagation: Biologically Plausible Learning Rules",
        "summary": "We introduce a local learning rule inspired by spike-timing-dependent plasticity that matches backpropagation performance on ImageNet.",
        "full_summary": "We introduce a local learning rule inspired by spike-timing-dependent plasticity that matches backpropagation performance on ImageNet while eliminating the need for a global error signal, bridging the gap between neuroscience and AI.",
        "authors": ["Yoshua Bengio"],
        "poster_name": "Yoshua Bengio",
        "poster_handle": "@ybengio",
        "published": "2026-07-19T09:30:00Z",
        "link": "https://arxiv.org/abs/fake_post_10",
        "hashtags": ["DeepLearning", "Neuroscience"],
        "category": "Machine Learning",
        "image_url": "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&q=80",
        "likes": 2800,
        "comments": 650,
    }
]

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
        return FAKE_POSTS + posts
    except Exception as e:
        return FAKE_POSTS


@router.get("/trending-topics")
async def get_trending_topics(current_user: User = Depends(get_approved_user)):
    """Returns trending topic metadata for the sidebar"""
    trending_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "trending_topics.json")
    try:
        if os.path.exists(trending_file):
            import json
            with open(trending_file, "r") as f:
                topics = json.load(f)
            if isinstance(topics, list) and len(topics) > 0:
                return topics
    except Exception as e:
        import loguru
        loguru.logger.error(f"Failed to read trending topics: {e}")
        
    return [
        {"tag": tag, "label": label, "category": cat}
        for cat, (label, tag) in ARXIV_CATEGORIES.items()
    ]

@router.get("/recommendations")
async def get_recommendations(current_user: User = Depends(get_approved_user)):
    """Fetch personalized paper recommendations via LangGraph agent."""
    try:
        from agent.recommender import get_paper_recommendations
        papers = await get_paper_recommendations(current_user.id)
        
        # Add basic mapping so frontend explore feed can parse it
        mapped_papers = []
        for p in papers:
            # handle Semantic Scholar specific keys
            mapped_papers.append({
                "id": p.get("paperId", "unknown"),
                "title": p.get("title", "Untitled"),
                "summary": p.get("abstract", "")[:280] + ("..." if p.get("abstract") else ""),
                "full_summary": p.get("abstract", ""),
                "authors": [a.get("name", "") for a in p.get("authors", [])][:3],
                "poster_name": "Semantic Scholar Agent",
                "poster_handle": "@aria_agent",
                "published": str(p.get("year", "")),
                "link": p.get("url", ""),
                "hashtags": ["Recommendation"],
                "category": "Recommended",
                "image_url": TOPIC_IMAGES["default"],
                "likes": p.get("citationCount", 0),
                "comments": 0
            })
        return mapped_papers
    except Exception as e:
        import traceback
        traceback.print_exc()
        return []

