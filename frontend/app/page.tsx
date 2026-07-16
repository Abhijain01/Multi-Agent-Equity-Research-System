"use client";

import { useEffect, useState } from "react";
import { marketApi } from "@/lib/market";

const LIVE_TICKERS = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS"];

export default function FinPilotHome() {
  const [liveData, setLiveData] = useState<any[]>([]);
  const [query, setQuery] = useState("");

  const loadLiveData = async () => {
    const results = await Promise.all(
      LIVE_TICKERS.map((t) => marketApi.getLiveData(t))
    );
    setLiveData(results.filter(Boolean));
  };

  useEffect(() => {
    loadLiveData();
    const interval = setInterval(loadLiveData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleResearch = () => {
    if (!query.trim()) return alert("Please enter a research query");
    alert(`Research started for: ${query}`);
    // TODO: Connect to /api/research/run
  };

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd]">
      {/* Navbar */}
      <nav className="border-b border-[#334155] bg-[#060e20]/95 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#3B82F6] rounded-2xl flex items-center justify-center">
              <span className="font-bold text-white text-xl">FP</span>
            </div>
            <span className="font-bold text-3xl tracking-tight">FinPilot</span>
          </div>

          <div className="flex items-center gap-9 text-sm">
            <a href="#live" className="hover:text-[#adc6ff]">Live Data</a>
            <a href="/comparison" className="hover:text-[#adc6ff]">Comparison</a>
            <a href="/charts" className="hover:text-[#adc6ff]">Charts</a>
          </div>

          <button 
            onClick={handleResearch}
            className="px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563eb] rounded-2xl text-sm font-semibold"
          >
            Start Research
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-block px-4 py-1 text-xs tracking-[2px] bg-[#131b2e] border border-[#334155] rounded-full mb-6">
          INSTITUTIONAL GRADE RESEARCH
        </div>

        <h1 className="text-7xl font-bold tracking-tighter leading-none mb-6">
          Structural Discipline.<br />
          <span className="text-[#94A3B8]">Indian Equities.</span>
        </h1>
        
        <p className="text-xl text-[#94A3B8] max-w-md mx-auto">
          Multi-agent AI that delivers deep, cited research in minutes.
        </p>
      </div>

      {/* Live Market Data */}
      <div id="live" className="max-w-7xl mx-auto px-8 pb-20">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-4xl font-semibold">Live Market Data</h2>
            <p className="text-[#94A3B8]">Real-time via Alpha Vantage</p>
          </div>
          <button 
            onClick={loadLiveData}
            className="px-5 py-2 text-sm border border-[#334155] rounded-xl hover:bg-[#131b2e]"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {liveData.map((stock, index) => (
            <div key={index} className="stock-card bg-[#131b2e] border border-[#334155] rounded-3xl p-6">
              <div className="flex justify-between">
                <div>
                  <div className="font-mono text-2xl font-semibold">{stock.realtime?.ticker}</div>
                  <div className="text-sm text-[#94A3B8] mt-1">{stock.fundamentals?.company_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-3xl font-semibold">₹{stock.realtime?.price}</div>
                  <div className={stock.realtime?.change > 0 ? "text-[#10B981] text-sm" : "text-[#EF4444] text-sm"}>
                    {stock.realtime?.change} ({stock.realtime?.change_percent})
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Research Section */}
      <div className="max-w-4xl mx-auto px-8 pb-24">
        <div className="glass-card rounded-3xl p-10 border border-[#334155]">
          <h3 className="text-3xl font-semibold mb-6">Launch Research</h3>
          <div className="flex gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Analyse Reliance Industries for a retail investor"
              className="flex-1 bg-[#060e20] border border-[#334155] rounded-2xl px-6 py-4 text-lg"
            />
            <button 
              onClick={handleResearch}
              className="px-10 bg-[#3B82F6] hover:bg-[#2563eb] rounded-2xl font-semibold"
            >
              Dispatch Agents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}