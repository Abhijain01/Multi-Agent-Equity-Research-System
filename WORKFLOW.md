# AlphaAgents — Daily Workflow

Every day starts the same way:
1. Open `MEMORY.md` — read current status
2. Pick today's task from this file
3. Build. Commit every completed file (not every save — every completed unit)
4. End of day: update `MEMORY.md`, push everything

**Commit message format:** `type(scope): what you did`  
Examples: `feat(tools): add Tavily search wrapper with caching` | `fix(critic): cap revision loop at 2` | `docs(adr): add ADR001 framework choice`

**GitHub Issues:** Open the week's issues on Monday. Close them with commit messages using `closes #N`.

---

## Pre-Week (24–28 June) — Setup Sprint

### Day 3 · Wed 25 Jun — Environment
**Goal:** Repo is runnable locally. Nothing more.

- [x] Create and activate virtual environment: `python -m venv venv`
- [x] Create `requirements.txt` (see PLAN.md for packages)
- [x] Create `.env.example` with all key names, no values
- [x] Create `.env` with your actual keys (never commit this)
- [x] Create `.gitignore` — must include `.env`, `cache/`, `venv/`, `__pycache__/`, `*.pyc`
- [x] Create all folders + empty `__init__.py` files (see PLAN.md file structure)
- [x] Verify: `pip install -r requirements.txt` runs clean
- [x] Commit: `chore: project scaffold, requirements, gitignore`
- [x] Push

### Day 4 · Thu 26 Jun — Cache Utility
**Goal:** `utils/cache.py` fully working. This is the foundation every tool sits on.

- [x] Write `utils/cache.py`
  - `get(tool_name, params) -> dict | None` — returns cached result or None
  - `set(tool_name, params, data)` — saves result to `cache/{tool_name}/{hash}.json`
  - Params are hashed with `hashlib.md5` to generate filename
- [x] Write `utils/prompts.py` — empty dict structure, fill prompts as you build each agent
- [x] Test cache manually in a scratch script: write → read → confirm hit
- [x] Commit: `feat(utils): add JSON cache utility and prompts scaffold`
- [x] Push

### Day 5 · Fri 27 Jun — Architecture Review + ADR Drafts
**Goal:** Mentor sign-off on architecture. ADR files exist even if not fully written.

- [x] Attend architecture review with mentor
- [x] Create `docs/adr/ADR001-framework-choice.md` (draft — fill properly in Week 3)
- [x] Create `docs/adr/ADR002-llm-provider.md` (draft)
- [x] Create `docs/adr/ADR003-eval-strategy.md` (draft)
- [x] Commit: `docs(adr): add ADR drafts for framework, LLM, and eval decisions`
- [x] Push

### Day 6 · Sat 28 Jun — Week 1 GitHub Issues
**Goal:** GitHub Project board set up. Week 1 issues open.

- [x] Open these 5 GitHub Issues:
  - Issue #1: `[W1] Tavily search tool with caching`
  - Issue #2: `[W1] yfinance financial data tool with caching`
  - Issue #3: `[W1] NewsAPI news tool with caching`
  - Issue #4: `[W1] LangGraph state schema (Pydantic)`
  - Issue #5: `[W1] End-to-end data flow test on Reliance Industries`
- [x] Verify `.env` is NOT in git: `git status` should not show `.env`
- [x] Rest of day: read LangGraph Python docs — focus on state, nodes, edges

### Day 7 · Sun 29 Jun — Rest / Buffer
Use this day only if you're behind on scaffold. Otherwise rest.

---

## Week 1 (30 Jun – 4 Jul) — Tools + State Layer

**Theme:** Data flowing. No agents yet.  
**Friday Demo:** All three APIs returning data, cached, state schema defined.

### Mon 30 Jun — Tavily Search Tool
- [x] Write `tools/search.py`
  - Function: `search(query: str, max_results: int = 5) -> list[dict]`
  - Check cache first → if miss, call Tavily → save to cache → return
  - Each result: `{title, url, content, score}`
- [x] Test: call `search("Reliance Industries Q4 results")`, print results, check cache folder
- [x] Commit + close Issue #1: `feat(tools): add Tavily search wrapper closes #1`
- [x] Push

