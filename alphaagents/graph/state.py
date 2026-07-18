"""
graph/state.py

The shared state object that flows through every node in the LangGraph pipeline.

Why TypedDict instead of Pydantic BaseModel:
LangGraph natively uses TypedDict for state. It passes this dict between
nodes, merging updates at each step. Using Pydantic here would require
extra conversion at every node boundary. TypedDict keeps it clean.

Every agent receives the full state dict and returns a PARTIAL dict
with only the fields it updated. LangGraph merges the update into state.

Example:
    # Orchestrator node returns only what it changed:
    return {
        "company": "Reliance Industries",
        "ticker": "RELIANCE.NS",
        "plan": ["Analyse financials", "Check recent news", ...],
        "sub_questions": ["What is RIL's revenue growth?", ...]
    }
    # LangGraph merges this into the full state automatically.
"""

from typing import TypedDict


class ResearchState(TypedDict):
    """
    The complete state of one research pipeline run.
    Flows through every node from orchestrator to published note.
    """

    # ── Input ──────────────────────────────────────────────────────────
    query: str
    # Raw user query e.g. "Analyse Reliance Industries for a retail investor"

    # ── Orchestrator output ────────────────────────────────────────────
    company: str
    # Clean company name e.g. "Reliance Industries"

    ticker: str
    # NSE ticker symbol e.g. "RELIANCE.NS"

    plan: list[str]
    # High-level research plan steps from orchestrator

    sub_questions: list[str]
    # Specific research questions for the web researcher

    # ── Data agent outputs (all three run in parallel) ─────────────────
    web_results: list[dict]
    # From web_researcher — list of {title, url, content, score}

    financial_data: dict
    # From financial_data agent — structured fundamentals dict from tools/finance.py

    news_data: list[dict]
    # From news_agent — list of {title, source, published_at, description, url}

    # ── Writer output ──────────────────────────────────────────────────
    draft_note: str
    # The 4-6 page equity research note produced by the writer agent

    # ── Critic output ──────────────────────────────────────────────────
    critique: str
    # Feedback from critic if note failed review

    revision_count: int
    # Tracks how many times writer has revised. Hard cap: 2.
    # If revision_count >= 2 and critic still fails → escalate to HITL

    needs_review: bool
    # Set to True when critic fails after 2 revisions
    # HITL UI shows a warning flag when this is True

    # ── HITL output ────────────────────────────────────────────────────
    hitl_approved: bool
    # True when human analyst clicks "Approve"

    hitl_feedback: str
    # Human analyst's revision request (if they clicked "Request Revision")

    # ── Scorer output ───────────────────────────────────────────────────
    scorecard: dict | None
    # From scorer_node — weighted category scores, overall score, verdict,
    # confidence, fair-value view, catalysts. See agents/scorer.py. Only
    # populated once the note is finalised (after critic → hitl).

    # ── Final output ───────────────────────────────────────────────────
    final_note: str
    # The approved, published research note


def get_initial_state(query: str) -> ResearchState:
    """
    Create a fresh state object for a new research run.
    All fields initialised to safe defaults.
    Only `query` is required — everything else gets populated by agents.

    Usage:
        state = get_initial_state("Analyse HDFC Bank for a retail investor")
    """
    return ResearchState(
        query=query,
        company="",
        ticker="",
        plan=[],
        sub_questions=[],
        web_results=[],
        financial_data={},
        news_data=[],
        draft_note="",
        critique="",
        revision_count=0,
        needs_review=False,
        hitl_approved=False,
        hitl_feedback="",
        scorecard=None,
        final_note="",
    )


if __name__ == "__main__":
    # Quick sanity check — run with: python -m alphaagents.graph.state
    state = get_initial_state("Analyse Reliance Industries for a retail investor")
    print("Initial state created successfully:")
    for key, value in state.items():
        print(f"  {key}: {repr(value)}")
    print("\n✅ State schema is valid")