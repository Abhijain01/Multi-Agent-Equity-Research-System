"use client";
import { useState } from "react";
import { NoteData, api } from "@/lib/api";

interface Props {
  note: NoteData;
  onApprove: () => void;
  onRevise: (feedback: string) => void;
}

export default function HitlBar({ note, onApprove, onRevise }: Props) {
  const [showRevise, setShowRevise] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [approving, setApproving] = useState(false);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await api.approve(note.id);
      onApprove();
    } catch (e) {
      console.error("Failed to approve note:", e);
    } finally {
      setApproving(false);
    }
  };

  const handleRevise = () => {
    if (!feedback.trim()) return;
    onRevise(feedback.trim());
    setShowRevise(false);
    setFeedback("");
  };

  if (note.approved) {
    return (
      <div className="border-t border-border/80 bg-green/5 px-6 py-4 flex items-center justify-between flex-shrink-0 animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green"></span>
          </span>
          <span className="text-green text-xs font-bold uppercase tracking-wider font-display">
            ✅ Published to FinPilot Analyst Desk
          </span>
        </div>
        <p className="text-[10px] text-text-3 font-mono font-semibold">
          REV: {note.revision_count}
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border/80 bg-[#0b0e17]/90 px-6 py-4 flex-shrink-0 backdrop-blur-md">
      {note.needs_review && !showRevise && (
        <div className="flex items-center gap-2 mb-3 text-amber text-[11px] font-semibold bg-amber/5 border border-amber/20 px-3 py-1.5 rounded-lg animate-pulse">
          <span>⚠️</span>
          <span>Quality Check: Critic flagged this note. Review details below and request a revision.</span>
        </div>
      )}
      
      {showRevise ? (
        <div className="flex gap-3 items-end w-full animate-fade-in">
          <div className="flex-1">
            <label className="block text-[9px] uppercase tracking-wider text-text-3 font-bold mb-1.5 font-display">
              Provide feedback to Agent Writer
            </label>
            <textarea
              className="w-full bg-[#05070c] border border-border/80 rounded-lg px-3 py-2 text-xs text-text-1 placeholder-text-3 resize-none focus:outline-none focus:border-amber/60 focus:ring-1 focus:ring-amber/20 transition-all font-mono"
              rows={2}
              placeholder="e.g. Include a deeper focus on quarterly margins and peer valuation multiples..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 w-28">
            <button
              onClick={handleRevise}
              disabled={!feedback.trim()}
              className="w-full py-1.5 bg-amber hover:bg-amber/95 text-bg text-[10px] uppercase font-bold tracking-wider rounded-lg disabled:opacity-40 transition-colors shadow-sm"
            >
              Send Feed
            </button>
            <button
              onClick={() => {
                setShowRevise(false);
                setFeedback("");
              }}
              className="w-full py-1.5 border border-border/80 text-text-2 hover:text-text-1 text-[10px] uppercase font-bold tracking-wider rounded-lg bg-surface/30 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-1 font-bold font-display uppercase tracking-wide">
              Analyst Review Queue
            </p>
            <p className="text-[10px] text-text-2 mt-0.5">
              ⚡ Running revision: {note.revision_count} completed.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowRevise(true)}
              className="px-4 py-2 border border-border/80 text-text-2 hover:text-text-1 hover:border-text-2 hover:bg-surface2/30 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center gap-1.5"
            >
              ✏️ Request Revision
            </button>
            
            <button
              onClick={handleApprove}
              disabled={approving}
              className="px-5 py-2 bg-green text-bg hover:opacity-95 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 shadow-green-glow disabled:opacity-50 flex items-center gap-1.5"
            >
              {approving ? (
                <>⏳ Publishing...</>
              ) : (
                <>✓ Approve & Publish</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}