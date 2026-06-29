# ADR002 — LLM Provider Choice

**Status:** Draft (to be finalised in Week 3)  
**Date:** 29 June 2026  
**Author:** Abhishek Jain

---

## Context

AlphaAgents chains 5 LLM calls per pipeline run. The LLM provider must support structured outputs (Pydantic), be fast enough for a 5-minute end-to-end target, and be free or near-free during development and for the final demo.

---

## Decision

**Chosen: Groq — Llama-3.3-70B**

---

## Trade-off Table

| Criterion | Groq (Llama-3.3-70B) | OpenAI (GPT-4o) | Ollama (local) |
|---|---|---|---|
| Cost | Free tier (14K tokens/min) | ~$10-15 per 1M tokens | Free |
| Speed | Very fast (~300 tokens/sec) | Moderate | Slow (local hardware) |
| Context window | 128K tokens | 128K tokens | Model-dependent |
| Structured outputs | Yes (via LangChain) | Yes (native) | Limited |
| Reliability | High | High | Depends on hardware |
| Availability | Cloud API | Cloud API | Local only — no public demo |

---

## Reasoning

Groq was chosen because it offers a genuinely free tier with high throughput (14K tokens/min), which is sufficient for 5-agent chaining without hitting rate limits during demos.

OpenAI GPT-4o was rejected primarily on cost — running 20 eval queries at 5 agent calls each = 100 LLM calls, which would cost several dollars during development. Free budget is a hard constraint for this project.

Local Ollama was rejected because it cannot be used in the deployed HuggingFace Space without significant compute cost, and would make the public demo impossible to run.

Llama-3.3-70B specifically was chosen over smaller Groq-hosted models because it reliably follows structured output instructions, which is critical for agents that must return typed Pydantic models.

---

## Consequences

- All LLM calls route through the `groq` SDK with `langchain-groq` as the LangChain integration layer.
- Structured outputs are enforced using Pydantic `.with_structured_output()` on the LangChain ChatGroq client.
- If Groq rate limits are hit during eval, add a `time.sleep(2)` between agent calls — do not switch providers.