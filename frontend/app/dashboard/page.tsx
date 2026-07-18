"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { marketApi, LiveStockData } from "@/lib/market";
import Sparkline from "@/components/Sparkline";

const WATCHLIST = [
  "RELIANCE.NS",
  "TCS.NS",
  "HDFCBANK.NS",
  "INFY.NS",
  "ICICIBANK.NS",
  "TATASTEEL.NS",
  "BHARTIARTL.NS",
  "ADANIPORTS.NS",
];

interface Quote extends LiveStockData {
  ticker: string;
}

const TYPING_SUGGESTIONS = [
  "Deep dive on Reliance Industries margins",
  "Compare TCS multiples against tech peers",
  "Analyze ICICI Bank's loan book growth",
  "What is Tata Steel's leverage profile?",
];

export default function DashboardPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>(WATCHLIST[0]);
  const [moversTab, setMoversTab] = useState<"gainers" | "losers">("gainers");
  const [query, setQuery] = useState("");

  // Typing simulator state
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  const [suggestionText, setSuggestionText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAll = async () => {
    const results = await Promise.all(
      WATCHLIST.map(async (ticker) => {
        const data = await marketApi.getLiveData(ticker);
        return data ? { ticker, ...data } : null;
      })
    );
    setQuotes(results.filter(Boolean) as Quote[]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cursor tracking radial glow effect
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

  // Typing animation loop
  useEffect(() => {
    const currentFullText = TYPING_SUGGESTIONS[suggestionIdx];
    let timer: NodeJS.Timeout;

    if (isDeleting) {
      timer = setTimeout(() => {
        setSuggestionText(currentFullText.substring(0, suggestionText.length - 1));
      }, 50);
    } else {
      timer = setTimeout(() => {
        setSuggestionText(currentFullText.substring(0, suggestionText.length + 1));
      }, 100);
    }

    if (!isDeleting && suggestionText === currentFullText) {
      timer = setTimeout(() => setIsDeleting(true), 2500);
    } else if (isDeleting && suggestionText === "") {
      setIsDeleting(false);
      setSuggestionIdx((prev) => (prev + 1) % TYPING_SUGGESTIONS.length);
    }

    return () => clearTimeout(timer);
  }, [suggestionText, isDeleting, suggestionIdx]);

  const selectedQuote = quotes.find((q) => q.ticker === selected);

  const sorted = useMemo(() => {
    const withChange = quotes.filter(
      (q) => q.realtime?.change !== undefined && q.realtime?.change !== null
    );
    return [...withChange].sort((a, b) => (b.realtime.change ?? 0) - (a.realtime.change ?? 0));
  }, [quotes]);

  const gainers = sorted.filter((q) => (q.realtime.change ?? 0) >= 0);
  const losers = [...sorted].reverse().filter((q) => (q.realtime.change ?? 0) < 0);

  const sectorHeatmap = useMemo(() => {
    const groups: Record<string, number[]> = {};
    for (const q of quotes) {
      const sector = q.fundamentals?.sector || "Other";
      const changeStr = q.realtime?.change_percent;
      const changeNum = changeStr
        ? parseFloat(changeStr.replace("%", "").replace("+", ""))
        : null;
      if (changeNum === null || Number.isNaN(changeNum)) continue;
      groups[sector] = groups[sector] || [];
      groups[sector].push(changeNum);
    }
    return Object.entries(groups).map(([sector, values]) => ({
      sector,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    }));
  }, [quotes]);

  const handleLaunchResearch = () => {
    const q = query.trim();
    router.push(q ? `/research?q=${encodeURIComponent(q)}` : "/research");
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-lg overflow-x-hidden flex flex-col pt-16">
      
      {/* Ticker tape */}
      <div className="bg-surface-container-low border-b border-outline-variant py-2 overflow-hidden select-none relative z-10">
        <div className="ticker-scroll flex whitespace-nowrap">
          <div className="flex gap-12 px-6 items-center">
            {loading && <span className="text-data-sm text-outline animate-pulse">Loading live market feeds...</span>}
            {quotes.concat(quotes).map((q, idx) => (
              <div
                key={`${q.ticker}-${idx}`}
                onClick={() => setSelected(q.ticker)}
                className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors duration-150"
              >
                <span className="font-bold text-data-md font-mono text-on-surface">
                  {q.ticker.replace(".NS", "")}
                </span>
                <span className="font-data-md text-outline">₹{q.realtime?.price ?? "—"}</span>
                <span
                  className={`font-data-sm ${
                    (q.realtime?.change ?? 0) >= 0 ? "text-growth-emerald" : "text-risk-crimson"
                  }`}
                >
                  {q.realtime?.change_percent ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-grow w-full max-w-[1720px] mx-auto px-margin-desktop py-md pb-24">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 fade-in-stagger">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80] animate-pulse" />
              <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">
                Market Active • NSE Live
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface">
              Institutional Overview
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const csvData = quotes.map((q) => ({
                  ticker: q.ticker.replace(".NS", ""),
                  price: q.realtime?.price,
                  change: q.realtime?.change_percent,
                  sector: q.fundamentals?.sector,
                }));
                const blob = new Blob([JSON.stringify(csvData, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `market_overview_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
              }}
              className="bg-surface-container px-4 py-2 border border-outline-variant font-label-caps text-label-caps hover:bg-surface-container-high transition-all text-on-surface active:scale-95 animate-transition"
            >
              Export JSON
            </button>
            <button className="bg-primary-container text-on-primary-container px-4 py-2 border border-primary-container font-label-caps text-label-caps hover:brightness-110 transition-all active:scale-95">
              System Health
            </button>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-gutter fade-in-stagger" style={{ animationDelay: "200ms" }}>
          
          {/* Main Chart Panel */}
          <section className="col-span-12 lg:col-span-8 bg-surface-container border border-outline-variant overflow-hidden group radial-glow">
            <div className="p-gutter border-b border-outline-variant flex justify-between items-center bg-surface-container-low flex-wrap gap-md">
              <div className="flex items-center gap-6">
                <div>
                  <span className="font-label-caps text-label-caps text-outline">Instrument</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={selected}
                      onChange={(e) => setSelected(e.target.value)}
                      className="bg-transparent border-none text-headline-md font-semibold focus:ring-0 p-0 pr-6 text-on-surface cursor-pointer font-sans"
                    >
                      {WATCHLIST.map((t) => (
                        <option key={t} value={t} className="bg-surface-container text-on-surface">
                          NSE: {t.replace(".NS", "")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="h-10 w-[1px] bg-outline-variant" />
                <div>
                  <span className="font-label-caps text-label-caps text-outline">Live Price</span>
                  <div className="font-data-lg text-data-lg text-growth-emerald flex items-baseline gap-2">
                    <span className="font-bold text-[18px]">
                      ₹{selectedQuote?.realtime?.price ?? "—"}
                    </span>
                    <span
                      className={`text-body-sm font-body-sm font-sans ${
                        (selectedQuote?.realtime?.change ?? 0) >= 0
                          ? "text-growth-emerald"
                          : "text-risk-crimson"
                      }`}
                    >
                      {selectedQuote?.realtime?.change_percent ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <span className="px-3 py-1 font-data-sm text-data-sm rounded bg-primary-container text-on-primary-container font-mono">
                  1D Trend
                </span>
              </div>
            </div>
            <div className="relative h-[320px] w-full p-6 flex flex-col justify-between">
              <div className="flex justify-between text-outline font-label-caps text-[10px]">
                <span>Price Timeline (Close)</span>
                {selectedQuote && (
                  <span>
                    Range: ₹{selectedQuote.realtime?.day_low ?? "—"} – ₹
                    {selectedQuote.realtime?.day_high ?? "—"}
                  </span>
                )}
              </div>
              <div className="flex-1 h-full w-full relative overflow-hidden mt-4">
                <Sparkline values={selectedQuote?.historical?.close || []} />
              </div>
            </div>
          </section>

          {/* Top Movers Panel */}
          <section className="col-span-12 lg:col-span-4 bg-surface-container border border-outline-variant flex flex-col radial-glow">
            <div className="flex border-b border-outline-variant bg-surface-container-low">
              <button
                onClick={() => setMoversTab("gainers")}
                className={`flex-1 py-4 font-label-caps text-label-caps border-b-2 text-center tracking-wider transition-colors duration-150 bg-transparent ${
                  moversTab === "gainers"
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-outline hover:text-on-surface"
                }`}
              >
                Top Gainers
              </button>
              <button
                onClick={() => setMoversTab("losers")}
                className={`flex-1 py-4 font-label-caps text-label-caps border-b-2 text-center tracking-wider transition-colors duration-150 bg-transparent ${
                  moversTab === "losers"
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-outline hover:text-on-surface"
                }`}
              >
                Top Losers
              </button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar divide-y divide-outline-variant/30">
              {(moversTab === "gainers" ? gainers : losers).slice(0, 5).map((q) => (
                <div
                  key={q.ticker}
                  onClick={() => setSelected(q.ticker)}
                  className="p-4 flex justify-between items-center hover:bg-surface-container-high transition-colors cursor-pointer group"
                >
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 bg-primary-container/10 border border-primary/20 rounded flex items-center justify-center font-bold text-primary font-mono">
                      {q.ticker.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-on-surface group-hover:text-primary transition-colors">
                        {q.ticker.replace(".NS", "")}
                      </div>
                      <div className="text-body-sm font-body-sm text-outline">
                        {q.fundamentals?.sector || "Market Asset"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-data-md text-on-surface">
                      ₹{q.realtime?.price ?? "—"}
                    </div>
                    <div
                      className={`text-body-sm font-semibold ${
                        (q.realtime?.change ?? 0) >= 0 ? "text-growth-emerald" : "text-risk-crimson"
                      }`}
                    >
                      {q.realtime?.change_percent ?? "—"}
                    </div>
                  </div>
                </div>
              ))}
              {!loading && gainers.length === 0 && losers.length === 0 && (
                <div className="p-8 text-center text-outline text-body-sm italic">
                  No mover metrics compiled.
                </div>
              )}
            </div>
          </section>

          {/* Sector Heatmap Panel */}
          <section className="col-span-12 bg-surface-container border border-outline-variant overflow-hidden radial-glow mt-2">
            <div className="p-gutter border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="font-headline-md text-headline-md">Sector Heatmap</h3>
              <div className="flex items-center gap-4">
                <span className="text-label-caps text-outline text-[11px]">
                  Watchlist Derived Average Change
                </span>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-surface-container-lowest">
              {sectorHeatmap.map((s) => {
                const isPositive = s.avg >= 0;
                return (
                  <div
                    key={s.sector}
                    className={`heatmap-cell border p-4 flex flex-col justify-between cursor-pointer rounded transition-all duration-300 ${
                      isPositive
                        ? "bg-gradient-to-br from-[#4ade80]/15 to-[#22c55e]/5 border-growth-emerald/20 hover:border-growth-emerald/50"
                        : "bg-gradient-to-br from-[#f87171]/15 to-[#ef4444]/5 border-risk-crimson/20 hover:border-risk-crimson/50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-label-caps text-label-caps text-outline">
                        {s.sector.toUpperCase()}
                      </span>
                      <span
                        className={`material-symbols-outlined text-[16px] ${
                          isPositive ? "text-growth-emerald" : "text-risk-crimson"
                        }`}
                      >
                        {isPositive ? "trending_up" : "trending_down"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`font-data-lg text-data-lg font-bold ${
                          isPositive ? "text-growth-emerald" : "text-risk-crimson"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {s.avg.toFixed(2)}%
                      </span>
                      <div className="h-1 w-full bg-outline-variant/20 mt-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isPositive ? "bg-growth-emerald" : "bg-risk-crimson"}`}
                          style={{ width: `${Math.min(Math.abs(s.avg) * 10, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {sectorHeatmap.length === 0 && !loading && (
                <div className="col-span-full py-8 text-center text-outline italic text-body-sm">
                  No sector fundamentals aggregated.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Floating terminal search container */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-40">
        <div className="bg-surface-container-highest/90 backdrop-blur-md border border-primary/20 p-2.5 rounded-full shadow-2xl flex items-center gap-3 shadow-primary/5 hover:border-primary/40 transition-all duration-300">
          <div className="flex-1 relative flex items-center">
            <span className="material-symbols-outlined absolute left-4 text-primary">terminal</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLaunchResearch()}
              className="w-full bg-transparent border-none focus:ring-0 pl-12 pr-4 py-3 text-body-lg text-on-surface placeholder:text-outline/75 outline-none font-sans"
              placeholder=""
            />
            {query === "" && (
              <div className="absolute left-12 text-outline/50 pointer-events-none font-sans text-body-lg flex items-center">
                <span>Launch Research: </span>
                <span className="text-primary/70 ml-1.5 font-mono">{suggestionText}</span>
                <span className="w-1.5 h-4 bg-primary/70 ml-0.5 animate-pulse" />
              </div>
            )}
          </div>
          <button
            onClick={handleLaunchResearch}
            className="bg-primary-container text-on-primary-container h-12 px-6 rounded-full font-label-caps text-label-caps flex items-center gap-2 hover:scale-105 transition-all duration-150 active:scale-95 cursor-pointer shadow-md border-none"
          >
            Execute
            <span className="material-symbols-outlined text-[18px]">bolt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
