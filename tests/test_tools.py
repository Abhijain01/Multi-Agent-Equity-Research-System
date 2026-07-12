"""
tests/test_tools.py
Unit tests for all three tool wrappers.
Tests cache hit/miss behaviour without hitting real APIs.

Run: pytest tests/test_tools.py -v
"""

import pytest
import json
from pathlib import Path
from unittest.mock import patch, MagicMock


# ── Cache tests ───────────────────────────────────────────────────────────────

def test_cache_miss_returns_none():
    from alphaagents.utils.cache import get, clear
    clear("test_tool")
    result = get("test_tool", {"key": "unique_test_value_xyz"})
    assert result is None


def test_cache_set_and_get():
    from alphaagents.utils.cache import get, set as cache_set, clear
    clear("test_tool")
    params = {"key": "test_cache_roundtrip"}
    data = [{"title": "Test", "url": "https://example.com"}]
    cache_set("test_tool", params, data)
    result = get("test_tool", params)
    assert result == data


def test_cache_different_params_different_files():
    from alphaagents.utils.cache import get, set as cache_set, clear
    clear("test_tool")
    cache_set("test_tool", {"q": "apple"},  [{"title": "Apple"}])
    cache_set("test_tool", {"q": "banana"}, [{"title": "Banana"}])
    assert get("test_tool", {"q": "apple"})[0]["title"] == "Apple"
    assert get("test_tool", {"q": "banana"})[0]["title"] == "Banana"


def test_cache_clear():
    from alphaagents.utils.cache import get, set as cache_set, clear
    cache_set("test_tool", {"k": "v"}, {"data": 1})
    clear("test_tool")
    assert get("test_tool", {"k": "v"}) is None


# ── Tavily search tool tests ───────────────────────────────────────────────────

def test_search_returns_list_of_dicts():
    """Search returns a list where each item has required keys."""
    from alphaagents.utils.cache import set as cache_set
    fake_results = [
        {"title": "Test Article", "url": "https://example.com", "content": "Some content", "score": 0.9},
        {"title": "Another Article", "url": "https://example2.com", "content": "More content", "score": 0.8},
    ]
    params = {"query": "HDFC Bank test query", "max_results": 5}
    cache_set("tavily", params, fake_results)

    from alphaagents.tools.search import search
    results = search("HDFC Bank test query", max_results=5)

    assert isinstance(results, list)
    assert len(results) == 2
    for r in results:
        assert "title" in r
        assert "url" in r
        assert "content" in r
        assert "score" in r


def test_search_cache_hit_on_second_call():
    """Second call with same params hits cache, not API."""
    from alphaagents.utils.cache import set as cache_set
    params = {"query": "cache hit test query", "max_results": 5}
    cache_set("tavily", params, [{"title": "Cached", "url": "x", "content": "y", "score": 1.0}])

    with patch("alphaagents.tools.search._get_client") as mock_client:
        from alphaagents.tools.search import search
        results = search("cache hit test query", max_results=5)
        # Client should NOT be called — cache handles it
        mock_client.assert_not_called()

    assert results[0]["title"] == "Cached"


# ── yfinance finance tool tests ────────────────────────────────────────────────

def test_get_fundamentals_returns_dict():
    """get_fundamentals returns a dict with expected keys."""
    from alphaagents.utils.cache import set as cache_set
    fake_data = {
        "ticker": "HDFCBANK.NS",
        "company_name": "HDFC Bank Limited",
        "current_price": 1842.5,
        "market_cap": "₹13.9T",
        "pe_ratio": 18.4,
        "roe": "16.8%",
        "net_profit_margin": "22.1%",
    }
    cache_set("yfinance", {"ticker": "HDFCBANK.NS"}, fake_data)

    from alphaagents.tools.finance import get_fundamentals
    result = get_fundamentals("HDFCBANK.NS")

    assert isinstance(result, dict)
    assert result["ticker"] == "HDFCBANK.NS"
    assert result["company_name"] == "HDFC Bank Limited"
    assert "pe_ratio" in result
    assert "roe" in result


def test_get_fundamentals_cache_hit():
    """Second call for same ticker uses cache."""
    from alphaagents.utils.cache import set as cache_set
    cache_set("yfinance", {"ticker": "TCS.NS"}, {"ticker": "TCS.NS", "company_name": "TCS"})

    with patch("alphaagents.tools.finance.yf.Ticker") as mock_ticker:
        from alphaagents.tools.finance import get_fundamentals
        get_fundamentals("TCS.NS")
        mock_ticker.assert_not_called()


# ── NewsAPI news tool tests ────────────────────────────────────────────────────

def test_get_news_returns_list():
    """get_news returns a list of article dicts."""
    from alphaagents.utils.cache import set as cache_set
    fake_articles = [
        {"title": "HDFC Q4 Results", "source": "Economic Times", "published_at": "2026-07-05T10:00:00Z", "description": "Strong results", "url": "https://et.com/1"},
        {"title": "HDFC Digital Push", "source": "Mint", "published_at": "2026-07-04T08:00:00Z", "description": "Digital banking", "url": "https://mint.com/1"},
    ]
    params = {"company": "HDFC Bank", "days": 7, "max_articles": 10}
    cache_set("newsapi", params, fake_articles)

    from alphaagents.tools.news import get_news
    results = get_news("HDFC Bank", days=7)

    assert isinstance(results, list)
    assert len(results) == 2
    for a in results:
        assert "title" in a
        assert "source" in a
        assert "published_at" in a
        assert "url" in a


def test_get_news_empty_on_no_results():
    """get_news returns empty list when no articles found."""
    from alphaagents.utils.cache import set as cache_set
    params = {"company": "NonExistentCompanyXYZ", "days": 7, "max_articles": 10}
    cache_set("newsapi", params, [])

    from alphaagents.tools.news import get_news
    results = get_news("NonExistentCompanyXYZ", days=7)
    assert results == []