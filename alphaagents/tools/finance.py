"""
tools/finance.py

yfinance wrapper for pulling stock fundamentals, with local caching.

Why this file exists:
The Financial Data agent (Week 2) needs structured financial metrics
to include in the equity research note. We wrap yfinance here so:
  1. Every ticker lookup is cached — yfinance scrapes Yahoo Finance,
     which can be slow and occasionally flaky. Cache fixes both.
  2. The agent layer gets a clean, typed dict — not a raw yfinance object
  3. None values are handled defensively here, not scattered across agents

Usage:
    from alphaagents.tools.finance import get_fundamentals

    data = get_fundamentals("RELIANCE.NS")
    print(data["company_name"])
    print(data["pe_ratio"])

Indian stock tickers:
    NSE stocks: append .NS  (e.g. RELIANCE.NS, HDFCBANK.NS, TCS.NS)
    BSE stocks: append .BO  (e.g. RELIANCE.BO)
    Use .NS by default — better data coverage on Yahoo Finance
"""

import yfinance as yf
from alphaagents.utils import cache


def _safe_get(d: dict, key: str, default=None):
    """Get a value from a dict, returning default if key is missing or value is None."""
    val = d.get(key)
    return default if val is None else val


def _format_large_number(value) -> str:
    """Convert large numbers to human-readable format (1.2B, 450M, etc.)"""
    if value is None:
        return "N/A"
    try:
        value = float(value)
        if value >= 1_000_000_000_000:
            return f"₹{value / 1_000_000_000_000:.2f}T"
        elif value >= 1_000_000_000:
            return f"₹{value / 1_000_000_000:.2f}B"
        elif value >= 1_000_000:
            return f"₹{value / 1_000_000:.2f}M"
        else:
            return f"₹{value:,.0f}"
    except (TypeError, ValueError):
        return "N/A"


def _format_percent(value) -> str:
    """Convert a decimal ratio to a percentage string."""
    if value is None:
        return "N/A"
    try:
        return f"{float(value) * 100:.1f}%"
    except (TypeError, ValueError):
        return "N/A"


def _get_revenue_history(ticker_obj) -> list[dict]:
    """
    Pull last 3 years of annual revenue and net income from financials.
    Returns a list of dicts sorted by most recent year first.
    """
    try:
        financials = ticker_obj.financials  # DataFrame: rows=metrics, cols=dates
        if financials is None or financials.empty:
            return []

        history = []
        for col in financials.columns[:3]:  # last 3 years
            year = str(col.year)
            revenue = financials.loc["Total Revenue", col] if "Total Revenue" in financials.index else None
            net_income = financials.loc["Net Income", col] if "Net Income" in financials.index else None
            history.append({
                "year": year,
                "revenue": _format_large_number(revenue),
                "revenue_raw": float(revenue) if revenue is not None else None,
                "net_income": _format_large_number(net_income),
                "net_income_raw": float(net_income) if net_income is not None else None,
            })
        return history
    except Exception:
        return []


