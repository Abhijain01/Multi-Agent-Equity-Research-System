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
| **EVALUATION DATE** | **20 July 2026 — everything must be live by 19 July** |
| Developer | Abhishek Jain · abhishekjainjain968@gmail.com · github.com/Abhijain01 |

---

## Current Status

**Last updated:** 10 July 2026
**Current phase:** Week 2 COMPLETE — Week 3 starts Monday 14 Jul
**Current week goal:** FastAPI backend + React frontend + Deploy

### What is DONE
- [x] GitHub repo, LICENSE, README.md, PLAN.md, WORKFLOW.md, MEMORY.md
- [x] docs/initial_design_doc.docx pushed
- [x] Virtual environment, requirements.txt, .gitignore, .env.example
- [x] Full folder scaffold + cache/.gitkeep
- [x] utils/cache.py — JSON cache utility
- [x] utils/prompts.py — all 5 agent system prompts
- [x] docs/adr/ADR001, ADR002, ADR003 — drafts pushed
- [x] tools/search.py — Tavily wrapper, cache verified
- [x] tools/finance.py — yfinance wrapper, cache verified
- [x] tools/news.py — NewsAPI wrapper, cache verified
- [x] graph/state.py — LangGraph TypedDict state schema
- [x] test_flow.py — E2E tools test passed
- [x] Week 1 Issues #1-#6 closed
- [x] agents/orchestrator.py — tested ✅
- [x] agents/web_researcher.py — tested ✅
- [x] agents/financial_data.py — tested ✅
- [x] agents/news_agent.py — tested ✅
- [x] agents/writer.py — tested ✅
- [x] agents/critic.py — tested ✅
- [x] graph/pipeline.py — FULL E2E RUN COMPLETE ✅
  - Orchestrator identified Reliance Industries (RELIANCE.NS)
  - All 3 data agents ran in parallel
  - Writer produced 5424-char note
  - Critic triggered revision loop (ran 2x, hard cap hit)
  - HITL escalation fired correctly with needs_review=True
- [x] Week 2 Issues #7-#12 all closed

### What is IN PROGRESS
- [ ] backend/ — FastAPI with SSE streaming (Mon 14 Jul)
- [ ] frontend/ — Next.js React app (Tue 15 Jul)

### What is BLOCKED
- Langfuse account not yet created — get at cloud.langfuse.com (needed Thu 17 Jul)
- HuggingFace Space for backend not created — needed Wed 16 Jul

### Known Pipeline Issues (fix in Week 3)
- yfinance returning incorrect dividend yield (46%) for some stocks — needs defensive clamping
- Web researcher sometimes pulls low-quality sources (Scribd, Facebook) — add domain blocklist
- These are data quality issues, NOT code bugs — critic correctly flagged them

---

## Tech Stack (Locked)

| Component | Choice | Notes |
|---|---|---|
| Language | Python 3.11+ | |
| Agent framework | LangGraph (Python) | |
| LLM | Groq — Llama-3.3-70B | via `groq` SDK |
| Web search | Tavily Search API | Free tier: 1K req/month |
| Financial data | yfinance | No API key needed |
| News | NewsAPI | Free tier: 100 req/day |
| Structured outputs | Pydantic v2 | Every agent returns a Pydantic model |
| Tracing | Langfuse | Free tier — get account this weekend |
| Backend API | FastAPI | SSE streaming |
| Streaming | SSE (Server-Sent Events) | via FastAPI StreamingResponse |
| Frontend | Next.js + React + Tailwind | Capital Lens quality |
| Frontend deploy | Vercel | Free |
| PDF export | reportlab | Server-side |
| Testing | pytest | |
| Backend deploy | HuggingFace Spaces (Docker) | |
| Caching | Custom JSON cache | utils/cache.py |

---

## API Keys Status

| Service | Key obtained | Free tier limit | Notes |
|---|---|---|---|
| Groq | ✅ Yes | 14K tokens/min | Working |
| Tavily | ✅ Yes | 1K searches/month | Working, cache verified |
| yfinance | ✅ No key needed | Unlimited | Working |
| NewsAPI | ✅ Yes | 100 req/day | Working |
| Langfuse | ❌ Not yet | Free tier | Get at cloud.langfuse.com THIS WEEKEND |
| HuggingFace | ✅ Yes | Free | Existing account |

---

## File Structure — Current State

```
FinPilot/
├── alphaagents/
│   ├── __init__.py                ✅
│   ├── agents/
│   │   ├── __init__.py            ✅
│   │   ├── orchestrator.py        ✅
│   │   ├── web_researcher.py      ✅
│   │   ├── financial_data.py      ✅
│   │   ├── news_agent.py          ✅
│   │   ├── writer.py              ✅
│   │   └── critic.py              ✅
│   ├── graph/
│   │   ├── __init__.py            ✅
│   │   ├── state.py               ✅
│   │   └── pipeline.py            ✅ FULL E2E TESTED
│   ├── tools/
│   │   ├── search.py              ✅
│   │   ├── finance.py             ✅
│   │   └── news.py                ✅
│   ├── eval/
│   │   └── __init__.py            ✅
│   └── utils/
│       ├── cache.py               ✅
│       └── prompts.py             ✅
├── backend/                       ❌ Mon 14 Jul
├── frontend/                      ❌ Tue 15 Jul
├── tests/__init__.py              ✅
├── cache/                         ✅ populated with real data
├── docs/adr/ (3 drafts)           ✅
├── test_flow.py, test_cache.py    ✅
├── .env, .env.example, .gitignore ✅
├── requirements.txt               ✅
├── README.md, PLAN.md, WORKFLOW.md, MEMORY.md ✅
```

---

## Architectural Decisions (Locked)

