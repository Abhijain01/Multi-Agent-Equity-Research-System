"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SUGGESTIONS = [
  "Deep dive on NVIDIA margins",
  "Compare SaaS multiples",
  "Analyze Reliance Industries cash flow",
  "Explain HDFC Bank valuation premium",
];

const SIMULATED_LOGS = [
  "Fetching SEC 10-K filing logs... Done.",
  "Analyzing segment revenue streams 2022-2025...",
  "Anomalous margins expansion detected in server compute.",
  "Cross-referencing industry multiple values...",
  "Compiling relative market share charts...",
  "Synthesizing competitive landscape report draft...",
  "Initializing critique node evaluation model...",
  "Report successfully compiled. Dispatching and auditing logs.",
];

export default function LandingPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tickerSuggestions, setTickerSuggestions] = useState<string[]>([]);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  
  // Suggestion typing state
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  const [suggestionText, setSuggestionText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Run simulated logs loop
  useEffect(() => {
    let logIdx = 0;
    const interval = setInterval(() => {
      setActiveLogs((prev) => {
        const nextLog = SIMULATED_LOGS[logIdx];
        logIdx = (logIdx + 1) % SIMULATED_LOGS.length;
        if (prev.length > 5) {
          return [...prev.slice(1), nextLog];
        }
        return [...prev, nextLog];
      });
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  // Ticker typing animation loop
  useEffect(() => {
    const currentFullText = SUGGESTIONS[suggestionIdx];
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
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && suggestionText === "") {
      setIsDeleting(false);
      setSuggestionIdx((prev) => (prev + 1) % SUGGESTIONS.length);
    }

    return () => clearTimeout(timer);
  }, [suggestionText, isDeleting, suggestionIdx]);

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

  const handleLaunchResearch = (override?: string) => {
    const targetQuery = override ?? query;
    if (targetQuery.trim()) {
      router.push(`/research?q=${encodeURIComponent(targetQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-lg overflow-x-hidden flex flex-col pt-16">
      
      <section className="relative px-6 md:px-margin-desktop py-12 overflow-hidden flex flex-col items-center">
        <div className="relative z-10 max-w-5xl mx-auto text-center fade-in-stagger select-none">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-surface-container-high border border-outline-variant/60 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Multi-Agent Intelligence Active
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface mb-6 leading-tight max-w-3xl mx-auto font-bold">
            Institutional Equity Research <br className="hidden md:block" />
            <span className="text-primary">Delivered in Minutes.</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto">
            Deploy a specialized multi-agent pipeline to aggregate data, model scenarios, and generate institutional-grade reports with surgical precision.
          </p>

          {/* Terminal Search */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-surface-container p-1 rounded border border-outline-variant glow-hover transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2">
                <div className="flex-1 flex items-center gap-3 px-4 bg-background/50 rounded border border-outline-variant/60 h-14 relative">
                  <span className="material-symbols-outlined text-primary text-[22px]">terminal</span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLaunchResearch()}
                    className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-outline outline-none font-mono text-[14px]"
                    placeholder=""
                  />
                  {query === "" && (
                    <div className="absolute left-12 text-outline/50 pointer-events-none text-[14px] font-mono flex items-center">
                      <span>Analyse </span>
                      <span className="text-primary/80 ml-1.5">{suggestionText}</span>
                      <span className="w-1.5 h-3.5 bg-primary/80 ml-0.5 animate-pulse" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleLaunchResearch()}
                  className="bg-primary-container text-on-primary-container px-8 h-14 rounded font-label-caps text-label-caps uppercase hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  Run Intelligence
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                </button>
              </div>
            </div>
            
            <div className="mt-4 flex gap-4 justify-center flex-wrap select-none">
              <span
                onClick={() => handleLaunchResearch("Deep dive on NVIDIA margins")}
                className="font-data-sm text-data-sm text-outline hover:text-primary transition-colors cursor-pointer"
              >
                Try: "Deep dive on NVIDIA margins"
              </span>
              <span className="font-data-sm text-data-sm text-outline">|</span>
              <span
                onClick={() => handleLaunchResearch("Compare SaaS multiples")}
                className="font-data-sm text-data-sm text-outline hover:text-primary transition-colors cursor-pointer"
              >
                "Compare SaaS multiples"
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Live Snapshot Strip */}
      <section className="border-y border-outline-variant bg-surface-container-lowest overflow-hidden py-3 select-none fade-in-stagger" style={{ animationDelay: "200ms" }}>
        <div className="flex ticker-scroll whitespace-nowrap">
          <div className="flex gap-12 px-6">
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-on-surface">NVDA</span>
              <span className="text-outline">914.32</span>
              <span className="text-growth-emerald">+2.15%</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-on-surface">AAPL</span>
              <span className="text-outline">189.20</span>
              <span className="text-risk-crimson">-0.42%</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-on-surface">TSLA</span>
              <span className="text-outline">175.40</span>
              <span className="text-growth-emerald">+1.08%</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-on-surface">MSFT</span>
              <span className="text-outline">412.10</span>
              <span className="text-growth-emerald">+0.85%</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-on-surface">AMZN</span>
              <span className="text-outline">178.50</span>
              <span className="text-risk-crimson">-0.12%</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-on-surface">GOOGL</span>
              <span className="text-outline">152.30</span>
              <span className="text-growth-emerald">+1.45%</span>
            </div>
          </div>
          {/* Duplicate for loop */}
          <div className="flex gap-12 px-6">
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-on-surface">NVDA</span>
              <span className="text-outline">914.32</span>
              <span className="text-growth-emerald">+2.15%</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-on-surface">AAPL</span>
              <span className="text-outline">189.20</span>
              <span className="text-risk-crimson">-0.42%</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-on-surface">TSLA</span>
              <span className="text-outline">175.40</span>
              <span className="text-growth-emerald">+1.08%</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-on-surface">MSFT</span>
              <span className="text-outline">412.10</span>
              <span className="text-growth-emerald">+0.85%</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-on-surface">AMZN</span>
              <span className="text-outline">178.50</span>
              <span className="text-risk-crimson">-0.12%</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-on-surface">GOOGL</span>
              <span className="text-outline">152.30</span>
              <span className="text-growth-emerald">+1.45%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-margin-desktop py-10 fade-in-stagger select-none" style={{ animationDelay: "300ms" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-outline-variant border border-outline-variant max-w-[1300px] mx-auto overflow-hidden rounded">
          <div className="bg-surface-container-high p-8 flex flex-col items-center text-center radial-glow">
            <span className="font-data-lg text-data-lg text-primary mb-2 font-mono">20,000+</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
              Companies Benchmarked
            </span>
          </div>
          <div className="bg-surface-container-high p-8 flex flex-col items-center text-center radial-glow">
            <span className="font-data-lg text-data-lg text-primary mb-2 font-mono">6</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
              Specialized Agents
            </span>
          </div>
          <div className="bg-surface-container-high p-8 flex flex-col items-center text-center radial-glow">
            <span className="font-data-lg text-data-lg text-primary mb-2 font-mono">480ms</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
              Mean Analysis Latency
            </span>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-margin-desktop py-10 bg-background border-t border-outline-variant/30 select-none fade-in-stagger" style={{ animationDelay: "400ms" }}>
        <div className="max-w-[1300px] mx-auto">
          <h2 className="font-label-caps text-label-caps text-outline uppercase mb-12 text-center tracking-[0.2em]">
            The Pipeline Workflow
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="relative group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 flex items-center justify-center border border-primary text-primary font-mono text-data-md rounded">01</div>
                <div className="h-px flex-1 bg-outline-variant group-hover:bg-primary transition-colors" />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2 font-semibold">Ask</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Input your research hypothesis or target ticker via the prompt search.</p>
            </div>
            <div className="relative group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 flex items-center justify-center border border-outline-variant text-outline font-mono text-data-md rounded group-hover:border-primary group-hover:text-primary transition-all">02</div>
                <div className="h-px flex-1 bg-outline-variant group-hover:bg-primary transition-colors" />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2 font-semibold">Research</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Agents crawl SEC filings, earnings calls, and alternative data sources.</p>
            </div>
            <div className="relative group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 flex items-center justify-center border border-outline-variant text-outline font-mono text-data-md rounded group-hover:border-primary group-hover:text-primary transition-all">03</div>
                <div className="h-px flex-1 bg-outline-variant group-hover:bg-primary transition-colors" />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2 font-semibold">Report</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">A structured PDF analysis and dynamic scorecard are generated.</p>
            </div>
            <div className="relative group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 flex items-center justify-center border border-outline-variant text-outline font-mono text-data-md rounded group-hover:border-primary group-hover:text-primary transition-all">04</div>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2 font-semibold">Approve</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Verify details using integrated audit trails and export to stakeholders.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-margin-desktop py-10 border-t border-outline-variant/30 fade-in-stagger" style={{ animationDelay: "500ms" }}>
        <div className="max-w-[1300px] mx-auto grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-6 min-h-[420px]">
          
          {/* Bento card 1 (Logs console) */}
          <div className="md:col-span-3 md:row-span-2 bg-surface-container border border-outline-variant p-6 rounded flex flex-col justify-between overflow-hidden relative radial-glow">
            <div className="relative z-10">
              <h4 className="font-headline-md text-headline-md text-on-surface mb-2 font-semibold">
                Real-time Data Fusion
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Synchronizing over 200 global data streams per second.
              </p>
            </div>
            <div className="mt-6 flex-grow border border-outline-variant rounded bg-background p-4 font-mono text-[10px] text-primary/80 overflow-hidden min-h-[180px]">
              <div className="space-y-1.5">
                {activeLogs.map((log, idx) => (
                  <div key={idx} className="fade-in-stagger select-text text-[11px] leading-relaxed">
                    <span className="text-primary mr-1">&gt;</span> {log}
                  </div>
                ))}
                <div className="flex items-center gap-1">
                  <span className="text-primary">&gt;</span>
                  <span className="w-1.5 h-3 bg-primary animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Bento card 2 */}
          <div className="md:col-span-3 bg-surface-container border border-outline-variant p-6 rounded flex gap-6 items-center radial-glow select-none">
            <div className="h-20 w-20 bg-primary-container/10 border border-primary/20 rounded flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[42px]">account_tree</span>
            </div>
            <div>
              <h4 className="font-headline-md text-headline-md text-on-surface mb-1 font-semibold">
                Agent Governance
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Full transparency into which agent performed which calculations and notes revisions.
              </p>
            </div>
          </div>

          {/* Bento card 3 */}
          <div className="md:col-span-3 bg-surface-container border border-outline-variant p-6 rounded flex flex-col justify-center radial-glow select-none">
            <div className="flex justify-between items-center mb-3">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                Average Report Quality Score
              </span>
              <span className="font-data-md text-data-md text-primary font-mono font-semibold">98.4%</span>
            </div>
            <div className="w-full bg-surface-container-highest h-2.5 rounded-full overflow-hidden">
              <div className="bg-primary-container h-full w-[98.4%] transition-all duration-1000" />
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}