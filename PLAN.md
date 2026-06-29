# AlphaAgents — Execution Plan

**Repo:** https://github.com/Abhijain01/Multi-Agent-Equity-Research-System  
**Local:** `C:\Users\abhis\FinPilot`  
**Duration:** 22 June → 26 July 2026  
**Segment:** 5 — LLM Systems & Applied GenAI | Problem E1

---

## The One Rule

Build in dependency order. Never start a layer before the layer below it works.  
Tools → State → Agents → Graph → UI → Eval → Deploy.  
Skipping this order is the #1 reason multi-agent projects collapse in Week 3.

---

## Tech Stack (Locked — Do Not Change Without Updating ADR)

| Component | Choice | Version |
|---|---|---|
| Language | Python | 3.11+ |
| Agent framework | LangGraph | latest |
| LLM | Groq — Llama-3.3-70B | via groq SDK |
| Web search | Tavily Search API | tavily-python |
| Financial data | yfinance | latest |
| News | NewsAPI | newsapi-python |
| Structured outputs | Pydantic | v2 |
| Tracing | Langfuse | latest |
| Vector memory | FAISS + HuggingFace embeddings | faiss-cpu |
| UI | Streamlit | latest |
| Testing | pytest | latest |
| Deployment | HuggingFace Spaces | Docker |

---

## File Structure (Final Target)

```
FinPilot/
├── alphaagents/
│   ├── __init__.py
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── orchestrator.py       # Decomposes query into sub-tasks
│   │   ├── web_researcher.py     # Tavily search + fetch + cite
│   │   ├── financial_data.py     # yfinance + AV stub
│   │   ├── news_agent.py         # NewsAPI sentiment + events
│   │   ├── writer.py             # Synthesises equity note
│   │   └── critic.py             # Reviews claims, triggers revisions
│   ├── graph/
│   │   ├── __init__.py
│   │   ├── state.py              # LangGraph state schema (Pydantic)
│   │   └── pipeline.py           # Full agent graph definition
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── search.py             # Tavily wrapper with caching
│   │   ├── finance.py            # yfinance wrapper with caching
│   │   └── news.py               # NewsAPI wrapper with caching
│   ├── eval/
│   │   ├── __init__.py
│   │   ├── queries.json          # 20 sample eval queries
│   │   ├── run.py                # LLM-as-judge eval runner
│   │   └── results/              # Eval output JSON reports
│   └── utils/
│       ├── __init__.py
│       ├── cache.py              # Local JSON cache for all API calls
│       └── prompts.py            # System prompts for every agent
├── app.py                        # Streamlit HITL UI
├── docs/
│   ├── initial_design_doc.docx
│   ├── adr/
│   │   ├── ADR001-framework-choice.md
│   │   ├── ADR002-llm-provider.md
│   │   └── ADR003-eval-strategy.md
│   └── postmortem.md
├── tests/
│   ├── __init__.py
│   ├── test_tools.py
│   ├── test_agents.py
│   └── test_graph.py
├── cache/
│   └── .gitkeep
├── .env
├── .env.example
├── .gitignore
├── requirements.txt
├── Dockerfile
├── README.md
├── PLAN.md
├── WORKFLOW.md
└── MEMORY.md
```

---

## Build Order & Dependencies

### Layer 0 — Scaffold (must be done first, everything depends on this)
- [ ] `requirements.txt` with pinned packages
- [ ] `.env.example` with all required key names
- [ ] `.gitignore` (never push `.env` or `cache/`)
- [ ] All folders + empty `__init__.py` files
- [ ] `utils/cache.py` — the caching utility every tool will use

### Layer 1 — Tools (agents cannot exist without these)
- [ ] `tools/search.py` — Tavily wrapper, reads from cache first
- [ ] `tools/finance.py` — yfinance wrapper, reads from cache first
- [ ] `tools/news.py` — NewsAPI wrapper, reads from cache first
- [ ] Manual test: each tool called directly, response printed and cached

### Layer 2 — State Schema (graph cannot exist without this)
- [ ] `graph/state.py` — full Pydantic model for LangGraph state
  - query, plan, web_results, financial_data, news_data
  - draft_note, critique, revision_count, hitl_approved, final_note

