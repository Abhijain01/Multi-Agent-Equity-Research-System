"use client";

import CircularGauge from "./CircularGauge";

interface Scores {
  factuality: number;
  completeness: number;
  actionability: number;
  reasoning?: string;
}

interface Props {
  scores: Scores | null;
  critique?: string;
  loading?: boolean;
}

export default function EvalScores({ scores, critique, loading }: Props) {
  return (
    <aside className="w-80 bg-surface-container-low border-l border-outline-variant h-[calc(100vh-64px)] overflow-y-auto hidden lg:flex flex-col p-6 space-y-8 select-none shrink-0 sticky top-16">
      <h3 className="font-label-caps text-label-caps text-outline tracking-widest uppercase">
        Agent Quality Metrics
      </h3>

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <span className="material-symbols-outlined text-primary text-[32px] animate-spin">
            refresh
          </span>
          <p className="text-label-sm text-text-muted italic">Running Judge Evaluations...</p>
        </div>
      )}

      {!loading && !scores && (
        <div className="p-4 border border-outline-variant/30 rounded-lg text-center bg-surface-container-lowest">
          <p className="text-body-sm text-outline italic leading-relaxed">
            Judge evaluation runs automatically upon report generation or revisions.
          </p>
        </div>
      )}

      {!loading && scores && (
        <div className="space-y-6">
          <CircularGauge
            value={scores.factuality * 20}
            label="Factuality"
            colorClass="text-tertiary"
          />
          <CircularGauge
            value={scores.completeness * 20}
            label="Completeness"
            colorClass="text-primary-container"
          />
          <CircularGauge
            value={scores.actionability * 20}
            label="Actionability"
            colorClass="text-primary-container"
          />

          {scores.reasoning && (
            <div className="bg-surface-container-high border border-outline-variant p-4 rounded-lg mt-6">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="material-symbols-outlined text-tertiary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified_user
                </span>
                <h4 className="font-label-caps text-label-caps uppercase text-on-surface">
                  Judge's Reasoning
                </h4>
              </div>
              <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed italic">
                "{scores.reasoning}"
              </p>
            </div>
          )}
        </div>
      )}

      {critique && (
        <div className="bg-surface-container-high border border-outline-variant/60 p-4 rounded-lg mt-auto">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="material-symbols-outlined text-tertiary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              gavel
            </span>
            <h4 className="font-label-caps text-label-caps text-tertiary uppercase">
              Critic Agent Feedback
            </h4>
          </div>
          <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed italic">
            "{critique}"
          </p>
        </div>
      )}
    </aside>
  );
}