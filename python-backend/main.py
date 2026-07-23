"""
FastAPI backend for Mock Interview (Chatbot) module.
Wraps the existing InterviewAnalyzer ML pipeline from AI_Final.
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import pandas as pd
import random
import os
import secrets
from starlette.requests import Request
from starlette.responses import JSONResponse
from model import InterviewAnalyzer

app = FastAPI(title="Mock Interview API", version="1.0.0")
logger = logging.getLogger(__name__)
environment = os.getenv("ENVIRONMENT", "development").strip().lower()
service_key = os.getenv("INTERNAL_SERVICE_KEY", "").strip()
if environment == "production" and not service_key:
    raise RuntimeError("INTERNAL_SERVICE_KEY is required in production.")


@app.middleware("http")
async def require_internal_service_key(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)
    provided = request.headers.get("x-prepora-service-key", "")
    if service_key and secrets.compare_digest(provided, service_key):
        return await call_next(request)
    if not service_key and environment != "production":
        return await call_next(request)
    return JSONResponse({"detail": "Unauthorized"}, status_code=401)

# Browser access is normally unnecessary because Next.js proxies this service,
# but explicit origins remain configurable for local diagnostics.
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "BACKEND_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Prepora-Service-Key"],
)

# Singleton analyzer — loaded once at startup
analyzer = InterviewAnalyzer()

# ── CSV helpers ─────────────────────────────────────────────────────────────
CSV_PATH = os.path.join(os.path.dirname(__file__), "Mock_interview_questions.csv")

def load_df() -> pd.DataFrame:
    for enc in ("utf-8", "latin1", "cp1252"):
        try:
            return pd.read_csv(CSV_PATH, encoding=enc)
        except UnicodeDecodeError:
            continue
    raise RuntimeError("Could not read CSV with any known encoding.")

_df: pd.DataFrame | None = None

def get_df() -> pd.DataFrame:
    global _df
    if _df is None:
        _df = load_df()
    return _df


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/categories")
def get_categories():
    """Return every unique category name in the CSV."""
    df = get_df()
    categories = sorted(df["questions/category"].dropna().unique().tolist())
    return {"categories": categories}


@app.get("/questions")
def get_questions(
    categories: str = Query(..., description="Comma-separated category names"),
    limit: int = Query(10, ge=1, le=200),
):
    """Return `limit` randomly-shuffled questions from the given categories."""
    df = get_df()
    cat_list = [c.strip() for c in categories.split(",") if c.strip()]
    if not cat_list:
        raise HTTPException(status_code=400, detail="No categories provided.")

    filtered = df[df["questions/category"].isin(cat_list)]
    all_questions = filtered["questions/question"].dropna().tolist()

    if not all_questions:
        raise HTTPException(
            status_code=404,
            detail=f"No questions found for categories: {cat_list}",
        )

    random.shuffle(all_questions)
    selected = all_questions[:limit]
    return {"questions": selected, "total": len(all_questions)}


class AnalyzeRequest(BaseModel):
    question: str
    answer: str


@app.post("/analyze")
def analyze_response(body: AnalyzeRequest):
    """Run the ML pipeline on a candidate's answer and return scores + feedback."""
    question = body.question.strip()
    answer = body.answer.strip()
    if not question or not answer:
        raise HTTPException(status_code=400, detail="Question and answer are required.")
    if len(question) > 2_000 or len(answer) > 20_000:
        raise HTTPException(status_code=413, detail="The interview response is too large.")

    try:
        result = analyzer.analyze_response(question, answer)
        return result
    except Exception:
        logger.exception("Interview response analysis failed")
        raise HTTPException(status_code=500, detail="Analysis failed.")
