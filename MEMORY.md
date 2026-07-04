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

**Last updated:** 4 July 2026
**Current phase:** Week 1 Complete — Week 2 starts Monday 7 Jul
**Current week goal:** Agents + Graph Assembly

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

### What is IN PROGRESS
- [ ] agents/orchestrator.py (Monday 7 Jul)

### What is BLOCKED
- Langfuse account not yet created (needed Week 3)

### What was decided today
- No new decisions — all prior decisions hold

---

## Tech Stack (Locked)

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
| UI | Streamlit | HITL interface |
| Testing | pytest | |
| Deployment | HuggingFace Spaces | Docker-based |
| Caching | Custom JSON cache | utils/cache.py — all API calls cached |

---

## API Keys Status

| Service | Key obtained | Free tier limit | Notes |
|---|---|---|---|
| Groq | ✅ Yes (existing) | 14K tokens/min | Already used in Capital Lens + Ollive |
| Tavily | ✅ Yes (obtained) | 1K searches/month | Working, cache verified |
| yfinance | ✅ No key needed | Unlimited | Just pip install |
| NewsAPI | ✅ Yes (obtained) | 100 req/day | Working, cache verified |
| Langfuse | ❌ Not yet | Free tier | Get at cloud.langfuse.com |
| HuggingFace | ✅ Yes (existing) | Free | Already used for Ollive deployment |

---

## File Structure — Current State

```
FinPilot/  (= Multi-Agent-Equity-Research-System repo)
├── docs/
│   └── initial_design_doc.docx   ✅ pushed
├── LICENSE                        ✅ pushed
├── README.md                      ✅ pushed
├── PLAN.md                        ✅ created (push today)
├── WORKFLOW.md                    ✅ created (push today)
└── MEMORY.md                      ✅ created (push today)
```

Everything else is yet to be created.

---

## File Structure — Current State

```
FinPilot/
├── alphaagents/
│   ├── __init__.py                ✅
│   ├── agents/
│   │   └── __init__.py            ✅ (agents not built yet — Week 2)
│   ├── graph/
│   │   ├── __init__.py            ✅
│   │   └── state.py               ✅
│   ├── tools/
│   │   ├── __init__.py            ✅
│   │   ├── search.py              ✅
│   │   ├── finance.py             ✅
│   │   └── news.py                ✅
│   ├── eval/
│   │   └── __init__.py            ✅ (not built yet — Week 3)
│   └── utils/
│       ├── __init__.py            ✅
│       ├── cache.py               ✅
│       └── prompts.py             ✅
├── tests/
│   └── __init__.py                ✅ (not built yet — Week 3)
├── cache/
│   └── .gitkeep                   ✅
├── docs/
│   ├── initial_design_doc.docx    ✅
│   └── adr/
│       ├── ADR001-framework-choice.md  ✅
│       ├── ADR002-llm-provider.md      ✅
│       └── ADR003-eval-strategy.md     ✅
├── test_flow.py                   ✅
├── test_cache.py                  ✅
├── .env                           ✅ (gitignored)
├── .env.example                   ✅
├── .gitignore                     ✅
├── requirements.txt               ✅
├── README.md                      ✅
├── PLAN.md                        ✅
├── WORKFLOW.md                    ✅
└── MEMORY.md                      ✅
```

## Architectural Decisions (Locked)

These are final. Do not re-debate without a strong reason.

**1. LangGraph over CrewAI / AutoGen**
Reason: Explicit state machine, conditional edges, deterministic routing. Full ADR in docs/adr/ADR001.

**2. Groq (Llama-3.3-70B) over OpenAI**
Reason: Free tier, fast enough, 128K context. Full ADR in docs/adr/ADR002.

**3. Pydantic structured outputs on every agent**
Reason: Prevents malformed outputs breaking downstream agents. Every agent function returns a typed Pydantic model, never a raw string.

**4. Aggressive caching before every API call**
Reason: Avoids rate limits during development. All API responses saved to `cache/{tool}/{md5_hash_of_params}.json`. Dev loop never re-hits an API for same input.

**5. Revision hard cap at 2**
Reason: Prevents infinite critic→writer loops. After 2 failed revisions, escalate to HITL with a `needs_review` flag.

**6. Parallel data gathering (web + financial + news run simultaneously)**
Reason: Cuts pipeline latency. All three data agents run in parallel after orchestrator, not in sequence.

---

## Known Issues / Gotchas

- yfinance tickers for Indian stocks use `.NS` suffix (e.g., `RELIANCE.NS`, `HDFCBANK.NS`)
- NewsAPI free tier returns articles up to 1 month old only. Filter by `publishedAt` date.
- Groq rate limit is per-minute, not per-day. Space out agent calls if hitting limits.
- LangGraph Python is different from LangGraph.js (used in Capital Lens). Refer to Python docs only.

---

## GitHub Issues Tracker

## GitHub Issues Tracker

| Issue | Title | Week | Status |
|---|---|---|---|
| #1 | [W1] Tavily search tool with caching | Week 1 | ✅ Closed |
| #2 | [W1] yfinance financial data tool with caching | Week 1 | ✅ Closed |
| #3 | [W1] NewsAPI news tool with caching | Week 1 | ✅ Closed |
| #4 | [W1] LangGraph state schema (Pydantic) | Week 1 | ✅ Closed |
| #5 | [W1] End-to-end data flow test on Reliance Industries | Week 1 | ✅ Closed |
| #6 | [W1] Weekly update | Week 1 | ✅ Closed |

---

## Milestone Tracker

| Milestone | Date | Status |
|---|---|---|
| Design doc submitted | 24 Jun | ✅ Done |
| Architecture sign-off | 27 Jun | ✅ Done |
| Week 1 Demo | 4 Jul | ✅ Done |
| Week 2 Demo | 11 Jul | ⏳ Pending |
| Week 3 Demo | 18 Jul | ⏳ Pending |
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
- Next session: environment setup, requirements.txt, scaffold

### Session 2 — 29 June 2026
- Built utils/cache.py (JSON cache, md5 hashing, get/set/clear)
- Built utils/prompts.py (all 5 agent system prompts)
- Created ADR001, ADR002, ADR003 draft files
- All tests passed, everything pushed to GitHub
- Next session: tools/search.py (Tavily) — get Tavily API key tonight at app.tavily.com

### Session 3 — 30 June 2026
- Built tools/search.py (Tavily wrapper with caching)
- Verified cache hit on second call — no duplicate API hit
- Issue #1 closed
- Next session: tools/finance.py (yfinance fundamentals tool) 

### Session 4 — 1 July 2026
- Built tools/finance.py (yfinance wrapper with caching)
- Verified cache hit on second call
- Issue #2 closed
- Next session: tools/news.py (NewsAPI) — need NewsAPI key first 

### Session 5 — 4 July 2026
- Built tools/news.py (NewsAPI wrapper with caching)
- Built graph/state.py (LangGraph TypedDict state schema)
- Built test_flow.py (E2E data flow test — all 4 sections passed)
- Issues #3, #4, #5, #6 closed — Week 1 complete
- Next session: Week 2 starts — agents/orchestrator.py (Monday 7 Jul)

---

## How to Update This File

At the end of every working session:
1. Move completed items from "In Progress" to "Done"
2. Add any new blockers to "Blocked"
3. Add any new decisions to "Architectural Decisions"
4. Add any new gotchas to "Known Issues"
5. Update the file structure section to reflect what's actually on disk
6. Add a new entry to "Session Log"
7. Commit: `docs(memory): update session log and status`
8. Push

