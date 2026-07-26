# Project A.R.I.A Research Digest - Tech Stack

This document outlines the technology stack used in the Research Digest application, breaking it down into Frontend, Backend, Database, Authentication, and other key integrations.

##  Frontend

The frontend is built for speed, responsiveness, and developer experience, utilizing modern web technologies.

* **Framework:** [React 19](https://react.dev/) - A JavaScript library for building user interfaces.
* **Build Tool:** [Vite](https://vitejs.dev/) - A fast frontend tooling and development server.
* **Language:** [TypeScript](https://www.typescriptlang.org/) - Adds static typing to JavaScript for better developer experience and code quality.
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development.
* **Routing:** [React Router DOM](https://reactrouter.com/) - For handling navigation within the single-page application.
* **HTTP Client:** [Axios](https://axios-http.com/) - For making API requests to the backend.
* **Icons:** [Lucide React](https://lucide.dev/) - A beautiful and consistent icon toolkit.
* **Data Visualization:** [Recharts](https://recharts.org/) - A composable charting library built on React components.

##  Backend

The backend is a robust RESTful API designed for high performance and easy integration with AI components.

* **Framework:** [FastAPI](https://fastapi.tiangolo.com/) - A modern, fast (high-performance) web framework for building APIs with Python.
* **Server:** [Uvicorn](https://www.uvicorn.org/) - An ASGI web server implementation for Python.
* **Data Validation:** [Pydantic](https://docs.pydantic.dev/) - Data validation and settings management using Python type annotations (integrated within FastAPI).
* **Scheduling:** [APScheduler](https://apscheduler.readthedocs.io/) - Advanced Python Scheduler for running background tasks (like fetching feeds).

##  Database

The application uses a flexible ORM layer that allows it to run locally with minimal setup or scale up to a more robust database.

* **ORM:** [SQLAlchemy](https://www.sqlalchemy.org/) - The Python SQL toolkit and Object Relational Mapper.
* **Primary Database (Default):** [SQLite](https://www.sqlite.org/) - Used as the default lightweight database (stored locally in `data/aria.db`).
* **Production Database (Supported):** [PostgreSQL](https://www.postgresql.org/) - The application is designed to easily switch to PostgreSQL (and pgvector for vector search) via the `DATABASE_URL` environment variable.

##  Authentication & Security

Security is implemented using industry-standard token-based authentication.

* **Authentication Protocol:** JWT (JSON Web Tokens)
* **JWT Library:** `python-jose` - For encoding and decoding JWT tokens (`HS256` algorithm).
* **Password Hashing:** `bcrypt` (via `passlib`) - Used to securely hash user passwords before storing them in the database.
* **Token Expiration:** Access tokens are configured to expire after 7 days by default.

##  AI & Data Processing

The application heavily relies on AI and machine learning tools for research processing, summarization, and vector search.

* **LLM Orchestration:** [LangChain](https://python.langchain.com/) - Framework for developing applications powered by language models.
* **Model Providers:** Supports both Local Models (`langchain-ollama`) and OpenAI (`langchain-openai`).
* **Vector Database:** [FAISS (Facebook AI Similarity Search)](https://github.com/facebookresearch/faiss) - Used for efficient similarity search and clustering of dense vectors (CPU version).
* **Embeddings:** `sentence-transformers` - Used for generating text embeddings for RAG (Retrieval-Augmented Generation).
* **Web Scraping:** `beautifulsoup4`, `lxml`, and `requests` - Used for parsing and extracting content from web pages and RSS feeds.
* **Feed Parsing:** `feedparser` - Used for parsing RSS and Atom feeds.
* **PDF Generation:** `fpdf2` - Used for generating PDF reports of the research digests.
