"use client";

interface Props {
  fd: any;
  refreshedAt?: string;
}

const CURRENCY_SYMBOL: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

function fmtNum(v: any, decimals = 2): string {
  if (v === null || v === undefined || v === "N/A") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toFixed(decimals);
}

function fmtPct(v: any): { text: string; positive: boolean | null } {
  if (v === null || v === undefined) return { text: "—", positive: null };
  if (typeof v === "string") {
    const n = parseFloat(v.replace("%", ""));
    return { text: v, positive: Number.isNaN(n) ? null : n >= 0 };
  }
  const n = Number(v);
  if (Number.isNaN(n)) return { text: "—", positive: null };
  return { text: `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`, positive: n >= 0 };
}

export default function FundamentalsGrid({ fd, refreshedAt }: Props) {
  const currency = CURRENCY_SYMBOL[fd?.currency] || (fd?.currency ? `${fd.currency} ` : "₹");
  const oneYear = fmtPct(fd?.one_year_return_pct);
  const ytd = fmtPct(fd?.ytd_return_pct);
  const revGrowth = fmtPct(fd?.revenue_growth_yoy);

  const tiles: { label: string; value: string; positive?: boolean | null }[] = [
    { label: "MKT CAP", value: fd?.market_cap || "—" },
    { label: "PRICE", value: fd?.current_price ? `${currency}${fmtNum(fd.current_price)}` : "—" },
    { label: "1Y RETURN", value: oneYear.text, positive: oneYear.positive },
    { label: "YTD", value: ytd.text, positive: ytd.positive },
    { label: "P/E (TTM)", value: fmtNum(fd?.pe_ratio) },
    { label: "FWD P/E", value: fmtNum(fd?.forward_pe) },
    { label: "P/B", value: fmtNum(fd?.price_to_book) },
    { label: "PEG", value: fmtNum(fd?.peg_ratio) },
    { label: "EV/EBITDA", value: fmtNum(fd?.ev_to_ebitda) },
    { label: "DIV YIELD", value: fd?.dividend_yield || "—" },
    { label: "REV GROWTH", value: revGrowth.text, positive: revGrowth.positive },
    { label: "GROSS MGN", value: fd?.gross_margin || "—" },
    { label: "OP MGN", value: fd?.operating_margin || "—" },
    { label: "NET MGN", value: fd?.net_profit_margin || "—" },
    { label: "ROE", value: fd?.roe || "—" },
    { label: "DEBT/EQ", value: fmtNum(fd?.debt_to_equity), positive: fd?.debt_to_equity != null ? fd.debt_to_equity < 1 : null },
    { label: "CURR RATIO", value: fmtNum(fd?.current_ratio), positive: fd?.current_ratio != null ? fd.current_ratio >= 1 : null },
    { label: "BETA", value: fmtNum(fd?.beta) },
    { label: "ANALYST TGT", value: fd?.analyst_target_price ? fmtNum(fd.analyst_target_price) : "—" },
    { label: "ANALYSTS", value: fd?.analyst_count ?? "—" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <h3 className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
          Live Fundamentals
        </h3>
        {refreshedAt && (
          <span className="font-data-sm text-data-sm text-outline">
            {fd?.currency || "USD"} • Refreshed {refreshedAt}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-[1px] bg-outline-variant border border-outline-variant overflow-hidden">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="bg-surface-container p-4 hover:bg-surface-container-high transition-colors duration-150 select-none group"
          >
            <p className="font-label-caps text-[10px] text-outline mb-1 uppercase tracking-wider">
              {tile.label}
            </p>
            <p
              className={`font-data-md text-data-md font-semibold font-mono ${
                tile.positive === true
                  ? "text-growth-emerald"
                  : tile.positive === false
                  ? "text-risk-crimson"
                  : "text-on-surface group-hover:text-primary transition-colors"
              }`}
            >
              {tile.value}
            </p>
          </div>
        ))}
      </div>
      {fd?.data_warning && (
        <p className="text-label-sm text-warning-amber italic font-sans">⚠ {fd.data_warning}</p>
      )}
    </div>
  );
}