"""
tools/search.py

Tavily Search API wrapper with local caching.

Why this file exists:
The Web Researcher agent (built in Week 2) needs to search the web for
information about companies. Instead of calling Tavily directly inside
the agent, we wrap it here so:
  1. Every call is cached (cache.py) — no repeated API hits during dev
  2. The agent layer never touches API specifics (keys, response shape)
  3. This file can be unit tested in isolation (tests/test_tools.py, Week 3)

Usage:
    from alphaagents.tools.search import search

    results = search("Reliance Industries Q4 results")
    for r in results:
        print(r["title"], r["url"])
"""

import os
from tavily import TavilyClient
from dotenv import load_dotenv

from alphaagents.utils import cache

load_dotenv()

_client = None


def _get_client() -> TavilyClient:
    """Lazy-init the Tavily client so importing this module doesn't require a key."""
    global _client
    if _client is None:
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            raise ValueError(
                "TAVILY_API_KEY not found in environment. "
                "Add it to your .env file."
            )
        _client = TavilyClient(api_key=api_key)
    return _client


def search(query: str, max_results: int = 5) -> list[dict]:
    """
    Search the web via Tavily, with local caching.

    Args:
        query: the search query string
        max_results: how many results to return (default 5)

    Returns:
        A list of dicts, each shaped:
            {
                "title": str,
                "url": str,
                "content": str,   # short summary/snippet from Tavily
                "score": float,   # Tavily's relevance score
            }
    """
    params = {"query": query, "max_results": max_results}

    # 1. Check cache first
    cached = cache.get("tavily", params)
    if cached is not None:
        return cached

    # 2. Cache miss — call the real API
    client = _get_client()
    response = client.search(
        query=query,
        max_results=max_results,
        search_depth="basic",
    )

    # 3. Normalise the response into our standard shape
    results = []
    for item in response.get("results", []):
        results.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "content": item.get("content", ""),
            "score": item.get("score", 0.0),
        })

    # 4. Save to cache before returning
    cache.set("tavily", params, results)

    return results


if __name__ == "__main__":
    # Quick manual test — run with: python -m alphaagents.tools.search
    results = search("Reliance Industries Q4 results 2026")
    print(f"\nGot {len(results)} results:\n")
    for i, r in enumerate(results, 1):
        print(f"{i}. {r['title']}")
        print(f"   {r['url']}")
        print(f"   score: {r['score']}")
        print()