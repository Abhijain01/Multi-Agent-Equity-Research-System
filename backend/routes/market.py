"""
backend/routes/market.py
Real-time market data endpoints
"""

import math
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from alphaagents.tools.market import get_live_market_data
from alphaagents.tools.finance import get_real_time_price

router = APIRouter(prefix="/api/market", tags=["Market Data"])


def _json_safe(value: Any) -> Any:
    """Replace non-finite numeric values that strict JSON rejects."""
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, tuple):
        return [_json_safe(item) for item in value]
    return value


@router.get("/live/{ticker}")
async def get_live_data(ticker: str):
    """Get real-time price + fundamentals"""
    try:
        return JSONResponse(
            content=_json_safe(jsonable_encoder(get_live_market_data(ticker.upper())))
        )
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "error": "Market data is temporarily unavailable.",
                "detail": str(e),
                "ticker": ticker.upper(),
            },
        )



@router.get("/price/{ticker}")
async def get_price_only(ticker: str):
    """Lightweight real-time price"""
    price_data = get_real_time_price(ticker.upper())
    if not price_data:
        raise HTTPException(status_code=404, detail="Price not found")
    return price_data


@router.get("/quote/{ticker}")
async def get_quote(ticker: str):
    """Alias for live data (for frontend compatibility)"""
    try:
        return JSONResponse(
            content=_json_safe(jsonable_encoder(get_live_market_data(ticker.upper())))
        )
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "error": "Market data is temporarily unavailable.",
                "detail": str(e),
                "ticker": ticker.upper(),
            },
        )