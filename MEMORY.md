# AlphaAgents — Session Memory

**INSTRUCTION FOR ABHISHEK:** Paste this entire file at the start of every new conversation.  
**INSTRUCTION FOR AI:** Read this fully before giving any advice. Never guess what's been built — it's all here.  
**Update this file at the end of every working session.**

---

## Project Identity

| Field | Value |
|---|---|
| Project name | AlphaAgents — Multi-Agent Equity Research System |
| GitHub repo | https://github.com/Abhijain01/Multi-Agent-Equity-Research-System |
| Local path | `C:\Users\abhis\FinPilot` |
| Internship | Futurense Technologies Summer Internship 2026 |
| Segment | 5 — LLM Systems & Applied GenAI |
| Problem | E1 — Agentic Research Analyst |
| Duration | 22 June → 26 July 2026 |
| Developer | Abhishek Jain · abhishekjainjain968@gmail.com · github.com/Abhijain01 |

---

## Current Status

**Last updated:** 7 July 2026
**Current phase:** Week 2 — Day 1 complete
**Current week goal:** Finish all 5 agents + LangGraph graph assembly

### What is DONE
- [x] GitHub repo, LICENSE, README.md, PLAN.md, WORKFLOW.md, MEMORY.md
- [x] docs/initial_design_doc.docx pushed
- [x] Virtual environment, requirements.txt, .gitignore, .env.example
- [x] Full folder scaffold with all __init__.py files + cache/.gitkeep
- [x] utils/cache.py — JSON cache utility, all tests passed
- [x] utils/prompts.py — all 5 agent system prompts written
- [x] docs/adr/ADR001, ADR002, ADR003 — draft versions pushed
- [x] alphaagents/tools/search.py — Tavily wrapper, cache verified
- [x] alphaagents/tools/finance.py — yfinance wrapper, cache verified
- [x] alphaagents/tools/news.py — NewsAPI wrapper, cache verified
- [x] alphaagents/graph/state.py — LangGraph TypedDict state schema
- [x] test_flow.py — E2E test, all 4 sections passed
- [x] Week 1 Issues #1-#6 all closed
- [x] agents/orchestrator.py — tested on HDFC Bank, working ✅
- [x] Week 2 Issues #7-#12 opened
- [x] PLAN.md updated for Option B (FastAPI + React) architecture
- [x] WORKFLOW.md Week 3 + Week 4 updated for new stack

### What is IN PROGRESS
- [ ] agents/web_researcher.py — file pre-generated, place + test tomorrow
- [ ] agents/financial_data.py — file pre-generated, place + test tomorrow
- [ ] agents/news_agent.py — file pre-generated, place + test tomorrow

### What is BLOCKED
- Langfuse account not yet created (needed Week 3 Thu)
- HuggingFace Space for backend not yet created (needed Week 3 Fri)

### What was decided today
- **Switched from Streamlit (Option A) to FastAPI + React/Next.js (Option B)**
- 3 additional features locked: PDF export, multi-company comparison, eval scores display
- Architecture: FastAPI backend on HF Spaces + Next.js frontend on Vercel

---

## Tech Stack (Locked — UPDATED for Option B)

| Component | Choice | Notes |
|---|---|---|
| Language | Python 3.11+ | |
| Agent framework | LangGraph (Python) | NOT JS — Python version |
| LLM | Groq — Llama-3.3-70B | via `groq` SDK |
| Web search | Tavily Search API | Free tier: 1K req/month |
| Financial data | yfinance | No API key needed |
| News | NewsAPI | Free tier: 100 req/day |
| Structured outputs | Pydantic v2 | Every agent returns a Pydantic model |
| Tracing | Langfuse | Free tier |
| Vector memory | FAISS + HF embeddings | faiss-cpu |
| **Backend API** | **FastAPI** | **Replaces Streamlit** |
| **Streaming** | **SSE (Server-Sent Events)** | **via FastAPI StreamingResponse** |
| **Frontend** | **Next.js + React + Tailwind** | **Replaces Streamlit** |
| **Frontend deploy** | **Vercel** | **Free** |
| PDF export | reportlab | Server-side PDF generation |
| Testing | pytest | |
| **Backend deploy** | **HuggingFace Spaces (Docker)** | |
| Caching | Custom JSON cache | utils/cache.py |

---

## API Keys Status

