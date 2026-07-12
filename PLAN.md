# AlphaAgents — Execution Plan (UPDATED: Option B UI)

**Repo:** https://github.com/Abhijain01/Multi-Agent-Equity-Research-System  
**Local:** `C:\Users\abhis\FinPilot`  
**Duration:** 22 June → 26 July 2026  
**Segment:** 5 — LLM Systems & Applied GenAI | Problem E1

---

## The One Rule

Build in dependency order. Never start a layer before the layer below it works.  
Tools → State → Agents → Graph → FastAPI Backend → React Frontend → Eval → Deploy.

---

## Architecture (UPDATED — Option B)

```
┌─────────────────────┐         ┌──────────────────────────┐
│   Next.js Frontend  │  HTTP   │   FastAPI Backend         │
│   (Vercel)          │ ──────► │   (HuggingFace Spaces)   │
│                     │   SSE   │                           │
│  - Query input      │ ◄────── │  - /api/research/run      │
│  - Agent status     │         │  - /api/research/history  │
│  - Research note    │         │  - /api/comparison/run    │
│  - PDF export       │         │  - /api/research/{id}/pdf │
│  - Comparison UI    │         │  - /api/eval/score        │
│  - Eval scores      │         │                           │
└─────────────────────┘         │  LangGraph Pipeline       │
                                │  (all 5 agents)           │
                                └──────────────────────────┘
```

**Interview answer for two-service deploy:**  
"I separated concerns — stateless React frontend on Vercel, stateful LangGraph backend on HuggingFace Spaces via Docker. FastAPI streams agent status to the frontend via SSE so the UI updates in real time without polling."

---

## Tech Stack (Locked — UPDATED)

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
| **Backend API** | **FastAPI** | **latest** |
| **Streaming** | **SSE (Server-Sent Events)** | **via FastAPI StreamingResponse** |
| **Frontend** | **Next.js + React** | **latest** |
| **Frontend deploy** | **Vercel** | **— (free)** |
| PDF export | reportlab | latest (server-side) |
| Testing | pytest | latest |
| **Backend deploy** | **HuggingFace Spaces (Docker)** | **—** |

---

## File Structure (Final Target — UPDATED)

```
FinPilot/
├── alphaagents/                    # Python agent package (unchanged)
│   ├── agents/
│   │   ├── orchestrator.py         ✅ Done
│   │   ├── web_researcher.py
│   │   ├── financial_data.py
│   │   ├── news_agent.py
│   │   ├── writer.py
│   │   └── critic.py
│   ├── graph/
│   │   ├── state.py                ✅ Done
│   │   └── pipeline.py
│   ├── tools/
│   │   ├── search.py               ✅ Done
│   │   ├── finance.py              ✅ Done
│   │   └── news.py                 ✅ Done
│   ├── eval/
│   │   ├── queries.json
│   │   ├── run.py
│   │   └── results/
│   └── utils/
│       ├── cache.py                ✅ Done
│       └── prompts.py              ✅ Done
│
├── backend/                        # NEW — FastAPI backend
│   ├── main.py                     # FastAPI app, CORS, lifespan
│   ├── routes/
│   │   ├── research.py             # POST /run, GET /history, POST /approve
│   │   ├── comparison.py           # POST /comparison/run (two parallel pipelines)
│   │   ├── export.py               # GET /{id}/pdf (reportlab PDF)
│   │   └── eval.py                 # POST /eval/score (LLM-as-judge)
│   ├── models.py                   # Pydantic request/response models
│   ├── store.py                    # In-memory note store (dict, keyed by note_id)
│   └── Dockerfile                  # For HuggingFace Spaces deploy
│
├── frontend/                       # NEW — Next.js frontend
│   ├── app/
│   │   ├── page.tsx                # Main research page
│   │   ├── comparison/page.tsx     # Side-by-side comparison page
│   │   └── layout.tsx              # Root layout, fonts, theme
│   ├── components/
│   │   ├── QueryInput.tsx          # Query input + Run button
│   │   ├── AgentPipeline.tsx       # Live agent status tracker (SSE consumer)
│   │   ├── ResearchNote.tsx        # Full note display (all 6 sections)
│   │   ├── EvalScores.tsx          # Factuality/Completeness/Actionability gauges
│   │   ├── HitlBar.tsx             # Approve / Request Revision bar
│   │   ├── ComparisonView.tsx      # Side-by-side two-company layout
│   │   └── MetricsRow.tsx          # 5 key financial metric cards
│   ├── lib/
│   │   ├── api.ts                  # API client (fetch wrappers)
│   │   └── sse.ts                  # SSE hook (useSSE)
│   ├── package.json
│   └── next.config.js
│
├── tests/
├── docs/
├── cache/
├── .env
├── .env.example
├── requirements.txt
├── README.md
├── PLAN.md
├── WORKFLOW.md
└── MEMORY.md
```

---

## API Endpoints (FastAPI Backend)

| Method | Endpoint | What it does |
|---|---|---|
| POST | `/api/research/run` | Starts pipeline, streams SSE events per agent |
| GET | `/api/research/history` | Returns list of all past research notes |
| POST | `/api/research/approve` | Marks note as approved/published |
| POST | `/api/research/revise` | Sends feedback, re-runs writer + critic |
| GET | `/api/research/{id}/pdf` | Returns formatted PDF of the note |
| POST | `/api/comparison/run` | Runs two pipelines in parallel, streams both |
| POST | `/api/eval/score` | Runs LLM-as-judge on a note, returns scores |

