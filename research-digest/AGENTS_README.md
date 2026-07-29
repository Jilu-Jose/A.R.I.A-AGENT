# A.R.I.A Agent Architecture Details

This document provides a detailed breakdown of the AI agents within the A.R.I.A (AI Research Intelligence Assistant) system. These autonomous and semi-autonomous agents combine Large Language Models (LLMs) with Model Context Protocol (MCP) tools to perform complex multi-step research workflows.

## Core Utility Agents

These agents form the backbone of the A.R.I.A processing pipeline.

### 1. Ingest Agent (`ingest.py`)
- **Purpose**: Automates the collection of raw data from various sources (primarily RSS feeds like arXiv).
- **Functionality**: Monitors sources for new research papers, extracts metadata (title, abstract, link, publication date), and prepares this data for downstream processing.

### 2. Summarise Agent (`summarise.py`)
- **Purpose**: Generates concise, readable summaries of ingested research papers.
- **Functionality**: Uses LLMs to condense complex abstracts or full texts into easily digestible formats (e.g., TL;DRs) and digest segments.

### 3. Cluster Agent (`cluster.py`)
- **Purpose**: Groups related research papers together based on semantic similarity.
- **Functionality**: Uses embeddings to identify themes and topics across the latest research, allowing the system to present a unified digest of connected papers rather than a random list.

### 4. Router Agent (`router.py`)
- **Purpose**: Acts as an intelligent supervisor, dynamically routing user natural language queries to the appropriate specialized agent.
- **Functionality**: Evaluates the user query and categorizes it into defined intents (e.g., `REVIEW`, `GAP`, `COLLABORATORS`, `CHAT`). Based on the classification, it directs the query to the proper handling module.

### 5. Deliver Agent (`deliver.py`)
- **Purpose**: Handles the distribution of generated insights and digests.
- **Functionality**: Responsible for scheduling and sending outputs to the user via preferred channels (e.g., Slack, email, dashboard notifications).

---

## Specialized Research Agents

These are the advanced autonomous agents designed to assist with deep research, discovery, and collaboration.

### 6. Deep Paper Analyst Agent (`paper_analyst.py`)
- **Purpose**: Automatically generates a comprehensive analysis of a paper when a user saves it to their Library.
- **Inputs**: Paper ID, Title, URL, Abstract, and external context.
- **Outputs**:
  - Motivation (The problem being solved)
  - Methodology (How it was solved)
  - Results (Key findings)
  - Limitations (What's missing)
  - Impact statement (Plain language "So What?")
  - Bullet-point highlights for margin notes.
- **MCP Tools Utilized**: Semantic Scholar MCP, Brave Search MCP (fallback), Filesystem MCP.

### 7. Citation Network Agent (`citation_network.py`)
- **Purpose**: Builds and visualizes citation relationships between papers.
- **Functionality**: Analyzes the user's library to identify foundational papers (most cited ancestors) and emerging work. Creates graph data showing citation velocity and connections for the frontend.
- **MCP Tools Utilized**: Semantic Scholar MCP, Memory MCP.

### 8. Research Trend Detector Agent (`trend_detector.py`)
- **Purpose**: Runs on a schedule to identify emerging topics, rising keywords, and breakout papers in a specific field.
- **Outputs**: Weekly "Trending" reports, keyword frequency heatmaps, and identification of papers with unusual citation velocity.
- **MCP Tools Utilized**: Brave Search MCP, Semantic Scholar MCP, Memory MCP.

### 9. Literature Review Agent (`literature_review.py`)
- **Purpose**: Autonomously performs mini systematic reviews based on a user's research question.
- **Workflow**: Searches Semantic Scholar/arXiv → Filters by date and relevance → Reads top abstracts → Clusters into sub-themes → Generates a structured review with citations.
- **MCP Tools Utilized**: Semantic Scholar MCP, Brave Search MCP, Memory MCP.

### 10. Research Gap Finder Agent (`gap_finder.py`)
- **Purpose**: Analyzes a body of work to identify underexplored areas, contradictions, or open questions.
- **Functionality**: Scans multiple related papers to highlight what hasn't been studied, where findings conflict, and suggests future research directions.
- **MCP Tools Utilized**: Semantic Scholar MCP, Memory MCP.

### 11. Paper Recommender Agent (`recommender.py`)
- **Purpose**: A personalized recommendation engine that suggests new papers based on the user's reading history and stated interests.
- **Functionality**: Builds a user interest profile using the Memory MCP, fetches new papers, scores relevance using embedding similarity, and populates a "Recommended for You" feed.
- **MCP Tools Utilized**: Semantic Scholar MCP, Memory MCP, Brave Search MCP.

### 12. Collaborator Finder Agent (`collaborator_finder.py`)
- **Purpose**: Identifies potential collaborators for a given research topic or paper.
- **Functionality**: Analyzes author networks, shared references, and complementary expertise to output author profiles with h-indexes, collaboration scores, and shared reference analysis.
- **MCP Tools Utilized**: Semantic Scholar MCP, GitHub MCP.

### 13. Auto-Annotator Agent (`auto_annotator.py`)
- **Purpose**: Processes uploaded PDFs to extract key information and generate margin notes.
- **Functionality**: Automatically highlights key findings, extracts tables and figures with captions, pulls key statistics, and generates linked definitions for domain-specific terms for rapid skimming.
- **MCP Tools Utilized**: Filesystem MCP, Memory MCP.