**1. LangGraph over CrewAI / AutoGen** — Explicit state machine, conditional edges. ADR001.
**2. Groq (Llama-3.3-70B) over OpenAI** — Free tier, fast, 128K context. ADR002.
**3. Pydantic structured outputs on every agent** — Prevents malformed outputs. ADR003.
**4. Aggressive caching** — All API responses cached to JSON. Dev loop never re-hits.
**5. Revision hard cap at 2** — Prevents infinite critic→writer loops. HITL escalation after cap.
**6. Parallel data gathering via ThreadPoolExecutor** — All 3 data agents run simultaneously.
**7. FastAPI + React over Streamlit** — Production-grade, Capital Lens quality. ADR004.
**8. SSE over WebSockets** — Unidirectional, simpler, HTTP/2 compatible. ADR005.
**9. reportlab for PDF (server-side)** — Consistent output across browsers.
**10. asyncio.gather() for comparison** — True parallelism for I/O-bound pipelines.

---

## Known Issues / Gotchas

- yfinance returns bad dividend yield for some stocks — clamp to max 15% in finance.py
- Web researcher pulls low-quality sources (Scribd, Facebook) — add domain blocklist to search.py
- yfinance tickers: use `.NS` suffix for NSE stocks
- NewsAPI free tier: articles up to 1 month old only
- Groq rate limit is per-minute — space out calls if hitting limits
- FastAPI SSE: needs `media_type="text/event-stream"` + `Cache-Control: no-cache`
- Next.js: set `NEXT_PUBLIC_API_URL` on Vercel pointing to HF Spaces URL
- HF Spaces: set all API keys as Secrets, never in Dockerfile
- `asyncio.gather()` for comparison: FastAPI route must be `async def`

---

## Revised Timeline (20 July Evaluation)

| Date | Task | Priority |
|---|---|---|
| Mon 14 Jul | FastAPI backend + SSE streaming | 🔴 Critical |
| Tue 15 Jul | Next.js frontend core UI | 🔴 Critical |
| Wed 16 Jul | Deploy: HF Spaces + Vercel (LIVE URL) | 🔴 Critical |
| Thu 17 Jul | PDF export + eval scores + Langfuse | 🟡 Important |
| Fri 18 Jul | Tests + ADRs + Loom recording | 🟡 Important |
| Sat 19 Jul | Final polish + submission | 🔴 Critical |
| Sun 20 Jul | **EVALUATION** | 🔴 Deadline |

---

## GitHub Issues Tracker

| Issue | Title | Week | Status |
|---|---|---|---|
| #1-#6 | Week 1 tasks | Week 1 | ✅ All Closed |
| #7 | [W2] Orchestrator agent | Week 2 | ✅ Closed |
| #8 | [W2] Data agents (web, finance, news) | Week 2 | ✅ Closed |
| #9 | [W2] Writer agent | Week 2 | ✅ Closed |
| #10 | [W2] Critic agent | Week 2 | ✅ Closed |
| #11 | [W2] LangGraph pipeline assembly | Week 2 | ✅ Closed |
| #12 | [W2] First E2E pipeline run | Week 2 | ✅ Closed |
| #13 | [W3] FastAPI backend with SSE | Week 3 | 🟡 Open |
| #14 | [W3] React/Next.js frontend | Week 3 | 🟡 Open |
| #15 | [W3] Deploy HF Spaces + Vercel | Week 3 | 🟡 Open |
| #16 | [W3] PDF + eval scores + Langfuse | Week 3 | 🟡 Open |
| #17 | [W3] Tests + ADRs + Loom | Week 3 | 🟡 Open |

---

## Milestone Tracker

| Milestone | Date | Status |
|---|---|---|
| Design doc submitted | 24 Jun | ✅ Done |
| Architecture sign-off | 27 Jun | ✅ Done |
| Week 1 Demo | 4 Jul | ✅ Done |
| Week 2 Demo | 10 Jul | ✅ Done — full E2E pipeline |
| **Live URL (HF + Vercel)** | **16 Jul** | ⏳ Pending |
| Milestone 1 Submission | 19 Jul | ⏳ Pending |
| **EVALUATION** | **20 Jul** | ⏳ Pending |

---

## Session Log

### Session 1 — 24 June 2026
- Locked Segment 5, E1. Created all docs. Pushed to GitHub.

### Session 2 — 29 June 2026
- Built utils/cache.py, utils/prompts.py, ADR drafts.

### Session 3 — 30 June 2026
- Built tools/search.py. Issue #1 closed.

### Session 4 — 1 July 2026
- Built tools/finance.py. Issue #2 closed.

### Session 5 — 4 July 2026
- Built tools/news.py, graph/state.py, test_flow.py. Issues #3-6 closed. Week 1 complete.

### Session 6 — 7 July 2026
- Built agents/orchestrator.py. Issue #7 closed.

### Session 7 — 7 July 2026 (evening)
- Pre-generated data agents. Switched to FastAPI + React (Option B). Updated PLAN + WORKFLOW.

### Session 8 — 9 July 2026
- All 5 agents complete. Issues #8, #9, #10 closed.

### Session 9 — 10 July 2026
- Built graph/pipeline.py — FIRST FULL E2E RUN COMPLETE
- Orchestrator → parallel data → writer → critic → revision loop → HITL escalation
- All working correctly. Issues #11, #12 closed. Week 2 complete.
- CRITICAL UPDATE: Evaluation is 20 July — revised timeline accordingly
- Next session: FastAPI backend (Mon 14 Jul)

---

## How to Update This File

At the end of every working session:
1. Move completed items to DONE
2. Add blockers, decisions, gotchas
3. Update file structure
4. Add Session Log entry
5. Commit: `docs(memory): update session log`
6. Push