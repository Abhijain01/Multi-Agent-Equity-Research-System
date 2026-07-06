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
- [ ] Write `agents/web_researcher.py`
  - Calls `tools/search.py` for each sub-question
  - Summarises results with citations
  - Output: `WebResearchOutput(summaries: list[str], sources: list[str])`
- [ ] Write `agents/financial_data.py`
  - Calls `tools/finance.py`
  - Formats data into structured dict for writer
  - Output: `FinancialOutput(metrics: dict, analysis: str)`
- [ ] Write `agents/news_agent.py`
  - Calls `tools/news.py`
  - Extracts sentiment (positive/neutral/negative) + 3 key events
  - Output: `NewsOutput(sentiment: str, key_events: list[str], sources: list[str])`
- [ ] Commit + close #8: `feat(agents): add web, financial, news agents closes #8`

### Wed 9 Jul — Writer Agent
- [ ] Write writer system prompt in `utils/prompts.py`
  - Input: all gathered data from state
  - Output (Pydantic): `WriterOutput(note: str)` — structured 4-6 page note with sections:
    - Investment Thesis
    - Financial Summary
    - Recent Developments
    - Key Risks
    - Comparable Companies
    - Recommendation (Buy/Hold/Sell with reasoning)
- [ ] Write `agents/writer.py`
- [ ] Test: feed dummy gathered data, print the note
- [ ] Commit + close #9: `feat(agents): add writer agent closes #9`

### Thu 10 Jul — Critic Agent
- [ ] Write critic system prompt in `utils/prompts.py`
  - Input: draft note
  - Output (Pydantic): `CriticOutput(passed: bool, issues: list[str], feedback: str)`
  - Checks: every claim cited? risks section present? recommendation has reasoning?
- [ ] Write `agents/critic.py`
  - If `passed=True` → move to HITL
  - If `passed=False` and `revision_count < 2` → send back to writer
  - If `passed=False` and `revision_count >= 2` → escalate to HITL with flag
- [ ] Commit + close #10: `feat(agents): add critic agent with revision cap closes #10`

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

## Week 3 (14–18 Jul) — Hardening

**Theme:** Tests, UI, tracing, eval, ADRs.  
**Friday Demo:** "Clone this repo, run it in 15 minutes, see a working demo."

**Open Week 3 issues on Mon:**
- Issue #13: `[W3] Streamlit HITL UI`
- Issue #14: `[W3] Langfuse tracing on all agents`
- Issue #15: `[W3] Eval suite — 20 queries + LLM-as-judge`
- Issue #16: `[W3] Unit + integration tests`
- Issue #17: `[W3] ADR001, ADR002, ADR003 — final versions`

### Mon 14 Jul — Streamlit HITL UI
- [ ] Write `app.py`
  - Text input for query
  - "Run Research" button triggers full pipeline
  - Live status: shows which agent is currently running
  - Displays draft note after critic passes
  - "Approve" button → saves to `final_note` in state
  - "Request Revision" button + text input → sends feedback to writer
- [ ] Commit + close #13

### Tue 15 Jul — Langfuse Tracing
- [ ] Add Langfuse client to each agent
  - Log: input state, output, latency, token count
- [ ] Add trace names that make sense in the dashboard
- [ ] Verify: run one pipeline, open Langfuse dashboard, see all 5 agent traces
- [ ] Commit + close #14

### Wed 16 Jul — Eval Suite
- [ ] Write `eval/queries.json` — 20 queries across Indian sectors:
  - Large cap (Reliance, TCS, HDFC Bank, Infosys, ICICI Bank)
  - Mid cap (Zomato, Paytm, Nykaa, Delhivery, PB Fintech)
  - Sector queries (IT sector, Banking sector, FMCG sector)
  - Stress queries (loss-making companies, recent controversy, IPOs)
- [ ] Write `eval/run.py`
  - Run pipeline on each query
  - LLM-as-judge: score factuality (1-5), completeness (1-5), actionability (1-5)
  - Save results to `eval/results/{timestamp}.json`
