"use client";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSSEPipeline } from "@/lib/sse";
import { NoteData, EvalScores, api } from "@/lib/api";
import AgentPipeline from "@/components/AgentPipeline";
import ResearchNote from "@/components/ResearchNote";

const SUGGESTIONS = [
  "Analyse Reliance Industries in-depth",
  "Evaluate TCS valuation and earnings trajectory",
  "Tata Motors EV expansion sector impact",
  "HDFC Bank post-merger analysis",
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [note, setNote] = useState<NoteData | null>(null);
  const [scores, setScores] = useState<EvalScores | null>(null);
  const [history, setHistory] = useState<NoteData[]>([]);
  const [headerSearch, setHeaderSearch] = useState("");
  const { agents, events, isRunning, error, stream, reset } = useSSEPipeline();

  // Load history list
  const loadHistory = useCallback(async () => {
    try {
      const res = await api.getHistory();
      if (res && res.notes) {
        setHistory(res.notes);
      }
    } catch (err) {
      console.error("Failed to fetch research history:", err);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Extract latest SSE message
  const getLatestMessage = () => {
    if (events.length === 0) return "";
    const last = events[events.length - 1];
    if (last.event === "error") return `⚠️ ERROR: ${last.message}`;
    if (last.event === "agent_start") return last.message || `Activating ${last.agent}...`;
    if (last.event === "agent_done") {
      if (last.agent === "critic") return last.passed ? "Critic passed. Finalizing..." : "Critic requested changes. Rewriting...";
      return `${last.agent ? last.agent.toUpperCase().replace("_", " ") : "Agent"} finished task.`;
    }
    if (last.event === "pipeline_done") return "Consensus pipeline complete!";
    return last.message || "";
  };

  const latestMessage = getLatestMessage();

  const handleRun = useCallback(async (qString?: string) => {
    const targetQuery = qString || query;
    if (!targetQuery.trim() || isRunning) return;
    
    setNote(null);
    setScores(null);
    reset();

    // Scroll to top or prepare screen
    window.scrollTo({ top: 0, behavior: "smooth" });

    await stream(
      api.getResearchUrl(),
      { query: targetQuery.trim() },
      async (evt) => {
        if (evt.event === "pipeline_done" && evt.note) {
          setNote(evt.note);
          // Load score
          try {
            const s = await api.scoreNote(evt.note.id);
            setScores(s);
          } catch (e) {
            console.error("Auto scoring note failed:", e);
          }
          loadHistory(); // Reload history after completion
        }
      }
    );
  }, [query, isRunning, stream, reset, loadHistory]);

  const handleLoadPastNote = useCallback(async (pastNote: NoteData) => {
    if (isRunning) return;
    setNote(pastNote);
    setScores(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    try {
      const s = await api.scoreNote(pastNote.id);
      setScores(s);
    } catch (e) {
      console.error("Failed to load scores for past note:", e);
    }
  }, [isRunning]);

  const handleRevise = useCallback(async (feedback: string) => {
    if (!note) return;
    setScores(null);

    await stream(
      api.getReviseUrl(),
      { note_id: note.id, feedback },
      async (evt) => {
        if (evt.event === "pipeline_done" && evt.note) {
          setNote(evt.note);
          try {
            const s = await api.scoreNote(evt.note.id);
            setScores(s);
          } catch (e) {
            console.error("Scoring revised note failed:", e);
          }
          loadHistory();
        }
      }
    );
  }, [note, stream, loadHistory]);

  const handleApprove = useCallback(() => {
    if (note) {
      setNote({ ...note, approved: true });
      loadHistory();
    }
  }, [note, loadHistory]);

  const handleNavClick = (sectionId: string) => {
    if (note || isRunning) {
      // Go back to landing page
      setNote(null);
      setScores(null);
      setQuery("");
    }
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface">
      
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 bg-[#060e20]/80 backdrop-blur-md border-b border-[#334155]">
        <div className="flex justify-between items-center w-full px-margin-desktop py-4 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-xl">
            <span 
              onClick={() => { setNote(null); setScores(null); setQuery(""); }} 
              className="font-headline-md text-headline-md font-bold text-[#dae2fd] cursor-pointer selection:bg-transparent"
            >
              FinPilot
            </span>
            <nav className="hidden lg:flex items-center gap-lg">
              <button 
                onClick={() => handleNavClick("markets")} 
                className="text-[#dae2fd] font-medium hover:text-[#adc6ff] transition-colors duration-200 font-label-md text-label-md"
              >
                Markets
              </button>
              <button 
                onClick={() => handleNavClick("technicals")} 
                className="text-[#dae2fd] font-medium hover:text-[#adc6ff] transition-colors duration-200 font-label-md text-label-md"
              >
                Technicals
              </button>
              <button 
                onClick={() => handleNavClick("fundamentals")} 
                className="text-[#dae2fd] font-medium hover:text-[#adc6ff] transition-colors duration-200 font-label-md text-label-md"
              >
                Fundamentals
              </button>
              <button 
                onClick={() => handleNavClick("methodology")} 
                className="text-[#dae2fd] font-medium hover:text-[#adc6ff] transition-colors duration-200 font-label-md text-label-md"
              >
                Methodology
              </button>
            </nav>
          </div>
          
          <div className="flex items-center gap-md">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[20px]">
                search
              </span>
              <input 
                type="text" 
                placeholder="Search stocks..." 
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && headerSearch.trim()) {
                    setQuery(headerSearch);
                    handleRun(headerSearch);
                    setHeaderSearch("");
                  }
                }}
                className="bg-[#131b2e] border border-[#334155] text-on-surface rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#adc6ff] focus:border-transparent outline-none w-64 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-sm">
              <button className="p-2 text-[#94A3B8] hover:text-[#adc6ff] transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="p-2 text-[#94A3B8] hover:text-[#adc6ff] transition-colors">
                <span className="material-symbols-outlined">settings</span>
              </button>
              <button className="ml-4 px-6 py-2 bg-[#3B82F6] text-white font-semibold rounded-lg hover:bg-blue-600 transition-all active:scale-95">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Workspace Content ── */}
      <main className="relative flex-1">
        
        {/* Active Research Mode Layout */}
        {(note || isRunning) ? (
          <div className="max-w-[1440px] mx-auto px-margin-desktop py-8 flex flex-col lg:flex-row gap-lg">
            
            {/* Left Pane: Report / Loading Terminal */}
            <div className="flex-1 min-w-0">
              {error && (
                <div className="mb-4 px-6 py-3 bg-[#ffdad6] border border-[#ffb4ab] text-[#690005] text-sm font-semibold flex items-center gap-2 rounded-lg font-mono">
                  <span>⚠️ Alert:</span>
                  <span>{error}</span>
                  <button onClick={reset} className="ml-auto underline font-bold">Dismiss</button>
                </div>
              )}

              {/* Loader Terminal */}
              {isRunning && !note && (
                <div className="glass-card rounded-xl p-8 flex flex-col items-center justify-center min-h-[480px] text-center border border-[#334155]">
                  <div className="relative flex items-center justify-center mb-6">
                    <div className="w-16 h-16 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin shadow-accent-glow" />
                    <span className="absolute text-2xl">🔬</span>
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface mb-2 tracking-wide uppercase">
                    Assembling Consensus Intelligence
                  </h3>
                  <p className="text-body-md text-[#94A3B8] max-w-md mx-auto mb-6 leading-relaxed">
                    FinPilot agents are crawling search indices, processing earnings reports, and auditing research data drafts.
                  </p>
                  
                  {/* Console logs */}
                  <div className="w-full max-w-xl bg-[#060e20] border border-[#334155] rounded-xl p-4 text-left font-mono text-xs text-[#adc6ff] shadow-inner">
                    <div className="flex items-center gap-2 border-b border-[#334155] pb-2 mb-2 text-[#94A3B8] font-bold uppercase tracking-wider font-display">
                      <span>Live Terminal Pipeline</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#3B82F6] animate-pulse">●</span>
                      <span className="leading-relaxed">{latestMessage || "Initializing environment logs..."}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Research Report Document Viewer */}
              {note && (
                <ResearchNote
                  note={note}
                  scores={scores}
                  onApprove={handleApprove}
                  onRevise={handleRevise}
                />
              )}
            </div>

            {/* Right Pane: Agent Consensus Map & Back Button */}
            <div className="w-full lg:w-80 flex flex-col gap-lg flex-shrink-0">
              <AgentPipeline
                agents={agents}
                latestMessage={latestMessage}
                isRunning={isRunning}
              />
              
              {!isRunning && (
                <button
                  onClick={() => {
                    setNote(null);
                    setScores(null);
                    setQuery("");
                  }}
                  className="w-full py-3 bg-[#1e293b] border border-[#334155] text-[#dae2fd] hover:text-white hover:border-[#adc6ff] text-sm font-bold uppercase tracking-wider rounded-lg transition-all"
                >
                  ← Close Report & Go Back
                </button>
              )}
            </div>

          </div>
        ) : (
          
          /* Landing Screen (Hero, Search Box, Suggestions, Bento, Archives, Quote, Ticker) */
          <>
            {/* Hero Background Grid */}
            <div className="absolute inset-0 hero-pattern pointer-events-none -z-10"></div>

            <div className="max-w-[1440px] mx-auto px-margin-desktop py-24">
              
              {/* Hero Header */}
              <div className="mb-16 max-w-4xl">
                <span className="font-label-sm text-label-sm text-[#3B82F6] tracking-widest uppercase block mb-4">
                  Systematic Equity Analysis
                </span>
                <h1 className="font-display-lg text-display-lg md:text-[80px] md:leading-[1] mb-6">
                  <span className="block">Structural Discipline.</span>
                  <span className="text-[#94A3B8] opacity-50">Indian Equities.</span>
                </h1>
                <p className="font-body-lg text-body-lg text-[#94A3B8] max-w-2xl">
                  A rule-based framework for trend-based investing across global equities. Built on moving average confirmation, multi-layer fundamental analysis, and structural discipline.
                </p>
                <div className="mt-xl flex items-center gap-md">
                  <div className="active-dot"></div>
                  <span className="font-label-md text-label-md text-[#dae2fd]">Live Market Data</span>
                </div>
              </div>

              {/* Research Command Terminal */}
              <div className="mb-24 glass-card rounded-xl p-6 relative overflow-hidden group border border-[#334155]">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#3B82F6] to-[#10B981]" />
                
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] font-display">
                      Research Command Terminal
                    </label>
                    <span className="text-[9px] font-mono text-[#3B82F6]">PRESS ENTER TO DISPATCH</span>
                  </div>

                  <textarea
                    className="w-full bg-[#060e20]/90 border border-[#334155] rounded-xl px-4 py-3 text-sm text-on-surface placeholder-[#8c909f] resize-none focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 transition-all font-sans min-h-[96px]"
                    placeholder="e.g. Conduct a comprehensive equity analysis of Reliance Industries for long-term growth prospects"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleRun();
                      }
                    }}
                  />

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-2">
                    {/* Prompt suggestions */}
                    <div className="flex flex-wrap gap-2 max-w-2xl">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setQuery(s);
                            handleRun(s);
                          }}
                          className="text-[10px] font-semibold px-2.5 py-1 bg-[#131b2e] hover:bg-[#222a3d] border border-[#334155] text-[#c2c6d6] hover:text-[#dae2fd] rounded-md transition-all whitespace-nowrap"
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleRun()}
                      disabled={!query.trim() || isRunning}
                      className="px-6 py-2.5 bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-accent-glow whitespace-nowrap self-end flex items-center gap-1.5 active:scale-95"
                    >
                      ▶ Dispatch Agents
                    </button>
                  </div>
                </div>
              </div>

              {/* Bento Grid Services */}
              <div className="bento-grid mb-24">
                
                {/* Markets Card */}
                <div id="markets" className="col-span-12 md:col-span-7 glass-card rounded-xl p-xl flex flex-col justify-between border-t-2 border-t-[#3B82F6]">
                  <div>
                    <div className="flex justify-between items-start mb-lg">
                      <span className="material-symbols-outlined text-[40px] text-[#3B82F6]">
                        analytics
                      </span>
                      <span className="bg-[#3B82F6]/10 text-[#3B82F6] px-3 py-1 rounded font-label-sm text-label-sm">
                        Sector Heatmap
                      </span>
                    </div>
                    <h3 className="font-headline-lg text-headline-lg mb-md text-on-surface">Markets</h3>
                    <p className="text-[#94A3B8] font-body-md max-w-md">
                      Sector heatmap and performance table across major indices. Drill into any sector to see constituent stock returns, relative performance, and DMA trend charts.
                    </p>
                  </div>
                  <a className="mt-xl flex items-center gap-sm text-[#3B82F6] font-bold hover:gap-md transition-all text-sm" href="#">
                    View Markets <span className="material-symbols-outlined">arrow_forward</span>
                  </a>
                </div>

                {/* Technicals Card */}
                <div id="technicals" className="col-span-12 md:col-span-5 glass-card rounded-xl p-xl flex flex-col justify-between border-t-2 border-t-[#10B981]">
                  <div>
                    <div className="flex justify-between items-start mb-lg">
                      <span className="material-symbols-outlined text-[40px] text-[#10B981]">
                        show_chart
                      </span>
                      <span className="bg-[#10B981]/10 text-[#10B981] px-3 py-1 rounded font-label-sm text-label-sm">
                        DMA Analysis
                      </span>
                    </div>
                    <h3 className="font-headline-lg text-headline-lg mb-md text-on-surface">Technicals</h3>
                    <p className="text-[#94A3B8] font-body-md">
                      Real-time DMA-based structural trend analysis for listed equities. Track 50 & 200-day moving averages with systematic bias interpretation.
                    </p>
                  </div>
                  <a className="mt-xl flex items-center gap-sm text-[#10B981] font-bold hover:gap-md transition-all text-sm" href="#">
                    Open Technicals <span className="material-symbols-outlined">arrow_forward</span>
                  </a>
                </div>

                {/* Fundamentals Card */}
                <div id="fundamentals" className="col-span-12 md:col-span-5 glass-card rounded-xl p-xl flex flex-col justify-between border-t-2 border-t-[#F59E0B]">
                  <div>
                    <div className="flex justify-between items-start mb-lg">
                      <span className="material-symbols-outlined text-[40px] text-[#F59E0B]">
                        account_balance
                      </span>
                      <span className="bg-[#F59E0B]/10 text-[#F59E0B] px-3 py-1 rounded font-label-sm text-label-sm">
                        Valuation
                      </span>
                    </div>
                    <h3 className="font-headline-lg text-headline-lg mb-md text-on-surface">Fundamentals</h3>
                    <p className="text-[#94A3B8] font-body-md">
                      Multi-layer financial analysis covering growth, profitability, capital efficiency, and valuation. Real-time data mapped to India-specific thresholds.
                    </p>
                  </div>
                  <a className="mt-xl flex items-center gap-sm text-[#F59E0B] font-bold hover:gap-md transition-all text-sm" href="#">
                    View Fundamentals <span className="material-symbols-outlined">arrow_forward</span>
                  </a>
                </div>

                {/* Methodology Card */}
                <div id="methodology" className="col-span-12 md:col-span-7 glass-card rounded-xl p-xl flex flex-col justify-between border-t-2 border-t-[#adc6ff]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    <div>
                      <span className="material-symbols-outlined text-[40px] text-[#adc6ff] mb-lg animate-pulse">
                        science
                      </span>
                      <h3 className="font-headline-lg text-headline-lg mb-md text-on-surface">Methodology</h3>
                      <p className="text-[#94A3B8] font-body-md">
                        A five-layer investment framework — from durable business quality to AI-augmented risk validation. Built for long-term compounders.
                      </p>
                    </div>
                    <div className="bg-[#222a3d]/40 rounded-lg p-md border border-[#334155]">
                      <h4 className="font-label-md text-label-md mb-sm text-on-surface">The 5 Layers</h4>
                      <ul className="space-y-unit text-[#94A3B8] text-sm">
                        <li className="flex items-center gap-xs"><span className="w-1.5 h-1.5 bg-[#adc6ff] rounded-full"></span> Durable Quality</li>
                        <li className="flex items-center gap-xs"><span className="w-1.5 h-1.5 bg-[#adc6ff] rounded-full"></span> Structural Trend</li>
                        <li className="flex items-center gap-xs"><span className="w-1.5 h-1.5 bg-[#adc6ff] rounded-full"></span> Volatility Filter</li>
                        <li className="flex items-center gap-xs"><span className="w-1.5 h-1.5 bg-[#adc6ff] rounded-full"></span> Risk Skew</li>
                        <li className="flex items-center gap-xs"><span className="w-1.5 h-1.5 bg-[#adc6ff] rounded-full"></span> Exit Discipline</li>
                      </ul>
                    </div>
                  </div>
                  <a className="mt-xl flex items-center gap-sm text-[#adc6ff] font-bold hover:gap-md transition-all text-sm" href="#">
                    Read Framework <span className="material-symbols-outlined">arrow_forward</span>
                  </a>
                </div>

              </div>

              {/* Archive Gallery List */}
              {history.length > 0 && (
                <div className="mb-24 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#334155] pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-on-surface uppercase tracking-wider font-display">
                        Analyst Desk Archives
                      </h3>
                      <p className="text-[11px] text-[#94A3B8] font-semibold mt-0.5 uppercase tracking-wide font-mono">
                        Instant-Load Past Research Reports
                      </p>
                    </div>
                    <span className="text-xs font-mono text-[#94A3B8] font-bold bg-[#131b2e] border border-[#334155] px-3 py-1 rounded-md">
                      TOTAL REPORTS: {history.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {history.map((h) => {
                      const sentimentClass =
                        h.sentiment === "positive"
                          ? "bg-green/10 text-green border-green/30"
                          : h.sentiment === "negative"
                          ? "bg-red/10 text-red border-red/30"
                          : "bg-amber/10 text-amber border-amber/30";

                      return (
                        <div
                          key={h.id}
                          onClick={() => handleLoadPastNote(h)}
                          className="bg-[#131b2e]/60 border border-[#334155] hover:border-[#3B82F6]/50 rounded-xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between h-32 relative overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#3B82F6]/2 blur-2xl group-hover:bg-[#3B82F6]/5 pointer-events-none" />
                          
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-on-surface font-display line-clamp-1">
                                  {h.company}
                                </h4>
                                <span className="font-mono text-[9px] font-bold bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] px-2 py-0.5 rounded">
                                  {h.ticker}
                                </span>
                              </div>
                              <p className="text-xs text-[#94A3B8] line-clamp-2 mt-2 italic font-medium leading-relaxed">
                                "{h.query}"
                              </p>
                            </div>
                            
                            {h.sentiment && (
                              <span className={`text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 border rounded-full font-mono ${sentimentClass}`}>
                                {h.sentiment}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#334155]/40 text-[10px] font-mono text-[#8c909f] font-semibold">
                            <span>
                              {h.created_at ? h.created_at.slice(0, 10) : "Archive"}
                            </span>
                            <div className="flex items-center gap-2">
                              <span>REV: {h.revision_count}</span>
                              {h.approved ? (
                                <span className="text-[#10B981] uppercase font-bold">✓ Published</span>
                              ) : (
                                <span className="text-[#F59E0B] uppercase font-bold">✏️ Draft</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* High Impact Quote */}
              <div className="mt-32 text-center py-24 relative overflow-hidden rounded-2xl bg-[#131b2e] border border-[#334155]">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div 
                    className="w-full h-full bg-cover bg-center" 
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCEtZHJUqf9qwlVGzXi99yqz41rlfM1sOMnjid0pZ_fO2Z5VSFcozwzrcbKUTV9MD7quTdJgpjckPkG6El2gLuMVY95q1G3ey5iqBP0QkZ6a9zLzySIgCFxNqNSiKSY3KzVBBFJEVQccwc18EdrDhdv0qTEcNAC0wVxvGvYwYhNZytvlaH5EJkGE9NM2gUkjyRYQFHJa07Lfc7rAhhCHi54V3uyyhCXeFsLkEhuThigSwgOVbFbnelALjZzh8sWC3PAMF7oHnOe7lE')" }}
                  />
                </div>
                <div className="relative z-10 px-lg">
                  <span className="material-symbols-outlined text-[#3B82F6] text-4xl mb-lg">
                    format_quote
                  </span>
                  <h2 className="font-display-lg text-display-lg md:text-[56px] leading-tight mb-md max-w-4xl mx-auto italic text-on-surface">
                    Compounding requires discipline, not excitement.
                  </h2>
                </div>
              </div>

              {/* Market Quick Links Strip */}
              <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-lg">
                <div className="bg-[#131b2e] border border-[#334155] p-md rounded-xl flex items-center justify-between group cursor-pointer hover:bg-[#2d3449] transition-all">
                  <div>
                    <p className="font-label-sm text-label-sm text-[#94A3B8] mb-xs">NIFTY 50</p>
                    <p className="font-headline-md text-headline-md text-[#10B981]">22,453.20</p>
                  </div>
                  <span className="material-symbols-outlined text-[#10B981] group-hover:translate-x-1 transition-transform">
                    trending_up
                  </span>
                </div>
                <div className="bg-[#131b2e] border border-[#334155] p-md rounded-xl flex items-center justify-between group cursor-pointer hover:bg-[#2d3449] transition-all">
                  <div>
                    <p className="font-label-sm text-label-sm text-[#94A3B8] mb-xs">BANK NIFTY</p>
                    <p className="font-headline-md text-headline-md text-[#EF4444]">47,211.55</p>
                  </div>
                  <span className="material-symbols-outlined text-[#EF4444] group-hover:translate-x-1 transition-transform">
                    trending_down
                  </span>
                </div>
                <div className="bg-[#131b2e] border border-[#334155] p-md rounded-xl flex items-center justify-between group cursor-pointer hover:bg-[#2d3449] transition-all">
                  <div>
                    <p className="font-label-sm text-label-sm text-[#94A3B8] mb-xs">NIFTY IT</p>
                    <p className="font-headline-md text-headline-md text-[#10B981]">36,104.90</p>
                  </div>
                  <span className="material-symbols-outlined text-[#10B981] group-hover:translate-x-1 transition-transform">
                    trending_up
                  </span>
                </div>
                <div className="bg-[#131b2e] border border-[#334155] p-md rounded-xl flex items-center justify-between group cursor-pointer hover:bg-[#2d3449] transition-all">
                  <div>
                    <p className="font-label-sm text-label-sm text-[#94A3B8] mb-xs">VIX</p>
                    <p className="font-headline-md text-headline-md text-[#F59E0B]">14.22</p>
                  </div>
                  <span className="material-symbols-outlined text-[#F59E0B] group-hover:translate-x-1 transition-transform">
                    analytics
                  </span>
                </div>
              </div>

            </div>
          </>
        )}

      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#131b2e] border-t border-[#334155] mt-24">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-desktop py-lg max-w-[1440px] mx-auto gap-lg">
          <div className="flex flex-col gap-sm items-center md:items-start text-center md:text-left">
            <span className="font-headline-md text-headline-md font-bold text-on-surface">FinPilot</span>
            <p className="font-body-md text-[#94A3B8]">Systematic Equity Research.</p>
            <p className="font-label-sm text-label-sm text-[#94A3B8] opacity-60">© 2026 FinPilot. Data Source: Yahoo Finance.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-xl">
            <a className="text-[#94A3B8] hover:text-on-surface transition-colors font-label-md text-label-md" href="#">Privacy Policy</a>
            <a className="text-[#94A3B8] hover:text-on-surface transition-colors font-label-md text-label-md" href="#">Terms of Service</a>
            <a className="text-[#94A3B8] hover:text-on-surface transition-colors font-label-md text-label-md" href="#">Disclaimer</a>
            <a className="text-[#94A3B8] hover:text-on-surface transition-colors font-label-md text-label-md" href="#">Contact</a>
            <a className="text-[#94A3B8] hover:text-on-surface transition-colors font-label-md text-label-md" href="#">Methodology</a>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-margin-desktop pb-lg">
          <p className="font-label-sm text-label-sm text-[#94A3B8] text-center opacity-40 italic">
            This platform is a decision-support framework and does not constitute investment advice. FinPilot v1.2
          </p>
        </div>
      </footer>

    </div>
  );
}