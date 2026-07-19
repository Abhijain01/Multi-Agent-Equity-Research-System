"""
alphaagents/utils/tracing.py

Optional Langfuse tracing for every LLM call across the 7 agents.

Design goals:
- Zero-config graceful degradation: if LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY
  aren't set (or the SDK fails to init for any reason), every function here
  returns a no-op config and the pipeline runs exactly as it did before —
  tracing must never be able to break a research run.
- One trace per pipeline run: every agent's LLM call in a single research
  run (and its revisions) shares `state["trace_id"]` as the Langfuse
  session_id, so the 7 separate LLM calls show up as one connected session
  in the Langfuse UI instead of 7 disconnected traces.

Usage in an agent:
    from alphaagents.utils.tracing import get_langfuse_config

    result = structured_llm.invoke(
        messages,
        config=get_langfuse_config(agent_name="writer", state=state),
    )

Uses Langfuse Python SDK v3 (OTEL-based) — `langfuse.langchain.CallbackHandler`,
attached via LangChain's standard `config={"callbacks": [...]}` mechanism.
"""

import os
from functools import lru_cache

_TRACING_CONFIGURED = bool(os.getenv("LANGFUSE_PUBLIC_KEY")) and bool(os.getenv("LANGFUSE_SECRET_KEY"))


@lru_cache(maxsize=1)
def _get_handler():
    """
    Create the Langfuse CallbackHandler once per process (not once per agent
    call — the handler is safe to reuse across calls/threads).
    Returns None if Langfuse isn't configured or fails to initialise.
    """
    if not _TRACING_CONFIGURED:
        return None
    try:
        from langfuse.langchain import CallbackHandler
        handler = CallbackHandler()
        print("[TRACING] Langfuse tracing enabled")
        return handler
    except Exception as e:
        # A bad key, network hiccup at import time, or SDK version mismatch
        # should disable tracing, not crash the research pipeline.
        print(f"[TRACING] Langfuse disabled — failed to initialise: {e}")
        return None


def is_tracing_enabled() -> bool:
    return _get_handler() is not None


def get_langfuse_config(agent_name: str, state: dict | None = None, **extra_metadata) -> dict:
    """
    Build a LangChain `config` dict with the Langfuse callback attached.
    Returns {} (no callbacks) if tracing isn't configured — safe to pass
    to .invoke() either way.

    Args:
        agent_name: e.g. "writer", "critic", "scorer" — tags the call and
            names the run so it's identifiable in the Langfuse UI.
        state: the current ResearchState — used to pull `trace_id` for
            session grouping. Optional; omit for calls outside the graph
            (e.g. alphaagents/eval/run.py's judge calls).
    """
    handler = _get_handler()
    if handler is None:
        return {}

    metadata = {"langfuse_tags": ["alphaagents", agent_name], **extra_metadata}
    trace_id = (state or {}).get("trace_id")
    if trace_id:
        metadata["langfuse_session_id"] = trace_id

    return {
        "callbacks": [handler],
        "metadata": metadata,
        "run_name": f"alphaagents.{agent_name}",
    }