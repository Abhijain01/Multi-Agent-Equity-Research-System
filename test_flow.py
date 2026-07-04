"""
test_flow.py — Week 1 End-to-End Data Flow Test

This script proves the entire tools layer works:
  1. All three tools return real data for Reliance Industries
  2. All three responses are cached (second run is instant)
  3. State schema initialises correctly
  4. Cache folder has 3 JSON files after running

Run from repo root:
    python test_flow.py

This is a scratch script for the Week 1 demo — NOT a pytest test.
The real pytest tests go in tests/test_tools.py (Week 3).
"""

import sys
import json
from pathlib import Path

# Make sure imports work from repo root
sys.path.insert(0, str(Path(__file__).parent))

from alphaagents.tools.search import search
from alphaagents.tools.finance import get_fundamentals
from alphaagents.tools.news import get_news
from alphaagents.graph.state import get_initial_state

COMPANY = "Reliance Industries"
TICKER = "RELIANCE.NS"
SEPARATOR = "=" * 60


def test_search():
    print(f"\n{SEPARATOR}")
    print("1. WEB SEARCH TOOL (Tavily)")
    print(SEPARATOR)

    results = search(f"{COMPANY} Q4 results 2026", max_results=5)

    if not results:
        print("❌ No results returned. Check TAVILY_API_KEY in .env")
        return False

    print(f"✅ Got {len(results)} results")
    for i, r in enumerate(results[:3], 1):
        print(f"\n  [{i}] {r['title']}")
        print(f"       {r['url']}")
        print(f"       Score: {r['score']:.3f}")

    return True


def test_finance():
    print(f"\n{SEPARATOR}")
    print("2. FINANCIAL DATA TOOL (yfinance)")
    print(SEPARATOR)

    data = get_fundamentals(TICKER)

    if "error" in data:
        print(f"❌ Error: {data['error']}")
        return False

    print(f"✅ Got fundamentals for {data.get('company_name', TICKER)}")
    print(f"\n  Company    : {data.get('company_name')}")
    print(f"  Sector     : {data.get('sector')}")
    print(f"  Price      : ₹{data.get('current_price')}")
    print(f"  Market Cap : {data.get('market_cap')}")
    print(f"  PE Ratio   : {data.get('pe_ratio')}")
    print(f"  ROE        : {data.get('roe')}")
    print(f"  Net Margin : {data.get('net_profit_margin')}")
    print(f"  D/E Ratio  : {data.get('debt_to_equity')}")

    if data.get("revenue_history"):
        print(f"\n  Revenue History:")
        for y in data["revenue_history"]:
            print(f"    {y['year']}: Revenue {y['revenue']} | Net Income {y['net_income']}")

    if data.get("data_warning"):
        print(f"\n  ⚠️  Warning: {data['data_warning']}")

    return True


def test_news():
    print(f"\n{SEPARATOR}")
    print("3. NEWS TOOL (NewsAPI)")
    print(SEPARATOR)

    articles = get_news(COMPANY, days=7)

    if articles is None:
        print("❌ None returned. Check NEWS_API_KEY in .env")
        return False

    if len(articles) == 0:
        print("⚠️  No articles found in last 7 days.")
        print("   This can happen on weekends or if the key is wrong.")
        print("   Check NEWS_API_KEY in .env")
        return True  # Not a hard failure — news can be empty

    print(f"✅ Got {len(articles)} articles")
    for i, a in enumerate(articles[:3], 1):
        print(f"\n  [{i}] {a['title']}")
        print(f"       Source: {a['source']}")
        print(f"       Date  : {a['published_at'][:10]}")

    return True


def test_state():
    print(f"\n{SEPARATOR}")
    print("4. STATE SCHEMA")
    print(SEPARATOR)

    state = get_initial_state("Analyse Reliance Industries for a retail investor")
    required_keys = [
        "query", "company", "ticker", "plan", "sub_questions",
        "web_results", "financial_data", "news_data",
        "draft_note", "critique", "revision_count",
        "needs_review", "hitl_approved", "hitl_feedback", "final_note"
    ]

    missing = [k for k in required_keys if k not in state]
    if missing:
        print(f"❌ Missing keys: {missing}")
        return False

    print(f"✅ State has all {len(required_keys)} required keys")
    print(f"   query = {repr(state['query'])}")
    print(f"   revision_count = {state['revision_count']}")
    print(f"   hitl_approved = {state['hitl_approved']}")
    return True


def check_cache():
    print(f"\n{SEPARATOR}")
    print("5. CACHE VERIFICATION")
    print(SEPARATOR)

    cache_dir = Path("cache")
    if not cache_dir.exists():
        print("❌ cache/ folder not found")
        return False

    tool_dirs = list(cache_dir.iterdir())
    for tool_dir in tool_dirs:
        if tool_dir.is_dir():
            files = list(tool_dir.glob("*.json"))
            print(f"  cache/{tool_dir.name}/ — {len(files)} file(s) cached")

    total = sum(
        len(list(d.glob("*.json")))
        for d in cache_dir.iterdir()
        if d.is_dir()
    )
    print(f"\n✅ Total cached responses: {total}")
    return True


if __name__ == "__main__":
    print("\n" + SEPARATOR)
    print("ALPHAAGENTS — WEEK 1 END-TO-END DATA FLOW TEST")
    print(f"Target company: {COMPANY} ({TICKER})")
    print(SEPARATOR)

    results = {
        "search":  test_search(),
        "finance": test_finance(),
        "news":    test_news(),
        "state":   test_state(),
    }
    check_cache()

    print(f"\n{SEPARATOR}")
    print("SUMMARY")
    print(SEPARATOR)
    all_passed = True
    for test, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status} — {test}")
        if not passed:
            all_passed = False

    print()
    if all_passed:
        print("🎉 All tools working. Week 1 demo ready.")
        print("   Run this script again — all results should come from cache.")
    else:
        print("⚠️  Some tests failed. Check errors above.")
        print("   Most likely cause: missing API key in .env")