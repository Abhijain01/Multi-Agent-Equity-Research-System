"""
agents/critic.py

The Critic Agent — reviews the draft research note for quality,
citation coverage, and completeness.

LangGraph role:
  Runs AFTER the writer agent.
  Receives state with draft_note populated.
  Returns updated state fields based on review outcome.

Three possible outcomes:
  1. PASS → move to HITL checkpoint
  2. FAIL + revision_count < 2 → send back to writer with feedback
  3. FAIL + revision_count >= 2 → escalate to HITL with needs_review=True flag
"""

import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from alphaagents.graph.state import ResearchState
from alphaagents.utils.prompts import CRITIC_PROMPT

load_dotenv()

MAX_REVISIONS = 2

# ── Output schema ─────────────────────────────────────────────────────────────

class CriticOutput(BaseModel):
    """Structured output from the critic agent."""

    passed: bool = Field(
        description=(
            "True ONLY if ALL of these are met: "
            "(1) all factual claims have inline citations, "
            "(2) all 6 sections are present and substantive, "
            "(3) recommendation clearly states BUY/HOLD/SELL with reasoning, "
            "(4) at least 3 risks are explained. "
            "False if ANY criterion fails."
        )
    )
    issues: list[str] = Field(
        description=(
            "List of specific, actionable issues found. Empty if passed=True. "
            "Example: 'Financial Summary has no citations for PE ratio claim.' "
            "NOT: 'Missing citations.' Be precise about which section and which claim."
        )
    )
    feedback: str = Field(
        description=(
            "Specific instructions for the writer on exactly what to fix. "
            "Empty string if passed=True. "
            "Format: 'Fix 1: In Financial Summary, add a citation for the PE ratio. "
            "Fix 2: In Key Risks, Risk 3 needs a source URL.' "
        )
    )
    quality_score: int = Field(
        description=(
            "Overall quality score 1-10. Even if passed=True, give an honest score. "
            "8+ = publication-ready. 6-7 = acceptable. Below 6 = should fail."
        )
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

def critic_node(state: ResearchState) -> dict:
    """
    LangGraph node: reviews the draft note and decides next step.

    Args:
        state: ResearchState with draft_note populated

    Returns:
        Partial state dict with updated: critique, revision_count, needs_review
        (and potentially hitl_approved=False to ensure HITL runs next)
    """
    draft_note = state.get("draft_note", "")
    revision_count = state.get("revision_count", 0)
    company = state.get("company", "the company")

    if not draft_note:
        print("[CRITIC] No draft note found. Escalating to HITL.")
        return {
            "critique": "No draft note was generated.",
            "needs_review": True,
            "revision_count": revision_count,
        }

    print(f"\n[CRITIC] Reviewing research note for {company}...")
    print(f"[CRITIC] This is review #{revision_count + 1} (max revisions: {MAX_REVISIONS})")

    llm = _get_llm()
    structured_llm = llm.with_structured_output(CriticOutput)

    messages = [
        SystemMessage(content=CRITIC_PROMPT),
        HumanMessage(content=(
            f"Review the following equity research note:\n\n"
            f"{draft_note}\n\n"
            f"Be strict. A note only passes if ALL criteria are met. "
            f"Partial compliance is a failure."
        )),
    ]

    result: CriticOutput = structured_llm.invoke(messages)

    if result.passed:
        print(f"[CRITIC] ✅ PASSED — Quality score: {result.quality_score}/10")
        return {
            "critique": "",
            "revision_count": revision_count,
            "needs_review": False,
        }
    else:
        print(f"[CRITIC] ❌ FAILED — Quality score: {result.quality_score}/10")
        print(f"[CRITIC] Issues found: {len(result.issues)}")
        for i, issue in enumerate(result.issues, 1):
            print(f"  {i}. {issue}")

        new_revision_count = revision_count + 1

        if new_revision_count >= MAX_REVISIONS:
            print(f"[CRITIC] ⚠️  Max revisions ({MAX_REVISIONS}) reached. Escalating to HITL with flag.")
            return {
                "critique": result.feedback,
                "revision_count": new_revision_count,
                "needs_review": True,   # HITL will see a warning flag
            }
        else:
            print(f"[CRITIC] Sending back to writer for revision #{new_revision_count}...")
            return {
                "critique": result.feedback,
                "revision_count": new_revision_count,
                "needs_review": False,
            }


def should_revise(state: ResearchState) -> str:
    """
    LangGraph conditional edge function.
    Called after critic_node to decide which node to go to next.

    Returns:
        "writer" — if note failed and revision_count < MAX_REVISIONS
        "hitl"   — if note passed OR max revisions reached
    """
    critique = state.get("critique", "")
    needs_review = state.get("needs_review", False)
    revision_count = state.get("revision_count", 0)

    # If there's no critique, the note passed — go to HITL
    if not critique:
        return "hitl"

    # If max revisions reached, escalate to HITL even though it failed
    if needs_review or revision_count >= MAX_REVISIONS:
        return "hitl"

    # Otherwise, send back to writer
    return "writer"


# ── Manual test ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from alphaagents.graph.state import get_initial_state

    state = get_initial_state("Analyse HDFC Bank for a retail investor")
    state["company"] = "HDFC Bank"
    state["ticker"] = "HDFCBANK.NS"
    state["revision_count"] = 0

    # Test with a note that should fail (missing citations)
    state["draft_note"] = """# HDFC Bank — Equity Research Note

## Investment Thesis
HDFC Bank is well-positioned for long-term growth given its strong retail franchise.

## Financial Summary
The bank reported strong revenue growth and improving margins.

## Recent Developments
The bank announced strong Q4 results recently.

## Key Risks
Risk 1: NIM pressure from merger.
Risk 2: Regulatory changes.
Risk 3: Competition from fintech.

## Comparable Companies
ICICI Bank and Axis Bank are key peers.

## Recommendation
BUY. The stock looks attractive at current levels.
"""

    result = critic_node(state)

    print("\n" + "=" * 60)
    print("CRITIC OUTPUT")
    print("=" * 60)
    print(f"Passed        : {result.get('critique') == ''}")
    print(f"Critique      : {result.get('critique', 'N/A')[:200]}")
    print(f"Revision count: {result.get('revision_count')}")
    print(f"Needs review  : {result.get('needs_review')}")

    print(f"\nNext node     : {should_revise({**state, **result})}")