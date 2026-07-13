const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

export function getCurrencySymbol(currency?: string, fallbackTicker?: string): string {
  if (currency) {
    const mapped = CURRENCY_SYMBOL_MAP[currency.toUpperCase()];
    if (mapped) return mapped;
  }

  if (fallbackTicker?.toUpperCase().endsWith(".NS")) return "₹";
  return "$";
}

export function formatLivePrice(
  value: number | undefined,
  currency?: string,
  ticker?: string,
): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "N/A";

  const symbol = getCurrencySymbol(currency, ticker);
  return `${symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