def get_fundamentals(ticker: str) -> dict:
    """
    Pull key financial fundamentals for a stock ticker, with caching.

    Args:
        ticker: Yahoo Finance ticker symbol (e.g. "RELIANCE.NS", "TCS.NS")

    Returns:
        A dict with structured financial data:
        {
            "ticker": str,
            "company_name": str,
            "sector": str,
            "industry": str,
            "currency": str,

            # Valuation
            "current_price": float | None,
            "market_cap": str,              # human-readable (e.g. "₹15.2T")
            "market_cap_raw": float | None,
            "pe_ratio": float | None,       # trailing PE
            "forward_pe": float | None,
            "price_to_book": float | None,
            "dividend_yield": str,          # as percentage string

            # Profitability
            "gross_margin": str,
            "operating_margin": str,
            "net_profit_margin": str,
            "roe": str,                     # return on equity
            "roce": str,                    # return on capital employed (approx)

            # Growth
            "revenue_growth_yoy": str,      # year-over-year
            "earnings_growth_yoy": str,

            # Balance sheet
            "debt_to_equity": float | None,
            "book_value_per_share": float | None,

            # Per share
            "eps_trailing": float | None,
            "eps_forward": float | None,

            # Revenue history (last 3 years)
            "revenue_history": list[dict],

            # Business summary
            "business_summary": str,

            # Data quality flag
            "data_warning": str | None,     # set if key fields are missing
        }
    """
    params = {"ticker": ticker}

    # 1. Check cache first
    cached = cache.get("yfinance", params)
    if cached is not None:
        return cached

    # 2. Cache miss — fetch from yfinance
    print(f"[FINANCE] Fetching data for {ticker} from Yahoo Finance...")
    yticker = yf.Ticker(ticker)

    try:
        info = yticker.info
    except Exception as e:
        error_result = {"ticker": ticker, "error": str(e), "data_warning": "Failed to fetch data"}
        cache.set("yfinance", params, error_result)
        return error_result

    # 3. Check if we got valid data (yfinance returns minimal dict for invalid tickers)
    if not info or _safe_get(info, "regularMarketPrice") is None and _safe_get(info, "currentPrice") is None:
        warning_result = {
            "ticker": ticker,
            "company_name": _safe_get(info, "longName", ticker),
            "data_warning": f"Limited data available for {ticker}. Check ticker symbol is correct (.NS for NSE).",
        }
        cache.set("yfinance", params, warning_result)
        return warning_result

    # 4. Pull and normalize all fields defensively
    current_price = _safe_get(info, "currentPrice") or _safe_get(info, "regularMarketPrice")
    market_cap_raw = _safe_get(info, "marketCap")
    revenue_growth = _safe_get(info, "revenueGrowth")
    earnings_growth = _safe_get(info, "earningsGrowth")
    gross_margin = _safe_get(info, "grossMargins")
    operating_margin = _safe_get(info, "operatingMargins")
    net_margin = _safe_get(info, "profitMargins")
    roe = _safe_get(info, "returnOnEquity")
    roa = _safe_get(info, "returnOnAssets")
    debt_to_equity = _safe_get(info, "debtToEquity")
    dividend_yield = _safe_get(info, "dividendYield")

    # Revenue history from financials DataFrame
    revenue_history = _get_revenue_history(yticker)

    # Missing data warning
    missing = []
    if current_price is None:
        missing.append("current price")
    if market_cap_raw is None:
        missing.append("market cap")
    if _safe_get(info, "trailingPE") is None:
        missing.append("PE ratio")
    data_warning = f"Missing fields: {', '.join(missing)}" if missing else None

    result = {
        "ticker": ticker,
        "company_name": _safe_get(info, "longName", ticker),
        "sector": _safe_get(info, "sector", "N/A"),
        "industry": _safe_get(info, "industry", "N/A"),
        "currency": _safe_get(info, "currency", "INR"),

        # Valuation
        "current_price": current_price,
        "market_cap": _format_large_number(market_cap_raw),
        "market_cap_raw": market_cap_raw,
        "pe_ratio": _safe_get(info, "trailingPE"),
        "forward_pe": _safe_get(info, "forwardPE"),
        "price_to_book": _safe_get(info, "priceToBook"),
        "dividend_yield": _format_percent(dividend_yield),

        # Profitability
        "gross_margin": _format_percent(gross_margin),
        "operating_margin": _format_percent(operating_margin),
        "net_profit_margin": _format_percent(net_margin),
        "roe": _format_percent(roe),
        "roa": _format_percent(roa),

        # Growth (YoY)
        "revenue_growth_yoy": _format_percent(revenue_growth),
        "earnings_growth_yoy": _format_percent(earnings_growth),

        # Balance sheet
        "debt_to_equity": debt_to_equity,
        "book_value_per_share": _safe_get(info, "bookValue"),

        # Per share
        "eps_trailing": _safe_get(info, "trailingEps"),
        "eps_forward": _safe_get(info, "forwardEps"),

        # Revenue history
        "revenue_history": revenue_history,

        # Business summary
        "business_summary": _safe_get(info, "longBusinessSummary", "No summary available."),

        # Data quality
        "data_warning": data_warning,
    }

    # 5. Save to cache
    cache.set("yfinance", params, result)

    return result


if __name__ == "__main__":
    # Quick manual test — run with: python -m alphaagents.tools.finance
    import json

    ticker = "RELIANCE.NS"
    print(f"Fetching fundamentals for {ticker}...\n")

    data = get_fundamentals(ticker)

    # Pretty print key fields
    print(f"Company     : {data.get('company_name')}")
    print(f"Sector      : {data.get('sector')}")
    print(f"Price       : ₹{data.get('current_price')}")
    print(f"Market Cap  : {data.get('market_cap')}")
    print(f"PE Ratio    : {data.get('pe_ratio')}")
    print(f"Forward PE  : {data.get('forward_pe')}")
    print(f"P/B Ratio   : {data.get('price_to_book')}")
    print(f"EPS         : ₹{data.get('eps_trailing')}")
    print(f"ROE         : {data.get('roe')}")
    print(f"Net Margin  : {data.get('net_profit_margin')}")
    print(f"Debt/Equity : {data.get('debt_to_equity')}")
    print(f"Rev Growth  : {data.get('revenue_growth_yoy')}")
    print(f"Div Yield   : {data.get('dividend_yield')}")

    if data.get("revenue_history"):
        print(f"\nRevenue History:")
        for year_data in data["revenue_history"]:
            print(f"  {year_data['year']}: Revenue {year_data['revenue']}, Net Income {year_data['net_income']}")

    if data.get("data_warning"):
        print(f"\n⚠️  Warning: {data['data_warning']}")

    print("\n✅ Run again to verify CACHE HIT")