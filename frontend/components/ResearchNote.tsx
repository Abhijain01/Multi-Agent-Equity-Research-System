"use client";

import ReactMarkdown from "react-markdown";
import { NoteData } from "@/lib/api";

interface Props {
  note: NoteData;
  onApprove?: () => void;
  onRevise?: (feedback: string) => void;
}

export default function ResearchNote({ note, onApprove, onRevise }: Props) {
  return (
    <div className="bg-[#131b2e] border border-[#334155] rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-8 py-6 border-b border-[#334155]">
        <div>
          <div className="flex items-center gap-3">
            <div className="font-mono text-2xl font-bold">{note.ticker}</div>
            <div className="text-xl">{note.company}</div>
          </div>
          <div className="text-xs text-[#94A3B8] mt-1">Generated via FinPilot</div>
        </div>
        <div className="flex gap-3">
          {onApprove && (
            <button onClick={onApprove} className="px-6 py-2 bg-[#10B981] text-white rounded-2xl text-sm font-semibold">
              Approve
            </button>
          )}
          {onRevise && (
            <button onClick={() => onRevise("Please improve the risks section")} className="px-6 py-2 border border-[#334155] rounded-2xl text-sm">
              Request Revision
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-8 prose prose-invert max-w-none">
        <ReactMarkdown>{note.note}</ReactMarkdown>
      </div>
    </div>
  );
}