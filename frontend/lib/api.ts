// frontend/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface NoteData {
  id: string;
  query: string;
  company: string;
  ticker: string;
  note: string;
  approved: boolean;
  created_at: string;
  realtime_price?: any;
  financial_data?: any;
  revision_count?: number;
  sentiment?: string;
}

export interface EvalScores {
  factuality: number;
  completeness: number;
  actionability: number;
}

export const api = {
  // Research Endpoints
  getResearchUrl: () => `${API_BASE}/api/research/run`,
  getReviseUrl: () => `${API_BASE}/api/research/revise`,

  getHistory: async (): Promise<{ notes: NoteData[] }> => {
    const res = await fetch(`${API_BASE}/api/research/history`);
    return res.json();
  },

  approveNote: async (noteId: string) => {
    const res = await fetch(`${API_BASE}/api/research/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note_id: noteId }),
    });
    return res.json();
  },

  // Evaluation
  scoreNote: async (noteId: string): Promise<EvalScores> => {
    const res = await fetch(`${API_BASE}/api/eval/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note_id: noteId }),
    });
    return res.json();
  },

  // Market Data
  getLiveMarketData: async (ticker: string) => {
    const res = await fetch(`${API_BASE}/api/market/live/${ticker}`);
    return res.json();
  },

  getPriceOnly: async (ticker: string) => {
    const res = await fetch(`${API_BASE}/api/market/price/${ticker}`);
    return res.json();
  },
};