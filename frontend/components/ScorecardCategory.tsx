"use client";

import { CategoryScore } from "@/lib/api";

interface Props {
  label: string;
  data: CategoryScore;
}

function scoreColor(score: number) {
  if (score >= 70) return { bar: "bg-primary-container", text: "text-primary" };
  if (score >= 45) return { bar: "bg-warning-amber", text: "text-warning-amber" };
  return { bar: "bg-error-container", text: "text-risk-crimson" };
}

export default function ScorecardCategory({ label, data }: Props) {
  const color = scoreColor(data.score);

  return (
    <div className="py-6 border-b border-outline-variant/30 last:border-0 space-y-3 select-none">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-body-lg text-body-lg text-on-surface font-medium">{label}</span>
          <span className="font-data-sm text-data-sm bg-surface-container-highest px-1.5 py-0.5 text-outline font-mono rounded-sm">
            {data.weight}%
          </span>
        </div>
        <span className={`font-data-md text-data-md font-mono font-semibold ${color.text}`}>
          {data.score}/100
        </span>
      </div>
      <div className="w-full bg-surface-container-highest h-1 overflow-hidden rounded-full">
        <div
          className={`h-full ${color.bar} transition-all duration-700`}
          style={{ width: `${data.score}%` }}
        />
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
        {data.analysis}
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-1.5 pt-1">
        {data.pros.map((p, i) => (
          <div key={i} className="flex items-center gap-1 text-[11px] text-tertiary">
            <span className="material-symbols-outlined text-[14px]">add</span>
            <span className="text-on-surface-variant/90">{p}</span>
          </div>
        ))}
        {data.cons.map((c, i) => (
          <div key={i} className="flex items-center gap-1 text-[11px] text-risk-crimson">
            <span className="material-symbols-outlined text-[14px]">remove</span>
            <span className="text-on-surface-variant/90">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}