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
import time
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


# Dividend yields above this are almost always a yfinance unit bug
# (e.g. returning 0.46 meaning 46% when the real figure is ~0.46%).
# See MEMORY.md "Known Pipeline Issues" — yfinance sometimes returns
# dividend_yield already as a whole percent instead of a decimal ratio.
MAX_SANE_DIVIDEND_YIELD_PCT = 15.0


def _format_dividend_yield(value) -> str:
    """
    Format dividend yield defensively.
    yfinance is inconsistent about whether `dividendYield` is a decimal
    ratio (0.012 = 1.2%) or already a percent (1.2 = 1.2%) depending on
    the ticker/exchange. We try the standard decimal interpretation first;
    if that produces an implausible value (>15%), we assume the field was
    already a percent and clamp/re-interpret instead of showing e.g. 46%.
    """
    if value is None:
        return "N/A"
    try:
        value = float(value)
    except (TypeError, ValueError):
        return "N/A"

    as_percent_from_ratio = value * 100
    if as_percent_from_ratio <= MAX_SANE_DIVIDEND_YIELD_PCT:
        return f"{as_percent_from_ratio:.1f}%"

    # Ratio interpretation gave something absurd — value was probably
    # already a percent. Clamp so we never show a fictitious 40%+ yield.
    if value <= MAX_SANE_DIVIDEND_YIELD_PCT:
        return f"{value:.1f}%"

    return f"{MAX_SANE_DIVIDEND_YIELD_PCT:.1f}%+ (data unreliable)"


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


def _get_ytd_return_percent(yticker, current_price) -> float | None:
    """
    Year-to-date return, computed from actual daily closes rather than
    yfinance's `info` dict (which doesn't reliably expose YTD across tickers).
    Returns None if we can't establish a start-of-year price.
    """
    if current_price is None:
        return None
    try:
        hist = yticker.history(period="ytd")
        if hist is None or hist.empty:
            return None
        start_price = float(hist["Close"].iloc[0])
        if not start_price:
            return None
        return round((float(current_price) - start_price) / start_price * 100, 2)
    except Exception:
        return None


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

    # 2. Cache miss — fetch from yfinance, with a short retry for transient
    #    network blips (common when calling Yahoo Finance from cloud/datacenter
    #    IPs like Render's — occasional blocks/timeouts that a retry clears).
    print(f"[FINANCE] Fetching data for {ticker} from Yahoo Finance...")
    yticker = yf.Ticker(ticker)

    info = None
    last_error = None
    for attempt in range(1, 3):  # 2 attempts total
        try:
            info = yticker.info
            last_error = None
            break
        except Exception as e:
            last_error = e
            print(f"[FINANCE] ⚠️ get_fundamentals attempt {attempt}/2 failed for {ticker}: {e}")
            if attempt < 2:
                time.sleep(1.5)

    if last_error is not None:
        # IMPORTANT: do NOT cache this — a transient failure (network blip,
        # temporary Yahoo rate-limit) would otherwise be cached forever
        # (cache.py has no TTL), permanently poisoning this ticker until
        # someone manually clears the cache file. Every future request
        # should get a fresh attempt instead of replaying today's failure.
        print(f"[FINANCE] ❌ get_fundamentals gave up on {ticker} after 2 attempts: {last_error}")
        return {"ticker": ticker, "error": str(last_error), "data_warning": "Failed to fetch data — retrying on next request"}

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

    # PEG ratio — yfinance has used different field names across versions
    peg_ratio = _safe_get(info, "trailingPegRatio") or _safe_get(info, "pegRatio")

    # YTD return — yfinance's `info` dict doesn't reliably expose this, so we
    # compute it from actual daily history rather than guess/omit it.
    ytd_return_pct = _get_ytd_return_percent(yticker, current_price)

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
        "dividend_yield": _format_dividend_yield(dividend_yield),
        "peg_ratio": peg_ratio,
        "ev_to_ebitda": _safe_get(info, "enterpriseToEbitda"),
        "ev_to_revenue": _safe_get(info, "enterpriseToRevenue"),
        "beta": _safe_get(info, "beta"),
        "current_ratio": _safe_get(info, "currentRatio"),
        "analyst_target_price": _safe_get(info, "targetMeanPrice"),
        "analyst_count": _safe_get(info, "numberOfAnalystOpinions"),
        "one_year_return_pct": (
            round(_safe_get(info, "52WeekChange") * 100, 2)
            if _safe_get(info, "52WeekChange") is not None
            else None
        ),
        "ytd_return_pct": ytd_return_pct,
        "exchange": _safe_get(info, "exchange", "N/A"),
        "short_name": _safe_get(info, "shortName", _safe_get(info, "longName", ticker)),
        "website": _safe_get(info, "website"),

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


