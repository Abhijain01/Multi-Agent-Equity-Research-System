"""
backend/routes/research.py
Core research pipeline endpoints with SSE streaming.

SSE event shape:
  data: {"event": "agent_start", "agent": "orchestrator", "message": "..."}
  data: {"event": "agent_done",  "agent": "orchestrator", "company": "...", "ticker": "..."}
  data: {"event": "pipeline_done", "note_id": "...", "note": {...}}
  data: {"event": "error", "message": "..."}
"""

import json
import asyncio
from uuid import uuid4
from datetime import datetime
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from backend.models import ResearchRequest, ApprovalRequest, RevisionRequest
from backend.store import save_note, get_note, get_all_notes, update_note
from alphaagents.graph.state import get_initial_state
from alphaagents.agents.orchestrator import orchestrator_node
from alphaagents.agents.web_researcher import web_researcher_node
from alphaagents.agents.financial_data import financial_data_node
from alphaagents.agents.news_agent import news_agent_node
from alphaagents.agents.writer import writer_node
from alphaagents.agents.critic import critic_node, should_revise
from alphaagents.agents.scorer import scorer_node
from alphaagents.graph.pipeline import data_gathering_node
from backend.report_utils import build_financial_data_payload, build_sources, build_recent_news, linkify_citations, LLM_MODELS_USED, DATA_PROVIDERS_USED

router = APIRouter(prefix="/api/research", tags=["research"])


def sse(event: str, data: dict) -> str:
    """Format a Server-Sent Event string."""
    return f"data: {json.dumps({'event': event, **data})}\n\n"


@router.post("/run")
async def run_research(request: ResearchRequest):
    """
    Run the full AlphaAgents pipeline for a query.
    Streams SSE events for each agent step.
    """
    note_id = str(uuid4())

    async def generate():
        state = get_initial_state(request.query)
        started_at = datetime.utcnow()

        try:
            # ── Step 1: Orchestrator ──────────────────────────────────
            yield sse("agent_start", {"agent": "orchestrator", "message": "Planning research..."})
            result = await asyncio.to_thread(orchestrator_node, state)
            state.update(result)
            yield sse("agent_done", {
                "agent": "orchestrator",
                "company": state.get("company"),
                "ticker": state.get("ticker"),
                "plan": state.get("plan", []),
            })

            # ── Step 2: Parallel data gathering ───────────────────────
            yield sse("agent_start", {"agent": "web_researcher", "message": f"Searching {len(state.get('sub_questions', []))} questions..."})
            yield sse("agent_start", {"agent": "financial_data", "message": f"Fetching {state.get('ticker')} fundamentals..."})
            yield sse("agent_start", {"agent": "news_agent", "message": "Scanning last 7 days of news..."})

            result = await asyncio.to_thread(data_gathering_node, state)
            state.update(result)

            yield sse("agent_done", {"agent": "web_researcher", "results_count": len(state.get("web_results", []))})
            yield sse("agent_done", {"agent": "financial_data", "company": state.get("financial_data", {}).get("company_name", "")})
            yield sse("agent_done", {"agent": "news_agent", "sentiment": state.get("news_data", [{}])[0].get("sentiment", "neutral") if state.get("news_data") else "neutral"})

            # ── Step 3: Writer + Critic loop ──────────────────────────
            for attempt in range(3):  # max 2 revisions = 3 attempts
                revision = state.get("revision_count", 0)
                msg = "Writing research note..." if revision == 0 else f"Rewriting (revision {revision})..."
                yield sse("agent_start", {"agent": "writer", "message": msg})
                result = await asyncio.to_thread(writer_node, state)
                state.update(result)
                yield sse("agent_done", {"agent": "writer", "note_length": len(state.get("draft_note", ""))})

                yield sse("agent_start", {"agent": "critic", "message": f"Reviewing note (pass {attempt + 1})..."})
                result = await asyncio.to_thread(critic_node, state)
                state.update(result)

                passed = not bool(state.get("critique"))
                yield sse("agent_done", {
                    "agent": "critic",
                    "passed": passed,
                    "needs_review": state.get("needs_review", False),
                })

                if should_revise(state) == "hitl":
                    break

            # ── Step 4: Scorer — weighted scorecard on the finished note ──
            yield sse("agent_start", {"agent": "scorer", "message": "Scoring across 6 weighted categories..."})
            result = await asyncio.to_thread(scorer_node, state)
            state.update(result)
            yield sse("agent_done", {
                "agent": "scorer",
                "overall_score": (state.get("scorecard") or {}).get("overall_score"),
                "verdict": (state.get("scorecard") or {}).get("verdict"),
            })

            # ── Step 5: Store and return ───────────────────────────────
            news_events = state.get("news_data", [{}])[0].get("key_events", []) if state.get("news_data") else []
            duration_seconds = round((datetime.utcnow() - started_at).total_seconds(), 1)

            # Convert the writer's literal "[Source: <url>]" text into clean
            # numbered markers ([1], [2], ...) matching the Sources &
            # Citations panel, instead of showing raw URLs mid-sentence.
            base_sources = build_sources(state.get("web_results", []), news_events)
            linkified_note, final_sources = linkify_citations(state.get("draft_note", ""), base_sources)

            note_data = {
                "id": note_id,
                "query": request.query,
                "company": state.get("company", ""),
                "ticker": state.get("ticker", ""),
                "note": linkified_note,
                "needs_review": state.get("needs_review", False),
                "critique": state.get("critique", ""),
                "revision_count": state.get("revision_count", 0),
                "approved": False,
                "created_at": datetime.utcnow().isoformat(),
                "financial_data": build_financial_data_payload(state.get("financial_data", {})),
                "sentiment": state.get("news_data", [{}])[0].get("sentiment", "neutral") if state.get("news_data") else "neutral",
                "scorecard": state.get("scorecard"),
                "sources": final_sources,
                "recent_news": build_recent_news(news_events),
                "generation_meta": {
                    "duration_seconds": duration_seconds,
                    "llm_models": LLM_MODELS_USED,
                    "data_providers": DATA_PROVIDERS_USED,
                },
                # Raw agent context, not shown directly in the UI — kept so
                # /api/research/revise can rebuild full state instead of
                # re-writing/re-scoring with empty financial_data/web_results/
                # news_data (see report_utils.py note on this bug).
                "_web_results": state.get("web_results", []),
                "_news_data": state.get("news_data", []),
                "_financial_data_raw": state.get("financial_data", {}),
                "_trace_id": state.get("trace_id"),
            }
            save_note(note_id, note_data)

            yield sse("pipeline_done", {"note_id": note_id, "note": note_data})

        except Exception as e:
            yield sse("error", {"message": str(e)})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.get("/history")
