"""
agents/financial_data.py

The Financial Data Agent — pulls stock fundamentals via yfinance
and uses Groq to produce a structured financial analysis.

LangGraph role:
  Runs in PARALLEL with web_researcher and news agents after orchestrator.
  Receives state with ticker populated by orchestrator.
  Returns {"financial_data": {...}}

Flow:
  get_fundamentals(ticker) → format metrics → one Groq call for analysis paragraph
"""

import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from alphaagents.graph.state import ResearchState
from alphaagents.tools.finance import get_fundamentals
from alphaagents.utils.prompts import FINANCIAL_DATA_PROMPT

load_dotenv()

# ── Output schema ─────────────────────────────────────────────────────────────

class FinancialOutput(BaseModel):
    """Structured financial analysis output."""
    ticker: str = Field(description="NSE ticker symbol")
    company_name: str = Field(description="Full company name")
    metrics_summary: str = Field(
        description="2-3 sentence summary of valuation metrics (PE, PB, market cap, margins)"
    )
    growth_summary: str = Field(
        description="2-3 sentence summary of revenue and earnings growth trends"
    )
    balance_sheet_summary: str = Field(
        description="2-3 sentence summary of balance sheet health (debt, ROE, book value)"
    )
    overall_assessment: str = Field(
        description="1-2 sentence overall financial assessment — is the business fundamentally strong or weak?"
    )


# ── LLM client ────────────────────────────────────────────────────────────────

_llm = None

def _get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0,
            api_key=os.getenv("GROQ_API_KEY"),
        )
    return _llm


def _format_metrics_for_prompt(data: dict) -> str:
    """Format the raw fundamentals dict into a clean text block for the LLM."""
    currency_symbol = data.get("currency_symbol", "")

    lines = [
        f"Company: {data.get('company_name', 'N/A')}",
        f"Sector: {data.get('sector', 'N/A')}",
        f"Current Price: {currency_symbol}{data.get('current_price', 'N/A')}",
        f"Market Cap: {data.get('market_cap', 'N/A')}",
        f"PE Ratio (Trailing): {data.get('pe_ratio', 'N/A')}",
        f"Forward PE: {data.get('forward_pe', 'N/A')}",
        f"Price-to-Book: {data.get('price_to_book', 'N/A')}",
        f"EPS (Trailing): {currency_symbol}{data.get('eps_trailing', 'N/A')}",
        f"Dividend Yield: {data.get('dividend_yield', 'N/A')}",
        f"Gross Margin: {data.get('gross_margin', 'N/A')}",
        f"Operating Margin: {data.get('operating_margin', 'N/A')}",
        f"Net Profit Margin: {data.get('net_profit_margin', 'N/A')}",
        f"Return on Equity (ROE): {data.get('roe', 'N/A')}",
        f"Debt-to-Equity: {data.get('debt_to_equity', 'N/A')}",
        f"Revenue Growth (YoY): {data.get('revenue_growth_yoy', 'N/A')}",
        f"Earnings Growth (YoY): {data.get('earnings_growth_yoy', 'N/A')}",
        f"Book Value per Share: {currency_symbol}{data.get('book_value_per_share', 'N/A')}",
    ]

    # Add revenue history if available
    history = data.get("revenue_history", [])
    if history:
        lines.append("\nRevenue History (last 3 years):")
        for y in history:
            lines.append(
                f"  {y.get('year', '?')}: Revenue {y.get('revenue', 'N/A')} | "
                f"Net Income {y.get('net_income', 'N/A')}"
            )

    if data.get("data_warning"):
        lines.append(f"\nData Warning: {data['data_warning']}")

    return "\n".join(lines)


# ── Agent function ────────────────────────────────────────────────────────────

def financial_data_node(state: ResearchState) -> dict:
    """
    LangGraph node: fetches fundamentals and produces financial analysis.

    Args:
        state: ResearchState with ticker and company populated

    Returns:
        {"financial_data": dict} — raw metrics + LLM analysis
    """
    ticker = state.get("ticker", "")
    company = state.get("company", "the company")

    if not ticker:
        print("[FINANCIAL DATA] No ticker in state. Skipping.")
        return {"financial_data": {"error": "No ticker found in state"}}

    print(f"\n[FINANCIAL DATA] Fetching fundamentals for {company} ({ticker})")

    # 1. Get raw fundamentals (cached after first call)
    raw_data = get_fundamentals(ticker)

    if "error" in raw_data:
        print(f"[FINANCIAL DATA] ⚠️  Error fetching data: {raw_data['error']}")
        return {"financial_data": raw_data}

    print(f"[FINANCIAL DATA] ✅ Got fundamentals for {raw_data.get('company_name', ticker)}")

    # 2. Format metrics for the LLM
    metrics_text = _format_metrics_for_prompt(raw_data)

    # 3. Ask Groq to produce structured financial analysis
    llm = _get_llm()
    structured_llm = llm.with_structured_output(FinancialOutput)

    messages = [
        SystemMessage(content=FINANCIAL_DATA_PROMPT),
        HumanMessage(content=(
            f"Company: {company}\n\n"
            f"Financial Data:\n{metrics_text}\n\n"
            f"Provide a structured financial analysis based on the above data. "
            f"Be specific — use the actual numbers. Do not speculate beyond what the data shows."
        )),
    ]

    print(f"[FINANCIAL DATA] Generating analysis with Groq...")
    analysis: FinancialOutput = structured_llm.invoke(messages)

    # 4. Merge raw data + LLM analysis into one dict
    result = {
        # Raw metrics (for writer to reference exact numbers)
        **raw_data,
        # LLM analysis (structured summaries for each section)
        "metrics_summary": analysis.metrics_summary,
        "growth_summary": analysis.growth_summary,
        "balance_sheet_summary": analysis.balance_sheet_summary,
        "overall_assessment": analysis.overall_assessment,
    }

    print(f"[FINANCIAL DATA] ✅ Analysis complete")
    return {"financial_data": result}


# ── Manual test ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from alphaagents.graph.state import get_initial_state

    state = get_initial_state("Analyse HDFC Bank for a retail investor")
    state["company"] = "HDFC Bank"
    state["ticker"] = "HDFCBANK.NS"

    result = financial_data_node(state)

    print("\n" + "=" * 50)
    print("FINANCIAL DATA OUTPUT")
    print("=" * 50)
    fd = result["financial_data"]
    print(f"Company      : {fd.get('company_name')}")
    print(f"Price        : ₹{fd.get('current_price')}")
    print(f"Market Cap   : {fd.get('market_cap')}")
    print(f"\nMetrics Summary:\n{fd.get('metrics_summary')}")
    print(f"\nGrowth Summary:\n{fd.get('growth_summary')}")
    print(f"\nBalance Sheet:\n{fd.get('balance_sheet_summary')}")
    print(f"\nOverall:\n{fd.get('overall_assessment')}")