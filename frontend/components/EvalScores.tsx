"use client";
import { useState } from "react";
import { EvalScores } from "@/lib/api";

interface GaugeProps {
  label: string;
  score: number;
  showOverall?: boolean;
}

function getScoreColor(score: number) {
  if (score >= 4.0) return "stroke-green text-green shadow-[0_0_12px_rgba(16,185,129,0.3)]";
  if (score >= 3.0) return "stroke-amber text-amber shadow-[0_0_12px_rgba(245,158,11,0.3)]";
  return "stroke-red text-red shadow-[0_0_12px_rgba(239,68,68,0.3)]";
}

function getScoreColorHex(score: number) {
  if (score >= 4.0) return "#10B981";
  if (score >= 3.0) return "#F59E0B";
  return "#EF4444";
}

function Gauge({ label, score, showOverall = false }: GaugeProps) {
  const percent = (score / 5) * 100;
  // Radius = 15.9155 gives a circumference of exactly 100
  const radius = 15.9155;
  const strokeDash = `${percent} 100`;

  return (
    <div className="flex flex-col items-center gap-2 group">
      <div className="relative w-16 h-16 transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
          {/* Base Track */}
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth="3.2"
          />
          {/* Glowing Arc Fill */}
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            className={`${getScoreColor(score)} transition-all duration-1000 ease-out`}
            strokeWidth="3.2"
            strokeDasharray={strokeDash}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold tracking-tight font-display" style={{ color: getScoreColorHex(score) }}>
            {score.toFixed(1)}
          </span>
          <span className="text-[7px] text-[#8c909f] font-semibold -mt-0.5">/ 5.0</span>
        </div>
      </div>
      <p className={`text-[10px] uppercase font-bold tracking-wider font-display transition-colors duration-300 ${showOverall ? "text-on-surface font-semibold" : "text-[#94A3B8] group-hover:text-on-surface"}`}>
        {label}
      </p>
    </div>
  );
}

export default function EvalScoresDisplay({ scores }: { scores: EvalScores }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-[#131b2e]/80 border border-[#334155] rounded-xl p-4 mt-6 glass-card fade-in-up">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#334155]/50">
        <div>
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider font-display">
            LLM-as-Judge Scorecard
          </h3>
          <p className="text-[9px] text-[#8c909f] font-semibold mt-0.5">
            AUTOMATED PERFORMANCE AUDIT
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[9px] font-mono text-[#10B981] uppercase font-bold tracking-wider">
            Audit Verified
          </span>
        </div>
      </div>

      {/* Gauges Grid */}
      <div className="grid grid-cols-4 gap-2 bg-[#060e20]/40 p-4 rounded-xl border border-[#334155]/40 mb-4">
        <Gauge label="Factuality" score={scores.factuality} />
        <Gauge label="Completeness" score={scores.completeness} />
        <Gauge label="Actionability" score={scores.actionability} />
        <Gauge label="Overall Score" score={scores.overall} showOverall />
      </div>

      {/* Accordion Reasoning */}
      {scores.reasoning && (
        <div className="border border-[#334155]/50 rounded-lg overflow-hidden bg-[#0b1326]/45">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-[#c2c6d6] hover:text-on-surface bg-[#060e20]/30 transition-colors uppercase tracking-wider font-display"
          >
            <span>📄 Judge Reasoning Details</span>
            <span className={`text-xs transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>
          
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isOpen ? "max-h-[300px] border-t border-[#334155]/40 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-3 text-[11px] text-[#c2c6d6] leading-relaxed font-mono whitespace-pre-line max-h-[250px] overflow-y-auto bg-[#060e20]/75">
              {scores.reasoning}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}