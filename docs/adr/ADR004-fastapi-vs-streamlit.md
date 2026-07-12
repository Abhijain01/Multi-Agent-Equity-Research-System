# ADR004 — UI Architecture: FastAPI + React vs Streamlit

**Status:** Final  
**Date:** 14 July 2026  
**Author:** Abhishek Jain

---

## Context

AlphaAgents needs a user interface for the HITL checkpoint, real-time agent status display, multi-company comparison, and PDF export. Two architectures were considered: a Streamlit monolith and a FastAPI backend + React frontend.

---

## Decision

**Chosen: FastAPI backend + Next.js/React frontend**

- Backend: FastAPI on HuggingFace Spaces (Docker)
- Frontend: Next.js on Vercel
- Communication: Server-Sent Events (SSE) for real-time streaming

---

## Trade-off Table

| Criterion | FastAPI + React | Streamlit |
|---|---|---|
| UI quality | Production-grade, full control | Limited by Streamlit components |
| Real-time streaming | Native SSE support | Hacky workarounds |
| Deployment | Two services (HF Spaces + Vercel) | One service |
| Build complexity | High — two codebases | Low — one Python file |
| Interview impressiveness | High | Medium |
| Separation of concerns | Clean | Coupled |
| Frontend reusability | Components reusable | Not reusable |
| Time to build | ~3 days | ~1 day |

---

## Reasoning

Streamlit was the initial choice for its simplicity. It was rejected for three reasons:

**1. Real-time streaming is awkward in Streamlit.** Displaying per-agent status updates as they happen requires `st.empty()` and `st.status()` hacks. SSE in FastAPI is native and clean.

**2. The frontend should look production-grade.** The internship is evaluated on product sense (25%) as much as technical depth. A Next.js app with Tailwind can match Capital Lens quality. A Streamlit app cannot, regardless of custom CSS.

**3. Separation of concerns matters at interview.** Being able to say "stateless frontend on Vercel, stateful backend on HuggingFace Spaces, communicating via SSE" demonstrates system design thinking. A Streamlit monolith does not.

---

## Consequences

- Two separate deploy targets: HF Spaces (FastAPI) and Vercel (Next.js)
- `NEXT_PUBLIC_API_URL` env var must be set on Vercel to point to HF Spaces URL
- CORS middleware required on FastAPI to allow Vercel origin
- Frontend developer needs to handle SSE reconnection on network drops