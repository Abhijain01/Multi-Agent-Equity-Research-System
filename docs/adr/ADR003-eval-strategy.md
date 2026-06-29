# ADR003 — Evaluation Strategy

**Status:** Draft (to be finalised in Week 3)  
**Date:** 29 June 2026  
**Author:** Abhishek Jain

---

## Context

AlphaAgents must evaluate the quality of generated equity research notes across 20 sample queries. Three evaluation approaches were considered: RAGAS (RAG-specific metrics), LLM-as-judge, and human evaluation.

---

## Decision

**Chosen: LLM-as-judge (Groq — Llama-3.3-70B as the judge)**

---

## Trade-off Table

| Criterion | LLM-as-judge | RAGAS | Human eval |
|---|---|---|---|
| Scalable to 20 queries | Yes — fully automated | Yes | No — too slow |
| Measures factuality | Yes (with citation check) | Partial (faithfulness metric) | Yes |
| Measures actionability | Yes | No | Yes |
| Measures completeness | Yes | Partial | Yes |
| Cost | Free (Groq tier) | Free | Free but time-intensive |
| RAG-specific | No — general quality | Yes — built for RAG | No |
| Reproducible | Mostly (some variance) | High | Low |

---

## Reasoning

RAGAS was rejected because it is designed for RAG pipelines where a ground-truth answer exists. Equity research notes have no single correct answer — they are evaluated on quality dimensions (is it factual? is it complete? is it actionable?) not on similarity to a reference answer.

Human evaluation was rejected for scalability — running 20 queries through human review during a 5-week sprint is not practical.

LLM-as-judge was chosen because it can evaluate the three dimensions that matter for this use case:
1. **Factuality** — does every claim have a cited source?
2. **Completeness** — are all 6 required sections present and substantive?
3. **Actionability** — would a retail investor know what to do after reading this?

Each dimension is scored 1-5 by the judge LLM with a structured output. Results are saved to `eval/results/` as JSON for transparency.

---

## Consequences

- `eval/run.py` uses a separate Groq call (acting as judge) for each output, using a different system prompt from the research agents.
- Each eval result includes the scores, the judge's reasoning, and the full note — so results are auditable.
- Score variance between runs is expected (~±0.5 per dimension). Run the eval twice and average if needed.
- Human spot-check: manually read 5 of the 20 outputs to sanity-check the judge's scores.