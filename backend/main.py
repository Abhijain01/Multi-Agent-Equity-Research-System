"""
backend/main.py
FastAPI application entry point.

Run locally:
  uvicorn backend.main:app --reload --port 8000

API docs:
  http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import research, comparison, export, eval as eval_router, market

app = FastAPI(
    title="FinPilot API",
    description="Multi-Agent Equity Research System — FastAPI Backend",
    version="1.0.0",
)

# CORS — allow Vercel frontend + local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://finpilot.vercel.app",
    ],
    # Star patterns in allow_origins are not supported; use regex for Vercel previews and local dev ports.
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(research.router)
app.include_router(comparison.router)
app.include_router(export.router)
app.include_router(eval_router.router)
app.include_router(market.router)


@app.get("/")
async def root():
    return {
        "name": "FinPilot API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}