### Tue 1 Jul — Financial Data Tool
- [x] Write `tools/finance.py`
  - Function: `get_fundamentals(ticker: str) -> dict`
  - Pulls: price, PE ratio, EPS, revenue, net profit, debt-to-equity, market cap
  - Use yfinance `.info` and `.financials`
  - Cache by ticker symbol
- [x] Test: `get_fundamentals("RELIANCE.NS")`, print output
- [x] Commit + close Issue #2: `feat(tools): add yfinance fundamentals tool closes #2`
- [x] Push

### Wed 2 Jul — News Tool
- [x] Write `tools/news.py`
  - Function: `get_news(company: str, days: int = 7) -> list[dict]`
  - Pulls last N days of news from NewsAPI
  - Each result: `{title, source, published_at, description, url}`
  - Cache by `{company}_{days}`
- [x] Test: `get_news("Reliance Industries")`, print 5 results
- [x] Commit + close Issue #3: `feat(tools): add NewsAPI news tool closes #3`
- [x] Push

### Thu 3 Jul — State Schema
- [x] Write `graph/state.py`

```python
# The shape of data flowing through the entire pipeline
class ResearchState(BaseModel):
    query: str
    company: str
    plan: list[str]           # orchestrator output
    web_results: list[dict]   # web researcher output
    financial_data: dict      # financial agent output
    news_data: list[dict]     # news agent output
    draft_note: str           # writer output
    critique: str             # critic output
    revision_count: int       # max 2
    hitl_approved: bool
    hitl_feedback: str
    final_note: str
```

- [x] Commit + close Issue #4: `feat(graph): add LangGraph state schema closes #4`
- [x] Push

### Fri 4 Jul — E2E Data Flow Test + Demo #1
- [x] Write a scratch script `test_flow.py` (not in tests/ — just temp):
  - Call all three tools on "Reliance Industries"
  - Print all outputs to console
  - Confirm all three cache files exist
- [x] Record a 2-min terminal demo (just screen record — not Loom yet)
- [x] Close Issue #5: `test: E2E data flow verified on Reliance Industries closes #5`
- [x] Push everything
- [x] **Saturday GitHub Issue:** Open Issue #6 `[W1] Weekly update` and paste what's done

---

## Week 2 (7–11 Jul) — Agents + Graph Assembly

**Theme:** All 5 agents built. First full pipeline run.  
**Friday Demo:** Query in → research note out (ugly is fine, functional is not optional).

**Open Week 2 issues on Mon:**
- Issue #7: `[W2] Orchestrator agent`
- Issue #8: `[W2] Web researcher + financial data + news agents`
- Issue #9: `[W2] Writer agent`
- Issue #10: `[W2] Critic agent with revision logic`
- Issue #11: `[W2] LangGraph pipeline assembly`
- Issue #12: `[W2] First E2E pipeline run`

### Mon 7 Jul — Orchestrator + Prompts
- [x] Write orchestrator system prompt in `utils/prompts.py`
  - Input: raw query string
  - Output (Pydantic): `OrchestratorOutput(company: str, sub_questions: list[str], research_plan: list[str])`
- [x] Write `agents/orchestrator.py`
  - Takes state, calls Groq with structured output, returns updated state
- [x] Test: feed "Analyse HDFC Bank for a retail investor", print output
- [x] Commit + close #7: `feat(agents): add orchestrator agent closes #7`

### Tue 8 Jul — Data Agents (all three)
- [x] Write `agents/web_researcher.py`
  - Calls `tools/search.py` for each sub-question
  - Summarises results with citations
  - Output: `WebResearchOutput(summaries: list[str], sources: list[str])`
- [x] Write `agents/financial_data.py`
  - Calls `tools/finance.py`
  - Formats data into structured dict for writer
  - Output: `FinancialOutput(metrics: dict, analysis: str)`
- [x] Write `agents/news_agent.py`
  - Calls `tools/news.py`
  - Extracts sentiment (positive/neutral/negative) + 3 key events
  - Output: `NewsOutput(sentiment: str, key_events: list[str], sources: list[str])`
- [x] Commit + close #8: `feat(agents): add web, financial, news agents closes #8`

### Wed 9 Jul — Writer Agent
- [x] Write writer system prompt in `utils/prompts.py`
  - Input: all gathered data from state
  - Output (Pydantic): `WriterOutput(note: str)` — structured 4-6 page note with sections:
    - Investment Thesis
    - Financial Summary
    - Recent Developments
    - Key Risks
    - Comparable Companies
    - Recommendation (Buy/Hold/Sell with reasoning)
