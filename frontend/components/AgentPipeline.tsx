"use client";
import { AgentState, AgentStatus } from "@/lib/sse";

const AGENTS_META = {
  orchestrator: { icon: "🧠", label: "Orchestrator", sub: "Strategic planner" },
  web_researcher: { icon: "🌐", label: "Web Search", sub: "Cites web sources" },
  financial_data: { icon: "📊", label: "Fundamentals", sub: "Pulls financial data" },
  news_agent: { icon: "📰", label: "News Scanner", sub: "Analyzes sentiment" },
  writer: { icon: "✍️", label: "Report Writer", sub: "Drafts research note" },
  critic: { icon: "🔎", label: "Lead Critic", sub: "Reviews quality & factuality" },
};

interface PipelineProps {
  agents: AgentState;
  latestMessage?: string;
  isRunning?: boolean;
}

export default function AgentPipeline({ agents, latestMessage, isRunning }: PipelineProps) {
  const getStatusClass = (status: AgentStatus) => {
    if (status === "running") return "border-[#3B82F6]/80 bg-[#3B82F6]/5 text-[#3B82F6] shadow-accent-glow ring-1 ring-[#3B82F6]/20 animate-pulse";
    if (status === "done") return "border-[#10B981]/80 bg-[#10B981]/5 text-[#10B981] shadow-green-glow";
    if (status === "error") return "border-[#EF4444]/80 bg-[#EF4444]/5 text-[#EF4444] shadow-red-glow animate-bounce";
    return "border-[#334155]/60 bg-[#060e20]/40 text-[#94A3B8] opacity-50";
  };

  const getDotClass = (status: AgentStatus) => {
    if (status === "running") return "bg-accent pulse-glow-accent";
    if (status === "done") return "bg-green shadow-[0_0_8px_#10B981]";
    if (status === "error") return "bg-red shadow-[0_0_8px_#EF4444]";
    return "bg-text-3";
  };

  const isGatheringActive =
    agents.web_researcher === "running" ||
    agents.financial_data === "running" ||
    agents.news_agent === "running" ||
    (agents.orchestrator === "done" && agents.writer === "waiting");

  const isWritingActive = agents.writer === "running";
  const isCriticActive = agents.critic === "running";

  return (
    <div className="flex flex-col h-full bg-[#131b2e]/60 border border-[#334155] rounded-xl p-4 glass-card">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#334155]/60">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {isRunning && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isRunning ? "bg-[#3B82F6]" : "bg-[#8c909f]"}`}></span>
          </span>
          <span className="text-[11px] font-bold text-on-surface uppercase tracking-wider font-display">
            Agent Consensus Network
          </span>
        </div>
        <span className="text-[9px] px-2 py-0.5 bg-[#2d3449] border border-[#334155] text-[#c2c6d6] rounded-full font-mono">
          V1.2
        </span>
      </div>

      {/* Network Flowchart Grid */}
      <div className="relative flex flex-col gap-6 justify-center items-center py-2 select-none">
        
        {/* SVG Connections Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {/* Orchestrator down to 3 Gathering Agents */}
          <path
            d="M 125, 45 L 35, 105"
            fill="none"
            stroke={agents.orchestrator === "done" ? "#10B981" : "#334155"}
            strokeWidth="1.5"
            className={agents.web_researcher === "running" ? "animate-flow-dash text-[#3B82F6] stroke-current" : ""}
          />
          <path
            d="M 125, 45 L 125, 105"
            fill="none"
            stroke={agents.orchestrator === "done" ? "#10B981" : "#334155"}
            strokeWidth="1.5"
            className={agents.financial_data === "running" ? "animate-flow-dash text-[#3B82F6] stroke-current" : ""}
          />
          <path
            d="M 125, 45 L 215, 105"
            fill="none"
            stroke={agents.orchestrator === "done" ? "#10B981" : "#334155"}
            strokeWidth="1.5"
            className={agents.news_agent === "running" ? "animate-flow-dash text-[#3B82F6] stroke-current" : ""}
          />

          {/* 3 Gathering Agents down to Writer */}
          <path
            d="M 35, 155 L 125, 215"
            fill="none"
            stroke={isGatheringActive ? "#3B82F6" : (agents.writer !== "waiting" ? "#10B981" : "#334155")}
            strokeWidth="1.5"
            className={isGatheringActive ? "animate-flow-dash text-[#3B82F6] stroke-current" : ""}
          />
          <path
            d="M 125, 155 L 125, 215"
            fill="none"
            stroke={isGatheringActive ? "#3B82F6" : (agents.writer !== "waiting" ? "#10B981" : "#334155")}
            strokeWidth="1.5"
            className={isGatheringActive ? "animate-flow-dash text-[#3B82F6] stroke-current" : ""}
          />
          <path
            d="M 215, 155 L 125, 215"
            fill="none"
            stroke={isGatheringActive ? "#3B82F6" : (agents.writer !== "waiting" ? "#10B981" : "#334155")}
            strokeWidth="1.5"
            className={isGatheringActive ? "animate-flow-dash text-[#3B82F6] stroke-current" : ""}
          />

          {/* Writer to Critic Loop */}
          <path
            d="M 115, 265 L 115, 325"
            fill="none"
            stroke={isCriticActive ? "#3B82F6" : (agents.critic !== "waiting" ? "#10B981" : "#334155")}
            strokeWidth="1.5"
            className={isCriticActive ? "animate-flow-dash text-[#3B82F6] stroke-current" : ""}
          />
          <path
            d="M 135, 325 L 135, 265"
            fill="none"
            stroke={agents.critic === "done" && agents.writer === "running" ? "#F59E0B" : "#334155"}
            strokeWidth="1.5"
            className={agents.critic === "done" && agents.writer === "running" ? "animate-flow-dash text-amber stroke-current" : ""}
          />
        </svg>

        {/* ── Row 1: Orchestrator ── */}
        <div style={{ zIndex: 1 }} className="w-[150px]">
          <div className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all duration-300 ${getStatusClass(agents.orchestrator)}`}>
            <span className="text-lg">{AGENTS_META.orchestrator.icon}</span>
            <span className="text-[10px] font-bold mt-1 font-display">{AGENTS_META.orchestrator.label}</span>
            <span className="text-[8px] opacity-75 mt-0.5">{AGENTS_META.orchestrator.sub}</span>
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${getDotClass(agents.orchestrator)}`} />
          </div>
        </div>

        {/* ── Row 2: Parallel Gatherers ── */}
        <div style={{ zIndex: 1 }} className="flex justify-between w-full gap-2">
          {/* Web Researcher */}
          <div className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all duration-300 ${getStatusClass(agents.web_researcher)}`}>
            <span className="text-lg">{AGENTS_META.web_researcher.icon}</span>
            <span className="text-[10px] font-bold mt-1 font-display">{AGENTS_META.web_researcher.label}</span>
            <span className="text-[8px] opacity-75 mt-0.5">{AGENTS_META.web_researcher.sub}</span>
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${getDotClass(agents.web_researcher)}`} />
          </div>

          {/* Financial Data */}
          <div className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all duration-300 ${getStatusClass(agents.financial_data)}`}>
            <span className="text-lg">{AGENTS_META.financial_data.icon}</span>
            <span className="text-[10px] font-bold mt-1 font-display">{AGENTS_META.financial_data.label}</span>
            <span className="text-[8px] opacity-75 mt-0.5">{AGENTS_META.financial_data.sub}</span>
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${getDotClass(agents.financial_data)}`} />
          </div>

          {/* News Agent */}
          <div className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all duration-300 ${getStatusClass(agents.news_agent)}`}>
            <span className="text-lg">{AGENTS_META.news_agent.icon}</span>
            <span className="text-[10px] font-bold mt-1 font-display">{AGENTS_META.news_agent.label}</span>
            <span className="text-[8px] opacity-75 mt-0.5">{AGENTS_META.news_agent.sub}</span>
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${getDotClass(agents.news_agent)}`} />
          </div>
        </div>

        {/* ── Row 3: Writer ── */}
        <div style={{ zIndex: 1 }} className="w-[150px]">
          <div className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all duration-300 ${getStatusClass(agents.writer)}`}>
            <span className="text-lg">{AGENTS_META.writer.icon}</span>
            <span className="text-[10px] font-bold mt-1 font-display">{AGENTS_META.writer.label}</span>
            <span className="text-[8px] opacity-75 mt-0.5">{AGENTS_META.writer.sub}</span>
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${getDotClass(agents.writer)}`} />
          </div>
        </div>

        {/* ── Row 4: Critic ── */}
        <div style={{ zIndex: 1 }} className="w-[150px]">
          <div className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all duration-300 ${getStatusClass(agents.critic)}`}>
            <span className="text-lg">{AGENTS_META.critic.icon}</span>
            <span className="text-[10px] font-bold mt-1 font-display">{AGENTS_META.critic.label}</span>
            <span className="text-[8px] opacity-75 mt-0.5">{AGENTS_META.critic.sub}</span>
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${getDotClass(agents.critic)}`} />
          </div>
        </div>

      </div>

      {/* Live Log Console */}
      <div className="mt-4 pt-3 border-t border-[#334155]/60">
        <span className="text-[10px] text-[#8c909f] font-semibold uppercase tracking-wider font-display">
          Analyst Telemetry Logs
        </span>
        <div className="mt-1.5 bg-[#060e20] border border-[#334155]/50 rounded-lg p-2.5 font-mono text-[10px] text-[#adc6ff] flex flex-col gap-1 min-h-[64px] shadow-inner">
          <div className="flex items-center gap-1.5 text-[#8c909f]">
            <span>$</span>
            <span className="text-[#c2c6d6]">tail -f finpilot_pipeline.log</span>
          </div>
          {latestMessage ? (
            <div className="flex items-start gap-1 text-[#adc6ff] animate-pulse">
              <span className="text-[#3B82F6] select-none">▶</span>
              <span className="leading-normal">{latestMessage}</span>
            </div>
          ) : (
            <div className="text-[#8c909f] italic select-none">
              Await research execution trigger...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}