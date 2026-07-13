"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { useSSEPipeline } from "@/lib/sse";
import { NoteData, api } from "@/lib/api";
import { useLiveQuote } from "@/lib/live-quote";
import { formatLivePrice } from "@/lib/market";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const QUICK_COMPARES = [
  { a: "Analyse HDFC Bank", b: "Analyse ICICI Bank", label: "HDFC Bank vs ICICI Bank" },
  { a: "Analyse TCS", b: "Analyse Infosys", label: "TCS vs Infosys" },
  { a: "Analyse Tata Motors", b: "Analyse Mahindra & Mahindra", label: "Tata Motors vs M&M" },
];

interface NotePanelProps {
  note: NoteData;
  label: string;
  isPeWinner: boolean;
  isRoeWinner: boolean;
}

function NotePanel({ note, label, isPeWinner, isRoeWinner }: NotePanelProps) {
  const fd = note.financial_data || {};
  const liveQuote = useLiveQuote(note);
  const price = formatLivePrice(
    liveQuote.price ?? undefined,
    liveQuote.currency || fd.currency,
    note.ticker,
  );
  const pe = fd.pe_ratio ? `${fd.pe_ratio}×` : "N/A";
  const roe = fd.roe || "N/A";

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-r border-border/80 last:border-0 bg-[#080b13]/40">
      
      {/* Pane Top Header */}
      <div className="px-5 py-3.5 border-b border-border bg-[#0c101b]/80 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-text-3 font-extrabold uppercase tracking-wide bg-[#05070c] border border-border px-2 py-0.5 rounded">
            {label}
          </span>
          <h3 className="font-extrabold text-xs text-text-1 font-display">
            {note.company}
          </h3>
        </div>
        <span className="font-mono text-[9px] font-bold bg-accent/10 border border-accent/30 text-accent px-1.5 py-0.5 rounded">
          {note.ticker}
        </span>
      </div>

      {/* Metrics Row Comparison */}
      <div className="grid grid-cols-3 gap-2.5 p-4 border-b border-border/70 bg-[#090d18]/20 flex-shrink-0">
        
        {/* Price Card */}
        <div className="bg-[#0e121e]/60 border border-border/50 rounded-lg p-2.5 relative overflow-hidden">
          <p className="text-[8px] text-text-2 uppercase font-bold tracking-wider font-display">Price</p>
          <p className="text-sm font-black text-text-1 mt-1 font-display">{price}</p>
          <span className="text-[7px] text-text-3 font-semibold font-mono">Live Market</span>
        </div>

        {/* PE Ratio Card */}
        <div className={`bg-[#0e121e]/60 border rounded-lg p-2.5 relative overflow-hidden transition-all duration-300 ${
          isPeWinner ? "border-green/40 shadow-green-glow" : "border-border/50"
        }`}>
          <div className="flex items-center justify-between gap-1">
            <p className="text-[8px] text-text-2 uppercase font-bold tracking-wider font-display">PE Ratio</p>
            {isPeWinner && (
              <span className="text-[7px] font-bold uppercase tracking-wider text-green bg-green/10 border border-green/20 px-1 rounded">
                Better
              </span>
            )}
          </div>
          <p className={`text-sm font-black mt-1 font-display ${isPeWinner ? "text-green" : "text-text-1"}`}>{pe}</p>
          <span className="text-[7px] text-text-3 font-semibold font-mono">Trailing</span>
        </div>

        {/* ROE Card */}
        <div className={`bg-[#0e121e]/60 border rounded-lg p-2.5 relative overflow-hidden transition-all duration-300 ${
          isRoeWinner ? "border-green/40 shadow-green-glow" : "border-border/50"
        }`}>
          <div className="flex items-center justify-between gap-1">
            <p className="text-[8px] text-text-2 uppercase font-bold tracking-wider font-display">ROE</p>
            {isRoeWinner && (
              <span className="text-[7px] font-bold uppercase tracking-wider text-green bg-green/10 border border-green/20 px-1 rounded">
                Better
              </span>
            )}
          </div>
          <p className={`text-sm font-black mt-1 font-display ${isRoeWinner ? "text-green" : "text-text-1"}`}>{roe}</p>
          <span className="text-[7px] text-text-3 font-semibold font-mono">Net Return</span>
        </div>

      </div>

      {/* Scrollable Report Content */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
        <div className="bg-[#0b0e17]/40 border border-border/50 rounded-xl p-5 shadow-inner">
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {note.note}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default function ComparisonPage() {
  const [query1, setQuery1] = useState("");
  const [query2, setQuery2] = useState("");
  const [notes, setNotes] = useState<[NoteData, NoteData] | null>(null);
  const { isRunning, error, stream } = useSSEPipeline();

  const handleCompare = useCallback(async (q1String?: string, q2String?: string) => {
    const q1 = q1String || query1;
    const q2 = q2String || query2;

    if (!q1.trim() || !q2.trim() || isRunning) return;
    setNotes(null);

    await stream(
      api.getComparisonUrl(),
      { query1: q1.trim(), query2: q2.trim() },
      (evt) => {
        if (evt.event === "comparison_done" && evt.note_a && evt.note_b) {
          setNotes([evt.note_a, evt.note_b]);
        }
      }
    );
  }, [query1, query2, isRunning, stream]);

  // Determine winners
  const getComparisonState = () => {
    if (!notes) return { isPeWinnerA: false, isPeWinnerB: false, isRoeWinnerA: false, isRoeWinnerB: false };
    const fdA = notes[0].financial_data || {};
    const fdB = notes[1].financial_data || {};

    const peA = fdA.pe_ratio || 9999;
    const peB = fdB.pe_ratio || 9999;
    const isPeWinnerA = peA < peB && peA !== 9999;
    const isPeWinnerB = peB < peA && peB !== 9999;

    // Parse ROE percent strings like "22%" or "18.5%"
    const parseRoe = (roeStr?: string) => {
      if (!roeStr) return -9999;
      const num = parseFloat(roeStr.replace(/[^0-9.-]/g, ""));
      return isNaN(num) ? -9999 : num;
    };
    const roeA = parseRoe(fdA.roe);
    const roeB = parseRoe(fdB.roe);
    const isRoeWinnerA = roeA > roeB && roeA !== -9999;
    const isRoeWinnerB = roeB > roeA && roeB !== -9999;

    return { isPeWinnerA, isPeWinnerB, isRoeWinnerA, isRoeWinnerB };
  };

  const { isPeWinnerA, isPeWinnerB, isRoeWinnerA, isRoeWinnerB } = getComparisonState();

  return (
    <div className="flex h-screen bg-[#07090e] text-[#f1f5f9] overflow-hidden flex-col">
      
      {/* Header Bar */}
      <header className="h-14 border-b border-border/80 bg-[#0d111c]/80 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0 z-40">
        
        {/* Left Brand */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-[10px] font-bold uppercase tracking-wider text-text-2 hover:text-text-1 border border-border/80 bg-surface/20 px-2.5 py-1.5 rounded-lg transition-colors font-display"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-base select-none">⚖️</span>
            <h1 className="text-sm font-extrabold tracking-tight font-display bg-gradient-to-r from-white to-text-2 bg-clip-text text-transparent">
              COMPARE WORKSPACE
            </h1>
          </div>
        </div>

        {/* Comparison Inputs Form */}
        <div className="flex-1 flex items-center gap-2 max-w-2xl ml-auto">
          <input
            className="flex-1 bg-[#05070c] border border-border/80 rounded-lg px-3 py-1.5 text-xs text-text-1 placeholder-text-3 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/15 transition-all"
            placeholder="Equity A (e.g. HDFC Bank)"
            value={query1}
            onChange={(e) => setQuery1(e.target.value)}
            disabled={isRunning}
          />
          <span className="text-text-3 font-black text-xs font-display select-none">VS</span>
          <input
            className="flex-1 bg-[#05070c] border border-border/80 rounded-lg px-3 py-1.5 text-xs text-text-1 placeholder-text-3 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/15 transition-all"
            placeholder="Equity B (e.g. ICICI Bank)"
            value={query2}
            onChange={(e) => setQuery2(e.target.value)}
            disabled={isRunning}
          />
          
          <button
            onClick={() => handleCompare()}
            disabled={!query1.trim() || !query2.trim() || isRunning}
            className="px-5 py-1.5 bg-accent hover:opacity-95 text-bg text-xs font-bold uppercase tracking-wider rounded-lg disabled:opacity-40 transition-colors shadow-accent-glow whitespace-nowrap"
          >
            {isRunning ? "⏳ Analyzing..." : "Compare"}
          </button>
        </div>

      </header>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {error && (
          <div className="absolute top-16 left-6 right-6 px-6 py-3 bg-red/10 border border-red/20 text-red text-xs font-semibold rounded-lg z-50 flex items-center gap-2 font-mono">
            <span>⚠️ Alert:</span>
            <span>{error}</span>
          </div>
        )}

        {/* Landing State */}
        {!notes && !isRunning && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <span className="text-4xl select-none animate-pulse">⚖️</span>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-text-1 font-display uppercase tracking-wider">
                Compare Side-by-Side Equities
              </h2>
              <p className="text-xs text-text-2 max-w-sm mx-auto leading-relaxed">
                Enter two company queries above to run parallel analysis pipelines. FinPilot will cross-reference financials and display key winners.
              </p>
            </div>

            {/* Quick Suggestions Cards */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-2xl mt-6">
              {QUICK_COMPARES.map((qc) => (
                <div
                  key={qc.label}
                  onClick={() => {
                    setQuery1(qc.a);
                    setQuery2(qc.b);
                    handleCompare(qc.a, qc.b);
                  }}
                  className="bg-[#0c101b]/60 border border-border/80 hover:border-accent/40 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 shadow-sm text-center flex flex-col justify-center min-h-[80px]"
                >
                  <p className="text-[10px] text-accent uppercase font-bold tracking-wider font-display mb-1">
                    Quick Compare
                  </p>
                  <p className="text-xs font-bold text-text-1 font-display">
                    {qc.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading Progress State */}
        {isRunning && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-accent-glow" />
              <span className="absolute inset-0 flex items-center justify-center text-sm">⏳</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-text-1 uppercase tracking-wider font-display">
                Executing Parallel Graphs
              </h3>
              <p className="text-[11px] text-text-2 max-w-xs mx-auto">
                Running twin LangGraph research pipelines simultaneously. Crawling fundamentals, scanner news, and preparing reports...
              </p>
            </div>
          </div>
        )}

        {/* Dual Panels Split View */}
        {notes && !isRunning && (
          <div className="flex-1 flex overflow-hidden animate-fade-in divide-x divide-border/60">
            <NotePanel
              note={notes[0]}
              label="Company A"
              isPeWinner={isPeWinnerA}
              isRoeWinner={isRoeWinnerA}
            />
            <NotePanel
              note={notes[1]}
              label="Company B"
              isPeWinner={isPeWinnerB}
              isRoeWinner={isRoeWinnerB}
            />
          </div>
        )}

      </div>
    </div>
  );
}