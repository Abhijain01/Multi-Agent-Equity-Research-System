"""
tools/news.py

NewsAPI wrapper for fetching recent company news, with local caching.

Why this file exists:
The News Agent (Week 2) needs recent news about a company to extract
sentiment and key events. We wrap NewsAPI here so:
  1. Every call is cached — NewsAPI free tier is only 100 req/day
  2. The agent layer gets a clean list of dicts, not a raw API response
  3. Date filtering is handled here, not scattered across agents

Free tier limits:
  - 100 requests/day
  - Articles up to 1 month old only
  - 100 articles per request max

Usage:
    from alphaagents.tools.news import get_news

    articles = get_news("Reliance Industries", days=7)
    for a in articles:
        print(a["title"], a["published_at"])

IMPORTANT: Set NEWS_API_KEY in your .env file.
Get a free key at https://newsapi.org
"""

import os
from datetime import datetime, timedelta
from newsapi import NewsApiClient
from dotenv import load_dotenv

from alphaagents.utils import cache

load_dotenv()

_client = None


def _get_client() -> NewsApiClient:
    """Lazy-init the NewsAPI client."""
    global _client
    if _client is None:
        api_key = os.getenv("NEWS_API_KEY")
        if not api_key:
            raise ValueError(
                "NEWS_API_KEY not found in environment. "
                "Get a free key at https://newsapi.org and add it to your .env file."
            )
        _client = NewsApiClient(api_key=api_key)
    return _client


def _build_query(company: str) -> str:
    """
    Build a search query that reduces noise.
    Wrapping in quotes finds exact phrase matches.
    Adding 'stock OR shares OR NSE OR BSE' keeps results finance-focused.
    """
    return f'"{company}" AND (stock OR shares OR NSE OR BSE OR earnings OR results)'


def get_news(company: str, days: int = 7, max_articles: int = 10) -> list[dict]:
    """
    Fetch recent news articles about a company, with caching.

    Args:
        company: company name to search for (e.g. "Reliance Industries")
        days: how many days back to search (default 7, max ~30 on free tier)
        max_articles: max number of articles to return (default 10)

    Returns:
        A list of dicts, each shaped:
            {
                "title": str,
                "source": str,          # publication name
                "published_at": str,    # ISO datetime string
                "description": str,     # short article description
                "url": str,
            }
        Returns empty list if no articles found or API fails.
    """
    params = {"company": company, "days": days, "max_articles": max_articles}

    # 1. Check cache first
    cached = cache.get("newsapi", params)
    if cached is not None:
        return cached

    # 2. Cache miss — call the real API
    print(f"[NEWS] Fetching news for '{company}' (last {days} days)...")

    # Calculate date range
    to_date = datetime.utcnow()
    from_date = to_date - timedelta(days=days)

    # NewsAPI free tier caps at ~1 month old
    # Clamp to 29 days to be safe
    if days > 29:
        print("[NEWS] Warning: NewsAPI free tier only supports up to ~30 days. Clamping to 29 days.")
        from_date = to_date - timedelta(days=29)

    from_str = from_date.strftime("%Y-%m-%d")
    to_str = to_date.strftime("%Y-%m-%d")

    try:
        client = _get_client()
        response = client.get_everything(
            q=_build_query(company),
            language="en",
            sort_by="publishedAt",      # most recent first
            from_param=from_str,
            to=to_str,
            page_size=min(max_articles, 100),  # API max is 100
        )
    except Exception as e:
        print(f"[NEWS] API call failed: {e}")
        # Return empty list + cache it so we don't keep hitting the API
        empty = []
        cache.set("newsapi", params, empty)
        return empty

    # 3. Normalise the response
    articles = []
    for item in response.get("articles", []):
        # Skip articles with [Removed] content (NewsAPI placeholder for deleted articles)
        title = item.get("title", "") or ""
        if "[Removed]" in title:
            continue

        articles.append({
            "title": title,
            "source": item.get("source", {}).get("name", "Unknown"),
            "published_at": item.get("publishedAt", ""),
            "description": item.get("description", "") or "",
            "url": item.get("url", ""),
        })

        if len(articles) >= max_articles:
            break

    # 4. Save to cache before returning
    cache.set("newsapi", params, articles)

    return articles


def get_news_simple(company: str) -> list[dict]:
    """
    Convenience wrapper using sensible defaults.
    Same as get_news(company, days=7, max_articles=10).
    Used by the News Agent.
    """
    return get_news(company, days=7, max_articles=10)


if __name__ == "__main__":
    # Quick manual test — run with: python -m alphaagents.tools.news
    company = "Reliance Industries"
    print(f"Fetching news for: {company}\n")

    articles = get_news(company, days=7)

    if not articles:
        print("No articles found. Check your NEWS_API_KEY and that it's in .env")
    else:
        print(f"Got {len(articles)} articles:\n")
        for i, a in enumerate(articles, 1):
            print(f"{i}. {a['title']}")
            print(f"   Source: {a['source']}")
            print(f"   Published: {a['published_at']}")
            print(f"   URL: {a['url']}")
            print()

    print("✅ Run again to verify CACHE HIT")