- [x] Write `agents/writer.py`
- [x] Test: feed dummy gathered data, print the note
- [x] Commit + close #9: `feat(agents): add writer agent closes #9`

### Thu 10 Jul — Critic Agent
- [x] Write critic system prompt in `utils/prompts.py`
  - Input: draft note
  - Output (Pydantic): `CriticOutput(passed: bool, issues: list[str], feedback: str)`
  - Checks: every claim cited? risks section present? recommendation has reasoning?
- [x] Write `agents/critic.py`
  - If `passed=True` → move to HITL
  - If `passed=False` and `revision_count < 2` → send back to writer
  - If `passed=False` and `revision_count >= 2` → escalate to HITL with flag
- [x] Commit + close #10: `feat(agents): add critic agent with revision cap closes #10`

### Fri 11 Jul — Graph Assembly + Demo #2
- [ ] Write `graph/pipeline.py`
  - Define all nodes (one per agent)
  - Define edges: orchestrator → parallel (web+financial+news) → writer → critic
  - Conditional edge from critic: revise → writer | pass → HITL
- [ ] Run full pipeline: `python -m alphaagents.graph.pipeline --query "Analyse Reliance Industries"`
- [ ] Note goes all the way through — even if messy
- [ ] Commit + close #11 and #12
- [ ] **Saturday update:** Issue with full Week 2 summary

---

## Week 3 (14–18 Jul) — FastAPI Backend + React Frontend

**Theme:** Build and deploy the full-stack product.
**Friday Demo:** Live URL working. FastAPI streaming to React frontend. All 3 additional features visible.

**Open Week 3 issues on Mon:**
- Issue #13: `[W3] FastAPI backend with SSE streaming`
- Issue #14: `[W3] React/Next.js frontend — core UI`
- Issue #15: `[W3] Additional features (PDF, comparison, eval scores)`
- Issue #16: `[W3] Langfuse tracing + pytest tests`
- Issue #17: `[W3] ADR final versions + deploy`

---

### Mon 14 Jul — FastAPI Backend

**Goal:** FastAPI running locally, SSE streaming pipeline events to curl.

- [ ] Create `backend/` folder structure
- [ ] Write `backend/models.py` — Pydantic request/response models
  ```python
  class ResearchRequest(BaseModel):
      query: str
  class NoteApprovalRequest(BaseModel):
      note_id: str
  class RevisionRequest(BaseModel):
      note_id: str
      feedback: str
  class ComparisonRequest(BaseModel):
      query1: str
      query2: str
  ```
- [ ] Write `backend/store.py` — in-memory dict `{note_id: note_data}` for storing notes between requests
- [ ] Write `backend/routes/research.py`
  - `POST /api/research/run` → StreamingResponse with SSE events (one per agent)
  - `GET /api/research/history` → returns all stored notes
  - `POST /api/research/approve` → marks note as published
  - `POST /api/research/revise` → sends feedback, re-runs writer + critic
- [ ] Write `backend/routes/comparison.py`
  - `POST /api/comparison/run` → runs two pipelines with `asyncio.gather()`, SSE both
- [ ] Write `backend/routes/export.py`
  - `GET /api/research/{note_id}/pdf` → generates PDF via reportlab, returns as file
- [ ] Write `backend/routes/eval.py`
  - `POST /api/eval/score` → runs LLM-as-judge, returns `{factuality, completeness, actionability}`
- [ ] Write `backend/main.py`
  - FastAPI app init, CORS middleware, include all routers
- [ ] Test: `uvicorn backend.main:app --reload` runs clean
- [ ] Test: `curl -N http://localhost:8000/api/research/run -d '{"query": "Analyse HDFC Bank"}'` streams SSE events
- [ ] Commit + close #13: `feat(backend): FastAPI with SSE streaming pipeline closes #13`

---

### Tue 15 Jul — React Frontend Core

**Goal:** Next.js app running locally, consuming SSE, showing agent status and research note.

