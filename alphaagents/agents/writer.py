"""
agents/writer.py

The Writer Agent — takes all gathered data and produces a
structured 4-6 page equity research note.

LangGraph role:
  Runs AFTER all three data agents complete.
  Receives state with web_results, financial_data, news_data populated.
  Returns {"draft_note": str}

On revision:
  If the Critic sends the note back, state will have `critique` populated
  and `hitl_feedback` may have human feedback too.
  The writer incorporates both when rewriting.
"""

import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from alphaagents.graph.state import ResearchState
from alphaagents.utils.prompts import WRITER_PROMPT

load_dotenv()

# ── Output schema ─────────────────────────────────────────────────────────────

class ResearchNote(BaseModel):
    """Structured equity research note — all 6 required sections."""

    investment_thesis: str = Field(
        description=(
            "2-3 sentences. The core bull/bear case. What is the single most important "
            "reason to buy, hold, or sell this stock right now? Must include a cited claim."
        )
    )
    financial_summary: str = Field(
        description=(
            "3-5 sentences. Key metrics: revenue, net profit, PE ratio, ROE, margins, "
            "debt-to-equity, revenue growth. Compare at least one metric to sector peers. "
            "Use exact numbers from the financial data. Every number must be cited."
        )
    )
    recent_developments: str = Field(
        description=(
            "2-4 sentences. Material events from the last 7 days that could affect the stock. "
            "If no significant news exists, state that clearly. Every event must be cited."
        )
    )
    key_risks: str = Field(
        description=(
            "Exactly 3 risks, each as a separate paragraph. Format: "
            "RISK 1: [Name] — [2-sentence explanation of why this matters]. "
            "RISK 2: [Name] — ... RISK 3: [Name] — ... "
            "Each risk must reference a source."
        )
    )
    comparable_companies: str = Field(
        description=(
            "Compare 2-3 sector peers on valuation (PE ratio) and growth. "
            "Format as a brief comparison: which peers trade at premium/discount and why. "
            "Use exact figures where available."
        )
    )
    recommendation: str = Field(
        description=(
            "BUY / HOLD / SELL — state the verdict clearly in the first word. "
            "Then 3-4 sentences of reasoning. Include a 12-month target price range if "
            "financial data supports it. State the key catalyst or risk that would change "
            "the recommendation."
        )
    )


# ── LLM client ────────────────────────────────────────────────────────────────

_llm = None

def _get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.1,   # slight creativity for prose quality
            api_key=os.getenv("GROQ_API_KEY"),
        )
    return _llm


def _format_web_results(web_results: list[dict]) -> str:
    """Format web research results into a text block for the LLM."""
    if not web_results:
        return "No web research available."
    parts = []
    for item in web_results:
        parts.append(
            f"Q: {item.get('question', 'N/A')}\n"
            f"A: {item.get('summary', 'N/A')}\n"
            f"Sources: {', '.join(item.get('sources', []))}"
        )
    return "\n\n".join(parts)


def _format_financial_data(fd: dict) -> str:
    """Format financial data into a text block for the LLM."""
    if not fd or "error" in fd:
        return "Financial data unavailable."
    lines = [
        f"Company: {fd.get('company_name', 'N/A')}",
        f"Price: ₹{fd.get('current_price', 'N/A')}",
        f"Market Cap: {fd.get('market_cap', 'N/A')}",
        f"PE Ratio: {fd.get('pe_ratio', 'N/A')}",
        f"Forward PE: {fd.get('forward_pe', 'N/A')}",
        f"EPS: ₹{fd.get('eps_trailing', 'N/A')}",
        f"ROE: {fd.get('roe', 'N/A')}",
        f"Net Margin: {fd.get('net_profit_margin', 'N/A')}",
        f"Debt/Equity: {fd.get('debt_to_equity', 'N/A')}",
        f"Revenue Growth YoY: {fd.get('revenue_growth_yoy', 'N/A')}",
        f"Dividend Yield: {fd.get('dividend_yield', 'N/A')}",
        f"\nAnalyst Summary:",
        f"Valuation: {fd.get('metrics_summary', 'N/A')}",
        f"Growth: {fd.get('growth_summary', 'N/A')}",
        f"Balance Sheet: {fd.get('balance_sheet_summary', 'N/A')}",
        f"Overall: {fd.get('overall_assessment', 'N/A')}",
    ]
    history = fd.get("revenue_history", [])
    if history:
        lines.append("\nRevenue History:")
        for y in history:
            lines.append(f"  {y.get('year')}: Revenue {y.get('revenue')} | Net Income {y.get('net_income')}")
    return "\n".join(lines)


def _format_news_data(news_data: list[dict]) -> str:
    """Format news data into a text block for the LLM."""
    if not news_data:
        return "No news data available."
    nd = news_data[0]
    lines = [
        f"Sentiment: {nd.get('sentiment', 'neutral')}",
        f"Reason: {nd.get('sentiment_reason', 'N/A')}",
    ]
    events = nd.get("key_events", [])
    if events:
        lines.append("\nKey Events:")
        for e in events:
            lines.append(
                f"  - {e.get('headline')}\n"
                f"    Why it matters: {e.get('significance')}\n"
                f"    Source: {e.get('source_url')} ({e.get('published_at', '')[:10]})"
            )
    else:
        lines.append("No significant news events in the last 7 days.")
    return "\n".join(lines)


