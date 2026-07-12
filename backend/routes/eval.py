"""
backend/routes/eval.py
LLM-as-judge eval scoring endpoint.
Scores each research note on factuality, completeness, actionability (1-5).
"""

import os
from fastapi import APIRouter
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

from backend.models import EvalRequest
from backend.store import get_note, save_eval, get_eval

load_dotenv()
router = APIRouter(prefix="/api/eval", tags=["eval"])

EVAL_PROMPT = """
You are an expert evaluator of equity research notes. Score the following note on three dimensions, each from 1 to 5.

FACTUALITY (1-5): Are all claims supported by cited sources? Are the numbers accurate and from reliable sources?
  5 = Every claim cited, all numbers from reliable sources
  3 = Most claims cited, some gaps
  1 = Many uncited claims or unreliable sources

COMPLETENESS (1-5): Does the note have all 6 required sections (Investment Thesis, Financial Summary, Recent Developments, Key Risks, Comparable Companies, Recommendation)?
  5 = All 6 sections present and substantive
  3 = All sections present but some are thin
  1 = Missing sections or very thin content

ACTIONABILITY (1-5): Would a retail investor know what to do after reading this? Is the recommendation clear with reasoning?
  5 = Clear BUY/HOLD/SELL with target price, reasoning, and key catalyst
  3 = Recommendation present but reasoning is vague
  1 = Unclear recommendation or missing reasoning

Be honest and strict. A 4 or 5 should be genuinely impressive.
"""


class EvalOutput(BaseModel):
    factuality: float = Field(description="Factuality score 1.0-5.0")
    completeness: float = Field(description="Completeness score 1.0-5.0")
    actionability: float = Field(description="Actionability score 1.0-5.0")
    reasoning: str = Field(description="2-3 sentences explaining the scores")


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


@router.post("/score")
async def score_note(request: EvalRequest):
    """Run LLM-as-judge evaluation on a research note."""
    # Return cached scores if already evaluated
    existing = get_eval(request.note_id)
    if existing:
        return existing

    note = get_note(request.note_id)
    if not note:
        return {"error": "Note not found"}

    llm = _get_llm()
    structured_llm = llm.with_structured_output(EvalOutput)

    messages = [
        SystemMessage(content=EVAL_PROMPT),
        HumanMessage(content=f"Evaluate this equity research note:\n\n{note.get('note', '')}"),
    ]

    result: EvalOutput = structured_llm.invoke(messages)

    overall = round((result.factuality + result.completeness + result.actionability) / 3, 2)

    scores = {
        "note_id": request.note_id,
        "factuality": round(result.factuality, 1),
        "completeness": round(result.completeness, 1),
        "actionability": round(result.actionability, 1),
        "overall": overall,
        "reasoning": result.reasoning,
    }

    save_eval(request.note_id, scores)
    return scores