| Service | Key obtained | Free tier limit | Notes |
|---|---|---|---|
| Groq | ✅ Yes (existing) | 14K tokens/min | Already used in Capital Lens + Ollive |
| Tavily | ✅ Yes (obtained) | 1K searches/month | Working, cache verified |
| yfinance | ✅ No key needed | Unlimited | Just pip install |
| NewsAPI | ✅ Yes (obtained) | 100 req/day | Working, cache verified |
| Langfuse | ❌ Not yet | Free tier | Get at cloud.langfuse.com — needed Week 3 Thu |
| HuggingFace | ✅ Yes (existing) | Free | Already used for Ollive deployment |

---

## File Structure — Current State

```
FinPilot/
├── alphaagents/
│   ├── __init__.py                ✅
│   ├── agents/
│   │   ├── __init__.py            ✅
│   │   ├── orchestrator.py        ✅ built + tested
│   │   ├── web_researcher.py      🔄 pre-generated, not yet placed
│   │   ├── financial_data.py      🔄 pre-generated, not yet placed
│   │   └── news_agent.py          🔄 pre-generated, not yet placed
│   ├── graph/
│   │   ├── __init__.py            ✅
│   │   └── state.py               ✅
│   ├── tools/
│   │   ├── __init__.py            ✅
│   │   ├── search.py              ✅
│   │   ├── finance.py             ✅
│   │   └── news.py                ✅
│   ├── eval/
│   │   └── __init__.py            ✅
│   └── utils/
│       ├── __init__.py            ✅
│       ├── cache.py               ✅
│       └── prompts.py             ✅
├── backend/                       ❌ not yet built (Week 3 Mon)
├── frontend/                      ❌ not yet built (Week 3 Tue)
├── tests/__init__.py              ✅
├── cache/.gitkeep                 ✅
├── docs/
│   ├── initial_design_doc.docx    ✅
│   └── adr/
│       ├── ADR001-framework-choice.md  ✅ draft
│       ├── ADR002-llm-provider.md      ✅ draft
│       └── ADR003-eval-strategy.md     ✅ draft
├── test_flow.py                   ✅
├── test_cache.py                  ✅
├── .env                           ✅ (gitignored)
├── .env.example                   ✅
├── .gitignore                     ✅
├── requirements.txt               ✅
├── README.md                      ✅
├── PLAN.md                        ✅ updated for Option B
├── WORKFLOW.md                    ✅ updated for Option B
└── MEMORY.md                      ✅
```

---

## Architectural Decisions (Locked)

**1. LangGraph over CrewAI / AutoGen**
Reason: Explicit state machine, conditional edges, deterministic routing. ADR001.

**2. Groq (Llama-3.3-70B) over OpenAI**
Reason: Free tier, fast enough, 128K context. ADR002.

**3. Pydantic structured outputs on every agent**
Reason: Prevents malformed outputs breaking downstream agents. Every agent returns a typed Pydantic model.

**4. Aggressive caching before every API call**
Reason: All API responses saved to `cache/{tool}/{md5_hash}.json`. Dev loop never re-hits same endpoint.

**5. Revision hard cap at 2**
Reason: Prevents infinite critic→writer loops. After 2 failed revisions, escalate to HITL with `needs_review` flag.

**6. Parallel data gathering (web + financial + news)**
Reason: All 3 data agents run simultaneously. Cuts pipeline latency significantly.

**7. FastAPI + React over Streamlit (NEW)**
Reason: Production-grade separation of concerns. Capital Lens-quality UI. SSE streaming. More defensible in interview. ADR004 (to be written Week 3).

**8. SSE over WebSockets for streaming (NEW)**
Reason: Unidirectional server→client matches the use case perfectly. Simpler than WebSockets, works over HTTP/2. ADR005 (to be written Week 3).

**9. reportlab for PDF export (server-side) (NEW)**
Reason: Client-side PDF (jsPDF) is inconsistent across browsers. Backend PDF via reportlab gives pixel-perfect output.

**10. asyncio.gather() for parallel comparison (NEW)**
Reason: Both company pipelines are I/O-bound. asyncio.gather() gives true parallelism without threads.

---

## Known Issues / Gotchas

- yfinance tickers for Indian stocks use `.NS` suffix (e.g., `RELIANCE.NS`, `HDFCBANK.NS`)
- NewsAPI free tier returns articles up to 1 month old only. Filter by `publishedAt` date.
- Groq rate limit is per-minute, not per-day. Space out agent calls if hitting limits.
- LangGraph Python is different from LangGraph.js (used in Capital Lens). Refer to Python docs only.
- FastAPI SSE requires `StreamingResponse` with `media_type="text/event-stream"` and `Cache-Control: no-cache` header.
- Next.js frontend must set `NEXT_PUBLIC_API_URL` env var on Vercel pointing to HF Spaces backend URL.
- HuggingFace Spaces Docker: all API keys must be set as HF Spaces secrets, not in Dockerfile.
- `asyncio.gather()` for comparison requires the FastAPI route to be `async def`.

