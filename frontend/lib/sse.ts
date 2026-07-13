"use client";
import { useState, useCallback } from "react";
import { SSEEvent } from "./api";

export type AgentStatus = "waiting" | "running" | "done" | "error";

export interface AgentState {
  orchestrator: AgentStatus;
  web_researcher: AgentStatus;
  financial_data: AgentStatus;
  news_agent: AgentStatus;
  writer: AgentStatus;
  critic: AgentStatus;
}

const INITIAL_AGENTS: AgentState = {
  orchestrator: "waiting",
  web_researcher: "waiting",
  financial_data: "waiting",
  news_agent: "waiting",
  writer: "waiting",
  critic: "waiting",
};

export function useSSEPipeline() {
  const [agents, setAgents] = useState<AgentState>(INITIAL_AGENTS);
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setAgents(INITIAL_AGENTS);
    setEvents([]);
    setError(null);
  }, []);

  const stream = useCallback(async (
    url: string,
    body: object,
    onDone: (event: SSEEvent) => void
  ) => {
    reset();
    setIsRunning(true);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt: SSEEvent = JSON.parse(line.slice(6));
            setEvents((prev) => [...prev, evt]);

            // Update agent statuses
            if (evt.event === "agent_start" && evt.agent) {
              setAgents((prev) => ({ ...prev, [evt.agent!]: "running" }));
            }
            if (evt.event === "agent_done" && evt.agent) {
              setAgents((prev) => ({ ...prev, [evt.agent!]: "done" }));
            }
            if (evt.event === "pipeline_done" || evt.event === "comparison_done") {
              onDone(evt);
              setIsRunning(false);
            }
            if (evt.event === "error") {
              setError(evt.message || "Unknown error");
              setIsRunning(false);
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setError(e.message || "Connection failed");
    } finally {
      setIsRunning(false);
    }
  }, [reset]);

  return { agents, events, isRunning, error, stream, reset };
}