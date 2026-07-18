"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CircularGauge from "@/components/CircularGauge";

interface FinancialData {
  current_price?: number | string;
  market_cap?: number | string;
  pe_ratio?: number | string;
  roe?: number | string;
  net_profit_margin?: number | string;
}

interface NoteData {
  id: string;
  query: string;
  company: string;
  ticker: string;
  note: string;
  sentiment?: string;
  financial_data?: FinancialData;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ComparisonPage() {
  const [queryA, setQueryA] = useState("Reliance Industries");
  const [queryB, setQueryB] = useState("TCS");
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState<"idle" | "running" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ noteA: NoteData; noteB: NoteData } | null>(null);

  // Mouse cursor glow hover effect
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

  const handleCompare = async () => {
    if (!queryA.trim() || !queryB.trim() || isRunning) return;

    setIsRunning(true);
    setStep("running");
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`${API_BASE}/api/comparison/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query1: queryA, query2: queryB }),
      });

      if (!response.ok) throw new Error("Failed to initialize parallel comparison.");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.replace("data: ", ""));
            if (data.event === "comparison_start") {
              // Started
            } else if (data.event === "comparison_done") {
              setResults({ noteA: data.note_a, noteB: data.note_b });
              setStep("done");
            } else if (data.event === "error") {
              throw new Error(data.message || "An error occurred during comparison.");
            }
          } catch (e: any) {
            console.error("SSE parse error", e);
            setError(e.message || "Failed parsing comparison packet.");
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Connection to comparison runner failed.");
      setStep("idle");
    } finally {
      setIsRunning(false);
    }
  };

  // Delta calculator helper
  const calcDelta = (valA: any, valB: any): string => {
    const numA = parseFloat(String(valA).replace(/[^0-9.-]/g, ""));
    const numB = parseFloat(String(valB).replace(/[^0-9.-]/g, ""));

    if (Number.isNaN(numA) || Number.isNaN(numB) || numA === 0) return "—";
    const delta = ((numB - numA) / numA) * 100;
    return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
  };

  const isPositiveDelta = (valA: any, valB: any): boolean => {
    const numA = parseFloat(String(valA).replace(/[^0-9.-]/g, ""));
    const numB = parseFloat(String(valB).replace(/[^0-9.-]/g, ""));
    return !Number.isNaN(numA) && !Number.isNaN(numB) && numB >= numA;
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-lg min-h-screen flex flex-col pt-16">
      <main className="flex-grow w-full max-w-[1720px] mx-auto px-margin-desktop py-md">
        
        {/* Title Header */}
        <div className="flex flex-col mb-8 gap-1.5 fade-in-stagger">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[11px]">
              Multi-Agent Benchmark Station
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface">
            Parallel Equity Comparison
          </h1>
        </div>

        {/* Input panel */}
        <section className="mb-8 bg-surface-container-low border border-outline-variant p-6 flex flex-col md:flex-row items-end gap-4 rounded fade-in-stagger" style={{ animationDelay: "100ms" }}>
          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider text-[11px]">
                Entity A (Benchmark Target)
              </label>
              <div className="relative">
                <input
                  value={queryA}
                  onChange={(e) => setQueryA(e.target.value)}
                  disabled={isRunning}
                  className="w-full bg-background border border-outline-variant py-3.5 px-4 text-body-md focus:border-primary outline-none transition-all rounded font-sans"
                  placeholder="Enter Ticker or Company Name"
                  type="text"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">
                  search
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider text-[11px]">
                Entity B (Comparison Target)
              </label>
              <div className="relative">
                <input
                  value={queryB}
                  onChange={(e) => setQueryB(e.target.value)}
                  disabled={isRunning}
                  className="w-full bg-background border border-outline-variant py-3.5 px-4 text-body-md focus:border-primary outline-none transition-all rounded font-sans"
                  placeholder="Enter Ticker or Company Name"
                  type="text"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">
                  search
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleCompare}
            disabled={isRunning || !queryA.trim() || !queryB.trim()}
            className="bg-primary-container text-on-primary-container px-8 py-3.5 font-label-caps text-label-caps uppercase h-[52px] flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 border-none cursor-pointer rounded shrink-0 w-full md:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              compare_arrows
            </span>
            Run Comparison
          </button>
        </section>

        {/* Loading / Pipeline active track */}
        {step === "running" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 fade-in-stagger" style={{ animationDelay: "200ms" }}>
            <div className="bg-surface-container border border-outline-variant p-4 flex items-center justify-between rounded animate-agent-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
                </div>
                <div>
                  <p className="font-label-caps text-[10px] text-outline uppercase tracking-wider">
                    Agent Pipeline A
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface font-mono">
                    Scraping reports for &ldquo;{queryA}&rdquo;
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" style={{ animationDelay: "0.2s" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
            <div className="bg-surface-container border border-outline-variant p-4 flex items-center justify-between rounded animate-agent-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                </div>
                <div>
                  <p className="font-label-caps text-[10px] text-outline uppercase tracking-wider">
                    Agent Pipeline B
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface font-mono">
                    Scraping reports for &ldquo;{queryB}&rdquo;
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" style={{ animationDelay: "0.2s" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </section>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="p-4 mb-8 bg-error-container/10 border border-error-container/30 text-risk-crimson rounded font-mono text-body-sm">
            {error}
          </div>
        )}

        {/* Comparison Results */}
        {step === "done" && results && (
          <div className="space-y-8 fade-in-stagger" style={{ animationDelay: "200ms" }}>
            
            {/* Headers side-by-side cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card A */}
              <div className="bg-surface-container border border-outline-variant p-6 rounded relative overflow-hidden group radial-glow">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                  <span className="material-symbols-outlined text-[80px]">trending_up</span>
                </div>
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div>
                    <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                      {results.noteA.company}
                    </h2>
                    <span className="font-data-md text-data-md text-primary font-mono">
                      {results.noteA.ticker.replace(".NS", "")}
                    </span>
                  </div>
                  {results.noteA.financial_data?.current_price && (
                    <div className="text-right font-mono">
                      <div className="font-data-lg text-data-lg text-on-surface font-semibold">
                        ₹{results.noteA.financial_data.current_price}
                      </div>
                      <div className="font-label-caps text-[10px] text-outline mt-0.5 uppercase tracking-wider">
                        Market Price
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="p-3 bg-surface-container-high border border-outline-variant/30 rounded">
                    <p className="font-label-caps text-[10px] text-outline uppercase tracking-wider mb-1">
                      Market Cap
                    </p>
                    <p className="font-data-md text-data-md text-on-surface font-mono">
                      {results.noteA.financial_data?.market_cap || "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-surface-container-high border border-outline-variant/30 rounded">
                    <p className="font-label-caps text-[10px] text-outline uppercase tracking-wider mb-1">
                      P/E Ratio
                    </p>
                    <p className="font-data-md text-data-md text-on-surface font-mono">
                      {results.noteA.financial_data?.pe_ratio || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card B */}
              <div className="bg-surface-container border border-outline-variant p-6 rounded relative overflow-hidden group radial-glow">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                  <span className="material-symbols-outlined text-[80px]">analytics</span>
                </div>
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div>
                    <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                      {results.noteB.company}
                    </h2>
                    <span className="font-data-md text-data-md text-primary font-mono">
                      {results.noteB.ticker.replace(".NS", "")}
                    </span>
                  </div>
                  {results.noteB.financial_data?.current_price && (
                    <div className="text-right font-mono">
                      <div className="font-data-lg text-data-lg text-on-surface font-semibold">
                        ₹{results.noteB.financial_data.current_price}
                      </div>
                      <div className="font-label-caps text-[10px] text-outline mt-0.5 uppercase tracking-wider">
                        Market Price
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="p-3 bg-surface-container-high border border-outline-variant/30 rounded">
                    <p className="font-label-caps text-[10px] text-outline uppercase tracking-wider mb-1">
                      Market Cap
                    </p>
                    <p className="font-data-md text-data-md text-on-surface font-mono">
                      {results.noteB.financial_data?.market_cap || "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-surface-container-high border border-outline-variant/30 rounded">
                    <p className="font-label-caps text-[10px] text-outline uppercase tracking-wider mb-1">
                      P/E Ratio
                    </p>
                    <p className="font-data-md text-data-md text-on-surface font-mono">
                      {results.noteB.financial_data?.pe_ratio || "—"}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Quality Indices side-by-side gauge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
              <div className="bg-surface-container border border-outline-variant p-6 rounded flex items-center justify-center flex-col radial-glow">
                <h3 className="font-label-caps text-label-caps text-outline uppercase tracking-wider mb-4">
                  Benchmarked Agent Conviction ({results.noteA.ticker.replace(".NS", "")})
                </h3>
                <CircularGauge value={75} label="Confidence Score" colorClass="text-primary-container" />
              </div>
              <div className="bg-surface-container border border-outline-variant p-6 rounded flex items-center justify-center flex-col radial-glow">
                <h3 className="font-label-caps text-label-caps text-outline uppercase tracking-wider mb-4">
                  Benchmarked Agent Conviction ({results.noteB.ticker.replace(".NS", "")})
                </h3>
                <CircularGauge value={80} label="Confidence Score" colorClass="text-tertiary" />
              </div>
            </div>

            {/* Financial Delta Matrix */}
            <section className="bg-surface-container border border-outline-variant rounded overflow-hidden radial-glow">
              <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center select-none">
                <h3 className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                  Delta Matrix (Key Fundamentals)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-surface-container-highest/50 text-left border-b border-outline-variant">
                      <th className="p-4 font-label-caps text-label-caps text-outline uppercase tracking-wider border-r border-outline-variant">
                        Metric Descriptor
                      </th>
                      <th className="p-4 font-label-caps text-label-caps text-outline uppercase tracking-wider text-right">
                        {results.noteA.ticker.replace(".NS", "")}
                      </th>
                      <th className="p-4 font-label-caps text-label-caps text-outline uppercase tracking-wider text-right">
                        {results.noteB.ticker.replace(".NS", "")}
                      </th>
                      <th className="p-4 font-label-caps text-label-caps text-outline uppercase tracking-wider bg-surface-container-low text-right">
                        Delta A → B (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-data-md text-data-md font-mono select-text divide-y divide-outline-variant/20">
                    
                    {/* Market Cap */}
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="p-4 text-on-surface-variant font-sans border-r border-outline-variant">
                        Market Capitalization
                      </td>
                      <td className="p-4 text-right text-on-surface">
                        {results.noteA.financial_data?.market_cap || "—"}
                      </td>
                      <td className="p-4 text-right text-on-surface">
                        {results.noteB.financial_data?.market_cap || "—"}
                      </td>
                      <td
                        className={`p-4 text-right font-bold bg-surface-container-low ${
                          isPositiveDelta(
                            results.noteA.financial_data?.market_cap,
                            results.noteB.financial_data?.market_cap
                          )
                            ? "text-growth-emerald"
                            : "text-risk-crimson"
                        }`}
                      >
                        {calcDelta(
                          results.noteA.financial_data?.market_cap,
                          results.noteB.financial_data?.market_cap
                        )}
                      </td>
                    </tr>

                    {/* Stock price */}
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="p-4 text-on-surface-variant font-sans border-r border-outline-variant">
                        Market Price per Share
                      </td>
                      <td className="p-4 text-right text-on-surface">
                        ₹{results.noteA.financial_data?.current_price || "—"}
                      </td>
                      <td className="p-4 text-right text-on-surface">
                        ₹{results.noteB.financial_data?.current_price || "—"}
                      </td>
                      <td
                        className={`p-4 text-right font-bold bg-surface-container-low ${
                          isPositiveDelta(
                            results.noteA.financial_data?.current_price,
                            results.noteB.financial_data?.current_price
                          )
                            ? "text-growth-emerald"
                            : "text-risk-crimson"
                        }`}
                      >
                        {calcDelta(
                          results.noteA.financial_data?.current_price,
                          results.noteB.financial_data?.current_price
                        )}
                      </td>
                    </tr>

                    {/* PE ratio */}
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="p-4 text-on-surface-variant font-sans border-r border-outline-variant">
                        Price to Earnings (P/E)
                      </td>
                      <td className="p-4 text-right text-on-surface">
                        {results.noteA.financial_data?.pe_ratio || "—"}x
                      </td>
                      <td className="p-4 text-right text-on-surface">
                        {results.noteB.financial_data?.pe_ratio || "—"}x
                      </td>
                      <td
                        className={`p-4 text-right font-bold bg-surface-container-low ${
                          !isPositiveDelta(
                            results.noteA.financial_data?.pe_ratio,
                            results.noteB.financial_data?.pe_ratio
                          )
                            ? "text-growth-emerald"
                            : "text-risk-crimson"
                        }`}
                      >
                        {calcDelta(
                          results.noteA.financial_data?.pe_ratio,
                          results.noteB.financial_data?.pe_ratio
                        )}
                      </td>
                    </tr>

                    {/* ROE */}
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="p-4 text-on-surface-variant font-sans border-r border-outline-variant">
                        Return on Equity (ROE)
                      </td>
                      <td className="p-4 text-right text-on-surface">
                        {results.noteA.financial_data?.roe || "—"}
                      </td>
                      <td className="p-4 text-right text-on-surface">
                        {results.noteB.financial_data?.roe || "—"}
                      </td>
                      <td
                        className={`p-4 text-right font-bold bg-surface-container-low ${
                          isPositiveDelta(
                            results.noteA.financial_data?.roe,
                            results.noteB.financial_data?.roe
                          )
                            ? "text-growth-emerald"
                            : "text-risk-crimson"
                        }`}
                      >
                        {calcDelta(
                          results.noteA.financial_data?.roe,
                          results.noteB.financial_data?.roe
                        )}
                      </td>
                    </tr>

                    {/* Profit margin */}
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="p-4 text-on-surface-variant font-sans border-r border-outline-variant">
                        Net Profit Margin
                      </td>
                      <td className="p-4 text-right text-on-surface">
                        {results.noteA.financial_data?.net_profit_margin || "—"}
                      </td>
                      <td className="p-4 text-right text-on-surface">
                        {results.noteB.financial_data?.net_profit_margin || "—"}
                      </td>
                      <td
                        className={`p-4 text-right font-bold bg-surface-container-low ${
                          isPositiveDelta(
                            results.noteA.financial_data?.net_profit_margin,
                            results.noteB.financial_data?.net_profit_margin
                          )
                            ? "text-growth-emerald"
                            : "text-risk-crimson"
                        }`}
                      >
                        {calcDelta(
                          results.noteA.financial_data?.net_profit_margin,
                          results.noteB.financial_data?.net_profit_margin
                        )}
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </section>

            {/* Qualitative Synthesis narratives */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Note A narrative */}
              <div className="bg-surface-container-low border border-outline-variant p-6 rounded">
                <h3 className="font-label-caps text-label-caps text-primary uppercase mb-4 tracking-wider">
                  Benchmark Analysis Report Summary
                </h3>
                <div className="prose prose-invert prose-sm max-w-none text-on-surface-variant text-[14px] leading-relaxed font-sans max-h-[400px] overflow-y-auto custom-scrollbar select-text pr-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {results.noteA.note}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Note B narrative */}
              <div className="bg-surface-container-low border border-outline-variant p-6 rounded">
                <h3 className="font-label-caps text-label-caps text-tertiary uppercase mb-4 tracking-wider">
                  Comparison Analysis Report Summary
                </h3>
                <div className="prose prose-invert prose-sm max-w-none text-on-surface-variant text-[14px] leading-relaxed font-sans max-h-[400px] overflow-y-auto custom-scrollbar select-text pr-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {results.noteB.note}
                  </ReactMarkdown>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}