---

## GitHub Issues Tracker

| Issue | Title | Week | Status |
|---|---|---|---|
| #1 | [W1] Tavily search tool with caching | Week 1 | ✅ Closed |
| #2 | [W1] yfinance financial data tool with caching | Week 1 | ✅ Closed |
| #3 | [W1] NewsAPI news tool with caching | Week 1 | ✅ Closed |
| #4 | [W1] LangGraph state schema (Pydantic) | Week 1 | ✅ Closed |
| #5 | [W1] End-to-end data flow test on Reliance Industries | Week 1 | ✅ Closed |
| #6 | [W1] Weekly update | Week 1 | ✅ Closed |
| #7 | [W2] Orchestrator agent | Week 2 | ✅ Closed |
| #8  | [W2] Web researcher + financial data + news agents | Week 2 | ✅ Closed |
| #9  | [W2] Writer agent | Week 2 | ✅ Closed |
| #10 | [W2] Critic agent with revision logic | Week 2 | ✅ Closed |
| #11 | [W2] LangGraph pipeline assembly | Week 2 | 🟡 Open |
| #12 | [W2] First E2E pipeline run | Week 2 | 🟡 Open |

---

## Milestone Tracker

| Milestone | Date | Status |
|---|---|---|
| Design doc submitted | 24 Jun | ✅ Done |
| Architecture sign-off | 27 Jun | ✅ Done |
| Week 1 Demo | 4 Jul | ✅ Done |
| Week 2 Demo | 11 Jul | ⏳ Pending — full pipeline E2E |
| Week 3 Demo | 18 Jul | ⏳ Pending — live FastAPI + React URL |
| Milestone 1 Submission | 19 Jul | ⏳ Pending |
| Week 4 Demo | 25 Jul | ⏳ Pending |
| Final Submission | 25 Jul | ⏳ Pending |
| Showcase | 26 Jul | ⏳ Pending |

---

## Session Log

### Session 1 — 24 June 2026
- Locked Segment 5, Problem E1
- Finalized tech stack
- Created README.md, initial_design_doc.docx, PLAN.md, WORKFLOW.md, MEMORY.md
- Pushed README and design doc to GitHub

### Session 2 — 29 June 2026
- Built utils/cache.py, utils/prompts.py
- Created ADR001, ADR002, ADR003 draft files
- All tests passed, everything pushed

### Session 3 — 30 June 2026
- Built tools/search.py (Tavily, cache verified)
- Issue #1 closed

### Session 4 — 1 July 2026
- Built tools/finance.py (yfinance, cache verified)
- Issue #2 closed

### Session 5 — 4 July 2026
- Built tools/news.py, graph/state.py, test_flow.py
- E2E test all 4 sections passed
- Issues #3, #4, #5, #6 closed — Week 1 complete

### Session 6 — 7 July 2026
- Opened Week 2 Issues #7-#12
- Built agents/orchestrator.py — tested HDFC Bank, working
- Issue #7 closed

### Session 7 — 7 July 2026 (evening)
- Pre-generated agents/web_researcher.py, financial_data.py, news_agent.py
- **MAJOR DECISION: Switched from Streamlit to FastAPI + React (Option B)**
- Locked 3 additional features: PDF export, multi-company comparison, eval scores
- Updated PLAN.md and WORKFLOW.md for new architecture
- Next session: place + test all 3 data agents, commit closes #8 

### Session 8 — 9 July 2026
- Placed + tested agents/web_researcher.py, financial_data.py, news_agent.py — Issue #8 closed
- Built + tested agents/writer.py — produces structured 6-section research note — Issue #9 closed
- Built + tested agents/critic.py — reviews note, handles revision cap logic — Issue #10 closed
- All 5 agents complete
- Next session: graph/pipeline.py — LangGraph graph assembly (tomorrow)

---

## How to Update This File

At the end of every working session:
1. Move completed items from "In Progress" to "Done"
2. Add any new blockers to "Blocked"
3. Add any new decisions to "Architectural Decisions"
4. Add any new gotchas to "Known Issues"
5. Update file structure to reflect what's on disk
6. Add a new entry to "Session Log"
7. Commit: `docs(memory): update session log and status`
8. Push