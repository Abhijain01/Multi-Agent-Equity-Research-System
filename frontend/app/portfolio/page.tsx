"use client";

import { useEffect } from "react";

export default function PortfolioPage() {
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

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-lg flex flex-col pt-24 select-none">
      <div className="max-w-[1200px] w-full mx-auto px-margin-desktop pb-32 space-y-8 fade-in-stagger">
        
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-outline-variant" />
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest text-[11px]">
              Institutional Suite
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold">
            Portfolio Management
          </h1>
        </div>

        {/* Content Panel */}
        <div className="bg-surface-container border border-outline-variant rounded p-8 radial-glow max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary text-[28px]">
              folder_shared
            </span>
            <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">
              System Interface Offline
            </h2>
          </div>
          <p className="text-on-surface-variant text-body-sm leading-relaxed mb-6">
            Institutional portfolio tracking and direct ledger integrations are currently under development. This dashboard serves as an empty workspace placeholder to preserve header routing coherence.
          </p>
          <div className="p-4 bg-surface-container-high border border-outline-variant/30 rounded flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
              info
            </span>
            <p className="text-body-sm text-outline leading-relaxed font-sans">
              In the meantime, you can navigate to the <a href="/research" className="text-primary hover:underline font-semibold">Research Hub</a> to compile qualitative multi-agent files or compare indices under <a href="/comparison" className="text-primary hover:underline font-semibold">benchmarking comparisons</a>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}