- [ ] Init Next.js app: `npx create-next-app@latest frontend --typescript --tailwind --app`
- [ ] Write `frontend/lib/api.ts` — typed fetch wrappers for all backend endpoints
- [ ] Write `frontend/lib/sse.ts` — `useSSE` hook that connects to backend and yields events
- [ ] Write `frontend/components/QueryInput.tsx`
  - Text area for query
  - "Run Research" button
  - Loading state while pipeline runs
- [ ] Write `frontend/components/AgentPipeline.tsx`
  - 6 agent cards (orchestrator → web → finance → news → writer → critic)
  - Each card: waiting (gray) → running (blue pulse) → done (green)
  - Consumes SSE `agent_start` and `agent_done` events
- [ ] Write `frontend/components/MetricsRow.tsx`
  - 5 metric cards: Price, Market Cap, PE, ROE, Dividend Yield
- [ ] Write `frontend/components/ResearchNote.tsx`
  - Full note display: all 6 sections with proper typography
  - Citations displayed inline
- [ ] Write `frontend/app/page.tsx`
  - Layout: left panel (query + pipeline) + right panel (note output)
- [ ] Test: `npm run dev` → type a query → see agents animate → see note appear
- [ ] Commit + close #14: `feat(frontend): Next.js core UI with SSE agent tracker closes #14`

---

### Wed 16 Jul — Additional Features

**Goal:** All 3 additional features working end-to-end.

**PDF Export:**
- [ ] Add reportlab to backend: `pip install reportlab`
- [ ] Complete `backend/routes/export.py` — formats note into A4 PDF with sections, citations, branding
- [ ] Add "Download PDF" button to `ResearchNote.tsx` — hits `/api/research/{id}/pdf`, triggers browser download

**Multi-Company Comparison:**
- [ ] Complete `backend/routes/comparison.py` — `asyncio.gather()` runs both pipelines simultaneously
- [ ] Write `frontend/components/ComparisonView.tsx`
  - Two-column layout: Company A left, Company B right
  - Shared metrics comparison table (PE, ROE, Market Cap side-by-side with delta)
  - Both agent pipelines show status simultaneously
- [ ] Write `frontend/app/comparison/page.tsx` — two query inputs + comparison view
- [ ] Add "Compare" link to main nav

**Eval Scores:**
- [ ] Complete `backend/routes/eval.py` — LLM-as-judge scores each note (factuality, completeness, actionability 1-5)
- [ ] Write `frontend/components/EvalScores.tsx`
  - 3 circular gauge components
  - Color: ≥4 green, 3-4 amber, <3 red
  - Displayed below the research note
- [ ] Auto-trigger eval after pipeline completes — append scores to SSE stream as `eval_done` event

- [ ] Commit + close #15: `feat: PDF export, comparison, eval scores closes #15`

---

### Thu 17 Jul — Langfuse + Tests + ADRs

**Goal:** Observability, tests, and final ADRs done.

- [ ] Add Langfuse tracing to all 5 agents
  - Log: input, output, latency, token count per agent call
  - Verify: run one pipeline → open Langfuse dashboard → see 5 agent traces
- [ ] Write `tests/test_tools.py` — cache hit/miss, API response shapes
- [ ] Write `tests/test_agents.py` — mock Groq, test Pydantic output shapes
- [ ] Write `tests/test_graph.py` — full integration test on stub data
- [ ] Run: `pytest tests/ -v` — all passing
- [ ] Write final versions of ADRs:
  - ADR001: LangGraph vs CrewAI vs AutoGen
  - ADR002: Groq vs OpenAI vs Ollama
  - ADR003: LLM-as-judge vs RAGAS
  - ADR004: FastAPI + React vs Streamlit
  - ADR005: SSE vs WebSockets for streaming
- [ ] Commit + close #16: `feat: Langfuse tracing, tests, final ADRs closes #16`

---

### Fri 18 Jul — Deploy + Demo #3

**Goal:** Live URLs for both frontend and backend.

**Backend → HuggingFace Spaces:**
- [ ] Write `backend/Dockerfile`
- [ ] Create HuggingFace Space (Docker SDK type)
- [ ] Push backend Docker image — verify `https://{username}-alphaagents-api.hf.space/docs` loads
- [ ] Set HF Spaces secrets for all API keys

**Frontend → Vercel:**
- [ ] Set `NEXT_PUBLIC_API_URL` env var in Vercel to point to HF Space URL
- [ ] `vercel deploy` — get live URL
- [ ] Verify: open Vercel URL → type query → see live agent stream → see note

