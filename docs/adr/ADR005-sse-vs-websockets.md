# ADR005 — Streaming Protocol: SSE vs WebSockets

**Status:** Final  
**Date:** 14 July 2026  
**Author:** Abhishek Jain

---

## Context

The frontend needs real-time updates as each agent completes. Two streaming protocols were considered: Server-Sent Events (SSE) and WebSockets.

---

## Decision

**Chosen: Server-Sent Events (SSE)**

---

## Trade-off Table

| Criterion | SSE | WebSockets |
|---|---|---|
| Direction | Unidirectional (server → client) | Bidirectional |
| Protocol | HTTP/1.1 and HTTP/2 | Separate WS protocol |
| Browser support | Universal | Universal |
| FastAPI support | Native `StreamingResponse` | Requires `websockets` library |
| Reconnection | Automatic (browser handles) | Manual implementation needed |
| Complexity | Low | High |
| Suitable for our use case | ✅ Yes | ⚠️ Over-engineered |

---

## Reasoning

The data flow in AlphaAgents is strictly unidirectional: the server pushes agent status events to the client. The client never needs to push data mid-stream (all client inputs happen before the pipeline starts).

WebSockets introduce bidirectional complexity that is unnecessary here. They require a separate handshake, custom reconnection logic, and a more complex FastAPI setup (`WebSocket` endpoint vs `StreamingResponse`).

SSE uses plain HTTP, works transparently through proxies and load balancers, and the browser handles reconnection automatically. It is the right tool for a server-to-client event stream.

---

## SSE Event Format Used

```
data: {"event": "agent_start", "agent": "orchestrator", "message": "Planning research..."}\n\n
data: {"event": "agent_done",  "agent": "orchestrator", "company": "HDFC Bank"}\n\n
data: {"event": "pipeline_done", "note_id": "...", "note": {...}}\n\n
```

---

## Consequences

- FastAPI routes return `StreamingResponse` with `media_type="text/event-stream"`
- Required headers: `Cache-Control: no-cache`, `X-Accel-Buffering: no`
- Frontend uses `fetch()` with a `ReadableStream` reader (not `EventSource`) to support POST requests
- SSE connections time out on some cloud providers after ~30s — add a heartbeat event every 15s if needed for long pipelines