"""
graph/pipeline.py

The LangGraph pipeline — wires all 5 agents into a single graph.

Architecture:
  orchestrator
       │
  data_gathering  ← runs web, financial, news agents in parallel (ThreadPoolExecutor)
       │
    writer
       │
    critic
       │
  ┌────┴────┐
  │         │
writer    END (→ HITL in FastAPI)
(revise)

Why a combined data_gathering node instead of 3 separate parallel nodes:
  LangGraph's native fan-out requires careful state reducer setup.
  Using ThreadPoolExecutor inside one node achieves the same parallelism
  with simpler, more debuggable code. All 3 API calls (Tavily, yfinance,
  NewsAPI) are I/O-bound and cached, so thread-based parallelism is safe.

Running the pipeline:
  python -m alphaagents.graph.pipeline --query "Analyse Reliance Industries"
  python -m alphaagents.graph.pipeline  ← uses default HDFC Bank query
"""

import sys
import argparse
import concurrent.futures
from langgraph.graph import StateGraph, END

from alphaagents.graph.state import ResearchState, get_initial_state
from alphaagents.agents.orchestrator import orchestrator_node
from alphaagents.agents.web_researcher import web_researcher_node
from alphaagents.agents.financial_data import financial_data_node
from alphaagents.agents.news_agent import news_agent_node
from alphaagents.agents.writer import writer_node
from alphaagents.agents.critic import critic_node, should_revise


# ── Parallel data gathering node ──────────────────────────────────────────────

def data_gathering_node(state: ResearchState) -> dict:
    """
    Runs web_researcher, financial_data, and news_agent in parallel.

    Uses ThreadPoolExecutor because all three are I/O-bound:
    - web_researcher: Tavily API + Groq (cached after first run)
    - financial_data: yfinance (cached after first run)
    - news_agent: NewsAPI + Groq (cached after first run)

    All three results are merged into a single state update dict.
    """
    print("\n[DATA GATHERING] Starting parallel data collection...")
    print("[DATA GATHERING] Running: web_researcher + financial_data + news_agent simultaneously")

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        web_future     = executor.submit(web_researcher_node, state)
        finance_future = executor.submit(financial_data_node, state)
        news_future    = executor.submit(news_agent_node, state)

        # Wait for all three to complete
        web_result     = web_future.result()
        finance_result = finance_future.result()
        news_result    = news_future.result()

    print("[DATA GATHERING] ✅ All 3 agents complete")
    return {
        **web_result,
        **finance_result,
        **news_result,
    }


# ── Graph builder ─────────────────────────────────────────────────────────────

def build_graph() -> StateGraph:
    """
    Build and compile the AlphaAgents LangGraph pipeline.

    Returns:
        Compiled LangGraph app ready to invoke.
    """
    graph = StateGraph(ResearchState)

    # Add all nodes
    graph.add_node("orchestrator",    orchestrator_node)
    graph.add_node("data_gathering",  data_gathering_node)
    graph.add_node("writer",          writer_node)
    graph.add_node("critic",          critic_node)

    # Set entry point
    graph.set_entry_point("orchestrator")

    # Add edges (linear flow except for critic conditional)
    graph.add_edge("orchestrator",   "data_gathering")
    graph.add_edge("data_gathering", "writer")
    graph.add_edge("writer",         "critic")

    # Conditional edge from critic:
    #   "writer" → send back to writer for revision
    #   "hitl"   → end pipeline (HITL handled by FastAPI)
    graph.add_conditional_edges(
        "critic",
        should_revise,
        {
            "writer": "writer",
            "hitl":   END,
        }
    )

    return graph.compile()


# ── Singleton compiled graph ───────────────────────────────────────────────────

# Build once at import time — reused across all FastAPI requests
_app = None

def get_pipeline():
    """Get the compiled pipeline (lazy singleton)."""
    global _app
    if _app is None:
        print("[PIPELINE] Compiling LangGraph pipeline...")
        _app = build_graph()
        print("[PIPELINE] ✅ Pipeline compiled successfully")
    return _app


def run_pipeline(query: str) -> ResearchState:
    """
    Run the full pipeline for a given query.

    Args:
        query: e.g. "Analyse HDFC Bank for a retail investor"

    Returns:
        Final ResearchState with draft_note (and critique/needs_review if critic flagged)
    """
    app = get_pipeline()
    initial_state = get_initial_state(query)

    print(f"\n{'='*60}")
    print(f"ALPHAAGENTS PIPELINE")
    print(f"Query: {query}")
    print(f"{'='*60}")

    final_state = app.invoke(initial_state)

    print(f"\n{'='*60}")
    print("PIPELINE COMPLETE")
    print(f"{'='*60}")
    print(f"Company     : {final_state.get('company')} ({final_state.get('ticker')})")
    print(f"Revisions   : {final_state.get('revision_count', 0)}")
    print(f"Needs review: {final_state.get('needs_review', False)}")
    print(f"Note length : {len(final_state.get('draft_note', ''))} characters")

    return final_state


# ── CLI entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run AlphaAgents equity research pipeline")
    parser.add_argument(
        "--query",
        type=str,
        default="Analyse HDFC Bank for a retail investor",
        help="Research query (default: HDFC Bank)"
    )
    args = parser.parse_args()

    result = run_pipeline(args.query)

    print("\n" + "="*60)
    print("FINAL RESEARCH NOTE")
    print("="*60)
    print(result.get("draft_note", "No note generated"))

    if result.get("needs_review"):
        print("\n⚠️  NOTE: Critic flagged this note for human review.")
        print(f"Critique: {result.get('critique', 'N/A')}")