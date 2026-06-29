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

**Last updated:** 29 June 2026
**Current phase:** Pre-Week Complete — Week 1 starts tomorrow
**Current week goal:** Tools layer (Tavily, yfinance, NewsAPI) + State schema

### What is DONE
- [x] GitHub repo created and initialized
- [x] LICENSE, README.md, PLAN.md, WORKFLOW.md, MEMORY.md pushed
- [x] docs/initial_design_doc.docx pushed
- [x] Virtual environment (venv) created and activated
- [x] requirements.txt installed clean
- [x] .gitignore, .env.example created
- [x] Full folder scaffold with all __init__.py files
- [x] cache/.gitkeep in place
- [x] utils/cache.py — JSON cache utility, all tests passed
- [x] utils/prompts.py — all 5 agent prompts written
- [x] docs/adr/ADR001, ADR002, ADR003 — draft versions pushed
- [x] test_cache.py — manual test passed

### What is IN PROGRESS
- [ ] GitHub Issues #1-#5 for Week 1 (open these on github.com tonight)

### What is BLOCKED
- Tavily API key not yet obtained (needed Monday for tools/search.py)
- NewsAPI key not yet obtained (needed Wednesday for tools/news.py)
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
| Tavily | ❌ Not yet | 1K searches/month | Get at app.tavily.com |
| yfinance | ✅ No key needed | Unlimited | Just pip install |
| NewsAPI | ❌ Not yet | 100 req/day | Get at newsapi.org |
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

## File Structure — Target (copy from PLAN.md when built)

```
FinPilot/
├── alphaagents/
│   ├── __init__.py
│   ├── agents/
│   │   ├── orchestrator.py
│   │   ├── web_researcher.py
│   │   ├── financial_data.py
│   │   ├── news_agent.py
│   │   ├── writer.py
│   │   └── critic.py
│   ├── graph/
│   │   ├── state.py
│   │   └── pipeline.py
│   ├── tools/
│   │   ├── search.py
│   │   ├── finance.py
│   │   └── news.py
│   ├── eval/
│   │   ├── queries.json
│   │   ├── run.py
│   │   └── results/
│   └── utils/
│       ├── cache.py
│       └── prompts.py
├── app.py
├── tests/
├── cache/
├── docs/
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

| Issue | Title | Week | Status |
|---|---|---|---|
| — | — | Pre-week | Not opened yet |

*(Update this table as issues are opened and closed)*

---

## Milestone Tracker

| Milestone | Date | Status |
|---|---|---|
| Design doc submitted | 24 Jun | ✅ Done |
| Architecture sign-off | 27 Jun | ⏳ Pending |
| Week 1 Demo | 4 Jul | ⏳ Pending |
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