- [ ] Run eval on at least 5 queries, check scores
- [ ] Commit + close #15

### Thu 17 Jul — Tests
- [ ] Write `tests/test_tools.py`
  - Test cache hit (call tool → cached → call again → returns from cache)
  - Test Tavily returns list of dicts with expected keys
  - Test yfinance returns dict with `PE`, `marketCap`, etc.
- [ ] Write `tests/test_agents.py`
  - Test each agent returns correct Pydantic model shape
  - Mock the LLM calls (don't hit Groq in tests)
- [ ] Write `tests/test_graph.py`
  - Integration test: full pipeline run on stub data
  - Assert final state has `final_note` populated
- [ ] Run: `pytest tests/ -v`
- [ ] Commit + close #16

### Fri 18 Jul — ADRs + Demo #3 + Milestone 1 Prep
- [ ] Write final versions of all 3 ADRs
  - ADR001: LangGraph vs CrewAI vs AutoGen — full trade-off table
  - ADR002: Groq vs OpenAI vs local Ollama — cost, speed, quality
  - ADR003: LLM-as-judge vs RAGAS vs human eval — why LLM-as-judge fits here
- [ ] Update `README.md` — make sure clone-to-run works in 15 min
- [ ] Push everything
- [ ] Commit + close #17

### Sat 19 Jul — MILESTONE 1 SUBMISSION
- [ ] Create GitHub Release: tag `v1.0-milestone-1`
- [ ] Release notes: what works, what's next
- [ ] Submit to Futurense as per their instructions

---

## Week 4 (21–25 Jul) — Production Polish

**Theme:** Ship it.

**Open Week 4 issues on Mon:**
- Issue #18: `[W4] Dockerfile + HuggingFace Spaces deployment`
- Issue #19: `[W4] Loom walkthrough recording`
- Issue #20: `[W4] Thinking artifact — engineering memo`
- Issue #21: `[W4] Resume bullets + final submission`

### Mon 21 Jul — Bug Fixes + Polish
- [ ] Fix any issues from Milestone 1 mentor feedback
- [ ] Polish Streamlit UI (clean layout, no raw JSON visible to user)
- [ ] Run full eval suite (all 20 queries), save results

### Tue 22 Jul — Dockerfile + Deploy
- [ ] Write `Dockerfile`
- [ ] Test: `docker build . && docker run` works locally
- [ ] Create HuggingFace Space (Streamlit, public)
- [ ] Push Docker image, verify live URL works
- [ ] Commit + close #18

### Wed 23 Jul — Loom Recording
- [ ] Record 5-min Loom:
  - 0:00 — What AlphaAgents is (one sentence, show the UI)
  - 0:30 — Type a query, hit Run
  - 1:00 — Walk through each agent as it runs (show Langfuse traces)
  - 3:00 — Show the final research note
  - 3:30 — Show the eval results (scores table)
  - 4:00 — Show the GitHub repo (README, ADRs, tests passing)
  - 4:30 — One sentence: what you'd build next
- [ ] Add Loom link to README
- [ ] Commit + close #19

### Thu 24 Jul — Thinking Artifact
- [ ] Write `docs/postmortem.md` — 1500+ words
  - What the problem is and why it matters
  - Architecture decisions and what you'd change
  - What broke and how you fixed it
  - What the eval results actually mean
  - What a production version would look like
- [ ] Commit + close #20

### Fri 25 Jul — Final Submission
- [ ] Update resume with 3-4 project bullets
- [ ] Final push — verify GitHub shows green, live URL works
- [ ] Create GitHub Release: `v2.0-final`
- [ ] Submit to Futurense
- [ ] Commit + close #21

---

## Sun 26 Jul — Showcase Day

- Prepare 5-minute live demo
- Walk through: query → agents → note → eval scores → architecture decision
- Have Langfuse dashboard open in a tab
- Have the GitHub repo open in another tab
