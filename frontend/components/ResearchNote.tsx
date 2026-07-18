"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { NoteData } from "@/lib/api";
import { parseNote, parseRisks } from "@/lib/parseNote";
import ScorecardCategory from "./ScorecardCategory";
import FundamentalsGrid from "./FundamentalsGrid";

interface Props {
  note: NoteData;
  onDownloadPdf?: () => void;
  onDownloadJson?: () => void;
  onPublish?: () => void;
}

const CATEGORY_LABELS: { key: keyof NonNullable<NoteData["scorecard"]>["categories"]; label: string }[] = [
  { key: "business_quality", label: "Business Quality" },
  { key: "financial_health", label: "Financial Health" },
  { key: "valuation", label: "Valuation" },
  { key: "growth", label: "Growth" },
  { key: "competitive_moat", label: "Competitive Moat" },
  { key: "risk_profile", label: "Risk Profile" },
];

const VERDICT_STYLE: Record<string, { text: string; bg: string; border: string }> = {
  INVEST: { text: "text-growth-emerald", bg: "bg-growth-emerald/10", border: "border-growth-emerald/30" },
  HOLD: { text: "text-warning-amber", bg: "bg-warning-amber/10", border: "border-warning-amber/30" },
  AVOID: { text: "text-risk-crimson", bg: "bg-risk-crimson/10", border: "border-risk-crimson/30" },
};

function convictionLabel(confidence: number): string {
  if (confidence >= 85) return "High conviction";
  if (confidence >= 60) return "Moderate conviction";
  return "Low conviction";
}

