"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSSEPipeline } from "@/lib/sse";
import { api, NoteData, EvalScores as EvalScoresType } from "@/lib/api";
import AgentPipeline from "@/components/AgentPipeline";
import ResearchNote from "@/components/ResearchNote";
import EvalScoresPanel from "@/components/EvalScores";
import HitlBar from "@/components/HitlBar";

export default function ResearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background pt-24 px-6 text-outline font-sans">Loading...</div>}>
      <ResearchPageInner />
    </Suspense>
  );
}

function ResearchPageInner() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  const [note, setNote] = useState<NoteData | null>(null);
  const [evalScores, setEvalScores] = useState<EvalScoresType | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const { agents, isRunning, error, stream } = useSSEPipeline();

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q.trim()) {
      handleRun(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cursor tracking radial glow effect for empty state card
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll(".radial-glow");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty("--x", `${x}px`);
        (card as HTMLElement).style.setProperty("--y", `${y}px`);
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const runEval = async (noteId: string) => {
    setEvalLoading(true);
    try {
      const scores = await api.scoreNote(noteId);
      setEvalScores(scores);
    } catch {
      // eval scoring is best-effort — a failure here shouldn't block the note
    } finally {
      setEvalLoading(false);
    }
  };

  const handleRun = (override?: string) => {
    const q = override ?? query;
    if (!q.trim() || isRunning) return;
    setNote(null);
    setEvalScores(null);
    stream(api.getResearchUrl(), { query: q }, (evt) => {
      setNote(evt.note);
      if (evt.note?.id) runEval(evt.note.id);
    });
  };

  const handleApprove = async () => {
    if (!note) return;
    await api.approveNote(note.id);
    setNote({ ...note, approved: true });
  };

  const handleRevise = (feedback: string) => {
    if (!note) return;
    stream(api.getReviseUrl(), { note_id: note.id, feedback }, (evt) => {
      setNote({ ...evt.note, id: note.id });
      runEval(note.id);
    });
  };

  const handleDownloadPdf = () => {
    if (!note) return;
    window.open(api.getPdfUrl(note.id), "_blank");
  };

  const handleDownloadJson = () => {
    if (!note) return;
    window.open(api.getJsonUrl(note.id), "_blank");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 mt-16 flex flex-col md:flex-row overflow-hidden relative">
        {!note && !isRunning ? (
          <div className="flex-grow flex items-center justify-center px-6 py-20">
            <div className="w-full max-w-2xl bg-surface-container border border-outline-variant p-8 rounded radial-glow select-none">
              <h1 className="font-headline-xl text-headline-xl text-on-surface mb-2 font-bold">
                Launch Research
              </h1>
              <p className="text-outline text-body-sm mb-6 leading-relaxed">
                Dispatch the AlphaAgents pipeline — orchestrator, web research, financial data,
                news, writer, and critic — on any target stock or market sector.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRun()}
                  placeholder="Analyse Reliance Industries for a retail investor..."
                  className="flex-1 rounded py-3 px-4 text-body-md text-on-surface focus:border-primary focus:ring-0 font-sans outline-none bg-background border-outline-variant"
                />
                <button
                  onClick={() => handleRun()}
                  className="px-6 py-3 bg-primary-container text-on-primary-container rounded font-label-caps text-label-caps uppercase hover:brightness-110 transition-all duration-150 active:scale-95 border-none cursor-pointer flex items-center justify-center gap-2"
                >
                  Dispatch Agents
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                </button>
              </div>
              {error && (
                <p className="text-risk-crimson text-label-sm mt-4 font-mono font-medium">
                  {error}
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Left sidebar: Agent pipeline progress console */}
            <AgentPipeline agents={agents} />

            {/* Central area: Main report note paper */}
            <div className="flex-1 flex flex-col min-w-0">
              {note ? (
                <ResearchNote
                  note={note}
                  onDownloadPdf={handleDownloadPdf}
                  onDownloadJson={handleDownloadJson}
                  onPublish={handleApprove}
                />
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center space-y-4 px-6 bg-background">
                  <span className="material-symbols-outlined text-primary text-[48px] animate-spin">
                    progress_activity
                  </span>
                  <div className="text-center">
                    <p className="text-on-surface font-semibold text-body-lg">
                      Executing AlphaAgents Pipeline
                    </p>
                    <p className="text-outline text-body-sm font-mono mt-1">
                      Running analysis for &ldquo;{query}&rdquo;...
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom human in the loop controller */}
              {note && (
                <HitlBar
                  approved={note.approved}
                  needsReview={note.needs_review}
                  busy={isRunning}
                  onApprove={handleApprove}
                  onRevise={handleRevise}
                />
              )}
            </div>

            {/* Right sidebar: Score gauges & critic feedback */}
            <EvalScoresPanel
              scores={evalScores}
              critique={note?.critique}
              loading={evalLoading}
            />
          </>
        )}
      </main>
    </div>
  );
}