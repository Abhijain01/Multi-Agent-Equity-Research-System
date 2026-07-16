"use client";

interface Props {
  note: any;
}

export default function MetricsRow({ note }: Props) {
  const fd = note.financial_data || {};
  const price = note.realtime_price?.price || fd.current_price || "—";

  const metrics = [
    { label: "Price", value: price },
    { label: "Market Cap", value: fd.market_cap || "—" },
    { label: "P/E", value: fd.pe_ratio || "—" },
    { label: "ROE", value: fd.roe ? `${(fd.roe * 100).toFixed(1)}%` : "—" },
    { label: "Dividend", value: fd.dividend_yield || "—" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {metrics.map((m, i) => (
        <div key={i} className="bg-[#0b1326] border border-[#334155] rounded-2xl p-5">
          <div className="text-xs text-[#94A3B8]">{m.label}</div>
          <div className="font-mono text-2xl font-semibold mt-1">{m.value}</div>
        </div>
      ))}
    </div>
  );
}