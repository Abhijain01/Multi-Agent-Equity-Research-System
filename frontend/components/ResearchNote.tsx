"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { NoteData, EvalScores, api } from "@/lib/api";
import MetricsRow from "./MetricsRow";
import EvalScoresDisplay from "./EvalScores";
import HitlBar from "./HitlBar";

interface Props {
  note: NoteData;
  scores: EvalScores | null;
  onApprove: () => void;
  onRevise: (feedback: string) => void;
}

export default function ResearchNote({ note, scores, onApprove, onRevise }: Props) {
  return (
    <div className="flex flex-col h-full bg-[#131b2e]/60 border border-[#334155] rounded-xl overflow-hidden glass-card">
      
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155] bg-[#060e20]/60 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#adc6ff] flex items-center justify-center text-sm font-bold text-white select-none">
            {note.ticker ? note.ticker.slice(0, 2) : "FP"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base text-on-surface tracking-tight font-display">
                {note.company}
              </h2>
              <span className="font-mono text-[10px] font-bold bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] px-2 py-0.5 rounded-full">
                {note.ticker}
              </span>
            </div>
            <p className="text-[9px] text-[#94A3B8] font-semibold font-mono mt-0.5 uppercase tracking-wider">
              ID: {note.id.slice(0, 8)} • Generated via FinPilot Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {note.sentiment && (
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
              note.sentiment === "positive"
                ? "bg-green/10 border-green/30 text-green shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                : note.sentiment === "negative"
                ? "bg-red/10 border-red/30 text-red shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                : "bg-amber/10 border-amber/30 text-amber shadow-[0_0_10px_rgba(245,158,11,0.1)]"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                note.sentiment === "positive" ? "bg-green" : note.sentiment === "negative" ? "bg-red" : "bg-amber"
              } ${note.sentiment === "positive" ? "animate-pulse" : ""}`} />
              {note.sentiment} Sentiment
            </span>
          )}
          
          <a
            href={api.getPdfUrl(note.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#c2c6d6] hover:text-white font-semibold border border-[#334155] bg-[#1e293b]/60 hover:bg-[#2d3449] hover:border-[#adc6ff] px-3 py-1.5 rounded-lg transition-all duration-300 shadow-sm hover:scale-105 active:scale-95"
          >
            <span>⬇</span> Export PDF
          </a>
        </div>
      </div>

      {/* Scrollable Document Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
        <div className="max-w-3xl mx-auto">
          
          {/* Top Quick Metrics */}
          <MetricsRow note={note} />

          {/* Markdown Note Content */}
          <div className="bg-[#0b1326]/40 border border-[#334155] rounded-xl p-6 mb-6 shadow-sm">
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {note.note}
              </ReactMarkdown>
            </div>
          </div>

          {/* Scores Panel */}
          {scores && <EvalScoresDisplay scores={scores} />}

          {/* Critic Quality Warning Panel */}
          {note.needs_review && note.critique && (
            <div className="mt-6 bg-[#F59E0B]/5 border border-[#F59E0B]/30 rounded-xl p-4 shadow-sm fade-in-up">
              <div className="flex items-center gap-2 mb-2 text-[#F59E0B]">
                <span className="text-sm">⚠️</span>
                <p className="text-xs font-bold uppercase tracking-wider font-display">
                  Quality Audit Warning: Revision Requested
                </p>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed font-mono bg-[#060e20]/50 p-3 rounded-lg border border-[#334155]/20">
                {note.critique}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* HITL Control Deck */}
      <HitlBar note={note} onApprove={onApprove} onRevise={onRevise} />
      
    </div>
  );
}