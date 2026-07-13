"use client";
import { NoteData } from "@/lib/api";
import { useLiveQuote } from "@/lib/live-quote";
import { formatLivePrice } from "@/lib/market";

interface Props {
  note: NoteData;
}

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  colorClass?: string;
  glowClass?: string;
  icon?: string;
}

function MetricCard({ label, value, sub, colorClass = "text-on-surface", glowClass = "", icon }: MetricCardProps) {
  return (
    <div className={`relative overflow-hidden bg-[#131b2e]/65 border border-[#334155]/70 rounded-xl px-4 py-3 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:border-[#adc6ff]/40 glass-card flex flex-col justify-between ${glowClass}`}>
      {/* Background radial highlight */}
      <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-[#3B82F6]/5 blur-xl pointer-events-none" />
      
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <p className="text-[9px] text-[#94A3B8] uppercase font-bold tracking-wider font-display">
            {label}
          </p>
          {icon && <span className="text-xs opacity-80">{icon}</span>}
        </div>
        <p className={`text-[17px] font-black tracking-tight font-display ${colorClass}`}>
          {value}
        </p>
      </div>
      {sub && (
        <p className="text-[9px] text-[#8c909f] font-semibold mt-1 font-mono uppercase tracking-wide">
          {sub}
        </p>
      )}
    </div>
  );
}

export default function MetricsRow({ note }: Props) {
  const fd = note.financial_data || {};
  const liveQuote = useLiveQuote(note);
  const price = formatLivePrice(
    liveQuote.price ?? undefined,
    liveQuote.currency || fd.currency,
    note.ticker,
  );
  const pe = fd.pe_ratio ? `${fd.pe_ratio}×` : "N/A";
  const roe = fd.roe || "N/A";
  const sentiment = note.sentiment || "neutral";
  
  const getSentimentDetails = (sent: string) => {
    const s = sent.toLowerCase();
    if (s === "positive") return { label: "Bullish", color: "text-[#10B981]", glow: "shadow-green-glow border-[#10B981]/20", icon: "📈", sub: "Web & News consensus" };
    if (s === "negative") return { label: "Bearish", color: "text-[#EF4444]", glow: "shadow-red-glow border-[#EF4444]/20", icon: "📉", sub: "Web & News consensus" };
    return { label: "Neutral", color: "text-[#F59E0B]", glow: "shadow-accent-glow border-[#F59E0B]/20", icon: "⚖️", sub: "Web & News consensus" };
  };

  const sentInfo = getSentimentDetails(sentiment);

  return (
    <div className="grid grid-cols-5 gap-3 mb-6 fade-in-up">
      <MetricCard
        label="Price"
        value={price}
        sub="Live Market Feed"
        icon="💰"
      />
      <MetricCard
        label="Market Cap"
        value={fd.market_cap || "N/A"}
        sub="Equity Valuation"
        icon="💎"
      />
      <MetricCard
        label="PE Ratio"
        value={pe}
        sub="Trailing Twelve Months"
        icon="📊"
      />
      <MetricCard
        label="ROE"
        value={roe}
        sub="Return on Equity"
        colorClass="text-green"
        icon="⚡"
      />
      <MetricCard
        label="Sentiment"
        value={sentInfo.label}
        sub={sentInfo.sub}
        colorClass={sentInfo.color}
        glowClass={sentInfo.glow}
        icon={sentInfo.icon}
      />
    </div>
  );
}