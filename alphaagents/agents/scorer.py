"""
agents/scorer.py

The Scorer Agent — produces the weighted institutional scorecard shown on
the research report: 6 weighted categories (summing to 100%), each with a
0-100 score, a short analysis, and pros/cons, plus an overall score, a
verdict, a confidence level, a fair-value view, and a time horizon.

LangGraph role:
  Runs AFTER the critic approves the note (i.e. right before the pipeline
  hands off to HITL). Uses the same web_results / financial_data / news_data
  the writer used, plus the finished draft_note for context, so the
  scorecard doesn't contradict the note.

Design note on the weights:
  These category weights (Business Quality 18%, Financial Health 20%,
  Valuation 18%, Growth 14%, Competitive Moat 12%, Risk Profile 18%) are a
  fixed, disclosed methodology — not something the LLM invents per-run.
  Keeping them fixed in code (rather than asking the LLM to pick weights)
  means the same category always carries the same importance across every
  report, which is what makes the scorecard comparable stock-to-stock.
"""

import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from alphaagents.graph.state import ResearchState

load_dotenv()

# ── Fixed category weights (must sum to 100) ───────────────────────────────────

CATEGORY_WEIGHTS = {
    "business_quality": 18,
    "financial_health": 20,
    "valuation": 18,
    "growth": 14,
    "competitive_moat": 12,
    "risk_profile": 18,
}
assert sum(CATEGORY_WEIGHTS.values()) == 100, "Category weights must sum to 100"


# ── Output schema ─────────────────────────────────────────────────────────────

class CategoryScore(BaseModel):
    score: int = Field(ge=0, le=100, description="0-100, higher is better in every category, including Risk Profile (100 = low risk).")
    analysis: str = Field(description="2-3 sentences, dense with exact figures from the data provided. No vague adjectives without a number backing them.")
    pros: list[str] = Field(description="2-3 short bullet phrases (3-6 words each), e.g. 'Strong market position'.")
    cons: list[str] = Field(description="1-3 short bullet phrases (3-6 words each), e.g. 'Dependence on GPU demand'.")


class ScoreCard(BaseModel):
    business_quality: CategoryScore = Field(description="Moat durability, revenue quality/recurrence, management execution.")
    financial_health: CategoryScore = Field(description="Profitability, balance-sheet strength, cash generation, liquidity.")
    valuation: CategoryScore = Field(description="Is the current price cheap or expensive vs. earnings/growth/peers? Score high = cheap/attractive.")
    growth: CategoryScore = Field(description="Revenue/earnings growth trajectory and forward runway.")
    competitive_moat: CategoryScore = Field(description="Brand, switching costs, scale/cost advantages, IP, regulatory position.")
    risk_profile: CategoryScore = Field(description="Balance-sheet risk, concentration risk, regulatory/geopolitical risk. Score high = LOW risk.")

    confidence_pct: int = Field(ge=0, le=100, description="How confident is this assessment given the data actually available? Lower if data was sparse or contradictory.")
    fair_value_view: str = Field(description="One sentence: undervalued / fairly valued / overvalued, and the single biggest reason why.")
    time_horizon: str = Field(description="e.g. '12-24 months' — the horizon over which the thesis is expected to play out.")
    key_strengths: list[str] = Field(description="Exactly 3 short bullet phrases — the strongest points across all categories.")
    catalysts_to_watch: list[str] = Field(description="Exactly 3 concrete, near-term events that could move the stock (earnings, product launches, regulatory decisions, etc.), grounded in the news/web data provided.")


# ── LLM client ────────────────────────────────────────────────────────────────

_llm = None

def _get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            api_key=os.getenv("GROQ_API_KEY"),
        )
    return _llm


