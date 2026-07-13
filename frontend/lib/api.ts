const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = {
  async getHistory() {
    const res = await fetch(`${API}/api/research/history`);
    return res.json();
  },

  async approve(noteId: string) {
    const res = await fetch(`${API}/api/research/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note_id: noteId }),
    });
    return res.json();
  },

  async scoreNote(noteId: string) {
    const res = await fetch(`${API}/api/eval/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note_id: noteId }),
    });
    return res.json();
  },

  getPdfUrl(noteId: string) {
    return `${API}/api/research/${noteId}/pdf`;
  },

  getResearchUrl() {
    return `${API}/api/research/run`;
  },

  getComparisonUrl() {
    return `${API}/api/comparison/run`;
  },

  getReviseUrl() {
    return `${API}/api/research/revise`;
  },

  async getLiveQuote(ticker: string): Promise<LiveQuote> {
    const res = await fetch(`${API}/api/market/quote?ticker=${encodeURIComponent(ticker)}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload?.detail || `Live quote request failed (${res.status})`);
    }
    return res.json();
  },
};

export interface SSEEvent {
  event: string;
  agent?: string;
  message?: string;
  company?: string;
  ticker?: string;
  note_id?: string;
  note?: NoteData;
  passed?: boolean;
  needs_review?: boolean;
  [key: string]: any;
}

export interface NoteData {
  id: string;
  query: string;
  company: string;
  ticker: string;
  note: string;
  needs_review: boolean;
  critique: string;
  revision_count: number;
  approved: boolean;
  created_at: string;
  financial_data?: {
    current_price?: number;
    market_cap?: string;
    pe_ratio?: number;
    roe?: string;
    currency?: string;
    currency_symbol?: string;
    dividend_yield?: string;
    net_profit_margin?: string;
  };
  sentiment?: string;
}

export interface EvalScores {
  note_id: string;
  factuality: number;
  completeness: number;
  actionability: number;
  overall: number;
  reasoning: string;
}

export interface LiveQuote {
  ticker: string;
  price: number;
  currency: string;
  updated_at?: number | null;
}