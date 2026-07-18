// frontend/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface CategoryScore {
  score: number;
  weight: number;
  analysis: string;
  pros: string[];
  cons: string[];
}

export interface ScoreCard {
  overall_score: number;
  verdict: "INVEST" | "HOLD" | "AVOID";
  confidence_pct: number;
  fair_value_view: string;
  time_horizon: string;
  key_strengths: string[];
  catalysts_to_watch: string[];
  weights: Record<string, number>;
  categories: {
    business_quality: CategoryScore;
    financial_health: CategoryScore;
    valuation: CategoryScore;
    growth: CategoryScore;
    competitive_moat: CategoryScore;
    risk_profile: CategoryScore;
  };
}

export interface SourceItem {
  domain: string;
  title: string;
  url: string;
}

export interface NewsCardItem {
  title: string;
  domain: string;
  url: string;
  excerpt: string;
  published_at: string;
}

export interface GenerationMeta {
  duration_seconds: number;
  llm_models: string;
  data_providers: string;
}

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
  needs_review?: boolean;
  critique?: string;
  scorecard?: ScoreCard | null;
  sources?: SourceItem[];
  recent_news?: NewsCardItem[];
  generation_meta?: GenerationMeta;
}

export interface EvalScores {
  factuality: number;
  completeness: number;
  actionability: number;
  overall: number;
  reasoning: string;
}

export const api = {
  // Research Endpoints
  getResearchUrl: () => `${API_BASE}/api/research/run`,
  getReviseUrl: () => `${API_BASE}/api/research/revise`,
  getPdfUrl: (noteId: string) => `${API_BASE}/api/research/${noteId}/pdf`,
  getJsonUrl: (noteId: string) => `${API_BASE}/api/research/${noteId}/json`,

  // Comparison
  getComparisonUrl: () => `${API_BASE}/api/comparison/run`,

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