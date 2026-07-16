"use client";

interface Agent {
  name: string;
  status: "waiting" | "running" | "done" | "error";
  message?: string;
}

interface Props {
  agents: Agent[];
  latestMessage?: string;
  isRunning?: boolean;
}

const AGENT_META: Record<string, { icon: string; label: string }> = {
  orchestrator: { icon: "🧠", label: "Orchestrator" },
  realtime: { icon: "⚡", label: "Real-time Data" },
  web_researcher: { icon: "🌐", label: "Web Researcher" },
  financial_data: { icon: "📊", label: "Financial Analyst" },
  news_agent: { icon: "📰", label: "News Scanner" },
  writer: { icon: "✍️", label: "Writer" },
  critic: { icon: "🔎", label: "Critic" },
};

export default function AgentPipeline({ agents, latestMessage, isRunning }: Props) {
  return (
    <div className="bg-[#131b2e] border border-[#334155] rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-[#3B82F6] animate-pulse" : "bg-[#94A3B8]"}`} />
          <span className="font-semibold text-sm tracking-wider">AGENT PIPELINE</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-[#222a3d] rounded">v1.2</span>
      </div>

      <div className="space-y-3">
        {Object.keys(AGENT_META).map((key) => {
          const agent = agents.find(a => a.name === key);
          const status = agent?.status || "waiting";
          const meta = AGENT_META[key];

          return (
            <div key={key} className={`flex items-center justify-between p-3 rounded-2xl border text-sm transition-all
              ${status === "running" ? "border-[#3B82F6] bg-[#3B82F6]/5" : ""}
              ${status === "done" ? "border-[#10B981] bg-[#10B981]/5" : ""}
              ${status === "waiting" ? "border-[#334155]" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{meta.icon}</span>
                <span className="font-medium">{meta.label}</span>
              </div>
              <div className="text-xs text-[#94A3B8]">
                {status === "running" && "Running..."}
                {status === "done" && "Completed"}
                {status === "waiting" && "Waiting"}
              </div>
            </div>
          );
        })}
      </div>

      {latestMessage && (
        <div className="mt-4 text-xs text-[#94A3B8] border-t border-[#334155] pt-4">
          {latestMessage}
        </div>
      )}
    </div>
  );
}