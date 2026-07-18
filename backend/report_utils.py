"""
backend/report_utils.py

Shared helpers for assembling the report payload sent to the frontend —
used by both /api/research/run and /api/research/revise so the two
endpoints produce an identically-shaped note_data dict.

Nothing here calls an LLM or an external API — it only reshapes data
that the agents already gathered in `state`.
"""

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