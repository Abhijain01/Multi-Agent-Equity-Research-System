"""
alphaagents/eval/run.py

Run the full eval suite — 20 queries through the pipeline,
scored by LLM-as-judge on factuality, completeness, actionability.

Usage:
  python -m alphaagents.eval.run               # run all 20 queries
  python -m alphaagents.eval.run --limit 5     # run first 5 only (quick test)
  python -m alphaagents.eval.run --category large_cap
"""

import os
import json
import time
import argparse
from datetime import datetime
from pathlib import Path
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

from alphaagents.graph.pipeline import run_pipeline

load_dotenv()

RESULTS_DIR = Path(__file__).parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

QUERIES_FILE = Path(__file__).parent / "queries.json"

JUDGE_PROMPT = """
You are an expert evaluator of equity research notes written by AI systems.
Score the following note on three dimensions, each from 1.0 to 5.0 (one decimal place).

FACTUALITY (1-5): Are claims backed by cited sources? Are numbers from reliable sources?
  5.0 = Every factual claim has a source URL; all numbers match reliable sources
  4.0 = Most claims cited; minor gaps
  3.0 = Some claims cited; several gaps or unreliable sources
  2.0 = Many uncited claims; questionable data sources
  1.0 = No citations; fabricated or unreliable data

COMPLETENESS (1-5): Are all 6 sections present (Investment Thesis, Financial Summary, Recent Developments, Key Risks, Comparable Companies, Recommendation)?
  5.0 = All 6 sections present, each with substantial content
  4.0 = All sections present; one or two are thin
  3.0 = All sections present but several are superficial
  2.0 = Missing one or more sections
  1.0 = Missing multiple sections

ACTIONABILITY (1-5): Would a retail investor know what to do after reading?
  5.0 = Clear BUY/HOLD/SELL with target price range, specific reasoning, and key catalyst
  4.0 = Clear recommendation with good reasoning, but missing target price
  3.0 = Recommendation present but reasoning is vague
  2.0 = Unclear recommendation
  1.0 = No recommendation

Be strict. A 4.0+ score should be genuinely impressive output.
"""


class JudgeOutput(BaseModel):
    factuality: float = Field(description="Factuality score 1.0-5.0")
    completeness: float = Field(description="Completeness score 1.0-5.0")
    actionability: float = Field(description="Actionability score 1.0-5.0")
    reasoning: str = Field(description="2-3 sentences explaining the scores")


def score_note(note_text: str) -> dict:
    """Run LLM-as-judge on a note. Returns scores dict."""
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0,
        api_key=os.getenv("GROQ_API_KEY"),
    )
    structured = llm.with_structured_output(JudgeOutput)
    result: JudgeOutput = structured.invoke([
        SystemMessage(content=JUDGE_PROMPT),
        HumanMessage(content=f"Evaluate this equity research note:\n\n{note_text}"),
    ])
    overall = round((result.factuality + result.completeness + result.actionability) / 3, 2)
    return {
        "factuality": round(result.factuality, 1),
        "completeness": round(result.completeness, 1),
        "actionability": round(result.actionability, 1),
        "overall": overall,
        "reasoning": result.reasoning,
    }


def run_eval(limit: int = 20, category: str = None) -> dict:
    """Run the full eval suite."""
    queries = json.loads(QUERIES_FILE.read_text())

    if category:
        queries = [q for q in queries if q["category"] == category]
    queries = queries[:limit]

    print(f"\n{'='*60}")
    print(f"ALPHAAGENTS EVAL SUITE")
    print(f"Running {len(queries)} queries | {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC")
    print(f"{'='*60}\n")

    results = []
    totals = {"factuality": 0, "completeness": 0, "actionability": 0, "overall": 0}

    for i, q in enumerate(queries, 1):
        print(f"[{i}/{len(queries)}] {q['query'][:60]}...")
        start = time.time()

        try:
            state = run_pipeline(q["query"])
            note_text = state.get("draft_note", "")

            if not note_text:
                raise ValueError("Empty note generated")

            # Rate limit buffer between pipeline + judge calls
            time.sleep(2)

            scores = score_note(note_text)
            elapsed = round(time.time() - start, 1)

            result = {
                "id": q["id"],
                "query": q["query"],
                "ticker": q["ticker"],
                "category": q["category"],
                "scores": scores,
                "note_length": len(note_text),
                "revision_count": state.get("revision_count", 0),
                "needs_review": state.get("needs_review", False),
                "elapsed_seconds": elapsed,
                "error": None,
            }

            for k in ["factuality", "completeness", "actionability", "overall"]:
                totals[k] += scores[k]

            print(f"  ✅ F:{scores['factuality']} C:{scores['completeness']} A:{scores['actionability']} Overall:{scores['overall']} ({elapsed}s)")

        except Exception as e:
            print(f"  ❌ Error: {e}")
            result = {
                "id": q["id"],
                "query": q["query"],
                "ticker": q["ticker"],
                "category": q["category"],
                "scores": None,
                "error": str(e),
            }

        results.append(result)
        time.sleep(3)  # avoid Groq rate limits between queries

    # Calculate averages (exclude errors)
    successful = [r for r in results if r.get("scores")]
    n = len(successful)
    averages = {k: round(totals[k] / n, 2) for k in totals} if n > 0 else {}

    summary = {
        "run_at": datetime.utcnow().isoformat(),
        "total_queries": len(queries),
        "successful": n,
        "failed": len(queries) - n,
        "averages": averages,
        "results": results,
    }

    # Save results
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    out_file = RESULTS_DIR / f"eval_{ts}.json"
    out_file.write_text(json.dumps(summary, indent=2))

    print(f"\n{'='*60}")
    print("EVAL SUMMARY")
    print(f"{'='*60}")
    print(f"Queries run : {len(queries)} | Successful: {n} | Failed: {len(queries) - n}")
    if averages:
        print(f"Avg Factuality    : {averages['factuality']}/5.0")
        print(f"Avg Completeness  : {averages['completeness']}/5.0")
        print(f"Avg Actionability : {averages['actionability']}/5.0")
        print(f"Avg Overall       : {averages['overall']}/5.0")
    print(f"Results saved : {out_file}")

    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--category", type=str, default=None,
                        choices=["large_cap", "mid_cap", "sector", "stress"])
    args = parser.parse_args()
    run_eval(limit=args.limit, category=args.category)