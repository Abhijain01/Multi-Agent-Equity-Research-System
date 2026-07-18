// frontend/lib/market.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface LiveStockData {
  realtime: {
    ticker: string;
    price: number;
    change: number;
    change_percent: string;
    volume: number;
    day_high?: number | null;
    day_low?: number | null;
    source: string;
    timestamp: string;
  };
  fundamentals: any;
  historical?: {
    dates: string[];
    close: number[];
    volume: number[];
  };
}

export const marketApi = {
  async getLiveData(ticker: string): Promise<LiveStockData | null> {
    try {
      const res = await fetch(`${API_BASE}/api/market/live/${ticker}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getPriceOnly(ticker: string) {
    try {
      const res = await fetch(`${API_BASE}/api/market/price/${ticker}`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async getQuote(ticker: string) {
    try {
      const res = await fetch(`${API_BASE}/api/market/quote/${ticker}`);
      return await res.json();
    } catch {
      return null;
    }
  },
};