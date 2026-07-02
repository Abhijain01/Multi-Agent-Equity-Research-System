# ADR001 — Agent Framework Choice

**Status:** Draft (to be finalised in Week 3)  
**Date:** 29 June 2026  
**Author:** Abhishek Jain

---

## Context

AlphaAgents needs a framework to coordinate 5 specialised AI agents in a defined sequence with conditional routing (the critic can send the writer back for revision). The three main candidates considered were LangGraph, CrewAI, and AutoGen.

---

## Decision

**Chosen: LangGraph (Python)**

---

## Trade-off Table

| Criterion | LangGraph | CrewAI | AutoGen |
|---|---|---|---|
| State management | Explicit Pydantic state — full control | Implicit, role-based | Implicit, message-based |
| Conditional routing | Native conditional edges | Workarounds needed | Not built-in |
| Determinism | High — graph is defined code | Low — LLM decides flow | Low — conversational |
| Debugging | Trace every node transition | Hard to inspect | Hard to inspect |
| Learning curve | Medium | Low | Medium |
| Production maturity | High | Medium | Medium |
| Python-first | Yes | Yes | Yes |

---

## Reasoning

LangGraph was chosen because the pipeline has a known, fixed structure: orchestrator → 3 parallel data agents → writer → critic → conditional branch (revise or proceed). This structure is best expressed as an explicit state machine, not as a "crew of agents" that negotiate via LLM.

CrewAI was rejected because it uses LLM calls to decide agent routing, which introduces non-determinism. In a financial research context, predictable execution order matters.

AutoGen was rejected because it is optimised for multi-turn conversation between agents, not for a linear research pipeline where each agent has a single, typed output.

---

## Consequences

- Every agent must accept the shared `ResearchState` Pydantic model as input and return an updated version as output.
- The graph topology is defined once in `graph/pipeline.py` and does not change at runtime.
- Debugging is done by printing state at each node transition and via Langfuse traces.

- -----------
