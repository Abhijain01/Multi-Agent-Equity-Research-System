"""
backend/report_utils.py

Shared helpers for assembling the report payload sent to the frontend —
used by both /api/research/run and /api/research/revise so the two
endpoints produce an identically-shaped note_data dict.

Nothing here calls an LLM or an external API — it only reshapes data
that the agents already gathered in `state`.
"""

import re
from urllib.parse import urlparse

# Models actually used by the pipeline (see agents/*.py _get_llm() calls).
# Kept here as a single source of truth for the report footer, instead of
# hardcoding this string in multiple route files.
LLM_MODELS_USED = "llama-3.3-70b-versatile"
DATA_PROVIDERS_USED = "Yahoo Finance + Tavily"


def _domain(url: str) -> str:
    try:
        netloc = urlparse(url).netloc
        return netloc.replace("www.", "") or url
    except Exception:
        return url


def build_financial_data_payload(fd: dict) -> dict:
    """
    Expand the financial_data fields sent to the frontend to include the
    full metrics set the scorecard/report UI needs — all real fields from
    alphaagents/tools/finance.py, nothing computed client-side.
    """
    if not fd:
        return {}
    fields = [
        "company_name", "short_name", "sector", "industry", "exchange", "website", "currency",
        "current_price", "market_cap", "market_cap_raw",
        "pe_ratio", "forward_pe", "price_to_book", "peg_ratio", "ev_to_ebitda", "ev_to_revenue",
        "dividend_yield", "beta", "current_ratio",
        "gross_margin", "operating_margin", "net_profit_margin", "roe", "roa",
        "revenue_growth_yoy", "earnings_growth_yoy",
        "debt_to_equity", "book_value_per_share",
        "eps_trailing", "eps_forward",
        "analyst_target_price", "analyst_count",
        "one_year_return_pct", "ytd_return_pct",
        "data_warning",
    ]
    return {k: fd.get(k) for k in fields}


def build_sources(web_results: list[dict], news_events: list[dict]) -> list[dict]:
    """
    Deduplicated, numbered source list for the "Sources & citations" panel.
    Pulled from the same URLs the writer was given — nothing new fetched.
    """
    seen = set()
    sources = []
    for item in web_results or []:
        url = item.get("url")
        if not url or url in seen:
            continue
        seen.add(url)
        sources.append({"domain": _domain(url), "title": item.get("title", url), "url": url})
    for event in news_events or []:
        url = event.get("source_url")
        if not url or url in seen:
            continue
        seen.add(url)
        sources.append({"domain": _domain(url), "title": event.get("headline", url), "url": url})
    return sources


def build_recent_news(news_events: list[dict]) -> list[dict]:
    """Recent news cards — straight from news_agent's key_events, no reshaping of content."""
    cards = []
    for event in news_events or []:
        url = event.get("source_url", "")
        cards.append({
            "title": event.get("headline", ""),
            "domain": _domain(url) if url else "",
            "url": url,
            "excerpt": event.get("significance", ""),
            "published_at": event.get("published_at", ""),
        })
    return cards


def linkify_citations(note_text: str, sources: list[dict]) -> tuple[str, list[dict]]:
    """
    The writer is instructed to cite claims as literal `[Source: <url>]` text
    (needed so the critic can verify citations exist) — but a raw URL inline
    mid-sentence reads like debug output, not a research note.

    This converts every `[Source: <url>]` (or comma-separated multiples in
    one bracket) into a clean numbered marker like `[1]` or `[2][3]`, matching
    that URL's position in `sources` — the SAME list already rendered in the
    "Sources & Citations" panel, so numbering stays consistent between the
    prose and the reference list instead of creating a second, disconnected
    list.

    Any cited URL not already in `sources` (e.g. the model cited something
    outside web_results/news_events) is appended to the returned sources list,
    so a numbered marker in the prose always resolves to something visible in
    the reference list — never a number pointing at nothing.

    Returns:
        (linkified_text, expanded_sources) — use both; don't reuse the
        original `sources` list after calling this.
    """
    sources = list(sources)  # don't mutate the caller's list
    url_to_index = {s["url"]: i + 1 for i, s in enumerate(sources)}

    def repl(match: re.Match) -> str:
        raw = match.group(1).strip()
        urls = [u.strip().rstrip(".,;") for u in raw.split(",") if u.strip()]
        indices = []
        for url in urls:
            if not url:
                continue
            if url not in url_to_index:
                sources.append({"domain": _domain(url), "title": url, "url": url})
                url_to_index[url] = len(sources)
            indices.append(url_to_index[url])
        if not indices:
            return ""  # malformed citation with no parseable URL — drop it silently
        return "".join(f"[{i}]" for i in sorted(set(indices)))

    linkified = re.sub(r"\[Source:\s*([^\]]+)\]", repl, note_text, flags=re.IGNORECASE)
    return linkified, sources