### Layer 3 — Agents (depend on tools + state)
- [ ] `utils/prompts.py` — all system prompts written and versioned here
- [ ] `agents/orchestrator.py` — decomposes query, returns research plan
- [ ] `agents/web_researcher.py` — calls search tool, returns cited summaries
- [ ] `agents/financial_data.py` — calls finance tool, returns structured data
- [ ] `agents/news_agent.py` — calls news tool, returns sentiment + events
- [ ] `agents/writer.py` — takes all gathered data, returns structured note
- [ ] `agents/critic.py` — reviews note, returns pass/fail + feedback

### Layer 4 — Graph Assembly (depends on all agents + state)
- [ ] `graph/pipeline.py` — LangGraph graph connecting all agents
  - Nodes: orchestrator, web_researcher, financial_data, news_agent, writer, critic
  - Edges: conditional routing from critic (revise vs pass)
  - Hard cap: revision_count max 2

### Layer 5 — UI (depends on graph)
- [ ] `app.py` — Streamlit HITL interface
  - Query input
  - Live agent status (which agent is running)
  - Draft note display
  - Approve / Request Revision buttons
  - Published note display

### Layer 6 — Eval (depends on graph)
- [ ] `eval/queries.json` — 20 sample queries written
- [ ] `eval/run.py` — runs all 20, scores with LLM-as-judge
- [ ] `eval/results/` — output JSON per run

### Layer 7 — Hardening (depends on everything above)
- [ ] `tests/test_tools.py` — unit tests for every tool wrapper
- [ ] `tests/test_agents.py` — unit tests for each agent output shape
- [ ] `tests/test_graph.py` — integration test: one full pipeline run
- [ ] Langfuse tracing on every agent call
- [ ] `docs/adr/ADR001-framework-choice.md`
- [ ] `docs/adr/ADR002-llm-provider.md`
- [ ] `docs/adr/ADR003-eval-strategy.md`

### Layer 8 — Deploy
- [ ] `Dockerfile`
- [ ] HuggingFace Spaces setup
- [ ] Live URL working

---

## Milestones

| Date | Milestone | What must be true |
|---|---|---|
| 4 Jul | Week 1 Demo | All 3 tools working, state schema defined, data flowing |
| 11 Jul | Week 2 Demo | All 5 agents working, one full E2E run on Reliance Industries |
| 18 Jul | Week 3 Demo | HITL UI, Langfuse, eval suite, tests, 3 ADRs |
| 19 Jul | **Milestone 1 Submission** | GitHub Release v1.0-milestone-1 |
| 25 Jul | Week 4 Demo | Live deployed URL, Loom recorded |
| 25 Jul | **Milestone 2 + Final** | Everything submitted |
| 26 Jul | Showcase | Live demo to panel |

---

## Architectural Decisions (Summary)

Full reasoning in ADR files. Short version:

**LangGraph over CrewAI/AutoGen:** Explicit state management, conditional edges, and deterministic routing. CrewAI is too opinionated about roles. AutoGen is too chat-oriented. LangGraph gives full control over the graph.

**Groq over OpenAI:** Free tier, 130K tokens/min throughput, Llama-3.3-70B is strong enough for structured output tasks. OpenAI costs money.

**Pydantic structured outputs on every agent:** Prevents malformed outputs from breaking downstream agents. Every agent returns a typed Pydantic model, not a raw string.

**Aggressive caching before any API call:** All API responses (Tavily, yfinance, NewsAPI) written to `cache/{tool}/{hash_of_params}.json` on first call. Dev loop never re-hits an API for the same input. Removes rate limit as a day-to-day problem.

**Revision hard cap at 2:** Critic → Writer loop capped at 2 revisions. If critic still fails after 2, note goes to HITL with a flag. Prevents infinite loops.

---

## Success Criteria (Interview-Defensible)

At the end of 5 weeks, you must be able to say:

1. "The pipeline runs end-to-end in under 5 minutes for any Indian listed company."
2. "Every agent returns a typed Pydantic model. No raw string passing between agents."
3. "I have 20 eval queries with LLM-as-judge scores on factuality, completeness, and actionability."
4. "Every API call is cached. The system can demo without hitting rate limits."
5. "I made three explicit architectural decisions documented in ADRs with trade-offs."
6. "The deployed URL is live. Clone-to-run takes under 15 minutes."