def _build_writer_prompt(state: ResearchState) -> str:
    """Build the full context prompt for the writer."""
    company = state.get("company", "the company")
    ticker = state.get("ticker", "N/A")
    critique = state.get("critique", "")
    hitl_feedback = state.get("hitl_feedback", "")
    revision_count = state.get("revision_count", 0)

    context = f"""Company: {company} ({ticker})

=== WEB RESEARCH ===
{_format_web_results(state.get("web_results", []))}

=== FINANCIAL DATA ===
{_format_financial_data(state.get("financial_data", {}))}

=== NEWS & SENTIMENT ===
{_format_news_data(state.get("news_data", []))}
"""

    if revision_count > 0 and critique:
        context += f"""
=== REVISION REQUIRED ===
This is revision #{revision_count}. The critic identified these issues with the previous draft:
{critique}
"""

    if hitl_feedback:
        context += f"""
=== HUMAN ANALYST FEEDBACK ===
{hitl_feedback}
"""

    context += "\nWrite the complete equity research note using only the data provided above."
    return context


# ── Agent function ────────────────────────────────────────────────────────────

def writer_node(state: ResearchState) -> dict:
    """
    LangGraph node: synthesises all gathered data into a research note.

    Args:
        state: ResearchState with web_results, financial_data, news_data populated

    Returns:
        {"draft_note": str}
    """
    company = state.get("company", "the company")
    revision = state.get("revision_count", 0)

    if revision > 0:
        print(f"\n[WRITER] Writing revision #{revision} for {company}...")
    else:
        print(f"\n[WRITER] Writing research note for {company}...")

    llm = _get_llm()
    structured_llm = llm.with_structured_output(ResearchNote)

    messages = [
        SystemMessage(content=WRITER_PROMPT),
        HumanMessage(content=_build_writer_prompt(state)),
    ]

    print(f"[WRITER] Calling Groq to synthesise note...")
    note: ResearchNote = structured_llm.invoke(messages)

    # Format into a clean markdown string
    draft = f"""# {company} — Equity Research Note

## Investment Thesis
{note.investment_thesis}

## Financial Summary
{note.financial_summary}

## Recent Developments
{note.recent_developments}

## Key Risks
{note.key_risks}

## Comparable Companies
{note.comparable_companies}

## Recommendation
{note.recommendation}

---
*Generated by AlphaAgents · {company} ({state.get('ticker', 'N/A')})*
"""

    print(f"[WRITER] ✅ Note written — {len(draft)} characters")
    return {"draft_note": draft}


# ── Manual test ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from alphaagents.graph.state import get_initial_state

    # Simulate state after all data agents have run
    state = get_initial_state("Analyse HDFC Bank for a retail investor")
    state["company"] = "HDFC Bank"
    state["ticker"] = "HDFCBANK.NS"
    state["web_results"] = [
        {
            "question": "What was HDFC Bank revenue and net profit in FY2025?",
            "summary": "HDFC Bank reported net profit of ₹17,620 Cr in Q4 FY2025, up 12.6% YoY. Net Interest Income grew 9.4% to ₹31,200 Cr. [Source: https://example.com/hdfc-q4]",
            "sources": ["https://example.com/hdfc-q4"],
        },
        {
            "question": "What are the top 3 regulatory risks facing HDFC Bank in FY2026?",
            "summary": "RBI has directed banks to slow unsecured lending growth. HDFC Bank faces NIM pressure from merger integration. Capital adequacy requirements may tighten. [Source: https://example.com/rbi-directive]",
            "sources": ["https://example.com/rbi-directive"],
        },
    ]
    state["financial_data"] = {
        "company_name": "HDFC Bank Limited",
        "current_price": 1842,
        "market_cap": "₹13.9T",
        "pe_ratio": 18.4,
        "roe": "16.8%",
        "net_profit_margin": "22.1%",
        "debt_to_equity": 0.82,
        "revenue_growth_yoy": "9.4%",
        "metrics_summary": "HDFC Bank trades at 18.4x PE, a discount to its 5-year average of 22x, suggesting potential value.",
        "growth_summary": "Revenue grew 9.4% YoY driven by retail lending. Earnings growth of 12.6% reflects operational leverage.",
        "balance_sheet_summary": "Debt-to-equity of 0.82x is manageable. ROE of 16.8% is sector-leading.",
        "overall_assessment": "Fundamentally strong bank with temporary NIM headwinds from merger integration.",
    }
    state["news_data"] = [{
        "sentiment": "positive",
        "sentiment_reason": "Strong Q4 results and digital banking growth offset merger integration concerns.",
        "has_news": True,
        "key_events": [
            {
                "headline": "HDFC Bank Q4 profit rises 12.6% YoY",
                "significance": "Beats analyst estimates, signals successful merger integration progress.",
                "source_url": "https://example.com/hdfc-q4",
                "published_at": "2026-07-05",
            }
        ],
    }]

    result = writer_node(state)
    print("\n" + "=" * 60)
    print("WRITER OUTPUT")
    print("=" * 60)
    print(result["draft_note"])