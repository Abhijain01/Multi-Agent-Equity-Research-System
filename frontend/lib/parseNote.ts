// frontend/lib/parseNote.ts
// Parses the markdown research note produced by alphaagents/agents/writer.py
// into the 6 named sections, without assuming any structure beyond the
// "## Heading" markers the writer always emits.

export interface ParsedNote {
  investmentThesis: string;
  financialSummary: string;
  recentDevelopments: string;
  keyRisks: string;
  comparableCompanies: string;
  recommendation: string;
}

const SECTION_KEYS: Record<string, keyof ParsedNote> = {
  "investment thesis": "investmentThesis",
  "financial summary": "financialSummary",
  "recent developments": "recentDevelopments",
  "key risks": "keyRisks",
  "comparable companies": "comparableCompanies",
  "recommendation": "recommendation",
};

export function parseNote(markdown: string): ParsedNote {
  const result: ParsedNote = {
    investmentThesis: "",
    financialSummary: "",
    recentDevelopments: "",
    keyRisks: "",
    comparableCompanies: "",
    recommendation: "",
  };
  if (!markdown) return result;

  const parts = markdown.split(/\n##\s+/).slice(1); // drop the "# Company — ..." title chunk
  for (const part of parts) {
    const newlineIdx = part.indexOf("\n");
    const heading = (newlineIdx === -1 ? part : part.slice(0, newlineIdx)).trim().toLowerCase();
    const body = (newlineIdx === -1 ? "" : part.slice(newlineIdx + 1)).split("\n---")[0].trim();
    const key = SECTION_KEYS[heading];
    if (key) result[key] = body;
  }
  return result;
}

export interface ParsedRisk {
  name: string;
  detail: string;
}

/**
 * The writer's Key Risks field is formatted as free text following the
 * pattern: "RISK 1: [Name] — [explanation]. RISK 2: ..." (see
 * alphaagents/agents/writer.py ResearchNote.key_risks description).
 * This is a best-effort parse — if the model didn't follow the format
 * exactly, we fall back to showing the raw text as a single card.
 */
export function parseRisks(risksText: string): ParsedRisk[] {
  if (!risksText) return [];

  const matches = [...risksText.matchAll(/RISK\s*\d+\s*:\s*([^—\-]+)[—\-]\s*([\s\S]+?)(?=(?:RISK\s*\d+\s*:)|$)/gi)];
  if (matches.length === 0) {
    return [{ name: "Key Risk", detail: risksText }];
  }
  return matches.map((m) => ({
    name: m[1].trim(),
    detail: m[2].trim(),
  }));
}