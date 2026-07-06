"""
agents/web_researcher.py

The Web Researcher Agent — searches the web for each sub-question
produced by the orchestrator and returns cited summaries.

LangGraph role:
  Runs in PARALLEL with financial_data and news agents after orchestrator.
  Receives state with sub_questions populated.
  Returns {"web_results": [...]}

Flow:
  For each sub-question → search via Tavily (cached) → summarise with Groq
  One Groq call per sub-question to keep outputs focused and cited.
"""

import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from alphaagents.graph.state import ResearchState
from alphaagents.tools.search import search
from alphaagents.utils.prompts import WEB_RESEARCHER_PROMPT

load_dotenv()

# ── Output schema ─────────────────────────────────────────────────────────────

class SearchSummary(BaseModel):
    """One summarised answer for one sub-question."""
    question: str = Field(description="The research sub-question being answered")
    summary: str = Field(description="2-4 sentence answer with inline citations [Source: url]")
    sources: list[str] = Field(description="List of source URLs used in the summary")


class WebResearchOutput(BaseModel):
    """Full output from the web researcher for all sub-questions."""
    results: list[SearchSummary] = Field(
        description="One SearchSummary per sub-question"
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


# ── Agent function ────────────────────────────────────────────────────────────

def web_researcher_node(state: ResearchState) -> dict:
    """
    LangGraph node: searches web for each sub-question, returns cited summaries.

    Args:
        state: ResearchState with sub_questions and company populated

    Returns:
        {"web_results": list[dict]} — one dict per sub-question
    """
    sub_questions = state.get("sub_questions", [])
    company = state.get("company", "the company")

    if not sub_questions:
        print("[WEB RESEARCHER] No sub-questions found in state. Skipping.")
        return {"web_results": []}

    print(f"\n[WEB RESEARCHER] Researching {len(sub_questions)} sub-questions for {company}")

    llm = _get_llm()
    structured_llm = llm.with_structured_output(SearchSummary)

    web_results = []

    for i, question in enumerate(sub_questions, 1):
        print(f"[WEB RESEARCHER] ({i}/{len(sub_questions)}) Searching: {question[:60]}...")

        # 1. Search (cached if already searched)
        raw_results = search(f"{company} {question}", max_results=5)

        if not raw_results:
            print(f"[WEB RESEARCHER] No results for question {i}. Skipping.")
            continue

        # 2. Format search results for the LLM
        results_text = "\n\n".join([
            f"Title: {r['title']}\nURL: {r['url']}\nContent: {r['content'][:500]}"
            for r in raw_results
        ])

        # 3. Ask Groq to summarise with citations
        messages = [
            SystemMessage(content=WEB_RESEARCHER_PROMPT),
            HumanMessage(content=(
                f"Research question: {question}\n\n"
                f"Search results:\n{results_text}\n\n"
                f"Summarise the answer to the research question using only the above sources. "
                f"Include inline citations [Source: url] for every claim."
            )),
        ]

        try:
            result: SearchSummary = structured_llm.invoke(messages)
            # Override question in case LLM changed it
            result.question = question
            web_results.append({
                "question": result.question,
                "summary": result.summary,
                "sources": result.sources,
            })
            print(f"[WEB RESEARCHER] ✅ Question {i} answered, {len(result.sources)} sources cited")
        except Exception as e:
            print(f"[WEB RESEARCHER] ⚠️  Question {i} failed: {e}")
            # Add a fallback entry so we don't lose the question
            web_results.append({
                "question": question,
                "summary": f"Research incomplete for this question due to an error: {str(e)}",
                "sources": [r["url"] for r in raw_results[:2]],
            })

    print(f"[WEB RESEARCHER] Done. {len(web_results)} questions answered.")
    return {"web_results": web_results}


# ── Manual test ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from alphaagents.graph.state import get_initial_state

    # Simulate state after orchestrator has run
    state = get_initial_state("Analyse HDFC Bank for a retail investor")
    state["company"] = "HDFC Bank"
    state["ticker"] = "HDFCBANK.NS"
    state["sub_questions"] = [
        "What was HDFC Bank's revenue and net profit in FY2025?",
        "What are the top 3 regulatory risks facing HDFC Bank in FY2026?",
    ]

    result = web_researcher_node(state)

    print("\n" + "=" * 50)
    print("WEB RESEARCHER OUTPUT")
    print("=" * 50)
    for item in result["web_results"]:
        print(f"\nQ: {item['question']}")
        print(f"A: {item['summary']}")
        print(f"Sources: {item['sources']}")