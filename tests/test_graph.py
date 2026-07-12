"""
tests/test_graph.py
Integration test — runs the full pipeline on stub data.
Mocks all LLM and API calls so no real requests are made.

Run: pytest tests/test_graph.py -v
"""

import pytest
from unittest.mock import patch, MagicMock
from alphaagents.graph.state import get_initial_state


def make_orchestrator_output():
    m = MagicMock()
    m.company = "HDFC Bank"
    m.ticker = "HDFCBANK.NS"
    m.plan = ["Research financials", "Check news"]
    m.sub_questions = ["What is revenue?", "What are risks?"]
    return m


def make_writer_output():
    m = MagicMock()
    m.investment_thesis = "Strong bank [Source: https://example.com]"
    m.financial_summary = "PE 18x [Source: https://example.com]"
    m.recent_developments = "Q4 profit up [Source: https://example.com]"
    m.key_risks = "RISK 1: NIM [Source: https://example.com]\nRISK 2: Reg [Source: https://example.com]\nRISK 3: Competition [Source: https://example.com]"
    m.comparable_companies = "ICICI at 20x [Source: https://example.com]"
    m.recommendation = "BUY — target ₹2100 [Source: https://example.com]"
    return m


def make_critic_output_pass():
    m = MagicMock()
    m.passed = True
    m.issues = []
    m.feedback = ""
    m.quality_score = 8
    return m


FAKE_WEB_RESULTS = [
    {"question": "What is revenue?", "summary": "Revenue grew 9% [Source: https://example.com]", "sources": ["https://example.com"]}
]

FAKE_FINANCIAL_DATA = {
    "company_name": "HDFC Bank",
    "current_price": 1842,
    "market_cap": "₹13.9T",
    "pe_ratio": 18.4,
    "roe": "16.8%",
    "net_profit_margin": "22.1%",
    "metrics_summary": "Trades at 18.4x",
    "growth_summary": "Revenue up 9%",
    "balance_sheet_summary": "D/E 0.82x",
    "overall_assessment": "Fundamentally strong",
    "debt_to_equity": 0.82,
    "revenue_growth_yoy": "9.4%",
}

FAKE_NEWS_DATA = [{
    "sentiment": "positive",
    "sentiment_reason": "Strong Q4 results",
    "has_news": True,
    "key_events": [{"headline": "Q4 profit up", "significance": "Beat estimates", "source_url": "https://example.com", "published_at": "2026-07-05"}],
}]


def test_full_pipeline_produces_final_note():
    """Full pipeline from query to final note, all LLM/API calls mocked."""

    with patch("alphaagents.agents.orchestrator._get_llm") as mock_orch_llm, \
         patch("alphaagents.tools.search.search", return_value=FAKE_WEB_RESULTS[0:1]), \
         patch("alphaagents.tools.finance.get_fundamentals", return_value=FAKE_FINANCIAL_DATA), \
         patch("alphaagents.tools.news.get_news", return_value=[]), \
         patch("alphaagents.agents.web_researcher._get_llm") as mock_web_llm, \
         patch("alphaagents.agents.financial_data._get_llm") as mock_fin_llm, \
         patch("alphaagents.agents.news_agent._get_llm") as mock_news_llm, \
         patch("alphaagents.agents.writer._get_llm") as mock_writer_llm, \
         patch("alphaagents.agents.critic._get_llm") as mock_critic_llm:

        # Mock orchestrator
        mock_orch_llm.return_value.with_structured_output.return_value.invoke.return_value = make_orchestrator_output()

        # Mock web researcher
        web_result = MagicMock()
        web_result.question = "What is revenue?"
        web_result.summary = "Revenue grew 9% [Source: https://example.com]"
        web_result.sources = ["https://example.com"]
        mock_web_llm.return_value.with_structured_output.return_value.invoke.return_value = web_result

        # Mock financial data agent
        fin_result = MagicMock()
        fin_result.ticker = "HDFCBANK.NS"
        fin_result.company_name = "HDFC Bank"
        fin_result.metrics_summary = "Trades at 18.4x PE"
        fin_result.growth_summary = "Revenue up 9%"
        fin_result.balance_sheet_summary = "D/E 0.82x"
        fin_result.overall_assessment = "Fundamentally strong"
        mock_fin_llm.return_value.with_structured_output.return_value.invoke.return_value = fin_result

        # Mock news agent
        news_result = MagicMock()
        news_result.sentiment = "neutral"
        news_result.sentiment_reason = "No significant news"
        news_result.has_news = False
        news_result.key_events = []
        mock_news_llm.return_value.with_structured_output.return_value.invoke.return_value = news_result

        # Mock writer
        mock_writer_llm.return_value.with_structured_output.return_value.invoke.return_value = make_writer_output()

        # Mock critic — passes on first try
        mock_critic_llm.return_value.with_structured_output.return_value.invoke.return_value = make_critic_output_pass()

        # Run the pipeline
        from alphaagents.graph.pipeline import run_pipeline
        final_state = run_pipeline("Analyse HDFC Bank for a retail investor")

    # Assertions
    assert final_state is not None
    assert final_state.get("company") == "HDFC Bank"
    assert final_state.get("ticker") == "HDFCBANK.NS"
    assert final_state.get("draft_note") is not None
    assert len(final_state.get("draft_note", "")) > 50
    assert final_state.get("revision_count", 0) == 0
    assert final_state.get("needs_review", True) == False


def test_pipeline_state_has_all_required_keys():
    """All required state keys are present after pipeline completes."""
    required_keys = [
        "query", "company", "ticker", "plan", "sub_questions",
        "web_results", "financial_data", "news_data",
        "draft_note", "critique", "revision_count",
        "needs_review", "hitl_approved", "hitl_feedback", "final_note"
    ]

    with patch("alphaagents.agents.orchestrator._get_llm") as mock_orch, \
         patch("alphaagents.tools.search.search", return_value=[]), \
         patch("alphaagents.tools.finance.get_fundamentals", return_value=FAKE_FINANCIAL_DATA), \
         patch("alphaagents.tools.news.get_news", return_value=[]), \
         patch("alphaagents.agents.web_researcher._get_llm"), \
         patch("alphaagents.agents.financial_data._get_llm") as mock_fin, \
         patch("alphaagents.agents.news_agent._get_llm") as mock_news, \
         patch("alphaagents.agents.writer._get_llm") as mock_writer, \
         patch("alphaagents.agents.critic._get_llm") as mock_critic:

        mock_orch.return_value.with_structured_output.return_value.invoke.return_value = make_orchestrator_output()

        fin_r = MagicMock()
        fin_r.ticker = "HDFCBANK.NS"
        fin_r.company_name = "HDFC Bank"
        fin_r.metrics_summary = "x"
        fin_r.growth_summary = "x"
        fin_r.balance_sheet_summary = "x"
        fin_r.overall_assessment = "x"
        mock_fin.return_value.with_structured_output.return_value.invoke.return_value = fin_r

        news_r = MagicMock()
        news_r.sentiment = "neutral"
        news_r.sentiment_reason = "No news"
        news_r.has_news = False
        news_r.key_events = []
        mock_news.return_value.with_structured_output.return_value.invoke.return_value = news_r

        mock_writer.return_value.with_structured_output.return_value.invoke.return_value = make_writer_output()
        mock_critic.return_value.with_structured_output.return_value.invoke.return_value = make_critic_output_pass()

        from alphaagents.graph.pipeline import run_pipeline
        final_state = run_pipeline("Analyse HDFC Bank")

    for key in required_keys:
        assert key in final_state, f"Missing key: {key}"