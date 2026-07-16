"use client";

import { useState } from "react";
import { marketApi } from "@/lib/market";

export default function ChartsPage() {
  const [ticker, setTicker] = useState("RELIANCE.NS");
  const [data, setData] = useState<any>(null);

  const loadChart = async () => {
    const result = await marketApi.getLiveData(ticker);
    setData(result);
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <h1 className="text-5xl font-bold mb-8">Interactive Charts</h1>
      
      <div className="flex gap-4 mb-8">
        <input 
          value={ticker} 
          onChange={e => setTicker(e.target.value)} 
          className="bg-[#131b2e] border border-[#334155] px-5 py-3 rounded-xl w-80" 
          placeholder="RELIANCE.NS" 
        />
        <button onClick={loadChart} className="bg-[#3B82F6] px-8 rounded-xl font-semibold">Load Chart</button>
      </div>

      {data && (
        <div className="bg-[#131b2e] p-8 rounded-3xl border border-[#334155]">
          <h3 className="text-2xl mb-4">Live Data for {ticker}</h3>
          <pre className="text-sm text-[#94A3B8]">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}