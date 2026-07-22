import os
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.admin import router as admin_router
from app.api.settings import router as settings_router
from app.api.chat import chat_router
from app.api.analytics import router as analytics_router
from app.api.explore import router as explore_router
from app.api.export import router as export_router
from app.api.agents import router as agents_router
from dotenv import load_dotenv
from loguru import logger
from scheduler import init_scheduler
from app.middleware.rate_limit import RateLimitMiddleware

load_dotenv()

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="A.R.I.A API")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {exc}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "detail": "An internal server error occurred."}
    )

# CORS middleware for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting middleware (100 requests per minute)
app.add_middleware(RateLimitMiddleware, max_requests=100, window_seconds=60)

# Include routers
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(admin_router)
app.include_router(settings_router)
app.include_router(chat_router)
app.include_router(analytics_router)
app.include_router(explore_router)
app.include_router(export_router)
app.include_router(agents_router)

# Mount React static files in production
CLIENT_DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "client", "dist")

@app.on_event("startup")
def on_startup():
    logger.add("logs/engine.log", rotation="10 MB")
    init_scheduler(app)

if os.path.exists(CLIENT_DIST):
    app.mount("/", StaticFiles(directory=CLIENT_DIST, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
