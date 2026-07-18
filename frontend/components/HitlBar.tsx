"use client";

import { useState } from "react";

interface Props {
  approved: boolean;
  needsReview?: boolean;
  onApprove: () => void;
  onRevise: (feedback: string) => void;
  busy?: boolean;
}

export default function HitlBar({ approved, onApprove, onRevise, busy }: Props) {
  const [feedback, setFeedback] = useState("");

  const handleReviseSubmit = () => {
    if (feedback.trim() && !busy) {
      onRevise(feedback.trim());
      setFeedback("");
    }
  };

  if (approved) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 h-20 bg-surface-container/95 backdrop-blur-md border-t border-outline-variant z-40 flex items-center px-6">
        <div className="flex-1 max-w-4xl mx-auto flex items-center gap-3 justify-center select-none">
          <span className="material-symbols-outlined text-growth-emerald text-[22px]">
            check_circle
          </span>
          <span className="font-label-caps text-label-caps text-growth-emerald uppercase tracking-wider font-semibold">
            Report Finalized &amp; Approved for Distribution
          </span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-20 bg-surface-container/95 backdrop-blur-md border-t border-outline-variant z-40 flex items-center px-6">
      <div className="flex-1 max-w-4xl mx-auto flex items-center gap-4">
        
        {/* Revision Input Box */}
        <div className="relative flex-1">
          <input
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReviseSubmit()}
            disabled={busy}
            className="w-full bg-background ghost-border rounded-full py-2 px-6 pl-6 pr-12 text-body-sm text-on-surface placeholder:text-outline/70 focus:border-primary focus:ring-0 transition-colors disabled:opacity-50 font-sans"
            placeholder="Request report revisions (e.g., 'Compare valuation with sector averages...')"
            type="text"
          />
          <span
            onClick={handleReviseSubmit}
            className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors"
          >
            auto_fix
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleReviseSubmit}
            disabled={busy || !feedback.trim()}
            className="ghost-border px-6 py-2 rounded-full font-label-caps text-label-caps uppercase text-on-surface hover:bg-error/10 hover:text-error hover:border-error transition-all duration-150 disabled:opacity-30 active:scale-95 bg-transparent"
          >
            Request Changes
          </button>
          <button
            onClick={onApprove}
            disabled={busy}
            className="bg-primary-container text-on-primary-container px-6 py-2 rounded-full font-label-caps text-label-caps uppercase hover:brightness-110 transition-all duration-150 shadow-lg shadow-primary-container/20 disabled:opacity-50 active:scale-95 border-none"
          >
            Approve Report
          </button>
        </div>

      </div>
    </footer>
  );
}