"use client";

interface Agent {
  name: string;
  status: "waiting" | "running" | "done" | "error";
  message?: string;
}

interface Props {
  agents: Agent[];
  progress?: number;
}

const AGENT_META: Record<string, { label: string; icon: string }> = {
  orchestrator: { label: "Orchestrator", icon: "hub" },
  web_researcher: { label: "Web Researcher", icon: "travel_explore" },
  financial_data: { label: "Financial Data", icon: "analytics" },
  news_agent: { label: "News Agent", icon: "newspaper" },
  writer: { label: "Lead Writer", icon: "edit_note" },
  critic: { label: "Internal Critic", icon: "gavel" },
  scorer: { label: "Risk Scorer", icon: "percent" },
};

const ORDER = ["orchestrator", "web_researcher", "financial_data", "news_agent", "writer", "critic", "scorer"];

export default function AgentPipeline({ agents }: Props) {
  // Calculate progress percent based on how many are "done"
  const doneCount = agents.filter((a) => a.status === "done").length;
  const progressPercent = Math.round((doneCount / ORDER.length) * 100);

  return (
    <aside className="w-72 bg-surface-container-low border-r border-outline-variant h-[calc(100vh-64px)] overflow-y-auto hidden md:flex flex-col select-none shrink-0 sticky top-16">
      <div className="p-6 flex-1 flex flex-col justify-between min-h-0">
        <div>
          <h3 className="font-label-caps text-label-caps text-outline mb-6 tracking-widest uppercase">
            Agent Pipeline
          </h3>
          <div className="space-y-4">
            {ORDER.map((key) => {
              const meta = AGENT_META[key];
              const agent = agents.find((a) => a.name === key);
              const status = agent?.status || "waiting";

              if (status === "running") {
                return (
                  <div
                    key={key}
                    className="p-4 bg-primary-container/10 border border-primary rounded-lg flex flex-col animate-pulse-glow"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {meta.icon}
                        </span>
                        <span className="font-body-sm text-body-sm text-primary font-medium">{meta.label}</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-container pulse-dot" />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-container pulse-dot" style={{ animationDelay: "0.2s" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-container pulse-dot" style={{ animationDelay: "0.4s" }} />
                      </div>
                    </div>
                    <div className="w-full mt-3 pt-3 border-t border-primary/20 font-data-sm text-[11px] text-primary-container space-y-1 font-mono">
                      <div className="flex gap-2 items-start">
                        <span className="text-primary-container">$</span>
                        <span className="leading-normal">{agent?.message || "Executing tasks..."}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (status === "done") {
                return (
                  <div
                    key={key}
                    className="p-4 bg-surface-container border border-outline-variant/30 rounded-lg flex flex-col"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {meta.icon}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface font-medium">{meta.label}</span>
                      </div>
                      <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                    </div>
                    {agent?.message && (
                      <div className="w-full mt-3 pt-3 border-t border-outline-variant/30 font-data-sm text-[11px] text-outline space-y-1 font-mono">
                        <div className="flex gap-2 items-start">
                          <span className="text-primary">$</span>
                          <span className="leading-normal">{agent.message}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // waiting / pending
              return (
                <div
                  key={key}
                  className="ghost-border p-4 opacity-50 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">
                      {meta.icon}
                    </span>
                    <span className="font-body-sm text-body-sm text-outline">{meta.label}</span>
                  </div>
                  <span className="material-symbols-outlined text-outline text-sm">
                    hourglass_empty
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-outline-variant">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
              Overall Progress
            </span>
            <span className="font-data-sm text-data-sm text-primary">{progressPercent}%</span>
          </div>
          <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
            <div
              className="bg-primary-container h-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}