- [ ] Update README with both live URLs
- [ ] Commit + close #17: `deploy: backend on HF Spaces, frontend on Vercel closes #17`

### Sat 19 Jul — MILESTONE 1 SUBMISSION
- [ ] Create GitHub Release: tag `v1.0-milestone-1`
- [ ] Release notes: what works, architecture diagram, both live URLs
- [ ] Submit to Futurense

---

## Week 4 (21–25 Jul) — Polish + Final Submission

**Theme:** Make it interview-ready.

**Open Week 4 issues on Mon:**
- Issue #18: `[W4] UI polish + 20-query eval suite`
- Issue #19: `[W4] Loom walkthrough recording`
- Issue #20: `[W4] Thinking artifact — engineering postmortem`
- Issue #21: `[W4] Resume bullets + final submission`

### Mon 21 Jul — Polish + Eval Suite
- [ ] Fix any mentor feedback from Milestone 1
- [ ] UI polish: loading skeletons, error states, empty states, mobile layout
- [ ] Run full eval suite (20 queries), save all results to `eval/results/`
- [ ] Commit: `feat(eval): full 20-query eval suite results`

### Tue 22 Jul — History + Watchlist Polish
- [ ] Polish research history page — list of past notes with ticker, date, BUY/HOLD/SELL badge
- [ ] Polish comparison page layout
- [ ] Cross-browser test (Chrome, Safari, Firefox)
- [ ] Commit: `feat(frontend): polish history and comparison pages`

### Wed 23 Jul — Loom Recording
- [ ] Record 5-min Loom:
  - 0:00 — "AlphaAgents generates a full equity research note in 5 minutes using 6 AI agents"
  - 0:20 — Type "Analyse Reliance Industries for a retail investor" → hit Run
  - 0:40 — Show agents animating live (orchestrator → data agents → writer → critic)
  - 2:00 — Walk through the research note: thesis, financials, risks, recommendation
  - 3:00 — Show eval scores (factuality 4.2, completeness 4.6, actionability 3.9)
  - 3:20 — Click "Download PDF" — show the generated PDF
  - 3:40 — Show comparison: HDFC Bank vs ICICI Bank side by side
  - 4:10 — Show Langfuse traces (5 agent spans visible)
  - 4:30 — Show GitHub repo: README, 5 ADRs, tests passing
  - 4:50 — "Next I'd add real-time market data and a portfolio-level view"
- [ ] Add Loom link to README
- [ ] Commit + close #19

### Thu 24 Jul — Thinking Artifact
- [ ] Write `docs/postmortem.md` — 1500+ words
  - Why the problem matters (retail investors vs institutional research gap)
  - Every major architectural decision and what you'd change
  - What broke and how you fixed it (be specific — name the actual bugs)
  - What the eval scores mean (where agents fail and why)
  - What a production version would look like (real-time data, user auth, paid tiers)
- [ ] Commit + close #20

### Fri 25 Jul — Final Submission
- [ ] Update resume with 4 project bullets:
  ```
  • Built AlphaAgents — a 6-agent LangGraph pipeline that generates cited equity research notes
    in <5 min; FastAPI backend on HuggingFace Spaces streaming SSE to a Next.js frontend on Vercel
  • Implemented parallel data gathering (web + financial + news agents via asyncio.gather()),
    reducing pipeline latency by ~40% vs sequential execution
  • Built LLM-as-judge eval framework scoring 20 queries on factuality, completeness, and
    actionability; avg scores: 4.2 / 4.6 / 3.9 out of 5
  • Added PDF export (reportlab), multi-company comparison, and real-time agent status
    streaming — 3 production features beyond the base internship spec
  ```
- [ ] Final push — verify both live URLs work
- [ ] Create GitHub Release: `v2.0-final`
- [ ] Submit to Futurense
- [ ] Commit + close #21

---

## Sun 26 Jul — Showcase Day

- Open Vercel URL on laptop
- Have Langfuse dashboard open in tab 2
- Have GitHub repo open in tab 3
- Walk through: query → live agent animation → note → eval scores → PDF download → comparison
- Know your 5 ADR decisions cold — you will be asked "why FastAPI not Streamlit" and "why SSE not WebSockets"