"use client";

interface Props {
  scores: { factuality: number; completeness: number; actionability: number };
}

export default function EvalScores({ scores }: Props) {
  const getColor = (score: number) => {
    if (score >= 4.5) return "text-[#10B981]";
    if (score >= 3.5) return "text-[#F59E0B]";
    return "text-[#EF4444]";
  };

  return (
    <div className="flex gap-6 mt-6">
      {Object.entries(scores).map(([key, value]) => (
        <div key={key} className="text-center">
          <div className={`text-3xl font-bold font-mono ${getColor(value)}`}>{value}</div>
          <div className="text-xs text-[#94A3B8] mt-1 capitalize">{key}</div>
        </div>
      ))}
    </div>
  );
}