export default function ResearchNote({ note, onDownloadPdf, onDownloadJson, onPublish }: Props) {
  const parsed = parseNote(note.note);
  const risks = parseRisks(parsed.keyRisks);
  const fd = note.financial_data || {};
  const sc = note.scorecard;
  const verdictStyle = sc ? VERDICT_STYLE[sc.verdict] || VERDICT_STYLE.HOLD : VERDICT_STYLE.HOLD;

  return (
    <section className="flex-1 overflow-y-auto select-text bg-background relative custom-scrollbar">
      
      {/* Report Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md px-6 md:px-margin-desktop py-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-headline-xl text-headline-xl-mobile md:text-headline-md text-on-surface font-bold">
              {note.company || "Company Profile"}
            </h1>
            {note.ticker && (
              <span className="bg-surface-container-highest px-2 py-0.5 rounded font-data-md text-data-sm text-primary font-mono">
                {note.ticker.replace(".NS", "")}
              </span>
            )}
          </div>
          <p className="text-on-surface-variant font-body-sm text-[12px] uppercase tracking-wider">
            {fd.exchange ? `${fd.exchange} • ` : ""} {fd.sector || "Equity Market Asset"}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onDownloadJson}
            className="ghost-border px-4 py-2 flex items-center gap-2 hover:bg-surface-container-highest transition-colors text-on-surface bg-transparent active:scale-95 text-label-caps"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            JSON
          </button>
          <button
            onClick={onDownloadPdf}
            className="ghost-border px-4 py-2 flex items-center gap-2 hover:bg-surface-container-highest transition-colors text-on-surface bg-transparent active:scale-95 text-label-caps"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            PDF Report
          </button>
          <button
            onClick={onPublish}
            disabled={note.approved}
            className="bg-primary-container text-on-primary-container px-4 py-2 flex items-center gap-2 hover:brightness-110 transition-opacity active:scale-95 disabled:opacity-50 text-label-caps"
          >
            <span className="material-symbols-outlined text-[16px]">
              {note.approved ? "check" : "share"}
            </span>
            {note.approved ? "Approved" : "Approve"}
          </button>
        </div>
      </div>

      <div className="max-w-[1300px] w-full mx-auto py-6 px-6 md:px-margin-desktop space-y-8 pb-32 fade-in-stagger" style={{ animationDelay: "100ms" }}>
        
        {note.needs_review && (
          <div className="px-4 py-2.5 bg-warning-amber/10 border border-warning-amber/25 rounded text-body-sm text-warning-amber flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">build</span>
            <span>Flagged for Human Review • Current Revisions: {note.revision_count ?? 0}</span>
          </div>
        )}

        {/* Score Block */}
        {sc && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Circle gauge */}
            <div className="lg:col-span-4 bg-surface-container-high border border-outline-variant p-6 rounded flex flex-col items-center justify-center text-center radial-glow select-none">
              <div className="relative w-40 h-40 mb-4 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                  <circle
                    className="text-surface-container-highest"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="54"
                    stroke="currentColor"
                    strokeWidth="7"
                  />
                  <circle
                    className={`${verdictStyle.text} gauge-circle`}
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="54"
                    stroke="currentColor"
                    strokeDasharray="339.3"
                    strokeDashoffset={Math.round(339.3 - (sc.overall_score / 100) * 339.3)}
                    strokeWidth="7"
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1.5s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-data-lg text-[36px] text-on-surface font-mono font-bold leading-none">
                    {sc.overall_score}
                  </span>
                  <span className="font-label-caps text-outline text-[10px] mt-1 uppercase tracking-wider">
                    Score
                  </span>
                </div>
              </div>
              <div
                className={`px-6 py-1.5 rounded-full font-label-caps text-label-caps border uppercase mb-3 ${verdictStyle.bg} ${verdictStyle.text} ${verdictStyle.border}`}
              >
                {sc.verdict}
              </div>
              <div className="space-y-1 mt-1">
                <h2 className="font-headline-md text-headline-md text-[16px] text-on-surface font-semibold">
                  Fair Value View
                </h2>
                <p className="text-body-sm text-on-surface-variant font-medium leading-relaxed">
                  {sc.fair_value_view}
                </p>
              </div>
            </div>

            {/* Overall Verdict & Confidence */}
            <div className="lg:col-span-8 bg-surface-container border border-outline-variant p-6 rounded flex flex-col justify-between radial-glow">
              <div>
                <h3 className="font-label-caps text-label-caps text-outline mb-4 uppercase tracking-wider">
                  Report Conviction Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-surface-container-high border border-outline-variant/40 rounded">
                    <p className="font-label-caps text-[10px] text-outline mb-1 uppercase tracking-wider">
                      Confidence Level
                    </p>
                    <p className="font-data-md text-data-md font-mono font-semibold text-primary">
                      {sc.confidence_pct}%
                    </p>
                  </div>
                  <div className="p-3 bg-surface-container-high border border-outline-variant/40 rounded">
                    <p className="font-label-caps text-[10px] text-outline mb-1 uppercase tracking-wider">
                      Investment Horizon
                    </p>
                    <p className="font-data-md text-data-md font-mono font-semibold text-on-surface">
                      {sc.time_horizon}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <div className="flex justify-between font-label-caps text-[10px] text-outline uppercase tracking-wider">
                  <span>Confidence Gauge</span>
                  <span>{convictionLabel(sc.confidence_pct)}</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-container h-full transition-all duration-1000"
                    style={{ width: `${sc.confidence_pct}%` }}
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Weighted Scorecard */}
        {sc && (
          <section className="bg-surface-container border border-outline-variant rounded p-6 radial-glow">
            <h3 className="font-label-caps text-label-caps text-outline mb-6 uppercase tracking-wider">
              Weighted Scorecard
            </h3>
            <div className="divide-y divide-outline-variant/20">
              {CATEGORY_LABELS.map(({ key, label }) => (
                <ScorecardCategory key={key} label={label} data={sc.categories[key]} />
              ))}
            </div>
          </section>
        )}

        {/* Live Fundamentals */}
        <FundamentalsGrid
          fd={fd}
          refreshedAt={
            note.created_at ? new Date(note.created_at).toLocaleTimeString() : undefined
          }
        />

        {/* Narrative Sections */}
        <section className="space-y-8">
          
          {/* Investment Thesis */}
          {parsed.investmentThesis && (
            <div className="space-y-3">
              <h2 className="font-headline-md text-headline-md border-l-4 border-primary pl-4 mb-2">
                Investment Thesis
              </h2>
              <div className="text-on-surface-variant font-body-lg leading-relaxed text-[15px] space-y-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {parsed.investmentThesis}
                </ReactMarkdown>
                {parsed.recommendation && (
                  <div className="mt-4 p-4 bg-surface-container/50 border-l-2 border-primary rounded-r">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {parsed.recommendation}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Strengths & Risks */}
          {sc && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Strengths */}
              <div className="bg-surface-container-high border border-outline-variant p-6 rounded radial-glow">
                <h3 className="font-label-caps text-label-caps text-tertiary mb-4 flex items-center gap-2 tracking-wider">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    trending_up
                  </span>
                  KEY STRENGTHS
                </h3>
                <ul className="space-y-3">
                  {sc.key_strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-tertiary text-xs mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                        done
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks */}
              <div className="bg-surface-container-high border border-outline-variant p-6 rounded radial-glow">
                <h3 className="font-label-caps text-label-caps text-risk-crimson mb-4 flex items-center gap-2 tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  KEY RISKS
                </h3>
                <ul className="space-y-3">
                  {risks.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-risk-crimson text-xs mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                        close
                      </span>
                      <div>
                        <span className="font-bold text-on-surface mr-1">{r.name}:</span>
                        <span>{r.detail}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}

          {/* Comparable Companies */}
          {parsed.comparableCompanies && (
            <div className="space-y-3">
              <h3 className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                Comparable Companies Analysis
              </h3>
              <div className="bg-surface-container border border-outline-variant p-5 rounded font-body-sm leading-relaxed text-on-surface-variant">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {parsed.comparableCompanies}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Catalysts to Watch */}
          {sc && sc.catalysts_to_watch && sc.catalysts_to_watch.length > 0 && (
            <div className="bg-surface-container border border-outline-variant p-6 rounded radial-glow">
              <h3 className="font-label-caps text-label-caps text-outline mb-4 uppercase tracking-wider">
                Catalysts to Watch
              </h3>
              <ul className="space-y-3">
                {sc.catalysts_to_watch.map((c, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary-container text-xs mt-0.5">
                      arrow_forward
                    </span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recent News */}
          {note.recent_news && note.recent_news.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                Recent Market Intelligence
              </h3>
              <div className="space-y-4">
                {note.recent_news.map((news, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 p-4 border border-outline-variant bg-surface-container-low hover:border-primary/50 hover:bg-surface-container transition-colors cursor-pointer group"
                    onClick={() => news.url && window.open(news.url, "_blank")}
                  >
                    <div className="w-12 h-12 bg-surface-container flex-shrink-0 flex items-center justify-center rounded">
                      <span className="material-symbols-outlined text-primary text-[24px]">
                        newspaper
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-label-caps text-[9px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                          {news.domain.toUpperCase()}
                        </span>
                        {news.published_at && (
                          <span className="font-data-sm text-[10px] text-outline">
                            {new Date(news.published_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="font-body-sm font-semibold text-on-surface group-hover:text-primary transition-colors duration-150">
                        {news.title}
                      </p>
                      {news.excerpt && (
                        <p className="text-body-sm text-outline/80 mt-1 leading-relaxed">
                          {news.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sources & Citations */}
          {note.sources && note.sources.length > 0 && (
            <div className="bg-surface-container border border-outline-variant p-6 rounded radial-glow">
              <h3 className="font-label-caps text-label-caps text-outline mb-4 uppercase tracking-wider">
                Sources &amp; Citations ({note.sources.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {note.sources.map((src, idx) => (
                  <div key={idx} className="flex gap-3 text-body-sm leading-relaxed">
                    <span className="text-outline shrink-0 font-mono">{idx + 1}.</span>
                    <div>
                      <div className="text-[10px] font-label-caps text-primary uppercase font-bold tracking-wider mb-0.5">
                        {src.domain}
                      </div>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-on-surface-variant hover:text-primary transition-colors"
                      >
                        {src.title}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>

        {/* Footer Meta + Disclaimer */}
        <div className="pt-6 border-t border-outline-variant space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-2 text-label-sm text-outline select-none font-mono">
            <span>
              Generated: {new Date(note.created_at).toLocaleString()}
              {note.generation_meta?.duration_seconds
                ? ` • latency: ${note.generation_meta.duration_seconds}s`
                : ""}
            </span>
            {note.generation_meta && (
              <span>
                LLM: {note.generation_meta.llm_models} • Data: {note.generation_meta.data_providers}
              </span>
            )}
          </div>

          <div className="flex items-start gap-3 p-4 bg-warning-amber/5 border border-warning-amber/15 rounded text-[11px] leading-relaxed text-outline">
            <span className="material-symbols-outlined text-warning-amber text-[18px] shrink-0">
              warning
            </span>
            <span>
              This report is generated by an autonomous multi-agent system. It is for informational and educational purposes only and does not constitute financial, investment, legal, or tax advice. Standard disclaimer applies. Always verify facts before allocating capital.
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}