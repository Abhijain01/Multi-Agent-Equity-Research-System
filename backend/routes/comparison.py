"""
backend/routes/comparison.py
Runs two research pipelines in parallel using asyncio.gather().
Streams SSE events for both companies simultaneously.
"""

import json
import asyncio
from uuid import uuid4
from datetime import datetime
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from backend.models import ComparisonRequest
from backend.store import save_note
from alphaagents.graph.state import get_initial_state
from alphaagents.agents.orchestrator import orchestrator_node
from alphaagents.agents.writer import writer_node
from alphaagents.agents.critic import critic_node, should_revise
from alphaagents.graph.pipeline import data_gathering_node

router = APIRouter(prefix="/api/comparison", tags=["comparison"])


def sse(event: str, data: dict) -> str:
    return f"data: {json.dumps({'event': event, **data})}\n\n"


async def run_single_pipeline(query: str, slot: str) -> dict:
    """Run one pipeline and return the final state. slot = 'A' or 'B'."""
    state = get_initial_state(query)

    result = await asyncio.to_thread(orchestrator_node, state)
    state.update(result)

    result = await asyncio.to_thread(data_gathering_node, state)
    state.update(result)

    for _ in range(3):
        result = await asyncio.to_thread(writer_node, state)
        state.update(result)
        result = await asyncio.to_thread(critic_node, state)
        state.update(result)
        if should_revise(state) == "hitl":
            break

    return state


@router.post("/run")
async def run_comparison(request: ComparisonRequest):
    """
    Run two research pipelines in parallel.
    Returns SSE stream with results for both companies.
    """
    async def generate():
        try:
            yield sse("comparison_start", {
                "query1": request.query1,
                "query2": request.query2,
                "message": "Running both pipelines in parallel...",
            })

            # Run both pipelines simultaneously
            state_a, state_b = await asyncio.gather(
                run_single_pipeline(request.query1, "A"),
                run_single_pipeline(request.query2, "B"),
            )

            # Save both notes
            note_id_a = str(uuid4())
            note_id_b = str(uuid4())

            def make_note(note_id, query, state):
                return {
                    "id": note_id,
                    "query": query,
                    "company": state.get("company", ""),
                    "ticker": state.get("ticker", ""),
                    "note": state.get("draft_note", ""),
                    "needs_review": state.get("needs_review", False),
                    "critique": state.get("critique", ""),
                    "revision_count": state.get("revision_count", 0),
                    "approved": False,
                    "created_at": datetime.utcnow().isoformat(),
                    "financial_data": {
                        "current_price": state.get("financial_data", {}).get("current_price"),
                        "market_cap": state.get("financial_data", {}).get("market_cap"),
                        "pe_ratio": state.get("financial_data", {}).get("pe_ratio"),
                        "roe": state.get("financial_data", {}).get("roe"),
                        "net_profit_margin": state.get("financial_data", {}).get("net_profit_margin"),
                    },
                    "sentiment": state.get("news_data", [{}])[0].get("sentiment", "neutral") if state.get("news_data") else "neutral",
                }

            note_a = make_note(note_id_a, request.query1, state_a)
            note_b = make_note(note_id_b, request.query2, state_b)
            save_note(note_id_a, note_a)
            save_note(note_id_b, note_b)

            yield sse("comparison_done", {
                "note_a": note_a,
                "note_b": note_b,
            })

        except Exception as e:
            yield sse("error", {"message": str(e)})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Access-Control-Allow-Origin": "*"},
    )