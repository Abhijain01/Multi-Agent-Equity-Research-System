// frontend/lib/live-quote.ts
import { marketApi, LiveStockData } from "./market";

export async function fetchLiveQuotes(tickers: string[]): Promise<LiveStockData[]> {
  const results = await Promise.all(
    tickers.map(async (ticker) => {
      const data = await marketApi.getLiveData(ticker);
      return data ? { ticker, ...data } : null;
    })
  );
  return results.filter(Boolean) as LiveStockData[];
}