# ── Live market data (Dashboard / Live Markets page) ──────────────────────────
#
# These two functions back backend/routes/market.py. They intentionally use a
# SHORT cache TTL (see cache.get_with_ttl below) instead of the permanent cache
# used by get_fundamentals — a stock's price should not be frozen for the life
# of the dev cache.

_PRICE_CACHE: dict[str, tuple[float, dict]] = {}
_PRICE_CACHE_TTL_SECONDS = 30

_HISTORY_CACHE: dict[str, tuple[float, dict]] = {}
_HISTORY_CACHE_TTL_SECONDS = 300  # 5 minutes — history doesn't need to be as fresh


def get_real_time_price(ticker: str) -> dict | None:
    """
    Lightweight real-time-ish quote for a ticker. Backed by yfinance's
    fast_info, which is much cheaper than the full `.info` scrape used by
    get_fundamentals() and is safe to call on every dashboard refresh.

    Returns:
        {
            "ticker": str,
            "price": float,
            "previous_close": float,
            "change": float,
            "change_percent": str,   # e.g. "+1.42%"
            "day_high": float | None,
            "day_low": float | None,
            "volume": int | None,
            "source": "yfinance",
            "timestamp": str (ISO),
        }
        or None if the ticker can't be resolved.
    """
    now = time.time()
    cached = _PRICE_CACHE.get(ticker)
    if cached and (now - cached[0]) < _PRICE_CACHE_TTL_SECONDS:
        return cached[1]

    def _fast_attr(fast_info, *names):
        """fast_info's attribute names have changed across yfinance versions
        (snake_case vs camelCase). Try each candidate name defensively."""
        for name in names:
            try:
                val = getattr(fast_info, name, None)
                if val is None and hasattr(fast_info, "__getitem__"):
                    val = fast_info[name]
            except Exception:
                val = None
            if val is not None:
                return val
        return None

    try:
        yticker = yf.Ticker(ticker)
        fast = yticker.fast_info

        price = _fast_attr(fast, "last_price", "lastPrice")
        prev_close = _fast_attr(fast, "previous_close", "previousClose")

        if price is None:
            return None

        change = (price - prev_close) if (prev_close is not None) else None
        change_percent = (
            f"{'+' if change >= 0 else ''}{(change / prev_close * 100):.2f}%"
            if (change is not None and prev_close)
            else "N/A"
        )

        result = {
            "ticker": ticker,
            "price": round(float(price), 2),
            "previous_close": round(float(prev_close), 2) if prev_close is not None else None,
            "change": round(float(change), 2) if change is not None else None,
            "change_percent": change_percent,
            "day_high": _fast_attr(fast, "day_high", "dayHigh"),
            "day_low": _fast_attr(fast, "day_low", "dayLow"),
            "volume": _fast_attr(fast, "last_volume", "lastVolume"),
            "source": "yfinance",
            "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
        }
    except Exception as e:
        print(f"[FINANCE] get_real_time_price failed for {ticker}: {e}")
        return None

    _PRICE_CACHE[ticker] = (now, result)
    return result


def get_historical_data(ticker: str, period: str = "5d") -> dict:
    """
    Recent OHLCV history for sparkline/chart rendering.

    Args:
        ticker: e.g. "RELIANCE.NS"
        period: yfinance period string — "1d", "5d", "1mo", "3mo", "1y", etc.

    Returns:
        {"dates": [...], "close": [...], "volume": [...]} — empty lists on failure.
    """
    cache_key = f"{ticker}:{period}"
    now = time.time()
    cached = _HISTORY_CACHE.get(cache_key)
    if cached and (now - cached[0]) < _HISTORY_CACHE_TTL_SECONDS:
        return cached[1]

    try:
        yticker = yf.Ticker(ticker)
        hist = yticker.history(period=period)
        if hist is None or hist.empty:
            result = {"dates": [], "close": [], "volume": []}
        else:
            result = {
                "dates": [d.strftime("%Y-%m-%d %H:%M") for d in hist.index],
                "close": [round(float(v), 2) for v in hist["Close"].tolist()],
                "volume": [int(v) for v in hist["Volume"].tolist()],
            }
    except Exception as e:
        print(f"[FINANCE] get_historical_data failed for {ticker}: {e}")
        result = {"dates": [], "close": [], "volume": []}

    _HISTORY_CACHE[cache_key] = (now, result)
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