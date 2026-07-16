"""
alphaagents/tools/market.py
"""

from typing import Dict, Any
from alphaagents.tools.finance import get_real_time_price, get_fundamentals, get_historical_data


def get_live_market_data(ticker: str) -> Dict[str, Any]:
    realtime = get_real_time_price(ticker) or {}
    fundamentals = get_fundamentals(ticker)
    historical = get_historical_data(ticker, "5d")

    return {
        "realtime": realtime,
        "fundamentals": fundamentals,
        "historical": historical,
        "timestamp": realtime.get("timestamp")
    }