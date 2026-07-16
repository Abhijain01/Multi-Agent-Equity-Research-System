"use client";

interface Props {
  note: any;
  onApprove: () => void;
  onRevise: (feedback: string) => void;
}

export default function HitlBar({ note, onApprove, onRevise }: Props) {
  return (
    <div className="flex justify-between items-center px-8 py-5 bg-[#060e20] border-t border-[#334155]">
      <div className="text-sm text-[#94A3B8]">
        {note.approved ? "✓ Approved" : "Awaiting Review"}
      </div>
      <div className="flex gap-3">
        <button onClick={onApprove} className="px-6 py-2 bg-[#10B981] rounded-xl text-sm font-semibold">
          Approve & Publish
        </button>
        <button onClick={() => onRevise("Please improve the valuation section")} className="px-6 py-2 border border-[#334155] rounded-xl text-sm">
          Request Revision
        </button>
      </div>
    </div>
  );
}