SCORER_SYSTEM_PROMPT = """You are a senior quantitative research analyst at an institutional
equity research desk. You are scoring a company across 6 fixed categories using ONLY the
financial data, web research, and news provided to you — never invent a number that isn't
in the source data.

Scoring rules:
- Every category score is 0-100. For Risk Profile, 100 means LOW risk (safe), not high risk —
  score it as "how safe is this company", not "how risky".
- Every `analysis` field must cite at least 2 concrete figures from the data provided
  (e.g. "ROE of 18.4%", "debt/equity of 0.82", "PE of 21.7x vs sector avg").
  Do not write vague sentences like "the company has strong financials" without a number.
- Pros/cons are short phrases, not sentences (3-6 words).
- catalysts_to_watch must be concrete and near-term, grounded in the news/web data given —
  not generic ("upcoming earnings" is fine only if an earnings date is actually mentioned
  in the source data; otherwise pick something that IS mentioned).
- confidence_pct should reflect actual data completeness — if financial data has a
  data_warning or news is thin, lower your confidence accordingly, don't default to 90+.
- Never fabricate a statistic. If a metric needed for a category is missing, say so in the
  analysis text and score conservatively rather than inventing a plausible-sounding number.
"""


def _format_context(state: ResearchState) -> str:
    company = state.get("company", "the company")
    ticker = state.get("ticker", "N/A")
    fd = state.get("financial_data", {}) or {}
    news = (state.get("news_data") or [{}])[0]
    web = state.get("web_results", []) or []

    fd_lines = "\n".join(f"  {k}: {v}" for k, v in fd.items() if k not in ("revenue_history", "business_summary"))
    web_lines = "\n".join(
        f"  Q: {w.get('question','')}\n  A: {w.get('summary','')}" for w in web
    )

    return f"""Company: {company} ({ticker})

=== FINANCIAL DATA ===
{fd_lines}

=== NEWS SENTIMENT ===
Sentiment: {news.get('sentiment', 'neutral')} — {news.get('sentiment_reason', 'N/A')}

=== WEB RESEARCH ===
{web_lines}

=== FINISHED RESEARCH NOTE (for context/consistency — do not contradict this) ===
{state.get('draft_note', '')[:3000]}
"""


def _overall_score(scorecard: ScoreCard) -> float:
    """Weighted average of the 6 category scores using the fixed weights."""
    total = 0.0
    for key, weight in CATEGORY_WEIGHTS.items():
        category: CategoryScore = getattr(scorecard, key)
        total += category.score * (weight / 100)
    return round(total, 1)


def _verdict(overall: float) -> str:
    """Deterministic thresholding — not left to the LLM, so verdicts are consistent run-to-run."""
    if overall >= 70:
        return "INVEST"
    if overall >= 45:
        return "HOLD"
    return "AVOID"


# ── Agent function ────────────────────────────────────────────────────────────

def scorer_node(state: ResearchState) -> dict:
    """
    LangGraph node: produces the weighted scorecard for the finished note.

    Returns:
        {"scorecard": dict}  — see ScoreCard schema above, plus computed
        "overall_score", "verdict", and the fixed "weights" for the frontend.
    """
    company = state.get("company", "the company")
    print(f"\n[SCORER] Scoring {company}...")

    llm = _get_llm()
    structured_llm = llm.with_structured_output(ScoreCard)

    messages = [
        SystemMessage(content=SCORER_SYSTEM_PROMPT),
        HumanMessage(content=_format_context(state)),
    ]

    try:
        card: ScoreCard = structured_llm.invoke(messages)
    except Exception as e:
        print(f"[SCORER] ⚠️ Scoring failed: {e} — returning no scorecard")
        return {"scorecard": None}

    overall = _overall_score(card)
    verdict = _verdict(overall)

    result = {
        "overall_score": overall,
        "verdict": verdict,
        "confidence_pct": card.confidence_pct,
        "fair_value_view": card.fair_value_view,
        "time_horizon": card.time_horizon,
        "key_strengths": card.key_strengths,
        "catalysts_to_watch": card.catalysts_to_watch,
        "weights": CATEGORY_WEIGHTS,
        "categories": {
            key: {
                "score": getattr(card, key).score,
                "weight": CATEGORY_WEIGHTS[key],
                "analysis": getattr(card, key).analysis,
                "pros": getattr(card, key).pros,
                "cons": getattr(card, key).cons,
            }
            for key in CATEGORY_WEIGHTS
        },
    }

    print(f"[SCORER] ✅ Overall {overall}/100 — {verdict} (confidence {card.confidence_pct}%)")
    return {"scorecard": result}