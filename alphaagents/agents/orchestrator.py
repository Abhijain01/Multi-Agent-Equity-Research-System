"""
agents/orchestrator.py

The Orchestrator — first agent in the pipeline.

What it does:
  Takes the raw user query (e.g. "Analyse Reliance Industries for a retail investor")
  and produces a structured research plan:
    - Identifies the exact company name and NSE ticker
    - Breaks the query into 3-5 targeted sub-questions for the web researcher
    - Produces a step-by-step research plan

Why it exists:
  Without an orchestrator, downstream agents have no idea what company
  to look up, what ticker to use for yfinance, or what specific questions
  to answer. The orchestrator gives every other agent its marching orders.

LangGraph role:
  This is the FIRST node in the graph. It receives the initial state
  (which only has `query` set) and returns the fields it populates.
  LangGraph merges the return dict into the full state automatically.

Output shape:
  Returns a partial state dict with:
    - company: str       e.g. "Reliance Industries"
    - ticker: str        e.g. "RELIANCE.NS"
    - plan: list[str]    e.g. ["Gather financials", "Search recent news", ...]
    - sub_questions: list[str]  e.g. ["What is RIL's revenue growth?", ...]
"""

import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from alphaagents.graph.state import ResearchState
from alphaagents.utils.tracing import get_langfuse_config
from alphaagents.utils.prompts import ORCHESTRATOR_PROMPT

load_dotenv()

# ── Output schema ────────────────────────────────────────────────────────────

class OrchestratorOutput(BaseModel):
    """
    Structured output from the orchestrator agent.
    Groq will populate these fields via with_structured_output().
    """
    company: str = Field(
        description="The exact, full company name. E.g. 'Reliance Industries', 'HDFC Bank', 'Tata Consultancy Services'"
    )
    ticker: str = Field(
        description=(
            "The correct Yahoo Finance ticker symbol for whichever exchange this company "
            "actually trades on — do NOT force an NSE suffix onto companies that aren't "
            "Indian. Examples: Indian companies use '.NS' (e.g. 'RELIANCE.NS', 'TCS.NS'; "
            "fall back to '.BO' only if NSE is unavailable). US companies (NASDAQ/NYSE) use "
            "the bare symbol with NO suffix (e.g. 'NVDA' for NVIDIA, 'AAPL' for Apple, "
            "'MSFT' for Microsoft, 'TSLA' for Tesla, 'AMZN' for Amazon). Other exchanges use "
            "their Yahoo Finance suffix (e.g. '.L' for London, '.T' for Tokyo). Get this "
            "wrong and every downstream financial data lookup fails."
        )
    )
    plan: list[str] = Field(
        description="3-5 high-level research steps. E.g. ['Analyse financial fundamentals', 'Review recent news and sentiment', 'Compare with sector peers']"
    )
    sub_questions: list[str] = Field(
        description="3-5 specific, targeted research questions for the web researcher. Each must be answerable by a web search. E.g. 'What was Reliance Industries revenue and net profit in FY2025?'"
    )


# ── LLM client (lazy init) ────────────────────────────────────────────────────

_llm = None

def _get_llm():
    global _llm
    if _llm is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY not found in environment. "
                "Add it to your .env file."
            )
        _llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0,           # deterministic output for research planning
            api_key=api_key,
        )
    return _llm


# ── Agent function ────────────────────────────────────────────────────────────

def orchestrator_node(state: ResearchState) -> dict:
    """
    LangGraph node function for the orchestrator agent.

    Args:
        state: the current ResearchState (only `query` is populated at this point)

    Returns:
        Partial state dict with: company, ticker, plan, sub_questions
    """
    query = state["query"]
    print(f"\n[ORCHESTRATOR] Planning research for: '{query}'")

    # Bind structured output schema to the LLM
    llm = _get_llm()
    structured_llm = llm.with_structured_output(OrchestratorOutput)

    # Build the prompt
    messages = [
        SystemMessage(content=ORCHESTRATOR_PROMPT),
        HumanMessage(content=f"Research query: {query}"),
    ]

    # Call Groq
    print("[ORCHESTRATOR] Calling Groq (Llama-3.3-70B)...")
    result: OrchestratorOutput = structured_llm.invoke(messages, config=get_langfuse_config("orchestrator", state))

    print(f"[ORCHESTRATOR] Company identified: {result.company} ({result.ticker})")
    print(f"[ORCHESTRATOR] Generated {len(result.sub_questions)} sub-questions")
    print(f"[ORCHESTRATOR] Research plan: {len(result.plan)} steps")

    # Return only the fields this agent populates
    return {
        "company": result.company,
        "ticker": result.ticker,
        "plan": result.plan,
        "sub_questions": result.sub_questions,
    }


# ── Manual test ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from alphaagents.graph.state import get_initial_state

    # Test query
    query = "Analyse HDFC Bank for a retail investor"
    print(f"Testing orchestrator with: '{query}'\n")

    state = get_initial_state(query)
    result = orchestrator_node(state)

    print("\n" + "=" * 50)
    print("ORCHESTRATOR OUTPUT")
    print("=" * 50)
    print(f"Company      : {result['company']}")
    print(f"Ticker       : {result['ticker']}")
    print(f"\nResearch Plan:")
    for i, step in enumerate(result['plan'], 1):
        print(f"  {i}. {step}")
    print(f"\nSub-questions for web researcher:")
    for i, q in enumerate(result['sub_questions'], 1):
        print(f"  {i}. {q}")