# A.R.I.A Research Digest

A.R.I.A (Autonomous Research Intelligence Assistant) is a modern web application that automatically curates, summarizes, and delivers personalized research digests. It features an integrated RAG-based AI chat assistant to help users interact with and understand research papers.

## Architecture

The project consists of two main components:
- **Backend**: FastAPI (Python) serving a REST API, managing the SQLite database (SQLAlchemy), and handling background tasks (scheduler) and AI orchestration (RAG/NVIDIA).
- **Frontend**: React 19 (TypeScript) built with Vite and Tailwind CSS.

## Features

- **Personalized Digests**: Ingests RSS feeds (like arXiv) and generates summarized digest clusters using LLMs.
- **AI Chat Assistant**: RAG-powered chat that utilizes context from your saved papers, uploads, and library.
- **Research Library**: Save/pin papers from arXiv or specific URLs for future reference.
- **Analytics**: Visualize your reading habits and digest statistics with interactive charts (supports light and dark mode).
- **Admin Dashboard**: Manage user access requests, payment tiers, and verification documents.
- **Modern UI**: Fully responsive, beautiful interface with smooth micro-animations and proper dark mode support.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python (3.10+)
- An API Key for the LLM (e.g., NVIDIA NIM API Key)

### 1. Setup the Backend

```bash
cd app
python -m venv venv
# Windows: venv\Scripts\activate
# Unix: source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the root or `app/` directory (depending on your setup) containing your API keys and configuration:

```env
SECRET_KEY=your_secure_secret_key
NVIDIA_API_KEY=your_nvidia_api_key
# Other necessary variables...
```

Run the backend server:
```bash
python main.py
```
*The API usually runs on `http://127.0.0.1:5000`.*

### 2. Setup the Frontend

```bash
cd client
npm install
```

Start the Vite development server:
```bash
npm run dev
```

The app should now be accessible, typically at `http://localhost:5173`. The Vite config automatically proxies `/api` requests to `http://127.0.0.1:5000`.

## Production Build

To build the frontend for production:

```bash
cd client
npm run build
```
This will output the optimized static files into the `client/dist` directory. The FastAPI backend is configured to mount and serve these static files in production mode.

## Project Structure

```
research-digest/
├── app/                  # FastAPI backend
│   ├── api/              # API routers (auth, dashboard, chat, admin, analytics)
│   ├── models.py         # SQLAlchemy models
│   ├── database.py       # Database connection
│   └── ...
├── client/               # React frontend
│   ├── src/
│   │   ├── pages/        # React views (Dashboard, Chat, Explore, Analytics, etc.)
│   │   ├── components/   # Reusable UI components
│   │   └── App.tsx       # Main router setup
│   ├── package.json
│   └── vite.config.ts
├── data/                 # SQLite database and verification docs
├── logs/                 # Engine logs
├── scheduler.py          # Background task scheduler
├── main.py               # Application entry point
└── README.md             # This file
```

## Contributing

Feel free to fork, open PRs, or submit issues if you find any bugs or have feature requests.