async def get_history():
    """Return all past research notes, most recent first."""
    return {"notes": get_all_notes()}


@router.post("/approve")
async def approve_note(request: ApprovalRequest):
    """Mark a note as approved/published."""
    note = get_note(request.note_id)
    if not note:
        return {"error": "Note not found"}
    update_note(request.note_id, {"approved": True})
    return {"status": "published", "note_id": request.note_id}


@router.post("/revise")
async def revise_note(request: RevisionRequest):
    """
    Accept human feedback and re-run writer + critic.
    Streams SSE events same as /run.
    """
    note = get_note(request.note_id)
    if not note:
        return {"error": "Note not found"}

    note_id = request.note_id

    async def generate():
        # Rebuild state from stored note + human feedback
        state = get_initial_state(note["query"])
        state["company"] = note.get("company", "")
        state["ticker"] = note.get("ticker", "")
        state["draft_note"] = note.get("note", "")
        state["hitl_feedback"] = request.feedback
        state["revision_count"] = note.get("revision_count", 0)
        # Restore the original agent data — without this, the writer/scorer
        # would be revising with empty financial_data/web_results/news_data.
        state["web_results"] = note.get("_web_results", [])
        state["news_data"] = note.get("_news_data", [])
        state["financial_data"] = note.get("_financial_data_raw", {})
        if note.get("_trace_id"):
            state["trace_id"] = note["_trace_id"]

        try:
            yield sse("agent_start", {"agent": "writer", "message": "Incorporating analyst feedback..."})
            result = await asyncio.to_thread(writer_node, state)
            state.update(result)
            yield sse("agent_done", {"agent": "writer", "note_length": len(state.get("draft_note", ""))})

            yield sse("agent_start", {"agent": "critic", "message": "Re-reviewing revised note..."})
            result = await asyncio.to_thread(critic_node, state)
            state.update(result)
            passed = not bool(state.get("critique"))
            yield sse("agent_done", {"agent": "critic", "passed": passed})

            # Re-score — the revised note may have changed the thesis/figures,
            # so the scorecard needs to reflect the new draft, not the old one.
            yield sse("agent_start", {"agent": "scorer", "message": "Re-scoring revised note..."})
            result = await asyncio.to_thread(scorer_node, state)
            state.update(result)
            yield sse("agent_done", {
                "agent": "scorer",
                "overall_score": (state.get("scorecard") or {}).get("overall_score"),
                "verdict": (state.get("scorecard") or {}).get("verdict"),
            })

            news_events = state.get("news_data", [{}])[0].get("key_events", []) if state.get("news_data") else []
            base_sources = build_sources(state.get("web_results", []), news_events) or note.get("sources", [])
            linkified_note, final_sources = linkify_citations(state.get("draft_note", ""), base_sources)
            updated = {
                "note": linkified_note,
                "needs_review": state.get("needs_review", False),
                "critique": state.get("critique", ""),
                "revision_count": state.get("revision_count", 0),
                "approved": False,
                "scorecard": state.get("scorecard"),
                "sources": final_sources,
                "recent_news": build_recent_news(news_events) or note.get("recent_news", []),
            }
            update_note(note_id, updated)

            yield sse("pipeline_done", {"note_id": note_id, "note": {**note, **updated}})

        except Exception as e:
            yield sse("error", {"message": str(e)})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Access-Control-Allow-Origin": "*"},
    )