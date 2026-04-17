<div align="center">

<br/>

```
 █████╗ ██████╗ ██╗ █████╗
██╔══██╗██╔══██╗██║██╔══██╗
███████║██████╔╝██║███████║
██╔══██║██╔══██╗██║██╔══██║
██║  ██║██║  ██║██║██║  ██║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
```

# Automated Research Intelligence Agent

**A self-operating research pipeline that ingests RSS feeds, deduplicates articles semantically, clusters them by topic, and synthesizes AI-generated research digests — autonomously**

<br/>

[![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-Backend-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![LangChain](https://img.shields.io/badge/LangChain-LLM_Pipeline-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain.com)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-0A0A0A?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.ai)
[![FAISS](https://img.shields.io/badge/FAISS-Vector_Store-0078D4?style=for-the-badge&logo=meta&logoColor=white)](https://faiss.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](LICENSE)

<br/>

</div>

---

## ![overview](https://img.shields.io/badge/-Overview-1a1a2e?style=flat-square&logo=readme&logoColor=white) Overview

**A.R.I.A** is a fully autonomous research intelligence agent that replaces manual news curation. It continuously monitors user-defined RSS feeds, computes semantic vector embeddings to deduplicate near-identical articles, groups remaining content into topic clusters using K-Means, and synthesises each cluster into a cohesive human-readable digest using a local large language model — all without user intervention.

The result is delivered as a structured **Daily Thesis** accessible through a responsive web dashboard, complete with a full archive library and an interactive LLM chat interface.

---

## ![pipeline](https://img.shields.io/badge/-How_It_Works-1a1a2e?style=flat-square&logo=diagrams.net&logoColor=white) How It Works — 5-Stage Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                        A.R.I.A Pipeline                             │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
          ┌──────────────────────▼──────────────────────┐
          │  Stage 1 — INGEST  (agent/ingest.py)        │
          │  Monitors RSS feeds · Extracts raw articles  │
          └──────────────────────┬──────────────────────┘
                                 │
          ┌──────────────────────▼──────────────────────┐
          │  Stage 2 — VECTOR STORE  (agent/vectorstore) │
          │  FAISS embeddings · Semantic deduplication   │
          └──────────────────────┬──────────────────────┘
                                 │
          ┌──────────────────────▼──────────────────────┐
          │  Stage 3 — CLUSTER  (agent/cluster.py)      │
          │  K-Means clustering · Topic grouping         │
          └──────────────────────┬──────────────────────┘
                                 │
          ┌──────────────────────▼──────────────────────┐
          │  Stage 4 — SUMMARISE  (agent/summarise.py)  │
          │  LangChain + Ollama · Digest synthesis       │
          └──────────────────────┬──────────────────────┘
                                 │
          ┌──────────────────────▼──────────────────────┐
          │  Stage 5 — DELIVER  (agent/deliver.py)      │
          │  Archive · Structure · Web dashboard render  │
          └─────────────────────────────────────────────┘
```

| Stage | Module | Technology | Description |
|---|---|---|---|
| ![](https://img.shields.io/badge/1-Ingest-0EA5E9?style=flat-square) | `agent/ingest.py` | RSS / feedparser | Continuously monitors and extracts articles from user-defined RSS feeds |
| ![](https://img.shields.io/badge/2-Vector_Store-6366F1?style=flat-square) | `agent/vectorstore.py` | FAISS + embeddings | Computes semantic embeddings and deduplicates near-identical articles |
| ![](https://img.shields.io/badge/3-Cluster-8B5CF6?style=flat-square) | `agent/cluster.py` | Scikit-learn KMeans | Groups unique articles into coherent topic clusters |
| ![](https://img.shields.io/badge/4-Summarise-F59E0B?style=flat-square) | `agent/summarise.py` | LangChain + Ollama | Synthesises each cluster into a single human-readable briefing via local LLM |
| ![](https://img.shields.io/badge/5-Deliver-22C55E?style=flat-square) | `agent/deliver.py` | Flask + SQLite | Archives results and renders the structured digest to the web dashboard |

---

## ![features](https://img.shields.io/badge/-Key_Features-1a1a2e?style=flat-square&logo=todoist&logoColor=white) Key Features

| | Feature | Description |
|---|---|---|
| ![](https://img.shields.io/badge/Daily_Thesis-0EA5E9?style=flat-square&logo=googlechrome&logoColor=white) | **Personalised Dashboard** | AI-driven high-level conclusions from your tracked sectors, refreshed autonomously |
| ![](https://img.shields.io/badge/Library_%26_Archive-6366F1?style=flat-square&logo=bookstack&logoColor=white) | **Library & Archives** | Chronological preservation of every article and digest A.R.I.A has processed |
| ![](https://img.shields.io/badge/LLM_Chat-F59E0B?style=flat-square&logo=openai&logoColor=white) | **Chat Interface** | Interactive chat environment to query concepts directly via the local Ollama LLM |
| ![](https://img.shields.io/badge/Auto_Schedule-22C55E?style=flat-square&logo=clockify&logoColor=white) | **Background Scheduler** | Standalone `scheduler.py` triggers digest runs autonomously at configured intervals |
| ![](https://img.shields.io/badge/Dark_Mode-1a1a2e?style=flat-square&logo=halfmoon&logoColor=white) | **Dynamic Theming** | True dark mode with UI animations and physical hover transitions |
| ![](https://img.shields.io/badge/Mobile_Ready-EA4335?style=flat-square&logo=android&logoColor=white) | **Mobile Responsive** | Fully usable on mobile with an intuitive sliding app drawer |

---

## ![stack](https://img.shields.io/badge/-Tech_Stack-1a1a2e?style=flat-square&logo=stackshare&logoColor=white) Tech Stack

```
┌──────────────┐  ┌────────────────────────────────────────────────────┐
│  BACKEND     │  │  Python · Flask · SQLAlchemy · SQLite               │
├──────────────┤  ├────────────────────────────────────────────────────┤
│  DATA / ML   │  │  FAISS Vector DB · Scikit-learn (KMeans)           │
├──────────────┤  ├────────────────────────────────────────────────────┤
│  LLM LAYER   │  │  LangChain · Ollama · qwen2.5:0.5b (or equiv.)     │
├──────────────┤  ├────────────────────────────────────────────────────┤
│  FRONTEND    │  │  HTML5 · CSS3 · Vanilla JS · Jinja2 Templates      │
├──────────────┤  ├────────────────────────────────────────────────────┤
│  SCHEDULER   │  │  scheduler.py — standalone background job runner   │
└──────────────┘  └────────────────────────────────────────────────────┘
```

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=flat-square&logo=flask&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white)
![FAISS](https://img.shields.io/badge/FAISS-0078D4?style=flat-square&logo=meta&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat-square&logo=langchain&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-0A0A0A?style=flat-square&logo=ollama&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Jinja2](https://img.shields.io/badge/Jinja2-B41717?style=flat-square&logo=jinja&logoColor=white)

---

## ![structure](https://img.shields.io/badge/-Project_Structure-1a1a2e?style=flat-square&logo=files&logoColor=white) Project Structure

```
aria/
│
├── agent/
│   ├── ingest.py           # Stage 1 — RSS feed monitoring and article extraction
│   ├── vectorstore.py      # Stage 2 — FAISS embedding computation and deduplication
│   ├── cluster.py          # Stage 3 — K-Means topic clustering
│   ├── summarise.py        # Stage 4 — LangChain + Ollama digest synthesis
│   └── deliver.py          # Stage 5 — Archive, structure, and dashboard delivery
│
├── templates/              # Jinja2 HTML templates for Flask routes
├── static/                 # CSS, JS, and UI assets
│
├── scheduler.py            # Standalone background job runner
├── app.py                  # Flask application entry point
├── models.py               # SQLAlchemy database models
├── requirements.txt        # Python dependencies
├── .env                    # Environment configuration (not tracked)
└── README.md
```

---

## ![start](https://img.shields.io/badge/-Getting_Started-1a1a2e?style=flat-square&logo=dependabot&logoColor=white) Getting Started

### Prerequisites

![Python](https://img.shields.io/badge/Python-3.x_required-3776AB?style=flat-square&logo=python&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-running_locally-0A0A0A?style=flat-square&logo=ollama&logoColor=white)
![pip](https://img.shields.io/badge/pip-package_manager-3775A9?style=flat-square&logo=pypi&logoColor=white)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/aria.git
cd aria
```

**2. Install dependencies**
```bash
pip install -r requirements.txt
```

**3. Configure environment variables**

Create a `.env` file in the project root:
```env
SECRET_KEY="your-secure-secret-key"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:0.5b"
```

**4. Pull the Ollama model**
```bash
ollama pull qwen2.5:0.5b
```

**5. Run the application**
```bash
python app.py
```

**6. (Optional) Start the background scheduler**
```bash
python scheduler.py
```

> Navigate to **`http://localhost:5000`** to access the A.R.I.A dashboard.

---

## ![env](https://img.shields.io/badge/-Environment_Configuration-1a1a2e?style=flat-square&logo=dotenv&logoColor=white) Environment Configuration

| Variable | Description |
|---|---|
| `SECRET_KEY` | Flask session secret key — use a strong random string |
| `OLLAMA_BASE_URL` | Base URL of the Ollama server (local or remote GPU host) |
| `OLLAMA_MODEL` | Ollama model name to use for synthesis (e.g. `qwen2.5:0.5b`) |

> A.R.I.A supports both local and remote Ollama execution paths. If offloading tensor computation to a secondary GPU host, ensure the `OLLAMA_BASE_URL` points to the correct network address.

---

## ![scheduler](https://img.shields.io/badge/-Background_Scheduler-1a1a2e?style=flat-square&logo=clockify&logoColor=white) Background Scheduler

The standalone `scheduler.py` script triggers full pipeline runs at configured intervals without user intervention — enabling A.R.I.A to operate as a true background research agent.

```bash
# Run the scheduler in the background
python scheduler.py &

# Or keep it in the foreground to monitor output
python scheduler.py
```

> Ensure all Python dependencies are installed before activating the scheduler. The scheduler respects the same `.env` configuration as the main application.

---

## ![future](https://img.shields.io/badge/-Future_Enhancements-1a1a2e?style=flat-square&logo=githubactions&logoColor=white) Future Enhancements

| Enhancement | Description |
|---|---|
| ![](https://img.shields.io/badge/User_Auth-grey?style=flat-square&logo=jsonwebtokens&logoColor=white) | Per-user RSS feed configuration and personalised digest history |
| ![](https://img.shields.io/badge/Push_Notifications-grey?style=flat-square&logo=googlechrome&logoColor=white) | Browser push alerts when a new Daily Thesis is ready |
| ![](https://img.shields.io/badge/REST_API-grey?style=flat-square&logo=fastapi&logoColor=white) | FastAPI layer for programmatic digest access and feed management |
| ![](https://img.shields.io/badge/Cloud_LLM-grey?style=flat-square&logo=openai&logoColor=white) | OpenAI / Anthropic API fallback when local Ollama is unavailable |
| ![](https://img.shields.io/badge/Email_Digest-grey?style=flat-square&logo=gmail&logoColor=white) | Scheduled email delivery of the Daily Thesis to subscribed users |
| ![](https://img.shields.io/badge/Source_Expansion-grey?style=flat-square&logo=rss&logoColor=white) | Support for non-RSS sources — Twitter/X, Reddit, arXiv, Hacker News |
| ![](https://img.shields.io/badge/Multi--LLM-grey?style=flat-square&logo=huggingface&logoColor=white) | Configurable LLM backend — Ollama, HuggingFace, Groq, or LM Studio |
| ![](https://img.shields.io/badge/Docker-grey?style=flat-square&logo=docker&logoColor=white) | Full Docker Compose setup for portable one-command deployment |

---

<div align="center">

Built to turn information overload into structured intelligence

[![Made with Python](https://img.shields.io/badge/Made_with-Python-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Powered by Ollama](https://img.shields.io/badge/Powered_by-Ollama-0A0A0A?style=flat-square&logo=ollama&logoColor=white)](https://ollama.ai)
[![MIT License](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE)

</div>