### SSE Event Shape (streaming)
```json
{ "event": "agent_start",  "agent": "orchestrator", "message": "Planning research..." }
{ "event": "agent_done",   "agent": "orchestrator", "output": { "company": "...", "ticker": "..." } }
{ "event": "agent_start",  "agent": "web_researcher", "message": "Searching 4 questions..." }
{ "event": "pipeline_done","note": { ...full research note... } }
{ "event": "eval_done",    "scores": { "factuality": 4.2, "completeness": 4.6, "actionability": 3.9 } }
```

---

## Additional Features (Locked)

### 1. PDF Export
- Backend: `GET /api/research/{id}/pdf` generates PDF via reportlab
- Frontend: "Download PDF" button on each note → triggers download
- PDF includes: header, all 6 sections, sources, AlphaAgents branding

### 2. Multi-Company Comparison
- Route: `POST /api/comparison/run` with `{query1, query2}`
- Backend: runs both pipelines with `asyncio.gather()` in parallel
- Frontend: `/comparison` page, split-screen layout, shared metrics comparison table

### 3. Eval Scores Display
- After note generation, auto-runs LLM-as-judge scoring
- 3 scores: Factuality (1-5), Completeness (1-5), Actionability (1-5)
- Displayed as circular gauge components on each note card
- Color-coded: ≥4 = green, 3-4 = amber, <3 = red

---

## Build Order & Dependencies (UPDATED)

### Layer 0-4 — Python Agent Package (Week 1 + Week 2)
Tools ✅ → State ✅ → Agents (in progress) → Graph → Done

### Layer 5 — FastAPI Backend (Week 3, Mon-Tue)
- `backend/main.py` — FastAPI app with CORS, lifespan
- `backend/models.py` — Pydantic models for all requests/responses
- `backend/store.py` — in-memory note store
- `backend/routes/research.py` — SSE streaming pipeline runner
- `backend/routes/comparison.py` — parallel comparison runner
- `backend/routes/export.py` — PDF generation
- `backend/routes/eval.py` — LLM-as-judge scoring endpoint

### Layer 6 — React Frontend (Week 3, Wed-Thu)
- Next.js app init
- `lib/sse.ts` — SSE consumer hook
- `lib/api.ts` — API client
- `components/AgentPipeline.tsx` — live status tracker
- `components/ResearchNote.tsx` — full note display
- `components/EvalScores.tsx` — gauge scores
- `components/HitlBar.tsx` — approve/revise
- `components/ComparisonView.tsx` — side-by-side
- `app/page.tsx` — main page
- `app/comparison/page.tsx` — comparison page

### Layer 7 — Hardening (Week 3 Fri + Week 4)
- pytest tests
- Langfuse tracing
- 3 final ADRs
- 20-query eval suite

### Layer 8 — Deploy (Week 4)
- Backend: `backend/Dockerfile` → HuggingFace Spaces
- Frontend: Vercel deploy (automatic from GitHub)

---

## Milestones

| Date | Milestone | What must be true |
|---|---|---|
| 11 Jul | Week 2 Demo | Full pipeline runs end-to-end: query in → research note out |
| 18 Jul | Week 3 Demo | Live URL: FastAPI backend + React frontend deployed |
| 19 Jul | **Milestone 1** | GitHub Release v1.0-milestone-1 |
| 25 Jul | **Final** | Everything submitted, Loom recorded |
| 26 Jul | Showcase | Live demo to panel |

---

## Architectural Decisions (Summary — UPDATED)

**7. FastAPI + React over Streamlit (NEW)**  
Reason: Genuine production-grade separation of concerns. React frontend on Vercel can be polished to Capital Lens quality. SSE gives real-time agent status without polling. Two-service architecture is more impressive and more defensible in an interview than a Streamlit monolith.

**8. SSE over WebSockets for streaming (NEW)**  
Reason: SSE is unidirectional (server → client) which matches the use case — we never need the client to push data mid-stream. SSE is simpler to implement, works over HTTP/2, and doesn't require a separate WebSocket server. WebSockets would be over-engineered for this.

**9. reportlab for PDF export on backend (NEW)**  
Reason: Client-side PDF generation (jsPDF, react-pdf) produces inconsistent output. Backend PDF via reportlab gives pixel-perfect, consistent output regardless of browser. PDF is returned as a streaming response from FastAPI.

**10. asyncio.gather() for parallel comparison (NEW)**  
Reason: Both company pipelines are I/O-bound (API calls + LLM calls). Running them with asyncio.gather() gives true parallelism without threads or subprocesses.

---

## Success Criteria (Interview-Defensible — UPDATED)

1. "The pipeline runs end-to-end in under 5 minutes for any Indian listed company."
2. "The frontend is a Next.js app on Vercel. The backend is FastAPI on HuggingFace Spaces streaming SSE events."
3. "I can compare two stocks side-by-side — both pipelines run in parallel via asyncio.gather()."
4. "Every research note can be exported as a formatted PDF generated server-side with reportlab."
5. "Every note has LLM-as-judge eval scores — factuality, completeness, actionability — displayed as gauge components."
6. "I made 10 explicit architectural decisions documented in ADRs."
7. "The deployed URL is live. Clone-to-run takes under 15 minutes."