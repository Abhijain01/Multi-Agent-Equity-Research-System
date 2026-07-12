"""
tests/test_agents.py
Unit tests for all 5 agents.
Mocks Groq so no real API calls are made.

Run: pytest tests/test_agents.py -v
"""

import pytest
from unittest.mock import patch, MagicMock
from alphaagents.graph.state import get_initial_state


def make_state(company="HDFC Bank", ticker="HDFCBANK.NS"):
    state = get_initial_state(f"Analyse {company} for a retail investor")
    state["company"] = company
    state["ticker"] = ticker
    state["plan"] = ["Gather financials", "Search news"]
    state["sub_questions"] = ["What is revenue growth?", "What are key risks?"]
    state["web_results"] = [
        {"question": "What is revenue growth?", "summary": "Revenue grew 9% YoY [Source: https://example.com]", "sources": ["https://example.com"]}
    ]
    state["financial_data"] = {
        "company_name": company, "current_price": 1842, "market_cap": "₹13.9T",
        "pe_ratio": 18.4, "roe": "16.8%", "net_profit_margin": "22.1%",
        "metrics_summary": "Trades at 18.4x PE.", "growth_summary": "Revenue up 9%.",
        "balance_sheet_summary": "D/E at 0.82x.", "overall_assessment": "Fundamentally strong.",
        "debt_to_equity": 0.82, "revenue_growth_yoy": "9.4%",
    }
    state["news_data"] = [{"sentiment": "positive", "sentiment_reason": "Strong results.", "has_news": True, "key_events": []}]
    state["draft_note"] = "# HDFC Bank\n## Investment Thesis\nStrong bank [Source: https://example.com]\n## Financial Summary\nPE 18.4x [Source: https://example.com]\n## Recent Developments\nQ4 profit up [Source: https://example.com]\n## Key Risks\nRISK 1: NIM — NIM compressed [Source: https://example.com]\nRISK 2: Regulation — RBI rules [Source: https://example.com]\nRISK 3: Competition — Fintech [Source: https://example.com]\n## Comparable Companies\nICICI Bank trades at 20x [Source: https://example.com]\n## Recommendation\nBUY — Target ₹2100 [Source: https://example.com]"
    return state


# ── Orchestrator tests ────────────────────────────────────────────────────────

def test_orchestrator_returns_correct_keys():
    """Orchestrator returns company, ticker, plan, sub_questions."""
    mock_output = MagicMock()
    mock_output.company = "HDFC Bank"
    mock_output.ticker = "HDFCBANK.NS"
    mock_output.plan = ["Step 1", "Step 2"]
    mock_output.sub_questions = ["Q1?", "Q2?"]

    with patch("alphaagents.agents.orchestrator._get_llm") as mock_llm:
        mock_llm.return_value.with_structured_output.return_value.invoke.return_value = mock_output
        from alphaagents.agents.orchestrator import orchestrator_node
        state = get_initial_state("Analyse HDFC Bank")
        result = orchestrator_node(state)

    assert "company" in result
    assert "ticker" in result
    assert "plan" in result
    assert "sub_questions" in result
    assert result["company"] == "HDFC Bank"
    assert result["ticker"] == "HDFCBANK.NS"
    assert isinstance(result["plan"], list)
    assert isinstance(result["sub_questions"], list)


# ── Writer tests ──────────────────────────────────────────────────────────────

def test_writer_returns_draft_note():
    """Writer returns draft_note string."""
    mock_note = MagicMock()
    mock_note.investment_thesis = "Strong bank [Source: https://example.com]"
    mock_note.financial_summary = "PE 18.4x [Source: https://example.com]"
    mock_note.recent_developments = "Q4 profit up [Source: https://example.com]"
    mock_note.key_risks = "RISK 1: NIM — compressed [Source: https://example.com]\nRISK 2: Regulation [Source: https://example.com]\nRISK 3: Competition [Source: https://example.com]"
    mock_note.comparable_companies = "ICICI at 20x [Source: https://example.com]"
    mock_note.recommendation = "BUY — target ₹2100 [Source: https://example.com]"

    with patch("alphaagents.agents.writer._get_llm") as mock_llm:
        mock_llm.return_value.with_structured_output.return_value.invoke.return_value = mock_note
        from alphaagents.agents.writer import writer_node
        state = make_state()
        result = writer_node(state)

    assert "draft_note" in result
    assert isinstance(result["draft_note"], str)
    assert len(result["draft_note"]) > 100
    assert "HDFC Bank" in result["draft_note"]


# ── Critic tests ──────────────────────────────────────────────────────────────

def test_critic_passes_good_note():
    """Critic returns no critique for a well-cited note."""
    mock_output = MagicMock()
    mock_output.passed = True
    mock_output.issues = []
    mock_output.feedback = ""
    mock_output.quality_score = 8

    with patch("alphaagents.agents.critic._get_llm") as mock_llm:
        mock_llm.return_value.with_structured_output.return_value.invoke.return_value = mock_output
        from alphaagents.agents.critic import critic_node
        state = make_state()
        result = critic_node(state)

    assert result["critique"] == ""
    assert result["needs_review"] == False


def test_critic_fails_bad_note_increments_revision():
    """Critic increments revision_count and sets critique on failure."""
    mock_output = MagicMock()
    mock_output.passed = False
    mock_output.issues = ["Missing citation in Financial Summary"]
    mock_output.feedback = "Fix 1: Add citation to PE ratio claim."
    mock_output.quality_score = 4

    with patch("alphaagents.agents.critic._get_llm") as mock_llm:
        mock_llm.return_value.with_structured_output.return_value.invoke.return_value = mock_output
        from alphaagents.agents.critic import critic_node
        state = make_state()
        state["revision_count"] = 0
        result = critic_node(state)

    assert result["revision_count"] == 1
    assert result["critique"] != ""


def test_critic_escalates_after_max_revisions():
    """Critic sets needs_review=True after hitting revision cap."""
    mock_output = MagicMock()
    mock_output.passed = False
    mock_output.issues = ["Still missing citations"]
    mock_output.feedback = "Fix citations."
    mock_output.quality_score = 4

    with patch("alphaagents.agents.critic._get_llm") as mock_llm:
        mock_llm.return_value.with_structured_output.return_value.invoke.return_value = mock_output
        from alphaagents.agents.critic import critic_node
        state = make_state()
        state["revision_count"] = 1  # already had 1 revision
        result = critic_node(state)

    assert result["needs_review"] == True
    assert result["revision_count"] == 2


# ── Conditional edge tests ────────────────────────────────────────────────────

def test_should_revise_returns_hitl_when_passed():
    from alphaagents.agents.critic import should_revise
    state = make_state()
    state["critique"] = ""
    state["needs_review"] = False
    state["revision_count"] = 0
    assert should_revise(state) == "hitl"


def test_should_revise_returns_writer_when_failed():
    from alphaagents.agents.critic import should_revise
    state = make_state()
    state["critique"] = "Missing citations"
    state["needs_review"] = False
    state["revision_count"] = 1
    assert should_revise(state) == "writer"


def test_should_revise_returns_hitl_after_max_revisions():
    from alphaagents.agents.critic import should_revise
    state = make_state()
    state["critique"] = "Still failing"
    state["needs_review"] = True
    state["revision_count"] = 2
    assert should_revise(state) == "hitl"