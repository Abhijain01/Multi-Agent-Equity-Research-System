// frontend/lib/sse.ts
import { useState, useCallback } from "react";

interface SSEEvent {
  event: string;
  agent?: string;
  message?: string;
  [key: string]: any;
}

export function useSSEPipeline() {
  const [agents, setAgents] = useState<any[]>([]);
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stream = useCallback(async (
    url: string,
    body: any,
    onComplete?: (evt: any) => void
  ) => {
    setIsRunning(true);
    setError(null);
    setAgents([]);
    setEvents([]);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to start pipeline");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.replace("data: ", ""));
            setEvents((prev) => [...prev, data]);

            if (data.event === "agent_start" || data.event === "agent_done") {
              setAgents((prev) => {
                const idx = prev.findIndex((a) => a.name === data.agent);
                const newAgent = {
                  name: data.agent,
                  status: data.event === "agent_start" ? "running" : "done",
                  message: data.message || "",
                };
                if (idx !== -1) {
                  const copy = [...prev];
                  copy[idx] = newAgent;
                  return copy;
                }
                return [...prev, newAgent];
              });
            }

            if (data.event === "pipeline_done" && onComplete) {
              onComplete(data);
            }
          } catch (e) {
            console.error("SSE parse error", e);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Pipeline failed");
    } finally {
      setIsRunning(false);
    }
  }, []);

  const reset = () => {
    setAgents([]);
    setEvents([]);
    setError(null);
  };

  return { agents, events, isRunning, error, stream, reset };
}